import { InlineKeyboard } from "grammy";
import { cardTypes } from "../lib/card-types";

export function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🎲 Generate VCC", "menu_generate")
    .row()
    .text("✅ Validate Card", "menu_validate")
    .row()
    .text("🔍 Check BIN", "menu_bin")
    .row()
    .text("📋 Bulk Validate", "menu_bulk")
    .row()
    .text("📋 History", "menu_history")
    .row()
    .text("📄 Export TXT", "menu_export");
}

export function cardTypeKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  kb.text("🎲 Random", "gen_random").row();
  for (let i = 0; i < cardTypes.length; i += 2) {
    const row = cardTypes.slice(i, i + 2);
    for (const card of row) {
      kb.text(card.title, `gen_${card.type}`);
    }
    kb.row();
  }
  return kb;
}

export function quantityKeyboard(typeCode: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("5", `qty_${typeCode}_5`)
    .text("10", `qty_${typeCode}_10`)
    .text("15", `qty_${typeCode}_15`)
    .text("25", `qty_${typeCode}_25`)
    .row()
    .text("⬅️ Kembali", "back_main");
}

export function afterGenerateKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("📄 Download TXT", "download_last")
    .row()
    .text("🎲 Generate Lagi", "menu_generate")
    .text("🏠 Menu", "back_main");
}

export function backKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text("⬅️ Kembali ke Menu", "back_main");
}
