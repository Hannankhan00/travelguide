import { prisma }     from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

export const metadata = { title: "Webhook Logs — GoTripJapan Admin" };

const STATUS_STYLES: Record<string, string> = {
  SUCCESS:          "bg-emerald-100 text-emerald-700",
  IGNORED:          "bg-gray-100 text-gray-500",
  FAILED:           "bg-red-100 text-red-700",
  SIGNATURE_FAILED: "bg-orange-100 text-orange-700",
  SIGNATURE_ERROR:  "bg-orange-100 text-orange-700",
};

export default async function WebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp     = await searchParams;
  const page   = Math.max(1, Number(sp.page ?? 1));
  const status = sp.status ?? "ALL";
  const take   = 50;
  const skip   = (page - 1) * take;

  const where = status !== "ALL" ? { status } : {};

  const [logs, total] = await Promise.all([
    prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.webhookLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / take);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Webhook Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total events</p>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {["ALL", "SUCCESS", "IGNORED", "FAILED", "SIGNATURE_FAILED"].map((s) => (
            <a
              key={s}
              href={`/admin/webhooks?status=${s}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === s
                  ? "bg-[#1B2847] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Event</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Booking</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Error</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No webhook events yet
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{log.eventType}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[log.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {log.bookingId ? (
                    <a href={`/admin/bookings?q=${log.bookingId}`} className="text-[#C41230] hover:underline font-mono">
                      {log.bookingId.slice(0, 10)}…
                    </a>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-red-600 max-w-xs truncate">
                  {log.error ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/admin/webhooks?status=${status}&page=${page - 1}`} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                Previous
              </a>
            )}
            {page < totalPages && (
              <a href={`/admin/webhooks?status=${status}&page=${page + 1}`} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
