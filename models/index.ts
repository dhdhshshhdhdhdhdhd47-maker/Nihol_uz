import { dbState, saveLocalDb, query, isPg } from "../db";

// Helper functions to map snake_case columns to camelCase object fields and vice versa
export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj.toISOString().split("T")[0]; // return YYYY-MM-DD
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  const result: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(obj[key]);
  }
  return result;
}

export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  const result: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    result[snakeKey] = toSnakeCase(obj[key]);
  }
  return result;
}

// 1. KINDERGARTEN MODEL
export const KindergartenModel = {
  async getAll(): Promise<any[]> {
    if (isPg()) {
      const res = await query("SELECT * FROM kindergartens ORDER BY created_at DESC");
      return toCamelCase(res.rows);
    }
    return dbState.kindergartens;
  },

  async getById(id: string): Promise<any> {
    if (isPg()) {
      const res = await query("SELECT * FROM kindergartens WHERE id = $1", [id]);
      return res.rows.length ? toCamelCase(res.rows[0]) : null;
    }
    return dbState.kindergartens.find(k => k.id === id) || null;
  },

  async create(k: any): Promise<any> {
    if (isPg()) {
      const snake = toSnakeCase(k);
      const keys = Object.keys(snake);
      const values = Object.values(snake);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO kindergartens (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.kindergartens.push(k);
    saveLocalDb();
    return k;
  }
};

// 2. EMPLOYEE MODEL
export const EmployeeModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM employees";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY name ASC";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.employees.filter(e => e.kindergartenId === kindergartenId);
    }
    return dbState.employees;
  },

  async getById(id: string): Promise<any> {
    if (isPg()) {
      const res = await query("SELECT * FROM employees WHERE id = $1", [id]);
      return res.rows.length ? toCamelCase(res.rows[0]) : null;
    }
    return dbState.employees.find(e => e.id === id) || null;
  },

  async getByUsername(username: string): Promise<any> {
    if (isPg()) {
      const res = await query("SELECT * FROM employees WHERE username = $1", [username]);
      return res.rows.length ? toCamelCase(res.rows[0]) : null;
    }
    return dbState.employees.find(e => e.username === username) || null;
  },

  async create(e: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: e.id,
        username: e.username,
        password_hash: e.passwordHash,
        role: e.role,
        name: e.name,
        phone: e.phone,
        passport: e.passport,
        birth_date: e.birthDate || null,
        joined_date: e.joinedDate || null,
        status: e.status || "Faol",
        kindergarten_id: e.kindergartenId || null
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO employees (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.employees.push(e);
    saveLocalDb();
    return e;
  },

  async update(id: string, updates: any): Promise<any> {
    if (isPg()) {
      const mappedUpdates = toSnakeCase(updates);
      const keys = Object.keys(mappedUpdates).filter(k => k !== "id" && k !== "created_at");
      if (keys.length === 0) return this.getById(id);
      
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
      const values = keys.map(k => mappedUpdates[k]);
      const q = `UPDATE employees SET ${setClause} WHERE id = $1 RETURNING *`;
      const res = await query(q, [id, ...values]);
      return res.rows.length ? toCamelCase(res.rows[0]) : null;
    }
    const idx = dbState.employees.findIndex(e => e.id === id);
    if (idx !== -1) {
      dbState.employees[idx] = { ...dbState.employees[idx], ...updates };
      saveLocalDb();
      return dbState.employees[idx];
    }
    return null;
  }
};

// 3. GROUP MODEL
export const GroupModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM groups";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY name ASC";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.groups.filter(g => g.kindergartenId === kindergartenId);
    }
    return dbState.groups;
  },

  async create(g: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: g.id,
        name: g.name,
        teacher_id: g.teacherId,
        capacity: g.capacity,
        spots: g.spots || 0,
        kindergarten_id: g.kindergartenId
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO groups (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.groups.push(g);
    saveLocalDb();
    return g;
  }
};

// 4. CHILD MODEL
export const ChildModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM children";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY name ASC";
      const res = await query(q, params);
      
      // Parse nested objects that Postgres flat table might have
      return res.rows.map(row => {
        const camel = toCamelCase(row);
        return {
          id: camel.id,
          name: camel.name,
          birthDate: camel.birthDate,
          age: camel.age,
          gender: camel.gender,
          groupId: camel.groupId,
          parentPhone: camel.parentPhone,
          parentName: camel.parentName,
          photo: camel.photo,
          status: camel.status,
          telegramChatId: camel.telegramChatId,
          kindergartenId: camel.kindergartenId,
          documents: {
            birthCertificate: camel.birthCertificate || false,
            medicalCard: camel.medicalCardFlag || false,
            passportCopy: camel.passportCopy || false,
            contract: camel.contractFlag || false,
            photoUploaded: camel.photoUploaded || false
          },
          medicalCard: {
            allergies: camel.allergies || "",
            bloodGroup: camel.bloodGroup || "",
            rhFactor: camel.rhFactor || "",
            vaccinations: camel.vaccinations || [],
            height: camel.height || 0,
            weight: camel.weight || 0,
            bmi: camel.bmi || 0,
            lastCheckup: camel.lastCheckup || ""
          }
        };
      });
    }

    if (kindergartenId) {
      return dbState.children.filter(c => c.kindergartenId === kindergartenId);
    }
    return dbState.children;
  },

  async getById(id: string): Promise<any> {
    if (isPg()) {
      const res = await query("SELECT * FROM children WHERE id = $1", [id]);
      if (!res.rows.length) return null;
      const camel = toCamelCase(res.rows[0]);
      return {
        id: camel.id,
        name: camel.name,
        birthDate: camel.birthDate,
        age: camel.age,
        gender: camel.gender,
        groupId: camel.groupId,
        parentPhone: camel.parentPhone,
        parentName: camel.parentName,
        photo: camel.photo,
        status: camel.status,
        telegramChatId: camel.telegramChatId,
        kindergartenId: camel.kindergartenId,
        documents: {
          birthCertificate: camel.birthCertificate || false,
          medicalCard: camel.medicalCardFlag || false,
          passportCopy: camel.passportCopy || false,
          contract: camel.contractFlag || false,
          photoUploaded: camel.photoUploaded || false
        },
        medicalCard: {
          allergies: camel.allergies || "",
          bloodGroup: camel.bloodGroup || "",
          rhFactor: camel.rhFactor || "",
          vaccinations: camel.vaccinations || [],
          height: camel.height || 0,
          weight: camel.weight || 0,
          bmi: camel.bmi || 0,
          lastCheckup: camel.lastCheckup || ""
        }
      };
    }
    return dbState.children.find(c => c.id === id) || null;
  },

  async create(c: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: c.id,
        name: c.name,
        birth_date: c.birthDate,
        age: c.age,
        gender: c.gender,
        group_id: c.groupId,
        parent_phone: c.parentPhone,
        parent_name: c.parentName,
        photo: c.photo || null,
        status: c.status || "Kelmagan",
        telegram_chat_id: c.telegramChatId || null,
        birth_certificate: c.documents?.birthCertificate || false,
        medical_card_flag: c.documents?.medicalCard || false,
        passport_copy: c.documents?.passportCopy || false,
        contract_flag: c.documents?.contract || false,
        photo_uploaded: c.documents?.photoUploaded || false,
        allergies: c.medicalCard?.allergies || "",
        blood_group: c.medicalCard?.bloodGroup || "",
        rh_factor: c.medicalCard?.rhFactor || "",
        vaccinations: c.medicalCard?.vaccinations || [],
        height: c.medicalCard?.height || null,
        weight: c.medicalCard?.weight || null,
        bmi: c.medicalCard?.bmi || null,
        last_checkup: c.medicalCard?.lastCheckup || null,
        kindergarten_id: c.kindergartenId
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO children (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return this.getById(c.id);
    }
    dbState.children.push(c);
    saveLocalDb();
    return c;
  },

  async update(id: string, updates: any): Promise<any> {
    if (isPg()) {
      // Build fields dynamically
      const setFields: string[] = [];
      const values: any[] = [];
      let i = 2;

      const addField = (colName: string, val: any) => {
        setFields.push(`${colName} = $${i}`);
        values.push(val);
        i++;
      };

      if (updates.name !== undefined) addField("name", updates.name);
      if (updates.birthDate !== undefined) addField("birth_date", updates.birthDate);
      if (updates.age !== undefined) addField("age", updates.age);
      if (updates.gender !== undefined) addField("gender", updates.gender);
      if (updates.groupId !== undefined) addField("group_id", updates.groupId);
      if (updates.parentPhone !== undefined) addField("parent_phone", updates.parentPhone);
      if (updates.parentName !== undefined) addField("parent_name", updates.parentName);
      if (updates.photo !== undefined) addField("photo", updates.photo);
      if (updates.status !== undefined) addField("status", updates.status);
      if (updates.telegramChatId !== undefined) addField("telegram_chat_id", updates.telegramChatId);
      
      // Documents nesting
      if (updates.documents) {
        const d = updates.documents;
        if (d.birthCertificate !== undefined) addField("birth_certificate", d.birthCertificate);
        if (d.medicalCard !== undefined) addField("medical_card_flag", d.medicalCard);
        if (d.passportCopy !== undefined) addField("passport_copy", d.passportCopy);
        if (d.contract !== undefined) addField("contract_flag", d.contract);
        if (d.photoUploaded !== undefined) addField("photo_uploaded", d.photoUploaded);
      }

      // Medical nesting
      if (updates.medicalCard) {
        const m = updates.medicalCard;
        if (m.allergies !== undefined) addField("allergies", m.allergies);
        if (m.bloodGroup !== undefined) addField("blood_group", m.bloodGroup);
        if (m.rhFactor !== undefined) addField("rh_factor", m.rhFactor);
        if (m.vaccinations !== undefined) addField("vaccinations", m.vaccinations);
        if (m.height !== undefined) addField("height", m.height);
        if (m.weight !== undefined) addField("weight", m.weight);
        if (m.bmi !== undefined) addField("bmi", m.bmi);
        if (m.lastCheckup !== undefined) addField("last_checkup", m.lastCheckup || null);
      }

      if (setFields.length === 0) return this.getById(id);

      const q = `UPDATE children SET ${setFields.join(", ")} WHERE id = $1 RETURNING *`;
      await query(q, [id, ...values]);
      return this.getById(id);
    }

    const idx = dbState.children.findIndex(c => c.id === id);
    if (idx !== -1) {
      const existing = dbState.children[idx];
      dbState.children[idx] = {
        ...existing,
        ...updates,
        documents: updates.documents ? { ...existing.documents, ...updates.documents } : existing.documents,
        medicalCard: updates.medicalCard ? { ...existing.medicalCard, ...updates.medicalCard } : existing.medicalCard
      };
      saveLocalDb();
      return dbState.children[idx];
    }
    return null;
  },

  async delete(id: string): Promise<boolean> {
    if (isPg()) {
      const res = await query("DELETE FROM children WHERE id = $1", [id]);
      return true;
    }
    const idx = dbState.children.findIndex(c => c.id === id);
    if (idx !== -1) {
      dbState.children.splice(idx, 1);
      saveLocalDb();
      return true;
    }
    return false;
  }
};

// 5. ATTENDANCE MODEL
export const AttendanceModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM attendance";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY date DESC, check_in DESC";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.attendance.filter(a => a.kindergartenId === kindergartenId);
    }
    return dbState.attendance;
  },

  async create(a: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: a.id,
        child_id: a.childId,
        date: a.date,
        check_in: a.checkIn || null,
        check_out: a.checkOut || null,
        status: a.status,
        reason: a.reason || null,
        device_ip: a.deviceIp || null,
        pickup_photo: a.pickupPhoto || null,
        kindergarten_id: a.kindergartenId
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO attendance (${keys.join(", ")}) VALUES (${placeholders}) ON CONFLICT (child_id, date) DO UPDATE SET check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out, status = EXCLUDED.status, reason = EXCLUDED.reason, pickup_photo = EXCLUDED.pickup_photo RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    // Handle conflict in-memory
    const idx = dbState.attendance.findIndex(att => att.childId === a.childId && att.date === a.date);
    if (idx !== -1) {
      dbState.attendance[idx] = { ...dbState.attendance[idx], ...a };
    } else {
      dbState.attendance.push(a);
    }
    saveLocalDb();
    return a;
  }
};

// 6. PAYMENT MODEL
export const PaymentModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM payments";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY date DESC";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.payments.filter(p => p.kindergartenId === kindergartenId);
    }
    return dbState.payments;
  },

  async create(p: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: p.id,
        child_id: p.childId,
        date: p.date,
        amount: p.amount,
        payment_type: p.paymentType,
        month: p.month,
        status: p.status,
        discount: p.discount || 0.00,
        penalty: p.penalty || 0.00,
        receipt_number: p.receiptNumber || null,
        operator_name: p.operatorName || null,
        kindergarten_id: p.kindergartenId
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO payments (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.payments.push(p);
    saveLocalDb();
    return p;
  },

  async update(id: string, updates: any): Promise<any> {
    if (isPg()) {
      const mapped = toSnakeCase(updates);
      const keys = Object.keys(mapped).filter(k => k !== "id");
      if (keys.length === 0) return this.getAll();
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
      const values = keys.map(k => mapped[k]);
      const q = `UPDATE payments SET ${setClause} WHERE id = $1 RETURNING *`;
      const res = await query(q, [id, ...values]);
      return res.rows.length ? toCamelCase(res.rows[0]) : null;
    }
    const idx = dbState.payments.findIndex(p => p.id === id);
    if (idx !== -1) {
      dbState.payments[idx] = { ...dbState.payments[idx], ...updates };
      saveLocalDb();
      return dbState.payments[idx];
    }
    return null;
  },

  async delete(id: string): Promise<boolean> {
    if (isPg()) {
      await query("DELETE FROM payments WHERE id = $1", [id]);
      return true;
    }
    const idx = dbState.payments.findIndex(p => p.id === id);
    if (idx !== -1) {
      dbState.payments.splice(idx, 1);
      saveLocalDb();
      return true;
    }
    return false;
  }
};

// 7. EXPENSE MODEL
export const ExpenseModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM expenses";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY date DESC";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.expenses.filter(e => e.kindergartenId === kindergartenId);
    }
    return dbState.expenses;
  },

  async create(e: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: e.id,
        date: e.date,
        category: e.category,
        description: e.description,
        amount: e.amount,
        payment_type: e.paymentType,
        responsible: e.responsible,
        receipt_url: e.receiptUrl || null,
        kindergarten_id: e.kindergartenId
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO expenses (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.expenses.push(e);
    saveLocalDb();
    return e;
  }
};

// 8. PAYROLL MODEL
export const PayrollModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM payrolls";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY date DESC";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.payrolls.filter(p => p.kindergartenId === kindergartenId);
    }
    return dbState.payrolls;
  },

  async create(p: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: p.id,
        employee_id: p.employeeId,
        base_salary: p.baseSalary,
        bonus: p.bonus || 0,
        fine: p.fine || 0,
        tax: p.tax || 0,
        final_amount: p.finalAmount,
        date: p.date,
        status: p.status || "Kutilmoqda",
        kindergarten_id: p.kindergartenId
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO payrolls (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.payrolls.push(p);
    saveLocalDb();
    return p;
  },

  async settle(id: string): Promise<any> {
    if (isPg()) {
      const q = "UPDATE payrolls SET status = 'To''landi' WHERE id = $1 RETURNING *";
      const res = await query(q, [id]);
      return res.rows.length ? toCamelCase(res.rows[0]) : null;
    }
    const idx = dbState.payrolls.findIndex(p => p.id === id);
    if (idx !== -1) {
      dbState.payrolls[idx].status = "To'landi";
      saveLocalDb();
      return dbState.payrolls[idx];
    }
    return null;
  }
};

// 9. INCOME MODEL
export const IncomeModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM incomes";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY date DESC";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.incomes.filter(i => i.kindergartenId === kindergartenId);
    }
    return dbState.incomes;
  },

  async create(inc: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: inc.id,
        source: inc.source,
        amount: inc.amount,
        date: inc.date,
        description: inc.description || null,
        kindergarten_id: inc.kindergartenId
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO incomes (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.incomes.push(inc);
    saveLocalDb();
    return inc;
  }
};

// 10. PURCHASE REQUEST MODEL
export const PurchaseRequestModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM purchase_requests";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY date DESC";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.purchaseRequests.filter(p => p.kindergartenId === kindergartenId);
    }
    return dbState.purchaseRequests;
  },

  async create(p: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: p.id,
        sender_name: p.senderName,
        sender_role: p.senderRole,
        title: p.title,
        amount: p.amount,
        date: p.date,
        status: p.status || "Kutilmoqda",
        approved_by: p.approvedBy || null,
        kindergarten_id: p.kindergartenId
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO purchase_requests (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.purchaseRequests.push(p);
    saveLocalDb();
    return p;
  },

  async update(id: string, updates: any): Promise<any> {
    if (isPg()) {
      const mapped = toSnakeCase(updates);
      const keys = Object.keys(mapped).filter(k => k !== "id");
      if (keys.length === 0) return this.getAll();
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
      const values = keys.map(k => mapped[k]);
      const q = `UPDATE purchase_requests SET ${setClause} WHERE id = $1 RETURNING *`;
      const res = await query(q, [id, ...values]);
      return res.rows.length ? toCamelCase(res.rows[0]) : null;
    }
    const idx = dbState.purchaseRequests.findIndex(pr => pr.id === id);
    if (idx !== -1) {
      dbState.purchaseRequests[idx] = { ...dbState.purchaseRequests[idx], ...updates };
      saveLocalDb();
      return dbState.purchaseRequests[idx];
    }
    return null;
  }
};

// 11. MEAL PLAN MODEL
export const MealPlanModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM meal_plans";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY date DESC";
      const res = await query(q, params);
      
      // Pivot database flat meal plans structure back to full plan formats expected by frontend
      const rows = toCamelCase(res.rows);
      const grouped: {[date: string]: any} = {};
      for (const r of rows) {
        if (!grouped[r.date]) {
          grouped[r.date] = { date: r.date, kindergartenId: r.kindergartenId };
        }
        grouped[r.date][r.mealType] = {
          title: r.title,
          calories: r.calories,
          protein: r.protein,
          fat: r.fat,
          carb: r.carb,
          vitamins: r.vitamins,
          minerals: r.minerals,
          image: r.image,
          aiComment: r.aiComment
        };
      }
      return Object.values(grouped);
    }
    if (kindergartenId) {
      return dbState.mealPlans.filter(m => m.kindergartenId === kindergartenId);
    }
    return dbState.mealPlans;
  },

  async createOrUpdate(m: any): Promise<any> {
    if (isPg()) {
      // Structure m is: { date, kindergartenId, breakfast, lunch, dinner, morningSnack, afternoonSnack }
      const types = ["breakfast", "lunch", "dinner", "morningSnack", "afternoonSnack"];
      for (const t of types) {
        if (m[t] && m[t].title) {
          const detail = m[t];
          const mapped = {
            date: m.date,
            meal_type: t,
            title: detail.title,
            calories: detail.calories || null,
            protein: detail.protein || null,
            fat: detail.fat || null,
            carb: detail.carb || null,
            vitamins: detail.vitamins || null,
            minerals: detail.minerals || null,
            image: detail.image || null,
            ai_comment: detail.aiComment || null,
            kindergarten_id: m.kindergartenId || "K-1"
          };
          const keys = Object.keys(mapped);
          const values = Object.values(mapped);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
          
          // Postgres upsert command
          const q = `INSERT INTO meal_plans (${keys.join(", ")}) 
                     VALUES (${placeholders}) 
                     ON CONFLICT (date, meal_type, kindergarten_id) 
                     DO UPDATE SET title = EXCLUDED.title, calories = EXCLUDED.calories, protein = EXCLUDED.protein, fat = EXCLUDED.fat, carb = EXCLUDED.carb, vitamins = EXCLUDED.vitamins, minerals = EXCLUDED.minerals, image = EXCLUDED.image, ai_comment = EXCLUDED.ai_comment`;
          await query(q, values);
        }
      }
      return m;
    }

    const idx = dbState.mealPlans.findIndex(mp => mp.date === m.date && mp.kindergartenId === m.kindergartenId);
    if (idx !== -1) {
      dbState.mealPlans[idx] = m;
    } else {
      dbState.mealPlans.push(m);
    }
    saveLocalDb();
    return m;
  },

  async getByDate(date: string, kindergartenId: string): Promise<any> {
    const all = await this.getAll(kindergartenId);
    return all.find(m => m.date === date) || null;
  },

  async upsert(m: any): Promise<any> {
    return this.createOrUpdate(m);
  },

  async delete(date: string, kindergartenId: string): Promise<boolean> {
    if (isPg()) {
      await query("DELETE FROM meal_plans WHERE date = $1 AND kindergarten_id = $2", [date, kindergartenId]);
      return true;
    }
    const idx = dbState.mealPlans.findIndex(mp => mp.date === date && mp.kindergartenId === kindergartenId);
    if (idx !== -1) {
      dbState.mealPlans.splice(idx, 1);
      saveLocalDb();
      return true;
    }
    return false;
  }
};

// 12. COMPLAINT MODEL
export const ComplaintModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM complaints";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY date DESC";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.complaints.filter(c => c.kindergartenId === kindergartenId);
    }
    return dbState.complaints;
  },

  async create(c: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: c.id,
        parent_name: c.parentName,
        child_id: c.childId || null,
        phone: c.phone,
        text: c.text,
        date: c.date,
        status: c.status || "Yangi",
        kindergarten_id: c.kindergartenId
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO complaints (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.complaints.push(c);
    saveLocalDb();
    return c;
  },

  async resolve(id: string, status: string): Promise<any> {
    if (isPg()) {
      const q = "UPDATE complaints SET status = $2 WHERE id = $1 RETURNING *";
      const res = await query(q, [id, status]);
      return res.rows.length ? toCamelCase(res.rows[0]) : null;
    }
    const idx = dbState.complaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      dbState.complaints[idx].status = status;
      saveLocalDb();
      return dbState.complaints[idx];
    }
    return null;
  },

  async update(id: string, updates: any): Promise<any> {
    if (isPg()) {
      const mappedUpdates = toSnakeCase(updates);
      const keys = Object.keys(mappedUpdates).filter(k => k !== "id" && k !== "created_at");
      if (keys.length === 0) {
        const res = await query("SELECT * FROM complaints WHERE id = $1", [id]);
        return res.rows.length ? toCamelCase(res.rows[0]) : null;
      }
      
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
      const values = keys.map(k => mappedUpdates[k]);
      const q = `UPDATE complaints SET ${setClause} WHERE id = $1 RETURNING *`;
      const res = await query(q, [id, ...values]);
      return res.rows.length ? toCamelCase(res.rows[0]) : null;
    }
    const idx = dbState.complaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      dbState.complaints[idx] = { ...dbState.complaints[idx], ...updates };
      saveLocalDb();
      return dbState.complaints[idx];
    }
    return null;
  }
};

// 13. AUDIT LOG MODEL
export const AuditLogModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM audit_logs";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY timestamp DESC LIMIT 200";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.auditLogs.filter(a => a.kindergartenId === kindergartenId);
    }
    return dbState.auditLogs;
  },

  async create(log: any): Promise<any> {
    if (isPg()) {
      const mapped = {
        id: log.id,
        timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
        username: log.username,
        action: log.action,
        ip: log.ip || null,
        device: log.device || null,
        kindergarten_id: log.kindergartenId || null
      };
      const keys = Object.keys(mapped);
      const values = Object.values(mapped);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO audit_logs (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.auditLogs.unshift(log); // Keep newest on top
    saveLocalDb();
    return log;
  }
};

// 14. INGREDIENT MODEL
export const IngredientModel = {
  async getAll(): Promise<any[]> {
    if (isPg()) {
      const res = await query("SELECT * FROM kg_ingredients ORDER BY name ASC");
      return toCamelCase(res.rows);
    }
    return dbState.kgIngredients;
  },
  async create(ing: any): Promise<any> {
    if (isPg()) {
      const snake = toSnakeCase(ing);
      const keys = Object.keys(snake);
      const values = Object.values(snake);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO kg_ingredients (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.kgIngredients.push(ing);
    saveLocalDb();
    return ing;
  },
  async update(id: string, updates: any): Promise<any> {
    if (isPg()) {
      const mappedUpdates = toSnakeCase(updates);
      const keys = Object.keys(mappedUpdates).filter(k => k !== "id" && k !== "created_at");
      if (keys.length === 0) {
        const res = await query("SELECT * FROM kg_ingredients WHERE id = $1", [id]);
        return res.rows.length ? toCamelCase(res.rows[0]) : null;
      }
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
      const values = keys.map(k => mappedUpdates[k]);
      const q = `UPDATE kg_ingredients SET ${setClause} WHERE id = $1 RETURNING *`;
      const res = await query(q, [id, ...values]);
      return res.rows.length ? toCamelCase(res.rows[0]) : null;
    }
    const idx = dbState.kgIngredients.findIndex(i => i.id === id);
    if (idx !== -1) {
      dbState.kgIngredients[idx] = { ...dbState.kgIngredients[idx], ...updates };
      saveLocalDb();
      return dbState.kgIngredients[idx];
    }
    return null;
  },
  async delete(id: string): Promise<boolean> {
    if (isPg()) {
      await query("DELETE FROM kg_ingredients WHERE id = $1", [id]);
      return true;
    }
    const idx = dbState.kgIngredients.findIndex(i => i.id === id);
    if (idx !== -1) {
      dbState.kgIngredients.splice(idx, 1);
      saveLocalDb();
      return true;
    }
    return false;
  }
};

// 15. RECIPE MODEL
export const RecipeModel = {
  async getAll(): Promise<any[]> {
    if (isPg()) {
      const res = await query("SELECT * FROM kg_recipes ORDER BY title ASC");
      return toCamelCase(res.rows);
    }
    return dbState.kgRecipes;
  },
  async create(rec: any): Promise<any> {
    if (isPg()) {
      const snake = toSnakeCase(rec);
      if (snake.ingredients && typeof snake.ingredients !== "string") {
        snake.ingredients = JSON.stringify(snake.ingredients);
      }
      const keys = Object.keys(snake);
      const values = Object.values(snake);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO kg_recipes (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.kgRecipes.push(rec);
    saveLocalDb();
    return rec;
  }
};

// 16. MEAL GALLERY MODEL
export const MealGalleryModel = {
  async getAll(kindergartenId?: string): Promise<any[]> {
    if (isPg()) {
      let q = "SELECT * FROM kg_meal_gallery";
      const params: any[] = [];
      if (kindergartenId) {
        q += " WHERE kindergarten_id = $1";
        params.push(kindergartenId);
      }
      q += " ORDER BY date DESC";
      const res = await query(q, params);
      return toCamelCase(res.rows);
    }
    if (kindergartenId) {
      return dbState.kgMealGallery.filter(m => m.kindergartenId === kindergartenId);
    }
    return dbState.kgMealGallery;
  },
  async create(item: any): Promise<any> {
    if (isPg()) {
      const snake = toSnakeCase(item);
      const keys = Object.keys(snake);
      const values = Object.values(snake);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO kg_meal_gallery (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.kgMealGallery.push(item);
    saveLocalDb();
    return item;
  },
  async delete(id: string): Promise<boolean> {
    if (isPg()) {
      await query("DELETE FROM kg_meal_gallery WHERE id = $1", [id]);
      return true;
    }
    const idx = dbState.kgMealGallery.findIndex(item => item.id === id);
    if (idx !== -1) {
      dbState.kgMealGallery.splice(idx, 1);
      saveLocalDb();
      return true;
    }
    return false;
  }
};

// 17. SUPER ADMIN DOCUMENT MODEL
export const SuperAdminDocumentModel = {
  async getAll(): Promise<any[]> {
    if (isPg()) {
      const res = await query("SELECT * FROM super_admin_documents ORDER BY uploaded_at DESC");
      return toCamelCase(res.rows);
    }
    return dbState.superAdminDocuments;
  },
  async create(doc: any): Promise<any> {
    if (isPg()) {
      const snake = toSnakeCase(doc);
      const keys = Object.keys(snake);
      const values = Object.values(snake);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const q = `INSERT INTO super_admin_documents (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const res = await query(q, values);
      return toCamelCase(res.rows[0]);
    }
    dbState.superAdminDocuments.push(doc);
    saveLocalDb();
    return doc;
  }
};
