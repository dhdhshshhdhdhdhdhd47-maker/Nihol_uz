import { KindergartenModel, EmployeeModel, ComplaintModel, AuditLogModel, SuperAdminDocumentModel } from "../models";
import { getKgId } from "../middleware/validationMiddleware";
import { dbState, saveLocalDb } from "../db";
import { broadcastDataUpdate } from "../utils/wsManager";

export const SuperAdminController = {
  async getKindergartens(req: any, res: any) {
    try {
      const list = await KindergartenModel.getAll();
      res.json(list);
    } catch (err: any) {
      console.error("[Superadmin] getKindergartens error:", err);
      res.status(500).json({ success: false, message: "Bog'chalar ro'yxatini yuklashda xatolik!" });
    }
  },

  async createKindergarten(req: any, res: any) {
    try {
      const { id, name, address, directorName, directorUsername, phone, capacity } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: "Bog'cha nomi kiritilishi majburiy!" });
      }

      const list = await KindergartenModel.getAll();
      const kgId = id || `K-${Date.now().toString().slice(-4)}`;

      const newKg = {
        id: kgId,
        name,
        address: address || "Toshkent shahri",
        directorName: directorName || "Tayinlanmagan",
        directorUsername: directorUsername || "",
        phone: phone || "+998900000000",
        capacity: Number(capacity || 100),
        status: "Faol",
        createdDate: new Date().toISOString().split("T")[0]
      };

      const created = await KindergartenModel.create(newKg);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Tizim SuperAdmin",
        action: `Yangi bog'cha tashkil etildi: ${name} (ID: ${kgId})`,
        ip: req.ip || "127.0.0.1",
        device: "SuperAdmin Dashboard",
        kindergartenId: kgId
      });

      broadcastDataUpdate("kindergartens");
      res.json({ success: true, kindergarten: created });
    } catch (err: any) {
      console.error("[Superadmin] createKindergarten error:", err);
      res.status(500).json({ success: false, message: "Yangi bog'cha qo'shishda xatolik!" });
    }
  },

  async getDocuments(req: any, res: any) {
    try {
      const list = await SuperAdminDocumentModel.getAll();
      res.json(list);
    } catch (err: any) {
      console.error("[Superadmin] getDocuments error:", err);
      res.status(500).json({ success: false, message: "Hujjatlarni yuklashda xatolik!" });
    }
  },

  async createDocument(req: any, res: any) {
    try {
      const { title, description, category, url, targetAudience } = req.body;
      if (!title || !category) {
        return res.status(400).json({ success: false, message: "Hujjat nomi va toifasi majburiy!" });
      }

      const count = (await SuperAdminDocumentModel.getAll()).length;
      const newDoc = {
        id: `DOC-${Date.now().toString().slice(-4)}-${count + 1}`,
        title,
        description: description || "",
        category,
        url: url || "https://images.unsplash.com/photo-1543269608-fa3d96937649?auto=format&fit=crop&q=80&w=400",
        uploadedAt: new Date().toISOString().split("T")[0],
        targetAudience: targetAudience || "Hamma",
        downloads: 0
      };

      const created = await SuperAdminDocumentModel.create(newDoc);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Tizim SuperAdmin",
        action: `Yangi rasmiy xujjat tarqatildi: ${title}`,
        ip: req.ip || "127.0.0.1",
        device: "SuperAdmin Dashboard",
        kindergartenId: "K-1"
      });

      res.json({ success: true, document: created });
    } catch (err: any) {
      console.error("[Superadmin] createDocument error:", err);
      res.status(500).json({ success: false, message: "Hujjat yuborishda xatolik!" });
    }
  },

  async getComplaints(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const list = await ComplaintModel.getAll(kgId);
      res.json(list);
    } catch (err: any) {
      console.error("[Superadmin] getComplaints error:", err);
      res.status(500).json({ success: false, message: "Murojaat va shikoyatlarni yuklashda xatolik!" });
    }
  },

  async resolveComplaint(req: any, res: any) {
    try {
      const { id, status, parentName, childId, phone, text, kindergartenId } = req.body;

      if (!id) {
        // Create new complaint
        const newCmp = {
          id: `CMP-${Date.now().toString().slice(-4)}`,
          parentName: parentName || "Ota-ona",
          childId: childId || "",
          phone: phone || "",
          text: text || "",
          date: new Date().toISOString().split("T")[0],
          status: "Yangi",
          kindergartenId: kindergartenId || "K-1"
        };

        const created = await ComplaintModel.create(newCmp);
        broadcastDataUpdate("complaints");
        return res.json({ success: true, complaint: created });
      }

      // Resolve existing complaint
      const resolved = await ComplaintModel.update(id, { status: status || "Hal etildi" });
      if (!resolved) {
        return res.status(404).json({ success: false, message: "Shikoyat topilmadi!" });
      }

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Direktor / SuperAdmin",
        action: `Murojaat ko'rib chiqildi: ID ${id} -> Status: ${status || "Hal etildi"}`,
        ip: req.ip || "127.0.0.1",
        device: "SuperAdmin Dashboard",
        kindergartenId: resolved.kindergartenId || "K-1"
      });

      broadcastDataUpdate("complaints");
      res.json({ success: true, complaint: resolved });
    } catch (err: any) {
      console.error("[Superadmin] resolveComplaint error:", err);
      res.status(500).json({ success: false, message: "Murojaatni yangilashda xatolik!" });
    }
  },

  async getAuditLogs(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const list = await AuditLogModel.getAll(kgId);
      res.json(list);
    } catch (err: any) {
      console.error("[Superadmin] getAuditLogs error:", err);
      res.status(500).json({ success: false, message: "Audit jurnallarini yuklashda xatolik!" });
    }
  },

  async createAuditLog(req: any, res: any) {
    try {
      const { user, action, kindergartenId } = req.body;
      const kgId = kindergartenId || getKgId(req);

      const newLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: user || "Noma'lum",
        action: action || "Amal bajarildi",
        ip: req.ip || "127.0.0.1",
        device: "Management Portal",
        kindergartenId: kgId
      };

      const created = await AuditLogModel.create(newLog);
      res.json({ success: true, auditLog: created });
    } catch (err: any) {
      console.error("[Superadmin] createAuditLog error:", err);
      res.status(500).json({ success: false, message: "Audit jurnalini yozishda xatolik!" });
    }
  },

  async assignDirector(req: any, res: any) {
    try {
      const kgId = req.params.id;
      const { name, username, password, phone, passport } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username va parol kiritilishi shart!" });
      }

      const empId = `E-DIR-${Date.now().toString().slice(-6)}`;
      const newDir = {
        id: empId,
        name: name || "Yangi Direktor",
        username: username,
        passwordHash: password,
        role: "Direktor",
        phone: phone || "",
        passport: passport || "",
        kindergartenId: kgId,
        status: "Faol",
        birthDate: "1985-01-01",
        joinedDate: new Date().toISOString().split("T")[0]
      };

      await EmployeeModel.create(newDir);
      await KindergartenModel.update(kgId, {
        directorName: name || "Yangi Direktor",
        directorUsername: username,
        directorPhone: phone || ""
      });

      broadcastDataUpdate("kindergartens");
      broadcastDataUpdate("employees");

      res.json({ success: true, message: "Direktor logini muvaffaqiyatli yaratildi!", director: newDir });
    } catch (err: any) {
      console.error("[Superadmin] assignDirector error:", err);
      res.status(500).json({ success: false, message: "Direktor biriktirishda xatolik!" });
    }
  },

  async updateKindergarten(req: any, res: any) {
    try {
      const { id } = req.params;
      const updated = await KindergartenModel.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Bog'cha topilmadi!" });
      }
      broadcastDataUpdate("kindergartens");
      res.json({ success: true, kindergarten: updated });
    } catch (err: any) {
      console.error("[Superadmin] updateKindergarten error:", err);
      res.status(500).json({ success: false, message: "Bog'cha ma'lumotlarini yangilashda xatolik!" });
    }
  },

  async deleteKindergarten(req: any, res: any) {
    try {
      const { id } = req.params;
      const ok = await KindergartenModel.delete(id);
      if (!ok) {
        return res.status(404).json({ success: false, message: "Bog'cha topilmadi!" });
      }
      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Tizim SuperAdmin",
        action: `Bog'cha o'chirildi (ID: ${id})`,
        ip: req.ip || "127.0.0.1",
        device: "SuperAdmin Dashboard",
        kindergartenId: id
      });
      broadcastDataUpdate("kindergartens");
      res.json({ success: true, message: "Bog'cha muvaffaqiyatli o'chirildi!" });
    } catch (err: any) {
      console.error("[Superadmin] deleteKindergarten error:", err);
      res.status(500).json({ success: false, message: "Bog'chani o'chirishda xatolik!" });
    }
  },

  async togglePortal(req: any, res: any) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const updated = await KindergartenModel.update(id, { parentPortalActive: active });
      broadcastDataUpdate("kindergartens");
      res.json({ success: true, kindergarten: updated });
    } catch (err: any) {
      console.error("[Superadmin] togglePortal error:", err);
      res.status(500).json({ success: false, message: "Portal holatini o'zgartirishda xatolik!" });
    }
  },

  async distributeDocument(req: any, res: any) {
    try {
      const { docId } = req.params;
      const { panels } = req.body;
      const doc = await SuperAdminDocumentModel.getById(docId);
      if (!doc) {
        return res.status(404).json({ success: false, message: "Hujjat topilmadi!" });
      }
      const targetAudience = Array.isArray(panels) ? panels.join(", ") : (panels || "Hamma");
      const updated = await SuperAdminDocumentModel.update(docId, { targetAudience });
      res.json({ success: true, document: updated });
    } catch (err: any) {
      console.error("[Superadmin] distributeDocument error:", err);
      res.status(500).json({ success: false, message: "Hujjatni tarqatishda xatolik!" });
    }
  }
};
