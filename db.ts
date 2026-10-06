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
  if (pgConnectionAttempted && !pgConnected) return null; // Don't retry if it failed before!

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
      connectionTimeoutMillis: 2000, // short timeout to fail fast
    });
    
    // Quick test query to verify connection
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
    getPool(); // trigger first check
  }
  return pgConnected;
}

// 2. Local Fallback Database State (Matches server.ts exactly)
const DB_FILE = path.join(process.cwd(), "db_data.json");

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
  anonymousSosReports: []
};

// Load initial data from db_data.json on module load
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw);
    dbState = {
      kindergartens: data.kindergartens || [],
      children: data.children || [],
      groups: data.groups || [],
      employees: data.employees || [],
      attendance: data.attendance || [],
      mealPlans: data.mealPlans || [],
      dailyActivities: data.dailyActivities || [],
      payments: data.payments || [],
      expenses: data.expenses || [],
      payrolls: data.payrolls || [],
      purchaseRequests: data.purchaseRequests || [],
      incomes: data.incomes || [],
      complaints: data.complaints || [],
      publicAnnouncements: data.publicAnnouncements || [],
      auditLogs: data.auditLogs || [],
      kgIngredients: data.kgIngredients || [],
      kgRecipes: data.kgRecipes || [],
      kgMealGallery: data.kgMealGallery || [],
      superAdminDocuments: data.superAdminDocuments || [],
      smsLogs: data.smsLogs || [],
      telegramNotifications: data.telegramNotifications || [],
      activeDevices: data.activeDevices || [],
      failedCheckins: data.failedCheckins || [],
      bodyInspections: data.bodyInspections || [],
      violenceAlerts: data.violenceAlerts || [],
      anonymousSosReports: data.anonymousSosReports || []
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
      }
    ];
    dbState.groups = [
      {
        id: "G-1",
        name: "1-Guruh (Asosiy)",
        teacherId: "",
        room: "101-xona",
        capacity: 30,
        ageRange: "3-6 yosh",
        kindergartenId: "K-1"
      }
    ];
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
