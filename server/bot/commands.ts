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
}
