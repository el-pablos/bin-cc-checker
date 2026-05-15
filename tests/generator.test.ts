import { describe, it } from "node:test";
import assert from "node:assert";
import { cardTypes, detectCardType } from "../server/lib/card-types";
import {
  generateCardNumber,
  generateFullCard,
  generateExpiry,
  generateCVV,
  validateCard,
} from "../server/lib/generator";

describe("Card Types", () => {
  it("harus punya 8 tipe kartu", () => {
    assert.strictEqual(cardTypes.length, 8);
  });

  it("setiap tipe harus punya title, type, patterns, gaps, lengths, code", () => {
    for (const card of cardTypes) {
      assert.ok(card.title, `Card missing title`);
      assert.ok(card.type, `Card missing type`);
      assert.ok(Array.isArray(card.patterns), `${card.title} missing patterns`);
      assert.ok(Array.isArray(card.gaps), `${card.title} missing gaps`);
      assert.ok(Array.isArray(card.lengths), `${card.title} missing lengths`);
      assert.ok(card.code.name, `${card.title} missing code name`);
      assert.ok(card.code.size >= 3, `${card.title} code size too small`);
    }
  });

  it("detectCardType harus mengenali Visa (prefix 4)", () => {
    const result = detectCardType("4111111111111111");
    assert.ok(result);
    assert.strictEqual(result.type, "VI");
    assert.strictEqual(result.title, "Visa");
  });

  it("detectCardType harus mengenali MasterCard (prefix 51-55)", () => {
    const result = detectCardType("5111111111111111");
    assert.ok(result);
    assert.strictEqual(result.type, "MC");
  });

  it("detectCardType harus mengenali MasterCard (prefix 2221-2720)", () => {
    const result = detectCardType("2221000000000000");
    assert.ok(result);
    assert.strictEqual(result.type, "MC");
  });

  it("detectCardType harus mengenali Amex (prefix 34)", () => {
    const result = detectCardType("341111111111111");
    assert.ok(result);
    assert.strictEqual(result.type, "AE");
  });

  it("detectCardType harus mengenali Amex (prefix 37)", () => {
    const result = detectCardType("371111111111111");
    assert.ok(result);
    assert.strictEqual(result.type, "AE");
  });

  it("detectCardType harus mengenali Discover (prefix 6011)", () => {
    const result = detectCardType("6011111111111111");
    assert.ok(result);
    assert.strictEqual(result.type, "DI");
  });

  it("detectCardType harus mengenali JCB (prefix 3528-3589)", () => {
    const result = detectCardType("3528111111111111");
    assert.ok(result);
    assert.strictEqual(result.type, "JCB");
  });

  it("detectCardType harus return null untuk nomor tidak dikenal", () => {
    const result = detectCardType("9999999999999999");
    assert.strictEqual(result, null);
  });

  it("detectCardType harus return null untuk string kosong", () => {
    const result = detectCardType("");
    assert.strictEqual(result, null);
  });
});

describe("Generator", () => {
  it("generateCardNumber harus menghasilkan nomor valid Luhn", () => {
    for (let i = 0; i < 20; i++) {
      const number = generateCardNumber();
      const digits = number.split("").map(Number);
      let sum = 0;
      let alternate = false;
      for (let j = digits.length - 1; j >= 0; j--) {
        let n = digits[j];
        if (alternate) {
          n *= 2;
          if (n > 9) n -= 9;
        }
        sum += n;
        alternate = !alternate;
      }
      assert.strictEqual(sum % 10, 0, `Luhn failed for ${number}`);
    }
  });

  it("generateCardNumber harus menghasilkan nomor sesuai tipe", () => {
    const visa = cardTypes.find((c) => c.type === "VI")!;
    for (let i = 0; i < 10; i++) {
      const number = generateCardNumber(visa);
      assert.ok(
        number.startsWith("4"),
        `Visa harus mulai dengan 4, got ${number}`,
      );
      assert.strictEqual(
        number.length,
        16,
        `Visa harus 16 digit, got ${number.length}`,
      );
    }
  });

  it("generateFullCard harus menghasilkan kartu lengkap", () => {
    const card = generateFullCard();
    assert.ok(card.number);
    assert.ok(card.expMonth);
    assert.ok(card.expYear);
    assert.ok(card.cvv);
    assert.ok(card.type);
    assert.ok(card.formatted);
  });

  it("generateFullCard harus menghasilkan kartu sesuai tipe yang diminta", () => {
    const amex = cardTypes.find((c) => c.type === "AE")!;
    const card = generateFullCard(amex);
    assert.strictEqual(card.type.type, "AE");
    assert.strictEqual(card.number.length, 15);
    assert.strictEqual(card.cvv.length, 4);
  });

  it("generateExpiry harus menghasilkan tanggal di masa depan", () => {
    const now = new Date();
    for (let i = 0; i < 10; i++) {
      const exp = generateExpiry();
      const month = parseInt(exp.month, 10);
      const year = parseInt(exp.year, 10);
      assert.ok(month >= 1 && month <= 12, `Month ${month} out of range`);
      assert.ok(year > now.getFullYear(), `Year ${year} not in future`);
    }
  });

  it("generateCVV harus menghasilkan CVV dengan panjang yang benar", () => {
    assert.strictEqual(generateCVV(3).length, 3);
    assert.strictEqual(generateCVV(4).length, 4);
  });

  it("generateCVV harus hanya berisi angka", () => {
    for (let i = 0; i < 20; i++) {
      const cvv = generateCVV(3);
      assert.ok(/^\d+$/.test(cvv), `CVV contains non-digit: ${cvv}`);
    }
  });
});

describe("Validator", () => {
  it("harus validasi kartu valid (4111111111111111)", () => {
    const result = validateCard("4111111111111111", "05", "2030", "123");
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
    assert.ok(result.cardType);
    assert.strictEqual(result.cardType.type, "VI");
  });

  it("harus reject nomor yang gagal Luhn", () => {
    const result = validateCard("4111111111111112", "05", "2030", "123");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("Luhn")));
  });

  it("harus reject nomor non-digit", () => {
    const result = validateCard("4111-abcd-1111-1111", "05", "2030", "123");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("angka")));
  });

  it("harus reject tipe tidak dikenal", () => {
    const result = validateCard("9999999999999999", "05", "2030", "123");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("tidak dikenali")));
  });

  it("harus reject panjang nomor salah", () => {
    const result = validateCard("411111111111", "05", "2030", "123");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("Panjang")));
  });

  it("harus reject bulan invalid", () => {
    const result = validateCard("4111111111111111", "13", "2030", "123");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("Bulan")));
  });

  it("harus reject kartu expired", () => {
    const result = validateCard("4111111111111111", "01", "2020", "123");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("expired")));
  });

  it("harus reject CVV dengan panjang salah untuk Visa", () => {
    const result = validateCard("4111111111111111", "05", "2030", "1234");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("CVV")));
  });

  it("harus accept CVV 4 digit untuk Amex", () => {
    const result = validateCard("378282246310005", "05", "2030", "1234");
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it("harus reject CVV 3 digit untuk Amex", () => {
    const result = validateCard("378282246310005", "05", "2030", "123");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("CID")));
  });

  it("generated cards harus selalu valid", () => {
    for (let i = 0; i < 50; i++) {
      const card = generateFullCard();
      const result = validateCard(
        card.number,
        card.expMonth,
        card.expYear,
        card.cvv,
      );
      assert.strictEqual(
        result.isValid,
        true,
        `Generated card invalid: ${card.number} - ${result.errors.join(", ")}`,
      );
    }
  });
});
