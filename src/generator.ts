import { detectCardType, cardTypes, type CardType } from "./card-types";

function luhnCheck(number: string): boolean {
  const digits = number.replace(/\s/g, "").split("").map(Number);
  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits[i];
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function generateLuhnDigit(partial: string): number {
  const digits = partial.split("").map(Number);
  let sum = 0;
  let alternate = true;

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits[i];
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return (10 - (sum % 10)) % 10;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrefix(card: CardType): string {
  const pattern =
    card.patterns[Math.floor(Math.random() * card.patterns.length)];
  if (Array.isArray(pattern)) {
    return String(randomInt(pattern[0], pattern[1]));
  }
  return String(pattern);
}

export function generateCardNumber(cardType?: CardType): string {
  const card =
    cardType || cardTypes[Math.floor(Math.random() * cardTypes.length)];
  const length = card.lengths[Math.floor(Math.random() * card.lengths.length)];
  const prefix = getRandomPrefix(card);

  let number = prefix;
  while (number.length < length - 1) {
    number += Math.floor(Math.random() * 10);
  }

  number += generateLuhnDigit(number);
  return number;
}

export function generateExpiry(): { month: string; year: string } {
  const now = new Date();
  const futureYear = now.getFullYear() + randomInt(1, 5);
  const month = randomInt(1, 12);
  return {
    month: String(month).padStart(2, "0"),
    year: String(futureYear),
  };
}

export function generateCVV(size: number): string {
  let cvv = "";
  for (let i = 0; i < size; i++) {
    cvv += Math.floor(Math.random() * 10);
  }
  return cvv;
}

export interface GeneratedCard {
  number: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  type: CardType;
  formatted: string;
}

export function generateFullCard(cardType?: CardType): GeneratedCard {
  const card =
    cardType || cardTypes[Math.floor(Math.random() * cardTypes.length)];
  const number = generateCardNumber(card);
  const expiry = generateExpiry();
  const cvv = generateCVV(card.code.size);

  let formatted = "";
  let prev = 0;
  for (const gap of card.gaps) {
    formatted += number.substring(prev, gap) + " ";
    prev = gap;
  }
  formatted += number.substring(prev);

  return {
    number,
    expMonth: expiry.month,
    expYear: expiry.year,
    cvv,
    type: card,
    formatted: formatted.trim(),
  };
}

export interface ValidationResult {
  isValid: boolean;
  cardType: CardType | null;
  errors: string[];
}

export function validateCard(
  number: string,
  expMonth: string,
  expYear: string,
  cvv: string,
): ValidationResult {
  const errors: string[] = [];
  const cleaned = number.replace(/[\s-]/g, "");

  if (!/^\d+$/.test(cleaned)) {
    errors.push("Nomor kartu harus berisi angka saja");
  }

  const cardType = detectCardType(cleaned);
  if (!cardType) {
    errors.push("Tipe kartu tidak dikenali");
  }

  if (cardType && !cardType.lengths.includes(cleaned.length)) {
    errors.push(
      `Panjang nomor tidak valid untuk ${cardType.title} (harus ${cardType.lengths.join("/")} digit)`,
    );
  }

  if (cleaned.length >= 12 && !luhnCheck(cleaned)) {
    errors.push("Nomor kartu tidak lolos validasi Luhn");
  }

  const month = parseInt(expMonth, 10);
  if (month < 1 || month > 12) {
    errors.push("Bulan expiry tidak valid (01-12)");
  }

  const year = parseInt(expYear, 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    errors.push("Kartu sudah expired");
  }

  if (cardType) {
    if (cvv.length !== cardType.code.size) {
      errors.push(`${cardType.code.name} harus ${cardType.code.size} digit`);
    }
  } else if (cvv.length < 3 || cvv.length > 4) {
    errors.push("CVV harus 3-4 digit");
  }

  return {
    isValid: errors.length === 0,
    cardType,
    errors,
  };
}
