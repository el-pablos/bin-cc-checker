import { Router } from "express";
import { getHistory, getHistoryCount, clearHistory } from "../db";

const router = Router();

router.get("/", (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const type = req.query.type as string | undefined;

  const records = getHistory(limit, offset, type);
  const total = getHistoryCount(type);

  res.json({
    success: true,
    records,
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  });
});

router.delete("/", (req, res) => {
  clearHistory();
  res.json({ success: true, message: "History cleared" });
});

export default router;
