import { useState, useEffect } from "react";
import { apiHistory, apiClearHistory, type HistoryRecord } from "../lib/api";

export default function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadHistory();
  }, [filter, page]);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await apiHistory(limit, page * limit, filter || undefined);
      setRecords(res.records);
      setTotal(res.pagination.total);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!confirm("Hapus semua history?")) return;
    await apiClearHistory();
    loadHistory();
  }

  function getIcon(type: string) {
    switch (type) {
      case "generate":
        return "🎲";
      case "validate":
        return "✓";
      case "bin_check":
        return "🔍";
      default:
        return "•";
    }
  }

  function getStatusColor(record: HistoryRecord) {
    if (record.is_valid === 1) return "text-green-400";
    if (record.is_valid === 0) return "text-red-400";
    return "text-gray-400";
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {["", "generate", "validate", "bin_check"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(0);
                }}
                className={`text-xs px-2.5 py-1.5 rounded-md transition-colors min-h-[32px] ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {f === ""
                  ? "Semua"
                  : f === "generate"
                    ? "Generate"
                    : f === "validate"
                      ? "Validate"
                      : "BIN"}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500">{total} records</span>
            <button
              onClick={handleClear}
              className="text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 px-2.5 py-1.5 rounded-md transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
          <p className="text-sm text-gray-400">Belum ada history</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
            {records.map((record) => (
              <div
                key={record.id}
                className="p-3 sm:p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-sm sm:text-base shrink-0 mt-0.5">
                    {getIcon(record.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs sm:text-sm font-medium ${getStatusColor(record)}`}
                      >
                        {record.type === "generate"
                          ? "Generate"
                          : record.type === "validate"
                            ? "Validate"
                            : "BIN Check"}
                      </span>
                      <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded">
                        {record.source}
                      </span>
                      {record.card_type && (
                        <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded">
                          {record.card_type}
                        </span>
                      )}
                    </div>
                    {record.card_number && (
                      <p className="text-[10px] sm:text-xs font-mono text-gray-500 mt-1 truncate">
                        {record.card_number.length > 30
                          ? record.card_number.substring(0, 30) + "..."
                          : record.card_number}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(record.created_at).toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {total > limit && (
            <div className="p-3 border-t border-gray-800 flex justify-between items-center">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-3 py-1.5 rounded-md"
              >
                Prev
              </button>
              <span className="text-xs text-gray-500">
                {page * limit + 1}-{Math.min((page + 1) * limit, total)} /{" "}
                {total}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * limit >= total}
                className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-3 py-1.5 rounded-md"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
