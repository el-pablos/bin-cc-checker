import { useState } from "react";
import { apiBinCheck, type BinCheckResponse } from "../lib/api";

export default function BinChecker() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<BinCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheck() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await apiBinCheck(input.trim());
      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || "BIN check gagal");
      }
    } catch {
      setError("Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
        <label className="block text-xs sm:text-sm text-gray-400 mb-1.5">
          Card Data (format: number|mm|yyyy|cvv)
        </label>
        <input
          type="text"
          placeholder="4111111111111111|05|2030|123"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleCheck}
          disabled={loading || !input.trim()}
          className="mt-3 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm min-h-[42px]"
        >
          {loading ? "Checking..." : "Check BIN"}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded-xl p-4">
          <p className="text-xs sm:text-sm text-red-300">{error}</p>
        </div>
      )}

      {result && result.success && (
        <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm sm:text-base font-semibold">BIN Result</h3>
            <span
              className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${result.result.code === 1 ? "bg-green-800 text-green-200" : result.result.code === 3 ? "bg-yellow-800 text-yellow-200" : "bg-red-800 text-red-200"}`}
            >
              {result.result.status}
            </span>
          </div>
          {result.result.message && (
            <p className="text-xs sm:text-sm text-gray-400 mb-3">
              {result.result.message}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoCell label="Brand" value={result.result.card?.brand} />
            <InfoCell label="Type" value={result.result.card?.type} />
            <InfoCell label="Category" value={result.result.card?.category} />
            <InfoCell label="Bank" value={result.result.card?.bank} />
            <InfoCell
              label="Country"
              value={`${result.result.card?.country?.emoji || ""} ${result.result.card?.country?.name || "-"}`}
            />
            <InfoCell
              label="Currency"
              value={result.result.card?.country?.currency}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-[10px] sm:text-xs text-gray-500 uppercase">
        {label}
      </span>
      <p className="text-xs sm:text-sm font-mono text-white mt-0.5">
        {value || "-"}
      </p>
    </div>
  );
}
