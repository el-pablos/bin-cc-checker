import { useState } from "react";
import { cardTypes, type CardType } from "./card-types";
import {
  generateFullCard,
  validateCard,
  type GeneratedCard,
} from "./generator";
import { checkBin, type BinCheckResult } from "./bin-api";

function App() {
  const [selectedType, setSelectedType] = useState<string>("random");
  const [quantity, setQuantity] = useState(5);
  const [generated, setGenerated] = useState<GeneratedCard[]>([]);
  const [validateInput, setValidateInput] = useState({
    number: "",
    month: "",
    year: "",
    cvv: "",
  });
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    cardType: CardType | null;
    errors: string[];
  } | null>(null);
  const [binResult, setBinResult] = useState<BinCheckResult | null>(null);
  const [binLoading, setBinLoading] = useState(false);
  const [binError, setBinError] = useState("");
  const [activeTab, setActiveTab] = useState<"generate" | "validate" | "bin">(
    "generate",
  );
  const [copied, setCopied] = useState<number | null>(null);

  function handleGenerate() {
    const type =
      selectedType === "random"
        ? undefined
        : cardTypes.find((c) => c.type === selectedType);
    const cards: GeneratedCard[] = [];
    for (let i = 0; i < quantity; i++) {
      cards.push(generateFullCard(type));
    }
    setGenerated(cards);
  }

  function handleValidate() {
    const result = validateCard(
      validateInput.number,
      validateInput.month,
      validateInput.year,
      validateInput.cvv,
    );
    setValidationResult(result);
  }

  async function handleBinCheck(cardData?: string) {
    const data =
      cardData ||
      `${validateInput.number}|${validateInput.month}|${validateInput.year}|${validateInput.cvv}`;
    setActiveTab("bin");
    setBinLoading(true);
    setBinError("");
    setBinResult(null);
    try {
      const result = await checkBin(data);
      setBinResult(result);
    } catch (err) {
      setBinError(err instanceof Error ? err.message : "Gagal cek BIN");
    } finally {
      setBinLoading(false);
    }
  }

  function copyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  }

  function formatForApi(card: GeneratedCard): string {
    return `${card.number}|${card.expMonth}|${card.expYear}|${card.cvv}`;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">
          VCC Generator & BIN Checker
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Generate, validate, dan cek BIN kartu kredit virtual
        </p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1">
          {(["generate", "validate", "bin"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {tab === "generate"
                ? "Generator"
                : tab === "validate"
                  ? "Validator"
                  : "BIN Checker"}
            </button>
          ))}
        </div>

        {/* Generator Tab */}
        {activeTab === "generate" && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Tipe Kartu
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="random">Random (Semua)</option>
                    {cardTypes.map((c) => (
                      <option key={c.type} value={c.type}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Jumlah
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.min(
                          50,
                          Math.max(1, parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerate}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {generated.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    {generated.length} kartu di-generate
                  </span>
                  <button
                    onClick={() => {
                      const all = generated.map(formatForApi).join("\n");
                      navigator.clipboard.writeText(all);
                    }}
                    className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Copy All
                  </button>
                </div>
                <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
                  {generated.map((card, i) => (
                    <div
                      key={i}
                      className="p-4 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded font-mono">
                              {card.type.title}
                            </span>
                            <code className="text-sm font-mono text-green-400">
                              {card.formatted}
                            </code>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 font-mono">
                            EXP: {card.expMonth}/{card.expYear} |{" "}
                            {card.type.code.name}: {card.cvv}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              copyToClipboard(formatForApi(card), i)
                            }
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-2.5 py-1.5 rounded transition-colors"
                          >
                            {copied === i ? "Copied!" : "Copy"}
                          </button>
                          <button
                            onClick={() => handleBinCheck(formatForApi(card))}
                            className="text-xs bg-purple-700 hover:bg-purple-600 px-2.5 py-1.5 rounded transition-colors"
                          >
                            Check BIN
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validator Tab */}
        {activeTab === "validate" && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Nomor Kartu
                  </label>
                  <input
                    type="text"
                    placeholder="4111 1111 1111 1111"
                    value={validateInput.number}
                    onChange={(e) =>
                      setValidateInput((v) => ({
                        ...v,
                        number: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 md:col-span-2">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      Bulan
                    </label>
                    <input
                      type="text"
                      placeholder="05"
                      maxLength={2}
                      value={validateInput.month}
                      onChange={(e) =>
                        setValidateInput((v) => ({
                          ...v,
                          month: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      Tahun
                    </label>
                    <input
                      type="text"
                      placeholder="2030"
                      maxLength={4}
                      value={validateInput.year}
                      onChange={(e) =>
                        setValidateInput((v) => ({
                          ...v,
                          year: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength={4}
                      value={validateInput.cvv}
                      onChange={(e) =>
                        setValidateInput((v) => ({ ...v, cvv: e.target.value }))
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleValidate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Validate
                </button>
                <button
                  onClick={() => handleBinCheck()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Check BIN
                </button>
              </div>
            </div>

            {validationResult && (
              <div
                className={`rounded-xl p-6 border ${validationResult.isValid ? "bg-green-950/30 border-green-800" : "bg-red-950/30 border-red-800"}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-lg ${validationResult.isValid ? "text-green-400" : "text-red-400"}`}
                  >
                    {validationResult.isValid ? "VALID" : "INVALID"}
                  </span>
                  {validationResult.cardType && (
                    <span className="text-sm bg-gray-800 px-2 py-0.5 rounded">
                      {validationResult.cardType.title}
                    </span>
                  )}
                </div>
                {validationResult.errors.length > 0 && (
                  <ul className="space-y-1">
                    {validationResult.errors.map((err, i) => (
                      <li key={i} className="text-sm text-red-300">
                        - {err}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* BIN Checker Tab */}
        {activeTab === "bin" && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <label className="block text-sm text-gray-400 mb-1.5">
                Card Data (format: number|mm|yyyy|cvv)
              </label>
              <input
                type="text"
                placeholder="4111111111111111|05|2030|123"
                value={validateInput.number}
                onChange={(e) =>
                  setValidateInput((v) => ({ ...v, number: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleBinCheck(validateInput.number)}
                disabled={binLoading}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                {binLoading ? "Checking..." : "Check BIN"}
              </button>
            </div>

            {binError && (
              <div className="bg-red-950/30 border border-red-800 rounded-xl p-4">
                <p className="text-red-300 text-sm">{binError}</p>
              </div>
            )}

            {binResult && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold">BIN Result</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${binResult.code === 1 ? "bg-green-800 text-green-200" : binResult.code === 3 ? "bg-yellow-800 text-yellow-200" : "bg-red-800 text-red-200"}`}
                  >
                    {binResult.status}
                  </span>
                </div>
                {binResult.message && (
                  <p className="text-sm text-gray-400 mb-4">
                    {binResult.message}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Brand" value={binResult.card?.brand || "-"} />
                  <InfoRow label="Type" value={binResult.card?.type || "-"} />
                  <InfoRow
                    label="Category"
                    value={binResult.card?.category || "-"}
                  />
                  <InfoRow label="Bank" value={binResult.card?.bank || "-"} />
                  <InfoRow
                    label="Country"
                    value={`${binResult.card?.country?.emoji || ""} ${binResult.card?.country?.name || "-"}`}
                  />
                  <InfoRow
                    label="Currency"
                    value={binResult.card?.country?.currency || "-"}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500 uppercase">{label}</span>
      <p className="text-sm font-mono text-white mt-0.5">{value || "-"}</p>
    </div>
  );
}

export default App;
