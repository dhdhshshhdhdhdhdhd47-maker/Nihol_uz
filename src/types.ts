export interface User {
  id: string;
  username: string;
  role: "SuperAdmin" | "Direktor" | "Tarbiyachi" | "Oshpaz" | "Hamshira" | "Buxgalter";
  name: string;
  phone: string;
  kindergartenId?: string;
  telegramChatId?: string;
  avatar?: string;
}

export interface SubscriptionPlan {
  planType: "Start" | "Standard" | "Premium";
  trialActive: boolean;
  trialEndsAt: string;
  enabledModules: {
    dashboard: boolean;
    children: boolean;
    employees: boolean;
    groups: boolean;
    attendance: boolean;
    payments: boolean;
    finance: boolean;
    medical: boolean;
    kitchen: boolean;
    aiCameras: boolean; // Only Premium
    liveStream: boolean; // Only Premium
    anonymousSos: boolean; // Standard & Premium
    bodyInspection: boolean; // Standard & Premium
    acousticMonitoring: boolean; // Only Premium
  };
}

export interface Kindergarten {
  id: string;
  name: string;
  address: string;
  phone: string;
  directorName: string;
  directorUsername: string;
  parentPortalActive?: boolean;
  subscription?: SubscriptionPlan;
}

export interface BodyInspectionRecord {
  id: string;
  childId: string;
  date: string;
  inspectorName: string; // Hamshira yoki Tarbiyachi
  hasInjury: boolean;
  injuryType?: "Jarohat" | "Ko'kargan" | "Shlingan" | "Tishlangan" | "Boshqa";
  bodyLocation?: string; // Masalan: "O'ng qo'li", "Yuzi"
  photoUrl?: string;
  note: string;
  origin: "Uyda bo'lgan" | "Bog'chada bo'lgan" | "Noma'lum";
}

export interface ViolenceAlert {
  id: string;
  timestamp: string;
  cameraOrRoom: string;
  type: "Aggression" | "AcousticScream" | "PanicFall" | "BlindSpotSuspicion";
  severity: "Yuqori" | "O'rta" | "Kritik";
  snapshotUrl?: string;
  status: "Faol" | "Tekshirildi" | "Soxta signal";
  notifiedAuthorities: boolean; // 102 / MMTB notification status
}

export interface AnonymousSOSReport {
  id: string;
  timestamp: string;
  kindergartenId: string;
  senderRole: "Hamshira" | "Tarbiyachi" | "Ota-ona" | "Anonim";
  category: "Jismoniy zo'ravonlik" | "Ruhshiy tazyiq" | "Ovqat sifatsizligi" | "E'tiborsizlik";
  details: string;
  mediaUrl?: string;
  status: "MMTBga Yuborildi" | "Ko'rilmoqda" | "Tasdiqlandi";
}


export interface Child {
  id: string;
  name: string;
  birthDate: string;
  age: number;
  gender: "O'g'il" | "Qiz";
  groupId: string;
  parentPhone: string;
  parentName: string;
  photo: string;
  status: "Bog'chada" | "Kelmagan" | "Kechikdi" | "Sababli";
  telegramChatId: string | null;
  documents: {
    birthCertificate: boolean;
    medicalCard: boolean;
    passportCopy: boolean;
    contract: boolean;
    photoUploaded: boolean;
  };
  medicalCard: {
    allergies: string;
    bloodGroup: string;
    rhFactor: string;
    vaccinations: string[];
    height: number;
    weight: number;
    bmi: number;
    lastCheckup: string;
  };
  kindergartenId?: string;
}

export interface Group {
  id: string;
  name: string;
  teacherId: string;
  capacity: number;
  spots: number;
  kindergartenId?: string;
}

export interface Employee {
  id: string;
  username: string;
  role: "SuperAdmin" | "Direktor" | "Tarbiyachi" | "Oshpaz" | "Hamshira" | "Buxgalter";
  name: string;
  phone: string;
  passport: string;
  birthDate: string;
  joinedDate: string;
  status: "Faol" | "Nofaol";
  kindergartenId?: string;
  avatar?: string;
}

export interface Attendance {
  id: string;
  childId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "Keldi" | "Ketdi" | "Kechikdi" | "Sababli" | "Sababsiz";
  reason: string | null;
  deviceIp: string | null;
  temperature?: number;
  checkoutPersonName?: string;
}

export interface MealDetail {
  title: string;
  calories: number;
  protein: number;
  fat: number;
  carb: number;
  vitamins: string;
  minerals: string;
  image: string;
  aiComment: string;
}

export interface MealPlan {
  date: string;
  breakfast: MealDetail;
  lunch: MealDetail;
  dinner: MealDetail;
}

export interface DailyActivity {
  id: string;
  childId: string;
  date: string;
  activities: string[];
  engagement: number;
  discipline: number;
  communication: number;
  feeding: number;
  sleep: number;
  teacherNote: string;
}

export interface Payment {
  id: string;
  childId: string;
  date: string;
  amount: number;
  paymentType: "Naqd" | "Click" | "Payme" | "Humo" | "Visa" | "Mastercard";
  month: string;
  status: "To'landi" | "Qisman" | "Qarzdor";
}

export interface Complaint {
  id: string;
  parentName: string;
  childId: string;
  phone: string;
  text: string;
  date: string;
  status: "Yangi" | "Ko'rildi" | "Hal etildi";
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ip: string;
  device: string;
  kindergartenId?: string;
}

export interface SuperAdminDocument {
  id: string;
  title: string;
  allocatedFunds?: number;
  targetDirectorUsername: string;
  fileName: string;
  fileUrl: string;
  date: string;
  distributedToPanels: string[];
}

export interface PublicAnnouncement {
  id: string;
  message: string;
  timestamp: string;
  kindergartenId: string;
  views: number;
}

