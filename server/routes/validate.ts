import { Router } from "express";
import multer from "multer";
import { validateCard } from "../lib/generator";
import { addHistory } from "../db";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

router.post("/bulk", (req, res) => {
  const { cards } = req.body;

  if (!Array.isArray(cards) || cards.length === 0) {
    res
      .status(400)
      .json({
        success: false,
        error: "Field 'cards' harus berupa array yang tidak kosong",
      });
    return;
  }

  const results = cards.map((card: string) => {
    const parts = card.split("|");
    const [number, expMonth, expYear, cvv] = parts;
    const result = validateCard(
      String(number || ""),
      String(expMonth || ""),
      String(expYear || ""),
      String(cvv || ""),
    );
    return {
      card,
      isValid: result.isValid,
      cardType: result.cardType?.title || null,
      errors: result.errors,
    };
  });

  const valid = results.filter((r) => r.isValid).length;
  const invalid = results.length - valid;

  addHistory({
    type: "bulk_validate",
    source: "web",
    input: JSON.stringify({ cards }),
    output: JSON.stringify({ total: results.length, valid, invalid }),
    card_number: null,
    card_type: null,
    is_valid: null,
    bin_result: null,
  });

  res.json({
    success: true,
    total: results.length,
    valid,
    invalid,
    results,
  });
});

router.post("/file", upload.single("file"), (req, res) => {
  if (!req.file) {
    res
      .status(400)
      .json({
        success: false,
        error:
          "File tidak ditemukan. Upload file .txt dengan field name 'file'",
      });
    return;
  }

  if (!req.file.originalname.endsWith(".txt")) {
    res
      .status(400)
      .json({ success: false, error: "Hanya file .txt yang diperbolehkan" });
    return;
  }

  const content = req.file.buffer.toString("utf-8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");

  const results = lines.map((line) => {
    const parts = line.trim().split("|");
    const [number, expMonth, expYear, cvv] = parts;
    const result = validateCard(
      String(number || ""),
      String(expMonth || ""),
      String(expYear || ""),
      String(cvv || ""),
    );
    return {
      card: line.trim(),
      isValid: result.isValid,
      cardType: result.cardType?.title || null,
      errors: result.errors,
    };
  });

  const valid = results.filter((r) => r.isValid).length;
  const invalid = results.length - valid;

  addHistory({
    type: "bulk_validate",
    source: "file_upload",
    input: req.file.originalname,
    output: JSON.stringify({ total: results.length, valid, invalid }),
    card_number: null,
    card_type: null,
    is_valid: null,
    bin_result: null,
  });

  res.json({
    success: true,
    total: results.length,
    valid,
    invalid,
    results,
  });
});

export default router;
