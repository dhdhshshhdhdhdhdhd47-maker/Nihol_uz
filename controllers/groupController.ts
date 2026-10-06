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
  }
};
