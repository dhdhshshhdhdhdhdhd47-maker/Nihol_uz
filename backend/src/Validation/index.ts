import { EmployeeModel } from "../models";

export async function validateEmployee(data: any): Promise<string | null> {
  if (!data.name || data.name.trim().length < 3) {
    return "Xodim F.I.O kamida 3 ta belgidan iborat bo'lishi kerak.";
  }
  if (!data.username || data.username.trim().length < 3) {
    return "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak.";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    return "Foydalanuvchi nomi faqat lotin harflari va raqamlardan iborat bo'lishi kerak.";
  }
  if (!data.passwordHash || data.passwordHash.length < 4) {
    return "Parol kamida 4 ta belgidan iborat bo'lishi kerak.";
  }
  if (!data.phone || !data.phone.startsWith("+998")) {
    return "Telefon raqami noto'g'ri shaklda (masalan: +998901234567).";
  }

  // Check username uniqueness
  const existing = await EmployeeModel.getByUsername(data.username);
  if (existing) {
    return `Xatolik: Tizimda '${data.username}' foydalanuvchi nomi band! Iltimos, boshqa nom tanlang.`;
  }

  return null;
}

export function validateChild(data: any): string | null {
  if (!data.name || data.name.trim().length < 3) {
    return "Bolaning F.I.O kamida 3 ta belgidan iborat bo'lishi kerak.";
  }
  if (!data.birthDate) {
    return "Tug'ilgan sana kiritilishi shart.";
  }
  if (!data.parentPhone || !data.parentPhone.startsWith("+998")) {
    return "Ota-ona telefon raqami noto'g'ri shaklda (masalan: +998901234567).";
  }
  if (!data.parentName || data.parentName.trim().length < 3) {
    return "Ota-ona ismi kamida 3 ta belgidan iborat bo'lishi kerak.";
  }
  return null;
}

export function validateGroup(data: any): string | null {
  if (!data.name || data.name.trim().length < 2) {
    return "Guruh nomi kamida 2 ta belgidan iborat bo'lishi kerak.";
  }
  if (data.capacity && (isNaN(Number(data.capacity)) || Number(data.capacity) <= 0)) {
    return "Guruh sig'imi musbat son bo'lishi kerak.";
  }
  return null;
}
