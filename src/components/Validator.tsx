import { useState } from "react";
import { apiValidate, type ValidateResponse } from "../lib/api";

export default function Validator() {
  const [number, setNumber] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [result, setResult] = useState<ValidateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleValidate() {
    setLoading(true);
    try {
      const res = await apiValidate(number, month, year, cvv);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handlePaste() {
    navigator.clipboard.readText().then((text) => {
      const parts = text.trim().split("|");
      if (parts.length >= 4) {
        setNumber(parts[0]);
        setMonth(parts[1]);
        setYear(parts[2]);
        setCvv(parts[3]);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs sm:text-sm text-gray-400">
                Nomor Kartu
              </label>
              <button
                onClick={handlePaste}
                className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300"
              >
                Paste (num|mm|yyyy|cvv)
              </button>
            </div>
            <input
              type="text"
              placeholder="4111 1111 1111 1111"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1.5">
                Bulan
              </label>
              <input
                type="text"
                placeholder="05"
                maxLength={2}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1.5">
                Tahun
              </label>
              <input
                type="text"
                placeholder="2030"
                maxLength={4}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1.5">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleValidate}
            disabled={loading || !number}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm min-h-[42px]"
          >
            {loading ? "Validating..." : "Validate"}
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`rounded-xl p-4 sm:p-6 border ${result.isValid ? "bg-green-950/30 border-green-800" : "bg-red-950/30 border-red-800"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-sm sm:text-lg font-bold ${result.isValid ? "text-green-400" : "text-red-400"}`}
            >
              {result.isValid ? "✓ VALID" : "✗ INVALID"}
            </span>
            {result.cardType && (
              <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">
                {result.cardType.title}
              </span>
            )}
          </div>
          {result.errors.length > 0 && (
            <ul className="space-y-1 mt-2">
              {result.errors.map((err, i) => (
                <li key={i} className="text-xs sm:text-sm text-red-300">
                  • {err}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
