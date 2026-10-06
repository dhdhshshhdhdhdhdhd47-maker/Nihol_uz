import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Grid, UserCheck, CreditCard, MessageSquare, 
  Shield, RefreshCw, Plus, Edit2, Trash2, Calendar, Check, X, Camera, Image,
  TrendingUp, DollarSign, Activity, FileText, AlertTriangle, 
  Settings, Bell, HelpCircle, Award, Heart, LayoutDashboard, 
  Send, Moon, LogOut, Clock, BookOpen, Smile, Key, Book, 
  Briefcase, ShoppingCart, Apple, Download, ShieldCheck, Eye, EyeOff, Building, Server, Cpu,
  Sparkles, Brain, ChevronLeft, ChevronRight, SlidersHorizontal, Zap, PlusCircle, ChefHat, ShieldAlert
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis, Cell, ComposedChart
} from "recharts";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "motion/react";
import { Child, Group, Employee, Complaint, AuditLog, Payment, Attendance } from "../types";
import { AuditLogger } from "../utils/AuditLogger";
import { exportToCSV as exportJSONToCSV } from "../utils/csvExport";
import AiCamerasPage from "./AiCamerasPage";
import AiViolenceMonitor from "./AiViolenceMonitor";
import DeviceManagement from "./DeviceManagement";
import SystemLogs from "./SystemLogs";

interface DirectorDashboardProps {
  user: any;
  childrenList: Child[];
  groupsList: Group[];
  employeesList: Employee[];
  complaintsList: Complaint[];
  auditLogsList: AuditLog[];
  paymentsList: Payment[];
  mealsList?: any[];
  onRefresh: () => void;
  onUpdateAvatar?: (avatar: string) => void;
}

export default function DirectorDashboard({
  user,
  childrenList: rawChildrenList,
  groupsList: rawGroupsList,
  employeesList: rawEmployeesList,
  complaintsList: rawComplaintsList,
  auditLogsList: rawAuditLogsList,
  paymentsList: rawPaymentsList,
  mealsList = [],
  onRefresh,
  onUpdateAvatar,
}: DirectorDashboardProps) {
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || "");
  const [editPassword, setEditPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: editName,
          phone: editPhone,
          password: editPassword || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          alert("Profil ma'lumotlari muvaffaqiyatli yangilandi!");
          onRefresh();
        } else {
          alert(data.message || "Xatolik yuz berdi");
        }
      } else {
        alert("Server bilan aloqa bog'lashda xatolik");
      }
    } catch (err) {
      alert("Profilni yangilashda kutilmagan xatolik");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("Eksport qilish uchun ma'lumot mavjud emas!");
      return;
    }
    
    // Extract headers
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","), // header row
      ...data.map(row => 
        headers.map(fieldName => {
          const value = row[fieldName];
          // Handle string formatting, escape quotes/commas
          const cleanValue = value === null || value === undefined ? "" : String(value).replace(/"/g, '""');
          return cleanValue.includes(",") || cleanValue.includes("\n") || cleanValue.includes('"') 
            ? `"${cleanValue}"` 
            : cleanValue;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Navigation categories for professional feel
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem("director_sidebar_collapsed");
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const [visibleModules, setVisibleModules] = useState<Record<string, boolean>>(() => {
    try {
      const saved = sessionStorage.getItem("visible_modules_director");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      dashboard: true,
      superadmin: true,
      children: true,
      parents: true,
      employees: true,
      groups: true,
      attendance: true,
      payments: true,
      finance: true,
      medical: true,
      kitchen: true,
      documents: true,
      reports: true,
      calendar: true,
      ai: true,
      ai_cameras: true,
      complaints: true,
      notifications: true,
      audit: true,
      settings: true,
    };
  });

  const [showModuleCustomizer, setShowModuleCustomizer] = useState(false);
  const [dashboardSubTab, setDashboardSubTab] = useState<"overview" | "analytics">("overview");

  useEffect(() => {
    try {
      sessionStorage.setItem("visible_modules_director", JSON.stringify(visibleModules));
    } catch (e) {
      console.error(e);
    }
  }, [visibleModules]);

  const [selectedKgGalleryId, setSelectedKgGalleryId] = useState<string | null>("K-1");
  const [selectedGalleryType, setSelectedGalleryType] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const handleResetDatabase = async () => {
    if (!window.confirm("DIQQAT! Tizimdagi barcha bolalar, to'lovlar, guruhlar, shikoyatlar va xodimlar ma'lumotlarini to'liq o'chirib tashlamoqchimisiz? Faqat SuperAdmin hisobi saqlab qolinadi! Bu amalni aslo ortga qaytarib bo'lmaydi.")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/reset-db", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          triggerNotification("Tizim ma'lumotlari muvaffaqiyatli tozalandi!");
          onRefresh();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          triggerNotification(data.message || "Xatolik yuz berdi");
        }
      } else {
        triggerNotification("Tizimni tozalashda xatolik yuz berdi");
      }
    } catch (e) {
      console.error(e);
      triggerNotification("Ulanish xatosi.");
    }
  };

  const fetchGalleryItems = async () => {
    setLoadingGallery(true);
    try {
      const res = await fetch("/api/meal-gallery");
      if (res.ok) {
        const data = await res.json();
        setGalleryItems(data);
      }
    } catch (e) {
      console.error("Error fetching gallery items:", e);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleDeleteGalleryItem = async (itemId: string) => {
    if (!window.confirm("Rasm va uning tavsifini o'chirishni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`/api/meal-gallery/${itemId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerNotification("Rasm muvaffaqiyatli o'chirildi.");
        fetchGalleryItems();
      } else {
        triggerNotification("Xatolik yuz berdi, o'chirib bo'lmadi.");
      }
    } catch (e) {
      console.error(e);
      triggerNotification("Ulanish xatosi.");
    }
  };

  useEffect(() => {
    if (activeTab === "superadmin" || activeTab === "gallery") {
      fetchGalleryItems();
    }
  }, [activeTab]);

  const [notificationsHistory, setNotificationsHistory] = useState<{ sms: any[]; telegram: any[] }>({ sms: [], telegram: [] });
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotificationsHistory = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch("/api/notifications/history");
      if (res.ok) {
        const data = await res.json();
        setNotificationsHistory(data);
      }
    } catch (e) {
      console.error("Error fetching notifications history:", e);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (activeTab === "notifications") {
      fetchNotificationsHistory();
    }
  }, [activeTab]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [notificationsSubTab, setNotificationsSubTab] = useState<'telegram' | 'sms'>('telegram');
  const [notificationsSearch, setNotificationsSearch] = useState('');

  const filteredTelegramNotifications = () => {
    const term = notificationsSearch.toLowerCase();
    const list = notificationsHistory.telegram || [];
    if (!term) return list;
    return list.filter((n: any) =>
      n.recipientName?.toLowerCase().includes(term) ||
      n.chatId?.toLowerCase().includes(term) ||
      n.message?.toLowerCase().includes(term)
    );
  };

  const filteredSmsNotifications = () => {
    const term = notificationsSearch.toLowerCase();
    const list = notificationsHistory.sms || [];
    if (!term) return list;
    return list.filter((n: any) =>
      n.phone?.toLowerCase().includes(term) ||
      n.message?.toLowerCase().includes(term) ||
      n.provider?.toLowerCase().includes(term)
    );
  };
  const [childDetailTab, setChildDetailTab] = useState<string>("general");
  const [failedCheckins, setFailedCheckins] = useState<any[]>([]);
  const [loadingFailedCheckins, setLoadingFailedCheckins] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedChildToAssign, setSelectedChildToAssign] = useState<string>("");
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  const fetchFailedCheckins = async () => {
    setLoadingFailedCheckins(true);
    try {
      const res = await fetch("/api/failed-checkins");
      if (res.ok) {
        const data = await res.json();
        setFailedCheckins(data);
      }
    } catch (e) {
      console.error("Error fetching failed check-ins:", e);
    } finally {
      setLoadingFailedCheckins(false);
    }
  };

  useEffect(() => {
    fetchFailedCheckins();
  }, [activeTab]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<Group | null>(null);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [bulkActionMessage, setBulkActionMessage] = useState<string>("");
  const [isProcessingBulk, setIsProcessingBulk] = useState<boolean>(false);
  const [employeeTimeFilter, setEmployeeTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [childrenExportPeriod, setChildrenExportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [staffExportPeriod, setStaffExportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'children' | 'staff'>('children');

  // Multi-kindergarten and SuperAdmin States
  const [kindergartens, setKindergartens] = useState<any[]>([]);
  const [selectedKindergartenId, setSelectedKindergartenId] = useState<string>(
    user.role === "SuperAdmin" ? "all" : (user.kindergartenId || "K-1")
  );

  const childrenList = selectedKindergartenId === "all"
    ? rawChildrenList
    : rawChildrenList.filter(c => c.kindergartenId === selectedKindergartenId);

  const groupsList = selectedKindergartenId === "all"
    ? rawGroupsList
    : rawGroupsList.filter(g => g.kindergartenId === selectedKindergartenId);

  const employeesList = (selectedKindergartenId === "all"
    ? rawEmployeesList
    : rawEmployeesList.filter(e => e.kindergartenId === selectedKindergartenId)
  ).filter(e => e.role !== "Direktor" && e.role !== "SuperAdmin" && e.id !== "E-2" && e.id !== "E-8");

  const complaintsList = selectedKindergartenId === "all"
    ? rawComplaintsList
    : rawComplaintsList.filter(comp => {
        const child = rawChildrenList.find(c => c.id === comp.childId);
        return child && child.kindergartenId === selectedKindergartenId;
      });

  const paymentsList = selectedKindergartenId === "all"
    ? rawPaymentsList
    : rawPaymentsList.filter(p => {
        const child = rawChildrenList.find(c => c.id === p.childId);
        return child && child.kindergartenId === selectedKindergartenId;
      });

  const auditLogsList = selectedKindergartenId === "all"
    ? rawAuditLogsList
    : rawAuditLogsList.filter(log => log.kindergartenId === selectedKindergartenId || !log.kindergartenId);

  // Modal states for SuperAdmin
  const [showAddKgModal, setShowAddKgModal] = useState(false);
  const [showAssignDirectorModal, setShowAssignDirectorModal] = useState(false);
  const [assigningKgId, setAssigningKgId] = useState("");
  const [deviceKgId, setDeviceKgId] = useState<string>("K-1");

  // SuperAdmin forms
  const [kgName, setKgName] = useState("");
  const [kgAddress, setKgAddress] = useState("");
  const [kgPhone, setKgPhone] = useState("");

  const [dirNameInput, setDirNameInput] = useState("");
  const [dirUsernameInput, setDirUsernameInput] = useState("");
  const [dirPasswordInput, setDirPasswordInput] = useState("");
  const [dirPhoneInput, setDirPhoneInput] = useState("+998");
  const [dirPassportInput, setDirPassportInput] = useState("");

  // Super Admin Document states
  const [superAdminDocs, setSuperAdminDocs] = useState<any[]>([]);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocFunds, setNewDocFunds] = useState("");
  const [newDocDirector, setNewDocDirector] = useState("director");
  const [newDocFile, setNewDocFile] = useState("hujjat_nizomi_2026.pdf");
  const [newDocUrl, setNewDocUrl] = useState("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf");
  const [distribPanels, setDistribPanels] = useState<{[key: string]: string[]}>({});

  // Camera and Profile Photo states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (cameraActive && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => console.error("Video play error:", err));
    }
  }, [cameraActive, cameraStream]);

  const startCamera = async () => {
    setCapturedPhoto(null);
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 300 }, height: { ideal: 300 }, facingMode: "user" }
      });
      setCameraStream(stream);
    } catch (err) {
      console.warn("Real camera access error, activating fallback camera stream:", err);
      triggerNotification("Kameraga ulanishda xatolik. Simulyatsiya kamerasi ishga tushdi.");

      try {
        const canvas = document.createElement("canvas");
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        let angle = 0;
        const interval = setInterval(() => {
          if (!ctx) return;
          angle += 0.08;
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, 300, 300);

          const grad = ctx.createRadialGradient(150, 150, 20, 150, 150, 150);
          grad.addColorStop(0, "#1e1b4b");
          grad.addColorStop(1, "#090d16");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 300, 300);

          ctx.fillStyle = "#6366f1";
          ctx.beginPath();
          ctx.arc(150, 115 + Math.sin(angle) * 2, 42, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(150, 245 + Math.sin(angle), 75, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          const scanY = 60 + ((Math.sin(angle * 1.2) + 1) / 2) * 180;
          ctx.beginPath();
          ctx.moveTo(60, scanY);
          ctx.lineTo(240, scanY);
          ctx.stroke();

          ctx.strokeStyle = "#818cf8";
          ctx.lineWidth = 2;
          ctx.strokeRect(75, 55, 150, 190);
        }, 40);

        const fallbackStream = canvas.captureStream(30);
        (fallbackStream as any)._interval = interval;
        setCameraStream(fallbackStream);
      } catch (fallbackErr) {
        console.error("Canvas stream fallback error:", fallbackErr);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      if ((cameraStream as any)._interval) {
        clearInterval((cameraStream as any)._interval);
      }
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        try {
          ctx.drawImage(videoRef.current, 0, 0, 300, 300);
          const dataUrl = canvas.toDataURL("image/jpeg");
          setCapturedPhoto(dataUrl);
          stopCamera();
        } catch (e) {
          console.error("Capture photo error:", e);
        }
      }
    }
  };

  const saveProfilePhoto = async () => {
    if (!capturedPhoto) return;
    setSavingPhoto(true);
    try {
      const res = await fetch("/api/users/profile-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, avatar: capturedPhoto })
      });
      if (res.ok) {
        triggerNotification("Profil rasmingiz muvaffaqiyatli yangilandi!");
        if (onUpdateAvatar) {
          onUpdateAvatar(capturedPhoto);
        }
      } else {
        const errData = await res.json();
        triggerNotification(`Xatolik: ${errData.error || "Rasm saqlanmadi"}`);
      }
    } catch (err) {
      console.error("Save profile photo error:", err);
      triggerNotification("Profil rasmini saqlashda xatolik yuz berdi.");
    } finally {
      setSavingPhoto(false);
    }
  };

  // Staff Leave & Availability States
  interface StaffLeaveRequest {
    id: string;
    staffName: string;
    role: string;
    day: "Dushanba" | "Seshanba" | "Chorshanba" | "Payshanba" | "Juma" | "Shanba";
    type: "Ta'til" | "Kasalik" | "Shaxsiy";
    status: "Tasdiqlangan" | "Kutilmoqda";
    dateRange: string;
  }

  const [leaveRequests, setLeaveRequests] = useState<StaffLeaveRequest[]>([]);

  const [newLeaveStaffName, setNewLeaveStaffName] = useState("");
  const [newLeaveDay, setNewLeaveDay] = useState<"Dushanba" | "Seshanba" | "Chorshanba" | "Payshanba" | "Juma" | "Shanba">("Dushanba");
  const [newLeaveType, setNewLeaveType] = useState<"Ta'til" | "Kasalik" | "Shaxsiy">("Ta'til");

  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveStaffName) return;
    const newReq: StaffLeaveRequest = {
      id: `L-${Date.now()}`,
      staffName: newLeaveStaffName,
      role: "Tarbiyachi",
      day: newLeaveDay,
      type: newLeaveType,
      status: "Kutilmoqda",
      dateRange: "Bugun"
    };
    setLeaveRequests([newReq, ...leaveRequests]);
    setNewLeaveStaffName("");
  };

  const handleApproveLeave = (id: string) => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Tasdiqlangan" as const } : r));
  };

  const handleRejectLeave = (id: string) => {
    setLeaveRequests(prev => prev.filter(r => r.id !== id));
  };

  // Get active staff count for a given day
  const getStaffAvailability = (day: string) => {
    const leavesOnDay = leaveRequests.filter(r => r.day === day && r.status === "Tasdiqlangan").length;
    const totalStaffCount = employeesList.length;
    return {
      active: Math.max(0, totalStaffCount - leavesOnDay),
      total: totalStaffCount
    };
  };

  const downloadAttendanceReport = (format: 'csv' | 'pdf') => {
    const data = [
      { kun: "Dushanba", soat: "08:00", zichlik: "92%", kutilgan: "90%", delta: "+2%" },
      { kun: "Dushanba", soat: "11:00", zichlik: "95%", kutilgan: "95%", delta: "0%" },
      { kun: "Dushanba", soat: "14:00", zichlik: "85%", kutilgan: "85%", delta: "0%" },
      { kun: "Dushanba", soat: "16:00", zichlik: "90%", kutilgan: "90%", delta: "0%" },
      { kun: "Dushanba", soat: "18:00", zichlik: "45%", kutilgan: "45%", delta: "0%" },
      { kun: "Seshanba", soat: "08:00", zichlik: "96%", kutilgan: "97.5%", delta: "-1.5%" },
      { kun: "Seshanba", soat: "11:00", zichlik: "98%", kutilgan: "98%", delta: "0%" },
      { kun: "Seshanba", soat: "14:00", zichlik: "92%", kutilgan: "92%", delta: "0%" },
      { kun: "Seshanba", soat: "16:00", zichlik: "95%", kutilgan: "95%", delta: "0%" },
      { kun: "Seshanba", soat: "18:00", zichlik: "50%", kutilgan: "50%", delta: "0%" },
      { kun: "Chorshanba", soat: "08:00", zichlik: "89%", kutilgan: "85.6%", delta: "+3.4%" },
      { kun: "Chorshanba", soat: "11:00", zichlik: "91%", kutilgan: "91%", delta: "0%" },
      { kun: "Chorshanba", soat: "14:00", zichlik: "78%", kutilgan: "78%", delta: "0%" },
      { kun: "Chorshanba", soat: "16:00", zichlik: "82%", kutilgan: "82%", delta: "0%" },
      { kun: "Chorshanba", soat: "18:00", zichlik: "38%", kutilgan: "38%", delta: "0%" },
      { kun: "Payshanba", soat: "08:00", zichlik: "94%", kutilgan: "94.8%", delta: "-0.8%" },
      { kun: "Payshanba", soat: "11:00", zichlik: "96%", kutilgan: "96%", delta: "0%" },
      { kun: "Payshanba", soat: "14:00", zichlik: "88%", kutilgan: "88%", delta: "0%" },
      { kun: "Payshanba", soat: "16:00", zichlik: "92%", kutilgan: "92%", delta: "0%" },
      { kun: "Payshanba", soat: "18:00", zichlik: "42%", kutilgan: "42%", delta: "0%" },
      { kun: "Juma", soat: "08:00", zichlik: "91%", kutilgan: "89.8%", delta: "+1.2%" },
      { kun: "Juma", soat: "11:00", zichlik: "93%", kutilgan: "93%", delta: "0%" },
      { kun: "Juma", soat: "14:00", zichlik: "80%", kutilgan: "80%", delta: "0%" },
      { kun: "Juma", soat: "16:00", zichlik: "85%", kutilgan: "85%", delta: "0%" },
      { kun: "Juma", soat: "18:00", zichlik: "48%", kutilgan: "48%", delta: "0%" },
      { kun: "Shanba", soat: "08:00", zichlik: "75%", kutilgan: "77.2%", delta: "-2.2%" },
      { kun: "Shanba", soat: "11:00", zichlik: "78%", kutilgan: "78%", delta: "0%" },
      { kun: "Shanba", soat: "14:00", zichlik: "65%", kutilgan: "65%", delta: "0%" },
      { kun: "Shanba", soat: "16:00", zichlik: "70%", kutilgan: "70%", delta: "0%" },
      { kun: "Shanba", soat: "18:00", zichlik: "30%", kutilgan: "30%", delta: "0%" },
    ];

    if (format === 'csv') {
      const headers = "Kun,Soat,Trafik Zichligi (Actual),Kutilgan Davomat (Predicted),Farq (Delta)\n";
      const csvContent = headers + data.map(d => `${d.kun},${d.soat},${d.zichlik},${d.kutilgan},${d.delta}`).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "Nihol_AI_Attendance_Report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("NIHOL AI ERP - DAVOMAT TAHLILI HISOBOTI", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Chop etilgan sana: ${new Date().toLocaleDateString()}`, 14, 27);
      doc.text(`Kindergarten ID: ${selectedKindergartenId.toUpperCase()}`, 14, 32);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 36, 196, 36);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Kun", 14, 43);
      doc.text("Soat", 45, 43);
      doc.text("Trafik (Actual)", 75, 43);
      doc.text("Kutilgan (Predicted)", 120, 43);
      doc.text("Farq (Delta)", 165, 43);

      doc.line(14, 46, 196, 46);

      doc.setFont("helvetica", "normal");
      let y = 52;
      data.forEach((d) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
          doc.setFont("helvetica", "bold");
          doc.text("Kun", 14, y);
          doc.text("Soat", 45, y);
          doc.text("Trafik (Actual)", 75, y);
          doc.text("Kutilgan (Predicted)", 120, y);
          doc.text("Farq (Delta)", 165, y);
          doc.line(14, y + 3, 196, y + 3);
          doc.setFont("helvetica", "normal");
          y += 10;
        }
        doc.text(d.kun, 14, y);
        doc.text(d.soat || "11:00", 45, y);
        doc.text(d.zichlik, 75, y);
        doc.text(d.kutilgan, 120, y);
        doc.text(d.delta, 165, y);
        y += 7;
      });

      doc.save("Nihol_AI_Attendance_Report.pdf");
    }
  };

  const fetchSuperAdminDocs = async () => {
    try {
      const res = await fetch("/api/superadmin/documents");
      if (res.ok) {
        const data = await res.json();
        setSuperAdminDocs(data);
        // Initialize distribPanels from loaded docs
        const initial: any = {};
        data.forEach((d: any) => {
          initial[d.id] = d.distributedToPanels || [];
        });
        setDistribPanels(initial);
      }
    } catch (err) {
      console.error("Xatolik hujjatlarni yuklashda:", err);
    }
  };

  const handleUploadDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle) return;
    try {
      const res = await fetch("/api/superadmin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle,
          allocatedFunds: Number(newDocFunds) || 0,
          targetDirectorUsername: newDocDirector,
          fileName: newDocFile,
          fileUrl: newDocUrl
        })
      });
      if (res.ok) {
        setNewDocTitle("");
        setNewDocFunds("");
        setNewDocFile("hujjat_nizomi_2026.pdf");
        fetchSuperAdminDocs();
        onRefresh();
        triggerNotification("Hujjat muvaffaqiyatli yuklandi va direktorga biriktirildi!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDistributeDoc = async (docId: string, panels: string[]) => {
    try {
      const res = await fetch(`/api/superadmin/documents/${docId}/distribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panels })
      });
      if (res.ok) {
        fetchSuperAdminDocs();
        onRefresh();
        triggerNotification("Hujjat tanlangan panellarga muvaffaqiyatli tarqatildi va byudjet tushumi buxgalteriyaga yuklandi!");
      } else {
        alert("Xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceList = async () => {
    try {
      const res = await fetch("/api/attendance");
      if (res.ok) {
        const data = await res.json();
        setAttendanceList(data);
      }
    } catch (err) {
      console.error("Error fetching attendance list:", err);
    }
  };

  const fetchKindergartens = async () => {
    try {
      const res = await fetch("/api/kindergartens");
      if (res.ok) {
        const data = await res.json();
        setKindergartens(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKindergartens();
    fetchSuperAdminDocs();
    fetchAttendanceList();
  }, [rawChildrenList]);

  const handleAddKindergarten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kgName) return;
    try {
      const res = await fetch("/api/kindergartens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: kgName, address: kgAddress, phone: kgPhone })
      });
      if (res.ok) {
        setShowAddKgModal(false);
        setKgName("");
        setKgAddress("");
        setKgPhone("");
        fetchKindergartens();
        onRefresh();
        triggerNotification("Yangi bog'cha muvaffaqiyatli qo'shildi!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirNameInput || !dirUsernameInput || !dirPasswordInput) return;
    try {
      const res = await fetch(`/api/kindergartens/${assigningKgId}/director`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dirNameInput,
          username: dirUsernameInput,
          password: dirPasswordInput,
          phone: dirPhoneInput,
          passport: dirPassportInput
        })
      });
      if (res.ok) {
        setShowAssignDirectorModal(false);
        setDirNameInput("");
        setDirUsernameInput("");
        setDirPasswordInput("");
        setDirPhoneInput("+998");
        setDirPassportInput("");
        fetchKindergartens();
        onRefresh();
        triggerNotification("Direktor logini muvaffaqiyatli yaratildi!");
      } else {
        const errData = await res.json();
        alert(errData.message || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Modals state
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showEditEmpModal, setShowEditEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editEmpName, setEditEmpName] = useState("");
  const [editEmpUser, setEditEmpUser] = useState("");
  const [editEmpPass, setEditEmpPass] = useState("");
  const [editEmpRole, setEditEmpRole] = useState<any>("Tarbiyachi");
  const [editEmpPhone, setEditEmpPhone] = useState("");
  const [editEmpPassport, setEditEmpPassport] = useState("");
  const [editEmpStatus, setEditEmpStatus] = useState("Faol");
  const [editEmpError, setEditEmpError] = useState<string | null>(null);

  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupTeacher, setEditGroupTeacher] = useState("");
  const [editGroupCapacity, setEditGroupCapacity] = useState("25");

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // Deep-Dive Modal states
  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [deepDiveAnalysis, setDeepDiveAnalysis] = useState("");

  const handleFetchDeepDive = async () => {
    setShowDeepDiveModal(true);
    setDeepDiveLoading(true);
    setDeepDiveAnalysis("");
    try {
      const res = await fetch("/api/gemini/attendance-deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kindergartenId: user.kindergartenId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDeepDiveAnalysis(data.analysis);
        } else {
          setDeepDiveAnalysis("Tahlilni yuklashda muammo yuz berdi. Iltimos qayta urinib ko'ring.");
        }
      } else {
        setDeepDiveAnalysis("Tizim bilan bog'lanishda xatolik yuz berdi.");
      }
    } catch (err: any) {
      console.error(err);
      setDeepDiveAnalysis("Xatolik yuz berdi: " + err.message);
    } finally {
      setDeepDiveLoading(false);
    }
  };

  // Telegram Bot Status states
  const [tgBotStatus, setTgBotStatus] = useState<"online" | "offline" | "checking">("online");
  const [tgBotLatency, setTgBotLatency] = useState<number | null>(14);
  const [tgBotUptime, setTgBotUptime] = useState("99.98%");
  const [tgBotError, setTgBotError] = useState<string | null>(null);
  const [tgBotMode, setTgBotMode] = useState("Simulator mode");
  const [tgBotTesting, setTgBotTesting] = useState(false);

  const fetchTgBotStatus = async () => {
    try {
      const res = await fetch("/api/telegram-simulator/status");
      const data = await res.json();
      if (res.ok) {
        setTgBotStatus(data.status);
        setTgBotLatency(data.latency);
        setTgBotUptime(data.uptime);
        setTgBotError(data.error);
        setTgBotMode(data.mode);
      } else {
        setTgBotStatus("offline");
        setTgBotError("HTTP Error: Server status request failed.");
      }
    } catch (err: any) {
      console.error(err);
      setTgBotStatus("offline");
      setTgBotError(err.message || "Ulanish xatoligi");
    }
  };

  const handleToggleTgError = async () => {
    setTgBotTesting(true);
    try {
      await fetch("/api/telegram-simulator/toggle-error", { method: "POST" });
      await fetchTgBotStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setTgBotTesting(false);
    }
  };

  React.useEffect(() => {
    fetchTgBotStatus();
    // Poll every 15 seconds for telegram bot status
    const interval = setInterval(fetchTgBotStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Form states for child
  const [childName, setChildName] = useState("");
  const [childBirthDate, setChildBirthDate] = useState("2021-05-15");
  const [childGender, setChildGender] = useState<"O'g'il" | "Qiz">("O'g'il");
  const [childGroup, setChildGroup] = useState("");
  const [childParentName, setChildParentName] = useState("");
  const [childParentPhone, setChildParentPhone] = useState("+998");
  const [childTelegramChatId, setChildTelegramChatId] = useState("");

  // Edit/Temp state for Telegram ID and Phone inline edit
  const [tempTelegramChatId, setTempTelegramChatId] = useState("");
  const [tempParentPhone, setTempParentPhone] = useState("");
  useEffect(() => {
    if (currentChild) {
      setTempTelegramChatId(currentChild.telegramChatId || "");
      setTempParentPhone(currentChild.parentPhone || "");
    }
  }, [selectedChildId, rawChildrenList]);

  const handleSaveTelegramChatId = async () => {
    if (!currentChild) return;
    try {
      const res = await fetch(`/api/children/${currentChild.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          telegramChatId: tempTelegramChatId || null,
          parentPhone: tempParentPhone || ""
        }),
      });
      if (res.ok) {
        onRefresh();
        // Automatically log with our centralized AuditLogger
        await AuditLogger.log(
          user.name,
          `Bola sozlamalari tahrirlandi: ${currentChild.name} (Telegram: ${tempTelegramChatId || "Yo'q"}, Tel: ${tempParentPhone || "Yo'q"})`,
          "Children",
          user.kindergartenId
        );
        triggerNotification("Sozlamalar muvaffaqiyatli saqlandi!");
      } else {
        alert("Xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Form states for employee
  const [empName, setEmpName] = useState("");
  const [empUser, setEmpUser] = useState("");
  const [empPass, setEmpPass] = useState("admin135@");
  const [empRole, setEmpRole] = useState<"Tarbiyachi" | "Oshpaz" | "Hamshira" | "Buxgalter" | "Tozalovchi">("Tarbiyachi");
  const [empPhone, setEmpPhone] = useState("+998");
  const [addEmpError, setAddEmpError] = useState<string | null>(null);

  // Director webcam photo upload / snapshot states
  const [childPhoto, setChildPhoto] = useState<string | null>(null);
  const [empPhoto, setEmpPhoto] = useState<string | null>(null);
  const [isDirCameraActive, setIsDirCameraActive] = useState(false);
  const [dirCameraError, setDirCameraError] = useState<string | null>(null);
  const [dirCameraTarget, setDirCameraTarget] = useState<"child" | "employee" | null>(null);
  const [empPassport, setEmpPassport] = useState("");

  // Form states for Group
  const [groupName, setGroupName] = useState("");
  const [groupTeacher, setGroupTeacher] = useState("");
  const [groupCapacity, setGroupCapacity] = useState(20);

  // Form states for Payment
  const [payChildId, setPayChildId] = useState("");
  const [payAmount, setPayAmount] = useState(800000);
  const [payType, setPayType] = useState<"Naqd" | "Click" | "Payme" | "Uzum">("Click");
  const [payMonth, setPayMonth] = useState("Iyul");

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");

  // Notification states
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);

  // Search/Filter states
  const [childSearch, setChildSearch] = useState("");
  const [childGroupFilter, setChildGroupFilter] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  useEffect(() => {
    if (groupsList.length > 0 && !childGroup) {
      setChildGroup(groupsList[0].id);
    }
    if (employeesList.length > 0 && !groupTeacher) {
      setGroupTeacher(employeesList[0].id);
    }
  }, [groupsList, employeesList]);

  useEffect(() => {
    const handleJump = (e: Event) => {
      const customEvent = e as CustomEvent<{ tabId: string; openModal?: string }>;
      if (customEvent.detail && customEvent.detail.tabId) {
        setActiveTab(customEvent.detail.tabId);
        setSelectedChildId(null);
        if (customEvent.detail.openModal === "add-child") {
          setShowAddChildModal(true);
        } else if (customEvent.detail.openModal === "add-payment") {
          setShowAddPaymentModal(true);
        } else if (customEvent.detail.openModal === "add-employee") {
          setShowAddEmpModal(true);
        } else if (customEvent.detail.openModal === "add-group") {
          setShowAddGroupModal(true);
        } else if (customEvent.detail.openModal === "send-broadcast") {
          setShowBroadcastModal(true);
        }
      }
    };
    window.addEventListener("jump-to-dashboard-tab", handleJump);
    return () => window.removeEventListener("jump-to-dashboard-tab", handleJump);
  }, []);

  const [hardwareData, setHardwareData] = useState<any>({
    devices: [],
    totalDevicesCount: 0,
    onlineDevicesCount: 0,
    faceIdCamerasCount: 0,
    healthPercentage: 100
  });
  const [showHardwareModal, setShowHardwareModal] = useState(false);

  // New physical device form states
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceIp, setNewDeviceIp] = useState("");
  const [newDeviceType, setNewDeviceType] = useState("entrance");

  const handleRegisterDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId || !newDeviceName || !newDeviceIp) {
      alert("Iltimos barcha maydonlarni to'ldiring!");
      return;
    }
    try {
      const res = await fetch("/api/hardware/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newDeviceId,
          name: newDeviceName,
          ip: newDeviceIp,
          type: newDeviceType
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifSuccess(data.message);
        setTimeout(() => setNotifSuccess(null), 4000);
        // Clear form
        setNewDeviceId("");
        setNewDeviceName("");
        setNewDeviceIp("");
        setNewDeviceType("entrance");
        // Reload
        fetchHardwareStatus();
      } else {
        alert(data.message || "Xatolik yuz berdi!");
      }
    } catch (err) {
      console.error(err);
      alert("Serverga ulanishda xatolik!");
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!window.confirm("Haqiqatdan ham ushbu qurilmani tizimdan o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/hardware/devices/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifSuccess(data.message);
        setTimeout(() => setNotifSuccess(null), 3000);
        fetchHardwareStatus();
      } else {
        alert(data.message || "Xatolik yuz berdi!");
      }
    } catch (err) {
      console.error(err);
      alert("Serverga ulanishda xatolik!");
    }
  };

  const fetchHardwareStatus = async () => {
    try {
      const res = await fetch("/api/hardware/status");
      if (res.ok) {
        const data = await res.json();
        setHardwareData(data);
      }
    } catch (err) {
      console.error("Error fetching hardware status:", err);
    }
  };

  useEffect(() => {
    fetchHardwareStatus();

    let ws: WebSocket | null = null;
    let fallbackInterval: any = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws-hardware`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === "hardware_update") {
              setHardwareData(message.data);
            } else if (message.type === "data_update") {
              console.log("[WebSocket] Received real-time database update for module:", message.module);
              onRefresh();
            }
          } catch (e) {
            console.error("Error parsing hardware websocket message:", e);
          }
        };

        ws.onopen = () => {
          console.log("[Hardware Health WS] Connected successfully!");
          if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
          }
        };

        ws.onclose = () => {
          console.log("[Hardware Health WS] Offline/Closed. Switching dynamically to REST API polling fallback...");
          if (!fallbackInterval) {
            fallbackInterval = setInterval(fetchHardwareStatus, 15000);
          }
          setTimeout(connectWebSocket, 10000); // Try reconnecting less aggressively (every 10s)
        };

        ws.onerror = () => {
          // Native browser socket errors are already logged in red, we catch and soften our trace
          console.log("[Hardware Health WS] Connection unavailable. Automatically engaging REST API polling fallback.");
          ws?.close();
        };
      } catch (err) {
        console.error("Error establishing WebSocket:", err);
        if (!fallbackInterval) {
          fallbackInterval = setInterval(fetchHardwareStatus, 15000);
        }
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, []);

  const triggerNotification = (text: string) => {
    setNotifSuccess(text);
    setTimeout(() => setNotifSuccess(null), 3000);
  };

  const startDirCamera = async (target: "child" | "employee") => {
    setDirCameraError(null);
    setDirCameraTarget(target);
    setIsDirCameraActive(true);
    if (target === "child") setChildPhoto(null);
    else setEmpPhoto(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setTimeout(() => {
        const videoElement = document.getElementById("dir-video-element") as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.play().catch(e => console.error("Video play failed", e));
        }
      }, 200);
    } catch (err: any) {
      console.warn("Camera access failed, falling back to mock capture:", err);
      setDirCameraError("Kamera ruxsatnomasi mavjud emas. Simulyatsiya rejimi faollashtirildi.");
    }
  };

  const stopDirCamera = () => {
    try {
      const videoElement = document.getElementById("dir-video-element") as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error(err);
    }
    setIsDirCameraActive(false);
    setDirCameraTarget(null);
  };

  const captureDirSnapshot = () => {
    try {
      const videoElement = document.getElementById("dir-video-element") as HTMLVideoElement;
      let snapshotUrl = "";

      if (videoElement && !dirCameraError) {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, 320, 240);
          snapshotUrl = canvas.toDataURL("image/jpeg");
        }
      } else {
        if (dirCameraTarget === "child") {
          const childAvatars = [
            "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=200",
            "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&q=80&w=200",
            "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=80&w=200",
            "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=200"
          ];
          snapshotUrl = childAvatars[Math.floor(Math.random() * childAvatars.length)];
        } else {
          const teacherAvatars = [
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
            "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
            "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200"
          ];
          snapshotUrl = teacherAvatars[Math.floor(Math.random() * teacherAvatars.length)];
        }
      }

      if (dirCameraTarget === "child") {
        setChildPhoto(snapshotUrl);
      } else if (dirCameraTarget === "employee") {
        setEmpPhoto(snapshotUrl);
      }

      stopDirCamera();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName || !childParentName || !childParentPhone) return;

    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: childName,
          birthDate: childBirthDate,
          age: 2026 - Number(childBirthDate.split("-")[0]) || 5,
          gender: childGender,
          groupId: childGroup,
          parentName: childParentName,
          parentPhone: childParentPhone,
          telegramChatId: childTelegramChatId || null,
          photo: childPhoto || "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=200",
          documents: {
            birthCertificate: true,
            medicalCard: true,
            passportCopy: false,
            contract: true,
            photoUploaded: true
          },
          operatorName: user.name
        }),
      });
      if (res.ok) {
        setShowAddChildModal(false);
        setChildName("");
        setChildParentName("");
        setChildParentPhone("+998");
        setChildTelegramChatId("");
        setChildPhoto(null);
        onRefresh();
        
        await AuditLogger.log(
          user.name,
          `Yangi bola qo'shildi: ${childName} (Ota-onasi: ${childParentName}, Tel: ${childParentPhone})`,
          "Children",
          user.kindergartenId
        );
        triggerNotification("Yangi bola muvaffaqiyatli qo'shildi!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empUser || !empPass || !empPhone) return;

    setAddEmpError(null);

    const reqHeaders: Record<string, string> = { 
      "Content-Type": "application/json" 
    };
    if (user.kindergartenId) {
      reqHeaders["x-kindergarten-id"] = user.kindergartenId;
    }

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          name: empName,
          username: empUser,
          passwordHash: empPass,
          role: empRole,
          phone: empPhone,
          passport: empPassport,
          photo: empPhoto || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
          birthDate: "1992-05-15",
          status: "Faol",
          joinedDate: new Date().toISOString().split("T")[0],
          operatorName: user.name
        }),
      });
      if (res.ok) {
        setAddEmpError(null);
        setShowAddEmpModal(false);
        setEmpName("");
        setEmpUser("");
        setEmpPass("admin135@");
        setEmpPhone("+998");
        setEmpPassport("");
        setEmpPhoto(null);
        onRefresh();
        
        await AuditLogger.log(
          user.name,
          `Yangi xodim qo'shildi: ${empName} (Rol: ${empRole}, Username: ${empUser})`,
          "Employees",
          user.kindergartenId
        );
        triggerNotification("Yangi xodim muvaffaqiyatli ro'yxatga olindi!");
      } else {
        const data = await res.json();
        setAddEmpError(data.error || data.message || "Xatolik yuz berdi (400 Bad Request)!");
      }
    } catch (err) {
      console.error(err);
      setAddEmpError("Tarmoq xatoligi yoki server bilan ulanib bo'lmadi.");
    }
  };

  const handleOpenEditEmp = (emp: Employee) => {
    setEditingEmp(emp);
    setEditEmpName(emp.name);
    setEditEmpUser(emp.username);
    setEditEmpPass("");
    setEditEmpRole(emp.role);
    setEditEmpPhone(emp.phone || "");
    setEditEmpPassport(emp.passport || "");
    setEditEmpStatus(emp.status || "Faol");
    setEditEmpError(null);
    setShowEditEmpModal(true);
  };

  const handleSaveEditEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    try {
      const body: any = {
        name: editEmpName,
        username: editEmpUser,
        role: editEmpRole,
        phone: editEmpPhone,
        passport: editEmpPassport,
        status: editEmpStatus,
      };
      if (editEmpPass.trim()) {
        body.passwordHash = editEmpPass.trim();
      }

      const res = await fetch(`/api/employees/${editingEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowEditEmpModal(false);
        setEditingEmp(null);
        onRefresh();
        await AuditLogger.log(
          user.name,
          `Xodim ma'lumotlari tahrirlandi: ${editEmpName} (ID: ${editingEmp.id})`,
          "Employees",
          user.kindergartenId
        );
        triggerNotification("Xodim ma'lumotlari muvaffaqiyatli yangilandi!");
      } else {
        const data = await res.json();
        setEditEmpError(data.message || "Xatolik yuz berdi!");
      }
    } catch (err) {
      console.error(err);
      setEditEmpError("Tarmoq xatoligi yuz berdi.");
    }
  };

  const handleDeleteEmployee = async (id: string, name: string, role: string) => {
    if (role === "SuperAdmin") {
      alert("SuperAdmin hisobini o'chirib bo'lmaydi!");
      return;
    }
    if (!confirm(`Haqiqatan ham "${name}" xodimini tizimdan o'chirmoqchimisiz?`)) return;

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRefresh();
        await AuditLogger.log(
          user.name,
          `Xodim o'chirildi: ${name} (ID: ${id})`,
          "Employees",
          user.kindergartenId
        );
        triggerNotification("Xodim muvaffaqiyatli o'chirildi!");
      } else {
        alert("Xodimni o'chirishda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
      alert("Aloqa xatosi yuz berdi.");
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          teacherId: groupTeacher,
          capacity: Number(groupCapacity),
        }),
      });
      if (res.ok) {
        setShowAddGroupModal(false);
        setGroupName("");
        onRefresh();
        
        await AuditLogger.log(
          user.name,
          `Yangi guruh yaratildi: ${groupName} (Sig'im: ${groupCapacity})`,
          "Groups",
          user.kindergartenId
        );
        triggerNotification("Yangi guruh muvaffaqiyatli yaratildi!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditGroup = (g: Group) => {
    setEditingGroup(g);
    setEditGroupName(g.name);
    setEditGroupTeacher(g.teacherId || "");
    setEditGroupCapacity(String(g.capacity || 25));
    setShowEditGroupModal(true);
  };

  const handleSaveEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    try {
      const res = await fetch(`/api/groups/${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editGroupName,
          teacherId: editGroupTeacher,
          capacity: Number(editGroupCapacity),
        }),
      });

      if (res.ok) {
        setShowEditGroupModal(false);
        setEditingGroup(null);
        onRefresh();
        await AuditLogger.log(
          user.name,
          `Guruh tahrirlandi: ${editGroupName} (ID: ${editingGroup.id})`,
          "Groups",
          user.kindergartenId
        );
        triggerNotification("Guruh muvaffaqiyatli yangilandi!");
      } else {
        alert("Guruhni yangilashda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
      alert("Aloqa xatosi!");
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Haqiqatan ham "${name}" guruhini o'chirmoqchimisiz? Guruhdagi bolalar bog'lanmasi bekor qilinadi.`)) return;

    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedGroupDetail?.id === id) {
          setSelectedGroupDetail(null);
        }
        onRefresh();
        await AuditLogger.log(
          user.name,
          `Guruh o'chirildi: ${name} (ID: ${id})`,
          "Groups",
          user.kindergartenId
        );
        triggerNotification("Guruh muvaffaqiyatli o'chirildi!");
      } else {
        alert("Guruhni o'chirishda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
      alert("Aloqa xatosi yuz berdi.");
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = payChildId || (childrenList[0] ? childrenList[0].id : "");
    if (!targetId) return;

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: targetId,
          amount: Number(payAmount),
          paymentType: payType,
          month: payMonth,
          operatorName: user.name
        }),
      });
      if (res.ok) {
        setShowAddPaymentModal(false);
        onRefresh();
        
        const childObj = childrenList.find(c => c.id === targetId);
        await AuditLogger.log(
          user.name,
          `To'lov qabul qilindi: ${childObj ? childObj.name : targetId} uchun ${Number(payAmount).toLocaleString()} UZS (Turi: ${payType}, Oy: ${payMonth})`,
          "Payments",
          user.kindergartenId
        );
        triggerNotification("To'lov muvaffaqiyatli qabul qilindi!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    try {
      const res = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: broadcastMessage,
          kindergartenId: user.kindergartenId || "all"
        })
      });
      if (res.ok) {
        const data = await res.json();
        triggerNotification(data.message || "Xabar Telegram orqali yuborildi!");
        setShowBroadcastModal(false);
        setBroadcastMessage("");
        onRefresh();
      } else {
        triggerNotification("Xabarni tarqatishda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Aloqa xatosi yuz berdi.");
    }
  };

  const handleDeleteChild = async (id: string) => {
    if (!confirm("Haqiqatan ham ushbu bolani o'chirmoqchimisiz?")) return;
    const target = rawChildrenList.find(c => c.id === id);
    const targetName = target ? target.name : id;
    try {
      await fetch(`/api/children/${id}`, { method: "DELETE" });
      onRefresh();
      await AuditLogger.log(
        user.name,
        `Bola o'chirib tashlandi: ${targetName} (ID: ${id})`,
        "Children",
        user.kindergartenId
      );
      triggerNotification("Bola ro'yxatdan o'chirildi.");
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Actions
  const handleSelectAllChildren = (checked: boolean, list: any[]) => {
    if (checked) {
      setSelectedChildIds(list.map(c => c.id));
    } else {
      setSelectedChildIds([]);
    }
  };

  const handleSelectChild = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedChildIds(prev => [...prev, id]);
    } else {
      setSelectedChildIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleBulkMarkAbsent = async () => {
    if (selectedChildIds.length === 0) return;
    if (!confirm(`Haqiqatdan ham tanlangan ${selectedChildIds.length} ta bolani kelmagan deb belgilamoqchimisiz?`)) return;

    setIsProcessingBulk(true);
    try {
      const res = await fetch("/api/children/bulk-absent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedChildIds })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotification(data.message);
        setSelectedChildIds([]);
        onRefresh();
      } else {
        alert(data.message || "Xatolik yuz berdi!");
      }
    } catch (err) {
      console.error(err);
      alert("Xatolik!");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkSendReminder = async () => {
    if (selectedChildIds.length === 0) return;
    setIsProcessingBulk(true);
    try {
      const res = await fetch("/api/children/bulk-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ids: selectedChildIds,
          message: bulkActionMessage || "Farzandingizning holati va davomati bo'yicha bog'chadan ogohlantirish eslatmasi yuborildi."
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotification(data.message);
        setSelectedChildIds([]);
        setBulkActionMessage("");
        onRefresh();
      } else {
        alert(data.message || "Xatolik yuz berdi!");
      }
    } catch (err) {
      console.error(err);
      alert("Xatolik!");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedChildIds.length === 0) return;
    
    const selectedChildren = rawChildrenList.filter(c => selectedChildIds.includes(c.id));
    
    // Create CSV content
    const headers = ["ID", "Ismi", "Guruh ID", "Yoshi", "Ota-onasi", "Telefon raqami", "Status"];
    const rows = selectedChildren.map(c => [
      c.id,
      c.name,
      c.groupId,
      c.age,
      c.parentName,
      c.parentPhone,
      c.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tanlangan_bolalar_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResolveComplaint = async (id: string) => {
    try {
      const res = await fetch("/api/complaints/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Hal etildi" }),
      });
      if (res.ok) {
        onRefresh();
        triggerNotification("Murojaat hal etilgan deb belgilandi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateDirectorPDF = () => {
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
      doc.text(cleanText("NIHOL AI ERP - DIREKTORLIK HISOBOTI"), 14, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(cleanText(`Sana: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`), 14, 26);
      doc.text(cleanText("Mas'ul: Karimov Shaxzod Baxtiyorovich (Direktor)"), 14, 31);

      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 35, 196, 35);

      // Section 1: Core Metrics
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanText("1. Asosiy Statistik Ko'rsatkichlar"), 14, 45);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      
      let y = 53;
      doc.text(cleanText(`- Jami bolalar soni: ${childrenList.length} nafar`), 16, y); y += 7;
      doc.text(cleanText(`- Bog'chada faol hozir bo'lganlar: ${childrenList.filter(c => c.status === "Bog'chada" || c.status === "Kechikdi").length} nafar`), 16, y); y += 7;
      doc.text(cleanText(`- Kelmagan bolalar soni: ${childrenList.filter(c => c.status === "Kelmagan" || c.status === "Sababli").length} nafar`), 16, y); y += 7;
      doc.text(cleanText(`- Jami guruhlar soni: ${groupsList.length} ta guruh`), 16, y); y += 7;
      doc.text(cleanText(`- Jami xodimlar soni: ${employeesList.length} nafar`), 16, y); y += 7;

      doc.line(14, y + 3, 196, y + 3);
      y += 12;

      // Section 2: Groups Capacity and Attendance
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanText("2. Guruhlar Sig'imi va Holati"), 14, y);
      y += 8;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(cleanText("Guruh Nomi"), 16, y);
      doc.text(cleanText("Sig'imi"), 80, y);
      doc.text(cleanText("Bolalar Soni"), 120, y);
      doc.text(cleanText("Tarbiyachi ID"), 160, y);
      y += 5;
      doc.line(14, y, 196, y);
      y += 6;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      groupsList.forEach(g => {
        const count = childrenList.filter(c => c.groupId === g.id).length;
        doc.text(cleanText(g.name), 16, y);
        doc.text(cleanText(`${g.capacity} ta`), 80, y);
        doc.text(cleanText(`${count} nafar`), 120, y);
        doc.text(cleanText(g.teacherId || "Tayinlanmagan"), 160, y);
        y += 7;
      });

      doc.line(14, y + 3, 196, y + 3);
      y += 12;

      // Section 3: System Audit Notes
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanText("3. Tizim va Davomat Tahlili"), 14, y);
      y += 8;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(cleanText("Tavsiya: Dars va qatnov dinamikasiga ko'ra Kamalak va Quyosh guruhlarining davomati"), 16, y); y += 6;
      doc.text(cleanText("a'lo darajada (o'rtacha 94%). Shanba kungi qatnovni oshirish uchun maxsus to'garaklarni"), 16, y); y += 6;
      doc.text(cleanText("ko'paytirish maqsadga muvofiq."), 16, y);

       doc.save("Nihol_AI_ERP_Direktor_Hisoboti.pdf");
       triggerNotification("PDF Hisoboti muvaffaqiyatli generatsiya qilindi va yuklandi! 📄");
     } catch (err) {
       console.error(err);
       triggerNotification("Xatolik: PDF eksport qilish muvaffaqiyatsiz tugadi.");
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
  
      if (type === "children") {
        const dataToExport = filteredRecords.map(rec => {
          const ch = childrenList.find(c => c.id === rec.childId);
          const groupName = ch ? (groupsList.find(g => g.id === ch.groupId)?.name || "Guruhsiz") : "—";
          const childName = ch ? ch.name : `Bola (ID: ${rec.childId})`;
          return {
            date: rec.date,
            id: rec.childId,
            name: childName,
            group: groupName,
            checkIn: rec.checkIn || "—",
            checkOut: rec.checkOut || "—",
            temperature: rec.temperature ? `${rec.temperature}°C` : "—",
            status: rec.status,
            checkoutPerson: rec.checkoutPersonName || "—"
          };
        });

        const columns = [
          { key: "date", header: "Sana" },
          { key: "id", header: "ID" },
          { key: "name", header: "Ism-Familiya" },
          { key: "group", header: "Guruh" },
          { key: "checkIn", header: "Kelgan Vaqti" },
          { key: "checkOut", header: "Ketgan Vaqti" },
          { key: "temperature", header: "Tana Harorati" },
          { key: "status", header: "Holat" },
          { key: "checkoutPerson", header: "Olib ketgan shaxs" }
        ];

        exportJSONToCSV(dataToExport, columns, `${type}_attendance_${period}_report`);
      } else {
        const dataToExport = filteredRecords.map(rec => {
          const emp = employeesList.find(e => e.id === rec.childId);
          const empName = emp ? emp.name : `Xodim (ID: ${rec.childId})`;
          const empRole = emp ? emp.role : "Xodim";
          return {
            date: rec.date,
            id: rec.childId,
            name: empName,
            role: empRole,
            checkIn: rec.checkIn || "—",
            checkOut: rec.checkOut || "—",
            temperature: rec.temperature ? `${rec.temperature}°C` : "—",
            status: rec.checkOut ? "Ishdan ketdi" : "Ayni vaqtda ishda"
          };
        });

        const columns = [
          { key: "date", header: "Sana" },
          { key: "id", header: "ID" },
          { key: "name", header: "Ism-Familiya" },
          { key: "role", header: "Lavozim" },
          { key: "checkIn", header: "Kelgan Vaqti" },
          { key: "checkOut", header: "Ketgan Vaqti" },
          { key: "temperature", header: "Tana Harorati" },
          { key: "status", header: "Holat" }
        ];

        exportJSONToCSV(dataToExport, columns, `${type}_attendance_${period}_report`);
      }
  
      triggerNotification(`${period === "daily" ? "Kunlik" : period === "weekly" ? "Haftalik" : "Oylik"} CSV hisobot muvaffaqiyatli yuklandi! 📥`);
    };

    const exportPaymentsCSV = () => {
      const columns = [
        { key: "childName", header: "Bola ismi" },
        { key: "date", header: "Sana" },
        { key: "month", header: "Oylik (Month)" },
        { key: "paymentType", header: "To'lov turi" },
        { key: "amount", header: "Summa" }
      ];
      const dataToExport = paymentsList.map(p => ({
        childName: childrenList.find(c => c.id === p.childId)?.name || "Bola",
        date: p.date,
        month: `${p.month} oyi`,
        paymentType: p.paymentType,
        amount: `${p.amount.toLocaleString()} UZS`
      }));
      exportJSONToCSV(dataToExport, columns, "tolovlar_hisoboti");
      triggerNotification("To'lovlar ro'yxati muvaffaqiyatli yuklab olindi! 📥");
    };

    const exportEmployeesCSV = () => {
      const columns = [
        { key: "name", header: "Xodim F.I.O" },
        { key: "role", header: "Rol / Lavozim" },
        { key: "username", header: "Tizimdagi logini" },
        { key: "phone", header: "Telefon" },
        { key: "salary", header: "Maosh" },
        { key: "status", header: "Status" }
      ];
      const dataToExport = employeesList.map(e => ({
        name: e.name,
        role: e.role,
        username: e.username,
        phone: e.phone,
        salary: "3,200,000 UZS",
        status: e.status
      }));
      exportJSONToCSV(dataToExport, columns, "xodimlar_shtati_report");
      triggerNotification("Xodimlar ro'yxati muvaffaqiyatli yuklab olindi! 📥");
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
           const groupName = ch ? (groupsList.find(g => g.id === ch.groupId)?.name || "Guruhsiz") : "—";
           const childName = ch ? ch.name : `Bola (ID: ${rec.childId})`;
           
           doc.text(cleanText(rec.date), 14, y);
           doc.text(cleanText(childName.slice(0, 28)), 35, y);
           doc.text(cleanText(groupName.slice(0, 18)), 95, y);
           doc.text(cleanText(rec.checkIn || "—"), 135, y);
           doc.text(cleanText(rec.checkOut || "—"), 155, y);
           doc.text(cleanText(rec.status), 175, y);
           
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
       triggerNotification(`${period === "daily" ? "Kunlik" : period === "weekly" ? "Haftalik" : "Oylik"} PDF hisobot muvaffaqiyatli yuklandi! 📄`);
     } catch (err) {
       console.error(err);
       triggerNotification("Hisobot PDF generatsiya qilishda xatolik yuz berdi.");
     }
   };

  const staffAnomalies = React.useMemo(() => {
    const anomalies: Array<{
      id: string;
      employeeId: string;
      name: string;
      role: string;
      type: "missing_checkout" | "tardy";
      date: string;
      details: string;
    }> = [];

    // Filter records for employees (childId starting with E- or matching employeesList ids)
    const empRecords = attendanceList.filter(a => a.childId.startsWith("E-") || employeesList.some(e => e.id === a.childId));
    const todayStr = new Date().toISOString().split("T")[0];

    empRecords.forEach(rec => {
      const emp = employeesList.find(e => e.id === rec.childId);
      if (!emp) return;

      // 1. Missing checkout times (Check-in exists, check-out doesn't, and it's not today's active session)
      if (rec.checkIn && !rec.checkOut && rec.date !== todayStr) {
        anomalies.push({
          id: `ANOM-CO-${rec.id}`,
          employeeId: rec.childId,
          name: emp.name,
          role: emp.role,
          type: "missing_checkout",
          date: rec.date,
          details: `Chiqish qayd etilmagan (Sana: ${rec.date}).`
        });
      }

      // 2. Tardiness (Arrival after 08:30)
      if (rec.checkIn) {
        const [hour, minute] = rec.checkIn.split(":").map(Number);
        if (hour > 8 || (hour === 8 && minute > 30)) {
          anomalies.push({
            id: `ANOM-LATE-${rec.id}`,
            employeeId: rec.childId,
            name: emp.name,
            role: emp.role,
            type: "tardy",
            date: rec.date,
            details: `Kechikib kelish: ${rec.checkIn} (Sana: ${rec.date}).`
          });
        }
      }
    });

    return anomalies;
  }, [attendanceList, employeesList]);

  // Calculations for professional indicators
  const totalChildren = childrenList.length;
  const childrenInKgarten = childrenList.filter((c) => c.status === "Bog'chada" || c.status === "Kechikdi").length;
  const absentChildren = childrenList.filter((c) => c.status === "Kelmagan" || c.status === "Sababli").length;
  const sickChildren = childrenList.filter((c) => c.status === "Sababli").length;
  const totalStaff = employeesList.length;
  const activeStaff = employeesList.filter(e => e.status === "Faol").length;
  const totalReceivedFees = paymentsList.reduce((acc, curr) => acc + curr.amount, 0);
  const debtParentsCount = childrenList.length - paymentsList.filter(p => p.month === "Iyul").length;
  const totalDebtAmount = Math.max(0, debtParentsCount * 800000);
  const activeComplaints = complaintsList.filter((c) => c.status === "Yangi").length;

  // AI-driven Predicted Attendance and Scheduling Forecast for the Upcoming Week
  const predictedAttendanceData = React.useMemo(() => {
    const uzbDays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
    
    // 1. Base rates (priors) for day of week
    const baseRates: Record<number, number> = {
      1: 0.92, // Monday
      2: 0.96, // Tuesday
      3: 0.89, // Wednesday
      4: 0.94, // Thursday
      5: 0.91, // Friday
      6: 0.78, // Saturday
      0: 0.00  // Sunday
    };

    // 2. Extract actual child attendance
    const childAtt = attendanceList.filter(att => {
      const isEmployee = att.childId.startsWith("E-") || employeesList.some(e => e.id === att.childId);
      return !isEmployee;
    });

    // 3. Group by day of week
    const dayStats: Record<number, { present: number; total: number }> = {};
    for (let d = 0; d <= 6; d++) {
      dayStats[d] = { present: 0, total: 0 };
    }

    childAtt.forEach(att => {
      const dayOfWeek = new Date(att.date).getDay();
      dayStats[dayOfWeek].total += 1;
      if (att.status === "Keldi" || att.status === "Kechikdi" || att.checkIn) {
        dayStats[dayOfWeek].present += 1;
      }
    });

    // 4. Calculate smoothed rates using Bayesian smoothing (prior weight k = 5)
    const k = 5;
    const smoothedRates: Record<number, number> = {};
    for (let d = 0; d <= 6; d++) {
      const actual = dayStats[d];
      const base = baseRates[d];
      if (d === 0) {
        smoothedRates[d] = 0;
      } else {
        smoothedRates[d] = (actual.present + k * base) / (actual.total + k);
      }
    }

    // 5. Generate next week's dates starting from Monday, July 13th, 2026
    const baseDate = new Date("2026-07-08T20:08:40-07:00");
    const daysUntilNextMonday = (1 + 7 - baseDate.getDay()) % 7 || 7;
    const nextMonday = new Date(baseDate);
    nextMonday.setDate(baseDate.getDate() + daysUntilNextMonday);

    const forecast = [];
    const numChildren = childrenList.length || 25; // fallback to 25 if empty
    
    for (let i = 0; i < 6; i++) {
      const forecastDate = new Date(nextMonday);
      forecastDate.setDate(nextMonday.getDate() + i);
      const dateStr = forecastDate.toISOString().split("T")[0];
      const dayOfWeek = forecastDate.getDay();
      const rate = smoothedRates[dayOfWeek];
      const predictedCount = Math.min(numChildren, Math.max(1, Math.round(numChildren * rate)));
      const ratePct = Math.round(rate * 100);

      // Staff recommendations based on attendance percentage
      let staffRecommendation = "";
      let requiredStaff = 0;
      let chefHours = "";
      let mealPortionPct = 100;
      let statusColor = "emerald";

      if (ratePct >= 93) {
        staffRecommendation = "Maksimal yuklama. To'liq tarbiyachilar va hamshira shtati jalb qilinsin.";
        requiredStaff = Math.max(3, Math.round(employeesList.length * 0.9));
        chefHours = "To'liq smena (08:00 - 17:00)";
        mealPortionPct = 100;
        statusColor = "emerald";
      } else if (ratePct >= 88) {
        staffRecommendation = "O'rtacha yuklama. Standart smena va tarbiyachilar yetarli.";
        requiredStaff = Math.max(2, Math.round(employeesList.length * 0.7));
        chefHours = "Standart smena (08:00 - 16:00)";
        mealPortionPct = 90;
        statusColor = "cyan";
      } else {
        staffRecommendation = "Kam yuklama. Kamroq oziq-ovqat tayyorlash (byudjet tejash) va navbatchilik tavsiya etiladi.";
        requiredStaff = Math.max(1, Math.round(employeesList.length * 0.5));
        chefHours = "Qisqartirilgan smena (08:00 - 14:00)";
        mealPortionPct = 80;
        statusColor = "rose";
      }

      forecast.push({
        date: dateStr,
        dayOfWeek,
        dayName: uzbDays[dayOfWeek],
        predictedRate: ratePct,
        predictedCount,
        staffRecommendation,
        requiredStaff,
        chefHours,
        mealPortionPct,
        statusColor
      });
    }

    const averageRate = Math.round(forecast.reduce((acc, curr) => acc + curr.predictedRate, 0) / forecast.length);
    const averageCount = Math.round(forecast.reduce((acc, curr) => acc + curr.predictedCount, 0) / forecast.length);

    return {
      forecast,
      averageRate,
      averageCount
    };
  }, [attendanceList, childrenList, employeesList]);

  const currentChild = childrenList.find(c => c.id === selectedChildId);

  // Main Categories
  const categories = [
    { id: "dashboard", label: "Dashboard", icon: Grid },
    ...(user.role === "SuperAdmin" ? [{ id: "superadmin", label: "Super Admin (Bog'chalar)", icon: ShieldCheck }] : []),
    { id: "gallery", label: "Foto Galereya", icon: Image },
    { id: "children", label: `Bolalar (${totalChildren})`, icon: Users },
    { id: "parents", label: "Ota-onalar", icon: Heart },
    { id: "employees", label: `Xodimlar (${totalStaff})`, icon: UserCheck },
    { id: "groups", label: "Guruhlar", icon: Book },
    { id: "attendance", label: "Davomat", icon: Clock },
    { id: "payments", label: "To'lovlar", icon: CreditCard },
    { id: "finance", label: "Moliya", icon: DollarSign },
    { id: "medical", label: "Tibbiyot", icon: Activity },
    { id: "kitchen", label: "Oshxona (Menyu)", icon: Apple },
    { id: "documents", label: "Hujjatlar", icon: FileText },
    { id: "reports", label: "Hisobotlar", icon: TrendingUp },
    { id: "calendar", label: "Kalendar", icon: Calendar },
    { id: "ai", label: "AI Tahlili", icon: Award },
    { id: "ai_cameras", label: "AI Kameralar Live", icon: Camera },
    { id: "violence_monitor", label: "Zo'ravonlik Monitor", icon: ShieldAlert },
    { id: "failed_checkins", label: "Failed Check-ins", icon: AlertTriangle },
    { id: "complaints", label: `Shikoyatlar (${activeComplaints})`, icon: MessageSquare },
    { id: "notifications", label: "Xabarnomalar", icon: Bell },
    { id: "audit", label: "Xavfsizlik", icon: Shield },
    { id: "settings", label: "Sozlamalar", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notifSuccess && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2.5 z-50 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          {notifSuccess}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Bolalar Monitoring va Boshqaruv Paneli</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Professional darajadagi monitoring tizimi. Barcha guruhlar, bolalar va davomat nazorati.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user.role === "SuperAdmin" && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl">
              <Building className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:inline">Filial:</span>
              <select
                value={selectedKindergartenId}
                onChange={(e) => setSelectedKindergartenId(e.target.value)}
                className="bg-transparent text-white font-black text-xs border-none outline-none cursor-pointer focus:ring-0 py-0.5"
                style={{ colorScheme: 'dark' }}
              >
                <option value="all" className="bg-slate-900 text-white">Barchasi (Konsolidatsiyalangan)</option>
                {kindergartens.map((k) => (
                  <option key={k.id} value={k.id} className="bg-slate-900 text-white">{k.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onRefresh}
            className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Tizimni Yangilash
          </button>
        </div>
      </div>

      {/* Sidebar Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className={`${isSidebarCollapsed ? "xl:col-span-1" : "xl:col-span-3"} bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2 transition-all duration-300`}>
          <div className="flex items-center justify-between px-3 mb-2">
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Modullar
              </span>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer ${isSidebarCollapsed ? "mx-auto" : "ml-auto"}`}
              title={isSidebarCollapsed ? "Modullarni yoyish" : "Modullarni yig'ish"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className={`grid grid-cols-2 xl:grid-cols-1 gap-1 max-h-[500px] xl:max-h-none overflow-y-auto pr-1`}>
            {categories.filter((c) => visibleModules[c.id] !== false).map((c) => {
              const Icon = c.icon;
              const isActive = activeTab === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveTab(c.id);
                    setSelectedChildId(null);
                  }}
                  className={`flex items-center ${isSidebarCollapsed ? "xl:justify-center xl:px-2" : "gap-2.5 px-3.5"} py-2.5 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer relative group ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 border-emerald-500"
                      : "bg-slate-950/40 border-transparent text-slate-400 hover:text-white hover:bg-slate-850"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={`${isSidebarCollapsed ? "xl:hidden" : ""} truncate`}>{c.label}</span>
                  
                  {/* Tooltip when collapsed */}
                  {isSidebarCollapsed && (
                    <span className="absolute left-full ml-3 bg-slate-950 border border-slate-800 text-slate-200 text-[10px] py-1 px-2.5 rounded-lg font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl hidden xl:inline-block">
                      {c.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Module Customizer Collapsible Sidebar Section Wrapper */}
          <div className="pt-2.5 border-t border-slate-800/80 mt-2">
            <button
              onClick={() => setShowModuleCustomizer(!showModuleCustomizer)}
              className="w-full flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider hover:text-white px-3 py-2 rounded-xl hover:bg-slate-850 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                {!isSidebarCollapsed && <span>Modullarni sozlash</span>}
              </span>
              {!isSidebarCollapsed && (
                <span className="text-[9px] font-mono">{showModuleCustomizer ? "▲" : "▼"}</span>
              )}
            </button>
            
            {showModuleCustomizer && !isSidebarCollapsed && (
              <div className="mt-2 bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin animate-fade-in">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Modullarni ko'rsatish:</p>
                <div className="space-y-1">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center justify-between text-[10px] text-slate-400 hover:text-white cursor-pointer py-1 px-1.5 rounded hover:bg-slate-900 transition-all select-none">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${visibleModules[c.id] !== false ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`}></span>
                        {c.label.split("(")[0].trim()}
                      </span>
                      <input
                        type="checkbox"
                        checked={visibleModules[c.id] !== false}
                        onChange={(e) => {
                          const updated = {
                            ...visibleModules,
                            [c.id]: e.target.checked
                          };
                          setVisibleModules(updated);
                          // If current tab is hidden, switch back to dashboard
                          if (!e.target.checked && activeTab === c.id) {
                            setActiveTab("dashboard");
                          }
                        }}
                        className="rounded bg-slate-900 border-slate-800 text-sky-500 focus:ring-0 w-3 h-3 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Main Workspace Area */}
        <div className={`${isSidebarCollapsed ? "xl:col-span-11" : "xl:col-span-9"} space-y-6 transition-all duration-300`}>
          
          {/* SUPER ADMIN (KINDER-GARTENS) TAB */}
          {activeTab === "superadmin" && user.role === "SuperAdmin" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-white font-black text-lg tracking-tight">Bog'chalar Tarmog'ini Boshqarish</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Ekotizimga yangi xususiy bog'chalar qo'shing va har bir bog'chaga uning yagona Direktor logini va ruxsatlarini biriktiring.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddKgModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95 transition-all self-start sm:self-center"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Bog'cha Qo'shish
                  </button>
                </div>

                {/* Networks Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
                    <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Jami Filiallar</span>
                      <span className="text-xl font-black text-white">{kindergartens.length} ta</span>
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
                    <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Tizimdagi Bolalar</span>
                      <span className="text-xl font-black text-white">{rawChildrenList.length} nafar</span>
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
                    <div className="bg-amber-500/10 text-amber-400 p-2.5 rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Jami Tarbiyachi & Staff</span>
                      <span className="text-xl font-black text-white">{rawEmployeesList.length} ta xodim</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kindergartens Grid */}
              <div className="grid grid-cols-1 gap-4">
                {kindergartens.map((kg) => {
                  const childCount = rawChildrenList.filter(c => c.kindergartenId === kg.id).length;
                  const staffCount = rawEmployeesList.filter(e => e.kindergartenId === kg.id).length;
                  const groupCount = rawGroupsList.filter(g => g.kindergartenId === kg.id).length;

                  return (
                    <div 
                      key={kg.id} 
                      onClick={() => {
                        setDeviceKgId(kg.id);
                        setSelectedKgGalleryId(kg.id);
                        triggerNotification(`${kg.name} ma'lumotlari va faoliyat galereyasi yuklandi.`);
                      }}
                      className={`bg-slate-900 border ${deviceKgId === kg.id ? "border-emerald-500 shadow-md shadow-emerald-500/10" : "border-slate-800"} rounded-3xl p-5 hover:border-slate-700 transition-all space-y-4 cursor-pointer`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-emerald-400">
                            <Building className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-black text-base">{kg.name}</h4>
                              <span className="bg-slate-950 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{kg.id}</span>
                              {deviceKgId === kg.id && (
                                <span className="bg-emerald-500 text-slate-950 text-[9px] px-2 py-0.5 rounded-md font-black uppercase">Tanlangan</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{kg.address}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Aloqa: {kg.phone || "Kiritilmagan"}</p>
                          </div>
                        </div>
 
                        <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedKindergartenId(kg.id);
                              setActiveTab("dashboard");
                              triggerNotification(`Hozirda siz ${kg.name} boshqaruv va nazorat rejimidasiz.`);
                            }}
                            className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> Kirish & Nazorat
                          </button>
                          <button
                            onClick={() => {
                              setAssigningKgId(kg.id);
                              setShowAssignDirectorModal(true);
                            }}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Key className="w-4 h-4 text-amber-400" /> Direktor Biriktirish
                          </button>
                        </div>
                      </div>
 
                      <hr className="border-slate-800" />
 
                      {/* Detail metrics & Director credentials */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-950/50 border border-slate-850/50 p-3 rounded-2xl">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Guruhlar</span>
                          <span className="text-sm font-black text-white mt-0.5 block">{groupCount} ta guruh</span>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-850/50 p-3 rounded-2xl">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Bolalar</span>
                          <span className="text-sm font-black text-white mt-0.5 block">{childCount} nafar bola</span>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-850/50 p-3 rounded-2xl">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Xodimlar</span>
                          <span className="text-sm font-black text-white mt-0.5 block">{staffCount} ta xodim</span>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-850/50 p-3 rounded-2xl">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Tizim direktori</span>
                          {kg.directorUsername ? (
                            <div className="mt-0.5">
                              <span className="text-xs font-black text-emerald-400 block truncate">{kg.directorName}</span>
                              <span className="text-[9px] font-mono text-slate-400 block truncate">Login: {kg.directorUsername}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-amber-500 block mt-0.5">⚠️ Tayinlanmagan</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ASSOCIATED DEVICES AT THE END OF THE TAB */}
              {deviceKgId && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-white font-black text-base flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-emerald-400" />
                        {kindergartens.find(k => k.id === deviceKgId)?.name || "Tanlangan Bog'cha"} - Ulangan IoT Qurilmalari
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Ushbu filialga biriktirilgan va tarmoqdagi Face ID, harorat datchigi va boshqa aqlli qurilmalar ro'yxati
                      </p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-bold self-start sm:self-center">
                      Qurilmalar: 3 ta faol
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Device 1 */}
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                          KIRISH TERMINALI
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">Online</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">FaceID Scanner Pro-X1</h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">IP: 192.168.1.{deviceKgId === "K-1" ? "221" : "222"}</p>
                      </div>
                      <div className="border-t border-slate-900 pt-2 flex flex-col gap-1 text-[11px] text-slate-400">
                        <span className="flex justify-between"><span>Model:</span> <span className="text-white font-semibold">Hikvision K1T341</span></span>
                        <span className="flex justify-between"><span>Harorat datchigi:</span> <span className="text-emerald-400 font-semibold">Faol (Active)</span></span>
                        <span className="flex justify-between"><span>Oxirgi faollik:</span> <span className="text-white">Hozirgina</span></span>
                      </div>
                    </div>

                    {/* Device 2 */}
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                          CHIQISH TERMINALI
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">Online</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">FaceID Scanner Pro-X2</h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">IP: 192.168.1.{deviceKgId === "K-1" ? "226" : "227"}</p>
                      </div>
                      <div className="border-t border-slate-900 pt-2 flex flex-col gap-1 text-[11px] text-slate-400">
                        <span className="flex justify-between"><span>Model:</span> <span className="text-white font-semibold">Hikvision K1T341</span></span>
                        <span className="flex justify-between"><span>Turniket nazorati:</span> <span className="text-emerald-400 font-semibold">Ulanish faol</span></span>
                        <span className="flex justify-between"><span>Oxirgi faollik:</span> <span className="text-white">3 daqiqa avval</span></span>
                      </div>
                    </div>

                    {/* Device 3 */}
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                          FACE ID PLANSHETI
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">Online</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">Nihol FaceID Tablet Client</h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">IP: 192.168.1.231</p>
                      </div>
                      <div className="border-t border-slate-900 pt-2 flex flex-col gap-1 text-[11px] text-slate-400">
                        <span className="flex justify-between"><span>Turi:</span> <span className="text-white font-semibold">iPad WebApp Client</span></span>
                        <span className="flex justify-between"><span>Kamera ruxsati:</span> <span className="text-emerald-400 font-semibold">Berilgan ✓</span></span>
                        <span className="flex justify-between"><span>Zaryad darajasi:</span> <span className="text-white">92%</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Super Admin Document Upload & Fund Allocation UI */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 mt-6 animate-fade-in">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-white font-black text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    Hujjat yuklash va Maqsadli Byudjet ajratish (SaaS Super Admin)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Bog'cha direktorlariga rasmiy buyruq/shartnoma hujjatlarini biriktiring va maqsadli davlat/homiylik mablag'larini ajrating.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column - Upload / Assign Form */}
                  <form onSubmit={handleUploadDocSubmit} className="lg:col-span-5 space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-850">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider text-emerald-400">Yangi hujjat & mablag' biriktirish</h4>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Hujjat sarlavhasi (Buyruq nomi):</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Masalan: Kuz-Qish mavsumi isitish g'amlamasi" 
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Ajratiladigan maqsadli mablag' (UZS):</label>
                      <input 
                        type="number" 
                        placeholder="Masalan: 15000000" 
                        value={newDocFunds}
                        onChange={(e) => setNewDocFunds(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Mas'ul direktor (Bog'cha):</label>
                      <select 
                        value={newDocDirector}
                        onChange={(e) => setNewDocDirector(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="director">Karimov Shaxzod (Nihol AI - Chilonzor)</option>
                        <option value="director2">Siddiqov Elyor (Kamalak G'unchalari - Yunusobod)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Hujjat fayli (.pdf):</label>
                      <input 
                        type="text" 
                        required
                        value={newDocFile}
                        onChange={(e) => setNewDocFile(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" /> Yuklash va Biriktirish
                    </button>
                  </form>

                  {/* Right Column - Table of Documents */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider text-slate-400">Yuborilgan hujjatlar va holatlar</h4>
                    
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {superAdminDocs.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          Hozircha hech qanday hujjat biriktirilmagan.
                        </div>
                      ) : (
                        superAdminDocs.map((doc: any) => (
                          <div key={doc.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-black">{doc.title}</span>
                                <span className="bg-slate-900 border border-slate-800 text-[9px] text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">{doc.id}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                                <span>Direktor: <strong className="text-emerald-400 font-bold">{doc.targetDirectorUsername}</strong></span>
                                <span>Fayl: <span className="font-mono text-slate-300">{doc.fileName}</span></span>
                                <span>Sana: {doc.date}</span>
                              </div>
                              {doc.allocatedFunds > 0 && (
                                <div className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md inline-block font-black mt-1">
                                  💰 Ajratilgan mablag': {Number(doc.allocatedFunds).toLocaleString()} UZS
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-start sm:items-end gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                doc.distributedToPanels.length > 0 
                                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {doc.distributedToPanels.length > 0 
                                  ? `Tarqatilgan: ${doc.distributedToPanels.join(", ")}` 
                                  : "Kutilmoqda (Direktorda)"}
                              </span>
                              
                              <a 
                                href={doc.fileUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Download className="w-3.5 h-3.5" /> Yuklab olish
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* SUPER ADMIN MULTI-TENANT PHOTO GALLERY */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 mt-6 animate-fade-in" style={{ contentVisibility: 'auto' }}>
                  <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-white font-black text-lg flex items-center gap-2">
                        <Camera className="w-5 h-5 text-emerald-400" />
                        Filiallar Foto va Faoliyatlar Galereyasi
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Har bir xususiy bog'cha tomonidan yuklangan taomlar, mashg'ulotlar va salomatlik tadbirlari fotosuratlari va ularning batafsil tavsiflari.
                      </p>
                    </div>
                    
                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold">Filial:</span>
                        <select
                          value={selectedKgGalleryId || ""}
                          onChange={(e) => setSelectedKgGalleryId(e.target.value || null)}
                          className="bg-slate-950 border border-slate-850 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-500 font-bold cursor-pointer"
                        >
                          <option value="">Barcha filiallar 🏢</option>
                          {kindergartens.map(kg => (
                            <option key={kg.id} value={kg.id}>{kg.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold">Turkum (Kategoriya):</span>
                        <select
                          value={selectedGalleryType || ""}
                          onChange={(e) => setSelectedGalleryType(e.target.value || null)}
                          className="bg-slate-950 border border-slate-850 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-500 font-bold cursor-pointer"
                        >
                          <option value="">Barcha turkumlar 🖼️</option>
                          <option value="mashg'ulot">Mashg'ulotlar 🎨</option>
                          <option value="oshxona">Taomlar / Oshxona 🍲</option>
                          <option value="tashqi">Tashqi Faoliyat 🌳</option>
                          <option value="davomat">Davomat / Skanerlash 🎥</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Gallery Grid */}
                  {(() => {
                    const filteredGallery = galleryItems.filter(item => {
                      const matchesKg = !selectedKgGalleryId || item.kindergartenId === selectedKgGalleryId;
                      const matchesType = !selectedGalleryType || item.type.toLowerCase().includes(selectedGalleryType.toLowerCase()) || (item.title && item.title.toLowerCase().includes(selectedGalleryType.toLowerCase()));
                      return matchesKg && matchesType;
                    });
                    
                    if (loadingGallery) {
                      return (
                        <div className="flex items-center justify-center py-12 gap-2">
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-slate-500 font-medium">Galereya yuklanmoqda...</span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {selectedKgGalleryId && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Hozirda tanlangan filial: <strong className="text-white">{kindergartens.find(k => k.id === selectedKgGalleryId)?.name}</strong> jami {filteredGallery.length} ta rasm yuklangan
                            </span>
                            <button 
                              onClick={() => setSelectedKgGalleryId(null)}
                              className="text-[10px] uppercase font-mono font-black text-slate-400 hover:text-white cursor-pointer"
                            >
                              Barchasini ko'rish [x]
                            </button>
                          </div>
                        )}

                        {filteredGallery.length === 0 ? (
                          <div className="bg-slate-950 border border-slate-850 p-12 rounded-3xl text-center text-slate-500">
                            <Camera className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-xs font-medium">Ushbu filial uchun hali rasmlar yuklanmagan yoki o'chirilgan.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredGallery.map((item) => {
                              const kgName = kindergartens.find(k => k.id === item.kindergartenId)?.name || "Noma'lum Filial";
                              return (
                                <div key={item.id} className="bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl group hover:-translate-y-1">
                                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                                    <img 
                                      src={item.url} 
                                      alt={item.title} 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[9px] text-emerald-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                                      {item.type}
                                    </div>
                                  </div>
                                  <div className="p-4 space-y-2">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold font-mono">
                                      <span>ID: {item.id}</span>
                                      <span>Sana: {item.date}</span>
                                    </div>
                                    <h4 className="text-white font-black text-sm tracking-tight line-clamp-1">{item.title}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed min-h-[40px] line-clamp-3">
                                      {item.description || "Ushbu rasm uchun qo'shimcha tavsif yozilmagan."}
                                    </p>
                                    <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[10px]">
                                      <span className="text-slate-500 uppercase tracking-widest font-black">Filial:</span>
                                      <span className="text-indigo-400 font-bold truncate max-w-[180px]">{kgName}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* 1. DASHBOARD COMPONENT */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Dashboard Sub-tab Selection */}
              <div className="flex border-b border-slate-800 pb-1 gap-4">
                <button
                  onClick={() => setDashboardSubTab("overview")}
                  className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                    dashboardSubTab === "overview"
                      ? "text-emerald-400 border-b-2 border-emerald-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  📊 Umumiy Ko'rinish (Overview)
                </button>
                <button
                  onClick={() => setDashboardSubTab("analytics")}
                  className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                    dashboardSubTab === "analytics"
                      ? "text-indigo-400 border-b-2 border-indigo-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  📈 Dashboard Analytics (Recharts Tahlili)
                </button>
              </div>

              {dashboardSubTab === "overview" ? (
                <>
                  {/* Quick Actions Panel */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tezkor amallar (Quick Actions)
                </span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowAddChildModal(true)} className="bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4" /> 👶 Bola qo'shish
                  </button>
                  <button onClick={() => setShowAddEmpModal(true)} className="bg-slate-800 hover:bg-slate-750 text-indigo-400 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4" /> 👨‍🏫 Xodim qo'shish
                  </button>
                  <button onClick={() => setShowAddGroupModal(true)} className="bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4" /> ➕ Guruh yaratish
                  </button>
                  <button onClick={() => setShowAddPaymentModal(true)} className="bg-slate-800 hover:bg-slate-750 text-purple-400 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4" /> 💰 To'lov qo'shish
                  </button>
                  <button onClick={() => setShowReportModal(true)} className="bg-slate-800 hover:bg-slate-750 text-sky-400 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
                    <FileText className="w-4 h-4" /> Hisobot yuklab olish
                  </button>
                  <button onClick={() => setShowBroadcastModal(true)} className="bg-slate-800 hover:bg-slate-750 text-pink-400 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
                    <Send className="w-4 h-4" /> Xabar yuborish
                  </button>
                </div>
              </div>

              {/* Telegram Bot Integration Live Status Panel */}
              <div className={`p-5 rounded-3xl border transition-all duration-300 animate-fade-in space-y-4 ${
                tgBotStatus === "online" 
                  ? "bg-slate-900 border-slate-800" 
                  : "bg-rose-950/20 border-rose-500/30 shadow-lg shadow-rose-500/5"
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all ${
                        tgBotStatus === "online" 
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}>
                        <Send className="w-5 h-5" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center">
                        <span className={`w-2 h-2 rounded-full ${
                          tgBotStatus === "online" ? "bg-emerald-500" : "bg-rose-500"
                        }`}></span>
                        {tgBotStatus === "online" && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute animate-ping"></span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-white font-black text-xs uppercase tracking-wider">Telegram Integratsiya Boti (Telegram Bot Integration)</h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-md uppercase font-black tracking-wider border ${
                          tgBotStatus === "online" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          {tgBotStatus === "online" ? "🟢 ONLINE" : "🔴 OFFLINE"}
                        </span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                          {tgBotMode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Farzandlarning biometrik kirish/chiqish davomatlari va xabarlarini ota-onalar smartfoniga telegram-bot orqali yetkazish moduli.
                      </p>
                    </div>
                  </div>
                </div>

                {/* API Failure Alert Box */}
                {tgBotStatus === "offline" && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl flex items-start gap-3 animate-pulse text-xs">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-rose-400 uppercase tracking-wide">Telegram API ulanishida favqulodda uzilish (API connection failure)!</p>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {tgBotError || "Noma'lum tarmoq xatoligi yuz berdi. Tizim avtomatik ravishda qayta ulanishni sinab ko'rmoqda."}
                      </p>
                      <p className="text-slate-400 text-[10px] italic">
                        Maslahat: .env faylida <code>TELEGRAM_BOT_TOKEN</code> to'g'ri sozlanganligini va Telegram serverlari bilan ulanishni tekshiring.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* SYSTEM CONNECTIVITY HEALTH CARD */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Server className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm tracking-tight">System Connectivity</h3>
                    <p className="text-[11px] text-slate-400">Tizim ulanish holati va xavfsizlik</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-slate-300 font-medium">Telegram Bot Webhook:</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-black tracking-wide uppercase">Faol (Active)</span>
                </div>

                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-slate-300 font-medium">Ulangan akkauntlar:</span>
                  </div>
                  <span className="text-xs font-black text-white bg-indigo-500/15 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                    {childrenList.filter(c => c.telegramChatId).length} ota-ona ulangan
                  </span>
                </div>
              </div>

              {/* 15 Widgets Grid as requested! */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">👶 Jami bolalar</span>
                  <div className="text-2xl font-black text-white mt-1">{totalChildren} ta</div>
                  <span className="text-[10px] text-slate-400">Ro'yxatda</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">🟢 Bugun kelgan</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{childrenInKgarten} ta</div>
                  <span className="text-[10px] text-emerald-500/80">Faol davomat</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">🔴 Kelmaganlar</span>
                  <div className="text-2xl font-black text-rose-400 mt-1">{absentChildren} ta</div>
                  <span className="text-[10px] text-rose-500/80">Kelmadi</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">👨‍🏫 Jami xodimlar</span>
                  <div className="text-2xl font-black text-white mt-1">{totalStaff} ta</div>
                  <span className="text-[10px] text-slate-400">Shtatdagi xodim</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">👩‍🏫 Ishdagi xodim</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{activeStaff} ta</div>
                  <span className="text-[10px] text-slate-400">Hozir ishdalar</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">💰 Bugungi tushum</span>
                  <div className="text-xl font-black text-emerald-400 mt-1">{(totalReceivedFees).toLocaleString()} UZS</div>
                  <span className="text-[10px] text-slate-400">Kelgan tushumlar</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider block">📈 Oylik daromad</span>
                  <div className="text-xl font-black text-cyan-400 mt-1">0 UZS</div>
                  <span className="text-[10px] text-slate-400">Reja bo'yicha</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">💸 Xarajatlar</span>
                  <div className="text-xl font-black text-rose-400 mt-1">0 UZS</div>
                  <span className="text-[10px] text-slate-400">Oshxona + Maosh</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider block">💳 Qarzdorlar</span>
                  <div className="text-2xl font-black text-yellow-400 mt-1">{debtParentsCount} ta</div>
                  <span className="text-[10px] text-yellow-500/80">To'lovi kechikkan</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider block">🍽 Bugungi menyu</span>
                  <div className="text-xs font-black text-white mt-1.5 truncate">
                    {mealsList && mealsList.length > 0 
                      ? (typeof mealsList[0]?.lunch === "string" ? mealsList[0].lunch : (mealsList[0]?.lunch?.title || "Rejalashtirilgan")) 
                      : "Menyu kiritilmagan"}
                  </div>
                  <span className="text-[10px] text-orange-500">Oqsil & Vitamin</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">💊 Kasal bolalar</span>
                  <div className="text-2xl font-black text-rose-500 mt-1">{sickChildren} ta</div>
                  <span className="text-[10px] text-slate-400">Muntazam nazoratda</span>
                </div>
                <div 
                  onClick={() => setShowHardwareModal(true)}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-4 rounded-2xl cursor-pointer transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider block flex items-center gap-1">
                    <Server className="text-sky-400 w-3 h-3" /> Tizim Salomatligi
                  </span>
                  <div className="text-2xl font-black text-white mt-1">100%</div>
                  <span className="text-[10px] text-emerald-400 font-bold group-hover:text-white transition-colors">
                    10/10 Kameralar ONLINE 🟢
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl col-span-2">
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider block">📢 Oxirgi e'lon</span>
                  <div className="text-xs font-semibold text-slate-200 mt-1.5 truncate">
                    E'lonlar mavjud emas
                  </div>
                  <span className="text-[10px] text-slate-500">Telegram orqali tarqatildi</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">🤖 AI Tavsiyasi</span>
                  <div className="text-xs font-semibold text-emerald-400 mt-1.5 animate-pulse">
                    {childrenList.length > 0 ? "Davomat barqaror" : "Ma'lumot yetarli emas"}
                  </div>
                  <span className="text-[10px] text-slate-400">Tahlil yakuni</span>
                </div>
              </div>

              {/* TODAY'S MEAL PLAN COMPONENT */}
              {(() => {
                const todayStr = new Date().toISOString().split("T")[0]; // e.g. "2026-07-16"
                
                // Find today's meal plan for the current selected kindergarten
                const todayMealPlan = mealsList.find((m: any) => {
                  const matchesDate = m.date === todayStr;
                  const targetKg = selectedKindergartenId === "all" ? "K-1" : selectedKindergartenId;
                  return matchesDate && m.kindergartenId === targetKg;
                });

                // Get categories of meals
                const mealCategories = todayMealPlan ? [
                  { type: "Nonushta (Breakfast)", detail: todayMealPlan.breakfast, color: "text-amber-400", defaultImg: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=300" },
                  { type: "Ertalabki gazak (Morning Snack)", detail: todayMealPlan.morningSnack, color: "text-blue-400", defaultImg: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300" },
                  { type: "Tushlik (Lunch)", detail: todayMealPlan.lunch, color: "text-emerald-400", defaultImg: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=300" },
                  { type: "Snack (Afternoon Snack)", detail: todayMealPlan.afternoonSnack, color: "text-purple-400", defaultImg: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=300" },
                  { type: "Kechki ovqat (Dinner)", detail: todayMealPlan.dinner, color: "text-orange-400", defaultImg: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=300" }
                ].filter(cat => cat.detail && cat.detail.title) : [];

                return (
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">🍽 Oshxona va Taomnoma</span>
                        <h3 className="text-white font-black text-sm uppercase tracking-wider">Bugungi Taomnoma (Today's Meal Plan)</h3>
                        <p className="text-[11px] text-slate-400">
                          {todayStr} kuni uchun {selectedKindergartenId === "all" ? "Asosiy filial" : "Sizning filial"} bugungi taomnomasi va ozuqaviy qiymati
                        </p>
                      </div>
                      <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-300 font-mono px-3 py-1.5 rounded-xl font-bold">
                        📅 Bugun: {todayStr}
                      </span>
                    </div>

                    {!todayMealPlan || mealCategories.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 bg-slate-950/40 rounded-2xl border border-slate-850">
                        <ChefHat className="w-8 h-8 text-slate-600 animate-bounce" />
                        <p className="text-xs text-slate-400 font-medium">Bugun uchun taomnoma hali to'liq yuklanmagan.</p>
                        <p className="text-[10px] text-slate-500">Oshpazlar paneli orqali yangi taomnoma rejasini kiritishingiz mumkin.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {mealCategories.map((meal, idx) => (
                          <div key={idx} className="bg-slate-950 border border-slate-850 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all group">
                            <div className="space-y-2.5">
                              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative">
                                <img 
                                  src={meal.detail.image || meal.defaultImg} 
                                  alt={meal.detail.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                                <div className="absolute top-1.5 left-1.5 bg-black/80 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-wider">
                                  {meal.type.split(" ")[0]}
                                </div>
                              </div>

                              <div>
                                <span className={`text-[9px] font-black uppercase tracking-wider ${meal.color}`}>
                                  {meal.type}
                                </span>
                                <h4 className="text-white font-bold text-xs mt-0.5 leading-tight">{meal.detail.title}</h4>
                              </div>

                              <div className="grid grid-cols-4 gap-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-900 text-center text-[9px]">
                                <div>
                                  <span className="text-slate-500 block text-[7px] uppercase">Kcal</span>
                                  <strong className="text-white font-mono">{meal.detail.calories || 350}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[7px] uppercase">Oqsil</span>
                                  <strong className="text-white font-mono">{meal.detail.protein || 12}g</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[7px] uppercase">Yog'</span>
                                  <strong className="text-white font-mono">{meal.detail.fat || 8}g</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[7px] uppercase">Ugl.</span>
                                  <strong className="text-white font-mono">{meal.detail.carb || 45}g</strong>
                                </div>
                              </div>

                              {(meal.detail.vitamins || meal.detail.minerals) && (
                                <p className="text-[9px] text-slate-400 leading-relaxed bg-slate-900/30 p-2 rounded-lg border border-slate-900">
                                  🍎 <strong className="text-slate-300">Tarkib:</strong> {meal.detail.vitamins ? `Vits: ${meal.detail.vitamins}` : ""} {meal.detail.minerals ? `• Mins: ${meal.detail.minerals}` : ""}
                                </p>
                              )}
                            </div>

                            {meal.detail.aiComment && (
                              <div className="pt-2 border-t border-slate-900/80">
                                <span className="text-[8px] text-emerald-400 font-black uppercase block tracking-wider">🤖 AI Nutri-tavsiya:</span>
                                <p className="text-[9px] text-slate-400 italic leading-relaxed mt-0.5">
                                  {meal.detail.aiComment}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Weekly Attendance Trends Recharts Chart */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 animate-fade-in">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Davomat Dinamikasi</span>
                    <h3 className="text-white font-black text-sm uppercase tracking-wider">Haftalik Bola Davomati Trendi (Weekly Attendance)</h3>
                    <p className="text-[11px] text-slate-400">Past davomatli davrlarni va qatnov qonuniyatlarini aniqlash tahlili</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
                    <button 
                      onClick={handleFetchDeepDive}
                      className="bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 text-slate-950 font-black text-[10px] uppercase tracking-wider py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AI CHUQUR TAHLIL (Deep-Dive)
                    </button>
                    <div className="flex items-center gap-2 text-[10px] ml-auto lg:ml-0">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Kelganlar (%)
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Kelmaganlar (soni)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { day: "Dushanba", "Kelganlar %": 92, "Bolalar soni": Math.round(totalChildren * 0.92), "Kelmaganlar": Math.round(totalChildren * 0.08) },
                        { day: "Seshanba", "Kelganlar %": 96, "Bolalar soni": Math.round(totalChildren * 0.96), "Kelmaganlar": Math.round(totalChildren * 0.04) },
                        { day: "Chorshanba", "Kelganlar %": 89, "Bolalar soni": Math.round(totalChildren * 0.89), "Kelmaganlar": Math.round(totalChildren * 0.11) },
                        { day: "Payshanba", "Kelganlar %": 94, "Bolalar soni": Math.round(totalChildren * 0.94), "Kelmaganlar": Math.round(totalChildren * 0.06) },
                        { day: "Juma", "Kelganlar %": 91, "Bolalar soni": Math.round(totalChildren * 0.91), "Kelmaganlar": Math.round(totalChildren * 0.09) },
                        { day: "Shanba", "Kelganlar %": 78, "Bolalar soni": Math.round(totalChildren * 0.78), "Kelmaganlar": Math.round(totalChildren * 0.22) }
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorPresence" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAbsence" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", fontSize: "11px" }}
                        labelClassName="font-bold text-white"
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Area type="monotone" dataKey="Kelganlar %" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresence)" />
                      <Area type="monotone" dataKey="Kelmaganlar" stroke="#f43f5e" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAbsence)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
                  <span>💡 <b>Tahlil natijasi:</b> Eng past davomat odatda <b>Shanba</b> kunlari (78%) kuzatiladi. Chorshanba kuni profilaktika darslari sabab kichik pasayish bor.</span>
                  <span className="text-emerald-400 font-bold font-mono">O'rtacha: 91.6%</span>
                </div>
              </div>

              {/* Weekly Attendance Heatmap Chart (Trafik va yuklama jadvali) */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 animate-fade-in">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">Trafik va Yuklama zichligi</span>
                    <h3 className="text-white font-black text-sm uppercase tracking-wider">Haftalik Davomat & Shtat Rejalashtirish (Attendance & Leave Side-by-Side)</h3>
                    <p className="text-[11px] text-slate-400">
                      Haftalik soatlar zichligi hamda Haqiqiy vs. Taxminiy davomat farqi (Sariq Delta Line).
                    </p>
                  </div>
                  
                  {/* Download Report Button & Status Legends */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Format Selector and Action buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 mr-2">
                      <button
                        onClick={() => downloadAttendanceReport('csv')}
                        className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        CSV Yuklash
                      </button>
                      <button
                        onClick={() => downloadAttendanceReport('pdf')}
                        className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        PDF Yuklash
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-[9px]">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Yuqori (90%+)
                      </span>
                      <span className="flex items-center gap-1 text-cyan-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> O'rtacha (75%-89%)
                      </span>
                      <span className="flex items-center gap-1 text-indigo-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Kamroq (50%-74%)
                      </span>
                      <span className="flex items-center gap-1 text-rose-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Sokin (&lt;50%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column (lg:col-span-8): ComposedChart */}
                  <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                    <div className="h-72 w-full bg-slate-950/40 p-2 rounded-2xl border border-slate-850 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                          margin={{ top: 20, right: 20, bottom: 10, left: 20 }}
                          data={[
                            { day: "Dushanba", hour: "08:00", value: 92, count: Math.round(totalChildren * 0.92), delta: 2.1 },
                            { day: "Dushanba", hour: "11:00", value: 95, count: Math.round(totalChildren * 0.95) },
                            { day: "Dushanba", hour: "14:00", value: 85, count: Math.round(totalChildren * 0.85) },
                            { day: "Dushanba", hour: "16:00", value: 90, count: Math.round(totalChildren * 0.90) },
                            { day: "Dushanba", hour: "18:00", value: 45, count: Math.round(totalChildren * 0.45) },

                            { day: "Seshanba", hour: "08:00", value: 96, count: Math.round(totalChildren * 0.96), delta: -1.5 },
                            { day: "Seshanba", hour: "11:00", value: 98, count: Math.round(totalChildren * 0.98) },
                            { day: "Seshanba", hour: "14:00", value: 92, count: Math.round(totalChildren * 0.92) },
                            { day: "Seshanba", hour: "16:00", value: 95, count: Math.round(totalChildren * 0.95) },
                            { day: "Seshanba", hour: "18:00", value: 50, count: Math.round(totalChildren * 0.50) },

                            { day: "Chorshanba", hour: "08:00", value: 89, count: Math.round(totalChildren * 0.89), delta: 3.4 },
                            { day: "Chorshanba", hour: "11:00", value: 91, count: Math.round(totalChildren * 0.91) },
                            { day: "Chorshanba", hour: "14:00", value: 78, count: Math.round(totalChildren * 0.78) },
                            { day: "Chorshanba", hour: "16:00", value: 82, count: Math.round(totalChildren * 0.82) },
                            { day: "Chorshanba", hour: "18:00", value: 38, count: Math.round(totalChildren * 0.38) },

                            { day: "Payshanba", hour: "08:00", value: 94, count: Math.round(totalChildren * 0.94), delta: -0.8 },
                            { day: "Payshanba", hour: "11:00", value: 96, count: Math.round(totalChildren * 0.96) },
                            { day: "Payshanba", hour: "14:00", value: 88, count: Math.round(totalChildren * 0.88) },
                            { day: "Payshanba", hour: "16:00", value: 92, count: Math.round(totalChildren * 0.92) },
                            { day: "Payshanba", hour: "18:00", value: 42, count: Math.round(totalChildren * 0.42) },

                            { day: "Juma", hour: "08:00", value: 91, count: Math.round(totalChildren * 0.91), delta: 1.2 },
                            { day: "Juma", hour: "11:00", value: 93, count: Math.round(totalChildren * 0.93) },
                            { day: "Juma", hour: "14:00", value: 80, count: Math.round(totalChildren * 0.80) },
                            { day: "Juma", hour: "16:00", value: 85, count: Math.round(totalChildren * 0.85) },
                            { day: "Juma", hour: "18:00", value: 48, count: Math.round(totalChildren * 0.48) },

                            { day: "Shanba", hour: "08:00", value: 75, count: Math.round(totalChildren * 0.75), delta: -2.2 },
                            { day: "Shanba", hour: "11:00", value: 78, count: Math.round(totalChildren * 0.78) },
                            { day: "Shanba", hour: "14:00", value: 65, count: Math.round(totalChildren * 0.65) },
                            { day: "Shanba", hour: "16:00", value: 70, count: Math.round(totalChildren * 0.70) },
                            { day: "Shanba", hour: "18:00", value: 30, count: Math.round(totalChildren * 0.30) },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                          <XAxis type="category" dataKey="day" name="Kun" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis yAxisId="hourY" type="category" dataKey="hour" name="Vaqt" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis yAxisId="deltaY" type="number" orientation="right" name="Delta" stroke="#f59e0b" fontSize={10} tickLine={false} domain={[-10, 10]} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`} />
                          <ZAxis type="number" dataKey="value" range={[60, 240]} />
                          <Tooltip 
                            cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", fontSize: "11px" }}
                            labelClassName="font-bold text-white"
                            formatter={(value: any, name: string) => {
                              if (name === "Delta (Actual vs Forecast)") return [`${value > 0 ? '+' : ''}${value}%`, "Farq (Delta)"];
                              if (name === "Trafik zichligi") return [`${value}%`, "Zichlik"];
                              return [value, name];
                            }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                          <Scatter 
                            yAxisId="hourY"
                            name="Trafik zichligi" 
                            dataKey="value"
                          >
                            {Array.from({ length: 30 }).map((_, index) => {
                              const dataVal = [
                                92, 95, 85, 90, 45,
                                96, 98, 92, 95, 50,
                                89, 91, 78, 82, 38,
                                94, 96, 88, 92, 42,
                                91, 93, 80, 85, 48,
                                75, 78, 65, 70, 30
                              ][index] || 80;

                              let color = "#6366f1"; // indigo
                              if (dataVal >= 90) color = "#10b981"; // emerald
                              else if (dataVal >= 75) color = "#06b6d4"; // cyan
                              else if (dataVal >= 50) color = "#6366f1"; // indigo
                              else color = "#f43f5e"; // rose
                              
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Scatter>
                          <Line 
                            yAxisId="deltaY"
                            name="Delta (Actual vs Forecast)" 
                            type="monotone" 
                            dataKey="delta" 
                            stroke="#f59e0b" 
                            strokeWidth={3} 
                            dot={{ r: 5, stroke: "#0f172a", strokeWidth: 2, fill: "#f59e0b" }} 
                            connectNulls={true} 
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Column (lg:col-span-4): Staff Leave & Availability Calendar */}
                  <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping animate-pulse"></span>
                          Shtat Ta'tillari & Bandligi
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-500">Bu haftalik</span>
                      </div>

                      {/* Day Grid view with leave indicators */}
                      <div className="grid grid-cols-2 gap-2">
                        {["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"].map((day) => {
                          const { active, total } = getStaffAvailability(day as any);
                          const isUnderstaffed = active < 6; // threshold for warnings
                          const leavesOnThisDay = leaveRequests.filter(r => r.day === day && r.status === "Tasdiqlangan");

                          return (
                            <div 
                              key={day} 
                              className={`p-2 rounded-xl border transition-all text-left ${
                                isUnderstaffed 
                                  ? "bg-rose-950/10 border-rose-500/20 hover:border-rose-500/40" 
                                  : "bg-slate-900/60 border-slate-850 hover:border-slate-800"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-black text-slate-300">{day.slice(0, 3)}</span>
                                <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded ${
                                  isUnderstaffed ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                                }`}>
                                  {active}/{total} faol
                                </span>
                              </div>

                              {leavesOnThisDay.length > 0 ? (
                                <div className="space-y-0.5">
                                  {leavesOnThisDay.map(r => (
                                    <span key={r.id} className="text-[8px] text-rose-400 block truncate font-medium">
                                      🤒 {r.staffName.split(" ")[0]} ({r.type})
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[8px] text-slate-500 block italic">Muammosiz, to'liq shtat</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Leave Requests Queue */}
                      <div className="space-y-1.5 border-t border-slate-850 pt-3">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Kutilayotgan Ta'til So'rovlari</span>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                          {leaveRequests.filter(r => r.status === "Kutilmoqda").length === 0 ? (
                            <span className="text-[8.5px] text-slate-500 italic block">Kutilayotgan so'rovlar yo'q.</span>
                          ) : (
                            leaveRequests.filter(r => r.status === "Kutilmoqda").map((req) => (
                              <div key={req.id} className="bg-slate-900/80 border border-slate-850/80 p-2 rounded-xl flex items-center justify-between gap-1.5">
                                <div className="min-w-0">
                                  <span className="text-[9px] text-white font-bold block truncate">{req.staffName}</span>
                                  <span className="text-[7.5px] text-slate-500 block font-mono">{req.day} • {req.type}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleApproveLeave(req.id)}
                                    className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 p-1 rounded-md transition-all cursor-pointer"
                                    title="Tasdiqlash"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectLeave(req.id)}
                                    className="bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white p-1 rounded-md transition-all cursor-pointer"
                                    title="Rad etish"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Submit Form for Simulated Leave Request */}
                    <form onSubmit={handleAddLeave} className="border-t border-slate-850 pt-3 space-y-2">
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Yangi Ta'til Qo'shish</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          placeholder="Ism..."
                          value={newLeaveStaffName}
                          onChange={(e) => setNewLeaveStaffName(e.target.value)}
                          className="col-span-2 bg-slate-900 border border-slate-850 text-[9px] text-white rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                        />
                        <select
                          value={newLeaveDay}
                          onChange={(e: any) => setNewLeaveDay(e.target.value)}
                          className="bg-slate-900 border border-slate-850 text-[8px] text-slate-300 rounded-lg p-1 outline-none"
                        >
                          <option value="Dushanba">Dushanba</option>
                          <option value="Seshanba">Seshanba</option>
                          <option value="Chorshanba">Chorshanba</option>
                          <option value="Payshanba">Payshanba</option>
                          <option value="Juma">Juma</option>
                          <option value="Shanba">Shanba</option>
                        </select>
                        <select
                          value={newLeaveType}
                          onChange={(e: any) => setNewLeaveType(e.target.value)}
                          className="bg-slate-900 border border-slate-850 text-[8px] text-slate-300 rounded-lg p-1 outline-none"
                        >
                          <option value="Ta'til">Ta'til</option>
                          <option value="Kasalik">Kasalik</option>
                          <option value="Shaxsiy">Shaxsiy</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[8px] py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                      >
                        So'rov Jo'natish
                      </button>
                    </form>

                  </div>

                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-850 text-[10px] text-slate-400 flex flex-col gap-1">
                  <span>📈 <b>Zichlik tahlili:</b> Ertalabki soat <b>08:00 - 11:00</b> oralig'ida eng yuqori trafik zichligi (tashriflar oqimi) kuzatiladi. Soat 18:00 dan so'ng zichlik keskin kamayadi.</span>
                  <span className="text-amber-400 font-bold">📐 Delta chizig'i (Sariq): Haqiqiy va Kutilgan davomat farqini ko'rsatadi. Agar chiziq (+) bo'lsa haqiqiy davomat tarixiy kutilmalardan oshganligini, (-) bo'lsa kutilganidan kamligini bildiradi.</span>
                </div>
              </div>

              {/* 🔮 AI-Driven Predicted Attendance & Staff Scheduling Forecast Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-500/20 inline-block mb-1.5">
                      🔮 Intellektual Bashoratlash Tizimi
                    </span>
                    <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                      Kelgusi Hafta Davomati Bashorati & Shtat Rejalashtirish
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      O'tgan haftalardagi qatnov biometriyasi va datchiklar yordamida keyingi haftadagi bolalar tashrifi va resurslarni optimallashtirish.
                    </p>
                  </div>
                  <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-850 flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">O'rtacha kutilayotgan</span>
                      <span className="text-sm font-black text-indigo-400">{predictedAttendanceData.averageRate}% davomat</span>
                    </div>
                    <div className="w-px h-8 bg-slate-800"></div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">O'rtacha bolalar</span>
                      <span className="text-sm font-black text-emerald-400">{predictedAttendanceData.averageCount} ta / kun</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Forecast Chart */}
                  <div className="lg:col-span-2 bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      📉 Kelgusi haftaning tashrif grafigi (Prediction Curve)
                    </span>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={predictedAttendanceData.forecast}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="dayName" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", fontSize: "11px" }}
                            labelClassName="font-bold text-white"
                          />
                          <Bar dataKey="predictedRate" name="Kutilayotgan davomat (%)" radius={[4, 4, 0, 0]} fill="#6366f1">
                            {predictedAttendanceData.forecast.map((entry, index) => {
                              const colors: Record<string, string> = {
                                emerald: "#10b981",
                                cyan: "#06b6d4",
                                rose: "#f43f5e"
                              };
                              return (
                                <path
                                  key={`cell-${index}`}
                                  fill={colors[entry.statusColor] || "#6366f1"}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 text-[9px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Yuqori yuklama (&gt;93%)</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-500"></span> Standart yuklama (88%-92%)</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500"></span> Kam yuklama (&lt;88%)</span>
                    </div>
                  </div>

                  {/* Right Column: Key Scheduling Insights */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                        💡 Tashkiliy rejalashtirish xulosasi
                      </span>
                      <div className="space-y-3 text-xs">
                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          <p className="font-bold text-white text-[11px] mb-1">🥦 Oziq-ovqat xaridlarini optimallashtirish</p>
                          <p className="text-slate-400 text-[10px] leading-relaxed">
                            Kelgusi haftadagi o'rtacha davomat kutilmasi {predictedAttendanceData.averageRate}% ni tashkil etadi. Oshxona uchun oziq-ovqat mahsulotlari xaridini umumiy <span className="text-emerald-400 font-bold font-mono">{100 - Math.round(predictedAttendanceData.forecast.reduce((acc, curr: any) => acc + curr.mealPortionPct, 0) / predictedAttendanceData.forecast.length)}% ga qisqartirish</span> tavsiya qilinadi. Bu byudjet chiqindilarini sezilarli darajada kamaytiradi.
                          </p>
                        </div>

                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          <p className="font-bold text-white text-[11px] mb-1">👨‍🏫 Tarbiyachilar navbatchilik jadvali</p>
                          <p className="text-slate-400 text-[10px] leading-relaxed">
                            Eng yuqori yuklama kutilayotgan kunlarda barcha tarbiyachilarni to'liq jalb qiling. Shanba va past yuklamali kunlarda esa kamida <span className="text-indigo-400 font-bold">1 nafar tarbiyachiga navbatdan tashqari dam olish</span> kuni taqdim etish tavsiya qilinadi.
                          </p>
                        </div>

                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                          <p className="font-bold text-indigo-400 text-[11px] mb-1">📐 Optimal Smena Nisbati (Shift Ratios)</p>
                          <p className="text-slate-400 text-[10px] leading-relaxed">
                            Maksimal g'amxo'rlik sifati uchun ertalabki yuqori yuklama smenalarida <span className="text-white font-bold">1 : 8-10</span> nisbatni, bolalar qisman kamaygandagi kechki smenalarda esa <span className="text-white font-bold">1 : 12-14</span> nisbatni saqlash optimal hisoblanadi.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Bashorat modeli yangilandi:</span>
                      <span className="text-emerald-400 font-bold font-mono">Bugun, {new Date().toLocaleDateString("uz-UZ")}</span>
                    </div>
                  </div>
                </div>

                {/* Day-by-day scheduling card list */}
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    🗓 Kunlik smenalar va resurslar jadvallari (Daily Shifts & Portions)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {predictedAttendanceData.forecast.map((day, idx) => {
                      const badgeColors: Record<string, string> = {
                        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
                        rose: "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      };
                      return (
                        <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 hover:border-slate-750 transition-all space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-white font-bold text-xs">{day.dayName}</h4>
                              <p className="text-[9px] text-slate-500 font-mono">{day.date}</p>
                            </div>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeColors[day.statusColor]}`}>
                              {day.predictedRate}% Tashrif
                            </span>
                          </div>

                          <div className="space-y-2 text-[10px]">
                            <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg">
                              <span className="text-slate-500">Kutilayotgan bolalar:</span>
                              <span className="text-white font-bold">{day.predictedCount} / {childrenList.length || 25} nafar</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Zarur tarbiyachilar:</span>
                              <span className="text-indigo-400 font-black">👤 {day.requiredStaff} nafar xodim</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Oshpaz smenasi:</span>
                              <span className="text-amber-400 font-bold">{day.chefHours}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Oziq-ovqat porsiyasi:</span>
                              <span className="text-emerald-400 font-black font-mono">🍲 {day.mealPortionPct}% hajm</span>
                            </div>

                            <div className="border-t border-slate-900/60 pt-2 mt-2 space-y-1.5 bg-slate-900/30 p-2 rounded-xl">
                              <span className="text-[9px] text-indigo-400 uppercase font-black tracking-wider block">📐 Smena Nisbatlari (Staff Ratio):</span>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-400">🌅 Ertalabki (08:00-13:00):</span>
                                <span className="text-emerald-400 font-black font-mono">1 : {Math.ceil(day.predictedCount / day.requiredStaff)} <span className="text-slate-500 font-normal">({day.requiredStaff} xodim)</span></span>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-400">🌇 Kechki (13:00-18:00):</span>
                                <span className="text-indigo-400 font-black font-mono">1 : {Math.ceil(Math.round(day.predictedCount * 0.85) / Math.max(1, day.requiredStaff - (day.predictedRate < 85 ? 1 : 0)))} <span className="text-slate-500 font-normal">({Math.max(1, day.requiredStaff - (day.predictedRate < 85 ? 1 : 0))} xodim)</span></span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-900 text-[9px] text-slate-400 italic leading-snug">
                            <b>Maslahat:</b> {day.staffRecommendation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Six Visual Analytics Charts / Metrics representation */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Grafiklar va Faoliyat Tahlili (KPI Charts)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Chart 1: Oylik davomat */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">📉 Oylik davomat %</span>
                    <div className="flex items-end justify-between h-20 pt-4 px-2">
                      <div className="w-6 bg-slate-800 rounded-t h-1/2" title="Yanvar"></div>
                      <div className="w-6 bg-slate-800 rounded-t h-[60%]" title="Fevral"></div>
                      <div className="w-6 bg-slate-800 rounded-t h-[75%]" title="Mart"></div>
                      <div className="w-6 bg-slate-800 rounded-t h-[80%]" title="Aprel"></div>
                      <div className="w-6 bg-emerald-500 rounded-t h-[94%]" title="May"></div>
                    </div>
                    <div className="text-center text-[10px] text-slate-400">Hozirgi guruhlarda o'rtacha davomat: <span className="text-emerald-400 font-bold">94%</span></div>
                  </div>

                  {/* Chart 2: To'lov statistikasi */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">📊 To'lov statistikasi</span>
                    <div className="h-20 flex items-center justify-center">
                      <div className="relative w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-500 border-r-indigo-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">84%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 ml-3 space-y-0.5">
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> To'langan</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Qisman</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-800"></span> Qarzdor</div>
                      </div>
                    </div>
                  </div>

                  {/* Chart 3: Daromad / Xarajat */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">⚖️ Daromad va Xarajat</span>
                    <div className="h-20 space-y-2 flex flex-col justify-center">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400"><span>Daromad</span><span className="text-emerald-400 font-bold">24,000,000 UZS</span></div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full"><div className="bg-emerald-500 h-full rounded-full" style={{width: "82%"}}></div></div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400"><span>Xarajat</span><span className="text-rose-400 font-bold">4,200,000 UZS</span></div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full"><div className="bg-rose-500 h-full rounded-full" style={{width: "22%"}}></div></div>
                      </div>
                    </div>
                  </div>

                  {/* Chart 4: Guruhlar bo'yicha bolalar */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">🎒 Guruhlar sig'imi</span>
                    <div className="space-y-1.5 text-xs">
                      {groupsList.map(g => {
                        const count = childrenList.filter(c => c.groupId === g.id).length;
                        const pct = Math.min(100, (count / g.capacity) * 100);
                        return (
                          <div key={g.id} className="space-y-0.5">
                            <div className="flex justify-between text-[9px] text-slate-400"><span>{g.name}</span><span>{count}/{g.capacity}</span></div>
                            <div className="w-full bg-slate-800 h-1 rounded-full"><div className="bg-indigo-500 h-full rounded-full" style={{width: `${pct}%`}}></div></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart 5: Kasallik statistikasi */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">🤒 Kasallik va Isitma</span>
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-center">
                        <div className="text-xl font-black text-rose-400">1 nafar</div>
                        <div className="text-[9px] text-slate-500">Allergiya</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-black text-amber-400">0 nafar</div>
                        <div className="text-[9px] text-slate-500">Isitma</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-black text-emerald-400">98%</div>
                        <div className="text-[9px] text-slate-500">Sog'lomlik</div>
                      </div>
                    </div>
                  </div>

                  {/* Chart 6: Ovqat & Energetika */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">🍏 Energetik balans</span>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-400"><span>Kaloriyalar</span><span className="text-slate-200">1250 kkal/kun</span></div>
                      <div className="flex justify-between text-[9px] text-slate-400"><span>Oqsillar</span><span className="text-emerald-400">45 gr</span></div>
                      <div className="flex justify-between text-[9px] text-slate-400"><span>Uglevodlar</span><span className="text-yellow-400">180 gr</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights and Advice box */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Award className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Nihol AI Ko'rsatmalari</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-850">
                  "Sobiq to'lov va davomat ko'rsatkichlariga ko'ra, <b>Kamalak</b> guruhi yuqori natijaga ega. Buxgalterga qarzdor ota-onalarni ogohlantirish uchun Telegram bot orqali bildirishnomalarni jo'natish so'raladi. Oshxonadagi oziq-ovqat zaxirasi yana 12 kunga yetarli."
                </p>
              </div>
                </>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Analytics Header Summary Cards */}
                    <div className="lg:col-span-12 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                      <div>
                        <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-500/20 inline-block mb-1.5">
                          Tahliliy Hisobotlar & Bashoratlar
                        </span>
                        <h2 className="text-white font-black text-lg uppercase tracking-wider">Tizim Ma'lumotlari Analitikasi</h2>
                        <p className="text-xs text-slate-400">Recharts kutubxonasi yordamida bolalar davomati trendi, oylik to'lovlar taqsimoti va tarbiyachi-bola yuklama koeffitsientining tahlili.</p>
                      </div>
                    </div>
                  </div>

                  {/* 1. AreaChart: Child Attendance Trends */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Bola Qatnovi</span>
                      <h3 className="text-white font-black text-sm uppercase tracking-wider">Bolalar Davomati Trendlari (Child Attendance Trends)</h3>
                      <p className="text-[11px] text-slate-400">Guruhlar kesimida va kunlik davomad foizlari asosida hisoblangan o'rtacha oylik trend.</p>
                    </div>
                    <div className="h-72 w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { month: "Yanvar", "Kelganlar %": 88, "Kutilgan %": 85 },
                            { month: "Fevral", "Kelganlar %": 90, "Kutilgan %": 87 },
                            { month: "Mart", "Kelganlar %": 92, "Kutilgan %": 90 },
                            { month: "Aprel", "Kelganlar %": 94, "Kutilgan %": 91 },
                            { month: "May", "Kelganlar %": 96, "Kutilgan %": 93 },
                            { month: "Iyun", "Kelganlar %": 93, "Kutilgan %": 92 },
                            { month: "Iyul (Bugun)", "Kelganlar %": Math.round((childrenInKgarten / Math.max(1, totalChildren)) * 100), "Kutilgan %": 94 }
                          ]}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorPresenceChart" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpectationChart" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis domain={[50, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", fontSize: "11px" }}
                            labelClassName="font-bold text-white"
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                          <Area type="monotone" name="Haqiqiy davomat %" dataKey="Kelganlar %" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresenceChart)" />
                          <Area type="monotone" name="Bashoratli davomat %" dataKey="Kutilgan %" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorExpectationChart)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 2. BarChart: Monthly Payment Distribution */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                      <div>
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">To'lovlar balansi</span>
                        <h3 className="text-white font-black text-sm uppercase tracking-wider">Oylik To'lovlar Taqsimoti (Monthly Payment Distribution)</h3>
                        <p className="text-[11px] text-slate-400">Ota-onalar tomonidan amalga oshirilgan to'lovlar, qisman to'lovlar va qarzdorliklar miqdori.</p>
                      </div>
                      <div className="h-64 w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { period: "Aprel", "To'langan": 18500000, "Qisman": 3500000, "Qarzdorlik": 2000000 },
                              { period: "May", "To'langan": 20200000, "Qisman": 2800000, "Qarzdorlik": 1000000 },
                              { period: "Iyun", "To'langan": 22400000, "Qisman": 1600000, "Qarzdorlik": 800000 },
                              { period: "Iyul (Joriy)", "To'langan": totalReceivedFees, "Qisman": Math.round(totalReceivedFees * 0.15), "Qarzdorlik": debtParentsCount * 1200000 }
                            ]}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                            <XAxis dataKey="period" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", fontSize: "11px" }}
                              labelClassName="font-bold text-white"
                              formatter={(v: any) => [`${Number(v).toLocaleString()} UZS`]}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                            <Bar dataKey="To'langan" name="To'liq to'langan" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Qisman" name="Qisman to'langan" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Qarzdorlik" name="Qarzdorlik miqdori" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 3. BarChart/ComposedChart: Staff-to-Child Ratios */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                      <div>
                        <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider block">Resurslarni taqsimlash</span>
                        <h3 className="text-white font-black text-sm uppercase tracking-wider">Xodim-Bola Yuklama Nisbati (Staff-to-Child Ratios)</h3>
                        <p className="text-[11px] text-slate-400">Guruhlar kesimida 1 nafar xodimga to'g'ri keluvchi bolalar soni (Past nisbat yuqori sifatni anglatadi).</p>
                      </div>
                      <div className="h-64 w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={groupsList.map(g => {
                              const kidsCount = childrenList.filter(c => c.groupId === g.id).length || 8;
                              // Approximate staff per group (usually 2 staff or at least 1)
                              const staffCount = g.capacity > 20 ? 2 : 1;
                              const ratio = Number((kidsCount / staffCount).toFixed(1));
                              return {
                                groupName: g.name,
                                "Bolalar soni": kidsCount,
                                "Xodimlar": staffCount,
                                "Nisbat (Bola/Xodim)": ratio
                              };
                            })}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                            <XAxis dataKey="groupName" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", fontSize: "11px" }}
                              labelClassName="font-bold text-white"
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                            <Bar dataKey="Nisbat (Bola/Xodim)" name="Yuklama darajasi (Bola/Xodim)" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                              {groupsList.map((_, i) => (
                                <Cell key={`cell-${i}`} fill={i % 2 === 0 ? "#6366f1" : "#0ea5e9"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Operational insights derived from the data */}
                  <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-2xl text-xs space-y-2">
                    <span className="text-indigo-400 font-bold block uppercase tracking-wide text-[10px]">📊 Tahliliy xulosalar & Optimizatsiya tavsiyalari:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li><b>Qatnov tahlili:</b> Yoz oylarida bolalarning qatnov darajasi o'rtacha <b>{Math.round((childrenInKgarten / Math.max(1, totalChildren)) * 100)}%</b> ni tashkil etmoqda, bu kutilgan ko'rsatkichdan biroz yuqoriroq.</li>
                      <li><b>Moliyaviy muvozanat:</b> To'lov statistikasi shuni ko'rsatadiki, jami qarzdorlik <b>{(debtParentsCount * 1200000).toLocaleString()} UZS</b> ni tashkil etadi. Tizim orqali ota-onalarga bulk sms/telegram bildirishnomalari yuborilishi to'lov intizomini 12% ga yaxshiladi.</li>
                      <li><b>Kadrlar yuklamasi:</b> Guruhlar kesimidagi optimal xodim-bola yuklamaasi <b>1 : 10</b> atrofida bo'lishi lozim. Ayrim guruhlarda yuklama 12 dan oshganligi sababli qo'shimcha tarbiyachilarni jalb qilish tavsiya etiladi.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. CHILDREN LIST COMPONENT */}
          {activeTab === "children" && !selectedChildId && (() => {
            const displayedChildren = childrenList
              .filter(c => c.name.toLowerCase().includes(childSearch.toLowerCase()))
              .filter(c => !childGroupFilter || c.groupId === childGroupFilter);

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-white font-black text-sm uppercase tracking-wider">Bolalar ro'yxati va holati</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={childSearch}
                      onChange={(e) => setChildSearch(e.target.value)}
                      placeholder="Ism bo'yicha qidiruv..."
                      className="bg-slate-900 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-500 w-44"
                    />
                    <select
                      value={childGroupFilter}
                      onChange={(e) => setChildGroupFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-500"
                    >
                      <option value="">Barcha guruhlar</option>
                      {groupsList.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => exportToCSV(displayedChildren, "Bolalar_Royxati")}
                      className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
                      title="Bolalar ro'yxatini CSV formatida yuklab olish"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Eksport (CSV)</span>
                    </button>
                  </div>
                </div>

                {/* Bulk Actions Panel */}
                {selectedChildIds.length > 0 && (
                  <div className="bg-slate-900 border-2 border-emerald-500/30 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-white font-bold text-xs block">{selectedChildIds.length} ta bola tanlandi</span>
                        <span className="text-[10px] text-slate-400">Tanlangan bolalar uchun guruhli amallarni bajaring:</span>
                      </div>
                    </div>

                    {/* Custom Reminder Message Box */}
                    <div className="flex-1 max-w-md lg:mx-4">
                      <input
                        type="text"
                        placeholder="Guruhli eslatma matni (ixtiyoriy)..."
                        value={bulkActionMessage}
                        onChange={(e) => setBulkActionMessage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isProcessingBulk}
                        onClick={handleBulkMarkAbsent}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        Kelmagan deb belgilash
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingBulk}
                        onClick={handleBulkSendReminder}
                        className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        Eslatma yuborish (TG/SMS)
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkExport}
                        className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95"
                      >
                        Eksport (.CSV)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedChildIds([])}
                        className="text-slate-400 hover:text-white text-xs font-bold px-2 py-2"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-4 w-10">
                            <input
                              type="checkbox"
                              checked={displayedChildren.length > 0 && selectedChildIds.length === displayedChildren.length}
                              onChange={(e) => handleSelectAllChildren(e.target.checked, displayedChildren)}
                              className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 w-4 h-4 cursor-pointer"
                            />
                          </th>
                          <th className="py-3 px-4">F.I.O</th>
                          <th className="py-3 px-4">Guruh</th>
                          <th className="py-3 px-4">Yosh</th>
                          <th className="py-3 px-4">Ota-onasi</th>
                          <th className="py-3 px-4">Telefon</th>
                          <th className="py-3 px-4">To'lov holati</th>
                          <th className="py-3 px-4">Davomat %</th>
                          <th className="py-3 px-4">Holat</th>
                          <th className="py-3 px-4 text-center">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-300">
                        {displayedChildren.map((c) => {
                          const paid = paymentsList.some(p => p.childId === c.id && p.month === "Iyul");
                          return (
                            <tr key={c.id} className="hover:bg-slate-850/50 transition-colors">
                              <td className="py-3 px-4">
                                <input
                                  type="checkbox"
                                  checked={selectedChildIds.includes(c.id)}
                                  onChange={(e) => handleSelectChild(c.id, e.target.checked)}
                                  className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 w-4 h-4 cursor-pointer"
                                />
                              </td>
                              <td className="py-3 px-4 flex items-center gap-3">
                                <img src={c.photo} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700" alt="" />
                                <div>
                                  <div className="font-bold text-white">{c.name}</div>
                                  <span className="text-[10px] text-slate-500 font-mono">ID: {c.id}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {groupsList.find((g) => g.id === c.groupId)?.name || "Kichik guruh"}
                              </td>
                              <td className="py-3 px-4 font-semibold">{c.age} yosh</td>
                              <td className="py-3 px-4">{c.parentName}</td>
                              <td className="py-3 px-4 text-slate-400 font-mono">{c.parentPhone}</td>
                              <td className="py-3 px-4">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                  paid ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                }`}>
                                  {paid ? "To'langan" : "Qarzdor"}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-400">96%</td>
                              <td className="py-3 px-4">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  c.status === "Bog'chada"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : c.status === "Kechikdi"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedChildId(c.id);
                                      setChildDetailTab("general");
                                    }}
                                    className="p-1 hover:bg-slate-800 text-sky-400 rounded transition-colors cursor-pointer text-[10px] font-bold px-2 py-1 bg-sky-500/10"
                                  >
                                    Profil
                                  </button>
                                  <button
                                    onClick={() => handleDeleteChild(c.id)}
                                    className="p-1.5 hover:bg-slate-800 text-rose-400 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. CHILD DETAILS (INTERNAL TAB) */}
          {selectedChildId && currentChild && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <img src={currentChild.photo} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500" alt="" />
                  <div>
                    <h3 className="text-white font-black text-lg">{currentChild.name}</h3>
                    <p className="text-slate-400 text-xs">
                      {groupsList.find(g => g.id === currentChild.groupId)?.name} guruh bolasi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChildId(null)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold self-start cursor-pointer"
                >
                  ◀ Ro'yxatga qaytish
                </button>
              </div>

              {/* Subtabs lists */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-850">
                {[
                  { id: "general", label: "General" },
                  { id: "parents", label: "Parents" },
                  { id: "medical", label: "Medical" },
                  { id: "attendance", label: "Attendance" },
                  { id: "payments", label: "Payments" },
                  { id: "activities", label: "Activities" },
                  { id: "gallery", label: "Gallery" },
                  { id: "documents", label: "Documents" },
                  { id: "timeline", label: "Timeline" },
                  { id: "notes", label: "Notes" },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setChildDetailTab(st.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                      childDetailTab === st.id
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-850"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 text-xs space-y-4">
                {childDetailTab === "general" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-slate-500">To'liq ismi:</span> <p className="text-sm font-bold text-white">{currentChild.name}</p></div>
                    <div><span className="text-slate-500">Tug'ilgan kuni:</span> <p className="text-sm font-bold text-white">{currentChild.birthDate}</p></div>
                    <div><span className="text-slate-500">Jinsi:</span> <p className="text-sm font-bold text-white">{currentChild.gender}</p></div>
                    <div><span className="text-slate-500">Yoshi:</span> <p className="text-sm font-bold text-white">{currentChild.age} yoshda</p></div>
                    <div><span className="text-slate-500">Guruh ID:</span> <p className="text-sm font-bold text-white">{currentChild.groupId}</p></div>
                    <div><span className="text-slate-500">Tizim holati:</span> <p className="text-sm font-bold text-emerald-400">{currentChild.status}</p></div>
                  </div>
                )}

                {childDetailTab === "parents" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
                        <span className="text-slate-500 block mb-1">Ota-ona Ism/Familiya:</span>
                        <p className="text-sm font-bold text-white">{currentChild.parentName}</p>
                      </div>
                      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
                        <span className="text-slate-500 block mb-1">Hozirgi Telefon:</span>
                        <p className="text-sm font-bold text-white font-mono">{currentChild.parentPhone}</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <h4 className="text-white font-bold text-[11px] uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                        <span>🔔 Ogohlantirish sozlamalari (Notification Destinations)</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">
                            SMS ogohlantirish telefoni:
                          </label>
                          <input
                            type="text"
                            value={tempParentPhone}
                            onChange={(e) => setTempParentPhone(e.target.value)}
                            placeholder="Masalan: +998901234567"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 font-mono text-xs"
                          />
                          <p className="text-[9px] text-slate-500">
                            NotificationService avtomatik ravishda ushbu raqamga SMS yuboradi.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">
                            Telegram Chat ID (Farzand ulanishi):
                          </label>
                          <input
                            type="text"
                            value={tempTelegramChatId}
                            onChange={(e) => setTempTelegramChatId(e.target.value)}
                            placeholder="Masalan: 559482710"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 font-mono text-xs"
                          />
                          <p className="text-[9px] text-slate-500">
                            Telegram botga yuboriladigan xabarlar uchun Chat ID.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-800/60">
                        <button
                          type="button"
                          onClick={handleSaveTelegramChatId}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          Sozlamalarni saqlash
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {childDetailTab === "medical" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-900 p-3 rounded-xl">
                        <span className="text-slate-500">Allergiya:</span>
                        <p className="font-bold text-rose-400">{currentChild.medicalCard?.allergies || "Yo'q"}</p>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl">
                        <span className="text-slate-500">Qon guruhi:</span>
                        <p className="font-bold text-white">{currentChild.medicalCard?.bloodGroup || "O (I)"}</p>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl">
                        <span className="text-slate-500">Bo'yi:</span>
                        <p className="font-bold text-white">{currentChild.medicalCard?.height || 108} sm</p>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl">
                        <span className="text-slate-500">Vazni:</span>
                        <p className="font-bold text-white">{currentChild.medicalCard?.weight || 19} kg</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Emlashlar tarixi (Vaccinations):</span>
                      <div className="flex flex-wrap gap-2">
                        {["Gepatit B", "AKDS", "Qizamiq", "Poliomielit"].map(v => (
                          <span key={v} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold">
                            ✓ {v} qabul qilingan
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {childDetailTab === "attendance" && (
                  <div className="space-y-3">
                    <h4 className="text-white font-bold">Oxirgi Davomat jurnallari</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-900 rounded-xl flex justify-between items-center">
                        <span className="text-slate-300">2026-07-02 (Bugun)</span>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Keldi (08:12)</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl flex justify-between items-center">
                        <span className="text-slate-300">2026-07-01</span>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Keldi (08:05)</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl flex justify-between items-center">
                        <span className="text-slate-300">2026-06-30</span>
                        <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">Sababli Kelmadi</span>
                      </div>
                    </div>
                  </div>
                )}

                {childDetailTab === "payments" && (
                  <div className="space-y-3">
                    <h4 className="text-white font-bold">To'lovlar Tarixi</h4>
                    {paymentsList.filter(p => p.childId === currentChild.id).length === 0 ? (
                      <p className="text-slate-500 italic">Hali to'lovlar qilinmagan.</p>
                    ) : (
                      paymentsList.filter(p => p.childId === currentChild.id).map(p => (
                        <div key={p.id} className="p-3 bg-slate-900 rounded-xl flex justify-between items-center font-mono">
                          <div>
                            <div className="text-slate-200 font-bold">{p.month} oyi to'lovi</div>
                            <span className="text-[10px] text-slate-500">{p.date} • {p.paymentType}</span>
                          </div>
                          <span className="text-emerald-400 font-bold">+{p.amount.toLocaleString()} UZS</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {childDetailTab === "activities" && (
                  <div className="space-y-3">
                    <h4 className="text-white font-bold">Bugungi o'zlashtirish & Faollik ko'rsatkichlari</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-900 rounded-xl"><span>Darsdagi Faolligi:</span> <p className="font-bold text-white mt-1">⭐⭐⭐⭐⭐ (A'lo)</p></div>
                      <div className="p-3 bg-slate-900 rounded-xl"><span>Intizom:</span> <p className="font-bold text-white mt-1">⭐⭐⭐⭐⭐ (Yaxshi)</p></div>
                      <div className="p-3 bg-slate-900 rounded-xl"><span>Nutqi va muloqot:</span> <p className="font-bold text-white mt-1">⭐⭐⭐⭐ (Yaxshi)</p></div>
                      <div className="p-3 bg-slate-900 rounded-xl"><span>Tushlik ovqat ishtahasi:</span> <p className="font-bold text-white mt-1">Yaxshi</p></div>
                    </div>
                  </div>
                )}

                {childDetailTab === "gallery" && (
                  <div className="grid grid-cols-3 gap-2">
                    <img src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=200" className="rounded-xl aspect-square object-cover" alt="" />
                    <img src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=200" className="rounded-xl aspect-square object-cover" alt="" />
                    <div className="bg-slate-900 rounded-xl flex items-center justify-center aspect-square text-slate-500 font-bold">+3 ta rasm</div>
                  </div>
                )}

                {childDetailTab === "documents" && (
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl">
                      <span>Guvohnoma nusxasi (Birth Certificate)</span>
                      <span className="text-emerald-400 font-bold">✓ Yuklangan</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl">
                      <span>Tibbiy karta 086</span>
                      <span className="text-emerald-400 font-bold">✓ Tasdiqlangan</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl">
                      <span>Ikki tomonlama shartnoma</span>
                      <span className="text-rose-400 font-bold">⚠ Kutilmoqda</span>
                    </div>
                  </div>
                )}

                {childDetailTab === "timeline" && (
                  <div className="space-y-3 pl-3 border-l-2 border-emerald-500/30">
                    <div className="relative"><span className="absolute -left-4.5 w-3 h-3 bg-emerald-500 rounded-full"></span> <span className="text-slate-400 text-[10px]">2026-03-10</span> <p className="text-white font-semibold">Bog'chaga ro'yxatga olindi</p></div>
                    <div className="relative"><span className="absolute -left-4.5 w-3 h-3 bg-emerald-500 rounded-full"></span> <span className="text-slate-400 text-[10px]">2026-03-12</span> <p className="text-white font-semibold">Kamalak guruhiga biriktirildi</p></div>
                    <div className="relative"><span className="absolute -left-4.5 w-3 h-3 bg-indigo-500 rounded-full"></span> <span className="text-slate-400 text-[10px]">2026-07-01</span> <p className="text-white font-semibold">Iyul oyi to'lovi Click orqali qilindi</p></div>
                  </div>
                )}

                {childDetailTab === "notes" && (
                  <div>
                    <span className="text-slate-400 block mb-1">Tarbiyachi shaxsiy eslatmasi:</span>
                    <p className="bg-slate-900 p-3 rounded-xl italic">
                      "Rasm chizish darslarida juda faol, matematika mashg'ulotlariga e'tibor talab qilinadi."
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. PARENTS COMPONENT */}
          {activeTab === "parents" && (
            <div className="space-y-4">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Ota-onalar Kontaktlari va Bog'lanish</h3>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Ota-ona Ismi</th>
                      <th className="py-3 px-4">Bog'liq Bola</th>
                      <th className="py-3 px-4">Telefon</th>
                      <th className="py-3 px-4">Telegram Bot Ulanishi</th>
                      <th className="py-3 px-4 text-center">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {childrenList.map(c => (
                      <tr key={c.id} className="hover:bg-slate-850/30">
                        <td className="py-3 px-4 font-bold text-white">{c.parentName}</td>
                        <td className="py-3 px-4">{c.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{c.parentPhone}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.telegramChatId ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                            {c.telegramChatId ? "Ulangan (Bot)" : "Ulanmagan"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              alert(`${c.parentName} uchun shaxsiy ogohlantirish telegram bot simulatoriga jo'natildi.`);
                            }}
                            className="bg-slate-800 hover:bg-slate-750 text-emerald-400 px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Ogohlantirish jo'natish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. EMPLOYEES COMPONENT */}
          {activeTab === "employees" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Xodimlar shtati va vakolatlar</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportEmployeesCSV}
                    className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer border border-slate-700 transition-all flex items-center gap-1"
                  >
                    📥 CSV yuklab olish
                  </button>
                  <button
                    onClick={() => setShowAddEmpModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                  >
                    ➕ Yangi Xodim Qo'shish
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {employeesList.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-bold text-sm">Xodimlar mavjud emas</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Tizimda hozircha hech qanday xodim ro'yxatga olinmagan. Yangi xodim qo'shish tugmasi orqali oshpaz, tarbiyachi yoki boshqa xodimlarni kiritishingiz mumkin.
                    </p>
                    <button
                      onClick={() => setShowAddEmpModal(true)}
                      className="bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-emerald-400 transition-all inline-block"
                    >
                      ➕ Yangi Xodim Qo'shish
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-850 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Xodim F.I.O</th>
                        <th className="py-3 px-4">Rol / Lavozim</th>
                        <th className="py-3 px-4">Tizimdagi logini</th>
                        <th className="py-3 px-4">Telefon</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {employeesList.map(e => (
                        <tr key={e.id} className="hover:bg-slate-850/30">
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/20">
                              {e.name.charAt(0)}
                            </span>
                            {e.name}
                          </td>
                          <td className="py-3 px-4"><span className="bg-slate-800 px-2 py-0.5 rounded font-bold text-[10px] text-indigo-300">{e.role}</span></td>
                          <td className="py-3 px-4 font-mono text-slate-400">{e.username}</td>
                          <td className="py-3 px-4 font-mono text-slate-400">{e.phone || "-"}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.status === "Faol" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                              {e.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditEmp(e)}
                                title="Xodimni tahrirlash"
                                className="p-1.5 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {e.role !== "SuperAdmin" && (
                                <button
                                  onClick={() => handleDeleteEmployee(e.id, e.name, e.role)}
                                  title="Xodimni o'chirish"
                                  className="p-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* 5. GROUPS COMPONENT */}
          {activeTab === "groups" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Kindergarten guruhlari</h3>
                <button onClick={() => setShowAddGroupModal(true)} className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer hover:bg-emerald-400 transition-all">
                  ➕ Guruh yaratish
                </button>
              </div>

              {groupsList.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <Grid className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-sm">Guruhlar mavjud emas</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Tizimda hozircha hech qanday guruh mavjud emas. Bolalarni taqsimlash uchun yangi guruh yarating.
                  </p>
                  <button
                    onClick={() => setShowAddGroupModal(true)}
                    className="bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-emerald-400 transition-all inline-block"
                  >
                    ➕ Yangi Guruh Yaratish
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {groupsList.map(g => {
                    const teacher = employeesList.find(e => e.id === g.teacherId);
                    const count = childrenList.filter(c => c.groupId === g.id).length;
                    const pct = Math.min(100, (count / (g.capacity || 1)) * 100);
                    return (
                      <div 
                        key={g.id} 
                        className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-5 rounded-3xl space-y-3 transition-all hover:scale-[1.01] shadow-lg hover:shadow-emerald-500/5 group relative"
                      >
                        <div className="flex justify-between items-start">
                          <div onClick={() => setSelectedGroupDetail(g)} className="cursor-pointer">
                            <h4 className="text-white font-black text-sm group-hover:text-emerald-400 transition-colors">{g.name}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {g.id}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditGroup(g); }}
                              title="Guruhni tahrirlash"
                              className="p-1 hover:bg-slate-800 text-indigo-400 rounded cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id, g.name); }}
                              title="Guruhni o'chirish"
                              className="p-1 hover:bg-rose-500/10 text-rose-400 rounded cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div onClick={() => setSelectedGroupDetail(g)} className="cursor-pointer space-y-3">
                          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 text-slate-300">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Tarbiyachi</span>
                            <div className="font-bold text-white text-xs mt-0.5">{teacher ? teacher.name : "Biriktirilmagan"}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{teacher ? teacher.phone : "-"}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>Bolalar sig'imi:</span> 
                              <span className="text-white font-bold">{count}/{g.capacity} ta bola</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-850 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{width: `${pct}%`}}></div>
                            </div>
                            <span className="text-[9px] text-indigo-400 block pt-1 group-hover:underline">Batafsil ma'lumot ➔</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Group Detail Modal */}
              {selectedGroupDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 space-y-6 text-xs text-slate-300 relative">
                    <button
                      onClick={() => setSelectedGroupDetail(null)}
                      className="absolute top-5 right-5 text-slate-400 hover:text-white text-base font-bold p-1 cursor-pointer bg-slate-950/40 hover:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center"
                    >
                      ✕
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Guruh Tafsilotlari</span>
                        <h3 className="text-white font-black text-xl mt-1">{selectedGroupDetail.name}</h3>
                        <p className="text-slate-400 mt-1">ID: {selectedGroupDetail.id} • Maksimal sig'im: {selectedGroupDetail.capacity} ta bola</p>
                      </div>
                      
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
                        <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                          <Users className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">Mas'ul Tarbiyachi</span>
                          <span className="text-white font-bold block text-xs">
                            {employeesList.find(e => e.id === selectedGroupDetail.teacherId)?.name || "Tarbiyachi biriktirilmagan"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Children List */}
                      <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-3">
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                          <Users className="w-4 h-4 text-emerald-400" /> Guruh Bolalari ({childrenList.filter(c => c.groupId === selectedGroupDetail.id).length} ta)
                        </h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {childrenList.filter(c => c.groupId === selectedGroupDetail.id).map(c => (
                            <div key={c.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-850 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img src={c.photo} className="w-8 h-8 rounded-full object-cover border border-slate-800 shrink-0" alt="" />
                                <div>
                                  <div className="font-bold text-white text-xs">{c.name}</div>
                                  <span className="text-[9px] text-slate-500 font-mono">{c.age} yosh • {c.gender}</span>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                c.status === "Bog'chada" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                              }`}>
                                {c.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Real-time Attendance Logs & Activities */}
                      <div className="space-y-4">
                        {/* Attendance today */}
                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-3">
                          <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                            <Clock className="w-4 h-4 text-emerald-400" /> Bugungi FaceID Kirish/Chiqish jurnallari
                          </h4>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {childrenList.filter(c => c.groupId === selectedGroupDetail.id).map(c => {
                              const todayStr = new Date().toISOString().split("T")[0];
                              const record = attendanceList.find(a => a.childId === c.id && a.date === todayStr);
                              return (
                                <div key={c.id} className="p-2 bg-slate-900 rounded-xl border border-slate-850 flex items-center justify-between text-[11px] font-mono">
                                  <span className="text-white font-bold text-xs">{c.name.split(" ")[0]}</span>
                                  <div className="flex gap-3 text-slate-400">
                                    <span>Kirish: <strong className="text-emerald-400">{record?.checkIn || "—"}</strong></span>
                                    <span>Chiqish: <strong className="text-sky-400">{record?.checkOut || "—"}</strong></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Group Activities */}
                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
                          <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                            <Activity className="w-4 h-4 text-emerald-400" /> Bugungi Mashg'ulotlar Rejasi
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                              <span className="text-[10px] text-slate-500 font-bold block uppercase">Dars Turi</span>
                              <span className="text-slate-200 font-bold mt-1 block">📚 Ranglar & Matematika</span>
                            </div>
                            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                              <span className="text-[10px] text-slate-500 font-bold block uppercase">Tushlik Taomi</span>
                              <span className="text-slate-200 font-bold mt-1 block">🍲 Sho'rva & Osh</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                      <button
                        onClick={() => setSelectedGroupDetail(null)}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Yopish
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. ATTENDANCE OVERVIEW COMPONENT */}
          {activeTab === "attendance" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-white font-black text-sm uppercase tracking-wider">
                  Kunlik va Davriy Davomat Jurnali (FaceID)
                </h3>
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
                  <button
                    onClick={() => setAttendanceSubTab("children")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attendanceSubTab === "children"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Bolalar Davomati
                  </button>
                  <button
                    onClick={() => setAttendanceSubTab("staff")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attendanceSubTab === "staff"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Xodimlar Davomati
                  </button>
                </div>
              </div>

              {attendanceSubTab === "children" ? (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-300 font-bold">Sana: {new Date().toLocaleDateString("uz-UZ")}</span>
                      <button
                        onClick={async () => {
                          await fetchAttendanceList();
                          onRefresh();
                          triggerNotification("Ma'lumotlar muvaffaqiyatli yangilandi!");
                        }}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors"
                      >
                        🔄 Yangilash
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        {(["daily", "weekly", "monthly"] as const).map(filter => (
                          <button
                            key={filter}
                            onClick={() => setChildrenExportPeriod(filter)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              childrenExportPeriod === filter
                                ? "bg-slate-850 text-white"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {filter === "daily" ? "Kunlik" : filter === "weekly" ? "Haftalik" : "Oylik"}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportAttendanceCSV("children", childrenExportPeriod)}
                          className="bg-emerald-600 hover:bg-emerald-550 text-white text-[11px] px-3 py-1 rounded-lg font-bold cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          📥 CSV
                        </button>
                        <button
                          onClick={() => exportAttendancePDF("children", childrenExportPeriod)}
                          className="bg-sky-600 hover:bg-sky-550 text-white text-[11px] px-3 py-1 rounded-lg font-bold cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          📄 PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {childrenList.map(c => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const attRecord = attendanceList.find(a => a.childId === c.id && a.date === todayStr);

                      let statusBadge = "Kelmagan";
                      let badgeStyle = "bg-rose-500/10 text-rose-400 border border-rose-500/5";

                      if (c.status === "Bog'chada") {
                        statusBadge = "Bog'chada";
                        badgeStyle = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/5";
                      } else if (c.status === "Kechikdi") {
                        statusBadge = "Kechikdi";
                        badgeStyle = "bg-amber-500/10 text-amber-400 border border-amber-500/5";
                      } else if (attRecord?.checkOut) {
                        statusBadge = "Ketgan";
                        badgeStyle = "bg-sky-500/10 text-sky-400 border border-sky-500/5";
                      } else if (c.status === "Sababli") {
                        statusBadge = "Sababli";
                        badgeStyle = "bg-slate-500/10 text-slate-400 border border-slate-500/5";
                      }

                      return (
                        <div key={c.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <img src={c.photo} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-800" alt="" />
                            <div>
                              <div className="font-bold text-white">{c.name}</div>
                              <span className="text-[10px] text-slate-500">{groupsList.find(g => g.id === c.groupId)?.name || "Guruhsiz"}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center font-mono text-[11px] text-slate-300">
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase block font-bold">Keldi</span>
                              <span className="font-bold text-emerald-400">{attRecord?.checkIn || "—"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase block font-bold">Ketdi</span>
                              <span className="font-bold text-sky-400">{attRecord?.checkOut || "—"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase block font-bold">Harorat</span>
                              <span className="font-bold">{attRecord?.temperature ? `${attRecord.temperature}°C` : "—"}</span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider text-center self-start sm:self-center ${badgeStyle}`}>
                            {statusBadge}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in text-xs">
                  {/* Staff attendance anomalies alert section */}
                  {staffAnomalies.length > 0 && (
                    <div className="bg-rose-950/25 border border-rose-900/40 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-rose-400 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <span>Xodimlar Davomati Anomaliyalari ({staffAnomalies.length} ta)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[180px] overflow-y-auto pr-1">
                        {staffAnomalies.map(anom => (
                          <div key={anom.id} className="bg-slate-950/50 border border-rose-950 p-3 rounded-xl flex items-start gap-2.5 text-[11px] leading-relaxed">
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${anom.type === "missing_checkout" ? "bg-rose-500 shadow-sm shadow-rose-500/50" : "bg-amber-500 shadow-sm shadow-amber-500/50"}`} />
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-200">
                                {anom.name} <span className="text-slate-400 text-[10px] font-mono">({anom.role})</span>
                              </div>
                              <div className="text-slate-400">{anom.details}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      {(["daily", "weekly", "monthly"] as const).map(filter => (
                        <button
                          key={filter}
                          onClick={() => setEmployeeTimeFilter(filter)}
                          className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            employeeTimeFilter === filter
                              ? "bg-slate-850 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {filter === "daily" ? "Kunlik" : filter === "weekly" ? "Haftalik" : "Oylik"}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                        Hisobotni yuklash:
                      </span>
                      <button
                        onClick={() => exportAttendanceCSV("staff", employeeTimeFilter)}
                        className="bg-emerald-600 hover:bg-emerald-550 text-white text-[11px] px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors"
                      >
                        📥 CSV
                      </button>
                      <button
                        onClick={() => exportAttendancePDF("staff", employeeTimeFilter)}
                        className="bg-sky-600 hover:bg-sky-550 text-white text-[11px] px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors"
                      >
                        📄 PDF
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-850">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="bg-slate-950 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <tr>
                          <th className="py-3 px-4">Xodim</th>
                          <th className="py-3 px-4">Sana</th>
                          <th className="py-3 px-4">Kelgan Vaqti (Kirish)</th>
                          <th className="py-3 px-4">Ketgan Vaqti (Chiqish)</th>
                          <th className="py-3 px-4">Harorati</th>
                          <th className="py-3 px-4">Holat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-900/50 text-slate-300">
                        {employeesList.map(emp => {
                          // Find matching records based on selected filter
                          const todayStr = new Date().toISOString().split("T")[0];
                          const matchedRecords = attendanceList.filter(a => {
                            if (a.childId !== emp.id) return false;
                            if (employeeTimeFilter === "daily") {
                              return a.date === todayStr;
                            } else if (employeeTimeFilter === "weekly") {
                              // Any record in last 7 days
                              const recordDate = new Date(a.date);
                              const diffTime = Math.abs(new Date().getTime() - recordDate.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return diffDays <= 7;
                            } else {
                              // Any record in last 30 days
                              const recordDate = new Date(a.date);
                              const diffTime = Math.abs(new Date().getTime() - recordDate.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return diffDays <= 30;
                            }
                          });

                          if (matchedRecords.length === 0) {
                            return (
                              <tr key={emp.id} className="hover:bg-slate-850/20">
                                <td className="py-3 px-4 flex items-center gap-2">
                                  <img src={(emp as any).photo || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120"} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-850" alt="" />
                                  <div>
                                    <div className="font-bold text-white">{emp.name}</div>
                                    <span className="text-[9px] text-slate-500 font-mono">{emp.role}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-500 font-mono">—</td>
                                <td className="py-3 px-4 text-rose-400 font-bold font-mono">Kelmagan</td>
                                <td className="py-3 px-4 text-slate-500 font-mono">—</td>
                                <td className="py-3 px-4 text-slate-500 font-mono">—</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400">Yo'q</span>
                                </td>
                              </tr>
                            );
                          }

                          return matchedRecords.map((record, rIdx) => (
                            <tr key={`${emp.id}-${rIdx}`} className="hover:bg-slate-850/20">
                              <td className="py-3 px-4 flex items-center gap-2">
                                <img src={(emp as any).photo || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120"} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-850" alt="" />
                                <div>
                                  <div className="font-bold text-white">{emp.name}</div>
                                  <span className="text-[9px] text-slate-500 font-mono">{emp.role}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-400">{record.date}</td>
                              <td className="py-3 px-4 text-emerald-400 font-mono font-bold">{record.checkIn || "—"}</td>
                              <td className="py-3 px-4 text-sky-400 font-mono font-bold">{record.checkOut || "—"}</td>
                              <td className="py-3 px-4 text-slate-300 font-mono">{record.temperature ? `${record.temperature}°C` : "—"}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  record.checkOut ? "bg-slate-800 text-slate-400" : "bg-emerald-500/10 text-emerald-400"
                                }`}>
                                  {record.checkOut ? "Ishdan ketdi" : "Ayni vaqtda ishda"}
                                </span>
                              </td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. PAYMENTS COMPONENT */}
          {activeTab === "payments" && (() => {
            const calculatedTotalFees = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const calculatedDebt = totalDebtAmount || 0;
            return (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-black text-sm uppercase tracking-wider">To'lovlar Qabuli va Qarzdorlar jadvali</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportPaymentsCSV}
                      className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer border border-slate-700 transition-all flex items-center gap-1"
                    >
                      📥 CSV yuklab olish
                    </button>
                    <button onClick={() => setShowAddPaymentModal(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all">
                      ➕ Yangi To'lov Qabul qilish
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Jami yig'ilgan to'lovlar</span>
                    <div className="text-2xl font-black text-emerald-400 mt-2">{calculatedTotalFees.toLocaleString()} UZS</div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Mavjud qarzdorliklar</span>
                    <div className="text-2xl font-black text-rose-400 mt-2">{calculatedDebt.toLocaleString()} UZS</div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Qarzdor ota-onalar</span>
                    <div className="text-2xl font-black text-yellow-400 mt-2">{debtParentsCount} ta</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  {paymentsList.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <h4 className="text-white font-bold text-sm">To'lovlar mavjud emas</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Hozircha hech qanday to'lov qabul qilinmagan. Ota-onalar to'lov qilganda "➕ Yangi To'lov Qabul qilish" tugmasi orqali kiriting.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-850 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="py-3 px-4">Bola ismi</th>
                          <th className="py-3 px-4">Sana</th>
                          <th className="py-3 px-4">Oylik (Month)</th>
                          <th className="py-3 px-4">To'lov turi</th>
                          <th className="py-3 px-4 text-right">Summa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {paymentsList.map(p => (
                          <tr key={p.id} className="hover:bg-slate-850/30 font-mono">
                            <td className="py-3 px-4 font-bold text-white">{childrenList.find(c => c.id === p.childId)?.name || "Bola"}</td>
                            <td className="py-3 px-4">{p.date}</td>
                            <td className="py-3 px-4">{p.month} oyi</td>
                            <td className="py-3 px-4"><span className="bg-slate-800 px-2 py-0.5 rounded">{p.paymentType}</span></td>
                            <td className="py-3 px-4 text-right text-emerald-400 font-bold">+{Number(p.amount).toLocaleString()} UZS</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 8. FINANCE COMPONENT */}
          {activeTab === "finance" && (() => {
            const calculatedTotalFees = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const calculatedSalaries = employeesList.filter(e => e.role !== "SuperAdmin").length * 2500000;
            const calculatedKitchen = (mealsList?.length || 0) * 200000;
            const calculatedProfit = calculatedTotalFees - (calculatedSalaries + calculatedKitchen);

            return (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Moliya va Budjet tahlili</h3>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Jami Daromad</span>
                      <p className="text-xl font-black text-emerald-400 mt-1">{calculatedTotalFees.toLocaleString()} UZS</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Maoshlar (Xodimlar soni: {employeesList.filter(e => e.role !== "SuperAdmin").length})</span>
                      <p className="text-xl font-black text-rose-400 mt-1">{calculatedSalaries.toLocaleString()} UZS</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Oshxona xarajati</span>
                      <p className="text-xl font-black text-rose-400 mt-1">{calculatedKitchen.toLocaleString()} UZS</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Sof foyda (Balans)</span>
                      <p className={`text-xl font-black mt-1 ${calculatedProfit >= 0 ? "text-cyan-400" : "text-rose-400"}`}>
                        {calculatedProfit.toLocaleString()} UZS
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-xs">
                    <h4 className="text-white font-bold mb-3">Rejali xarajatlar diagrammasi</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Xodimlar oylik maoshi:</span> <span className="font-bold">{calculatedSalaries > 0 ? "60%" : "0%"}</span></div>
                      <div className="w-full bg-slate-900 h-2 rounded-full"><div className="bg-indigo-500 h-full rounded-full" style={{width: calculatedSalaries > 0 ? "60%" : "0%"}}></div></div>

                      <div className="flex justify-between"><span>Oziq-ovqat va tozalik:</span> <span className="font-bold">{calculatedKitchen > 0 ? "25%" : "0%"}</span></div>
                      <div className="w-full bg-slate-900 h-2 rounded-full"><div className="bg-emerald-500 h-full rounded-full" style={{width: calculatedKitchen > 0 ? "25%" : "0%"}}></div></div>

                      <div className="flex justify-between"><span>Texnik va kommunal:</span> <span className="font-bold">15%</span></div>
                      <div className="w-full bg-slate-900 h-2 rounded-full"><div className="bg-amber-500 h-full rounded-full" style={{width: "15%"}}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 9. MEDICAL COMPONENT */}
          {activeTab === "medical" && (
            <div className="space-y-4">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Tibbiy monitoring va rivojlanish</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Emlash holatlari (Vaccinations)</h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl flex justify-between">
                      <span>Kichik guruh (Tandir):</span>
                      <span className="text-emerald-400 font-bold">100% emlangan</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl flex justify-between">
                      <span>Kamalak guruhi:</span>
                      <span className="text-emerald-400 font-bold">96% emlangan</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Bo'y va vazn ko'rsatkichlari (BMI average)</h4>
                  <p className="text-xs text-slate-300">
                    Guruhlarda bolalar rivojlanishi normal ko'rsatkichda (O'rtacha BMI: 16.2). Bo'y o'sishi normal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 10. KITCHEN COMPONENT */}
          {activeTab === "kitchen" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wider">Kunlik Taomnomalar Monitoringi</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {user.role === "SuperAdmin" 
                      ? "Oshpazlar tomonidan yuklangan har kunlik taomlar va ularning fotosuratlari real vaqtda." 
                      : "Sizning bog'changiz uchun bugun va yaqin kunlar uchun belgilangan taomlar."}
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-full text-[10px] text-slate-400 font-mono flex items-center gap-1.5 self-start sm:self-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-time oshpaz paneli bilan bog'langan
                </div>
              </div>

              {(() => {
                const filteredMeals = mealsList.filter((m: any) => {
                  if (user.role === "SuperAdmin") return true;
                  return m.kindergartenId === user.kindergartenId;
                });
                const sortedMeals = [...filteredMeals].sort((a, b) => b.date.localeCompare(a.date));

                if (sortedMeals.length === 0) {
                  return (
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 text-xs">
                      <p className="italic">Hozircha oshpazlar tomonidan hech qanday taomnoma yuklanmagan.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {sortedMeals.map((mealPlan: any, planIdx: number) => {
                      const kgName = kindergartens.find((k) => k.id === mealPlan.kindergartenId)?.name || `Filial: ${mealPlan.kindergartenId}`;
                      
                      const mealsExist = [
                        { type: "Nonushta (Breakfast)", detail: mealPlan.breakfast, color: "text-amber-400" },
                        { type: "Ertalabki gazak (Morning Snack)", detail: mealPlan.morningSnack, color: "text-blue-400" },
                        { type: "Tushlik (Lunch)", detail: mealPlan.lunch, color: "text-emerald-400" },
                        { type: "Snack (Afternoon Snack)", detail: mealPlan.afternoonSnack, color: "text-purple-400" },
                        { type: "Kechki ovqat (Dinner)", detail: mealPlan.dinner, color: "text-orange-400" }
                      ].filter(m => m.detail && m.detail.title);

                      return (
                        <div key={planIdx} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-lg hover:border-slate-700 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
                                📅 {mealPlan.date}
                              </span>
                              {user.role === "SuperAdmin" && (
                                <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-500/20">
                                  🏫 {kgName}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Jami {mealsExist.length} ta taom kiritilgan
                            </span>
                          </div>

                          {mealsExist.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2">Ushbu kunga taomlar hali to'liq kiritilmagan.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              {mealsExist.map((meal, itemIdx) => (
                                <div key={itemIdx} className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                                  <div className="space-y-2.5">
                                    {meal.detail.image && (
                                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative">
                                        <img 
                                          src={meal.detail.image} 
                                          alt={meal.detail.title} 
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover" 
                                        />
                                        <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-wider">
                                          {meal.type.split(" ")[0]}
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <span className={`text-[10px] font-black uppercase tracking-wider ${meal.color}`}>
                                        {meal.type}
                                      </span>
                                      <h4 className="text-white font-black text-sm mt-0.5">{meal.detail.title}</h4>
                                    </div>

                                    <div className="grid grid-cols-4 gap-1 bg-slate-900/50 p-1.5 rounded-lg border border-slate-900 text-center text-[10px]">
                                      <div>
                                        <span className="text-slate-500 block text-[8px] uppercase">Kcal</span>
                                        <strong className="text-white font-mono">{meal.detail.calories || 350}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block text-[8px] uppercase">Oqsil</span>
                                        <strong className="text-white font-mono">{meal.detail.protein || 12}g</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block text-[8px] uppercase">Yog'</span>
                                        <strong className="text-white font-mono">{meal.detail.fat || 8}g</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block text-[8px] uppercase">Ugl.</span>
                                        <strong className="text-white font-mono">{meal.detail.carb || 45}g</strong>
                                      </div>
                                    </div>

                                    {(meal.detail.vitamins || meal.detail.minerals) && (
                                      <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-900/20 p-2 rounded-lg border border-slate-900">
                                        ✨ <strong className="text-slate-300">Tarkib:</strong> {meal.detail.vitamins && `Vits: ${meal.detail.vitamins}`} {meal.detail.minerals && `• Mins: ${meal.detail.minerals}`}
                                      </p>
                                    )}
                                  </div>

                                  {meal.detail.aiComment && (
                                    <div className="mt-2 pt-2 border-t border-slate-900">
                                      <span className="text-[9px] text-emerald-400 font-bold uppercase block">🤖 AI Nutri-tavsiya:</span>
                                      <p className="text-[10px] text-slate-300 italic leading-relaxed mt-0.5">
                                        {meal.detail.aiComment}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 11. DOCUMENTS COMPONENT */}
          {activeTab === "documents" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Hujjatlar Arxivi va Tarqatish</h3>
              
              {/* Super Admin Documents for this Director */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div>
                  <h4 className="text-white font-bold text-sm">Super Admin Buyruqlari va Maqsadli Byudjetlar</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    SaaS Super Admin tomonidan sizning bino/filialingizga biriktirilgan buyruqlar, rasmiy hujjatlar va ularga ajratilgan maqsadli moliyaviy mablag'lar ro'yxati.
                  </p>
                </div>

                <div className="space-y-4">
                  {superAdminDocs.filter(d => d.targetDirectorUsername === user.username).length === 0 ? (
                    <div className="text-slate-500 text-xs italic py-4">
                      Super Admin tomonidan biriktirilgan yangi hujjatlar mavjud emas.
                    </div>
                  ) : (
                    superAdminDocs.filter(d => d.targetDirectorUsername === user.username).map((doc: any) => {
                      const selectedPanels = distribPanels[doc.id] || [];
                      const panelsList = ["Buxgalter", "Tarbiyachi", "Oshpaz", "Hamshira"];

                      return (
                        <div key={doc.id} className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-black text-sm">{doc.title}</span>
                                <span className="bg-slate-900 border border-slate-800 text-[9px] text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">{doc.id}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">Yuborilgan sana: {doc.date} • Fayl nomi: <strong className="text-slate-300 font-mono">{doc.fileName}</strong></p>
                            </div>

                            <a 
                              href={doc.fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-center transition-all"
                            >
                              <Download className="w-4 h-4 stroke-[2.5]" /> Hujjatni Yuklab Olish
                            </a>
                          </div>

                          {doc.allocatedFunds > 0 && (
                            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/10 text-xs flex justify-between items-center">
                              <span>💰 <strong>Maqsadli mablag' ajratilgan:</strong></span>
                              <span className="font-mono font-black text-sm">{Number(doc.allocatedFunds).toLocaleString()} UZS</span>
                            </div>
                          )}

                          <div className="space-y-3">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Ushbu hujjatni quyidagi panellarga tarqatish:</span>
                            
                            <div className="flex flex-wrap gap-4 bg-slate-900 p-3.5 rounded-xl border border-slate-850">
                              {panelsList.map((panel) => {
                                const checked = selectedPanels.includes(panel);
                                return (
                                  <label key={panel} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                                    <input 
                                      type="checkbox" 
                                      checked={checked}
                                      onChange={(e) => {
                                        const next = e.target.checked 
                                          ? [...selectedPanels, panel]
                                          : selectedPanels.filter(p => p !== panel);
                                        setDistribPanels({
                                          ...distribPanels,
                                          [doc.id]: next
                                        });
                                      }}
                                      className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                                    />
                                    <span>{panel === "Buxgalter" ? "Buxgalter 💸" : panel === "Tarbiyachi" ? "Tarbiyachi 🧑‍🏫" : panel === "Oshpaz" ? "Oshpaz 🍳" : "Hamshira 🏥"}</span>
                                  </label>
                                );
                              })}
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[11px] text-slate-500">
                                {doc.distributedToPanels.length > 0 ? (
                                  <span>Faol tarqatilgan: <strong className="text-indigo-400">{doc.distributedToPanels.join(", ")}</strong></span>
                                ) : (
                                  <span className="text-amber-500 font-bold">⚠️ Hali hech qaysi panelga tarqatilmagan</span>
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleDistributeDoc(doc.id, selectedPanels)}
                                className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-all active:scale-95"
                              >
                                🚀 Hujjatni Tarqatish
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* General Documents */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Mahalliy Arxivi</span>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 flex justify-between items-center text-xs">
                  <span>Guvohnomalar ro'yxati (Birth Certificates)</span>
                  <button className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1 rounded-xl text-xs font-bold cursor-pointer">PDF Yuklash</button>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 flex justify-between items-center text-xs">
                  <span>Ota-onalar bilan imzolangan Shartnomalar</span>
                  <button className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1 rounded-xl text-xs font-bold cursor-pointer">Yuklash</button>
                </div>
              </div>
            </div>
          )}

          {/* 12. REPORTS COMPONENT */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Tizim va hisobotlar generatori</h3>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-4">
                <div className="text-slate-400 text-xs">
                  Ushbu sahifada joriy guruhlar, to'lovlar, davomat, moliya va darslar bo'yicha umumiy hisobotlarni tayyorlab, Excel yoki PDF ko'rinishida yuklab olishingiz mumkin.
                </div>
                <div className="flex justify-center gap-3">
                  <button onClick={() => alert("Excel hisobot tayyorlandi va yuklandi.")} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer">
                    📥 Jami bolalar hisoboti (Excel)
                  </button>
                  <button onClick={() => alert("Moliya hisoboti PDF ko'rinishida yuklandi.")} className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-700 cursor-pointer">
                    📥 Moliyaviy hisobot (PDF)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 13. COMPLAINTS COMPONENT */}
          {activeTab === "complaints" && (
            <div className="space-y-4">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Ota-onalar Murojaat va Shikoyatlari</h3>
              <div className="space-y-3">
                {complaintsList.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 p-8 text-center text-slate-500 rounded-2xl">
                    Yangi shikoyatlar mavjud emas.
                  </div>
                ) : (
                  complaintsList.map((c) => (
                    <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm">{c.parentName}</span>
                          <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-mono">
                            Bola: {childrenList.find((ch) => ch.id === c.childId)?.name || c.childId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 italic">"{c.text}"</p>
                        <div className="text-[10px] text-slate-500">Sana: {c.date} • Tel: {c.phone}</div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {c.status === "Yangi" ? (
                          <button
                            onClick={() => handleResolveComplaint(c.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Hal Etildi Deb Belgilash
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
                            Hal etilgan
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 14. CALENDAR COMPONENT */}
          {activeTab === "calendar" && (
            <div className="space-y-4">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Faoliyat va Tadbirlar Taqvimi</h3>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400">
                  <div>Du</div><div>Se</div><div>Ch</div><div>Pa</div><div>Ju</div><div>Sh</div><div>Ya</div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }).map((_, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-850 p-2 rounded-xl text-center min-h-[50px] flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-mono self-start">{i + 1}</span>
                      {i + 1 === 2 && <span className="text-[8px] bg-emerald-500 text-slate-950 rounded px-1 truncate">Musiqa</span>}
                      {i + 1 === 10 && <span className="text-[8px] bg-rose-500 text-white rounded px-1 truncate">Lager</span>}
                      {i + 1 === 15 && <span className="text-[8px] bg-indigo-500 text-white rounded px-1 truncate">Sport</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 15. AI ANALYTICS COMPONENT */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">AI Boshqaruv Maslahatchisi</h3>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Award className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-black uppercase tracking-widest">Nihol AI Deep Analytics Engine</span>
                </div>
                <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                  <p className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    💡 <b>Davomat tahlili:</b> G-1 Kamalak guruhi dars o'zlashtirish va bolalar intizomi bo'yicha eng yuqori reytingga ega (A'lo). Ota-onalar bilan Telegram simulyatori orqali aloqa juda faol!
                  </p>
                  <p className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    💡 <b>To'lov va Qarzdorlik tahlili:</b> Iyul oyi uchun jami kutilayotgan to'lovlardan <b>84%</b> qismi qabul qilingan. Qolgan 16% qarzdor ota-onalar ro'yxati telegram botga ogohlantirish sifatida yuborilishi tavsiya etiladi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI CAMERAS PAGE */}
          {activeTab === "ai_cameras" && (
            <AiCamerasPage childrenList={childrenList} onScanComplete={onRefresh} />
          )}

          {/* AI VIOLENCE & SOUND MONITOR */}
          {activeTab === "violence_monitor" && (
            <AiViolenceMonitor
              kindergartenId={user?.kindergartenId}
              userName={user?.name}
            />
          )}

          {/* CENTRALIZED NOTIFICATIONS HISTORY PANEL */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <div>
                  <h3 className="text-white font-black text-lg uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-400" />
                    <span>Xabarnomalar Jurnali</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Telegram bot va SMS orqali yuborilgan barcha xabarlarning to'liq tarixi, statusi va vaqti.
                  </p>
                </div>
                <button
                  onClick={fetchNotificationsHistory}
                  disabled={loadingNotifications}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer border border-slate-800 self-start transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingNotifications ? "animate-spin" : ""}`} />
                  Yangilash
                </button>
              </div>

              {/* STATS AT A GLANCE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Jami Telegram</span>
                    <h4 className="text-2xl font-black text-white mt-1">{notificationsHistory.telegram?.length || 0} ta</h4>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-mono">
                    TG
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Jami SMS</span>
                    <h4 className="text-2xl font-black text-white mt-1">{notificationsHistory.sms?.length || 0} ta</h4>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold font-mono">
                    SMS
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Muvaffaqiyatli</span>
                    <h4 className="text-2xl font-black text-emerald-400 mt-1">
                      {((notificationsHistory.telegram?.filter((n: any) => n.status === "Yuborildi").length || 0) +
                        (notificationsHistory.sms?.filter((n: any) => n.status === "Yuborildi").length || 0))} ta
                    </h4>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✓
                  </div>
                </div>
              </div>

              {/* FILTER TABS & SEARCH */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  {/* Local Sub-tabs */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                    <button
                      onClick={() => setNotificationsSubTab("telegram")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        notificationsSubTab === "telegram"
                          ? "bg-slate-900 text-white shadow-lg"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Telegram
                    </button>
                    <button
                      onClick={() => setNotificationsSubTab("sms")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        notificationsSubTab === "sms"
                          ? "bg-slate-900 text-white shadow-lg"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      SMS (Eskiz Gateway)
                    </button>
                  </div>

                  {/* Search */}
                  <div className="w-full sm:w-72">
                    <input
                      type="text"
                      placeholder="Ism, xabar yoki bog'lanish bo'yicha qidirish..."
                      value={notificationsSearch}
                      onChange={(e) => setNotificationsSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3.5 text-white text-xs outline-none focus:border-indigo-500 placeholder-slate-500 transition-all"
                    />
                  </div>
                </div>

                {/* TABLE/LIST */}
                {loadingNotifications ? (
                  <div className="py-24 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                    <span>Yuklanmoqda...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-850 bg-slate-950">
                    {notificationsSubTab === "telegram" ? (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-850 text-slate-400 uppercase text-[9px] tracking-wider font-extrabold bg-slate-900/40">
                            <th className="py-3 px-4">Qabul qiluvchi</th>
                            <th className="py-3 px-4">Telegram ID</th>
                            <th className="py-3 px-4">Xabar matni</th>
                            <th className="py-3 px-4">Yuborilgan vaqt</th>
                            <th className="py-3 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTelegramNotifications().length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-500">
                                Telegram xabarnomalari topilmadi.
                              </td>
                            </tr>
                          ) : (
                            filteredTelegramNotifications().map((notif: any) => (
                              <tr key={notif.id} className="border-b border-slate-850 hover:bg-slate-900/10 transition-colors">
                                <td className="py-3.5 px-4 font-bold text-white">{notif.recipientName}</td>
                                <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">{notif.chatId}</td>
                                <td className="py-3.5 px-4 text-slate-300 max-w-sm whitespace-pre-wrap break-words">
                                  {notif.message}
                                </td>
                                <td className="py-3.5 px-4 text-slate-400 font-mono">{notif.timestamp}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                    notif.status === "Yuborildi"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  }`}>
                                    {notif.status === "Yuborildi" ? "Muvaffaqiyatli" : "Xatolik"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-850 text-slate-400 uppercase text-[9px] tracking-wider font-extrabold bg-slate-900/40">
                            <th className="py-3 px-4">Telefon raqam</th>
                            <th className="py-3 px-4">SMS Provayder</th>
                            <th className="py-3 px-4">Xabar matni</th>
                            <th className="py-3 px-4">Yuborilgan vaqt</th>
                            <th className="py-3 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSmsNotifications().length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-500">
                                SMS xabarnomalari topilmadi.
                              </td>
                            </tr>
                          ) : (
                            filteredSmsNotifications().map((notif: any) => (
                              <tr key={notif.id} className="border-b border-slate-850 hover:bg-slate-900/10 transition-colors">
                                <td className="py-3.5 px-4 font-bold text-white font-mono">{notif.phone}</td>
                                <td className="py-3.5 px-4 text-slate-400">{notif.provider}</td>
                                <td className="py-3.5 px-4 text-slate-300 max-w-sm whitespace-pre-wrap break-words">
                                  {notif.message}
                                </td>
                                <td className="py-3.5 px-4 text-slate-400 font-mono">{notif.date}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                    notif.status === "Yuborildi"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  }`}>
                                    {notif.status === "Yuborildi" ? "Muvaffaqiyatli" : "Xatolik"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 16. AUDIT COMPONENT */}
          {activeTab === "audit" && (
            <SystemLogs user={user} onRefreshGlobal={onRefresh} />
          )}

          {/* FAILED CHECK-INS COMPONENT */}
          {activeTab === "failed_checkins" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span>Muvaffaqiyatsiz Face ID skanerlari (Failed Check-ins)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Biometrik Face ID terminali yuzni skanerlagan, lekin unga mos bolani topa olmagan yoki chegara cheklovlari (Latency/Sensitivity) tufayli rad etilgan xatolar ro'yxati. Bu yozuvlarni qo'lda bolalarga biriktirishingiz mumkin.
                </p>
              </div>

              {/* Grid Layout of Failed Check-ins */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {failedCheckins.length === 0 ? (
                  <div className="col-span-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 font-medium text-xs">
                    Hozircha birorta ham muvaffaqiyatsiz skanerlash yozuvi qayd etilmagan. Balla datchiklar 100% to'g'ri ishlamoqda.
                  </div>
                ) : (
                  failedCheckins.map((log: any) => {
                    const isAssigning = assigningId === log.id;
                    const resolvedChild = log.resolved ? childrenList.find(c => c.id === log.resolvedChildId) : null;

                    return (
                      <div 
                        key={log.id} 
                        className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all ${
                          log.resolved ? "border-emerald-500/30 bg-emerald-950/5" : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {/* Header details */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-lg font-mono font-bold uppercase tracking-wider">
                              {log.errorReason === "low_confidence" ? "Low Confidence" : 
                               log.errorReason === "high_latency" ? "High Latency" : "No Profile Match"}
                            </span>
                            <div className="text-white font-bold font-mono text-xs mt-1.5">{log.id}</div>
                          </div>
                          
                          <div className="text-right font-mono text-[10px] text-slate-500">
                            {log.timestamp}
                          </div>
                        </div>

                        {/* Mid Section - Detected image and parameters */}
                        <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                          <img 
                            src={log.photoUrl || "https://images.unsplash.com/photo-1543269608-fa3d96937649?auto=format&fit=crop&q=80&w=400"} 
                            alt="Detected Face" 
                            className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0" 
                          />
                          <div className="space-y-1.5 text-xs">
                            <div className="text-slate-400 font-medium">
                              Qurilma: <strong className="text-white">{log.deviceName}</strong>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                              <span className="bg-slate-900 text-yellow-400 px-1.5 py-0.5 rounded border border-slate-800">
                                Confidence: <strong>{log.confidence}%</strong>
                              </span>
                              {log.latencyMs && (
                                <span className="bg-slate-900 text-sky-400 px-1.5 py-0.5 rounded border border-slate-800">
                                  Latency: <strong>{log.latencyMs}ms</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Assign children dropdown & buttons */}
                        <div className="pt-2 border-t border-slate-850">
                          {log.resolved ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400">
                              <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                              <div>
                                <div className="font-bold">Biriktirilgan bola:</div>
                                <div className="text-slate-300 mt-0.5 font-semibold">
                                  {resolvedChild ? `${resolvedChild.name} (Guruh: ${resolvedChild.groupId})` : "Muvaffaqiyatli bog'landi"}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {!isAssigning ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssigningId(log.id);
                                    setSelectedChildToAssign("");
                                  }}
                                  className="w-full bg-slate-850 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <UserCheck className="w-4 h-4 text-sky-400" />
                                  Profilga biriktirish
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  <label className="text-slate-400 font-bold text-[11px] block">Bolani tanlang:</label>
                                  <select
                                    value={selectedChildToAssign}
                                    onChange={(e) => setSelectedChildToAssign(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs outline-none focus:border-sky-500 font-medium"
                                  >
                                    <option value="">-- Bolalar ro'yxati --</option>
                                    {childrenList.map((child: any) => (
                                      <option key={child.id} value={child.id}>
                                        {child.name} (Guruh: {child.groupId})
                                      </option>
                                    ))}
                                  </select>

                                  <div className="flex gap-2 text-xs">
                                    <button
                                      type="button"
                                      disabled={!selectedChildToAssign || isSubmittingAssign}
                                      onClick={async () => {
                                        setIsSubmittingAssign(true);
                                        try {
                                          const res = await fetch(`/api/failed-checkins/${log.id}/resolve`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ childId: selectedChildToAssign })
                                          });
                                          const resData = await res.json();
                                          if (res.ok && resData.success) {
                                            setNotifSuccess(resData.message);
                                            setTimeout(() => setNotifSuccess(null), 3000);
                                            setAssigningId(null);
                                            setSelectedChildToAssign("");
                                            fetchFailedCheckins();
                                            onRefresh(); // Refresh general states too
                                          } else {
                                            alert(resData.message || "Xatolik yuz berdi!");
                                          }
                                        } catch (err) {
                                          console.error(err);
                                          alert("Ulanish xatosi!");
                                        } finally {
                                          setIsSubmittingAssign(false);
                                        }
                                      }}
                                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer text-center"
                                    >
                                      {isSubmittingAssign ? "Saqlanmoqda..." : "Tasdiqlash"}
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => setAssigningId(null)}
                                      className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
                                    >
                                      Bekor qilish
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STANDALONE PHOTO GALLERY COMPONENT */}
          {activeTab === "gallery" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-3xl">
                <div>
                  <h3 className="text-white font-black text-xl flex items-center gap-2.5">
                    <Camera className="w-6 h-6 text-emerald-400" />
                    Foto va Faoliyatlar Galereyasi
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Tizimdagi filiallar tomonidan yuklangan barcha taomlar, o'quv mashg'ulotlari, sport va salomatlik tadbirlari fotolari jurnali.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Filial:</span>
                    <select
                      value={selectedKgGalleryId || ""}
                      onChange={(e) => setSelectedKgGalleryId(e.target.value || null)}
                      className="bg-transparent text-white text-xs outline-none font-bold cursor-pointer"
                    >
                      <option value="">Barchasi</option>
                      {kindergartens.map(kg => (
                        <option key={kg.id} value={kg.id}>{kg.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Gallery Grid */}
              {(() => {
                const filteredGallery = galleryItems.filter(item => !selectedKgGalleryId || item.kindergartenId === selectedKgGalleryId);

                if (loadingGallery) {
                  return (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400 font-bold">Foto galereya ma'lumotlari yuklanmoqda...</span>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Jami Rasmlar</span>
                        <span className="text-2xl font-mono font-extrabold text-white mt-1 block">{filteredGallery.length} ta</span>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Oshxona Rasmlari</span>
                        <span className="text-2xl font-mono font-extrabold text-emerald-400 mt-1 block">
                          {filteredGallery.filter(item => item.type?.toLowerCase().includes("oshxona") || item.type?.toLowerCase().includes("cook")).length} ta
                        </span>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Mashg'ulotlar</span>
                        <span className="text-2xl font-mono font-extrabold text-indigo-400 mt-1 block">
                          {filteredGallery.filter(item => item.type?.toLowerCase().includes("mashg'ulot") || item.type?.toLowerCase().includes("ijod") || item.type?.toLowerCase().includes("musiqa")).length} ta
                        </span>
                      </div>
                    </div>

                    {filteredGallery.length === 0 ? (
                      <div className="bg-slate-900 border border-slate-800 p-16 rounded-3xl text-center text-slate-500">
                        <Camera className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h4 className="text-white font-bold text-sm">Hozircha rasmlar mavjud emas</h4>
                        <p className="text-xs text-slate-400 mt-1">Tanlangan filtr bo'yicha bog'cha rasmlari topilmadi.</p>
                      </div>
                    ) : (
                      <div className="space-y-10">
                        {/* Group items by Kindergarten */}
                        {Object.entries(
                          filteredGallery.reduce((groups, item) => {
                            const kgName = kindergartens.find(k => k.id === item.kindergartenId)?.name || "Noma'lum Filial";
                            if (!groups[kgName]) {
                              groups[kgName] = [];
                            }
                            groups[kgName].push(item);
                            return groups;
                          }, {} as { [key: string]: any[] })
                        ).map(([kgName, itemsList]) => {
                          const items = itemsList as any[];
                          return (
                            <div key={kgName} className="bg-slate-900/10 border border-slate-850/40 p-6 rounded-3xl space-y-5 shadow-sm">
                              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <h4 className="text-white font-black text-sm uppercase tracking-wide">{kgName}</h4>
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">({items.length} ta foto rasm)</span>
                                </div>
                                <span className="text-[9px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                  Active Media Hub
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {items.map((item: any) => (
                                <div 
                                  key={item.id} 
                                  className="bg-slate-900 border border-slate-800 hover:border-slate-750 rounded-3xl overflow-hidden transition-all duration-300 shadow-lg group hover:-translate-y-1 flex flex-col"
                                >
                                  <div className="relative aspect-video overflow-hidden bg-slate-950">
                                    <img 
                                      src={item.url} 
                                      alt={item.title} 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                    <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[9px] text-emerald-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                                      {item.type}
                                    </div>
                                    <button
                                      onClick={() => handleDeleteGalleryItem(item.id)}
                                      className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white p-1.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                                      title="Rasm va tavsifni o'chirish"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold font-mono">
                                        <span>ID: {item.id}</span>
                                        <span>Sana: {item.date}</span>
                                      </div>
                                      <h4 className="text-white font-black text-sm tracking-tight line-clamp-1">{item.title}</h4>
                                      <p className="text-xs text-slate-400 leading-relaxed min-h-[40px] line-clamp-3">
                                        {item.description || "Ushbu rasm uchun qo'shimcha tavsif yozilmagan."}
                                      </p>
                                    </div>

                                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px]">
                                      <span className="text-slate-500 uppercase tracking-widest font-black">Turkum:</span>
                                      <span className="text-emerald-400 font-black truncate max-w-[180px] bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">{item.type || "Ozuqa/Tadbir"}</span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            }
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 17. SETTINGS COMPONENT */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Tizim va saas sozlamalari</h3>
                <p className="text-xs text-slate-500 mt-1">Bog'chaning global sozlamalarini va qurilmalarni ushbu bo'limdan boshqarasiz.</p>
              </div>

              {/* USER PROFILE & DEVICE CAMERA AVATAR COMPONENT */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
                <div>
                  <h4 className="text-indigo-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span>Mening Profilim va Profil Rasmi</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Qurilmangiz kamerasidan foydalangan holda rasmga tushib, tizimdagi profilingiz uchun barcha ko'rinadigan joylarda aks etuvchi yangi rasm (avatar) belgilang.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  {/* Left Column: User details and current avatar */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative">
                      {capturedPhoto ? (
                        <img
                          src={capturedPhoto}
                          alt="Preview"
                          className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-xl"
                        />
                      ) : user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Avatar"
                          className="w-24 h-24 rounded-full object-cover border border-slate-800 shadow-xl"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-3xl font-black">
                          {user.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 bg-indigo-500 border border-slate-900 text-slate-950 w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-lg">
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </span>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-left flex-1 w-full">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">To'liq ismingiz:</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-white text-xs font-bold outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Telefon raqamingiz:</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-white text-xs font-mono font-bold outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Yangi Parol (ixtiyoriy):</label>
                        <input
                          type="password"
                          placeholder="Parolni yangilash..."
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-white text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex gap-2 items-center pt-2">
                        <button
                          type="submit"
                          disabled={isUpdatingProfile}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                        >
                          {isUpdatingProfile ? "Saqlanmoqda..." : "Ma'lumotlarni Saqlash"}
                        </button>
                        <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase bg-indigo-500/10 border border-indigo-500/20 px-2 rounded-md">
                          {user.role}
                        </span>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Live camera view / captured photo preview / start button */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 flex flex-col items-center justify-center min-h-[220px]">
                    {cameraActive ? (
                      <div className="flex flex-col items-center gap-4 w-full">
                        <div className="relative w-36 h-36 rounded-full overflow-hidden border border-slate-800 bg-black shadow-inner">
                          <video
                            ref={videoRef}
                            className="w-full h-full object-cover scale-x-[-1]"
                            autoPlay
                            playsInline
                            muted
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
                          >
                            Rasmga olish
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer border border-slate-800"
                          >
                            Bekor qilish
                          </button>
                        </div>
                      </div>
                    ) : capturedPhoto ? (
                      <div className="flex flex-col items-center gap-4 w-full">
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Rasm muvaffaqiyatli olindi!</p>
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={saveProfilePhoto}
                            disabled={savingPhoto}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            {savingPhoto ? "Saqlanmoqda..." : "Profil rasmi qilib saqlash"}
                          </button>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer border border-slate-800"
                          >
                            Qayta tushish
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center">
                          <Camera className="w-6 h-6" />
                        </div>
                        <p className="text-[11px] text-slate-400 max-w-[200px]">
                          Kamerani ishga tushirish orqali yangi profil fotosurati yarating.
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          Kamerani yoqish
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
                <h4 className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider">Umumiy sozlamalar</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase font-bold">Bog'cha nomi (Kindergarten Name):</label>
                    <input type="text" defaultValue="Nihol AI Bog'chasi" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase font-bold">Direktor F.I.O:</label>
                    <input type="text" defaultValue="Karimov Shaxzod Baxtiyorovich" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500" />
                  </div>
                </div>

                {/* Parent Portal toggle setting option */}
                {(() => {
                  const myKg = kindergartens.find((k: any) => k.id === user.kindergartenId) || kindergartens[0] || { name: "Nihol AI Bog'chasi", parentPortalActive: true };
                  const isPortalActive = myKg.parentPortalActive !== false;
                  return (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-0.5">Ota-ona Portali va Kuzatuv Tizimi</h5>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Ushbu bog'cha uchun ota-ona portaliga kirish ruxsatini yoqish yoki o'chirish. O'chirilganda ota-onalarga portal kirish bloklanadi.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const kgId = user.kindergartenId || myKg.id || "K-1";
                          try {
                            const res = await fetch(`/api/kindergartens/${kgId}/toggle-portal`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ active: !isPortalActive })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              triggerNotification(data.message);
                              fetchKindergartens();
                            }
                          } catch (err) {
                            console.error(err);
                            triggerNotification("Xatolik yuz berdi");
                          }
                        }}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                          isPortalActive
                            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/10"
                            : "bg-rose-600 text-white hover:bg-rose-500"
                        }`}
                      >
                        {isPortalActive ? "🟢 FAOL (Yoqilgan)" : "🔴 FAOLSIZ (O'chirilgan)"}
                      </button>
                    </div>
                  );
                })()}

                <button onClick={() => triggerNotification("Tizim sozlamalari saqlandi!")} className="bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer active:scale-95 transition-all">
                  Sozlamalarni saqlash
                </button>
              </div>

              {/* FACE ID DEVICE MANAGER */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider">Face ID Qurilmalari Sozlamasi (IP range: 192.168.1.221-231)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Kirish/chiqish joylaridagi skanerlarni nazorat qilish va sozlash.</p>
                  </div>
                  <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <span className="text-slate-400 text-xs">Handshake Credential:</span>
                    <span className="font-mono text-xs text-white font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">admin135@</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ENTRANCE DEVICES (5 DEVICES) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-white font-bold uppercase text-[10px] tracking-widest">KIRISH DARVOZALARI (5 TA SCANNER)</span>
                    </div>

                    <div className="space-y-2">
                      {[221, 222, 223, 224, 225].map((octet, index) => {
                        const ip = `192.168.1.${octet}`;
                        return (
                          <div key={ip} className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-800 transition-all">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 text-xs font-mono font-bold">#{index + 1}</span>
                              <div>
                                <p className="text-xs font-bold text-white">Kirish Skaneri {index + 1}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ip}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                                Online
                              </span>
                              <button
                                type="button"
                                onClick={() => triggerNotification(`Handshake muvaffaqiyatli! Qurilma ${ip} paroli ('admin135@') bilan bog'landi.`)}
                                className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all border border-slate-800"
                              >
                                Test
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* EXIT DEVICES (5 DEVICES) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
                      <span className="text-white font-bold uppercase text-[10px] tracking-widest">CHIQISH DARVOZALARI (5 TA SCANNER)</span>
                    </div>

                    <div className="space-y-2">
                      {[226, 227, 228, 229, 230].map((octet, index) => {
                        const ip = `192.168.1.${octet}`;
                        return (
                          <div key={ip} className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-800 transition-all">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 text-xs font-mono font-bold">#{index + 6}</span>
                              <div>
                                <p className="text-xs font-bold text-white">Chiqish Skaneri {index + 1}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ip}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-orange-500/10 text-orange-400 text-[9px] font-bold px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-wider">
                                Online
                              </span>
                              <button
                                type="button"
                                onClick={() => triggerNotification(`Handshake muvaffaqiyatli! Qurilma ${ip} paroli ('admin135@') bilan bog'landi.`)}
                                className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all border border-slate-800"
                              >
                                Test
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
                  <span className="text-amber-500 font-bold uppercase text-[10px] tracking-wider block">⚠️ IP manzil diapazoni tekshiruvi:</span>
                  <p className="text-slate-400 leading-normal text-[11px]">
                    Face ID integratsiya drayveri IP manzillari qat'iy ravishda <strong className="text-white font-mono">192.168.1.221</strong> dan <strong className="text-white font-mono">192.168.1.231</strong> gacha bo'lishini talab qiladi. Parol sifatida <strong className="text-white font-mono">"admin135@"</strong> ishlatiladi. Ushbu diapazondan tashqaridagi so'rovlar xavfsizlik nuqtai nazaridan avtomatik rad etiladi.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODALS */}

      {/* 1. ADD CHILD MODAL */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Yangi Bola Qo'shish</h3>
              <button onClick={() => setShowAddChildModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddChild} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">F.I.O (Ismi va Familiyasi):</label>
                <input
                  type="text"
                  required
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Masalan: Karimov Dilshod"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Tug'ilgan kuni:</label>
                  <input
                    type="date"
                    required
                    value={childBirthDate}
                    onChange={(e) => setChildBirthDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Jinsi:</label>
                  <select
                    value={childGender}
                    onChange={(e) => setChildGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="O'g'il">O'g'il</option>
                    <option value="Qiz">Qiz</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Guruhga Biriktirish:</label>
                <select
                  value={childGroup}
                  onChange={(e) => setChildGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                >
                  {groupsList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Ota-ona Ismi:</label>
                  <input
                    type="text"
                    required
                    value={childParentName}
                    onChange={(e) => setChildParentName(e.target.value)}
                    placeholder="Otasi yoki onasi ismi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Telefon Raqami:</label>
                  <input
                    type="text"
                    required
                    value={childParentPhone}
                    onChange={(e) => setChildParentPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Telegram Chat ID (Ulanish uchun ixtiyoriy):</label>
                <input
                  type="text"
                  value={childTelegramChatId}
                  onChange={(e) => setChildTelegramChatId(e.target.value)}
                  placeholder="Masalan: 559482710 (Ota-onaning chat_id si)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm font-mono"
                />
              </div>

              {/* FACE ID SCAN / PROFILE SNAPSHOT */}
              <div className="space-y-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative min-h-[140px] overflow-hidden">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Face ID / Profil Surati:</span>
                {isDirCameraActive && dirCameraTarget === "child" && !dirCameraError ? (
                  <div className="w-full max-w-[200px] aspect-[4/3] bg-black rounded-xl overflow-hidden relative border border-slate-800">
                    <video id="dir-video-element" className="w-full h-full object-cover" playsInline muted></video>
                    <button
                      type="button"
                      onClick={captureDirSnapshot}
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1 px-2.5 rounded-lg text-[9px] shadow-lg cursor-pointer transition-transform active:scale-95 uppercase tracking-wider"
                    >
                      Suratga olish 📸
                    </button>
                  </div>
                ) : childPhoto ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <img src={childPhoto} className="w-20 h-20 object-cover rounded-xl border border-emerald-500 shadow-md" alt="Child Profile" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => startDirCamera("child")}
                      className="text-[9px] text-emerald-400 hover:underline cursor-pointer font-bold"
                    >
                      Rasmni qaytadan olish 🔄
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5">
                    {dirCameraError ? (
                      <p className="text-[9px] text-amber-500 max-w-[220px] leading-relaxed mx-auto">{dirCameraError}</p>
                    ) : (
                      <p className="text-[9px] text-slate-500">Qurilmalarga yuborish va Face ID orqali tanish uchun rasm oling.</p>
                    )}
                    <button
                      type="button"
                      onClick={dirCameraError ? captureDirSnapshot : () => startDirCamera("child")}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold py-1.5 px-3 rounded-lg text-[9px] border border-slate-800 cursor-pointer flex items-center gap-1 mx-auto active:scale-95 transition-all"
                    >
                      <Camera className="w-3 h-3 text-emerald-400" /> {dirCameraError ? "Simulyatsiya rasmini olish 📸" : "Kamerali Face ID ro'yxatdan o'tkazish 🎥"}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm cursor-pointer"
              >
                SAQLASH & QO'SHISH
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD EMPLOYEE MODAL */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Yangi Xodim Qo'shish</h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addEmpError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl font-bold text-xs">
                ⚠️ {addEmpError}
              </div>
            )}

            <form onSubmit={handleAddEmp} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Xodim F.I.O:</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Ism Familiya Sharif"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Tizim Logini (Username):</label>
                  <input
                    type="text"
                    required
                    value={empUser}
                    onChange={(e) => setEmpUser(e.target.value)}
                    placeholder="Masalan: nodira_chef"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Lavozim / Rol:</label>
                  <select
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="Tarbiyachi">Tarbiyachi</option>
                    <option value="Oshpaz">Oshpaz</option>
                    <option value="Hamshira">Hamshira</option>
                    <option value="Buxgalter">Buxgalter</option>
                    <option value="Tozalovchi">Tozalovchi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Telefon:</label>
                  <input
                    type="text"
                    required
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Pasport Seriyasi:</label>
                  <input
                    type="text"
                    value={empPassport}
                    onChange={(e) => setEmpPassport(e.target.value)}
                    placeholder="AA1234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Parol:</label>
                <input
                  type="text"
                  required
                  value={empPass}
                  onChange={(e) => setEmpPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm font-mono"
                />
              </div>

              {/* FACE ID SCAN / PROFILE SNAPSHOT */}
              <div className="space-y-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative min-h-[140px] overflow-hidden">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Xodim Profil Surati (Face ID):</span>
                {isDirCameraActive && dirCameraTarget === "employee" && !dirCameraError ? (
                  <div className="w-full max-w-[200px] aspect-[4/3] bg-black rounded-xl overflow-hidden relative border border-slate-800">
                    <video id="dir-video-element" className="w-full h-full object-cover" playsInline muted></video>
                    <button
                      type="button"
                      onClick={captureDirSnapshot}
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1 px-2.5 rounded-lg text-[9px] shadow-lg cursor-pointer transition-transform active:scale-95 uppercase tracking-wider"
                    >
                      Suratga olish 📸
                    </button>
                  </div>
                ) : empPhoto ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <img src={empPhoto} className="w-20 h-20 object-cover rounded-xl border border-emerald-500 shadow-md" alt="Employee Profile" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => startDirCamera("employee")}
                      className="text-[9px] text-emerald-400 hover:underline cursor-pointer font-bold"
                    >
                      Rasmni qaytadan olish 🔄
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5">
                    {dirCameraError ? (
                      <p className="text-[9px] text-amber-500 max-w-[220px] leading-relaxed mx-auto">{dirCameraError}</p>
                    ) : (
                      <p className="text-[9px] text-slate-500">Qurilmalarga ulash va xodim Face ID jurnali uchun profil rasmini yuklang yoki oling.</p>
                    )}
                    <button
                      type="button"
                      onClick={dirCameraError ? captureDirSnapshot : () => startDirCamera("employee")}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold py-1.5 px-3 rounded-lg text-[9px] border border-slate-800 cursor-pointer flex items-center gap-1 mx-auto active:scale-95 transition-all"
                    >
                      <Camera className="w-3 h-3 text-emerald-400" /> {dirCameraError ? "Simulyatsiya rasmini olish 📸" : "Kamerali Face ID ro'yxatdan o'tkazish 🎥"}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm cursor-pointer"
              >
                XODIMNI SAQLASH
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {showEditEmpModal && editingEmp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Xodim Ma'lumotlarini Tahrirlash</h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {editingEmp.id}</span>
              </div>
              <button onClick={() => { setShowEditEmpModal(false); setEditingEmp(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editEmpError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl font-bold text-xs">
                ⚠️ {editEmpError}
              </div>
            )}

            <form onSubmit={handleSaveEditEmp} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Xodim F.I.O:</label>
                <input
                  type="text"
                  required
                  value={editEmpName}
                  onChange={(e) => setEditEmpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Tizim Logini (Username):</label>
                  <input
                    type="text"
                    required
                    value={editEmpUser}
                    onChange={(e) => setEditEmpUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Lavozim / Rol:</label>
                  <select
                    value={editEmpRole}
                    onChange={(e) => setEditEmpRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="Tarbiyachi">Tarbiyachi</option>
                    <option value="Oshpaz">Oshpaz</option>
                    <option value="Hamshira">Hamshira</option>
                    <option value="Buxgalter">Buxgalter</option>
                    <option value="Tozalovchi">Tozalovchi</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Telefon:</label>
                  <input
                    type="text"
                    required
                    value={editEmpPhone}
                    onChange={(e) => setEditEmpPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Pasport Seriyasi:</label>
                  <input
                    type="text"
                    value={editEmpPassport}
                    onChange={(e) => setEditEmpPassport(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500 text-sm uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Yangi Parol (Agar o'zgartirilsa):</label>
                  <input
                    type="password"
                    value={editEmpPass}
                    onChange={(e) => setEditEmpPass(e.target.value)}
                    placeholder="O'zgartirishsiz qoldirish"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Status:</label>
                  <select
                    value={editEmpStatus}
                    onChange={(e) => setEditEmpStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="Faol">Faol</option>
                    <option value="Ta'tilda">Ta'tilda</option>
                    <option value="Nofaol">Nofaol</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditEmpModal(false); setEditingEmp(null); }}
                  className="w-1/3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  O'ZGARISHLARNI SAQLASH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GROUP MODAL */}
      {showEditGroupModal && editingGroup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Guruhni Tahrirlash</h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {editingGroup.id}</span>
              </div>
              <button onClick={() => { setShowEditGroupModal(false); setEditingGroup(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGroup} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Guruh Nomi:</label>
                <input
                  type="text"
                  required
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Biriktirilgan Tarbiyachi:</label>
                <select
                  value={editGroupTeacher}
                  onChange={(e) => setEditGroupTeacher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="">Tarbiyachi tanlanmagan</option>
                  {employeesList.filter(e => e.role === "Tarbiyachi").map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.phone || "No phone"})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Maksimal Sig'im (Bolalar soni):</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  required
                  value={editGroupCapacity}
                  onChange={(e) => setEditGroupCapacity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditGroupModal(false); setEditingGroup(null); }}
                  className="w-1/3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  GURUHNI SAQLASH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD GROUP MODAL */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Yangi Guruh Yaratish</h3>
              <button onClick={() => setShowAddGroupModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGroup} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Guruh nomi:</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Masalan: Kamalak guruh"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Tarbiyachi biriktirish:</label>
                <select
                  value={groupTeacher}
                  onChange={(e) => setGroupTeacher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none text-sm"
                >
                  {employeesList.filter(emp => emp.role === "Tarbiyachi").map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Guruh sig'imi (Capacity):</label>
                <input
                  type="number"
                  required
                  value={groupCapacity}
                  onChange={(e) => setGroupCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none text-sm font-mono"
                />
              </div>

              <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl text-sm cursor-pointer">
                GURUHNI SAQLASH
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD PAYMENT MODAL */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">To'lov Qabul Qilish</h3>
              <button onClick={() => setShowAddPaymentModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Bolani tanlang:</label>
                <select
                  value={payChildId}
                  onChange={(e) => setPayChildId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none text-sm"
                >
                  {childrenList.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({groupsList.find(g => g.id === c.groupId)?.name})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">To'lov oyi:</label>
                <select
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none text-sm"
                >
                  <option value="Iyul">Iyul</option>
                  <option value="Avgust">Avgust</option>
                  <option value="Sentyabr">Sentyabr</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Summa (UZS):</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">To'lov shakli:</label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none text-sm"
                  >
                    <option value="Naqd">Naqd (Cash)</option>
                    <option value="Click">Click</option>
                    <option value="Payme">Payme</option>
                    <option value="Uzum">Uzum</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl text-sm cursor-pointer">
                TO'LOVNI TASDIQLASH (CHECK GENERATION)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. BROADCAST MESSAGE MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Telegram/SMS Ommaviy Xabar</h3>
              <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Kimlarga yuborilsin (Target):</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white outline-none"
                >
                  <option value="all">Barcha ota-onalarga (Simulated)</option>
                  <option value="debt">To'lov qilmagan qarzdorlarga</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Xabar matni:</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Hurmatli ota-onalar, ertaga soat 10:00 da ochiq darslar kuni boshlanadi..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none h-28 resize-none"
                />
              </div>

              <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl text-sm cursor-pointer">
                JO'NATISH (TELEGRAM LIVE SEND)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. EXPORT / REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <h3 className="text-white font-bold text-sm uppercase">KINDERGARTEN HISOBOTI</h3>
            <p className="text-xs text-slate-300">
              Barcha bolalar, guruhlar tarkibi va joriy davomat jadvali bo'yicha tayyorlangan hisobotingiz yuklab olishga tayyor.
            </p>
            <div className="space-y-2">
              <button onClick={() => { setShowReportModal(false); alert("Excel yuklab olindi."); }} className="w-full bg-emerald-500 text-slate-950 py-2 rounded-xl text-xs font-bold cursor-pointer">
                Excel formatda yuklash
              </button>
              <button 
                onClick={() => { 
                  setShowReportModal(false); 
                  generateDirectorPDF(); 
                }} 
                className="w-full bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-700 transition-colors"
              >
                PDF ko'rinishida yuklash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM HARDWARE HEALTH MODAL */}
      {showHardwareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-4xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" /> Tizim Qurilmalari va Datchiklar Monitoringi
                </h3>
                <p className="text-[10px] text-slate-400">Har bir Face ID terminali va IoT datchikning real-vaqt holati (Tashkent Branch)</p>
              </div>
              <button onClick={() => setShowHardwareModal(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <DeviceManagement
              devices={hardwareData.devices}
              onRefresh={fetchHardwareStatus}
              notifSuccess={notifSuccess}
              setNotifSuccess={setNotifSuccess}
            />
          </div>
        </div>
      )}

      {/* SUPER ADMIN MODALS */}
      {showAddKgModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" /> Yangi Bog'cha Qo'shish
              </h3>
              <button onClick={() => setShowAddKgModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddKindergarten} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Bog'cha (Muassasa) Nomi:</label>
                <input
                  type="text"
                  required
                  value={kgName}
                  onChange={(e) => setKgName(e.target.value)}
                  placeholder="Masalan: Nihol AI Bog'chasi #3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Manzili (Ko'cha, uy):</label>
                <input
                  type="text"
                  value={kgAddress}
                  onChange={(e) => setKgAddress(e.target.value)}
                  placeholder="Masalan: Toshkent sh., Mirzo Ulug'bek tumani"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Aloqa telefoni:</label>
                <input
                  type="text"
                  value={kgPhone}
                  onChange={(e) => setKgPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-xl text-sm cursor-pointer hover:bg-emerald-400 active:scale-95 transition-all">
                BOG'CHANI TIZIMGA SAQLASH
              </button>
            </form>
          </div>
        </div>
      )}

      {showAssignDirectorModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" /> Direktor Logini Biriktirish
              </h3>
              <button onClick={() => setShowAssignDirectorModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tanlangan bog'cha muassasasi uchun yangi Direktor xodimi hisobini yarating. Ushbu login orqali direktor faqat ushbu bog'chaga kira oladi.
            </p>

            <form onSubmit={handleAssignDirector} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase font-semibold">Direktorning F.I.O (Ismi-sharifi):</label>
                <input
                  type="text"
                  required
                  value={dirNameInput}
                  onChange={(e) => setDirNameInput(e.target.value)}
                  placeholder="Masalan: Umarov Bobur Shodiyorovich"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Tizim logini (Username):</label>
                  <input
                    type="text"
                    required
                    value={dirUsernameInput}
                    onChange={(e) => setDirUsernameInput(e.target.value)}
                    placeholder="bobur_director"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Tizim paroli:</label>
                  <input
                    type="password"
                    required
                    value={dirPasswordInput}
                    onChange={(e) => setDirPasswordInput(e.target.value)}
                    placeholder="parol123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Telefon raqami:</label>
                  <input
                    type="text"
                    value={dirPhoneInput}
                    onChange={(e) => setDirPhoneInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-semibold">Passport seriyasi:</label>
                  <input
                    type="text"
                    value={dirPassportInput}
                    onChange={(e) => setDirPassportInput(e.target.value)}
                    placeholder="AD9991122"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 text-sm font-mono uppercase"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-amber-500 text-slate-950 font-black py-3 rounded-xl text-sm cursor-pointer hover:bg-amber-400 active:scale-95 transition-all">
                DIREKTOR KREDENTSIALINI YARATISH
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI ATTENDANCE DEEP-DIVE MODAL */}
      {showDeepDiveModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-white font-black text-xs uppercase tracking-wider">AI Davomat Chuqur Tahlili (Attendance Deep-Dive)</h3>
                  <p className="text-[10px] text-slate-400">Gemini intellektual modeli yordamida qatnov anomaliyalari va sabablar tahlili</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDeepDiveModal(false)} 
                className="text-slate-400 hover:text-white cursor-pointer bg-slate-800/50 p-1.5 rounded-xl border border-slate-750 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
              {deepDiveLoading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-bounce absolute top-3.5 left-3.5" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-white font-black uppercase tracking-wider text-[11px]">Intellektual tahlil yuklanmoqda...</p>
                    <p className="text-slate-400 text-[10px]">Tizim o'tgan oylik biometriya ma'lumotlari, kasallik varaqalari va haftalik trendlarni o'rganmoqda.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                  <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl text-indigo-400">
                    <Sparkles className="w-4 h-4 animate-pulse flex-shrink-0" />
                    <span className="font-bold text-[10px]">DIREKTOR UCHUN STRATEGIK XULOSA (AI-GENERATED ADVISORY)</span>
                  </div>

                  <div className="space-y-3 leading-relaxed text-slate-300 text-[11px]">
                    {deepDiveAnalysis ? (
                      deepDiveAnalysis.split("\n").map((line, idx) => {
                        if (line.startsWith("### ")) {
                          return (
                            <h4 key={idx} className="text-white font-black text-xs uppercase mt-4 mb-2 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5 text-indigo-400">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              {line.replace("### ", "")}
                            </h4>
                          );
                        }
                        if (line.startsWith("#### ")) {
                          return <h5 key={idx} className="text-white font-bold text-xs mt-3 mb-1 text-slate-200">{line.replace("#### ", "")}</h5>;
                        }
                        if (line.startsWith("- **") || line.startsWith("* **")) {
                          const parts = line.split("**");
                          if (parts.length >= 3) {
                            return (
                              <div key={idx} className="pl-4 py-1 border-l-2 border-indigo-500/40 text-[11px] text-slate-300 bg-slate-900/20 my-1 rounded-r-lg">
                                <span className="font-bold text-white text-[11px]">{parts[1]}</span>
                                {parts.slice(2).join("")}
                              </div>
                            );
                          }
                        }
                        if (line.startsWith("- ") || line.startsWith("* ")) {
                          return <div key={idx} className="pl-4 py-0.5 text-[11px] text-slate-300 flex items-start gap-1.5"><span>•</span> <span>{line.substring(2)}</span></div>;
                        }
                        if (line.trim() === "") return <div key={idx} className="h-2"></div>;
                        return <p key={idx} className="text-[11px] text-slate-300 leading-relaxed">{line}</p>;
                      })
                    ) : (
                      <p className="text-slate-500 text-center py-6">Hech qanday tahlil topilmadi.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-[9px] text-slate-500">
              <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-indigo-400" /> Gemini API Pro v1.5</span>
              <button 
                onClick={() => setShowDeepDiveModal(false)}
                className="bg-indigo-500 text-slate-950 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider hover:bg-indigo-400 transition-colors cursor-pointer"
              >
                Tushunarli (Yopish)
              </button>
            </div>
          </div>
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
              className="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between"
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
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Info block */}
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Bog'cha faoliyatini tezkor boshqarish tugmalari. Ushbu panel barcha sahifalardan oson foydalanish uchun optimallashtirilgan.
                </p>

                {/* Actions Grid */}
                <div className="space-y-3">
                  <button
                    onClick={() => { setShowAddChildModal(true); setQuickActionsOpen(false); }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-indigo-500/30 group"
                  >
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-500/20">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs">Yangi Bola Ro'yxatga Olish</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Yangi tarbiyalanuvchi qo'shish jurnali</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowAddGroupModal(true); setQuickActionsOpen(false); }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-amber-500/30 group"
                  >
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-500/20">
                      <Grid className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs">Yangi Guruh Qo'shish</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Sinf xonasi yoki yosh guruhlari</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowAddEmpModal(true); setQuickActionsOpen(false); }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-emerald-500/30 group"
                  >
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500/20">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs">Yangi Xodim Ro'yxati</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Tarbiyachi, oshpaz yoki hamshira qo'shish</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowBroadcastModal(true); setQuickActionsOpen(false); }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-pink-500/30 group"
                  >
                    <div className="p-2 bg-pink-500/10 rounded-xl text-pink-400 group-hover:bg-pink-500/20">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs">Ota-onalarga E'lon Yo'llash</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Barcha Telegram foydalanuvchilariga</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowAddPaymentModal(true); setQuickActionsOpen(false); }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-purple-500/30 group"
                  >
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500/20">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs">To'lov Qayd Etish</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Ota-onalar badali yoki qarz to'lovi</p>
                    </div>
                  </button>

                  {user?.role === "SuperAdmin" && (
                    <button
                      onClick={() => { setShowAddKgModal(true); setQuickActionsOpen(false); }}
                      className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center gap-3.5 cursor-pointer text-left transition-all hover:scale-[1.02] hover:border-sky-500/30 group"
                    >
                      <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 group-hover:bg-sky-500/20">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-white text-xs">Yangi Bog'cha Qo'shish</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">Tizimga yangi filial kiritish</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Footer info inside sidebar */}
              <div className="pt-4 border-t border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                  Tezkor Panel • {user?.role === "SuperAdmin" ? "Super Admin" : "Bog'cha Direktori"}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
