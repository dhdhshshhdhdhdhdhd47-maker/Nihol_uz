import pg from "pg";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// 1. PostgreSQL Pool setup (Lazy initialization)
let pool: pg.Pool | null = null;
let pgConnected = false;
let pgConnecting = false;
let pgConnectionAttempted = false;

export function getPool(): pg.Pool | null {
  if (pool) return pool;
  if (pgConnectionAttempted && !pgConnected) return null;

  const user = process.env.PG_USER;
  const password = process.env.PG_PASSWORD;
  const host = process.env.PG_HOST;
  const port = process.env.PG_PORT;
  const database = process.env.PG_DATABASE;

  if (!user || !host || !database) {
    console.log("[DB] PostgreSQL configuration missing or incomplete. Using local JSON store.");
    pgConnectionAttempted = true;
    return null;
  }

  if (pgConnecting) return null;
  pgConnecting = true;
  pgConnectionAttempted = true;

  try {
    const tempPool = new Pool({
      user,
      password,
      host,
      port: port ? parseInt(port, 10) : 5432,
      database,
      connectionTimeoutMillis: 2000,
    });
    
    tempPool.query("SELECT NOW()", (err) => {
      pgConnecting = false;
      if (err) {
        console.warn("[DB] PostgreSQL connection failed. Falling back to local JSON store.", err.message);
        pool = null;
        pgConnected = false;
      } else {
        console.log("[DB] PostgreSQL connected successfully.");
        pool = tempPool;
        pgConnected = true;
      }
    });

    return tempPool;
  } catch (err: any) {
    console.error("[DB] Failed to initialize PostgreSQL pool:", err.message);
    pool = null;
    pgConnected = false;
    pgConnecting = false;
    return null;
  }
}

export function isPg(): boolean {
  if (!pgConnectionAttempted) {
    getPool();
  }
  return pgConnected;
}

// 2. Local Fallback Database State (Stored in persistent file)
const DB_FILE = process.env.DB_FILE_PATH || path.join(process.cwd(), "db_data.json");

export interface DbState {
  kindergartens: any[];
  children: any[];
  groups: any[];
  employees: any[];
  attendance: any[];
  mealPlans: any[];
  dailyActivities: any[];
  payments: any[];
  expenses: any[];
  payrolls: any[];
  purchaseRequests: any[];
  incomes: any[];
  complaints: any[];
  publicAnnouncements: any[];
  auditLogs: any[];
  kgIngredients: any[];
  kgRecipes: any[];
  kgMealGallery: any[];
  superAdminDocuments: any[];
  smsLogs: any[];
  telegramNotifications: any[];
  activeDevices: any[];
  failedCheckins: any[];
  bodyInspections: any[];
  violenceAlerts: any[];
  anonymousSosReports: any[];
  allergies?: any[];
}

export let dbState: DbState = {
  kindergartens: [],
  children: [],
  groups: [],
  employees: [],
  attendance: [],
  mealPlans: [],
  dailyActivities: [],
  payments: [],
  expenses: [],
  payrolls: [],
  purchaseRequests: [],
  incomes: [],
  complaints: [],
  publicAnnouncements: [],
  auditLogs: [],
  kgIngredients: [],
  kgRecipes: [],
  kgMealGallery: [],
  superAdminDocuments: [],
  smsLogs: [],
  telegramNotifications: [],
  activeDevices: [],
  failedCheckins: [],
  bodyInspections: [],
  violenceAlerts: [],
  anonymousSosReports: [],
  allergies: []
};

// Load saved data from JSON file on server start
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    dbState = {
      kindergartens: Array.isArray(parsed.kindergartens) ? parsed.kindergartens : [],
      children: Array.isArray(parsed.children) ? parsed.children : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      employees: Array.isArray(parsed.employees) ? parsed.employees : [],
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      mealPlans: Array.isArray(parsed.mealPlans) ? parsed.mealPlans : [],
      dailyActivities: Array.isArray(parsed.dailyActivities) ? parsed.dailyActivities : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      payrolls: Array.isArray(parsed.payrolls) ? parsed.payrolls : [],
      purchaseRequests: Array.isArray(parsed.purchaseRequests) ? parsed.purchaseRequests : [],
      incomes: Array.isArray(parsed.incomes) ? parsed.incomes : [],
      complaints: Array.isArray(parsed.complaints) ? parsed.complaints : [],
      publicAnnouncements: Array.isArray(parsed.publicAnnouncements) ? parsed.publicAnnouncements : [],
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
      kgIngredients: Array.isArray(parsed.kgIngredients) ? parsed.kgIngredients : [],
      kgRecipes: Array.isArray(parsed.kgRecipes) ? parsed.kgRecipes : [],
      kgMealGallery: Array.isArray(parsed.kgMealGallery) ? parsed.kgMealGallery : [],
      superAdminDocuments: Array.isArray(parsed.superAdminDocuments) ? parsed.superAdminDocuments : [],
      smsLogs: Array.isArray(parsed.smsLogs) ? parsed.smsLogs : [],
      telegramNotifications: Array.isArray(parsed.telegramNotifications) ? parsed.telegramNotifications : [],
      activeDevices: Array.isArray(parsed.activeDevices) ? parsed.activeDevices : [],
      failedCheckins: Array.isArray(parsed.failedCheckins) ? parsed.failedCheckins : [],
      bodyInspections: Array.isArray(parsed.bodyInspections) ? parsed.bodyInspections : [],
      violenceAlerts: Array.isArray(parsed.violenceAlerts) ? parsed.violenceAlerts : [],
      anonymousSosReports: Array.isArray(parsed.anonymousSosReports) ? parsed.anonymousSosReports : [],
      allergies: Array.isArray(parsed.allergies) ? parsed.allergies : []
    };
    console.log("[DB] JSON Fallback store loaded successfully.");
  } else {
    console.log("[DB] No db_data.json found. Initializing empty local store for seeding.");
  }

  // Auto-seed minimal admin accounts if database is empty
  if (!dbState.employees || dbState.employees.length === 0) {
    console.log("[DB] Initializing database with core Admin accounts...");
    dbState.kindergartens = [
      {
        id: "K-1",
        name: "Nihol AI Bog'chasi",
        address: "Toshkent shahar",
        phone: "+998711234567",
        directorName: "Direktor",
        directorUsername: "director"
      }
    ];
    dbState.employees = [
      {
        id: "E-1",
        username: "superadmin",
        passwordHash: "admin135@",
        role: "SuperAdmin",
        name: "Asqarov Jamshid (SuperAdmin)",
        phone: "+998909990000",
        passport: "AA1234567",
        birthDate: "1990-01-01",
        joinedDate: "2024-01-01",
        status: "Faol"
      },
      {
        id: "E-DIR-1",
        username: "director",
        passwordHash: "dir123",
        role: "Direktor",
        name: "Bog'cha Direktori",
        phone: "+998901234567",
        passport: "AA7654321",
        birthDate: "1985-05-15",
        joinedDate: "2024-01-01",
        status: "Faol",
        kindergartenId: "K-1"
      },
      {
        id: "E-DIR-2",
        username: "direktor",
        passwordHash: "dir123",
        role: "Direktor",
        name: "Bog'cha Direktori",
        phone: "+998901234567",
        passport: "AA7654321",
        birthDate: "1985-05-15",
        joinedDate: "2024-01-01",
        status: "Faol",
        kindergartenId: "K-1"
      }
    ];
    dbState.groups = [];
    saveLocalDb();
    console.log("[DB] Local database successfully seeded with minimal Admin accounts!");
  }
} catch (err: any) {
  console.error("[DB] Error reading or seeding db_data.json:", err.message);
}

// Function to save dbState to db_data.json
export function saveLocalDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), "utf-8");
  } catch (err: any) {
    console.error("[DB] Error saving db_data.json:", err.message);
  }
}

// Resilient query runner
export async function query(text: string, params?: any[]): Promise<any> {
  const p = getPool();
  if (p && pgConnected) {
    try {
      const res = await p.query(text, params);
      return res;
    } catch (err: any) {
      console.error("[DB] PostgreSQL Query error, fallback might handle it:", err.message);
      throw err;
    }
  } else {
    throw new Error("[DB] PostgreSQL is offline. Performing fallback operations.");
  }
}
