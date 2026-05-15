import { useState, useRef } from "react";

interface BulkResult {
  card: string;
  isValid: boolean;
  cardType: string | null;
  errors: string[];
}

export default function BulkValidator() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<BulkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    valid: number;
    invalid: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleBulkValidate() {
    const lines = input
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    if (lines.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/validate/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: lines }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setStats({
          total: data.total,
          valid: data.valid,
          invalid: data.invalid,
        });
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/validate/file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setStats({
          total: data.total,
          valid: data.valid,
          invalid: data.invalid,
        });
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function copyValidCards() {
    const valid = results
      .filter((r) => r.isValid)
      .map((r) => r.card)
      .join("\n");
    navigator.clipboard.writeText(valid);
  }

  function copyInvalidCards() {
    const invalid = results
      .filter((r) => !r.isValid)
      .map((r) => r.card)
      .join("\n");
    navigator.clipboard.writeText(invalid);
  }

  function downloadResults() {
    const lines = results.map((r) => {
      const status = r.isValid ? "VALID" : "INVALID";
      const type = r.cardType || "-";
      const errs = r.errors.length > 0 ? ` [${r.errors.join("; ")}]` : "";
      return `${r.card} | ${status} | ${type}${errs}`;
    });
    const content = `Total: ${stats?.total} | Valid: ${stats?.valid} | Invalid: ${stats?.invalid}\n${"=".repeat(60)}\n${lines.join("\n")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk_validate_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
        <div className="space-y-3">
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5">
              Paste kartu (1 per baris, format: number|mm|yyyy|cvv)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                "4111111111111111|05|2030|123\n5111111111111118|12|2028|456\n378282246310005|01|2029|1234"
              }
              rows={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-blue-500 resize-y min-h-[120px]"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleBulkValidate}
              disabled={loading || !input.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm min-h-[42px]"
            >
              {loading ? "Validating..." : "Validate All"}
            </button>
            <label className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm min-h-[42px] flex items-center justify-center cursor-pointer">
              Upload .txt
              <input
                ref={fileRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-800 text-center">
            <p className="text-lg sm:text-2xl font-bold text-white">
              {stats.total}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">
              Total
            </p>
          </div>
          <div className="bg-green-950/30 rounded-xl p-3 sm:p-4 border border-green-800 text-center">
            <p className="text-lg sm:text-2xl font-bold text-green-400">
              {stats.valid}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">
              Valid
            </p>
          </div>
          <div className="bg-red-950/30 rounded-xl p-3 sm:p-4 border border-red-800 text-center">
            <p className="text-lg sm:text-2xl font-bold text-red-400">
              {stats.invalid}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">
              Invalid
            </p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-800 flex flex-wrap gap-2 justify-between items-center">
            <span className="text-xs sm:text-sm text-gray-400">
              {results.length} hasil
            </span>
            <div className="flex gap-2">
              <button
                onClick={copyValidCards}
                className="text-xs bg-green-900/50 hover:bg-green-800/50 text-green-300 px-2.5 py-1.5 rounded-md transition-colors"
              >
                Copy Valid
              </button>
              <button
                onClick={copyInvalidCards}
                className="text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 px-2.5 py-1.5 rounded-md transition-colors"
              >
                Copy Invalid
              </button>
              <button
                onClick={downloadResults}
                className="text-xs bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-md transition-colors"
              >
                Download
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-800 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
            {results.map((r, i) => (
              <div
                key={i}
                className={`p-2.5 sm:p-3 ${r.isValid ? "hover:bg-green-950/20" : "hover:bg-red-950/20"} transition-colors`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`text-xs sm:text-sm shrink-0 mt-0.5 ${r.isValid ? "text-green-400" : "text-red-400"}`}
                  >
                    {r.isValid ? "✓" : "✗"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <code className="text-[10px] sm:text-xs font-mono text-gray-300 break-all">
                      {r.card}
                    </code>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.cardType && (
                        <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded">
                          {r.cardType}
                        </span>
                      )}
                      {r.errors.length > 0 && (
                        <span className="text-[10px] text-red-400 truncate">
                          {r.errors[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
