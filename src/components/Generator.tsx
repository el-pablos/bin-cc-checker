import { useState } from "react";
import {
  apiGenerate,
  apiBinCheck,
  type GeneratedCardResponse,
  type BinCheckResponse,
} from "../lib/api";

const CARD_TYPES = [
  { type: "VI", title: "Visa" },
  { type: "MC", title: "MasterCard" },
  { type: "AE", title: "Amex" },
  { type: "DI", title: "Discover" },
  { type: "JCB", title: "JCB" },
  { type: "DN", title: "Diners" },
  { type: "UN", title: "UnionPay" },
  { type: "MI", title: "Maestro" },
];

export default function Generator() {
  const [selectedType, setSelectedType] = useState("random");
  const [quantity, setQuantity] = useState(5);
  const [cards, setCards] = useState<GeneratedCardResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [binResult, setBinResult] = useState<BinCheckResponse | null>(null);
  const [binLoading, setBinLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setBinResult(null);
    try {
      const type = selectedType === "random" ? undefined : selectedType;
      const result = await apiGenerate(type, quantity);
      setCards(result);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  function formatForCopy(card: GeneratedCardResponse) {
    return `${card.number}|${card.expMonth}|${card.expYear}|${card.cvv}`;
  }

  function copyOne(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  }

  function copyAll() {
    const all = cards.map(formatForCopy).join("\n");
    navigator.clipboard.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }

  async function checkBin(card: GeneratedCardResponse) {
    setBinLoading(true);
    setBinResult(null);
    try {
      const result = await apiBinCheck(formatForCopy(card));
      setBinResult(result);
    } catch {
      setBinResult(null);
    } finally {
      setBinLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5">
              Tipe Kartu
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="random">Random (Semua)</option>
              {CARD_TYPES.map((c) => (
                <option key={c.type} value={c.type}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5">
              Jumlah
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.min(50, Math.max(1, parseInt(e.target.value) || 1)),
                )
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm min-h-[42px]"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>

      {cards.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-800 flex justify-between items-center">
            <span className="text-xs sm:text-sm text-gray-400">
              {cards.length} kartu di-generate
            </span>
            <button
              onClick={copyAll}
              className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors"
            >
              {copiedAll ? "Copied!" : "Copy All"}
            </button>
          </div>
          <div className="divide-y divide-gray-800 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
            {cards.map((card, i) => (
              <div
                key={i}
                className="p-3 sm:p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] sm:text-xs bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded font-mono shrink-0">
                        {card.type}
                      </span>
                      <code className="text-xs sm:text-sm font-mono text-green-400 truncate">
                        {card.formatted}
                      </code>
                    </div>
                    <div className="mt-1 text-[10px] sm:text-xs text-gray-500 font-mono">
                      EXP: {card.expMonth}/{card.expYear} | {card.codeName}:{" "}
                      {card.cvv}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => copyOne(formatForCopy(card), i)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 px-2.5 py-1.5 rounded transition-colors min-h-[32px]"
                    >
                      {copied === i ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => checkBin(card)}
                      disabled={binLoading}
                      className="text-xs bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 px-2.5 py-1.5 rounded transition-colors min-h-[32px]"
                    >
                      BIN
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {binResult && binResult.success && (
        <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm sm:text-base font-semibold">BIN Result</h3>
            <span
              className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${binResult.result.code === 1 ? "bg-green-800 text-green-200" : "bg-yellow-800 text-yellow-200"}`}
            >
              {binResult.result.status}
            </span>
          </div>
          {binResult.result.message && (
            <p className="text-xs sm:text-sm text-gray-400 mb-3">
              {binResult.result.message}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoCell label="Brand" value={binResult.result.card?.brand} />
            <InfoCell label="Type" value={binResult.result.card?.type} />
            <InfoCell
              label="Category"
              value={binResult.result.card?.category}
            />
            <InfoCell label="Bank" value={binResult.result.card?.bank} />
            <InfoCell
              label="Country"
              value={`${binResult.result.card?.country?.emoji || ""} ${binResult.result.card?.country?.name || "-"}`}
            />
            <InfoCell
              label="Currency"
              value={binResult.result.card?.country?.currency}
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
