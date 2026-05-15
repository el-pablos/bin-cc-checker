import { Router } from "express";
import { checkBin } from "../lib/bin-checker";
import { addHistory } from "../db";

const router = Router();

router.post("/", async (req, res) => {
  const { data } = req.body;

  if (!data) {
    res
      .status(400)
      .json({
        success: false,
        error: "Card data wajib diisi (format: number|mm|yyyy|cvv)",
      });
    return;
  }

  try {
    const result = await checkBin(String(data));

    addHistory({
      type: "bin_check",
      source: "web",
      input: String(data),
      output: JSON.stringify(result),
      card_number: String(data).split("|")[0] || null,
      card_type: result.card?.brand || null,
      is_valid: result.code === 1 ? 1 : 0,
      bin_result: JSON.stringify(result),
    });

    res.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "BIN check gagal";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
