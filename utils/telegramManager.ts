import { dbState, saveLocalDb } from "../db";
import { broadcastDataUpdate } from "./wsManager";

export let simulatedTelegramMessages: any[] = [];
export let telegramApiLogs: any[] = [];
export let telegramSimulatedError = false;
export let smsQueue: any[] = [];
export let activeSimulatedChats: string[] = ["SIM-PARENT", "SIM-DIRECTOR"];
export const botStates: Record<string, any> = {};

export function toggleTelegramSimulatedError() {
  telegramSimulatedError = !telegramSimulatedError;
  return telegramSimulatedError;
}

export function getTelegramBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

export function formatTimeHHMM(dateInput?: Date | string): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatTimeHHMMSS(dateInput?: Date | string): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function addTelegramApiLog(direction: "INCOMING" | "OUTGOING", method: string, payload: any, status: number) {
  telegramApiLogs.unshift({
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString("uz-UZ"),
    direction,
    method,
    payload: JSON.stringify(payload),
    status
  });
  if (telegramApiLogs.length > 50) telegramApiLogs.pop();
}

export function getMainMenuMarkup() {
  return {
    keyboard: [
      [{ text: "👶 Farzandim" }, { text: "📅 Davomat" }],
      [{ text: "🍽 Ovqatlar" }, { text: "🎨 Mashg'ulotlar" }],
      [{ text: "😊 Faollik" }, { text: "💳 To'lov" }],
      [{ text: "💬 Shikoyat" }, { text: "☎️ Aloqa" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

export async function processBotMessage(chatId: string, text: string, senderName: string) {
  if (!botStates[chatId]) {
    botStates[chatId] = { step: "idle", linkedChildId: null };
    // Check if any child is already linked to this chatId
    const child = dbState.children.find(c => c.telegramChatId === chatId);
    if (child) {
      botStates[chatId].linkedChildId = child.id;
    }
  }

  const state = botStates[chatId];

  if (text.startsWith("/start")) {
    state.step = "awaiting_child_id";
    state.linkedChildId = null;
    return {
      replyText: `👋 *Sizni Nihol AI Bog'chasi botida ko'rib turganimizdan xursandmiz!*\n\nTizimdan foydalanish uchun, iltimos, farzandingizning *ID raqamini* kiriting (Masalan: *B-101*):`,
      replyMarkup: { force_reply: true }
    };
  }

  // If waiting for ID link
  if (state.step === "awaiting_child_id" || !state.linkedChildId) {
    const inputId = text.trim().toUpperCase();
    const child = dbState.children.find(c => c.id === inputId);

    if (child) {
      child.telegramChatId = chatId;
      state.linkedChildId = child.id;
      state.step = "idle";
      saveLocalDb();
      broadcastDataUpdate("children");

      dbState.auditLogs.unshift({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        user: `Telegram Bot`,
        action: `Telegram Chat ${chatId} (${senderName}) muvaffaqiyatli ravishda bolaga bog'landi: ${child.name} (${child.id})`,
        ip: "Telegram API",
        device: "Telegram Server"
      });
      saveLocalDb();

      return {
        replyText: `🎉 *Muvaffaqiyatli bog'landi!*\n\n*Farzandingiz:* ${child.name}\n*Guruhi:* ${dbState.groups.find(g => g.id === child.groupId)?.name || "Noma'lum"}\n*Yoshi:* ${child.age} yosh\n*Holati:* ${child.status}\n\nQuyidagi menyulardan foydalanib farzandingiz hayoti va faoliyatini kuzatib boring:`,
        replyMarkup: getMainMenuMarkup()
      };
    } else {
      return {
        replyText: `⚠️ *ID xato kiritildi!* \n\nKechirasiz, bunday ID raqamli farzand topilmadi. Qayta tekshirib kiriting (Masalan: *B-101*).`,
        replyMarkup: { force_reply: true }
      };
    }
  }

  const child = dbState.children.find(c => c.id === state.linkedChildId);

  if (!child) {
    state.linkedChildId = null;
    state.step = "awaiting_child_id";
    return {
      replyText: "Tizimda xatolik yuz berdi. Iltimos, ID raqamingizni qaytadan kiriting:",
      replyMarkup: { force_reply: true }
    };
  }

  // COMPLAINT WORKFLOW
  if (state.step === "awaiting_complaint") {
    state.step = "idle";
    const newCmp = {
      id: `CMP-${Date.now().toString().slice(-4)}`,
      parentName: child.parentName,
      childId: child.id,
      phone: child.parentPhone,
      text: text,
      date: new Date().toISOString().split("T")[0],
      status: "Yangi",
      kindergartenId: child.kindergartenId || "K-1"
    };
    dbState.complaints.unshift(newCmp);

    dbState.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: "Telegram Bot parent",
      action: `Telegram Bot orqali yangi shikoyat yuborildi: "${text.slice(0, 50)}..."`,
      ip: "Telegram API",
      device: "Telegram Bot"
    });

    saveLocalDb();
    broadcastDataUpdate("complaints");

    return {
      replyText: `✅ *Shikoyat va taklifingiz qabul qilindi!*\n\nXabaringiz direktor paneliga yuborildi. Tez orada bog'cha ma'muriyati siz bilan bog'lanadi. Rahmat!`,
      replyMarkup: getMainMenuMarkup()
    };
  }

  const cleanText = text.trim();
  switch (cleanText) {
    case "👶 Farzandim":
    case "Farzandim":
    case "farzandim":
    case "bola":
    case "bolam":
      return {
        replyText: `👶 *FARZANDIM PROFILI*\n\n📸 *Rasm:* [Profil rasmi](${child.photo || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200'})\n👤 *F.I.O:* ${child.name}\n📅 *Tug'ilgan sana:* ${child.birthDate} (${child.age} yosh)\n🌼 *Guruh:* ${dbState.groups.find(g => g.id === child.groupId)?.name || "Katta guruh"}\n\n🩺 *Tibbiy ma'lumot:* \n• *Allergiya:* ${child.medicalCard?.allergies || "Yo'q"}\n• *Qon guruhi:* ${child.medicalCard?.bloodGroup || "I"} ${child.medicalCard?.rhFactor || "+"}\n• *Bo'yi:* ${child.medicalCard?.height || 105} sm\n• *Vazni:* ${child.medicalCard?.weight || 18} kg\n• *Emlashlar:* ${child.medicalCard?.vaccinations?.join(", ") || "Mavjud emas"}`,
        replyMarkup: getMainMenuMarkup()
      };

    case "📅 Davomat":
    case "Davomat":
    case "davomat":
      const todayDate = new Date().toISOString().split("T")[0];
      const todayAtt = dbState.attendance.find(a => a.childId === child.id && a.date === todayDate);

      let todayText = "❌ Bugun bog'chaga kelmadi yoki belgilanmadi.";
      if (todayAtt) {
        if (todayAtt.status === "Keldi" || todayAtt.status === "Kechikdi") {
          todayText = `✅ *Kelgan vaqti:* ${todayAtt.checkIn || "08:00"} (Qurilma orqali)`;
        } else if (todayAtt.status === "Ketdi") {
          todayText = `⬅️ *Kelgan:* ${todayAtt.checkIn || "08:00"} | *Ketgan:* ${todayAtt.checkOut || "17:30"}`;
        } else if (todayAtt.status === "Sababli") {
          todayText = `⚠️ *Kelmagan (Sababli):* ${todayAtt.reason || "Shaxsiy sabab"}`;
        }
      }

      return {
        replyText: `📅 *DAVOMAT STATISTIKASI*\n\n📍 *Bugungi holat:* \n${todayText}\n\n📊 *Oylik statistika (Iyun/Iyul):*\n• Kelgan kunlar: *18 kun*\n• Kelmagan (sababli): *2 kun*\n• Kechikishlar: *1 kun*`,
        replyMarkup: getMainMenuMarkup()
      };

    case "🍽 Ovqatlar":
    case "Ovqatlar":
    case "ovqatlar":
    case "ovqat":
    case "taomnoma":
      const todayPlan = dbState.mealPlans[0];
      if (!todayPlan) {
        return { replyText: "🍽 Bugungi taomnoma hali yuklanmadi.", replyMarkup: getMainMenuMarkup() };
      }
      return {
        replyText: `🍲 *BUGUNGI TAOMNOMA*\n\n🍞 *Nonushta:* ${todayPlan.breakfast?.title || 'Sutli bo\'tqa'}\n🔥 Kaloriya: _${todayPlan.breakfast?.calories || 250} kcal_ | Protein: _${todayPlan.breakfast?.protein || 8}g_\n\n🍖 *Tushlik:* ${todayPlan.lunch?.title || 'Karam sho\'rva'}\n🔥 Kaloriya: _${todayPlan.lunch?.calories || 450} kcal_ | Protein: _${todayPlan.lunch?.protein || 18}g_\n\n🥣 *Kechki ovqat:* ${todayPlan.dinner?.title || 'Zapekanka'}\n🔥 Kaloriya: _${todayPlan.dinner?.calories || 300} kcal_ | Protein: _${todayPlan.dinner?.protein || 10}g_\n\n🤖 *AI Tahlil:* \n_${todayPlan.breakfast?.aiComment || 'Bolalar uchun juda foydali'}_`,
        replyMarkup: getMainMenuMarkup()
      };

    case "🎨 Mashg'ulotlar":
    case "Mashg'ulotlar":
    case "mashg'ulotlar":
    case "mashg'ulot":
    case "mashgulot":
    case "mashgulotlar":
    case "darslar":
      const act = dbState.dailyActivities.find(a => a.childId === child.id);
      if (!act) {
        return { replyText: "🎨 Bugun dars mashg'ulotlari haqida ma'lumot kiritilmadi.", replyMarkup: getMainMenuMarkup() };
      }
      return {
        replyText: `🎨 *BUGUNGI MASHG'ULOTLAR*\n\nFarzandingiz bugun quyidagi dars va o'yinlarda faol qatnashdi:\n\n${act.activities.map((a: string, i: number) => `${i + 1}. *${a}*`).join("\n")}\n\n📸 Kun davomida olingan rasmlarni guruh telegram kanalimiz orqali ko'rishingiz mumkin!`,
        replyMarkup: getMainMenuMarkup()
      };

    case "😊 Faollik":
    case "Faollik":
    case "faollik":
    case "baholar": {
      const act = dbState.dailyActivities.find(a => a.childId === child.id);
      if (!act) {
        return { replyText: "😊 Bugun faollik baholari hali belgilanmadi.", replyMarkup: getMainMenuMarkup() };
      }

      const stars = (num: number) => "⭐".repeat(num) + "☆".repeat(5 - num);

      return {
        replyText: `😊 *FARZANDINGIZ FAOLLIGI (BUGUN)*\n\n🔥 *Darsdagi faollik:* ${stars(act.engagement)}\n💬 *Muloqot va nutq:* ${stars(act.communication)}\n🙌 *Intizom:* ${stars(act.discipline)}\n🍲 *Ovqat yeyishi:* ${stars(act.feeding)}\n😴 *Kechki uyqu:* ${act.sleep} soat\n\n📝 *Tarbiyachi izohi:* \n_"${act.teacherNote || 'Bugun juda yaxshi qatnashdi.'}"_`,
        replyMarkup: getMainMenuMarkup()
      };
    }

    case "💳 To'lov":
    case "To'lov":
    case "to'lov":
    case "tolov":
    case "moliya": {
      const childPays = dbState.payments.filter(p => p.childId === child.id);
      const lastPay = childPays[childPays.length - 1];

      let payStatusText = "🟢 Qarzdorlik mavjud emas.";
      if (lastPay && lastPay.status === "Qisman") {
        payStatusText = "🟡 Qarzdorlik mavjud (Iyul oyi uchun 1,000,000 so'm qoldiq).";
      }

      return {
        replyText: `💳 *TO'LOVLAR VA MOLIYA*\n\n💵 *Oylik shartnoma:* 1,500,000 UZS\n📊 *To'lov holati:* ${payStatusText}\n\n🕒 *Oxirgi to'lov tarixi:*\n• Sana: *${lastPay?.date || 'Noma\'lum'}*\n• Miqdori: *${lastPay ? lastPay.amount.toLocaleString() : '0'} UZS*\n• Turi: *${lastPay?.paymentType || 'Click'}*\n• Oy: *${lastPay?.month || 'Iyul'}*`,
        replyMarkup: getMainMenuMarkup()
      };
    }

    case "💬 Shikoyat":
    case "Shikoyat":
    case "shikoyat":
    case "ariza":
      state.step = "awaiting_complaint";
      return {
        replyText: `💬 *SHIKOYAT VA TAKLIF YUBORISH*\n\nIltimos, taklif yoki shikoyat matnini yozib yuboring. \n\nSizning xabaringiz to'g'ridan-to'g'ri bog'cha direktori ekraniga yetkaziladi va mutlaqo sir saqlanadi.`,
        replyMarkup: { force_reply: true }
      };

    case "☎️ Aloqa":
    case "Aloqa":
    case "aloqa":
    case "kontakt":
      return {
        replyText: `☎️ *BOG'LANISH VA ALOQA*\n\n🏢 *Bog'cha nomi:* Nihol AI Bog'chasi\n📞 *Telefon:* +998 71 123-45-67\n📍 *Manzil:* Toshkent sh., Chilonzor tumani, 5-mavze, 12-uy.\n👤 *Direktor:* Karimov Shaxzod Baxtiyorovich\n\nSavollaringiz bo'lsa, istalgan vaqtda qo'ng'iroq qilishingiz mumkin!`,
        replyMarkup: getMainMenuMarkup()
      };

    default:
      return {
        replyText: `Tushunarsiz buyruq. Iltimos, menyu tugmalaridan foydalaning.`,
        replyMarkup: getMainMenuMarkup()
      };
  }
}

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: any) {
  let recipientName = "Noma'lum foydalanuvchi";
  if (chatId === "SIM-DIRECTOR") {
    recipientName = "Bog'cha Direktori";
  } else if (chatId === "SIM-PARENT") {
    recipientName = "Karimova Madina (Ota-ona)";
  } else {
    const child = dbState.children.find(c => c.telegramChatId === chatId);
    if (child) {
      recipientName = `${child.name} (Ota-ona)`;
    } else {
      const emp = dbState.employees.find(e => e.telegramChatId === chatId);
      if (emp) {
        recipientName = `${emp.name} (${emp.role})`;
      } else {
        recipientName = `Telegram Chat: ${chatId}`;
      }
    }
  }

  if (chatId.startsWith("SIM-")) {
    simulatedTelegramMessages.push({
      chatId,
      text,
      replyMarkup,
      timestamp: formatTimeHHMM()
    });
    addTelegramApiLog("OUTGOING", "sendMessage (SIM)", { chat_id: chatId, text }, 200);

    dbState.telegramNotifications.unshift({
      id: `TG-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      chatId,
      recipientName,
      message: text,
      timestamp: new Date().toLocaleString(),
      status: "Yuborildi"
    });
    if (dbState.telegramNotifications.length > 100) dbState.telegramNotifications.pop();
    saveLocalDb();
    return;
  }

  const token = getTelegramBotToken();
  if (!token) {
    addTelegramApiLog("OUTGOING", "sendMessage (REAL)", { chat_id: chatId, text, error: "No Token" }, 401);
    dbState.telegramNotifications.unshift({
      id: `TG-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      chatId,
      recipientName,
      message: text,
      timestamp: new Date().toLocaleString(),
      status: "Xatolik"
    });
    if (dbState.telegramNotifications.length > 100) dbState.telegramNotifications.pop();
    saveLocalDb();
    return;
  }

  try {
    const payload: any = {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const success = res.status === 200;
    addTelegramApiLog("OUTGOING", "sendMessage (REAL)", payload, res.status);

    dbState.telegramNotifications.unshift({
      id: `TG-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      chatId,
      recipientName,
      message: text,
      timestamp: new Date().toLocaleString(),
      status: success ? "Yuborildi" : "Xatolik"
    });
    if (dbState.telegramNotifications.length > 100) dbState.telegramNotifications.pop();
    saveLocalDb();
  } catch (e: any) {
    console.error("Error sending message to Telegram API:", e);
    addTelegramApiLog("OUTGOING", "sendMessage (REAL)", { chat_id: chatId, text, error: e.message }, 500);

    dbState.telegramNotifications.unshift({
      id: `TG-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      chatId,
      recipientName,
      message: text,
      timestamp: new Date().toLocaleString(),
      status: "Xatolik"
    });
    if (dbState.telegramNotifications.length > 100) dbState.telegramNotifications.pop();
    saveLocalDb();
  }
}

export async function handleTelegramUpdate(update: any) {
  if (update.message && update.message.text) {
    const chatId = update.message.chat.id.toString();
    const text = update.message.text;
    const senderName = update.message.from ? `${update.message.from.first_name} ${update.message.from.last_name || ""}`.trim() : "Ota-ona";

    addTelegramApiLog("INCOMING", "messageReceived (REAL)", { chatId, text, senderName }, 200);
    const result = await processBotMessage(chatId, text, senderName);
    await sendTelegramMessage(chatId, result.replyText, result.replyMarkup);
  }
}

export async function startTelegramBot() {
  const token = getTelegramBotToken();
  if (!token || token.includes("YOUR_")) {
    console.log("[Telegram Bot] Real-world token is not set. Simulator-only mode.");
    return;
  }

  console.log(`[Telegram Bot] Starting long polling loop using token prefix ${token.split(':')[0]}...`);
  let lastUpdateId = 0;

  try {
    console.log("[Telegram Bot] Deleting active webhooks...");
    const delRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
    if (delRes.ok) {
      console.log("[Telegram Bot] Webhook deleted successfully. Ready for getUpdates.");
    }
  } catch (err: any) {
    console.warn("[Telegram Bot] deleteWebhook failed:", err.message);
  }

  try {
    const baseUrl = process.env.APP_URL || "https://ais-pre-5gfoznatixswdwsf4i7weo-539451072809.asia-east1.run.app";
    const webAppUrl = `${baseUrl}/parent-portal?chatId=SIM-PARENT`;
    console.log(`[Telegram Bot] Programmatically updating Telegram Menu Button WebApp URL to: ${webAppUrl}`);
    const menuRes = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: "Mini-Ilova",
          web_app: {
            url: webAppUrl
          }
        }
      })
    });
    if (menuRes.ok) {
      console.log("[Telegram Bot] Persistent Chat Menu Button WebApp URL updated successfully!");
    } else {
      const errText = await menuRes.text();
      console.warn("[Telegram Bot] setChatMenuButton failed:", errText);
    }
  } catch (err: any) {
    console.warn("[Telegram Bot] Failed to setChatMenuButton dynamically:", err.message);
  }

  try {
    const initRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=1&offset=-1`);
    if (initRes.ok) {
      const initData = await initRes.json();
      if (initData.ok && initData.result && initData.result.length > 0) {
        lastUpdateId = initData.result[0].update_id;
        console.log(`[Telegram Bot] Polling offset initialized to latest: ${lastUpdateId}`);
        addTelegramApiLog("INCOMING", "getUpdates (init)", `Initialized offset to latest ${lastUpdateId}`, 200);
      }
    }
  } catch (err: any) {
    console.warn("[Telegram Bot] Backlog init offset bypass failed:", err.message);
  }

  async function poll() {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.result) {
          for (const update of data.result) {
            lastUpdateId = update.update_id;
            await handleTelegramUpdate(update);
          }
        }
      } else {
        addTelegramApiLog("INCOMING", "getUpdates", `Failed with status ${res.status}`, res.status);
      }
    } catch (err: any) {
      console.error("[Telegram Poll Error]:", err.message);
      addTelegramApiLog("INCOMING", "getUpdates", `Network Error: ${err.message}`, 500);
    }
    setTimeout(poll, 1500);
  }

  poll();
}
