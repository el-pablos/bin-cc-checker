import { Bot, InputFile } from "grammy";
import { mainMenuKeyboard, cardTypeKeyboard, backKeyboard } from "./keyboards";
import { generateFullCard, validateCard, cardTypes } from "../lib/generator";
import { checkBin } from "../lib/bin-checker";
import { addHistory, getHistory } from "../db";

export function setupCommands(bot: Bot) {
  bot.command("start", async (ctx) => {
    const welcome = `🏦 *VCC Generator & BIN Checker*

Selamat datang! Bot ini bisa:
• Generate kartu kredit virtual
• Validasi nomor kartu
• Cek BIN/IIN kartu

Pilih menu di bawah:`;

    await ctx.reply(welcome, {
      parse_mode: "Markdown",
      reply_markup: mainMenuKeyboard(),
    });
  });

  bot.command("generate", async (ctx) => {
    await ctx.reply("Pilih tipe kartu yang mau di-generate:", {
      reply_markup: cardTypeKeyboard(),
    });
  });

  bot.command("validate", async (ctx) => {
    const input = ctx.match?.trim();
    if (!input) {
      await ctx.reply(
        "📝 *Format validasi:*\n`/validate <nomor>|<bulan>|<tahun>|<cvv>`\n\nContoh:\n`/validate 4111111111111111|05|2030|123`",
        { parse_mode: "Markdown", reply_markup: backKeyboard() },
      );
      return;
    }

    const parts = input.split("|");
    if (parts.length < 4) {
      await ctx.reply(
        "❌ Format salah. Gunakan: `/validate nomor|mm|yyyy|cvv`",
        { parse_mode: "Markdown" },
      );
      return;
    }

    const [number, expMonth, expYear, cvv] = parts;
    const result = validateCard(number, expMonth, expYear, cvv);

    addHistory({
      type: "validate",
      source: "telegram",
      input: input,
      output: JSON.stringify(result),
      card_number: number.replace(/[\s-]/g, ""),
      card_type: result.cardType?.title || null,
      is_valid: result.isValid ? 1 : 0,
      bin_result: null,
    });

    const status = result.isValid ? "✅ VALID" : "❌ INVALID";
    const typeInfo = result.cardType ? `\nTipe: ${result.cardType.title}` : "";
    const errors =
      result.errors.length > 0
        ? `\n\nErrors:\n${result.errors.map((e) => `• ${e}`).join("\n")}`
        : "";

    await ctx.reply(`${status}${typeInfo}${errors}\n\n\`${input}\``, {
      parse_mode: "Markdown",
      reply_markup: backKeyboard(),
    });
  });

  bot.command("bin", async (ctx) => {
    const input = ctx.match?.trim();
    if (!input) {
      await ctx.reply(
        "📝 *Format BIN check:*\n`/bin <nomor>|<bulan>|<tahun>|<cvv>`\n\nContoh:\n`/bin 4111111111111111|05|2030|123`",
        { parse_mode: "Markdown", reply_markup: backKeyboard() },
      );
      return;
    }

    await ctx.reply("🔍 Checking BIN...");

    try {
      const result = await checkBin(input);

      addHistory({
        type: "bin_check",
        source: "telegram",
        input: input,
        output: JSON.stringify(result),
        card_number: input.split("|")[0] || null,
        card_type: result.card?.brand || null,
        is_valid: result.code === 1 ? 1 : 0,
        bin_result: JSON.stringify(result),
      });

      const info = [
        `🔍 *BIN Check Result*`,
        ``,
        `Status: ${result.status}`,
        result.message ? `Info: ${result.message}` : "",
        `Brand: ${result.card?.brand || "-"}`,
        `Type: ${result.card?.type || "-"}`,
        `Category: ${result.card?.category || "-"}`,
        `Bank: ${result.card?.bank || "-"}`,
        `Country: ${result.card?.country?.emoji || ""} ${result.card?.country?.name || "-"}`,
        `Currency: ${result.card?.country?.currency || "-"}`,
        ``,
        `\`${input}\``,
      ]
        .filter(Boolean)
        .join("\n");

      await ctx.reply(info, {
        parse_mode: "Markdown",
        reply_markup: backKeyboard(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await ctx.reply(`❌ BIN check gagal: ${msg}`, {
        reply_markup: backKeyboard(),
      });
    }
  });

  bot.command("bulk", async (ctx) => {
    const input = ctx.message?.text?.replace(/^\/bulk\s*/, "").trim();
    if (!input) {
      await ctx.reply(
        "📋 *Bulk Validate*\n\nKirim `/bulk` diikuti list kartu (1 per baris):\n```\n/bulk\n4111111111111111|05|2030|123\n5500000000000004|08|2028|456\n```",
        { parse_mode: "Markdown", reply_markup: backKeyboard() },
      );
      return;
    }

    const lines = input.split("\n").filter((l) => l.trim().length > 0);
    const results: { line: string; isValid: boolean; errors: string[] }[] = [];

    for (const line of lines) {
      const parts = line.trim().split("|");
      if (parts.length < 4) {
        results.push({
          line: line.trim(),
          isValid: false,
          errors: ["Format salah (butuh: number|mm|yyyy|cvv)"],
        });
        continue;
      }
      const [number, expMonth, expYear, cvv] = parts;
      const result = validateCard(
        number.trim(),
        expMonth.trim(),
        expYear.trim(),
        cvv.trim(),
      );
      results.push({
        line: line.trim(),
        isValid: result.isValid,
        errors: result.errors,
      });
    }

    const valid = results.filter((r) => r.isValid).length;
    const invalid = results.length - valid;

    addHistory({
      type: "bulk_validate",
      source: "telegram",
      input: JSON.stringify(lines),
      output: JSON.stringify(results),
      card_number: lines[0]?.split("|")[0] || null,
      card_type: null,
      is_valid: invalid === 0 ? 1 : 0,
      bin_result: null,
    });

    const detail = results
      .map((r, i) => {
        const status = r.isValid ? "✅" : "❌";
        const err = r.errors.length > 0 ? ` (${r.errors.join(", ")})` : "";
        return `${i + 1}. ${status} ${r.line}${err}`;
      })
      .join("\n");

    const summary = `📋 *Bulk Validate Result*\n\nTotal: ${results.length} | Valid: ${valid} | Invalid: ${invalid}\n\n`;

    if (results.length > 20) {
      const fileContent = results
        .map((r, i) => {
          const status = r.isValid ? "VALID" : "INVALID";
          const err = r.errors.length > 0 ? ` | ${r.errors.join(", ")}` : "";
          return `${i + 1}. [${status}] ${r.line}${err}`;
        })
        .join("\n");
      const buffer = Buffer.from(
        `Bulk Validate Result\nTotal: ${results.length} | Valid: ${valid} | Invalid: ${invalid}\n\n${fileContent}`,
        "utf-8",
      );
      await ctx.replyWithDocument(
        new InputFile(buffer, `bulk_validate_${Date.now()}.txt`),
        {
          caption: `📋 Total: ${results.length} | Valid: ${valid} | Invalid: ${invalid}`,
          reply_markup: backKeyboard(),
        },
      );
    } else {
      await ctx.reply(`${summary}\`\`\`\n${detail}\n\`\`\``, {
        parse_mode: "Markdown",
        reply_markup: backKeyboard(),
      });
    }
  });

  bot.command("history", async (ctx) => {
    const records = getHistory(10, 0);
    if (records.length === 0) {
      await ctx.reply("📋 Belum ada history.", {
        reply_markup: backKeyboard(),
      });
      return;
    }

    const lines = records.map((r, i) => {
      const icon =
        r.type === "generate" ? "🎲" : r.type === "validate" ? "✅" : "🔍";
      const time = new Date(r.created_at).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      });
      return `${i + 1}. ${icon} [${r.source}] ${r.type} - ${r.card_type || "-"}\n   ${time}`;
    });

    await ctx.reply(`📋 *History (10 terakhir):*\n\n${lines.join("\n\n")}`, {
      parse_mode: "Markdown",
      reply_markup: backKeyboard(),
    });
  });

  bot.command("export", async (ctx) => {
    const records = getHistory(100, 0);
    if (records.length === 0) {
      await ctx.reply("📋 Belum ada history untuk di-export.", {
        reply_markup: backKeyboard(),
      });
      return;
    }

    const lines = records.map((r) => {
      const time = new Date(r.created_at).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      });
      if (r.type === "generate" && r.output) {
        const cards = JSON.parse(r.output);
        const cardLines = cards
          .map(
            (c: {
              number: string;
              expMonth: string;
              expYear: string;
              cvv: string;
            }) => `${c.number}|${c.expMonth}|${c.expYear}|${c.cvv}`,
          )
          .join("\n");
        return `[${time}] GENERATE (${r.source}) - ${r.card_type}\n${cardLines}`;
      }
      return `[${time}] ${r.type.toUpperCase()} (${r.source}) - ${r.card_number || "-"} - ${r.is_valid ? "VALID" : "INVALID"}`;
    });

    const content = lines.join("\n\n");
    const buffer = Buffer.from(content, "utf-8");

    await ctx.replyWithDocument(
      new InputFile(buffer, `history_${Date.now()}.txt`),
      {
        caption: `📄 Export ${records.length} records`,
        reply_markup: backKeyboard(),
      },
    );
  });

  bot.on("message:document", async (ctx) => {
    const doc = ctx.message.document;
    if (!doc.file_name?.endsWith(".txt")) return;

    const file = await ctx.getFile();
    const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const response = await fetch(url);
    const text = await response.text();

    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      await ctx.reply("❌ File kosong atau tidak ada data kartu.", {
        reply_markup: backKeyboard(),
      });
      return;
    }

    const results: { line: string; isValid: boolean; errors: string[] }[] = [];

    for (const line of lines) {
      const parts = line.trim().split("|");
      if (parts.length < 4) {
        results.push({
          line: line.trim(),
          isValid: false,
          errors: ["Format salah (butuh: number|mm|yyyy|cvv)"],
        });
        continue;
      }
      const [number, expMonth, expYear, cvv] = parts;
      const result = validateCard(
        number.trim(),
        expMonth.trim(),
        expYear.trim(),
        cvv.trim(),
      );
      results.push({
        line: line.trim(),
        isValid: result.isValid,
        errors: result.errors,
      });
    }

    const valid = results.filter((r) => r.isValid).length;
    const invalid = results.length - valid;

    addHistory({
      type: "bulk_validate",
      source: "telegram",
      input: JSON.stringify(lines),
      output: JSON.stringify(results),
      card_number: lines[0]?.split("|")[0] || null,
      card_type: null,
      is_valid: invalid === 0 ? 1 : 0,
      bin_result: null,
    });

    const fileContent = results
      .map((r, i) => {
        const status = r.isValid ? "VALID" : "INVALID";
        const err = r.errors.length > 0 ? ` | ${r.errors.join(", ")}` : "";
        return `${i + 1}. [${status}] ${r.line}${err}`;
      })
      .join("\n");

    const buffer = Buffer.from(
      `Bulk Validate Result\nTotal: ${results.length} | Valid: ${valid} | Invalid: ${invalid}\n\n${fileContent}`,
      "utf-8",
    );

    await ctx.replyWithDocument(
      new InputFile(buffer, `bulk_validate_${Date.now()}.txt`),
      {
        caption: `📋 Total: ${results.length} | Valid: ${valid} | Invalid: ${invalid}`,
        reply_markup: backKeyboard(),
      },
    );
  });
}
