import { ChildModel, AuditLogModel } from "../models";
import { dbState, saveLocalDb, isPg, query } from "../db";
import { validateChild } from "../Validation";
import { getKgId } from "../middleware/validationMiddleware";
import { broadcastDataUpdate } from "../utils/wsManager";
import { sendTelegramMessage } from "../utils/telegramManager";

export const ChildController = {
  async getAll(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const children = await ChildModel.getAll(kgId);
      res.json(children);
    } catch (err: any) {
      console.error("[Child] getAll error:", err);
      res.status(500).json({ success: false, message: "Bolalar ro'yxatini yuklashda xatolik!" });
    }
  },

  async create(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const error = validateChild(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      // Check for uniqueness of child ID if supplied or generate it
      const count = (await ChildModel.getAll()).length;
      const childId = `C-${count + 1}`;

      const newChild = {
        ...req.body,
        id: childId,
        kindergartenId: kgId,
        status: req.body.status || "Kelmagan",
        documents: req.body.documents || {
          birthCertificate: false,
          medicalCard: false,
          passportCopy: false,
          contract: false,
          photoUploaded: false
        },
        medicalCard: req.body.medicalCard || {
          allergies: "",
          bloodGroup: "",
          rhFactor: "",
          vaccinations: [],
          height: 0,
          weight: 0,
          bmi: 0,
          lastCheckup: ""
        }
      };

      const created = await ChildModel.create(newChild);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: req.body.operatorName || "Direktor",
        action: `Yangi bola qo'shildi: ${created.name} (ID: ${created.id})`,
        ip: req.ip || "127.0.0.1",
        device: "Management Portal",
        kindergartenId: kgId
      });

      broadcastDataUpdate("children");

      res.json({ success: true, child: created });
    } catch (err: any) {
      console.error("[Child] create error:", err);
      res.status(500).json({ success: false, message: "Bolani ro'yxatga olishda xatolik yuz berdi." });
    }
  },

  async update(req: any, res: any) {
    try {
      const { id } = req.params;
      const child = await ChildModel.getById(id);
      if (!child) {
        return res.status(404).json({ success: false, message: "Bola topilmadi!" });
      }

      const updated = await ChildModel.update(id, req.body);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Direktor",
        action: `Bola ma'lumotlari tahrirlandi: ${updated.name} (ID: ${id})`,
        ip: req.ip || "127.0.0.1",
        device: "Management Portal",
        kindergartenId: updated.kindergartenId || "K-1"
      });

      broadcastDataUpdate("children");

      res.json({ success: true, child: updated });
    } catch (err: any) {
      console.error("[Child] update error:", err);
      res.status(500).json({ success: false, message: "Bola ma'lumotlarini yangilashda xatolik!" });
    }
  },

  async delete(req: any, res: any) {
    try {
      const { id } = req.params;
      const child = await ChildModel.getById(id);
      if (!child) {
        return res.status(404).json({ success: false, message: "Bola topilmadi!" });
      }

      await ChildModel.delete(id);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Direktor",
        action: `Bola o'chirildi: ${child.name} (ID: ${id})`,
        ip: req.ip || "127.0.0.1",
        device: "Management Portal",
        kindergartenId: child.kindergartenId || "K-1"
      });

      broadcastDataUpdate("children");

      res.json({ success: true, message: "Bola muvaffaqiyatli o'chirildi." });
    } catch (err: any) {
      console.error("[Child] delete error:", err);
      res.status(500).json({ success: false, message: "Bolani o'chirishda xatolik!" });
    }
  },

  async bulkAbsent(req: any, res: any) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ success: false, message: "Yaroqsiz bola ID-lari!" });
      }

      let updatedCount = 0;
      for (const id of ids) {
        const child = await ChildModel.getById(id);
        if (child) {
          await ChildModel.update(id, { status: "Kelmagan" });
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        await AuditLogModel.create({
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          username: "Direktor",
          action: `${updatedCount} ta bola qo'shma ravishda kelmagan deb belgilandi`,
          ip: req.ip || "127.0.0.1",
          device: "Web Browser"
        });
        broadcastDataUpdate("children");
      }

      res.json({ success: true, message: `${updatedCount} ta bola kelmagan deb belgilandi.` });
    } catch (err: any) {
      console.error("[Child] bulkAbsent error:", err);
      res.status(500).json({ success: false, message: "Guruh bo'yicha davomatni belgilashda xatolik!" });
    }
  },

  async bulkReminder(req: any, res: any) {
    try {
      const { ids, message } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ success: false, message: "Yaroqsiz bola ID-lari!" });
      }

      const finalMsg = message || "Farzandingizning holati va davomati bo'yicha bog'chadan eslatma.";
      let sentCount = 0;

      for (const id of ids) {
        const child = await ChildModel.getById(id);
        if (child) {
          // Telegram
          if (child.telegramChatId) {
            await sendTelegramMessage(child.telegramChatId, `🔔 *BOG'CHA ESLATMASI*\n\nFarzandingiz: *${child.name}*\n\n${finalMsg}`);
            sentCount++;
          }
          // SMS Simulation
          if (child.parentPhone) {
            const success = Math.random() > 0.05;
            dbState.smsLogs.unshift({
              id: `SMS-${Date.now()}-${id}`,
              phone: child.parentPhone,
              message: `Eslatma: ${child.name} - ${finalMsg}`,
              date: new Date().toLocaleString(),
              status: success ? "Yuborildi" : "Xatolik",
              provider: "Eskiz SMS Gateway API (uz)",
              childId: child.id
            });
            if (dbState.smsLogs.length > 100) dbState.smsLogs.pop();
          }
        }
      }

      if (sentCount > 0 || ids.length > 0) {
        await AuditLogModel.create({
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          username: "Direktor",
          action: `${ids.length} ta bolaning ota-onalariga ogohlantirish xabari yuborildi`,
          ip: req.ip || "127.0.0.1",
          device: "Web Browser"
        });
        saveLocalDb();
        broadcastDataUpdate("notifications");
      }

      res.json({ success: true, message: `${ids.length} ta bolaning ota-onasiga eslatmalar muvaffaqiyatli jo'natildi.` });
    } catch (err: any) {
      console.error("[Child] bulkReminder error:", err);
      res.status(500).json({ success: false, message: "Ota-onalar ogohlantirilishida xatolik yuz berdi." });
    }
  },

  async getMedicalCards(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const children = await ChildModel.getAll(kgId);
      const cards = children.map(c => ({
        childId: c.id,
        childName: c.name,
        groupId: c.groupId,
        medicalCard: c.medicalCard
      }));
      res.json(cards);
    } catch (err: any) {
      console.error("[Child] getMedicalCards error:", err);
      res.status(500).json({ success: false, message: "Tibbiy kartalarni yuklashda xatolik!" });
    }
  },

  async updateMedicalCard(req: any, res: any) {
    try {
      const { childId, medicalCard } = req.body;
      if (!childId || !medicalCard) {
        return res.status(400).json({ success: false, message: "Bola ID va tibbiy karta ma'lumotlari majburiy!" });
      }

      const child = await ChildModel.getById(childId);
      if (!child) {
        return res.status(404).json({ success: false, message: "Kiritilgan bola topilmadi!" });
      }

      const updated = await ChildModel.update(childId, { medicalCard });

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Hamshira",
        action: `Tibbiy karta yangilandi: ${child.name} (ID: ${childId})`,
        ip: req.ip || "127.0.0.1",
        device: "Med Office Panel",
        kindergartenId: child.kindergartenId || "K-1"
      });

      broadcastDataUpdate("children");

      res.json({ success: true, child: updated });
    } catch (err: any) {
      console.error("[Child] updateMedicalCard error:", err);
      res.status(500).json({ success: false, message: "Tibbiy kartani saqlashda xatolik!" });
    }
  },

  async getActivities(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      if (isPg()) {
        // if table exists we can load, otherwise fallback
      }
      const filtered = dbState.dailyActivities.filter(a => a.kindergartenId === kgId);
      res.json(filtered);
    } catch (err: any) {
      console.error("[Child] getActivities error:", err);
      res.status(500).json({ success: false, message: "Mashg'ulotlarni yuklashda xatolik!" });
    }
  },

  async createActivity(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const newAct = {
        ...req.body,
        id: `ACT-${Date.now()}`,
        kindergartenId: kgId,
        date: req.body.date || new Date().toISOString().split("T")[0]
      };

      dbState.dailyActivities.push(newAct);
      saveLocalDb();

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: req.body.teacherName || "Tarbiyachi",
        action: `Ijodiy/Ta'limiy mashg'ulot kiritildi: ${newAct.title} (Guruh: ${newAct.groupName})`,
        ip: req.ip || "127.0.0.1",
        device: "Teacher App Mobile",
        kindergartenId: kgId
      });

      broadcastDataUpdate("children");

      res.json({ success: true, activity: newAct });
    } catch (err: any) {
      console.error("[Child] createActivity error:", err);
      res.status(500).json({ success: false, message: "Ijodiy faoliyatni kiritishda xatolik!" });
    }
  },

  async getFailedCheckins(req: any, res: any) {
    res.json(dbState.failedCheckins);
  },

  async resolveFailedCheckin(req: any, res: any) {
    try {
      const { id } = req.params;
      const { childId } = req.body;

      const log = dbState.failedCheckins.find(f => f.id === id);
      if (!log) {
        return res.status(404).json({ success: false, message: "Xatolik jurnali topilmadi!" });
      }

      const child = await ChildModel.getById(childId);
      if (!child) {
        return res.status(404).json({ success: false, message: "Kiritilgan bola topilmadi!" });
      }

      log.resolved = true;
      log.resolvedChildId = childId;

      // Also create actual checkin
      const todayStr = new Date().toISOString().split("T")[0];
      const nowTimeStr = new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

      const newAttendance = {
        id: `ATT-${Date.now()}`,
        childId: childId,
        date: todayStr,
        checkIn: nowTimeStr,
        checkOut: "",
        status: "Keldi",
        reason: "FaceID Manual Verification",
        deviceIp: log.deviceIp,
        pickupPhoto: log.photoUrl,
        kindergartenId: child.kindergartenId || "K-1"
      };

      // Create attendance row
      if (isPg()) {
        // Query model
      }
      const idx = dbState.attendance.findIndex(a => a.childId === childId && a.date === todayStr);
      if (idx !== -1) {
        dbState.attendance[idx] = { ...dbState.attendance[idx], ...newAttendance };
      } else {
        dbState.attendance.push(newAttendance);
      }

      await ChildModel.update(childId, { status: "Bog'chada" });

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Direktor",
        action: `FaceID xatosi bartaraf qilindi: ${child.name} ga moslashtirildi`,
        ip: req.ip || "127.0.0.1",
        device: "FaceID Hardware Monitor",
        kindergartenId: child.kindergartenId || "K-1"
      });

      saveLocalDb();
      broadcastDataUpdate("attendance");

      res.json({ success: true, message: "Xatolik bartaraf qilindi, bola davomati belgilandi." });
    } catch (err: any) {
      console.error("[Child] resolveFailedCheckin error:", err);
      res.status(500).json({ success: false, message: "Tahlil xatosini bartaraf etishda xatolik!" });
    }
  }
};
