import PusherClient from "pusher-js";

let clientInstance: PusherClient | null = null;
let initFailed = false;

export function getPusherClient(): PusherClient | null {
  if (clientInstance) return clientInstance;
  if (initFailed) return null;

  const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn("Pusher client env vars not set (NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER). Real-time updates disabled.");
    initFailed = true;
    return null;
  }

  try {
    clientInstance = new PusherClient(key, { cluster });
    return clientInstance;
  } catch (err) {
    console.error("Pusher client failed to initialise:", err);
    initFailed = true;
    return null;
  }
}
