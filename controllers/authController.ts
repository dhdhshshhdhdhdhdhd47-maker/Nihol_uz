import { EmployeeModel, ChildModel, AuditLogModel } from "../models";
import { signToken, verifyPassword, hashPassword } from "../middleware/authMiddleware";
import { dbState, saveLocalDb, isPg } from "../db";

export const AuthController = {
  async login(req: any, res: any) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username va parol kiritilishi shart!" });
      }

      const user = await EmployeeModel.getByUsername(username);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ success: false, message: "Username yoki parol noto'g'ri!" });
      }

      if (user.status === "Nofaol") {
        return res.status(403).json({ success: false, message: "Ushbu profil bloklangan!" });
      }

      // If password was legacy plain text, auto-upgrade to hashed format on successful login
      if (!user.passwordHash.startsWith("pbkdf2:")) {
        const newHash = hashPassword(password);
        await EmployeeModel.update(user.id, { passwordHash: newHash });
      }

      // Update employee status & last login
      const updatedUser = await EmployeeModel.update(user.id, {
        status: "Faol",
        joinedDate: user.joinedDate || new Date().toISOString().split("T")[0]
      });

      // Create JWT Payload
      const tokenPayload = {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        name: updatedUser.name,
        phone: updatedUser.phone,
        kindergartenId: updatedUser.kindergartenId || "K-1"
      };

      const token = signToken(tokenPayload);

      res.json({
        success: true,
        token: token,
        user: tokenPayload
      });
    } catch (err: any) {
      console.error("[Auth] Login error:", err);
      res.status(500).json({ success: false, message: "Tizimga kirishda ichki xatolik!" });
    }
  },

  async logout(req: any, res: any) {
    res.json({ success: true, message: "Muvaffaqiyatli chiqildi." });
  },

  async telegramLogin(req: any, res: any) {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, message: "Telefon raqami kiritilishi shart!" });
      }

      // Normalize phone
      const cleanPhone = phone.replace(/\s+/g, "");
      
      let child: any = null;
      if (isPg()) {
        const children = await ChildModel.getAll();
        child = children.find((c: any) => c.parentPhone && c.parentPhone.replace(/\s+/g, "") === cleanPhone);
      } else {
        child = dbState.children.find(c => c.parentPhone && c.parentPhone.replace(/\s+/g, "") === cleanPhone);
      }

      if (!child) {
        return res.status(404).json({ success: false, message: "Ushbu telefon raqami bilan bog'langan bola topilmadi!" });
      }

      const tokenPayload = {
        id: "PARENT-" + child.id,
        username: "parent_" + child.id,
        role: "Ota-ona",
        name: child.parentName,
        phone: child.parentPhone,
        kindergartenId: child.kindergartenId || "K-1"
      };

      const token = signToken(tokenPayload);

      res.json({
        success: true,
        token,
        user: tokenPayload,
        childId: child.id
      });
    } catch (err: any) {
      console.error("[Auth] Telegram login error:", err);
      res.status(500).json({ success: false, message: "Tizimga kirishda xatolik yuz berdi." });
    }
  },

  async getMe(req: any, res: any) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Foydalanuvchi tizimga kirmagan!" });
      }

      // If parent portal user
      if (req.user.role === "Ota-ona") {
        return res.json({
          success: true,
          user: req.user
        });
      }

      const user = await EmployeeModel.getById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi!" });
      }

      if (user.status === "Nofaol") {
        return res.status(403).json({ success: false, message: "Ushbu profil bloklangan!" });
      }

      const tokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        phone: user.phone,
        kindergartenId: user.kindergartenId || "K-1",
        avatar: user.avatar || null,
        telegramChatId: user.telegramChatId || null
      };

      res.json({
        success: true,
        user: tokenPayload
      });
    } catch (err: any) {
      console.error("[Auth] getMe error:", err);
      res.status(500).json({ success: false, message: "Profil yuklashda ichki xatolik!" });
    }
  },

  async updateProfile(req: any, res: any) {
    try {
      const { userId, name, phone, password } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, message: "Foydalanuvchi ID majburiy!" });
      }

      const emp = await EmployeeModel.getById(userId);
      if (!emp) {
        return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi!" });
      }

      const updates: any = {};
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (password) updates.passwordHash = password;

      const updatedEmp = await EmployeeModel.update(userId, updates);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: updatedEmp.name,
        action: `Profil ma'lumotlari tahrirlandi`,
        ip: req.ip || "127.0.0.1",
        device: "User Settings",
        kindergartenId: updatedEmp.kindergartenId || "K-1"
      });

      res.json({
        success: true,
        user: {
          id: updatedEmp.id,
          username: updatedEmp.username,
          role: updatedEmp.role,
          name: updatedEmp.name,
          phone: updatedEmp.phone,
          kindergartenId: updatedEmp.kindergartenId || "K-1",
          avatar: updatedEmp.avatar || null
        }
      });
    } catch (err: any) {
      console.error("[Auth] Update profile error:", err);
      res.status(500).json({ success: false, message: "Profilni yangilashda xatolik!" });
    }
  },

  async updateProfilePhoto(req: any, res: any) {
    try {
      const { userId, avatar } = req.body;
      if (!userId || !avatar) {
        return res.status(400).json({ success: false, message: "Foydalanuvchi ID va rasm (avatar) majburiy!" });
      }

      const emp = await EmployeeModel.getById(userId);
      if (!emp) {
        return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi!" });
      }

      const updatedEmp = await EmployeeModel.update(userId, { avatar });

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: updatedEmp.name,
        action: `Profil rasmi (avatar) yangilandi (kamera orqali)`,
        ip: req.ip || "127.0.0.1",
        device: "User Settings",
        kindergartenId: updatedEmp.kindergartenId || "K-1"
      });

      res.json({
        success: true,
        user: {
          id: updatedEmp.id,
          username: updatedEmp.username,
          role: updatedEmp.role,
          name: updatedEmp.name,
          phone: updatedEmp.phone,
          kindergartenId: updatedEmp.kindergartenId || "K-1",
          avatar: updatedEmp.avatar
        }
      });
    } catch (err: any) {
      console.error("[Auth] Update avatar error:", err);
      res.status(500).json({ success: false, message: "Profil rasm qabul qilinishida xatolik!" });
    }
  }
};
