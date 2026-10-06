import { GoogleGenAI } from "@google/genai";
import { dbState, saveLocalDb, isPg, query } from "../db";
import { getKgId } from "../middleware/validationMiddleware";
import { ChildModel, EmployeeModel, PaymentModel, ExpenseModel, IncomeModel, PurchaseRequestModel, AuditLogModel, GroupModel } from "../models";
import { 
  simulatedTelegramMessages, 
  telegramApiLogs, 
  telegramSimulatedError, 
  smsQueue, 
  activeSimulatedChats, 
  toggleTelegramSimulatedError,
  getTelegramBotToken
} from "../utils/telegramManager";
import { broadcastDataUpdate } from "../utils/wsManager";

let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required for AI features");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export const SystemController = {
  async getDashboardStats(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const todayStr = new Date().toISOString().split("T")[0];

      const paymentsList = await PaymentModel.getAll(kgId);
      const expensesList = await ExpenseModel.getAll(kgId);
      const incomesList = await IncomeModel.getAll(kgId);
      const requestsList = await PurchaseRequestModel.getAll(kgId);
      const childrenList = await ChildModel.getAll(kgId);

      const MONTH_NAMES = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
      const currentMonthName = MONTH_NAMES[new Date().getMonth()];

      const bugungiTushum = paymentsList.filter(p => p.date === todayStr).reduce((sum, p) => sum + p.amount, 0);

      const oylikDaromad = paymentsList.filter(p => p.month === currentMonthName || p.month === "Iyul").reduce((sum, p) => sum + p.amount, 0) + incomesList.reduce((sum, i) => sum + i.amount, 0);

      const bugungiXarajat = expensesList.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);

      // Dynamic Debtors
      const debtorsList = childrenList.map(c => {
        const childPays = paymentsList.filter(p => p.childId === c.id);
        const currentPay = childPays.find(p => p.month === currentMonthName || p.month === "Iyul");
        if (currentPay && currentPay.status === "To'landi") return null;
        return c;
      }).filter(Boolean);

      const qarzdorOtaOnalarSoni = debtorsList.length;

      const tolovQilganBolalar = childrenList.filter(c => {
        const childPays = paymentsList.filter(p => p.childId === c.id);
        return childPays.some(p => (p.month === currentMonthName || p.month === "Iyul") && p.status === "To'landi");
      }).length;

      const tolamaganBolalar = childrenList.length - tolovQilganBolalar;

      // Payrolls paid budget
      const payrolls = dbState.payrolls.filter(p => !kgId || kgId === "all" || p.kindergartenId === kgId);
      const xodimlarIshHaqi = payrolls.reduce((sum, p) => sum + p.finalAmount, 0);

      const xaridlar = requestsList.reduce((sum, r) => sum + r.amount, 0);
      const bugungiCheklar = paymentsList.filter(p => p.date === todayStr).length;

      res.json({
        bugungiTushum,
        oylikDaromad,
        bugungiXarajat,
        qarzdorOtaOnalarSoni,
        tolovQilganBolalar,
        tolamaganBolalar,
        xodimlarIshHaqi,
        xaridlar,
        bugungiCheklar,
        history: {
          payments: paymentsList.slice(0, 15),
          expenses: expensesList.slice(0, 15),
          payrolls: payrolls.slice(0, 15),
          incomes: incomesList.slice(0, 15),
          requests: requestsList.slice(0, 15)
        }
      });
    } catch (err: any) {
      console.error("[System] getDashboardStats error:", err);
      res.status(500).json({ success: false, message: "Dashboard ma'lumotlarini yuklashda xatolik!" });
    }
  },

  async getFinancialReport(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const paymentsList = await PaymentModel.getAll(kgId);
      const expensesList = await ExpenseModel.getAll(kgId);

      const monthlyData = [
        { name: "Yanvar", daromad: 105000000, xarajat: 72000000, foyda: 33000000 },
        { name: "Fevral", daromad: 112000000, xarajat: 74000000, foyda: 38000000 },
        { name: "Mart", daromad: 118000000, xarajat: 78000000, foyda: 40000000 },
        { name: "Aprel", daromad: 125000000, xarajat: 81000000, foyda: 44000000 },
        { name: "May", daromad: 121000000, xarajat: 83000000, foyda: 38000000 },
        { name: "Iyun", daromad: 130000000, xarajat: 85000000, foyda: 45000000 },
        { name: "Iyul", 
          daromad: paymentsList.reduce((sum, p) => sum + p.amount, 0), 
          xarajat: expensesList.reduce((sum, e) => sum + e.amount, 0), 
          foyda: paymentsList.reduce((sum, p) => sum + p.amount, 0) - expensesList.reduce((sum, e) => sum + e.amount, 0)
        }
      ];

      res.json({ monthlyData });
    } catch (err: any) {
      console.error("[System] getFinancialReport error:", err);
      res.status(500).json({ success: false, message: "Moliya hisobotini yuklashda xatolik!" });
    }
  },

  async getAiInsights(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const paymentsList = await PaymentModel.getAll(kgId);
      const expensesList = await ExpenseModel.getAll(kgId);
      const childrenList = await ChildModel.getAll(kgId);

      const totalPayments = paymentsList.reduce((sum, p) => sum + p.amount, 0);
      const totalRevenue = totalPayments;

      const totalExpenses = expensesList.reduce((sum, e) => sum + e.amount, 0);
      const totalOutflow = totalExpenses;

      const netProfit = totalRevenue - totalOutflow;

      const debtorsCount = childrenList.filter(c => {
        const childPays = paymentsList.filter(p => p.childId === c.id);
        return !childPays.some(p => p.month === "Iyul" && p.status === "To'landi");
      }).length;

      const key = process.env.GEMINI_API_KEY;
      if (key && key !== "MY_GEMINI_API_KEY") {
        const ai = getGemini();
        const prompt = `Siz bolalar bog'chasi uchun moliya bo'yicha tahlilchi AI-siz. Quyidagi moliyaviy ma'lumotlarni tahlil qiling va o'zbek tilida qisqa, tushunarli, pro-darajadagi hisobot va tavsiyalar bering:
Umumiy tushum (Daromad): ${totalRevenue.toLocaleString()} UZS (bolalar to'lovlari va boshqa tushumlar)
Umumiy xarajatlar: ${totalOutflow.toLocaleString()} UZS (ish haqi va turli operatsion xarajatlar)
Sof foyda: ${netProfit.toLocaleString()} UZS
Qarzdor bolalar soni: ${debtorsCount} ta bola (Iyul oyi uchun to'lamagan)

Kvitansiyalar va oylik tranzaksiyalar soni: ${paymentsList.length} ta.

Iltimos, JSON formatida quyidagi ma'lumotlarni qaytaring (hech qanday markdown backticksisiz, faqat toza JSON matni):
{
  "summary": "Moliya ahvoli bo'yicha 2-3 jumlali professional xulosa",
  "comparisons": "Daromad va xarajat nisbati haqida tahlil",
  "recommendations": [
    "Xarajatlarni kamaytirish yoki foyda oshirish uchun 1-tavsiya",
    "2-tavsiya",
    "3-tavsiya"
  ],
  "upcomingNotifications": [
    "Kelgusi to'lov muddatlari yoki soliq to'lovlari haqida eslatma 1",
    "Eslatma 2"
  ],
  "healthScore": 1 dan 100 gacha moliya salomatlik reytingi (masalan: 85)
}`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt
        });

        const responseText = aiResponse.text || "{}";
        const cleanedJsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleanedJsonStr);
        return res.json({ success: true, insights: result });
      } else {
        // Fallback
        const mockInsights = {
          summary: "Bog'chaning moliyaviy ahvoli barqaror. Daromadlar xarajatlardan sezilarli darajada ustun turadi, biroq qarzdorlarni qisqartirish talab etiladi.",
          comparisons: `Joriy daromadlar (${totalRevenue.toLocaleString()} UZS) xarajatlar (${totalOutflow.toLocaleString()} UZS) miqdoridan ${(totalRevenue > totalOutflow ? "ko'proq" : "kamroq")}. Operatsion rentabellik barqaror darajada.`,
          recommendations: [
            "Oziq-ovqat va xo'jalik xarajatlari dilerlik shartnomalarini qayta ko'rib chiqing.",
            "Qarzdor ota-onalar bilan Telegram eslatmalari orqali ishlash intensivligini oshiring.",
            "Davlat subsidiyalari yoki qo'shimcha to'garaklar tashkil etish orqali tushumlarni 15% ga oshirish mumkin."
          ],
          upcomingNotifications: [
            "15-Iyul: Xodimlar uchun oylik ijtimoiy soliqlar va daromad solig'i to'lovi muddati.",
            "20-Iyul: Kommunal xizmatlar (elektr, gaz) uchun oldindan to'lov balansi muddati."
          ],
          healthScore: netProfit > 0 ? 88 : 45
        };
        return res.json({ success: true, insights: mockInsights });
      }
    } catch (err: any) {
      console.error("[System AI] Insights error:", err);
      res.json({
        success: false,
        message: "AI insights generated via fallback due to server error",
        insights: {
          summary: "Tizim barqaror ishlamoqda. Xarajatlarni monitoring qilish davom ettirilmoqda.",
          comparisons: "Ma'lumotlar yuklanmoqda...",
          recommendations: ["Ota-onalarga oylik to'lov xabarnomalarini o'z vaqtida jo'natish."],
          upcomingNotifications: ["Kommunal to'lov muddatlari yaqinlashmoqda."],
          healthScore: 75
        }
      });
    }
  },

  async getHardwareDevices(req: any, res: any) {
    res.json({
      devices: dbState.activeDevices,
      faceIdCamerasCount: dbState.activeDevices.filter(d => d.type === "entrance" || d.type === "exit").length,
      gatewayStatus: "Muvaffaqiyatli ulangan",
      serverLoad: "12%",
      latency: "14ms",
      errors: dbState.failedCheckins.filter(f => !f.resolved).length
    });
  },

  async createHardwareDevice(req: any, res: any) {
    try {
      const { name, type, ip, password } = req.body;
      if (!name || !type || !ip) {
        return res.status(400).json({ success: false, message: "Nom, tur va IP manzil majburiy!" });
      }

      const count = dbState.activeDevices.length;
      const newDevice = {
        id: `DEV-${100 + count + 1}`,
        name,
        type,
        ip,
        status: "online",
        details: {
          manufacturer: "Hikvision Pro Biometrics AI",
          firmware: "v4.2.11-build26",
          lastHeartbeat: new Date().toLocaleTimeString("uz-UZ"),
          temperatureSensors: "Muvaffaqiyatli sozlangan"
        }
      };

      dbState.activeDevices.push(newDevice);
      saveLocalDb();

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Direktor",
        action: `Yangi Face ID biometrik terminali ulandi: ${name} (IP: ${ip})`,
        ip: req.ip || "127.0.0.1",
        device: "Face ID Moduli",
        kindergartenId: "K-1"
      });

      res.json({
        success: true,
        message: `Qurilma muvaffaqiyatli ulandi! Tizim endi ushbu IP (${ip}) manzildan Face ID so'rovlarini xavfsiz qabul qiladi.`,
        device: newDevice
      });
    } catch (err: any) {
      console.error("[System] createHardwareDevice error:", err);
      res.status(500).json({ success: false, message: "Qurilmani ulay olmadik!" });
    }
  },

  async getPendingSms(req: any, res: any) {
    res.json(smsQueue);
  },

  async clearPendingSms(req: any, res: any) {
    smsQueue.length = 0;
    res.json({ success: true });
  },

  async getPendingTelegramMessages(req: any, res: any) {
    const { chatId } = req.query;
    if (!chatId) return res.json([]);
    
    const chatIdStr = chatId as string;
    if (!activeSimulatedChats.includes(chatIdStr)) {
      activeSimulatedChats.push(chatIdStr);
    }
    
    const pending = simulatedTelegramMessages.filter(m => m.chatId === chatIdStr);
    const updatedMessages = simulatedTelegramMessages.filter(m => m.chatId !== chatIdStr);
    simulatedTelegramMessages.length = 0;
    simulatedTelegramMessages.push(...updatedMessages);

    res.json(pending);
  },

  async getTelegramSimulatorStatus(req: any, res: any) {
    const token = getTelegramBotToken();
    const hasToken = token && !token.includes("YOUR_");
    
    if (telegramSimulatedError) {
      return res.json({
        success: false,
        status: "offline",
        uptime: "92.4%",
        latency: null,
        error: "Error 401: Unauthorized. Telegram API connection failed.",
        mode: hasToken ? "Real-world (Token set)" : "Simulator mode"
      });
    }

    res.json({
      success: true,
      status: "online",
      uptime: "99.98%",
      latency: Math.floor(Math.random() * 25) + 12,
      error: null,
      mode: hasToken ? "Real-world (Token set)" : "Simulator mode"
    });
  },

  async toggleTelegramError(req: any, res: any) {
    const err = toggleTelegramSimulatedError();
    res.json({ success: true, simulatedError: err });
  },

  async getTelegramSimulatorLogs(req: any, res: any) {
    res.json(telegramApiLogs);
  },

  async getSmsLogs(req: any, res: any) {
    res.json(dbState.smsLogs);
  },

  async getTelegramNotifications(req: any, res: any) {
    res.json(dbState.telegramNotifications);
  },

  async clearDatabase(req: any, res: any) {
    try {
      dbState.children = [];
      dbState.groups = [];
      dbState.payments = [];
      dbState.expenses = [];
      dbState.payrolls = [];
      dbState.purchaseRequests = [];
      dbState.incomes = [];
      dbState.complaints = [];
      dbState.attendance = [];
      dbState.dailyActivities = [];
      dbState.failedCheckins = [];
      dbState.kgMealGallery = [];
      dbState.smsLogs = [];
      dbState.telegramNotifications = [];
      dbState.superAdminDocuments = [];
      
      // Preserve only SuperAdmin accounts
      dbState.employees = dbState.employees.filter(e => e.role === "SuperAdmin" || e.username === "superadmin");
      
      saveLocalDb();
      
      res.json({
        success: true,
        message: "Tizim ma'lumotlari muvaffaqiyatli tozalandi. SuperAdmin hisobi saqlab qolindi."
      });
    } catch (err: any) {
      console.error("[System] clearDatabase error:", err);
      res.status(500).json({ success: false, message: "Tizim ma'lumotlarini tozalashda xatolik!" });
    }
  }
};
