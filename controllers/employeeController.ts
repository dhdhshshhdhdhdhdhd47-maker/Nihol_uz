import { EmployeeModel, PayrollModel, ExpenseModel, AuditLogModel } from "../models";
import { getKgId } from "../middleware/validationMiddleware";
import { validateEmployee } from "../Validation";
import { dbState, saveLocalDb } from "../db";
import { broadcastDataUpdate } from "../utils/wsManager";

export const EmployeeController = {
  async getAll(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const employees = await EmployeeModel.getAll(kgId);
      res.json(employees);
    } catch (err: any) {
      console.error("[Employee] getAll error:", err);
      res.status(500).json({ success: false, message: "Xodimlar ro'yxatini yuklashda xatolik!" });
    }
  },

  async create(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const error = await validateEmployee(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const count = (await EmployeeModel.getAll()).length;
      const empId = `E-${count + 1}`;

      const newEmp = {
        ...req.body,
        id: empId,
        kindergartenId: kgId,
        status: "Faol",
        joinedDate: req.body.joinedDate || new Date().toISOString().split("T")[0]
      };

      const created = await EmployeeModel.create(newEmp);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: req.body.operatorName || "Direktor / SuperAdmin",
        action: `Yangi xodim qo'shildi: ${created.name} (ID: ${created.id}, Rol: ${created.role})`,
        ip: req.ip || "127.0.0.1",
        device: "Management Portal",
        kindergartenId: kgId
      });

      broadcastDataUpdate("children"); // triggers standard sync

      res.json({ success: true, employee: created });
    } catch (err: any) {
      console.error("[Employee] create error:", err);
      res.status(500).json({ success: false, message: "Xodimni ro'yxatga olishda xatolik!" });
    }
  },

  async update(req: any, res: any) {
    try {
      const { id } = req.params;
      const emp = await EmployeeModel.getById(id);
      if (!emp) {
        return res.status(404).json({ success: false, message: "Xodim topilmadi!" });
      }

      const updated = await EmployeeModel.update(id, req.body);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Direktor / SuperAdmin",
        action: `Xodim tahrirlandi: ${updated.name} (Status: ${updated.status})`,
        ip: req.ip || "127.0.0.1",
        device: "Management Portal",
        kindergartenId: updated.kindergartenId || "K-1"
      });

      res.json({ success: true, employee: updated });
    } catch (err: any) {
      console.error("[Employee] update error:", err);
      res.status(500).json({ success: false, message: "Xodim ma'lumotlarini yangilashda xatolik!" });
    }
  },

  async getPayroll(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const payrolls = await PayrollModel.getAll(kgId);
      res.json(payrolls);
    } catch (err: any) {
      console.error("[Employee] getPayroll error:", err);
      res.status(500).json({ success: false, message: "Ish haqi ma'lumotlarini yuklashda xatolik!" });
    }
  },

  async createPayroll(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const { employeeId, baseSalary, bonus, fine, tax, status } = req.body;
      
      const emp = await EmployeeModel.getById(employeeId);
      if (!emp) {
        return res.status(404).json({ success: false, message: "Xodim topilmadi!" });
      }

      const bSal = Number(baseSalary || 2000000);
      const bon = Number(bonus || 0);
      const fin = Number(fine || 0);
      const tx = Number(tax || 0);
      const finalAmt = bSal + bon - fin - tx;

      const payrollList = await PayrollModel.getAll();
      const newPayroll = {
        id: `PAYR-${100 + payrollList.length + 1}`,
        employeeId,
        employeeName: emp.name,
        employeeRole: emp.role,
        baseSalary: bSal,
        bonus: bon,
        fine: fin,
        tax: tx,
        finalAmount: finalAmt,
        date: new Date().toISOString().split("T")[0],
        status: status || "To'landi",
        kindergartenId: kgId
      };

      const createdPayroll = await PayrollModel.create(newPayroll);

      // Add to expenses for accounting compliance
      await ExpenseModel.create({
        id: `EXP-PAY-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split("T")[0],
        category: "Ish haqi",
        description: `${emp.name} (${emp.role}) oylik maosh to'lovi`,
        amount: finalAmt,
        paymentType: "Bank O'tkazmasi",
        responsible: "Buxgalter",
        kindergartenId: kgId
      });

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Buxgalter",
        action: `${emp.name} uchun ish haqi hisoblandi va to'landi: ${finalAmt.toLocaleString()} UZS`,
        ip: req.ip || "127.0.0.1",
        device: "Accountant Portal",
        kindergartenId: kgId
      });

      res.json({ success: true, payroll: createdPayroll });
    } catch (err: any) {
      console.error("[Employee] createPayroll error:", err);
      res.status(500).json({ success: false, message: "Ish haqi hisoblashda xatolik yuz berdi." });
    }
  },

  async settlePayroll(req: any, res: any) {
    try {
      const { id } = req.params;
      const settled = await PayrollModel.settle(id);
      if (!settled) {
        return res.status(404).json({ success: false, message: "Maosh hujjati topilmadi!" });
      }

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Buxgalter",
        action: `Xodim ${settled.employeeName} oylik maosh qarzi to'liq yopildi.`,
        ip: req.ip || "127.0.0.1",
        device: "Accountant Portal",
        kindergartenId: settled.kindergartenId || "K-1"
      });

      res.json({ success: true, payroll: settled });
    } catch (err: any) {
      console.error("[Employee] settlePayroll error:", err);
      res.status(500).json({ success: false, message: "To'lovni tasdiqlashda xatolik yuz berdi." });
    }
  }
};
