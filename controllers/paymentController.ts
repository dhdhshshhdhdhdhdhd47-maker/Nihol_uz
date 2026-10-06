import { PaymentModel, ExpenseModel, IncomeModel, PurchaseRequestModel, ChildModel, GroupModel, AuditLogModel } from "../models";
import { getKgId } from "../middleware/validationMiddleware";
import { dbState, saveLocalDb } from "../db";
import { broadcastDataUpdate } from "../utils/wsManager";

export const PaymentController = {
  async getPayments(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const payments = await PaymentModel.getAll(kgId);
      res.json(payments);
    } catch (err: any) {
      console.error("[Payment] getPayments error:", err);
      res.status(500).json({ success: false, message: "To'lovlar ro'yxatini yuklashda xatolik!" });
    }
  },

  async createPayment(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const { childId, amount, paymentType, month, status, discount, penalty, operatorName } = req.body;
      
      if (!childId || !amount || !paymentType || !month || !status) {
        return res.status(400).json({ success: false, message: "To'liq bo'lmagan ma'lumotlar!" });
      }

      const child = await ChildModel.getById(childId);
      if (!child) {
        return res.status(404).json({ success: false, message: "Kiritilgan bola topilmadi!" });
      }

      const paymentList = await PaymentModel.getAll(kgId);
      const newPayment = {
        id: `PAY-${Date.now().toString().slice(-4)}-${paymentList.length + 1}`,
        childId,
        childName: child.name,
        date: new Date().toISOString().split("T")[0],
        amount: Number(amount),
        paymentType,
        month,
        status,
        discount: Number(discount || 0),
        penalty: Number(penalty || 0),
        receiptNumber: `REC-${Date.now().toString().slice(-5)}`,
        operatorName: operatorName || "Buxgalter",
        kindergartenId: kgId
      };

      const created = await PaymentModel.create(newPayment);

      // Also register corresponding income automatically
      await IncomeModel.create({
        id: `INC-PAY-${Date.now().toString().slice(-4)}`,
        source: "Oylik to'lov",
        amount: Number(amount),
        date: new Date().toISOString().split("T")[0],
        description: `${child.name} - ${month} oyi badali uchun to'lov`,
        kindergartenId: kgId
      });

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Buxgalter",
        action: `${child.name} uchun ${month} oyi badal to'lovi qabul qilindi: ${Number(amount).toLocaleString()} UZS (${paymentType})`,
        ip: req.ip || "127.0.0.1",
        device: "Accountant Portal",
        kindergartenId: kgId
      });

      res.json({ success: true, payment: created });
    } catch (err: any) {
      console.error("[Payment] createPayment error:", err);
      res.status(500).json({ success: false, message: "To'lov kvitansiyasini yaratishda xatolik!" });
    }
  },

  async updatePayment(req: any, res: any) {
    try {
      const { id } = req.params;
      const payment = dbState.payments.find(p => p.id === id); // standard array search is fine
      if (!payment) {
        return res.status(404).json({ success: false, message: "To'lov topilmadi!" });
      }

      const updated = await PaymentModel.update(id, req.body);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Buxgalter",
        action: `To'lov tahrirlandi: ID ${id} (Yangi miqdor: ${Number(req.body.amount || payment.amount).toLocaleString()} UZS)`,
        ip: req.ip || "127.0.0.1",
        device: "Accountant Portal",
        kindergartenId: updated.kindergartenId || "K-1"
      });

      res.json({ success: true, payment: updated });
    } catch (err: any) {
      console.error("[Payment] updatePayment error:", err);
      res.status(500).json({ success: false, message: "To'lov ma'lumotlarini yangilashda xatolik!" });
    }
  },

  async deletePayment(req: any, res: any) {
    try {
      const { id } = req.params;
      const payment = dbState.payments.find(p => p.id === id);
      if (!payment) {
        return res.status(404).json({ success: false, message: "To'lov topilmadi!" });
      }

      await PaymentModel.delete(id);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Buxgalter",
        action: `To'lov o'chirildi (Kvitansiya ID: ${id})`,
        ip: req.ip || "127.0.0.1",
        device: "Accountant Portal",
        kindergartenId: payment.kindergartenId || "K-1"
      });

      res.json({ success: true, message: "To'lov o'chirildi." });
    } catch (err: any) {
      console.error("[Payment] deletePayment error:", err);
      res.status(500).json({ success: false, message: "To'lovni o'chirishda xatolik!" });
    }
  },

  async getExpenses(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const expenses = await ExpenseModel.getAll(kgId);
      res.json(expenses);
    } catch (err: any) {
      console.error("[Payment] getExpenses error:", err);
      res.status(500).json({ success: false, message: "Xarajatlarni yuklashda xatolik!" });
    }
  },

  async createExpense(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const { category, description, amount, paymentType, responsible, receiptUrl } = req.body;
      
      if (!category || !amount || !paymentType) {
        return res.status(400).json({ success: false, message: "Kategoriya, miqdor va to'lov turi majburiy!" });
      }

      const expenseList = await ExpenseModel.getAll();
      const newExp = {
        id: `EXP-${Date.now().toString().slice(-4)}-${expenseList.length + 1}`,
        date: req.body.date || new Date().toISOString().split("T")[0],
        category,
        description: description || `${category} xarajati`,
        amount: Number(amount),
        paymentType,
        responsible: responsible || "Buxgalter",
        receiptUrl: receiptUrl || null,
        kindergartenId: kgId
      };

      const created = await ExpenseModel.create(newExp);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Buxgalter",
        action: `Xarajat kiritildi: ${category} - ${Number(amount).toLocaleString()} UZS`,
        ip: req.ip || "127.0.0.1",
        device: "Accountant Portal",
        kindergartenId: kgId
      });

      res.json({ success: true, expense: created });
    } catch (err: any) {
      console.error("[Payment] createExpense error:", err);
      res.status(500).json({ success: false, message: "Xarajat kiritishda xatolik!" });
    }
  },

  async getIncomes(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const incomes = await IncomeModel.getAll(kgId);
      res.json(incomes);
    } catch (err: any) {
      console.error("[Payment] getIncomes error:", err);
      res.status(500).json({ success: false, message: "Daromadlarni yuklashda xatolik!" });
    }
  },

  async createIncome(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const { source, amount, description } = req.body;
      
      if (!source || !amount) {
        return res.status(400).json({ success: false, message: "Daromad manbasi va miqdor majburiy!" });
      }

      const incomeList = await IncomeModel.getAll();
      const newInc = {
        id: `INC-${Date.now().toString().slice(-4)}-${incomeList.length + 1}`,
        source,
        amount: Number(amount),
        date: req.body.date || new Date().toISOString().split("T")[0],
        description: description || `${source} daromadi`,
        kindergartenId: kgId
      };

      const created = await IncomeModel.create(newInc);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Buxgalter",
        action: `Qo'shimcha daromad kiritildi: ${source} - ${Number(amount).toLocaleString()} UZS`,
        ip: req.ip || "127.0.0.1",
        device: "Accountant Portal",
        kindergartenId: kgId
      });

      res.json({ success: true, income: created });
    } catch (err: any) {
      console.error("[Payment] createIncome error:", err);
      res.status(500).json({ success: false, message: "Daromad kiritishda xatolik!" });
    }
  },

  async getPurchaseRequests(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const requests = await PurchaseRequestModel.getAll(kgId);
      res.json(requests);
    } catch (err: any) {
      console.error("[Payment] getPurchaseRequests error:", err);
      res.status(500).json({ success: false, message: "Sotib olish so'rovlarini yuklashda xatolik!" });
    }
  },

  async createPurchaseRequest(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const { senderName, senderRole, title, amount } = req.body;
      
      if (!senderName || !senderRole || !title || !amount) {
        return res.status(400).json({ success: false, message: "To'liq bo'lmagan so'rov ma'lumotlari!" });
      }

      const list = await PurchaseRequestModel.getAll();
      const newReq = {
        id: `REQ-${100 + list.length + 1}`,
        senderName,
        senderRole,
        title,
        amount: Number(amount),
        date: new Date().toISOString().split("T")[0],
        status: "Kutilmoqda",
        approvedBy: null,
        kindergartenId: kgId
      };

      const created = await PurchaseRequestModel.create(newReq);

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: senderName,
        action: `Yangi xarid so'rovi kiritildi: ${title} (${Number(amount).toLocaleString()} UZS, Rol: ${senderRole})`,
        ip: req.ip || "127.0.0.1",
        device: "Staff Device",
        kindergartenId: kgId
      });

      res.json({ success: true, request: created });
    } catch (err: any) {
      console.error("[Payment] createPurchaseRequest error:", err);
      res.status(500).json({ success: false, message: "Sotib olish so'rovini yuborishda xatolik!" });
    }
  },

  async updatePurchaseRequest(req: any, res: any) {
    try {
      const { id } = req.params;
      const { status, approvedBy } = req.body;

      const reqObj = dbState.purchaseRequests.find(r => r.id === id);
      if (!reqObj) {
        return res.status(404).json({ success: false, message: "So'rov topilmadi!" });
      }

      const updated = await PurchaseRequestModel.update(id, req.body);

      // If status changes to 'Tasdiqlandi' or 'To'landi', we log audit
      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: approvedBy || "Direktor",
        action: `Sotib olish so'rovi yangilandi: ID ${id} -> Holat: ${status}`,
        ip: req.ip || "127.0.0.1",
        device: "Management Portal",
        kindergartenId: reqObj.kindergartenId || "K-1"
      });

      // If 'To'landi', record in Expenses automatically
      if (status === "To'landi") {
        await ExpenseModel.create({
          id: `EXP-REQ-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString().split("T")[0],
          category: "Oziq-ovqat",
          description: `So'rov orqali tasdiqlangan sotuv: ${reqObj.title}`,
          amount: reqObj.amount,
          paymentType: "Click/Payme",
          responsible: approvedBy || "Buxgalter",
          kindergartenId: reqObj.kindergartenId
        });
      }

      res.json({ success: true, request: updated });
    } catch (err: any) {
      console.error("[Payment] updatePurchaseRequest error:", err);
      res.status(500).json({ success: false, message: "So'rov holatini yangilashda xatolik!" });
    }
  },

  async getDebtors(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const children = await ChildModel.getAll(kgId);
      const payments = await PaymentModel.getAll();
      const groups = await GroupModel.getAll();

      const debtorsList = children.map(c => {
        const childPayments = payments.filter(p => p.childId === c.id);
        const julyPayment = childPayments.find(p => p.month === "Iyul");

        let debtAmount = 1500000; // standard fee
        let monthsDebt = 1;
        let status: "Qarzdor" | "Qisman" = "Qarzdor";

        if (julyPayment) {
          if (julyPayment.status === "To'landi") {
            return null; // paid in full
          } else if (julyPayment.status === "Qisman") {
            debtAmount = 1500000 - julyPayment.amount;
            status = "Qisman";
          }
        }

        const lastPay = childPayments[childPayments.length - 1];
        const lastPaymentDate = lastPay ? lastPay.date : "Sana yo'q";

        return {
          id: `DEB-${c.id}`,
          childId: c.id,
          childName: c.name,
          groupName: groups.find(g => g.id === c.groupId)?.name || "Noma'lum",
          parentName: c.parentName,
          phone: c.parentPhone,
          debtAmount,
          monthsDebt,
          lastPaymentDate,
          status
        };
      }).filter(Boolean);

      res.json(debtorsList);
    } catch (err: any) {
      console.error("[Payment] getDebtors error:", err);
      res.status(500).json({ success: false, message: "Qarzdorlar ro'yxatini hisoblashda xatolik!" });
    }
  }
};
