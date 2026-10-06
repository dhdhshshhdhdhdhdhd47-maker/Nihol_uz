import React, { useState, useEffect } from "react";
import { 
  CreditCard, Plus, FileText, Check, DollarSign, Download, Calendar, Users, QrCode, 
  TrendingUp, ArrowDownRight, ArrowUpRight, BarChart3, Bell, Brain, ClipboardList, 
  Edit2, Trash2, RefreshCw, Search, Filter, ShieldAlert, CheckCircle, Mail, Phone, 
  Send, Settings, Eye, FileSpreadsheet, Paperclip, Upload, ToggleLeft, ToggleRight, 
  Activity, UserCheck, Shield, HelpCircle, ShoppingBag, Sparkles, Calculator, Percent, Printer, Zap, PlusCircle
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { Child, Payment } from "../types";
import { exportToCSV } from "../utils/csvExport";

interface AccountantDashboardProps {
  user: any;
  childrenList: Child[];
  paymentsList: Payment[];
  onRefresh: () => void;
}

export default function AccountantDashboard({
  user,
  childrenList,
  paymentsList,
  onRefresh,
}: AccountantDashboardProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "payments" | "debtors" | "expenses" | "payroll" | "requests" | "reports" | "settings" | "sms"
  >("dashboard");

  // State Data
  const [stats, setStats] = useState<any>({
    bugungiTushum: 0,
    oylikDaromad: 0,
    bugungiXarajat: 0,
    qarzdorOtaOnalarSoni: 0,
    tolovQilganBolalar: 0,
    tolamaganBolalar: 0,
    xodimlarIshHaqi: 0,
    xaridlar: 0,
    bugungiCheklar: 0
  });

  const [localPayments, setLocalPayments] = useState<any[]>([]);
  const [localExpenses, setLocalExpenses] = useState<any[]>([]);
  const [localDebtors, setLocalDebtors] = useState<any[]>([]);
  const [localPayrolls, setLocalPayrolls] = useState<any[]>([]);
  const [localPurchaseRequests, setLocalPurchaseRequests] = useState<any[]>([]);
  const [localIncomes, setLocalIncomes] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [attendanceFilter, setAttendanceFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'children' | 'staff'>('staff');
  
  // Chart and AI state
  const [chartData, setChartData] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  
  // Loading & UI States
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Modals Trigger State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedChildForReminder, setSelectedChildForReminder] = useState<any | null>(null);

  // Filter States
  const [searchPaymentQuery, setSearchPaymentQuery] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterPaymentMonth, setFilterPaymentMonth] = useState("all");
  const [searchDebtorQuery, setSearchDebtorQuery] = useState("");
  const [filterExpenseCategory, setFilterExpenseCategory] = useState("all");

  // SMS Gateway States
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [loadingSmsLogs, setLoadingSmsLogs] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsTemplate, setSmsTemplate] = useState("custom");
  const [sendingSms, setSendingSms] = useState(false);

  // Expense Form State
  const [expenseCategory, setExpenseCategory] = useState<string>("Oziq-ovqat");
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDescription, setExpenseDescription] = useState<string>("");
  const [expensePaymentType, setExpensePaymentType] = useState<string>("Naqd");
  const [expenseResponsible, setExpenseResponsible] = useState<string>("Buxgalter");
  const [expenseAttachment, setExpenseAttachment] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Smart Export State
  const [smartExportModalOpen, setSmartExportModalOpen] = useState(false);
  const [smartExportType, setSmartExportType] = useState<"children" | "staff">("staff");
  const [smartExportPeriod, setSmartExportPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [smartExportWorkHours, setSmartExportWorkHours] = useState<number>(8);
  const [smartExportPenaltyRate, setSmartExportPenaltyRate] = useState<number>(15000);
  const [smartExportDailyRate, setSmartExportDailyRate] = useState<number>(120000); // 120,000 UZS daily rate
  const [smartExportIncludeTaxes, setSmartExportIncludeTaxes] = useState<boolean>(true);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // Payment Form State
  const [payChildId, setPayChildId] = useState<string>("");
  const [payAmount, setPayAmount] = useState<number>(1500000);
  const [payMonth, setPayMonth] = useState<string>("Iyul");
  const [payType, setPayType] = useState<string>("Click");
  const [payStatus, setPayStatus] = useState<"To'landi" | "Qisman" | "Qarzdor">("To'landi");

  // Payroll Form State
  const [payrEmployeeId, setPayrEmployeeId] = useState<string>("E-3");
  const [payrBaseSalary, setPayrBaseSalary] = useState<number>(2500000);
  const [payrBonus, setPayrBonus] = useState<number>(0);
  const [payrFine, setPayrFine] = useState<number>(0);
  const [payrTax, setPayrTax] = useState<number>(300000); // 12% standard default
  const [payrStatus, setPayrStatus] = useState<string>("To'landi");

  // Income Form State
  const [incSource, setIncSource] = useState<string>("Tashqi Kurslar");
  const [incAmount, setIncAmount] = useState<number>(0);
  const [incDescription, setIncDescription] = useState<string>("");

  // Settings State
  const [currencySymbol, setCurrencySymbol] = useState("UZS");
  const [taxRate, setTaxRate] = useState(12);
  const [enable2FA, setEnable2FA] = useState(true);
  const [currentTuitionFee, setCurrentTuitionFee] = useState(1500000);

  // Load Everything on Mount & Refresh
  useEffect(() => {
    fetchDashboardStats();
    fetchSecondaryLists();
    fetchChartData();
    fetchAiInsights(false); // fetch on mount
    fetchSmsLogs();
  }, []);

  useEffect(() => {
    const handleJump = (e: Event) => {
      const customEvent = e as CustomEvent<{ tabId: string; openModal?: string }>;
      if (customEvent.detail && customEvent.detail.tabId) {
        setActiveTab(customEvent.detail.tabId as any);
        if (customEvent.detail.openModal === "add-expense") {
          setExpenseModalOpen(true);
        } else if (customEvent.detail.openModal === "add-payment") {
          setPaymentModalOpen(true);
        } else if (customEvent.detail.openModal === "add-income") {
          setIncomeModalOpen(true);
        } else if (customEvent.detail.openModal === "add-payroll") {
          setPayrollModalOpen(true);
        }
      }
    };
    window.addEventListener("jump-to-dashboard-tab", handleJump);
    return () => window.removeEventListener("jump-to-dashboard-tab", handleJump);
  }, []);

  const generateAccountantPDF = () => {
    const cleanText = (str: string): string => {
      if (!str) return "";
      const cyrillicToLatin: { [key: string]: string } = {
        'А': 'A', 'а': 'a', 'Б': 'B', 'б': 'b', 'В': 'V', 'в': 'v', 'Г': 'G', 'г': 'g',
        'Д': 'D', 'д': 'd', 'Е': 'E', 'е': 'e', 'Ё': 'Yo', 'ё': 'yo', 'Ж': 'J', 'ж': 'j',
        'З': 'Z', 'з': 'z', 'И': 'I', 'и': 'i', 'Й': 'Y', 'й': 'y', 'К': 'K', 'к': 'k',
        'Л': 'L', 'л': 'l', 'М': 'M', 'm': 'm', 'Н': 'N', 'н': 'n', 'О': 'O', 'о': 'o',
        'П': 'P', 'p': 'p', 'Р': 'R', 'р': 'r', 'С': 'S', 'с': 's', 'Т': 'T', 'т': 't',
        'У': 'U', 'у': 'u', 'Ф': 'F', 'ф': 'f', 'Х': 'X', 'х': 'x', 'Ц': 'Ts', 'ц': 'ts',
        'Ч': 'Ch', 'ч': 'ch', 'Ш': 'Sh', 'ш': 'sh', 'Ъ': "'", 'ъ': "'", 'Ы': 'Y', 'ы': 'y',
        'Ь': '', 'ь': '', 'Э': 'E', 'э': 'e', 'Ю': 'Yu', 'ю': 'yu', 'Я': 'Ya', 'ya': 'ya',
        'Ў': "O'", 'ў': "o'", 'Қ': 'Q', 'қ': 'q', 'Ғ': "G'", 'ғ': "g'", 'Ҳ': 'H', 'ҳ': 'h'
      };
      
      let cleaned = "";
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (cyrillicToLatin[char] !== undefined) {
          cleaned += cyrillicToLatin[char];
        } else if (char === "ʻ" || char === "ʼ" || char === "’" || char === "‘" || char === "`") {
          cleaned += "'";
        } else {
          const code = char.charCodeAt(0);
          if (code < 128) {
            cleaned += char;
          } else {
            cleaned += "?";
          }
        }
      }
      return cleaned;
    };

    try {
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanText("NIHOL AI ERP - BUXGALTERIYA VA MOLIYA HISOBOTI"), 14, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(cleanText(`Sana: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`), 14, 26);
      doc.text(cleanText(`Mas'ul xodim: ${user?.name || "Buxgalter"}`), 14, 31);

      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 35, 196, 35);

      // Section 1: Financial Summary
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanText("1. Moliyaviy Jamlama (Financial KPIs)"), 14, 45);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);

      let y = 53;
      doc.text(cleanText(`- Bugungi umumiy tushum: ${(stats.bugungiTushum || 0).toLocaleString()} UZS`), 16, y); y += 7;
      doc.text(cleanText(`- Oylik kutilayotgan daromad: ${(stats.oylikDaromad || 24000000).toLocaleString()} UZS`), 16, y); y += 7;
      doc.text(cleanText(`- Bugungi xarajatlar miqdori: ${(stats.bugungiXarajat || 0).toLocaleString()} UZS`), 16, y); y += 7;
      doc.text(cleanText(`- Xodimlar oylik maoshlari (Payroll): ${(stats.xodimlarIshHaqi || 0).toLocaleString()} UZS`), 16, y); y += 7;
      doc.text(cleanText(`- Qarzdor ota-onalar soni: ${stats.qarzdorOtaOnalarSoni || 0} ta oila`), 16, y); y += 7;

      doc.line(14, y + 3, 196, y + 3);
      y += 12;

      // Section 2: Recent Payments
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanText("2. Oxirgi To'lovlar Ro'yxati"), 14, y);
      y += 8;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(cleanText("Sana"), 16, y);
      doc.text(cleanText("Bola ID"), 45, y);
      doc.text(cleanText("Summa"), 95, y);
      doc.text(cleanText("To'lov turi"), 135, y);
      doc.text(cleanText("Mas'ul"), 165, y);
      y += 5;
      doc.line(14, y, 196, y);
      y += 6;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const displayedPayments = localPayments.slice(0, 10);
      displayedPayments.forEach(p => {
        doc.text(cleanText(p.date || new Date().toLocaleDateString()), 16, y);
        doc.text(cleanText(p.childId || "N/A"), 45, y);
        doc.text(cleanText(`${p.amount.toLocaleString()} UZS`), 95, y);
        doc.text(cleanText(p.paymentType || "Click"), 135, y);
        doc.text(cleanText(p.operatorName || "Buxgalter"), 165, y);
        y += 7;
      });

      if (localPayments.length === 0) {
        doc.text(cleanText("To'lovlar jurnali bo'sh"), 16, y);
        y += 7;
      }

      doc.line(14, y + 3, 196, y + 3);
      y += 12;

      // Section 3: Debtors
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanText("3. Qarzdorlik Ro'yxati"), 14, y);
      y += 8;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(cleanText("Bola Ismi"), 16, y);
      doc.text(cleanText("Ota-ona"), 60, y);
      doc.text(cleanText("Telefon"), 110, y);
      doc.text(cleanText("Qarzdorlik"), 160, y);
      y += 5;
      doc.line(14, y, 196, y);
      y += 6;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const displayedDebtors = localDebtors.slice(0, 5);
      displayedDebtors.forEach(d => {
        doc.text(cleanText(d.childName || "N/A"), 16, y);
        doc.text(cleanText(d.parentName || "N/A"), 60, y);
        doc.text(cleanText(d.phone || "—"), 110, y);
        doc.text(cleanText(`-${d.debtAmount.toLocaleString()} UZS`), 160, y);
        y += 7;
      });

      if (localDebtors.length === 0) {
        doc.text(cleanText("Qarzdorlar ro'yxati bo'sh"), 16, y);
        y += 7;
      }

      doc.save("Nihol_AI_ERP_Buxgalteriya_Hisoboti.pdf");
      triggerSuccess("PDF Hisoboti muvaffaqiyatli generatsiya qilindi va yuklandi! 📄");
    } catch (err) {
      console.error(err);
      triggerError("Xatolik: PDF eksport qilish muvaffaqiyatsiz tugadi.");
    }
  };

  const exportPaymentsCSV = () => {
    if (localPayments.length === 0) {
      triggerError("Eksport qilish uchun to'lovlar mavjud emas!");
      return;
    }

    const dataToExport = localPayments.map(p => {
      const child = childrenList.find(c => c.id === p.childId);
      const childName = child ? child.name : `Bola (ID: ${p.childId})`;
      return {
        id: p.id,
        childName,
        date: p.date || "—",
        amount: p.amount,
        paymentType: p.paymentType,
        month: p.month,
        status: p.status
      };
    });

    const columns = [
      { key: "id", header: "To'lov ID" },
      { key: "childName", header: "Bola Ismi" },
      { key: "date", header: "Sana" },
      { key: "amount", header: "Summa (UZS)" },
      { key: "paymentType", header: "To'lov Turi" },
      { key: "month", header: "Oy" },
      { key: "status", header: "Status" }
    ];

    exportToCSV(
      dataToExport,
      columns,
      `Tolovlar_Hisoboti_${new Date().toISOString().split("T")[0]}`
    );
    triggerSuccess("Barcha oylik to'lovlar hisoboti CSV formatida muvaffaqiyatli yuklab olindi! 📥");
  };

  const triggerSuccess = (msg: string) => {
    setNotifSuccess(msg);
    setTimeout(() => setNotifSuccess(null), 4000);
  };

  const triggerError = (msg: string) => {
    setNotifError(msg);
    setTimeout(() => setNotifError(null), 4000);
  };

  const fetchSmsLogs = async () => {
    setLoadingSmsLogs(true);
    try {
      const res = await fetch("/api/sms/logs");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSmsLogs(data);
      }
    } catch (err) {
      console.error("Error fetching SMS logs:", err);
    } finally {
      setLoadingSmsLogs(false);
    }
  };

  // FETCH APIS
  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/dashboard/statistics");
      const data = await res.json();
      if (data) {
        setStats({
          bugungiTushum: data.bugungiTushum || 0,
          oylikDaromad: data.oylikDaromad || 0,
          bugungiXarajat: data.bugungiXarajat || 0,
          qarzdorOtaOnalarSoni: data.qarzdorOtaOnalarSoni || 0,
          tolovQilganBolalar: data.tolovQilganBolalar || 0,
          tolamaganBolalar: data.tolamaganBolalar || 0,
          xodimlarIshHaqi: data.xodimlarIshHaqi || 0,
          xaridlar: data.xaridlar || 0,
          bugungiCheklar: data.bugungiCheklar || 0
        });
      }
    } catch (err) {
      console.error("Dashboard stats error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchSecondaryLists = async () => {
    try {
      const [pRes, eRes, dRes, prRes, iRes, payrRes, empRes, attRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/expenses"),
        fetch("/api/debtors"),
        fetch("/api/purchase-requests"),
        fetch("/api/incomes"),
        fetch("/api/payroll"),
        fetch("/api/employees"),
        fetch("/api/attendance")
      ]);

      const paymentsData = await pRes.json();
      const expensesData = await eRes.json();
      const debtorsData = await dRes.json();
      const prData = await prRes.json();
      const incomesData = await iRes.json();
      const payrollData = await payrRes.json();
      const empData = await empRes.json();
      const attData = await attRes.json();

      setLocalPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setLocalExpenses(Array.isArray(expensesData) ? expensesData : []);
      setLocalDebtors(Array.isArray(debtorsData) ? debtorsData : []);
      setLocalPurchaseRequests(Array.isArray(prData) ? prData : []);
      setLocalIncomes(Array.isArray(incomesData) ? incomesData : []);
      setLocalPayrolls(Array.isArray(payrollData) ? payrollData : []);
      setEmployeesList(Array.isArray(empData) ? empData : []);
      setAttendanceList(Array.isArray(attData) ? attData : []);
      
      // Auto-set child id default
      if (childrenList.length > 0 && !payChildId) {
        setPayChildId(childrenList[0].id);
      }
    } catch (err) {
      console.error("Error loading secondary lists:", err);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await fetch("/api/financial-reports");
      const data = await res.json();
      if (data && data.monthlyData) {
        setChartData(data.monthlyData);
      }
    } catch (err) {
      console.error("Chart data error:", err);
    }
  };

  const fetchAiInsights = async (forceRegenerate = false) => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/accountant/ai-insights");
      const data = await res.json();
      if (data && data.success && data.insights) {
        setAiInsights(data.insights);
        if (forceRegenerate) {
          triggerSuccess("AI Moliya Tahlili muvaffaqiyatli yangilandi!");
        }
      }
    } catch (err) {
      console.error("AI Insights error:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  // CRUD OPERATIONS
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) {
      triggerError("Xarajat summasi 0 dan katta bo'lishi kerak!");
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: expenseCategory,
          description: expenseDescription,
          amount: expenseAmount,
          paymentType: expensePaymentType,
          responsible: expenseResponsible,
          receiptUrl: expenseAttachment
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccess(`Xarajat kiritildi: ${expenseCategory} - ${expenseAmount.toLocaleString()} UZS`);
        setExpenseAmount(0);
        setExpenseDescription("");
        setExpenseAttachment(null);
        setExpenseModalOpen(false);
        onRefresh();
        fetchDashboardStats();
        fetchSecondaryLists();
        fetchChartData();
      }
    } catch (err) {
      triggerError("Xarajat kiritishda xatolik yuz berdi.");
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      triggerError("To'lov summasi 0 dan katta bo'lishi kerak!");
      return;
    }

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: payChildId,
          amount: payAmount,
          paymentType: payType,
          month: payMonth,
          status: payStatus,
          operatorName: user?.name || "Buxgalter"
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccess(`Muvaffaqiyatli to'lov qabul qilindi!`);
        setPayAmount(currentTuitionFee);
        setPaymentModalOpen(false);
        setSelectedReceipt(data.payment);
        onRefresh();
        fetchDashboardStats();
        fetchSecondaryLists();
        fetchChartData();
      }
    } catch (err) {
      triggerError("To'lov qabul qilishda xatolik yuz berdi.");
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (incAmount <= 0) {
      triggerError("Summa 0 dan katta bo'lishi kerak!");
      return;
    }

    try {
      const res = await fetch("/api/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: incSource,
          amount: incAmount,
          description: incDescription
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccess(`Tushum qo'shildi: ${incSource}`);
        setIncAmount(0);
        setIncDescription("");
        setIncomeModalOpen(false);
        onRefresh();
        fetchDashboardStats();
        fetchSecondaryLists();
      }
    } catch (err) {
      triggerError("Tushum qo'shishda xatolik yuz berdi.");
    }
  };

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: payrEmployeeId,
          baseSalary: payrBaseSalary,
          bonus: payrBonus,
          fine: payrFine,
          tax: payrTax,
          status: payrStatus
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccess(`Oylik to'lovi muvaffaqiyatli yakunlandi!`);
        setPayrollModalOpen(false);
        setPayrBonus(0);
        setPayrFine(0);
        onRefresh();
        fetchDashboardStats();
        fetchSecondaryLists();
      }
    } catch (err) {
      triggerError("Oylik to'lash jarayonida xatolik yuz berdi.");
    }
  };

  const handlePaySupplier = async (id: string) => {
    try {
      const res = await fetch(`/api/purchase-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "To'landi",
          approvedBy: user?.name || "Buxgalter"
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccess(`Xarid so'rovi to'landi va xarajatlarga avtomatik o'tkazildi!`);
        fetchDashboardStats();
        fetchSecondaryLists();
      }
    } catch (err) {
      triggerError("Xarid to'lovida xatolik yuz berdi.");
    }
  };

  const handleSettlePayroll = async (id: string) => {
    try {
      const res = await fetch(`/api/payroll/${id}/settle`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess("Kam to'langan oylik qarzi muvaffaqiyatli to'landi va status yangilandi! 💸");
        fetchDashboardStats();
        fetchSecondaryLists();
      } else {
        triggerError(data.message || "Xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
      triggerError("Oylik qarzini to'lashda texnik xatolik.");
    }
  };

  const exportAttendanceCSV = (type: "children" | "staff", period: "daily" | "weekly" | "monthly") => {
    const todayStr = new Date().toISOString().split("T")[0];
    const filteredRecords = attendanceList.filter(a => {
      const isEmployee = a.childId.startsWith("E-") || employeesList.some(e => e.id === a.childId);
      if (type === "children" && isEmployee) return false;
      if (type === "staff" && !isEmployee) return false;

      if (period === "daily") {
        return a.date === todayStr;
      } else if (period === "weekly") {
        const diffTime = Math.abs(new Date().getTime() - new Date(a.date).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
      } else {
        const diffTime = Math.abs(new Date().getTime() - new Date(a.date).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 30;
      }
    });

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    if (type === "children") {
      csvContent += "Sana,ID,Ism-Familiya,Guruh,Kelgan Vaqti,Ketgan Vaqti,Tana Harorati,Holat,Olib ketgan shaxs\n";
      filteredRecords.forEach(rec => {
        const ch = childrenList.find(c => c.id === rec.childId);
        const groupName = ch ? ch.groupId : "—";
        const childName = ch ? ch.name : `Bola (ID: ${rec.childId})`;
        const row = [
          rec.date,
          rec.childId,
          childName,
          groupName,
          rec.checkIn || "—",
          rec.checkOut || "—",
          rec.temperature ? `${rec.temperature}°C` : "—",
          rec.status || "—",
          rec.checkoutPersonName || "—"
        ].map(val => `"${val.replace(/"/g, '""')}"`).join(",");
        csvContent += row + "\n";
      });
    } else {
      csvContent += "Sana,ID,Ism-Familiya,Lavozim,Kelgan Vaqti,Ketgan Vaqti,Tana Harorati,Holat\n";
      filteredRecords.forEach(rec => {
        const emp = employeesList.find(e => e.id === rec.childId);
        const empName = emp ? emp.name : `Xodim (ID: ${rec.childId})`;
        const empRole = emp ? emp.role : "Xodim";
        const row = [
          rec.date,
          rec.childId,
          empName,
          empRole,
          rec.checkIn || "—",
          rec.checkOut || "—",
          rec.temperature ? `${rec.temperature}°C` : "—",
          rec.checkOut ? "Ishdan ketdi" : "Ayni vaqtda ishda"
        ].map(val => `"${val.replace(/"/g, '""')}"`).join(",");
        csvContent += row + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_attendance_${period}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccess(`${period === "daily" ? "Kunlik" : period === "weekly" ? "Haftalik" : "Oylik"} CSV hisobot muvaffaqiyatli yuklandi! 📥`);
  };

  const exportAttendancePDF = (type: "children" | "staff", period: "daily" | "weekly" | "monthly") => {
    const todayStr = new Date().toISOString().split("T")[0];
    const filteredRecords = attendanceList.filter(a => {
      const isEmployee = a.childId.startsWith("E-") || employeesList.some(e => e.id === a.childId);
      if (type === "children" && isEmployee) return false;
      if (type === "staff" && !isEmployee) return false;

      if (period === "daily") {
        return a.date === todayStr;
      } else if (period === "weekly") {
        const diffTime = Math.abs(new Date().getTime() - new Date(a.date).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
      } else {
        const diffTime = Math.abs(new Date().getTime() - new Date(a.date).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 30;
      }
    });

    const cleanText = (str: string): string => {
      if (!str) return "";
      const cyrillicToLatin: { [key: string]: string } = {
        'А': 'A', 'а': 'a', 'Б': 'B', 'б': 'b', 'В': 'V', 'в': 'v', 'Г': 'G', 'г': 'g',
        'Д': 'D', 'д': 'd', 'Е': 'E', 'е': 'e', 'Ё': 'Yo', 'ё': 'yo', 'Ж': 'J', 'ж': 'j',
        'З': 'Z', 'з': 'z', 'И': 'I', 'и': 'i', 'Й': 'Y', 'й': 'y', 'К': 'K', 'к': 'k',
        'Л': 'L', 'л': 'l', 'М': 'M', 'м': 'm', 'Н': 'N', 'н': 'n', 'О': 'O', 'о': 'o',
        'П': 'P', 'p': 'p', 'Р': 'R', 'р': 'r', 'С': 'S', 'с': 's', 'Т': 'T', 'т': 't',
        'У': 'U', 'у': 'u', 'Ф': 'F', 'ф': 'f', 'Х': 'X', 'х': 'x', 'Ц': 'Ts', 'ц': 'ts',
        'Ч': 'Ch', 'ч': 'ch', 'Ш': 'Sh', 'ш': 'sh', 'Ъ': "'", 'ъ': "'", 'Ы': 'Y', 'ы': 'y',
        'Ь': '', 'ь': '', 'Э': 'E', 'э': 'e', 'Ю': 'Yu', 'ю': 'yu', 'Я': 'Ya', 'ya': 'ya',
        'Ў': "O'", 'ў': "o'", 'Қ': 'Q', 'қ': 'q', 'Ғ': "G'", 'ғ': "g'", 'Ҳ': 'H', 'ҳ': 'h'
      };
      let cleaned = "";
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (cyrillicToLatin[char] !== undefined) {
          cleaned += cyrillicToLatin[char];
        } else if (char === "ʻ" || char === "ʼ" || char === "’" || char === "’" || char === "’" || char === "‘" || char === "`") {
          cleaned += "'";
        } else {
          const code = char.charCodeAt(0);
          if (code < 128) {
            cleaned += char;
          } else {
            cleaned += "?";
          }
        }
      }
      return cleaned;
    };

    try {
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      const title = `${type === "children" ? "BOLALAR" : "XODIMLAR"} DAVOMAT HISOBOTI (${period === "daily" ? "KUNLIK" : period === "weekly" ? "HAFTALIK" : "OYLIK"})`;
      doc.text(cleanText(title), 14, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(cleanText(`Generatsiya vaqti: ${new Date().toLocaleString()} • Jami yozuvlar: ${filteredRecords.length} ta`), 14, 26);

      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 30, 196, 30);

      let y = 38;
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      
      if (type === "children") {
        doc.text(cleanText("Sana"), 14, y);
        doc.text(cleanText("Bola F.I.O"), 35, y);
        doc.text(cleanText("Guruh"), 95, y);
        doc.text(cleanText("Kirish"), 135, y);
        doc.text(cleanText("Chiqish"), 155, y);
        doc.text(cleanText("Holat"), 175, y);
        
        y += 4;
        doc.line(14, y, 196, y);
        y += 6;
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        
        filteredRecords.forEach(rec => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          const ch = childrenList.find(c => c.id === rec.childId);
          const groupName = ch ? ch.groupId : "—";
          const childName = ch ? ch.name : `Bola (ID: ${rec.childId})`;
          
          doc.text(cleanText(rec.date), 14, y);
          doc.text(cleanText(childName.slice(0, 28)), 35, y);
          doc.text(cleanText(groupName.slice(0, 18)), 95, y);
          doc.text(cleanText(rec.checkIn || "—"), 135, y);
          doc.text(cleanText(rec.checkOut || "—"), 155, y);
          doc.text(cleanText(rec.status || "—"), 175, y);
          
          y += 6;
        });
      } else {
        doc.text(cleanText("Sana"), 14, y);
        doc.text(cleanText("Xodim F.I.O"), 35, y);
        doc.text(cleanText("Lavozimi"), 95, y);
        doc.text(cleanText("Kirish"), 135, y);
        doc.text(cleanText("Chiqish"), 155, y);
        doc.text(cleanText("Harorat"), 175, y);
        
        y += 4;
        doc.line(14, y, 196, y);
        y += 6;
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        
        filteredRecords.forEach(rec => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          const emp = employeesList.find(e => e.id === rec.childId);
          const empName = emp ? emp.name : `Xodim (ID: ${rec.childId})`;
          const empRole = emp ? emp.role : "Xodim";
          
          doc.text(cleanText(rec.date), 14, y);
          doc.text(cleanText(empName.slice(0, 28)), 35, y);
          doc.text(cleanText(empRole.slice(0, 18)), 95, y);
          doc.text(cleanText(rec.checkIn || "—"), 135, y);
          doc.text(cleanText(rec.checkOut || "—"), 155, y);
          doc.text(cleanText(rec.temperature ? `${rec.temperature}°C` : "—"), 175, y);
          
          y += 6;
        });
      }

      doc.save(`${type}_attendance_${period}_report.pdf`);
      triggerSuccess(`${period === "daily" ? "Kunlik" : period === "weekly" ? "Haftalik" : "Oylik"} PDF hisobot muvaffaqiyatli yuklandi! 📄`);
    } catch (err) {
      console.error(err);
      triggerError("Hisobot PDF generatsiya qilishda xatolik yuz berdi.");
    }
  };

  const cleanLatinText = (str: string): string => {
    if (!str) return "";
    const cyrillicToLatin: { [key: string]: string } = {
      'А': 'A', 'а': 'a', 'Б': 'B', 'б': 'b', 'В': 'V', 'в': 'v', 'Г': 'G', 'г': 'g',
      'Д': 'D', 'д': 'd', 'Е': 'E', 'е': 'e', 'Ё': 'Yo', 'ё': 'yo', 'Ж': 'J', 'ж': 'j',
      'З': 'Z', 'з': 'z', 'И': 'I', 'и': 'i', 'Й': 'Y', 'й': 'y', 'К': 'K', 'к': 'k',
      'Л': 'L', 'л': 'l', 'М': 'M', 'м': 'm', 'Н': 'N', 'н': 'n', 'О': 'O', 'о': 'o',
      'П': 'P', 'p': 'p', 'Р': 'R', 'р': 'r', 'С': 'S', 'с': 's', 'Т': 'T', 'т': 't',
      'У': 'U', 'у': 'u', 'Ф': 'F', 'ф': 'f', 'Х': 'X', 'х': 'x', 'Ц': 'Ts', 'ц': 'ts',
      'Ч': 'Ch', 'ч': 'ch', 'Ш': 'Sh', 'ш': 'sh', 'Ъ': "'", 'ъ': "'", 'Ы': 'Y', 'ы': 'y',
      'Ь': '', 'ь': '', 'Э': 'E', 'э': 'e', 'Ю': 'Yu', 'ю': 'yu', 'Я': 'Ya', 'я': 'ya',
      'Ў': "O'", 'ў': "o'", 'Қ': 'Q', 'қ': 'q', 'Ғ': "G'", 'ғ': "g'", 'Ҳ': 'H', 'ҳ': 'h'
    };
    let cleaned = "";
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (cyrillicToLatin[char] !== undefined) {
        cleaned += cyrillicToLatin[char];
      } else if (char === "ʻ" || char === "ʼ" || char === "’" || char === "’" || char === "’" || char === "‘" || char === "`") {
        cleaned += "'";
      } else {
        const code = char.charCodeAt(0);
        if (code < 128) {
          cleaned += char;
        } else {
          cleaned += "?";
        }
      }
    }
    return cleaned;
  };

  const generateSmartExcelReport = (type: "children" | "staff", period: "daily" | "weekly" | "monthly") => {
    const todayStr = new Date().toISOString().split("T")[0];
    const filteredRecords = attendanceList.filter(a => {
      const isEmployee = a.childId.startsWith("E-") || employeesList.some(e => e.id === a.childId);
      if (type === "children" && isEmployee) return false;
      if (type === "staff" && !isEmployee) return false;

      if (period === "daily") {
        return a.date === todayStr;
      } else if (period === "weekly") {
        const diffTime = Math.abs(new Date().getTime() - new Date(a.date).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
      } else {
        const diffTime = Math.abs(new Date().getTime() - new Date(a.date).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 30;
      }
    });

    let csvContent = "\uFEFF"; // UTF-8 BOM for MS Excel compatibility

    if (type === "staff") {
      csvContent += "MOLIYAVIY DAVOMAT SOLISHTIRUV JADVALI (XODIMLAR)\n";
      csvContent += `Sana: ${new Date().toLocaleDateString()} • Davr: ${period === "daily" ? "Kunlik" : period === "weekly" ? "Haftalik" : "Oylik"}\n\n`;
      csvContent += "Sana,Xodim ID,Ism-Familiya,Lavozimi,Kutilgan Vaqt (S),Amaldagi Vaqt (S),Holati,Harorat,Kechikish Jarimasi (UZS),Ish Kuni Qiymati (UZS),Sof Solishtiruv Summasi (UZS)\n";

      filteredRecords.forEach(rec => {
        const emp = employeesList.find(e => e.id === rec.childId);
        const empName = emp ? emp.name : `Xodim (${rec.childId})`;
        const empRole = emp ? emp.role : "Xodim";

        // Calculate hours
        let actualHours = smartExportWorkHours;
        if (rec.checkIn && rec.checkOut) {
          const [inH, inM] = rec.checkIn.split(":").map(Number);
          const [outH, outM] = rec.checkOut.split(":").map(Number);
          actualHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 10) / 10;
        } else if (!rec.checkIn) {
          actualHours = 0;
        }

        const isLate = rec.status === "Kechikdi";
        const penalty = isLate ? smartExportPenaltyRate : 0;
        const totalEarnings = rec.checkIn ? smartExportDailyRate : 0;
        const netReconciliation = Math.max(0, totalEarnings - penalty);

        const row = [
          rec.date,
          rec.childId,
          empName,
          empRole,
          smartExportWorkHours,
          actualHours,
          rec.status || (rec.checkIn ? "Keldi" : "Kelmagan"),
          rec.temperature ? `${rec.temperature}°C` : "—",
          penalty,
          totalEarnings,
          netReconciliation
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
        csvContent += row + "\n";
      });
    } else {
      csvContent += "MOLIYAVIY DAVOMAT VA TA'MINOT SOLISHTIRUV JADVALI (BOLALAR)\n";
      csvContent += `Sana: ${new Date().toLocaleDateString()} • Davr: ${period === "daily" ? "Kunlik" : period === "weekly" ? "Haftalik" : "Oylik"}\n\n`;
      csvContent += "Sana,Bola ID,Ism-Familiya,Guruh,Kelish Holati,Oziq-ovqat Porsiyasi (Ta'minot),Harorat,Chiqish Vaqti,Olib Ketgan Shaxs\n";

      filteredRecords.forEach(rec => {
        const ch = childrenList.find(c => c.id === rec.childId);
        const childName = ch ? ch.name : `Bola (${rec.childId})`;
        const groupName = ch ? ch.groupId : "—";
        const mealCount = (rec.status === "Keldi" || rec.status === "Kechikdi") ? 1 : 0;

        const row = [
          rec.date,
          rec.childId,
          childName,
          groupName,
          rec.status || "Kelmagan",
          mealCount,
          rec.temperature ? `${rec.temperature}°C` : "—",
          rec.checkOut || "—",
          rec.checkoutPersonName || "—"
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
        csvContent += row + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `moliya_smart_export_${type}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccess(`${period === "daily" ? "Kunlik" : period === "weekly" ? "Haftalik" : "Oylik"} moliyaviy Excel/CSV hisoboti muvaffaqiyatli yuklandi! 📈`);
  };

  const generateSmartPDFReport = (type: "children" | "staff", period: "daily" | "weekly" | "monthly") => {
    const todayStr = new Date().toISOString().split("T")[0];
    const filteredRecords = attendanceList.filter(a => {
      const isEmployee = a.childId.startsWith("E-") || employeesList.some(e => e.id === a.childId);
      if (type === "children" && isEmployee) return false;
      if (type === "staff" && !isEmployee) return false;

      if (period === "daily") {
        return a.date === todayStr;
      } else if (period === "weekly") {
        const diffTime = Math.abs(new Date().getTime() - new Date(a.date).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
      } else {
        const diffTime = Math.abs(new Date().getTime() - new Date(a.date).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 30;
      }
    });

    try {
      const doc = new jsPDF();
      
      // Page styling parameters
      const leftMargin = 14;
      const rightMargin = 196;
      let y = 18;

      // Draw Top Banner (Navy Slate style)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(14, y, 182, 38, "F");

      // Title & Header inside Banner
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.text(cleanLatinText("MOLIYAVIY SOLISHTIRUV VA DAVOMAT HISOBOTI"), 20, y + 12);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(200, 210, 220);
      const subTitle = `Turkum: ${type === "staff" ? "Xodimlar Ish-vaqti Nazorati" : "Oziq-ovqat va Bolalar Qatnovi"} • Eksport: Smart Accounting Controller`;
      doc.text(cleanLatinText(subTitle), 20, y + 18);
      
      doc.setFontSize(8);
      doc.text(cleanLatinText(`Generatsiya Sanasi: ${new Date().toLocaleString()} • Hisobchi: ${cleanLatinText(user?.name || "Bosh Hisobchi")}`), 20, y + 24);

      // Period badge inside Banner
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.rect(155, y + 8, 32, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text(cleanLatinText(period === "daily" ? "KUNLIK" : period === "weekly" ? "HAFTALIK" : "OYLIK"), 161, y + 14);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(cleanLatinText("RECONCILIATION"), 161, y + 19);

      y += 48;

      // Stats Section
      const totalPresent = filteredRecords.filter(r => r.status === "Keldi" || r.status === "Kechikdi" || r.checkIn).length;
      const totalLate = filteredRecords.filter(r => r.status === "Kechikdi").length;
      const totalAbsent = filteredRecords.length - totalPresent;
      const presenceRate = filteredRecords.length ? Math.round((totalPresent / filteredRecords.length) * 100) : 0;

      // Draw Stats Boxes
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      
      // Box 1
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 42, 18, "F");
      doc.rect(14, y, 42, 18, "D");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text(cleanLatinText("JAMI REKORDLAR"), 18, y + 5);
      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${filteredRecords.length}`, 18, y + 13);

      // Box 2
      doc.setFillColor(248, 250, 252);
      doc.rect(60, y, 42, 18, "F");
      doc.rect(60, y, 42, 18, "D");
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(cleanLatinText("HOZIR / KELDI"), 64, y + 5);
      doc.setTextColor(16, 185, 129);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${totalPresent}`, 64, y + 13);

      // Box 3
      doc.setFillColor(248, 250, 252);
      doc.rect(106, y, 42, 18, "F");
      doc.rect(106, y, 42, 18, "D");
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(cleanLatinText("KECHIKISH / JARIMA"), 110, y + 5);
      doc.setTextColor(244, 63, 94);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${totalLate}`, 110, y + 13);

      // Box 4
      doc.setFillColor(248, 250, 252);
      doc.rect(152, y, 44, 18, "F");
      doc.rect(152, y, 44, 18, "D");
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(cleanLatinText("QATNOV FOIZI"), 156, y + 5);
      doc.setTextColor(59, 130, 246);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${presenceRate}%`, 156, y + 13);

      y += 28;

      // Table Header Background
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 8, "F");
      doc.rect(14, y, 182, 8, "D");
      
      doc.setTextColor(71, 85, 105);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);

      if (type === "staff") {
        doc.text(cleanLatinText("Sana"), 17, y + 5.5);
        doc.text(cleanLatinText("Xodim F.I.O / Rol"), 38, y + 5.5);
        doc.text(cleanLatinText("Kutilgan/Haqiqiy"), 98, y + 5.5);
        doc.text(cleanLatinText("Holat"), 132, y + 5.5);
        doc.text(cleanLatinText("Jarima"), 152, y + 5.5);
        doc.text(cleanLatinText("Sof Solishtiruv"), 174, y + 5.5);

        y += 8;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        let totalPenaltiesSum = 0;
        let totalNetSum = 0;

        filteredRecords.forEach((rec, idx) => {
          if (y > 255) {
            doc.addPage();
            y = 20;
            // Draw mini header on new page
            doc.setFillColor(241, 245, 249);
            doc.rect(14, y, 182, 8, "F");
            doc.setTextColor(71, 85, 105);
            doc.setFont("Helvetica", "bold");
            doc.text(cleanLatinText("Sana"), 17, y + 5.5);
            doc.text(cleanLatinText("Xodim F.I.O / Rol"), 38, y + 5.5);
            doc.text(cleanLatinText("Kutilgan/Haqiqiy"), 98, y + 5.5);
            doc.text(cleanLatinText("Holat"), 132, y + 5.5);
            doc.text(cleanLatinText("Jarima"), 152, y + 5.5);
            doc.text(cleanLatinText("Sof Solishtiruv"), 174, y + 5.5);
            y += 8;
            doc.setFont("Helvetica", "normal");
          }

          const emp = employeesList.find(e => e.id === rec.childId);
          const empName = emp ? emp.name : `Xodim (ID: ${rec.childId})`;
          const empRole = emp ? emp.role : "Xodim";

          let actualHours = smartExportWorkHours;
          if (rec.checkIn && rec.checkOut) {
            const [inH, inM] = rec.checkIn.split(":").map(Number);
            const [outH, outM] = rec.checkOut.split(":").map(Number);
            actualHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 10) / 10;
          } else if (!rec.checkIn) {
            actualHours = 0;
          }

          const isLate = rec.status === "Kechikdi";
          const penalty = isLate ? smartExportPenaltyRate : 0;
          const totalEarnings = rec.checkIn ? smartExportDailyRate : 0;
          const netReconciliation = Math.max(0, totalEarnings - penalty);

          totalPenaltiesSum += penalty;
          totalNetSum += netReconciliation;

          // Zebra striping
          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(14, y, 182, 6, "F");
          }

          doc.setTextColor(100, 116, 139);
          doc.text(cleanLatinText(rec.date), 17, y + 4.5);
          doc.setTextColor(15, 23, 42);
          doc.text(cleanLatinText(`${empName.slice(0, 22)} (${empRole.slice(0, 12)})`), 38, y + 4.5);
          doc.text(cleanLatinText(`${smartExportWorkHours} s / ${actualHours} s`), 98, y + 4.5);
          
          if (isLate) {
            doc.setTextColor(239, 68, 68);
            doc.text(cleanLatinText("Kechikdi"), 132, y + 4.5);
          } else if (rec.checkIn) {
            doc.setTextColor(16, 185, 129);
            doc.text(cleanLatinText("Keldi"), 132, y + 4.5);
          } else {
            doc.setTextColor(148, 163, 184);
            doc.text(cleanLatinText("Kelmagan"), 132, y + 4.5);
          }

          doc.setTextColor(239, 68, 68);
          doc.text(penalty > 0 ? `${penalty.toLocaleString()} UZS` : "0", 152, y + 4.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${netReconciliation.toLocaleString()} UZS`, 174, y + 4.5);

          y += 6;
        });

        // Totals Row
        y += 2;
        doc.setLineWidth(0.5);
        doc.line(14, y, 196, y);
        y += 4;
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(cleanLatinText("JAMI RECONCILIATION SUMMARY:"), 17, y);
        doc.setTextColor(239, 68, 68);
        doc.text(`${totalPenaltiesSum.toLocaleString()} UZS`, 152, y);
        doc.setTextColor(16, 185, 129);
        doc.text(`${totalNetSum.toLocaleString()} UZS`, 174, y);

      } else {
        doc.text(cleanLatinText("Sana"), 17, y + 5.5);
        doc.text(cleanLatinText("Bola Ism-Familiyasi"), 38, y + 5.5);
        doc.text(cleanLatinText("Guruhi / Filial"), 100, y + 5.5);
        doc.text(cleanLatinText("Status"), 138, y + 5.5);
        doc.text(cleanLatinText("Oziq-ovqat"), 158, y + 5.5);
        doc.text(cleanLatinText("Harorati"), 178, y + 5.5);

        y += 8;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        let totalMeals = 0;

        filteredRecords.forEach((rec, idx) => {
          if (y > 255) {
            doc.addPage();
            y = 20;
            // Draw mini header on new page
            doc.setFillColor(241, 245, 249);
            doc.rect(14, y, 182, 8, "F");
            doc.setTextColor(71, 85, 105);
            doc.setFont("Helvetica", "bold");
            doc.text(cleanLatinText("Sana"), 17, y + 5.5);
            doc.text(cleanLatinText("Bola Ism-Familiyasi"), 38, y + 5.5);
            doc.text(cleanLatinText("Guruhi / Filial"), 100, y + 5.5);
            doc.text(cleanLatinText("Status"), 138, y + 5.5);
            doc.text(cleanLatinText("Oziq-ovqat"), 158, y + 5.5);
            doc.text(cleanLatinText("Harorati"), 178, y + 5.5);
            y += 8;
            doc.setFont("Helvetica", "normal");
          }

          const ch = childrenList.find(c => c.id === rec.childId);
          const childName = ch ? ch.name : `Bola (ID: ${rec.childId})`;
          const groupName = ch ? ch.groupId : "—";
          const mealCount = (rec.status === "Keldi" || rec.status === "Kechikdi") ? 1 : 0;
          totalMeals += mealCount;

          // Zebra striping
          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(14, y, 182, 6, "F");
          }

          doc.setTextColor(100, 116, 139);
          doc.text(cleanLatinText(rec.date), 17, y + 4.5);
          doc.setTextColor(15, 23, 42);
          doc.text(cleanLatinText(childName.slice(0, 30)), 38, y + 4.5);
          doc.text(cleanLatinText(groupName), 100, y + 4.5);
          
          if (rec.status === "Keldi") {
            doc.setTextColor(16, 185, 129);
            doc.text(cleanLatinText("Keldi"), 138, y + 4.5);
          } else if (rec.status === "Kechikdi") {
            doc.setTextColor(245, 158, 11);
            doc.text(cleanLatinText("Kechikdi"), 138, y + 4.5);
          } else {
            doc.setTextColor(239, 68, 68);
            doc.text(cleanLatinText(rec.status || "Kelmagan"), 138, y + 4.5);
          }

          doc.setTextColor(15, 23, 42);
          doc.text(mealCount > 0 ? "1 porsiya" : "0", 158, y + 4.5);
          doc.setTextColor(100, 116, 139);
          doc.text(rec.temperature ? `${rec.temperature}°C` : "36.5°C", 178, y + 4.5);

          y += 6;
        });

        // Totals Row
        y += 2;
        doc.setLineWidth(0.5);
        doc.line(14, y, 196, y);
        y += 4;
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(cleanLatinText("JAMI RECONCILIATION SUMMARY:"), 17, y);
        doc.text(cleanLatinText(`Ta'minot porsiyasi: ${totalMeals} ta porsiya ozuqa`), 140, y);
      }

      // Reconciliation Note
      y += 15;
      if (y > 240) {
        doc.addPage();
        y = 25;
      }
      doc.setFillColor(254, 252, 232); // yellow-50
      doc.setDrawColor(254, 240, 138); // yellow-200
      doc.rect(14, y, 182, 14, "F");
      doc.rect(14, y, 182, 14, "D");
      
      doc.setTextColor(113, 63, 18);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(cleanLatinText("MOLIYAVIY HISOBOT VA SOLISHTIRUV SHARTI:"), 18, y + 5);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.8);
      doc.text(cleanLatinText("Ushbu ma'lumotlar avtomatlashtirilgan FaceID biometrik datchiklari orqali yozib olingan bo'lib, oylik hisobotlar va"), 18, y + 9);
      doc.text(cleanLatinText("ish haqini hisoblash hamda bolalar oziq-ovqat xarajatlarini solishtirish uchun tasdiqlangan va asos bo'la oladi."), 18, y + 12);

      // Signatures
      y += 24;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);

      doc.line(18, y, 78, y);
      doc.line(118, y, 178, y);

      doc.setTextColor(71, 85, 105);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(cleanLatinText("Bosh Hisobchi"), 18, y + 5);
      doc.text(cleanLatinText("Muassasa Rahbari"), 118, y + 5);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(cleanLatinText("Imzo va muhr o'rni"), 18, y + 9);
      doc.text(cleanLatinText("Imzo va muhr o'rni"), 118, y + 9);

      // Save document
      doc.save(`smart_moliya_hisoboti_${type}_${period}.pdf`);
      triggerSuccess(`Moliyaviy solishtirish uchun maxsus PDF hisoboti muvaffaqiyatli yuklandi! 📄`);
    } catch (err) {
      console.error(err);
      triggerError("Moliyaviy PDF hisobotini tayyorlashda xatolik yuz berdi.");
    }
  };

  const handleCancelPayment = async (id: string) => {
    if (!window.confirm("Haqiqatan ham ushbu to'lovni bekor qilmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccess("To'lov muvaffaqiyatli bekor qilindi.");
        fetchDashboardStats();
        fetchSecondaryLists();
      }
    } catch (err) {
      triggerError("To'lovni bekor qilishda xatolik.");
    }
  };

  // NOTIFICATION SIMULATORS
  const handleSendTelegramReminder = async (debtor: any) => {
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "Telegram",
          recipient: debtor.phone,
          message: `Hurmatli ${debtor.parentName}, farzandingiz ${debtor.childName} ning Iyul oyi uchun bog'cha to'lovidan ${debtor.debtAmount.toLocaleString()} UZS qarzdorligi mavjud. Iltimos, imkon qadar tezroq to'lovni amalga oshirishingizni so'raymiz.`
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccess(`${debtor.childName} ota-onasiga Telegram orqali qarzdorlik eslatmasi yuborildi! 🔔`);
      }
    } catch (err) {
      triggerError("Eslatma yuborishda xatolik.");
    }
  };

  const handleQuickNotify = (channel: "SMS" | "Email" | "Qo'ng'iroq", debtor: any) => {
    triggerSuccess(`${debtor.childName} ota-onasiga ${channel} orqali so'rov yuborildi (Simulyatsiya) 📲`);
  };

  const handlePayDebtForChild = (childId: string, amount: number) => {
    setPayChildId(childId);
    setPayAmount(amount);
    setPayMonth("Iyul");
    setPaymentModalOpen(true);
  };

  // MOCK FILE UPLOAD HANDLERS
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      previewFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      previewFile(e.target.files[0]);
    }
  };

  const previewFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setExpenseAttachment(reader.result as string);
      triggerSuccess("Kvitansiya fayli muvaffaqiyatli biriktirildi!");
    };
    reader.readAsDataURL(file);
  };

  // FILTERED LISTS
  const filteredPayments = localPayments.filter(p => {
    const child = childrenList.find(c => c.id === p.childId);
    const childName = child ? child.name.toLowerCase() : "";
    const matchesSearch = childName.includes(searchPaymentQuery.toLowerCase()) || p.id.toLowerCase().includes(searchPaymentQuery.toLowerCase());
    const matchesStatus = filterPaymentStatus === "all" || p.status === filterPaymentStatus;
    const matchesMonth = filterPaymentMonth === "all" || p.month === filterPaymentMonth;
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const filteredDebtors = localDebtors.filter(d => {
    return d.childName.toLowerCase().includes(searchDebtorQuery.toLowerCase()) || d.parentName.toLowerCase().includes(searchDebtorQuery.toLowerCase());
  });

  const filteredExpenses = localExpenses.filter(e => {
    return filterExpenseCategory === "all" || e.category === filterExpenseCategory;
  });

  // Calculate standard stats totals
  const totalInflows = localPayments.reduce((sum, p) => sum + p.amount, 0) + localIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalOutflows = localExpenses.reduce((sum, e) => sum + e.amount, 0);
  const computedProfit = totalInflows - totalOutflows;

  const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
  const expenseCategories = [
    "Oziq-ovqat", "Kommunal xizmatlar", "Ish haqi", "Tozalash vositalari", 
    "O'yinchoqlar", "Ta'mirlash", "Transport", "Soliq", "Boshqa xarajatlar"
  ];

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* HEADER SECTION WITH REFRESH BUTTON */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold rounded-lg uppercase tracking-wider">
              Buxgalteriya suite
            </span>
            <span className="text-slate-500 font-mono text-[11px]">UTC: 2026-07-04</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Moliya va Buxgalteriya Tizimi
          </h2>
          <p className="text-xs text-slate-400">
            Kindergaten moliya oqimlari, to'lovlar, qarzdorliklar, soliq va ish haqini tahlil qilish bo'limi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchDashboardStats();
              fetchSecondaryLists();
              fetchChartData();
              fetchAiInsights(true);
            }}
            className="p-3 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl cursor-pointer flex items-center justify-center transition-all hover:text-white"
            title="Ma'lumotlarni yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={() => setPaymentModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> To'lov Qabul Qilish
          </button>
          
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Yangi Xarajat
          </button>
        </div>
      </div>

      {/* TOP-LEVEL FINANCIAL STATUS CARDS (REAL-TIME DATA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        
        {/* Today's Income */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-750 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bugungi Tushum</span>
            <div className="text-lg md:text-xl font-black text-emerald-400 font-mono">
              +{stats.bugungiTushum.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">UZS</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Sana: bugun</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Monthly Income */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-750 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Oylik Umumiy Tushum</span>
            <div className="text-lg md:text-xl font-black text-sky-400 font-mono">
              {(stats.oylikDaromad).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">UZS</span>
            </div>
            <span className="text-[9px] text-emerald-500 font-bold">Iyul oyi daromadi</span>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-750 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bugungi Xarajatlar</span>
            <div className="text-lg md:text-xl font-black text-rose-400 font-mono">
              -{stats.bugungiXarajat.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">UZS</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Bugun to'langan</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        {/* Debtors count */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-750 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qarzdor Ota-onalar</span>
            <div className="text-lg md:text-xl font-black text-amber-500 font-mono">
              {stats.qarzdorOtaOnalarSoni} <span className="text-[10px] font-normal text-slate-400">guruh</span>
            </div>
            <span className="text-[9px] text-rose-500 font-bold font-mono">Iyul oyi qarzdorligi</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-750 transition-colors sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sof Operatsion Foyda</span>
            <div className={`text-lg md:text-xl font-black font-mono ${computedProfit >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
              {computedProfit.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">UZS</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Hozirgi hisob-kitob</span>
          </div>
          <div className={`p-3 rounded-xl ${computedProfit >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* NAVIGATION TABS RAIL */}
      <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
        {[
          { id: "dashboard", label: "Dashboard & AI", icon: BarChart3 },
          { id: "payments", label: "Oylik To'lovlar", icon: CreditCard },
          { id: "debtors", label: "Qarzdorlar Ro'yxati", icon: ShieldAlert },
          { id: "expenses", label: "Xarajatlar Jurnali", icon: ClipboardList },
          { id: "payroll", label: "Xodimlar Maoshi", icon: UserCheck },
          { id: "requests", label: "Xarid So'rovlari", icon: FileText },
          { id: "reports", label: "Hisobotlar Hub", icon: FileSpreadsheet },
          { id: "sms", label: "SMS Shlyuzi", icon: Send },
          { id: "settings", label: "Tizim Sozlamalari", icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
                isActive 
                  ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-md" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* NOTIFICATIONS BOX */}
      <AnimatePresence>
        {notifSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs flex items-center gap-3 shadow-lg"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{notifSuccess}</span>
          </motion.div>
        )}
        {notifError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl text-xs flex items-center gap-3 shadow-lg"
          >
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{notifError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB CONTENTS CONTAINER */}
      <div className="min-h-[500px]">

        {/* 1. DASHBOARD & AI PANEL */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Recharts financial area analysis & method distribution */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Financial area comparison chart */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Daromadlar va Xarajatlar Balansi
                    </h3>
                    <p className="text-[10px] text-slate-400">Yillik moliya oqimlari dinamikasi (Iyul oyi yangilangan)</p>
                  </div>
                  <div className="flex gap-4 text-[10px] font-bold font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block"></span> Tushumlar
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 block"></span> Chiqimlar
                    </span>
                  </div>
                </div>

                <div className="h-[250px] w-full text-xs">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDaromad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorXarajat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "1rem" }}
                          formatter={(value: any) => [`${value.toLocaleString()} UZS`, ""]}
                        />
                        <Area type="monotone" dataKey="daromad" name="Daromad" stroke="#10b981" fillOpacity={1} fill="url(#colorDaromad)" strokeWidth={2.5} />
                        <Area type="monotone" dataKey="xarajat" name="Xarajat" stroke="#f43f5e" fillOpacity={1} fill="url(#colorXarajat)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">Moliya ko'rsatkichlari grafik tahlili...</div>
                  )}
                </div>
              </div>

              {/* Bento Row: Payment Method Pie Chart + Recent transactions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Payment Methods Distribution */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">To'lov Usullari Taqsimoti</h3>
                    <p className="text-[10px] text-slate-400">Tranzaksiyalarning to'lov provayderlari bo'yicha tahlili</p>
                  </div>

                  <div className="h-[180px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Click", value: localPayments.filter(p => p.paymentType === "Click").reduce((s, p) => s + p.amount, 0) },
                            { name: "Payme", value: localPayments.filter(p => p.paymentType === "Payme").reduce((s, p) => s + p.amount, 0) },
                            { name: "Naqd", value: localPayments.filter(p => p.paymentType === "Naqd").reduce((s, p) => s + p.amount, 0) },
                            { name: "Bank / Humo", value: localPayments.filter(p => ["Humo", "Visa", "Mastercard"].includes(p.paymentType)).reduce((s, p) => s + p.amount, 0) },
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {[
                            { name: "Click", color: "#10b981" },
                            { name: "Payme", color: "#06b6d4" },
                            { name: "Naqd", color: "#f59e0b" },
                            { name: "Bank / Humo", color: "#ec4899" }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value.toLocaleString()} UZS`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2.5 text-[10px] shrink-0 font-bold font-mono">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded bg-[#10b981]"></span> Click
                      </span>
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <span className="w-2 h-2 rounded bg-[#06b6d4]"></span> Payme
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-2 h-2 rounded bg-[#f59e0b]"></span> Naqd Pul
                      </span>
                      <span className="flex items-center gap-1.5 text-pink-400">
                        <span className="w-2 h-2 rounded bg-[#ec4899]"></span> Boshqa
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick financial calendar deadlines */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider block">Moliyaviy Kalendar deadlines</h4>
                    <p className="text-[10px] text-slate-500">Eng yaqin to'lov muddatlari va soliq majburiyatlari</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-950 border-l-2 border-emerald-500 rounded-r-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">Maosh hisoblash kuni</div>
                        <span className="text-[9px] text-slate-500">Har oyning 1-sanasida</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">01-Avgust</span>
                    </div>

                    <div className="p-2.5 bg-slate-950 border-l-2 border-rose-500 rounded-r-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">Soliqlar va hisobot topshirish</div>
                        <span className="text-[9px] text-slate-500">Bog'cha soliq deklaratsiyalari</span>
                      </div>
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-mono">15-Iyul</span>
                    </div>

                    <div className="p-2.5 bg-slate-950 border-l-2 border-amber-500 rounded-r-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">Kommunal provayderlar to'lovi</div>
                        <span className="text-[9px] text-slate-500">Elektr va Isitish quvvati</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono">20-Iyul</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Chef Expenditures and Supplies Direct Real-Time Summary */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-400" /> Oshpaz Xarajatlari va Ta'minot Monitoringi
                    </h3>
                    <p className="text-[10px] text-slate-400">Oshpaz tomonidan kiritilgan oziq-ovqat va to'g'ridan-to'g'ri xaridlar real-vaqt nazorati</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-black px-2.5 py-1 rounded-full border border-emerald-500/15">
                    Real-Time Auto-Linked
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex flex-col justify-between">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Oshpaz To'g'ridan-to'g'ri Xarid</span>
                    <span className="text-base font-black text-rose-400 font-mono mt-1">
                      -{localExpenses.filter(e => e.responsible === "Oshpaz").reduce((sum, e) => sum + e.amount, 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">UZS</span>
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex flex-col justify-between">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Jami Oziq-ovqat Turkumi</span>
                    <span className="text-base font-black text-amber-400 font-mono mt-1">
                      -{localExpenses.filter(e => e.category === "Oziq-ovqat").reduce((sum, e) => sum + e.amount, 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">UZS</span>
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex flex-col justify-between">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Kitchen Tranzaksiyalar</span>
                    <span className="text-base font-black text-sky-400 font-mono mt-1">
                      {localExpenses.filter(e => e.responsible === "Oshpaz").length} ta hisob-varaq
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 uppercase font-black text-[9px] tracking-wider">
                        <th className="pb-2">Sana</th>
                        <th className="pb-2">Xarid Details</th>
                        <th className="pb-2">Hisob Turi</th>
                        <th className="pb-2 text-right">Summa (UZS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/50">
                      {localExpenses.filter(e => e.responsible === "Oshpaz").slice(0, 5).map((e) => (
                        <tr key={e.id} className="hover:bg-slate-950/20 transition-colors">
                          <td className="py-2.5 text-slate-400 font-mono">{e.date}</td>
                          <td className="py-2.5 font-semibold text-slate-200">{e.description}</td>
                          <td className="py-2.5">
                            <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-bold rounded-md border border-rose-500/10">
                              Oshpaz Xarajati
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-bold text-rose-400 font-mono">-{e.amount.toLocaleString()} UZS</td>
                        </tr>
                      ))}
                      {localExpenses.filter(e => e.responsible === "Oshpaz").length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                            Oshpaz tomonidan kiritilgan to'g'ridan-to'g'ri xaridlar hozircha mavjud emas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right: AI Finance panel using Gemini API */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-5 relative overflow-hidden flex flex-col justify-between min-h-[460px]">
                
                {/* Background decorative brain */}
                <div className="absolute top-1 right-2 opacity-5 pointer-events-none">
                  <Brain className="w-32 h-32 text-emerald-400" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
                        <Brain className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">AI Finance Optimizer</h3>
                        <span className="text-[9px] text-slate-500 font-mono">Powered by Gemini-3.5-flash</span>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchAiInsights(true)}
                      disabled={loadingAi}
                      className="p-1.5 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                      title="AI Tahlilini Yangilash"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin text-emerald-400' : ''}`} />
                    </button>
                  </div>

                  {loadingAi ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-slate-400 font-medium animate-pulse">Gemini AI bog'cha moliyasini tahlil qilmoqda, iltimos kuting...</p>
                    </div>
                  ) : aiInsights ? (
                    <div className="space-y-4 text-xs">
                      
                      {/* Health Score Widget */}
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Moliya Sog'lomlik Balli</span>
                          <span className="text-xs text-slate-400 mt-0.5 block">Daromad-chiqim munosabati</span>
                        </div>
                        <div className="relative flex items-center justify-center w-12 h-12">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                            <circle cx="24" cy="24" r="20" stroke="#10b981" strokeWidth="4" fill="transparent" 
                              strokeDasharray={`${2 * Math.PI * 20}`}
                              strokeDashoffset={`${2 * Math.PI * 20 * (1 - aiInsights.healthScore / 100)}`}
                            />
                          </svg>
                          <span className="absolute text-xs font-black font-mono text-emerald-400">{aiInsights.healthScore}%</span>
                        </div>
                      </div>

                      {/* Brief summary */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">AI Tahliliy Xulosa</span>
                        <p className="text-slate-300 leading-relaxed italic bg-slate-950/60 p-3 rounded-2xl border border-slate-850/60">{aiInsights.summary}</p>
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kost-Optimallashtirish Tavsiyalari:</span>
                        <ul className="space-y-1.5">
                          {aiInsights.recommendations?.map((rec: string, i: number) => (
                            <li key={i} className="flex gap-2 text-slate-300">
                              <span className="text-emerald-400 font-bold shrink-0">•</span>
                              <span className="leading-relaxed">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Upcoming Notices */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Eslatmalar va Bildirishnomalar:</span>
                        <ul className="space-y-1">
                          {aiInsights.upcomingNotifications?.map((notif: string, i: number) => (
                            <li key={i} className="flex gap-2 text-[11px] text-amber-400 font-medium">
                              <span className="shrink-0">⚠️</span>
                              <span className="leading-relaxed">{notif}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                      <p>AI tahlil ma'lumotlari mavjud emas.</p>
                      <button
                        onClick={() => fetchAiInsights(true)}
                        className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                      >
                        Tahlilni boshlash
                      </button>
                    </div>
                  )}

                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 text-[10px] text-slate-500 leading-relaxed mt-4">
                  💡 Gemini AI moliya koeffitsiyentlarini bog'chaga yuklangan tushumlar va ish haqi reestrlari asosida real vaqtda yangilab boradi.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 2. CHILD PAYMENTS TAB (DETAILED DATA TABLE) */}
        {activeTab === "payments" && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            
            {/* Table Header & Search Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-white font-bold text-sm">Oylik To'lovlar va Tushumlar Reestri</h3>
                <span className="text-[10px] text-slate-400 block">Jami {filteredPayments.length} ta oylik to'lov tranzaksiyalari topildi</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 md:w-56 min-w-[180px] text-xs">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchPaymentQuery}
                    onChange={(e) => setSearchPaymentQuery(e.target.value)}
                    placeholder="Bola ismi yoki ID bo'yicha..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 pl-9 text-white placeholder-slate-500 text-xs outline-none"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs outline-none"
                >
                  <option value="all">Barcha holatlar</option>
                  <option value="To'landi">To'landi</option>
                  <option value="Qisman">Qisman to'landi</option>
                  <option value="Qarzdor">Qarzdorlar</option>
                </select>

                {/* Month Filter */}
                <select
                  value={filterPaymentMonth}
                  onChange={(e) => setFilterPaymentMonth(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs outline-none"
                >
                  <option value="all">Barcha oylar</option>
                  {months.map(m => (
                    <option key={m} value={m}>{m} oyi</option>
                  ))}
                </select>

                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> To'lov Qabul Qilish
                </button>
              </div>
            </div>

            {/* Payments Data Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">To'lov ID</th>
                    <th className="py-3 px-4">Bola Ismi</th>
                    <th className="py-3 px-4">Guruh</th>
                    <th className="py-3 px-4">Ota-ona</th>
                    <th className="py-3 px-4">Oy</th>
                    <th className="py-3 px-4">Summa (UZS)</th>
                    <th className="py-3 px-4">To'lov Turi</th>
                    <th className="py-3 px-4">Sana</th>
                    <th className="py-3 px-4 text-center">Holati</th>
                    <th className="py-3 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredPayments.map((p) => {
                    const child = childrenList.find(c => c.id === p.childId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{p.id}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{child ? child.name : `Bola (ID: ${p.childId})`}</td>
                        <td className="py-3.5 px-4 text-slate-300">Kamalak (G-1)</td>
                        <td className="py-3.5 px-4 text-slate-400">
                          <div className="font-medium text-slate-300">{child ? child.parentName : "Dilshod Karimov"}</div>
                          <span className="text-[10px] font-mono">{child ? child.parentPhone : "+998"}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">{p.month}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">+{p.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded font-mono text-[9px] uppercase font-bold tracking-wider">
                            {p.paymentType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{p.date}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            p.status === "To'landi" ? "bg-emerald-500/10 text-emerald-400" :
                            p.status === "Qisman" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedReceipt(p)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-emerald-400 text-slate-400 rounded-lg cursor-pointer transition-colors"
                              title="Kvitansiyani ko'rish & chop etish"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                handleCancelPayment(p.id);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-lg cursor-pointer transition-colors"
                              title="Bekor qilish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Hech qanday oylik to'lov tranzaksiyalari topilmadi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 3. DEBTORS MANAGEMENT TAB */}
        {activeTab === "debtors" && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-6">
            
            {/* Debt Alerts (To'lov muddati o'tib ketganlar bo'limi) */}
            {localDebtors.some((d: any) => d.monthsDebt >= 2 || d.status === "To'lanmagan") && (
              <div className="bg-rose-950/25 border-2 border-rose-500/20 p-5 rounded-2xl space-y-3 shadow-lg animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/10 pb-2">
                  <div>
                    <h4 className="text-rose-400 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block"></span>
                      🚨 TO'LOV MUDDATI O'TIB KETGANLAR (DEBT ALERTS)
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Ushbu tarbiyalanuvchilarning oylik to'lovi 2 oy yoki undan ortiq muddatga kechikkan. Quyidagi tezkor tugmalar orqali Telegram botiga avtomatik ogohlantirish yuboring.
                    </p>
                  </div>
                  <span className="bg-rose-500/15 text-rose-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-500/25 shrink-0 self-start sm:self-center">
                    Muddati o'tgan: {localDebtors.filter((d: any) => d.monthsDebt >= 2 || d.status === "To'lanmagan").length} ta
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {localDebtors
                    .filter((d: any) => d.monthsDebt >= 2 || d.status === "To'lanmagan")
                    .map((d: any) => (
                      <div key={d.id} className="bg-slate-950/80 border border-rose-900/30 p-3 rounded-xl flex flex-col justify-between gap-3 shadow-sm hover:border-rose-500/30 transition-all">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-[13px]">{d.childName}</span>
                            <span className="bg-rose-500/15 text-rose-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono border border-rose-500/10">
                              {d.monthsDebt} oy kechikkan
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">Guruh: <span className="text-slate-300">{d.groupName}</span></div>
                          <div className="text-[10px] text-slate-400 font-medium">Ota-ona: <span className="text-slate-200">{d.parentName}</span></div>
                          <div className="text-[10px] text-slate-400 font-mono">Tel: <span className="text-slate-300">{d.phone}</span></div>
                          <div className="pt-1.5 flex items-baseline gap-1 text-rose-400 font-mono font-extrabold text-[13px]">
                            <span>Qarzdorlik:</span>
                            <span>-{d.debtAmount.toLocaleString()} UZS</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSendTelegramReminder(d)}
                          className="w-full bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 shadow-md hover:shadow-rose-500/10"
                        >
                          <Send className="w-3 h-3" /> Telegramda Eslatish (Avto)
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" /> Qarzdor Ota-onalar Jurnali
                </h3>
                <span className="text-[10px] text-slate-400 block">Jami {filteredDebtors.length} ta oylik to'lovdan qarzdor bo'lgan tarbiyalanuvchilar ro'yxati</span>
              </div>

              <div className="relative w-full md:w-64 text-xs">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchDebtorQuery}
                  onChange={(e) => setSearchDebtorQuery(e.target.value)}
                  placeholder="Bola yoki ota-ona ismi bo'yicha..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 pl-9 text-white placeholder-slate-500 text-xs outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">Tarbiyalanuvchi</th>
                    <th className="py-3 px-4">Guruh</th>
                    <th className="py-3 px-4">Ota-ona (F.I.O)</th>
                    <th className="py-3 px-4">Telefon Raqam</th>
                    <th className="py-3 px-4 font-mono">Qarzdorlik miqdori</th>
                    <th className="py-3 px-4 text-center font-mono">Muddati o'tgan</th>
                    <th className="py-3 px-4">Oxirgi To'lov</th>
                    <th className="py-3 px-4 text-center">To'lov Holati</th>
                    <th className="py-3 px-4 text-right">Eslatmalar yuborish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredDebtors.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{d.childName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {d.childId}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-300">{d.groupName}</td>
                      <td className="py-3.5 px-4 text-slate-200 font-medium">{d.parentName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{d.phone}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400">-{d.debtAmount.toLocaleString()} UZS</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">{d.monthsDebt} oy</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{d.lastPaymentDate}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          d.status === "Qisman" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handlePayDebtForChild(d.childId, d.debtAmount)}
                            className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 rounded-lg cursor-pointer transition-all flex items-center gap-1 font-bold text-[10px]"
                            title="Qarzdorlik uchun to'lov qabul qilish"
                          >
                            <CreditCard className="w-3.5 h-3.5 font-bold" /> To'lov Qilish
                          </button>
                          <button
                            onClick={() => handleSendTelegramReminder(d)}
                            className="p-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-slate-950 rounded-lg cursor-pointer transition-all flex items-center gap-1 font-bold text-[10px]"
                            title="Telegram botga qarzdorlik kvitansiyasini yuborish"
                          >
                            <Send className="w-3.5 h-3.5" /> Telegram
                          </button>
                          <button
                            onClick={() => handleQuickNotify("SMS", d)}
                            className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                            title="SMS Eslatma"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleQuickNotify("Qo'ng'iroq", d)}
                            className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                            title="Muloqot"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredDebtors.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        Qarzdor oilalar aniqlanmadi, barcha o'quvchilar hisoblari yopilgan! 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 4. EXPENSE MANAGEMENT TAB (MODAL TRIGGER + LOG TABLE) */}
        {activeTab === "expenses" && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-white font-bold text-sm">Xarajatlar Jurnali va To'lovlar Reestri</h3>
                <span className="text-[10px] text-slate-400 block">Joriy oydagi operatsion, ta'minot, oziq-ovqat va soliq xarajatlari jurnali</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterExpenseCategory}
                  onChange={(e) => setFilterExpenseCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs outline-none"
                >
                  <option value="all">Barcha turkumlar</option>
                  {expenseCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <button
                  onClick={() => setExpenseModalOpen(true)}
                  className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Yangi Xarajat Kiritish
                </button>
              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">Xarajat ID</th>
                    <th className="py-3 px-4">Sana</th>
                    <th className="py-3 px-4">Turkum (Kategoriya)</th>
                    <th className="py-3 px-4">Tavsif (Details)</th>
                    <th className="py-3 px-4">Summa (UZS)</th>
                    <th className="py-3 px-4">Mas'ul Shaxs</th>
                    <th className="py-3 px-4">To'lov Turi</th>
                    <th className="py-3 px-4 text-center">Fayl / Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{e.id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{e.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-[10px]">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium max-w-[280px] truncate" title={e.description}>
                        {e.description || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400">-{e.amount.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-slate-300">{e.responsible}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-400 font-mono text-[10px]">{e.paymentType}</td>
                      <td className="py-3.5 px-4 text-center">
                        {e.receiptUrl ? (
                          <button
                            onClick={() => {
                              // Simulated photo view modal
                              alert("Kvitansiya fayli biriktirilgan. Tasvir yuborish va audit uchun xavfsiz.");
                            }}
                            className="p-1 hover:text-emerald-400 text-slate-400 cursor-pointer"
                          >
                            <Paperclip className="w-4 h-4 mx-auto" />
                          </button>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Hech qanday xarajat hujjati qayd etilmagan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 5. EMPLOYEE PAYROLL SUITE */}
        {activeTab === "payroll" && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-white font-bold text-sm">Xodimlar Ish Haqi va Oylik Maoshlari</h3>
                <span className="text-[10px] text-slate-400 block">Tarbiyachilar, oshpazlar, hamshira va rahbariyat maoshi reyestri (12% soliq ushlanadi)</span>
              </div>

              <button
                onClick={() => setPayrollModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Oylik To'lash & Hisoblash
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">Maosh ID</th>
                    <th className="py-3 px-4">Xodim F.I.O</th>
                    <th className="py-3 px-4">Lavozimi</th>
                    <th className="py-3 px-4 font-mono">Asosiy Oylik</th>
                    <th className="py-3 px-4 font-mono">Bonus</th>
                    <th className="py-3 px-4 font-mono">Jarima</th>
                    <th className="py-3 px-4 font-mono">Soliq (12%)</th>
                    <th className="py-3 px-4 font-mono text-emerald-400">Yakuniy Maosh</th>
                    <th className="py-3 px-4">To'langan Sana</th>
                    <th className="py-3 px-4 text-center">To'lov Holati</th>
                    <th className="py-3 px-4 text-right">Harakatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {localPayrolls.map((payr) => (
                    <tr key={payr.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{payr.id}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{payr.employeeName}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-400">{payr.employeeRole}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{payr.baseSalary.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400">+{payr.bonus.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono text-rose-400">-{payr.fine.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono text-amber-500">-{payr.tax.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-400">{payr.finalAmount.toLocaleString()} UZS</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{payr.date}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          payr.status === "To'landi" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500 animate-pulse"
                        }`}>
                          {payr.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {payr.status !== "To'landi" ? (
                          <button
                            onClick={() => handleSettlePayroll(payr.id)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                          >
                            Qarzni berish (To'lov)
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-bold">To'liq to'langan ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Employee & Child Attendance Section */}
            <div className="border-t border-slate-800 pt-6 mt-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-400" /> Muassasa Qatnov va Davomat Jurnali (Auto-FaceID)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    FaceID biometriya darvozalari, QR kod datchiklari va harorat datchiklari orqali xodimlar va bolalarning kelib-ketish vaqtlari avtomatik ravishda datchik darchasida ro'yxatga olingan vaqtlar.
                  </p>
                </div>
              </div>

              {/* Sub tab selectors for children vs staff */}
              <div className="flex gap-2 border-b border-slate-800 pb-1">
                <button
                  type="button"
                  onClick={() => setAttendanceSubTab("staff")}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    attendanceSubTab === "staff"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-slate-400 hover:text-slate-100"
                  }`}
                >
                  Xodimlar Davomati
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceSubTab("children")}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    attendanceSubTab === "children"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-slate-400 hover:text-slate-100"
                  }`}
                >
                  Bolalar Davomati
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-850">
                <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {(["daily", "weekly", "monthly"] as const).map(filter => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setAttendanceFilter(filter)}
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        attendanceFilter === filter
                          ? "bg-slate-800 text-white border border-slate-750"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {filter === "daily" ? "Kunlik" : filter === "weekly" ? "Haftalik" : "Oylik"}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Hisobotni yuklash ({attendanceFilter === "daily" ? "Kunlik" : attendanceFilter === "weekly" ? "Haftalik" : "Oylik"}):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSmartExportType(attendanceSubTab);
                      setSmartExportPeriod(attendanceFilter);
                      setSmartExportModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-550 text-white text-[11px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 shadow-lg shadow-indigo-500/10 border border-indigo-500/20 mr-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" /> Smart Export ✨
                  </button>
                  <button
                    type="button"
                    onClick={() => exportAttendanceCSV(attendanceSubTab, attendanceFilter)}
                    className="bg-emerald-600 hover:bg-emerald-550 text-white text-[11px] px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors"
                  >
                    📥 CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportAttendancePDF(attendanceSubTab, attendanceFilter)}
                    className="bg-sky-600 hover:bg-sky-550 text-white text-[11px] px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors"
                  >
                    📄 PDF
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto text-xs">
                {attendanceSubTab === "staff" ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                        <th className="py-3 px-4">Sana</th>
                        <th className="py-3 px-4">Xodim F.I.O</th>
                        <th className="py-3 px-4">Lavozimi</th>
                        <th className="py-3 px-4 font-mono">Kelgan vaqti</th>
                        <th className="py-3 px-4 font-mono">Ketgan vaqti</th>
                        <th className="py-3 px-4 font-mono text-center">Tana Harorati</th>
                        <th className="py-3 px-4">Datchik IP / Qurilma</th>
                        <th className="py-3 px-4 text-right">Holati</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {attendanceList
                        .filter(att => {
                          const isEmployee = att.childId.startsWith("E-") || employeesList.some(e => e.id === att.childId);
                          if (!isEmployee) return false;
                          
                          const todayStr = new Date().toISOString().split("T")[0];
                          if (attendanceFilter === "daily") {
                            return att.date === todayStr;
                          } else if (attendanceFilter === "weekly") {
                            const diffTime = Math.abs(new Date().getTime() - new Date(att.date).getTime());
                            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
                          } else {
                            const diffTime = Math.abs(new Date().getTime() - new Date(att.date).getTime());
                            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 30;
                          }
                        })
                        .map((att) => {
                          const emp = employeesList.find(e => e.id === att.childId);
                          const tempVal = att.temperature || 36.5;
                          return (
                            <tr key={att.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-4 font-mono text-slate-400">{att.date}</td>
                              <td className="py-3 px-4 font-bold text-white">{emp ? emp.name : `Xodim (ID: ${att.childId})`}</td>
                              <td className="py-3 px-4 text-slate-400 font-medium">{emp ? emp.role : "Xodim"}</td>
                              <td className="py-3 px-4">
                                {att.checkIn ? (
                                  <span className="bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded font-bold">{att.checkIn}</span>
                                ) : (
                                  <span className="text-slate-600 font-mono">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {att.checkOut ? (
                                  <span className="bg-sky-500/10 text-sky-400 font-mono px-2 py-0.5 rounded font-bold">{att.checkOut}</span>
                                ) : (
                                  <span className="text-slate-600 font-mono">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center font-mono">
                                <span className={`font-bold ${tempVal >= 37.5 ? "text-rose-400" : "text-emerald-400"}`}>
                                  {tempVal}°C
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">{att.deviceIp || "192.168.1.221"}</td>
                              <td className="py-3 px-4 text-right">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  att.checkOut ? "bg-slate-800 text-slate-400" : "bg-emerald-500/15 text-emerald-400"
                                }`}>
                                  {att.checkOut ? "Ishdan ketgan" : "Ayni vaqtda ishda"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                       {attendanceList.filter(att => {
                         const isEmployee = att.childId.startsWith("E-") || employeesList.some(e => e.id === att.childId);
                         if (!isEmployee) return false;
                         
                         const todayStr = new Date().toISOString().split("T")[0];
                         if (attendanceFilter === "daily") {
                           return att.date === todayStr;
                         } else if (attendanceFilter === "weekly") {
                           const diffTime = Math.abs(new Date().getTime() - new Date(att.date).getTime());
                           return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
                         } else {
                           const diffTime = Math.abs(new Date().getTime() - new Date(att.date).getTime());
                           return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 30;
                         }
                       }).length === 0 && (
                         <tr>
                           <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                             Ushbu davr ({attendanceFilter === "daily" ? "Bugun" : attendanceFilter === "weekly" ? "Shu hafta" : "Shu oy"}) uchun hech qanday xodim qatnovi yozuvlari topilmadi.
                           </td>
                         </tr>
                       )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                        <th className="py-3 px-4">Sana</th>
                        <th className="py-3 px-4">Bola F.I.O</th>
                        <th className="py-3 px-4">Guruh</th>
                        <th className="py-3 px-4 font-mono">Kelgan vaqti</th>
                        <th className="py-3 px-4 font-mono">Ketgan vaqti</th>
                        <th className="py-3 px-4 font-mono text-center">Tana Harorati</th>
                        <th className="py-3 px-4">Olib ketgan shaxs</th>
                        <th className="py-3 px-4 text-right">Holati</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {attendanceList
                        .filter(att => {
                          const isEmployee = att.childId.startsWith("E-") || employeesList.some(e => e.id === att.childId);
                          if (isEmployee) return false;
                          
                          const todayStr = new Date().toISOString().split("T")[0];
                          if (attendanceFilter === "daily") {
                            return att.date === todayStr;
                          } else if (attendanceFilter === "weekly") {
                            const diffTime = Math.abs(new Date().getTime() - new Date(att.date).getTime());
                            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
                          } else {
                            const diffTime = Math.abs(new Date().getTime() - new Date(att.date).getTime());
                            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 30;
                          }
                        })
                        .map((att) => {
                          const ch = childrenList.find(c => c.id === att.childId);
                          const tempVal = att.temperature || 36.5;
                          return (
                            <tr key={att.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-4 font-mono text-slate-400">{att.date}</td>
                              <td className="py-3 px-4 font-bold text-white">{ch ? ch.name : `Bola (ID: ${att.childId})`}</td>
                              <td className="py-3 px-4 text-slate-400 font-medium">{ch ? ch.groupId : "—"}</td>
                              <td className="py-3 px-4">
                                {att.checkIn ? (
                                  <span className="bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded font-bold">{att.checkIn}</span>
                                ) : (
                                  <span className="text-slate-600 font-mono">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {att.checkOut ? (
                                  <span className="bg-sky-500/10 text-sky-400 font-mono px-2 py-0.5 rounded font-bold">{att.checkOut}</span>
                                ) : (
                                  <span className="text-slate-600 font-mono">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center font-mono">
                                <span className={`font-bold ${tempVal >= 37.5 ? "text-rose-400" : "text-emerald-400"}`}>
                                  {tempVal}°C
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300 font-medium">{att.checkoutPersonName || "—"}</td>
                              <td className="py-3 px-4 text-right">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  att.checkOut ? "bg-slate-800 text-slate-400" : "bg-emerald-500/15 text-emerald-400"
                                }`}>
                                  {att.status || "Bog'chada"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                       {attendanceList.filter(att => {
                         const isEmployee = att.childId.startsWith("E-") || employeesList.some(e => e.id === att.childId);
                         if (isEmployee) return false;
                         
                         const todayStr = new Date().toISOString().split("T")[0];
                         if (attendanceFilter === "daily") {
                           return att.date === todayStr;
                         } else if (attendanceFilter === "weekly") {
                           const diffTime = Math.abs(new Date().getTime() - new Date(att.date).getTime());
                           return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
                         } else {
                           const diffTime = Math.abs(new Date().getTime() - new Date(att.date).getTime());
                           return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 30;
                         }
                       }).length === 0 && (
                         <tr>
                           <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                             Ushbu davr ({attendanceFilter === "daily" ? "Bugun" : attendanceFilter === "weekly" ? "Shu hafta" : "Shu oy"}) uchun hech qanday bolalar qatnovi yozuvlari topilmadi.
                           </td>
                         </tr>
                       )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 6. PURCHASE REQUESTS TAB (CHEF -> DIRECTOR -> ACCOUNTANT WORKFLOW) */}
        {activeTab === "requests" && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            
            <div>
              <h3 className="text-white font-bold text-sm">Oshxona va Ta'minot Xarid So'rovlari</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Oshpaz va boshqa mas'ullar tomonidan kiritilgan va direktor tasdiqlagan, to'lov kutilayotgan so'rovlar</p>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">So'rov ID</th>
                    <th className="py-3 px-4">Sana</th>
                    <th className="py-3 px-4">Yuboruvchi Mas'ul</th>
                    <th className="py-3 px-4">So'ralgan Mahsulotlar (Tavsif)</th>
                    <th className="py-3 px-4 font-mono">So'rov Summasi</th>
                    <th className="py-3 px-4">Tasdiqlagan Direktor</th>
                    <th className="py-3 px-4 text-center">Holati</th>
                    <th className="py-3 px-4 text-right">Mablag' to'lash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {localPurchaseRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{req.id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{req.date}</td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div>{req.senderName}</div>
                        <span className="text-[10px] text-slate-500">{req.senderRole}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">{req.title}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{req.amount.toLocaleString()} UZS</td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{req.approvedBy || "Direktor Karimov"}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          req.status === "To'landi" ? "bg-emerald-500/10 text-emerald-400" :
                          req.status === "Tasdiqlandi" ? "bg-sky-500/10 text-sky-400" : "bg-amber-500/10 text-amber-500"
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {req.status === "Tasdiqlandi" ? (
                          <button
                            onClick={() => handlePaySupplier(req.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-1 px-3 rounded-lg text-[10px] cursor-pointer"
                          >
                            Dilerga To'lash
                          </button>
                        ) : req.status === "To'landi" ? (
                          <span className="text-emerald-400 text-[10px] font-bold flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> To'landi
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Direktor ruxsati kutilmoqda</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 7. REPORTS & DOCUMENTS HUB */}
        {activeTab === "reports" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Generate Report Form & Filters */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-white font-bold text-sm">Moliyaviy Hisobotlarni Eksport Qilish</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Kerakli turkum bo'yicha moliyaviy jadval tahlilini yuklab olish</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase tracking-wider">Hisobot Davri:</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white outline-none">
                    <option value="today">Bugungi Kundalik Hisobot</option>
                    <option value="weekly">Haftalik Jamlama</option>
                    <option value="monthly">Iyul Oylik Reestr</option>
                    <option value="annual">Yillik Balans</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase tracking-wider">Hisobot Turi (Seksiya):</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white outline-none">
                    <option value="all">Barcha Tushum va Chiqimlar</option>
                    <option value="tuition">Faqat Bolalar Oylik To'lovi</option>
                    <option value="expenses">Faqat Operatsion Xarajatlar</option>
                    <option value="payroll">Faqat Ish Haqi / Maoshlar</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase tracking-wider">Eksport Format:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={exportPaymentsCSV}
                      className="bg-slate-950 hover:bg-slate-850 p-2 border border-slate-800 text-slate-300 rounded-xl font-bold font-mono cursor-pointer transition-all active:scale-95"
                      title="To'lovlar hisobotini EXCEL (CSV) formatida yuklash"
                    >
                      EXCEL
                    </button>
                    <button 
                      onClick={generateAccountantPDF}
                      className="bg-slate-950 hover:bg-slate-850 p-2 border border-slate-800 text-slate-300 rounded-xl font-bold font-mono cursor-pointer transition-all active:scale-95"
                      title="Hisobotni PDF formatida yuklash"
                    >
                      PDF
                    </button>
                    <button 
                      onClick={exportPaymentsCSV}
                      className="bg-slate-950 hover:bg-slate-850 p-2 border border-slate-800 text-slate-300 rounded-xl font-bold font-mono cursor-pointer transition-all active:scale-95"
                      title="To'lovlar hisobotini CSV formatida yuklash"
                    >
                      CSV
                    </button>
                  </div>
                </div>

                <button
                  onClick={generateAccountantPDF}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs cursor-pointer tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" /> Hisobotni Yuklash (PDF)
                </button>
              </div>
            </div>

            {/* Income breakdown, additional sources */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-white font-bold text-sm">Qo'shimcha Tushum va Subsidiyalar Jurnali</h3>
                  <span className="text-[10px] text-slate-400">Davlat grantlari, homiylik yordamlari va qo'shimcha to'garaklar daromadlari</span>
                </div>
                <button
                  onClick={() => setIncomeModalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tashqi Tushum Qo'shish
                </button>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                      <th className="py-3 px-4">Tushum ID</th>
                      <th className="py-3 px-4">Mablag' Manbasi (Source)</th>
                      <th className="py-3 px-4">Miqdori (UZS)</th>
                      <th className="py-3 px-4">Sana</th>
                      <th className="py-3 px-4">Tavsif va Maqsadli Ishlatilishi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {localIncomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-300">{inc.id}</td>
                        <td className="py-3 px-4 font-black text-emerald-400">{inc.source}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">+{inc.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{inc.date}</td>
                        <td className="py-3 px-4 text-slate-300 font-medium">{inc.description || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Excel-like Month-End Detailed Fund Spend Report */}
            <div className="lg:col-span-12 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Oylik Yakuniy Jamlama (Excel-like Sheet)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Direktor bilan kelishilgan holda xarajatlar va fondlar sarflanishi detallashtirilgan elektron jadvali</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-bold border border-emerald-500/15 flex items-center gap-1">
                    🟢 Direktor Kelishuvi: OK
                  </span>
                  <button
                    onClick={() => {
                      // Simulate Excel download
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + "Turi,Manba/Tavsif,Summa (UZS),Sana,Status\n"
                        + "Daromad,Tashqi tushumlar," + localIncomes.reduce((acc, i) => acc + i.amount, 0) + ",2026-07-07,Tasdiqlangan\n"
                        + "Daromad,Bolalar To'lovlari," + localPayments.reduce((acc, p) => acc + p.amount, 0) + ",2026-07-07,Tasdiqlangan\n"
                        + "Xarajat,Oylik Ish Haqlar," + localPayrolls.reduce((acc, py) => acc + py.finalAmount, 0) + ",2026-07-07,To'langan\n"
                        + "Xarajat,Operatsion sarf-xarajatlar," + localExpenses.reduce((acc, e) => acc + e.amount, 0) + ",2026-07-07,To'langan";
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "bino_moliyaviy_yakuniy_hisobot_iyul.csv");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      triggerSuccess("Excel-CSV hisobot muvaffaqiyatli yuklab olindi! 📊");
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-[10px] cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> EXCEL (CSV) Yuklash
                  </button>
                </div>
              </div>

              {/* Grid Spreadsheet view */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                <div className="grid grid-cols-12 bg-slate-950 border-b border-slate-800 p-2.5 text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  <div className="col-span-1 text-center">Yacheyka</div>
                  <div className="col-span-2">Turkum</div>
                  <div className="col-span-4">Tranzaksiya / Tavsif</div>
                  <div className="col-span-2 text-right">Summa (UZS)</div>
                  <div className="col-span-1.5 text-center ml-2">Sana</div>
                  <div className="col-span-1.5 text-right">Kelishuv</div>
                </div>

                <div className="divide-y divide-slate-850 font-mono text-[11px] text-slate-300">
                  {/* Incomes Row */}
                  <div className="grid grid-cols-12 p-2.5 items-center hover:bg-slate-900/30">
                    <div className="col-span-1 text-center text-slate-500 text-[10px]">A1</div>
                    <div className="col-span-2 text-emerald-400 font-bold">DAROMAD</div>
                    <div className="col-span-4 font-sans text-xs text-white">Super Admin maqsadli byudjetlar & grantlar</div>
                    <div className="col-span-2 text-right text-emerald-400 font-bold">+{localIncomes.reduce((acc, i) => acc + i.amount, 0).toLocaleString()}</div>
                    <div className="col-span-1.5 text-center text-slate-500 ml-2 text-[10px]">Iyul 2026</div>
                    <div className="col-span-1.5 text-right text-emerald-500 text-[9px] font-sans font-bold">Direktor ✓</div>
                  </div>

                  {/* Children Tuition Row */}
                  <div className="grid grid-cols-12 p-2.5 items-center hover:bg-slate-900/30">
                    <div className="col-span-1 text-center text-slate-500 text-[10px]">A2</div>
                    <div className="col-span-2 text-emerald-400 font-bold">DAROMAD</div>
                    <div className="col-span-4 font-sans text-xs text-white">Tarbiyalanuvchilar oylik to'lovlari (Tuition)</div>
                    <div className="col-span-2 text-right text-emerald-400 font-bold">+{localPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</div>
                    <div className="col-span-1.5 text-center text-slate-500 ml-2 text-[10px]">Iyul 2026</div>
                    <div className="col-span-1.5 text-right text-emerald-500 text-[9px] font-sans font-bold">Direktor ✓</div>
                  </div>

                  {/* Payrolls Expense Row */}
                  <div className="grid grid-cols-12 p-2.5 items-center hover:bg-slate-900/30">
                    <div className="col-span-1 text-center text-slate-500 text-[10px]">B1</div>
                    <div className="col-span-2 text-rose-400 font-bold">XARAJAT</div>
                    <div className="col-span-4 font-sans text-xs text-white">Xodimlar oylik maoshlari (Payroll)</div>
                    <div className="col-span-2 text-right text-rose-400 font-bold">-{localPayrolls.reduce((acc, py) => acc + py.finalAmount, 0).toLocaleString()}</div>
                    <div className="col-span-1.5 text-center text-slate-500 ml-2 text-[10px]">Iyul 2026</div>
                    <div className="col-span-1.5 text-right text-emerald-500 text-[9px] font-sans font-bold">Direktor ✓</div>
                  </div>

                  {/* Operations Expense Row */}
                  <div className="grid grid-cols-12 p-2.5 items-center hover:bg-slate-900/30">
                    <div className="col-span-1 text-center text-slate-500 text-[10px]">B2</div>
                    <div className="col-span-2 text-rose-400 font-bold">XARAJAT</div>
                    <div className="col-span-4 font-sans text-xs text-white">Operatsion va xo'jalik xarajatlari</div>
                    <div className="col-span-2 text-right text-rose-400 font-bold">-{localExpenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString()}</div>
                    <div className="col-span-1.5 text-center text-slate-500 ml-2 text-[10px]">Iyul 2026</div>
                    <div className="col-span-1.5 text-right text-emerald-500 text-[9px] font-sans font-bold">Direktor ✓</div>
                  </div>

                  {/* Excel Formulas (calculated live) Summary */}
                  <div className="grid grid-cols-12 p-2.5 bg-slate-950 items-center font-bold">
                    <div className="col-span-1 text-center text-slate-500 text-[10px]">=SUM</div>
                    <div className="col-span-2 text-white">BALANS</div>
                    <div className="col-span-4 font-sans text-xs text-slate-400">Jami moliyaviy aylanma va qoldiq fond</div>
                    <div className="col-span-2 text-right text-emerald-400 text-xs">
                      {((localIncomes.reduce((acc, i) => acc + i.amount, 0) + localPayments.reduce((acc, p) => acc + p.amount, 0)) -
                        (localPayrolls.reduce((acc, py) => acc + py.finalAmount, 0) + localExpenses.reduce((acc, e) => acc + e.amount, 0))).toLocaleString()} UZS
                    </div>
                    <div className="col-span-1.5 text-center text-slate-400 ml-2 text-[10px]">SUM(A1:A2)-SUM(B1:B2)</div>
                    <div className="col-span-1.5 text-right text-emerald-500 text-[9px] font-sans font-bold">Tasdiqlandi ✓</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 8. SYSTEM SETTINGS & PROFILE */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* General Financial Configurations */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-white font-bold text-sm">Buxgalteriya va Soliq Sozlamalari</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Tizim bo'yicha global moliyaviy koeffitsiyentlarni boshqarish</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase">Asosiy Valyuta:</label>
                  <select 
                    value={currencySymbol} 
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white outline-none"
                  >
                    <option value="UZS">O'zbekiston So'mi (UZS)</option>
                    <option value="USD">AQSH Dollari (USD)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase">Oylik Davlat Soliq Stavkesi (%):</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Standart jismoniy shaxslar daromad solig'i stavkasi.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold uppercase">Standart Oylik Bog'cha To'lovi (Tuition Fee):</label>
                  <input
                    type="number"
                    value={currentTuitionFee}
                    onChange={(e) => {
                      setCurrentTuitionFee(Number(e.target.value));
                      setPayAmount(Number(e.target.value));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white font-mono"
                  />
                </div>

                <button
                  onClick={() => {
                    triggerSuccess("Moliyaviy koeffitsiyentlar yangilandi!");
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl cursor-pointer"
                >
                  Sozlamalarni Saqlash
                </button>
              </div>
            </div>

            {/* Profile, Security & Activity Logs */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-white font-bold text-sm">Profilingiz va Xavfsizlik</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Xavfsiz login kirish sessiyalari va 2-bosqichli parollash</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Ikki Bosqichli Kirish (2FA)</span>
                    <span className="text-[10px] text-slate-500 block">Buxgalteriya saqlash xavfsizligini Telegram kodi orqali ta'minlash</span>
                  </div>
                  <button 
                    onClick={() => setEnable2FA(!enable2FA)}
                    className="cursor-pointer"
                  >
                    {enable2FA ? (
                      <ToggleRight className="w-9 h-9 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Oxirgi Kirish Sessiyalari (Audit):</label>
                  <div className="space-y-2 font-mono text-[10px] text-slate-400">
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between">
                      <span>💻 Chrome (Windows) - Toshkent</span>
                      <span className="text-emerald-400 font-bold">Faol (Active)</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between">
                      <span>📱 Safari (iPhone) - Toshkent</span>
                      <span className="text-slate-500">2026-07-03 18:22</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl text-[10px] text-slate-400 leading-relaxed">
                  🔐 Sizning buxgalter profilingiz Rolga Asoslangan Ruxsatnomalar (RBAC) bo'yicha cheklangan. Siz direktorlar yoki yangi xodimlar yarata olmaysiz.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 9. SMS GATEWAY TAB */}
        {activeTab === "sms" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Left side: Send form & Quick selects */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Send SMS Panel */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Yangi SMS Xabar Yuborish</h3>
                    <p className="text-[10px] text-slate-400">Eskiz API gateway orqali tezkor SMS uzatish</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Recipient Input */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold uppercase block">Telefon Raqami (Xalqaro format):</label>
                    <input
                      type="text"
                      placeholder="+998901234567"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white placeholder-slate-600 outline-none focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>

                  {/* Quick Select from Debtors */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold uppercase block">Qarzdorlardan tezkor tanlash:</label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const [phone, name, child, debt] = val.split("|");
                        setSmsPhone(phone);
                        
                        // Set template populated with parent name & kid name & debt amount
                        const message = `Hurmatli ${name}, farzandingiz ${child} ning Iyul oyi bog'cha to'lovidan ${Number(debt).toLocaleString()} UZS qarzdorligi bor. Iltimos, imkon qadar tezroq to'lovni amalga oshiring. - Nihol ERP`;
                        setSmsMessage(message);
                        setSmsTemplate("reminder");
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-300 outline-none focus:border-emerald-500 transition-all text-xs"
                      defaultValue=""
                    >
                      <option value="">-- Qarzdor ota-onani tanlang --</option>
                      {filteredDebtors.map((debtor, idx) => (
                        <option key={idx} value={`${debtor.phone}|${debtor.parentName}|${debtor.childName}|${debtor.debtAmount}`}>
                          {debtor.childName} ({debtor.parentName}) - {debtor.debtAmount.toLocaleString()} UZS
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Templates select */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold uppercase block">Xabar Shabloni:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSmsTemplate("reminder");
                          setSmsMessage("Hurmatli ota-ona, farzandingiz uchun bog'cha to'lovi muddati keldi. Iltimos, ERP tizimi yoki Click/Payme orqali to'lovni amalga oshiring. Rahmat!");
                        }}
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold text-center transition-all ${
                          smsTemplate === "reminder"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                            : "bg-slate-950 text-slate-400 border-slate-850 hover:text-white"
                        }`}
                      >
                        To'lov Eslatmasi
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSmsTemplate("holiday");
                          setSmsMessage("Assalomu alaykum hurmatli ota-onalar! Sizlarni va jajji bolajonlarimizni bugungi bayram bilan chin qalbdan muborakbod etamiz! Nihol jamoasi.");
                        }}
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold text-center transition-all ${
                          smsTemplate === "holiday"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                            : "bg-slate-950 text-slate-400 border-slate-850 hover:text-white"
                        }`}
                      >
                        Bayram Tabrigi
                      </button>
                    </div>
                  </div>

                  {/* Message textarea */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold uppercase block">Xabar Matni:</label>
                    <textarea
                      rows={5}
                      maxLength={160}
                      placeholder="Xabar matnini kiriting..."
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white placeholder-slate-600 outline-none focus:border-emerald-500 transition-all leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Simvollar: {smsMessage.length}/160 (1 segment)</span>
                      <span>Translit faol emas</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!smsPhone.trim() || !smsMessage.trim()) {
                        triggerError("Iltimos, telefon raqami va xabar matnini to'liq kiriting!");
                        return;
                      }
                      setSendingSms(true);
                      try {
                        const res = await fetch("/api/sms/send", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            phone: smsPhone.trim(),
                            message: smsMessage.trim()
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          triggerSuccess("SMS xabari Eskiz shlyuzi orqali yuborildi!");
                          setSmsPhone("");
                          setSmsMessage("");
                          setSmsTemplate("custom");
                          fetchSmsLogs();
                        } else {
                          triggerError(data.message || "SMS jo'natishda xatolik.");
                        }
                      } catch (err) {
                        triggerError("Server aloqa xatosi.");
                      } finally {
                        setSendingSms(false);
                      }
                    }}
                    disabled={sendingSms}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all text-xs"
                  >
                    {sendingSms ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> SMSni Uzatish
                      </>
                    )}
                  </button>

                </div>
              </div>

              {/* Status information */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3.5">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider">Gateway Status</h4>
                <div className="grid grid-cols-2 gap-3.5 text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-slate-500 text-[10px] block font-sans">API Balans</span>
                    <span className="text-emerald-400 font-bold text-sm block mt-0.5">984,500 UZS</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-slate-500 text-[10px] block font-sans">SMS Tarifi</span>
                    <span className="text-sky-400 font-bold text-sm block mt-0.5">45 UZS / SMS</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Eskiz Gateway holati</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-ping"></span> ONLINE
                  </span>
                </div>
              </div>

            </div>

            {/* Right side: Logs */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-white font-bold text-sm">Yuborilgan SMSlar Tarixi</h3>
                  <p className="text-[10px] text-slate-400">Gateway orqali o'tgan oxirgi SMS xabarlar</p>
                </div>
                <button
                  type="button"
                  onClick={fetchSmsLogs}
                  disabled={loadingSmsLogs}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg transition-all"
                  title="Yangilash"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSmsLogs ? "animate-spin text-emerald-400" : ""}`} />
                </button>
              </div>

              {loadingSmsLogs ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-500">SMS jurnallari yuklanmoqda...</span>
                </div>
              ) : smsLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs">
                  Hali SMS jo'natilmagan.
                </div>
              ) : (
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {smsLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300 font-mono">{log.phone}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${
                          log.status === "Yuborildi" || log.status === "sent"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed whitespace-pre-line">{log.message}</p>
                      
                      <div className="flex items-center justify-between pt-1 border-t border-slate-850/50 text-[10px] text-slate-500">
                        <span>Segment: 1 segments</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSmsPhone(log.phone);
                            setSmsMessage(log.message);
                            setSmsTemplate("custom");
                            triggerSuccess("Xabar matni va raqami yuborish maydoniga nusxalandi!");
                          }}
                          className="text-sky-400 hover:underline font-bold cursor-pointer"
                        >
                          Qayta yuborish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ==================================== MODALS ==================================== */}

      {/* 1. TO'LOV QABUL QILISH MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h4 className="font-black text-white text-sm">Oylik Tuition To'lovi Qabul Qilish</h4>
              </div>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold flex items-center gap-1.5">Bolani tanlang:</label>
                <select
                  value={payChildId}
                  onChange={(e) => setPayChildId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white"
                >
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold flex items-center gap-1.5">To'lov summasi (UZS):</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white font-bold font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold">Hisob Oyi:</label>
                  <select
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white"
                  >
                    {months.map(m => (
                      <option key={m} value={m}>{m} oyi</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold">To'lov usuli:</label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white"
                  >
                    <option value="Click">Click</option>
                    <option value="Payme">Payme</option>
                    <option value="Naqd">Naqd Pul</option>
                    <option value="Humo">Humo (Terminal)</option>
                    <option value="Uzum Bank">Uzum Bank</option>
                    <option value="Visa">Visa Card</option>
                    <option value="Mastercard">MasterCard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">To'lov holati:</label>
                <select
                  value={payStatus}
                  onChange={(e) => setPayStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white"
                >
                  <option value="To'landi">To'liq to'landi (Paid)</option>
                  <option value="Qisman">Qisman to'lov (Partially Paid)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
              >
                To'lovni saqlash & Chop etish 🖨️
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. YANGI XARAJAT MODAL (WITH FILE ATTACHMENT DRAG & DROP) */}
      {expenseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-rose-400" />
                <h4 className="font-black text-white text-sm">Yangi Xarajat Qayd Etish</h4>
              </div>
              <button 
                onClick={() => setExpenseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold">Turkum (Category):</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white"
                  >
                    {expenseCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold">Summa (UZS):</label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">Tavsif (Xarajat tafsilotlari):</label>
                <input
                  type="text"
                  required
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Masalan: Go'sht va guruch xaridi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold">To'lov turi:</label>
                  <select
                    value={expensePaymentType}
                    onChange={(e) => setExpensePaymentType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white"
                  >
                    <option value="Naqd">Naqd Pul</option>
                    <option value="Bank O'tkazmasi">Bank O'tkazmasi</option>
                    <option value="Click">Click Business</option>
                    <option value="Payme">Payme Business</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold">Xarajat mas'uli:</label>
                  <input
                    type="text"
                    required
                    value={expenseResponsible}
                    onChange={(e) => setExpenseResponsible(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white font-bold"
                  />
                </div>
              </div>

              {/* Receipt File Upload with Drag & Drop */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">Kvitansiya / Chek rasmi (Attachment):</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    dragActive ? "border-emerald-500 bg-emerald-500/5" : "border-slate-800 bg-slate-950 hover:border-slate-600"
                  }`}
                >
                  {expenseAttachment ? (
                    <div className="space-y-2">
                      <img 
                        src={expenseAttachment} 
                        alt="Kvitansiya nusxasi" 
                        className="w-20 h-20 object-cover rounded-xl border border-emerald-500 mx-auto" 
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setExpenseAttachment(null)}
                        className="text-[9px] text-rose-400 hover:underline cursor-pointer font-bold block mx-auto"
                      >
                        Rasmni o'chirish ❌
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-500" />
                      <p className="text-[10px] text-slate-400">
                        Chek rasm yoki PDF-ni shu yerga sudrang yoki <span className="text-emerald-400 underline font-bold">faylni tanlang</span>
                      </p>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden" 
                        id="receipt-file-input" 
                      />
                      <label htmlFor="receipt-file-input" className="absolute inset-0 cursor-pointer w-full h-full opacity-0 z-10"></label>
                    </>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
              >
                Xarajatni Hisobga O'tkazish
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. PRINTABLE RECEIPT TEMPLATE MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 border border-slate-200"
          >
            {/* Receipt Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h4 className="font-black text-lg text-slate-850 tracking-tight">NIHОL АI BОG'CHАSI</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Kvitansiya / Payment Invoice</p>
              <p className="text-[8px] text-slate-400 mt-1 font-mono">Toshkent sh., Chilonzor tumani, 5-mavze</p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-3 text-xs font-mono text-slate-700">
              <div className="flex justify-between">
                <span>Kvitansiya ID:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Tarbiyalanuvchi:</span>
                <span className="font-bold text-slate-900">
                  {childrenList.find((c) => c.id === selectedReceipt.childId)?.name || "Noma'lum"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Guruh nomi:</span>
                <span className="font-bold text-slate-900">O'rta guruh (Kamalak)</span>
              </div>
              <div className="flex justify-between">
                <span>Hisob oyi:</span>
                <span className="font-bold text-emerald-600 uppercase">{selectedReceipt.month} oyi uchun</span>
              </div>
              <div className="flex justify-between">
                <span>To'lov usuli:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span>Qayd etilgan sana:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.date}</span>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-300 text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Jami To'langan Summa:</span>
                <div className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  {selectedReceipt.amount?.toLocaleString()} UZS
                </div>
              </div>
            </div>

            {/* Simulated QR Code */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-20 h-20 bg-white border border-slate-200 p-1 rounded flex flex-col gap-0.5 items-center justify-center">
                <QrCode className="w-14 h-14 text-slate-900" />
                <span className="text-[8px] font-bold text-emerald-600">ONLINE CHECK</span>
              </div>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold mt-2 text-center">
                Davlat soliq ruxsatnomasi / QR kodi
              </span>
            </div>

            {/* Receipt Modal Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs text-center cursor-pointer active:scale-95 transition-transform"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs text-center cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                Chop Etish 🖨️
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. OYLIK HISOB-KITOB MODAL */}
      {payrollModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-black text-white text-sm">Xodim Oylik Maosh To'lovi</h4>
              </div>
              <button 
                onClick={() => setPayrollModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessPayroll} className="space-y-3.5 text-xs">
              
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">Xodimni tanlang:</label>
                <select
                  value={payrEmployeeId}
                  onChange={(e) => {
                    setPayrEmployeeId(e.target.value);
                    // Mock salary change based on selection
                    if (e.target.value === "E-3") setPayrBaseSalary(3000000);
                    else if (e.target.value === "E-4") setPayrBaseSalary(2500000);
                    else setPayrBaseSalary(2200000);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white"
                >
                  <option value="E-3">Nodira Rahimova (Tarbiyachi) - 3,000,000 UZS</option>
                  <option value="E-4">Rustam Abdullayev (Oshpaz) - 2,500,000 UZS</option>
                  <option value="E-5">Nilufar Soliqova (Hamshira) - 2,200,000 UZS</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold">Asosiy oylik (UZS):</label>
                  <input
                    type="number"
                    required
                    value={payrBaseSalary}
                    onChange={(e) => setPayrBaseSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold">Mukofot (Bonus):</label>
                  <input
                    type="number"
                    value={payrBonus}
                    onChange={(e) => setPayrBonus(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold">Jarima (Deduction):</label>
                  <input
                    type="number"
                    value={payrFine}
                    onChange={(e) => setPayrFine(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-bold">Daromad Solig'i ({taxRate}%):</label>
                  <input
                    type="number"
                    disabled
                    value={Math.round(payrBaseSalary * (taxRate / 100))}
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3.5 text-slate-400 font-mono"
                  />
                </div>
              </div>

              {/* Real-time final summary calculation display */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Yakuniy hisoblangan maosh:</span>
                <span className="font-black text-emerald-400 font-mono text-sm">
                  {(payrBaseSalary + payrBonus - payrFine - Math.round(payrBaseSalary * (taxRate / 100))).toLocaleString()} UZS
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
              >
                Oylik Maoshni To'lash
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. TASHQI TUSHUM QO'SHISH MODAL */}
      {incomeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h4 className="font-black text-white text-sm">Tashqi Tushum Qo'shish</h4>
              </div>
              <button 
                onClick={() => setIncomeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">Mablag' Manbasi (Source):</label>
                <select
                  value={incSource}
                  onChange={(e) => setIncSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white"
                >
                  <option value="Homiylik va Xayriya">Homiylik va Xayriya</option>
                  <option value="Davlat subsidiyasi">Davlat subsidiyasi</option>
                  <option value="Tashqi To'garaklar">Tashqi Kurslar va To'garaklar</option>
                  <option value="Boshqa daromadlar">Boshqa daromadlar</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">Tushum Summasi (UZS):</label>
                <input
                  type="number"
                  required
                  value={incAmount}
                  onChange={(e) => setIncAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">Tavsif va Maqsadli Ishlatilishi:</label>
                <textarea
                  value={incDescription}
                  onChange={(e) => setIncDescription(e.target.value)}
                  placeholder="Masalan: Maktabgacha ta'lim vazirligi subsidiya yordami..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white h-20 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
              >
                Tushumni Kiritish
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. SMART EXPORT (MOLIYAVIY RECONCILIATION) MODAL */}
      {smartExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-white"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h4 className="font-black text-white text-sm">Smart Export: Solishtiruv va Moliya</h4>
              </div>
              <button 
                onClick={() => setSmartExportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Ushbu modul davomat ma'lumotlarini buxgalteriya hisobi, ish haqi (payroll) va oziq-ovqat ta'minotini solishtirish uchun maxsus qayta ishlaydi.
              </p>

              {/* Type Switcher */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">Turkum:</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSmartExportType("staff")}
                    className={`py-2 rounded-lg font-black text-center cursor-pointer transition-all ${
                      smartExportType === "staff"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Xodimlar
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartExportType("children")}
                    className={`py-2 rounded-lg font-black text-center cursor-pointer transition-all ${
                      smartExportType === "children"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Bolalar (Ta'minot)
                  </button>
                </div>
              </div>

              {/* Period Select */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">Hisobot Davri:</label>
                <select
                  value={smartExportPeriod}
                  onChange={(e) => setSmartExportPeriod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white"
                >
                  <option value="daily">Bugungi Kunlik</option>
                  <option value="weekly">Haftalik (7 kun)</option>
                  <option value="monthly">Oylik (30 kun)</option>
                </select>
              </div>

              {smartExportType === "staff" ? (
                <div className="space-y-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                  <h5 className="font-black text-slate-200 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                    <Calculator className="w-3 h-3 text-emerald-400" /> Buxgalteriya koeffitsiyentlari:
                  </h5>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Kutilgan Ish Soati:</label>
                      <input
                        type="number"
                        value={smartExportWorkHours}
                        onChange={(e) => setSmartExportWorkHours(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-white font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Kunlik Stavka (UZS):</label>
                      <input
                        type="number"
                        value={smartExportDailyRate}
                        onChange={(e) => setSmartExportDailyRate(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Percent className="w-3 h-3 text-red-400" /> Kechikish Jarimasi (UZS / har bir kechikish):
                    </label>
                    <input
                      type="number"
                      value={smartExportPenaltyRate}
                      onChange={(e) => setSmartExportPenaltyRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-white font-mono font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-1.5">
                  <h5 className="font-black text-slate-200 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-emerald-400" /> Ta'minot & Oziq-ovqat jurnali:
                  </h5>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    Bolalarning kelgan kunlari soniga mutanosib ravishda porsiyalar hisoblanadi. Oshxona hisobotlari va sarf-xarajatlar jurnali bilan solishtirish uchun ideal.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    generateSmartExcelReport(smartExportType, smartExportPeriod);
                    setSmartExportModalOpen(false);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel (.csv) Reconciliation hisoboti
                </button>
                <button
                  type="button"
                  onClick={() => {
                    generateSmartPDFReport(smartExportType, smartExportPeriod);
                    setSmartExportModalOpen(false);
                  }}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <Printer className="w-4 h-4" /> Muhrli PDF Solishtiruv hisoboti
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* QUICK ACTIONS SIDEBAR FLOATING TOGGLE */}
      <div className="fixed top-1/2 -translate-y-1/2 right-0 z-40">
        <button
          onClick={() => setQuickActionsOpen(!quickActionsOpen)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-3 rounded-l-2xl shadow-2xl border-l border-y border-indigo-500/30 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-100" style={{ writingMode: 'vertical-rl' }}>TEZKOR</span>
        </button>
      </div>

      {/* QUICK ACTIONS DRAWER */}
      <AnimatePresence>
        {quickActionsOpen && (
          <>
            {/* Backdrop */}
            <div 
              onClick={() => setQuickActionsOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity"
            />
            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between text-white"
            >
              <div className="space-y-6 overflow-y-auto max-h-[90%] scrollbar-none">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h4 className="font-black text-white text-sm uppercase tracking-wider">Tezkor Amallar</h4>
                  </div>
                  <button 
                    onClick={() => setQuickActionsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> {/* Fallback icon, using Check or standard cross */}
                  </button>
                </div>

                {/* Info block */}
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Buxgalteriya va moliya amallarini tezkor boshqarish tugmalari. Ushbu panel moliya hisoboti uchun optimallashtirilgan.
                </p>

                {/* Actions Grid */}
                <div className="space-y-3">
                  <button
                    onClick={() => { setExpenseModalOpen(true); setQuickActionsOpen(false); }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-rose-500/30 group"
                  >
                    <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 group-hover:bg-rose-500/20">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs">Yangi Xarajat Qayd Etish</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Xaridlar va oziq-ovqat xarajatlari</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setPaymentModalOpen(true); setQuickActionsOpen(false); }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-emerald-500/30 group"
                  >
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500/20">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs">To'lov Qabul Qilish</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Ota-onalardan badal qabul qilish</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setIncomeModalOpen(true); setQuickActionsOpen(false); }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-indigo-500/30 group"
                  >
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-500/20">
                      <PlusCircle className="w-4 h-4" /> {/* Using PlusCircle */}
                    </div>
                    <div>
                      <p className="font-black text-white text-xs">Yangi Tushum Kiritish</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Subsidiya va homiylik daromadlari</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setPayrollModalOpen(true); setQuickActionsOpen(false); }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-amber-500/30 group"
                  >
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-500/20">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs">Xodimlar Ish Haqini Hisoblash</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Oylik maoshlar va bonuslar</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { 
                      setSmartExportType(attendanceSubTab);
                      setSmartExportPeriod(attendanceFilter);
                      setSmartExportModalOpen(true); 
                      setQuickActionsOpen(false); 
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-purple-500/30 group"
                  >
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs">Smart Export (Moliya)</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Solishtiruv va davomat jadvallari</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer info inside sidebar */}
              <div className="pt-4 border-t border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                  Tezkor Panel • Bosh Hisobchi
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
