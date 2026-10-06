import { dbState, saveLocalDb } from "../db";
import { ChildModel, PaymentModel, MealPlanModel, GroupModel } from "../models";

export const ParentController = {
  async getParentPortalData(req: any, res: any) {
    try {
      const { chatId } = req.query;
      if (!chatId) {
        return res.status(400).json({ error: "chatId is required" });
      }
      
      const cId = chatId.toString();
      const children = await ChildModel.getAll();
      
      let child = children.find(c => c.telegramChatId === cId);
      if (!child && cId.startsWith("SIM-")) {
        child = children.find(c => c.id === "B-101"); // simulator fallback
      }

      if (!child) {
        return res.status(404).json({ error: "Ushbu Telegram Chat ID ga bog'langan bola topilmadi. Iltimos, avval bot orqali ro'yxatdan o'ting!" });
      }

      const childKgId = child.kindergartenId || "K-1";
      const kg = dbState.kindergartens.find(k => k.id === childKgId);
      if (kg && kg.parentPortalActive === false) {
        return res.status(403).json({ error: "Ushbu bog'cha uchun ota-ona portali vaqtincha faolsizlantirilgan (Parent portal is deactivated)." });
      }

      const childPays = await PaymentModel.getAll();
      const filteredPays = childPays.filter(p => p.childId === child!.id);

      const childActivities = dbState.dailyActivities.filter(a => a.childId === child!.id);
      const childAttendance = dbState.attendance.filter(a => a.childId === child!.id);
      const childAnnouncements = dbState.publicAnnouncements.filter(a => a.kindergartenId === "all" || a.kindergartenId === childKgId);
      const meals = await MealPlanModel.getAll(childKgId);
      const groups = await GroupModel.getAll();

      res.json({
        child,
        payments: filteredPays,
        meals,
        activities: childActivities,
        groups,
        attendance: childAttendance,
        announcements: childAnnouncements
      });
    } catch (err: any) {
      console.error("[Parent Portal] getParentPortalData error:", err);
      res.status(500).json({ error: "Ota-ona portali ma'lumotlarini yuklashda xatolik!" });
    }
  },

  async incrementAnnouncementView(req: any, res: any) {
    try {
      const { id } = req.params;
      const announcement = dbState.publicAnnouncements.find(a => a.id === id);
      if (announcement) {
        announcement.views = (announcement.views || 0) + 1;
        saveLocalDb();
        return res.json({ success: true, views: announcement.views });
      }
      res.status(404).json({ error: "E'lon topilmadi" });
    } catch (err: any) {
      console.error("[Parent Portal] incrementAnnouncementView error:", err);
      res.status(500).json({ error: "E'lon ko'rishlar sonini yangilashda xatolik!" });
    }
  },

  async linkChild(req: any, res: any) {
    try {
      const { childId, parentPhone, telegramChatId } = req.body;
      if (!telegramChatId) {
        return res.status(400).json({ error: "Telegram Chat ID (telegramChatId) majburiy!" });
      }

      const children = await ChildModel.getAll();
      let child;
      if (childId) {
        const searchId = childId.trim().toUpperCase();
        child = children.find(c => c.id.toUpperCase() === searchId);
      } else if (parentPhone) {
        const searchPhone = parentPhone.trim().replace(/\s+/g, "");
        child = children.find(c => {
          const dbPhone = c.parentPhone ? c.parentPhone.replace(/\D/g, "") : "";
          const queryPhone = searchPhone.replace(/\D/g, "");
          return dbPhone.includes(queryPhone) || queryPhone.includes(dbPhone);
        });
      }

      if (!child) {
        return res.status(404).json({ error: "Kiritilgan ma'lumotlar bo'yicha bog'chadan bola topilmadi! Iltimos, ID (masalan: B-101) yoki telefon raqamingizni tekshirib qaytadan urinib ko'ring." });
      }

      child.telegramChatId = telegramChatId.toString();
      saveLocalDb();

      dbState.auditLogs.unshift({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: `Ota-ona (${child.parentName})`,
        action: `Telegram akkaunt bolaga bog'landi (${child.name}, Chat ID: ${telegramChatId})`,
        ip: req.ip || "127.0.0.1",
        device: "Telegram Mini-App Linker",
        kindergartenId: child.kindergartenId || "K-1"
      });
      saveLocalDb();

      res.json({ success: true, child, message: "Muvaffaqiyatli bog'landi!" });
    } catch (err: any) {
      console.error("[Parent Portal] linkChild error:", err);
      res.status(500).json({ error: "Bolani bog'lashda xatolik yuz berdi!" });
    }
  }
};
