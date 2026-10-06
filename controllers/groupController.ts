import { GroupModel, AuditLogModel } from "../models";
import { getKgId } from "../middleware/validationMiddleware";
import { validateGroup } from "../Validation";
import { broadcastDataUpdate } from "../utils/wsManager";

export const GroupController = {
  async getAll(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const groups = await GroupModel.getAll(kgId);
      res.json(groups);
    } catch (err: any) {
      console.error("[Group] getAll error:", err);
      res.status(500).json({ success: false, message: "Guruhlar ro'yxatini yuklashda xatolik!" });
    }
  },

  async create(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const error = validateGroup(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const count = (await GroupModel.getAll()).length;
      const groupId = `G-${count + 1}`;

      const newGroup = {
        ...req.body,
        id: groupId,
        kindergartenId: kgId,
        spots: 0
      };

      const created = await GroupModel.create(newGroup);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Direktor",
        action: `Yangi guruh ochildi: ${created.name} (Soni: ${created.capacity})`,
        ip: req.ip || "127.0.0.1",
        device: "Management Portal",
        kindergartenId: kgId
      });

      broadcastDataUpdate("children");

      res.json({ success: true, group: created });
    } catch (err: any) {
      console.error("[Group] create error:", err);
      res.status(500).json({ success: false, message: "Guruhni ochishda xatolik yuz berdi." });
    }
  },

  async update(req: any, res: any) {
    try {
      const { id } = req.params;
      const group = await GroupModel.getById(id);
      if (!group) {
        return res.status(404).json({ success: false, message: "Guruh topilmadi!" });
      }

      const updated = await GroupModel.update(id, req.body);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Direktor / SuperAdmin",
        action: `Guruh tahrirlandi: ${updated.name} (ID: ${id})`,
        ip: req.ip || "127.0.0.1",
        device: "Management Portal",
        kindergartenId: updated.kindergartenId || "K-1"
      });

      broadcastDataUpdate("children");
      res.json({ success: true, group: updated });
    } catch (err: any) {
      console.error("[Group] update error:", err);
      res.status(500).json({ success: false, message: "Guruh ma'lumotlarini yangilashda xatolik!" });
    }
  },

  async delete(req: any, res: any) {
    try {
      const { id } = req.params;
      const group = await GroupModel.getById(id);
      if (!group) {
        return res.status(404).json({ success: false, message: "Guruh topilmadi!" });
      }

      await GroupModel.delete(id);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Direktor / SuperAdmin",
        action: `Guruh o'chirildi: ${group.name} (ID: ${id})`,
        ip: req.ip || "127.0.0.1",
        device: "Management Portal",
        kindergartenId: group.kindergartenId || "K-1"
      });

      broadcastDataUpdate("children");
      res.json({ success: true, message: "Guruh muvaffaqiyatli o'chirildi!" });
    } catch (err: any) {
      console.error("[Group] delete error:", err);
      res.status(500).json({ success: false, message: "Guruhni o'chirishda xatolik yuz berdi!" });
    }
  }
};
