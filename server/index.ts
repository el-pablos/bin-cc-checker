import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import generateRouter from "./routes/generate";
import validateRouter from "./routes/validate";
import binCheckRouter from "./routes/bin-check";
import historyRouter from "./routes/history";
import { startBot } from "./bot/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/generate", generateRouter);
app.use("/api/validate", validateRouter);
app.use("/api/bin-check", binCheckRouter);
app.use("/api/history", historyRouter);

const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startBot();
});
