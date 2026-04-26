const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// ── Token cache ───────────────────────────────────────────────────────────────
// PayPal tokens are valid for `expires_in` seconds (typically 3 600 s in
// production, 32 400 s in sandbox). Fetching a new one on every API call is
// wasteful and doubles latency on every payment operation.
//
// _tokenCache   — the live token and the monotonic timestamp at which it expires
// _inflight     — the in-progress fetch Promise, shared by concurrent callers so
//                 that multiple simultaneous requests during a cold-start or
//                 near-expiry window all await the same single HTTP call instead
//                 of each firing their own.

type TokenCache = { token: string; expiresAt: number };

let _tokenCache: TokenCache | null = null;
let _inflight:   Promise<string>   | null = null;

// 60-second safety buffer: treat the token as expired one minute before PayPal
// would, so we never hand an about-to-expire token to a caller that takes a
// moment to use it.
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

async function fetchFreshToken(): Promise<string> {
  const id     = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!id || !secret) {
    throw new Error("PayPal credentials not configured (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET missing from environment)");
  }

  const creds = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:  `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body:  "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const expiresIn: number = typeof data.expires_in === "number" ? data.expires_in : 3_600;

  _tokenCache = {
    token:     data.access_token as string,
    expiresAt: Date.now() + expiresIn * 1_000 - TOKEN_EXPIRY_BUFFER_MS,
  };

  return _tokenCache.token;
}

async function getAccessToken(): Promise<string> {
  // Cache hit — token is still valid.
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }

  // Another concurrent request is already fetching — join it instead of
  // firing a second token request in parallel.
  if (_inflight) {
    return _inflight;
  }

  // Cache miss — start a fresh fetch and expose the Promise so concurrent
  // callers can join it. Clear _inflight when the fetch settles (either way).
  _inflight = fetchFreshToken().finally(() => {
    _inflight = null;
  });

  return _inflight;
}

export async function createPayPalOrder(
  amount:      number,
  currency:    string,
  description: string,
): Promise<{ id: string; status: string }> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: currency, value: amount.toFixed(2) },
          description,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create-order failed: ${err}`);
  }
  return res.json();
}

export async function capturePayPalOrder(orderId: string): Promise<{
  id:             string;
  status:         string;
  purchase_units: Array<{
    payments: {
      captures: Array<{ id: string; status: string }>;
    };
  }>;
}> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed: ${err}`);
  }
  return res.json();
}

// Refunds a completed capture. Call this when payment was captured but the
// downstream booking creation failed — money must be returned to the customer.
// Throws if the refund API call itself fails; callers must log and alert.
export async function refundPayPalCapture(captureId: string): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal refund failed for capture ${captureId} (${res.status}): ${err}`);
  }
}
