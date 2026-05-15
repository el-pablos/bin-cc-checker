import { Router } from "express";
import { validateCard } from "../lib/generator";
import { addHistory } from "../db";

const router = Router();

router.post("/", (req, res) => {
  const { number, expMonth, expYear, cvv } = req.body;

  if (!number) {
    res.status(400).json({ success: false, error: "Nomor kartu wajib diisi" });
    return;
  }

  const result = validateCard(
    String(number),
    String(expMonth || ""),
    String(expYear || ""),
    String(cvv || ""),
  );

  addHistory({
    type: "validate",
    source: "web",
    input: JSON.stringify({ number, expMonth, expYear, cvv }),
    output: JSON.stringify(result),
    card_number: String(number).replace(/[\s-]/g, ""),
    card_type: result.cardType?.title || null,
    is_valid: result.isValid ? 1 : 0,
    bin_result: null,
  });

  res.json({
    success: true,
    isValid: result.isValid,
    cardType: result.cardType
      ? { title: result.cardType.title, type: result.cardType.type }
      : null,
    errors: result.errors,
  });
});

export default router;
