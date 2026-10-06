const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db_data.json');

console.log("🍃 Nihol ERP - Ma'lumotlar bazasini tozalash boshlandi...");

const superAdminEmployee = {
  id: "E-1",
  username: "superadmin",
  passwordHash: "admin135@",
  role: "SuperAdmin",
  name: "Asqarov Jamshid",
  phone: "+998909990000",
  passport: "AA1234567",
  birthDate: "1988-05-15",
  joinedDate: "2024-01-01",
  status: "Faol"
};

const emptyDb = {
  kindergartens: [],
  children: [],
  groups: [],
  employees: [superAdminEmployee],
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
  failedCheckins: []
};

try {
  fs.writeFileSync(DB_FILE, JSON.stringify(emptyDb, null, 2), 'utf8');
  console.log("🎉 Ma'lumotlar muvaffaqiyatli tozalandi! Faqat SuperAdmin hisobi saqlab qolindi.");
  console.log("------------------------------------------------------------------");
  console.log("🔑 SuperAdmin Kirish Ma'lumotlari:");
  console.log("   • Login: superadmin");
  console.log("   • Parol: admin135@");
  console.log("------------------------------------------------------------------");
} catch (err) {
  console.error("❌ Xatolik yuz berdi:", err);
  process.exit(1);
}
