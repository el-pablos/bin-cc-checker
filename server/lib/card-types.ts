export interface CardType {
  title: string;
  type: string;
  patterns: (number | [number, number])[];
  gaps: number[];
  lengths: number[];
  code: {
    name: string;
    size: number;
  };
}

export const cardTypes: CardType[] = [
  {
    title: "Visa",
    type: "VI",
    patterns: [4],
    gaps: [4, 8, 12],
    lengths: [16],
    code: { name: "CVV", size: 3 },
  },
  {
    title: "MasterCard",
    type: "MC",
    patterns: [
      [51, 55],
      [2221, 2720],
    ],
    gaps: [4, 8, 12],
    lengths: [16],
    code: { name: "CVC", size: 3 },
  },
  {
    title: "American Express",
    type: "AE",
    patterns: [34, 37],
    gaps: [4, 10],
    lengths: [15],
    code: { name: "CID", size: 4 },
  },
  {
    title: "Discover",
    type: "DI",
    patterns: [6011, [644, 649], 65],
    gaps: [4, 8, 12],
    lengths: [16, 17, 18, 19],
    code: { name: "CID", size: 3 },
  },
  {
    title: "JCB",
    type: "JCB",
    patterns: [[3528, 3589]],
    gaps: [4, 8, 12],
    lengths: [16, 17, 18, 19],
    code: { name: "CVV", size: 3 },
  },
  {
    title: "Diners Club",
    type: "DN",
    patterns: [[300, 305], 3095, 36, [38, 39]],
    gaps: [4, 10],
    lengths: [14, 16, 17, 18, 19],
    code: { name: "CVV", size: 3 },
  },
  {
    title: "UnionPay",
    type: "UN",
    patterns: [62],
    gaps: [4, 8, 12],
    lengths: [16, 17, 18, 19],
    code: { name: "CVN", size: 3 },
  },
  {
    title: "Maestro",
    type: "MI",
    patterns: [50, [56, 59], 63, 67],
    gaps: [4, 8, 12],
    lengths: [12, 13, 14, 15, 16, 17, 18, 19],
    code: { name: "CVC", size: 3 },
  },
];

export function detectCardType(number: string): CardType | null {
  const cleaned = number.replace(/\s/g, "");
  if (!cleaned) return null;

  for (const card of cardTypes) {
    for (const pattern of card.patterns) {
      if (Array.isArray(pattern)) {
        const [min, max] = pattern;
        const len = String(min).length;
        const prefix = parseInt(cleaned.substring(0, len), 10);
        if (prefix >= min && prefix <= max) return card;
      } else {
        const len = String(pattern).length;
        const prefix = cleaned.substring(0, len);
        if (prefix === String(pattern)) return card;
      }
    }
  }
  return null;
}
