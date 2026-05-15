import { Bot, InputFile } from "grammy";
import {
  mainMenuKeyboard,
  cardTypeKeyboard,
  quantityKeyboard,
  afterGenerateKeyboard,
  backKeyboard,
} from "./keyboards";
import { generateFullCard, cardTypes } from "../lib/generator";
import { addHistory, getHistory } from "../db";

let lastGeneratedCards: {
  number: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  type: string;
}[] = [];

export function setupCallbacks(bot: Bot) {
  bot.callbackQuery("back_main", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "🏦 *VCC Generator & BIN Checker*\n\nPilih menu:",
      {
        parse_mode: "Markdown",
        reply_markup: mainMenuKeyboard(),
      },
    );
  });

  bot.callbackQuery("menu_generate", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("Pilih tipe kartu:", {
      reply_markup: cardTypeKeyboard(),
    });
  });

  bot.callbackQuery("menu_validate", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "📝 *Validate Card*\n\nKirim pesan dengan format:\n`/validate <nomor>|<bulan>|<tahun>|<cvv>`\n\nContoh:\n`/validate 4111111111111111|05|2030|123`",
      { parse_mode: "Markdown", reply_markup: backKeyboard() },
    );
  });

  bot.callbackQuery("menu_bin", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "🔍 *BIN Checker*\n\nKirim pesan dengan format:\n`/bin <nomor>|<bulan>|<tahun>|<cvv>`\n\nContoh:\n`/bin 4111111111111111|05|2030|123`",
      { parse_mode: "Markdown", reply_markup: backKeyboard() },
    );
  });

  bot.callbackQuery("menu_history", async (ctx) => {
    await ctx.answerCallbackQuery();
    const records = getHistory(10, 0);
    if (records.length === 0) {
      await ctx.editMessageText("📋 Belum ada history.", {
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

    await ctx.editMessageText(
      `📋 *History (10 terakhir):*\n\n${lines.join("\n\n")}`,
      {
        parse_mode: "Markdown",
        reply_markup: backKeyboard(),
      },
    );
  });

  bot.callbackQuery("menu_export", async (ctx) => {
    await ctx.answerCallbackQuery();
    const records = getHistory(100, 0);
    if (records.length === 0) {
      await ctx.editMessageText("📋 Belum ada history untuk di-export.", {
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

  // Generate card type selection
  bot.callbackQuery(/^gen_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const typeCode = ctx.match[1];
    await ctx.editMessageText(`Pilih jumlah kartu:`, {
      reply_markup: quantityKeyboard(typeCode),
    });
  });

  // Generate with quantity
  bot.callbackQuery(/^qty_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery("Generating...");
    const typeCode = ctx.match[1];
    const quantity = parseInt(ctx.match[2], 10);

    const cardType =
      typeCode === "random"
        ? undefined
        : cardTypes.find((c) => c.type === typeCode);
    const cards = [];

    for (let i = 0; i < quantity; i++) {
      const card = generateFullCard(cardType);
      cards.push({
        number: card.number,
        expMonth: card.expMonth,
        expYear: card.expYear,
        cvv: card.cvv,
        type: card.type.title,
      });
    }

    lastGeneratedCards = cards;

    addHistory({
      type: "generate",
      source: "telegram",
      input: JSON.stringify({ type: typeCode, quantity }),
      output: JSON.stringify(cards),
      card_number: cards.map((c) => c.number).join(","),
      card_type: cardType?.title || "Random",
      is_valid: 1,
      bin_result: null,
    });

    const cardLines = cards
      .map(
        (c, i) =>
          `${i + 1}. \`${c.number}|${c.expMonth}|${c.expYear}|${c.cvv}\``,
      )
      .join("\n");

    const typeName = cardType?.title || "Random";
    const msg = `🎲 *Generated ${quantity} ${typeName} Cards:*\n\n${cardLines}`;

    await ctx.editMessageText(msg, {
      parse_mode: "Markdown",
      reply_markup: afterGenerateKeyboard(),
    });
  });

  // Download last generated as TXT
  bot.callbackQuery("download_last", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (lastGeneratedCards.length === 0) {
      await ctx.reply("Belum ada kartu yang di-generate.", {
        reply_markup: backKeyboard(),
      });
      return;
    }

    const content = lastGeneratedCards
      .map((c) => `${c.number}|${c.expMonth}|${c.expYear}|${c.cvv}`)
      .join("\n");

    const buffer = Buffer.from(content, "utf-8");
    await ctx.replyWithDocument(
      new InputFile(buffer, `vcc_${Date.now()}.txt`),
      {
        caption: `📄 ${lastGeneratedCards.length} kartu (${lastGeneratedCards[0]?.type || "Random"})`,
        reply_markup: backKeyboard(),
      },
    );
  });
}
