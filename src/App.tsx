import { useState } from "react";
import Generator from "./components/Generator";
import Validator from "./components/Validator";
import BinChecker from "./components/BinChecker";
import History from "./components/History";

type Tab = "generate" | "validate" | "bin" | "history";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  const tabs: { key: Tab; label: string }[] = [
    { key: "generate", label: "Generator" },
    { key: "validate", label: "Validator" },
    { key: "bin", label: "BIN Check" },
    { key: "history", label: "History" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8">
        <header className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            VCC Generator & BIN Checker
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Generate, validate, dan cek BIN kartu kredit virtual
          </p>
        </header>

        <nav className="flex gap-1 mb-4 sm:mb-6 bg-gray-900 rounded-lg p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[36px] ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main>
          {activeTab === "generate" && <Generator />}
          {activeTab === "validate" && <Validator />}
          {activeTab === "bin" && <BinChecker />}
          {activeTab === "history" && <History />}
        </main>

        <footer className="mt-6 sm:mt-8 text-center">
          <p className="text-[10px] sm:text-xs text-gray-600">
            VCC Generator & BIN Checker v1.0.0 — Telegram Bot:
            @cc_gen_checker_bot
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
