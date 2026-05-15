import { Router } from "express";
import { generateFullCard, cardTypes } from "../lib/generator";
import { addHistory } from "../db";

const router = Router();

router.post("/", (req, res) => {
  const { type, quantity = 5 } = req.body;
  const qty = Math.min(50, Math.max(1, Number(quantity) || 5));

  const cardType = type ? cardTypes.find((c) => c.type === type) : undefined;
  const cards = [];

  for (let i = 0; i < qty; i++) {
    const card = generateFullCard(cardType);
    cards.push({
      number: card.number,
      expMonth: card.expMonth,
      expYear: card.expYear,
      cvv: card.cvv,
      type: card.type.title,
      typeCode: card.type.type,
      formatted: card.formatted,
      codeName: card.type.code.name,
    });
  }

  addHistory({
    type: "generate",
    source: "web",
    input: JSON.stringify({ type: type || "random", quantity: qty }),
    output: JSON.stringify(cards),
    card_number: cards.map((c) => c.number).join(","),
    card_type: cardType?.title || "Random",
    is_valid: 1,
    bin_result: null,
  });

  res.json({ success: true, cards });
});

export default router;
