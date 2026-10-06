import React, { useState, useEffect } from "react";
import {
  Calendar,
  Utensils,
  Award,
  CreditCard,
  Moon,
  Sparkle,
  Send,
  Sparkles,
  Phone,
  User,
  Activity,
  Printer,
  Info,
  CheckCircle,
  FileText,
  MapPin,
  Heart,
  Plus,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Child, Payment, MealPlan, DailyActivity, Group, Attendance, PublicAnnouncement } from "../types";

interface ParentPortalProps {
  chatId: string;
  onBackToApp?: () => void;
}

export default function ParentPortal({ chatId, onBackToApp }: ParentPortalProps) {
  const [currentChatId, setCurrentChatId] = useState(chatId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Loaded parent data
  const [child, setChild] = useState<Child | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"home" | "attendance" | "meals" | "health" | "payments" | "complaint">("home");

  // Local state for interactive actions
  const [complaintText, setComplaintText] = useState("");
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Link child form states
  const [linkChildId, setLinkChildId] = useState("");
  const [linkParentPhone, setLinkParentPhone] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parent-portal/data?chatId=${targetId}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Bog'lanishda xatolik yuz berdi.");
      }
      const data = await res.json();
      setChild(data.child);
      setPayments(data.payments || []);
      setMeals(data.meals || []);
      setActivities(data.activities || []);
      setGroups(data.groups || []);
      setAttendance(data.attendance || []);
      setAnnouncements(data.announcements || []);
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentChatId) {
      loadData(currentChatId);
    }
  }, [currentChatId]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim() || !child) return;

    try {
      const res = await fetch("/api/complaints/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: child.parentName,
          childId: child.id,
          phone: child.parentPhone,
          text: complaintText,
          kindergartenId: child.kindergartenId
        })
      });

      if (res.ok) {
        // Log in audit log too
        await fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: `Ota-ona (${child.parentName})`,
            action: `Telegram WebApp orqali yangi shikoyat yuborildi: "${complaintText.slice(0, 45)}..."`,
            moduleName: "Telegram Bot WebApp"
          })
        });

        setComplaintSuccess(true);
        setComplaintText("");
        triggerToast("Xabaringiz direktor paneliga yetkazildi!");
        setTimeout(() => setComplaintSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Yuborishda xatolik yuz berdi.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-400 animate-pulse">Mini-Ilova yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const handleLinkChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkChildId.trim() && !linkParentPhone.trim()) {
      setLinkError("Iltimos, Bola ID si yoki ota-ona telefon raqamingizni kiriting!");
      return;
    }
    setLinking(true);
    setLinkError(null);
    try {
      const res = await fetch("/api/parent-portal/link-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: linkChildId || undefined,
          parentPhone: linkParentPhone || undefined,
          telegramChatId: currentChatId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bog'lashda xatolik yuz berdi.");
      }
      setLinkSuccess(true);
      triggerToast("Ota-ona akkauntingiz muvaffaqiyatli bog'landi!");
      // Reload parent portal data for this linked child
      loadData(currentChatId);
    } catch (err: any) {
      setLinkError(err.message || "Xatolik yuz berdi.");
    } finally {
      setLinking(false);
    }
  };

  if (error || !child) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center p-6 max-w-md mx-auto border-x border-slate-900 shadow-2xl relative">
        <div className="absolute top-4 right-4 text-[9px] font-mono text-slate-600 bg-slate-900 border border-slate-800 rounded px-2 py-1">
          ChatID: {currentChatId || "Noma'lum"}
        </div>

        <div className="flex flex-col items-center text-center mb-6 mt-4">
          <div className="w-16 h-16 bg-sky-500/10 border-2 border-sky-500/20 text-sky-400 rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-sky-500/5 animate-pulse">
            <Sparkles className="w-8 h-8 text-sky-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Ota-ona Portali</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-sm">
            Tizimga muvaffaqiyatli ulandingiz! Lekin sizning Telegram Chat ID'ingiz bog'chada birorta bolaning kartasiga biriktirilmagan.
          </p>
        </div>

        {/* Option 1: Demo / Preview mode */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl mb-4 shadow-md">
          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sinov & Demo Rejimi
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            Mini-ilova interfeysini va imkoniyatlarini darhol tekshirib ko'rish uchun sinov rejimiga kiring (Barcha ma'lumotlar simulator formatida yuklanadi).
          </p>
          <button
            onClick={() => {
              setCurrentChatId("SIM-PARENT");
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer"
          >
            Demo Rejimiga Kirish 🚀
          </button>
        </div>

        {/* Option 2: Live Linker Form */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl shadow-md">
          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 text-sky-400">
            <User className="w-3.5 h-3.5" />
            Akkauntni bolaga ulash
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            Bog'chadan berilgan bola ID kodini (masalan: <span className="font-mono text-white bg-slate-800 px-1 py-0.5 rounded">B-101</span>, <span className="font-mono text-white bg-slate-800 px-1 py-0.5 rounded">B-102</span>) yoki ro'yxatdan o'tgan telefon raqamingizni kiriting:
          </p>

          <form onSubmit={handleLinkChildSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Bola ID Kod:</label>
              <input
                type="text"
                placeholder="Masalan: B-101"
                value={linkChildId}
                onChange={(e) => setLinkChildId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-white font-mono placeholder:text-slate-650"
              />
            </div>

            <div className="flex items-center justify-between text-xs my-2">
              <span className="h-[1px] bg-slate-800 flex-1"></span>
              <span className="text-[10px] font-mono text-slate-600 mx-3 uppercase">yoki</span>
              <span className="h-[1px] bg-slate-800 flex-1"></span>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Telefon raqam:</label>
              <input
                type="text"
                placeholder="Masalan: +998901234567"
                value={linkParentPhone}
                onChange={(e) => setLinkParentPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-white font-mono placeholder:text-slate-650"
              />
            </div>

            {linkError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl text-[10px] text-left leading-normal">
                ⚠️ {linkError}
              </div>
            )}

            <button
              type="submit"
              disabled={linking}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-sky-500/10 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {linking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Akkaunt ulanmoqda...</span>
                </>
              ) : (
                <span>Faollashtirish va Ulash 🔗</span>
              )}
            </button>
          </form>
        </div>

        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="mt-6 text-[11px] text-slate-500 hover:text-white transition-all underline font-medium self-center cursor-pointer"
          >
            Boshqaruv paneliga qaytish
          </button>
        )}
      </div>
    );
  }

  const childGroup = groups.find(g => g.id === child.groupId);
  const activeAct = activities[0] || {
    activities: ["Rasm chizish", "Musiqiy raqs", "Ingliz tili darsi"],
    engagement: 5,
    discipline: 4,
    communication: 5,
    feeding: 5,
    sleep: 2,
    teacherNote: "Bugun mashg'ulotlarda juda faol bo'ldi va barchaga yordam berdi."
  };
  const activeMeal = meals[0];

  const renderStars = (num: number) => "⭐".repeat(num) + "☆".repeat(5 - num);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-md mx-auto relative border-x border-slate-900 shadow-2xl">
      
      {/* Dynamic Toast Alert */}
      {toastMessage && (
        <div className="absolute top-4 left-4 right-4 bg-sky-500 text-slate-950 font-semibold px-4 py-3 rounded-2xl border border-sky-400 shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <Sparkle className="w-4 h-4 shrink-0 animate-pulse" />
          <span className="text-[11px] leading-tight flex-1">{toastMessage}</span>
        </div>
      )}

      {/* Portal Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center font-bold text-slate-950 text-base shadow shadow-sky-500/20">
            🌿
          </div>
          <div>
            <h1 className="text-xs font-black text-white tracking-wide">Nihol Parent Portal</h1>
            <span className="text-[9px] text-sky-400 font-bold flex items-center gap-1 uppercase font-mono leading-none">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              Live Sync
            </span>
          </div>
        </div>
        
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="text-[10px] bg-slate-950 hover:bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-850 font-bold"
          >
            ERP Chiqish
          </button>
        )}
      </header>

      {/* Main Responsive Body */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        
        {/* Child Core Banner */}
        <div className="bg-gradient-to-tr from-slate-900 to-slate-850 border border-slate-800 p-4 rounded-3xl flex items-center gap-4 relative shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>
          <img
            src={child.photo || "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368"}
            alt="child"
            className="w-14 h-14 rounded-2xl object-cover border-2 border-sky-500/20 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-sm leading-tight truncate">{child.name}</h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[9px] bg-slate-950 text-sky-400 border border-sky-500/10 px-2 py-0.5 rounded-full font-bold">
                {childGroup?.name || "Kichik guruh"}
              </span>
              <span className="text-[9px] text-slate-400 font-semibold">
                {child.age} yosh • {child.gender}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-center">
            <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider block ${
              child.status === "Bog'chada"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}>
              {child.status}
            </span>
          </div>
        </div>

        {/* Tab content switcher */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-fade-in">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveTab("attendance")}
                className="bg-slate-900 hover:bg-slate-850 text-left border border-slate-850 p-3 rounded-2xl flex items-center gap-3 shadow transition-all active:scale-95 cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0"><Calendar className="w-4 h-4" /></div>
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Oylik Davomat</span>
                  <span className="text-xs text-white font-black font-mono">18 / 22 kun</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("meals")}
                className="bg-slate-900 hover:bg-slate-850 text-left border border-slate-850 p-3 rounded-2xl flex items-center gap-3 shadow transition-all active:scale-95 cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0"><Utensils className="w-4 h-4" /></div>
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Bugun Tushlik</span>
                  <span className="text-xs text-sky-400 font-bold truncate block max-w-[85px]">{activeMeal?.lunch?.title || "Suyuq ovqat"}</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("health")}
                className="bg-slate-900 hover:bg-slate-850 text-left border border-slate-850 p-3 rounded-2xl flex items-center gap-3 shadow transition-all active:scale-95 cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0"><Heart className="w-4 h-4" /></div>
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Bo'yi & Vazni</span>
                  <span className="text-xs text-rose-400 font-black font-mono">{child.medicalCard.height} sm / {child.medicalCard.weight} kg</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("payments")}
                className="bg-slate-900 hover:bg-slate-850 text-left border border-slate-850 p-3 rounded-2xl flex items-center gap-3 shadow transition-all active:scale-95 cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0"><CreditCard className="w-4 h-4" /></div>
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Moliya / To'lov</span>
                  <span className={`text-[10px] font-bold ${
                    payments[payments.length - 1]?.status === "To'landi" ? "text-emerald-400" : "text-rose-400"
                  }`}>{payments[payments.length - 1]?.status || "To'lanmagan"}</span>
                </div>
              </button>
            </div>

            {/* Daily Activity Stars */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-3 shadow">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Farzand Faolligi (Bugun)
              </h3>
              
              <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-850">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Darslardagi faollik:</span>
                  <span className="text-amber-400 font-bold font-mono">{renderStars(activeAct.engagement)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Nutq va muloqot:</span>
                  <span className="text-amber-400 font-bold font-mono">{renderStars(activeAct.communication)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Intizom & odob:</span>
                  <span className="text-amber-400 font-bold font-mono">{renderStars(activeAct.discipline)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Ovqat yeyishi:</span>
                  <span className="text-amber-400 font-bold font-mono">{renderStars(activeAct.feeding)}</span>
                </div>
              </div>

              {activeAct.teacherNote && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-[11px] text-slate-300 italic leading-relaxed">
                  " {activeAct.teacherNote} "
                </div>
              )}
            </div>

            {/* Live QR Access Code */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl text-center space-y-3.5 shadow-xl shadow-sky-500/5">
              <div>
                <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block">Digital QR Pass • Darvoza Pass</span>
                <h4 className="text-white text-xs font-bold mt-0.5">Avtomatik Darvoza Skanerlash QR Kodi</h4>
              </div>

              <div className="w-32 h-32 bg-white p-2.5 rounded-2xl mx-auto flex items-center justify-center border-4 border-sky-500/30">
                <div className="grid grid-cols-5 gap-1.5 w-full h-full p-1.5 bg-slate-950 rounded">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${
                        (i % 3 === 0 || i % 4 === 1 || i < 5 || i > 20 || i % 5 === 0)
                          ? "bg-white"
                          : "bg-slate-950"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                Ushbu QR kodni aqlli darvoza skaneriga yaqinlashtirib, farzandingizni olib kirishingiz yoki olib ketishingiz mumkin.
              </p>
            </div>

            {/* PUBLIC ANNOUNCEMENTS SECTION */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-4 shadow">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-pink-400" />
                  Bog'cha e'lonlari va yangiliklar
                </h3>
                {announcements.length > 0 && (
                  <span className="text-[9px] bg-pink-500/10 text-pink-400 font-bold px-2 py-0.5 rounded-full border border-pink-500/10 animate-pulse">
                    Yangi {announcements.length} ta
                  </span>
                )}
              </div>

              {announcements.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-[11px]">
                  Hozirda hech qanday rasmiy e'lonlar va direktor xabarlari yo'q.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      onClick={async () => {
                        // Mark view
                        try {
                          await fetch(`/api/parent-portal/announcements/${ann.id}/view`, { method: "POST" });
                          // update local count
                          setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, views: (a.views || 0) + 1 } : a));
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="p-3.5 bg-slate-950 hover:bg-slate-850 rounded-2xl border border-slate-850/80 transition-all cursor-pointer space-y-2 group active:scale-98"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                          Ma'muriyat
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono font-bold">
                          {ann.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs font-medium leading-relaxed whitespace-pre-wrap">
                        {ann.message}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1 text-slate-500 text-[9px] font-bold uppercase">
                        <span>Ko'rildi:</span>
                        <span className="text-slate-400 font-mono">{ann.views || 0} marta</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendance & Sleep Tab */}
        {activeTab === "attendance" && (() => {
          const todayDate = new Date().toISOString().split("T")[0];
          const todayAtt = attendance.find(a => a.date === todayDate) || attendance[attendance.length - 1];
          return (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Darvoza Davomat jurnali</h3>
                  <span className="text-[10px] text-sky-400 font-mono font-bold">Bugun</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-850 items-center">
                    <span className="text-slate-400 font-medium">Sana:</span>
                    <span className="text-slate-300 font-bold font-mono">{todayAtt?.date || todayDate}</span>
                  </div>
                  <div className="flex justify-between text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-850 items-center">
                    <span className="text-slate-400 font-medium">Kirish (Face ID):</span>
                    {todayAtt?.checkIn ? (
                      <span className="text-emerald-400 font-bold font-mono">{todayAtt.checkIn} (Keldi)</span>
                    ) : (
                      <span className="text-slate-500 font-mono font-bold">Kutilmoqda...</span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-850 items-center">
                    <span className="text-slate-400 font-medium">Chiqish (Face ID):</span>
                    {todayAtt?.checkOut ? (
                      <span className="text-amber-400 font-bold font-mono">{todayAtt.checkOut} (Ketdi)</span>
                    ) : (
                      <span className="text-slate-500 font-mono font-bold">Kutilmoqda...</span>
                    )}
                  </div>
                  {todayAtt?.checkoutPersonName && (
                    <div className="flex justify-between text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-850 items-center">
                      <span className="text-slate-400 font-medium font-bold">Olib ketgan shaxs:</span>
                      <span className="text-slate-300 font-bold">{todayAtt.checkoutPersonName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sleep logs */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-3 shadow">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-sky-400" />
                  Kunduzgi Uyqu tahlili (💤)
                </h3>

                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Uxlash davomiyligi</span>
                    <span className="text-xs text-white font-black font-mono">{activeAct.sleep || 2.0} soat</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Uyqu sifati</span>
                    <span className="text-xs text-emerald-400 font-black flex items-center gap-1">
                      <Sparkle className="w-3.5 h-3.5 animate-pulse" />
                      Tinch & Sokin
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed italic p-2.5 bg-slate-950/40 rounded-xl border border-slate-850/80">
                  Tarbiyachi izohi: "Farzandingiz bugun tushlikdan so'ng tinchgina uxladi, hech qanday bezovtalik bo'lmadi."
                </p>
              </div>
            </div>
          );
        })()}

        {/* Meals Tab */}
        {activeTab === "meals" && (
          <div className="space-y-4 animate-fade-in">
            {activeMeal ? (
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-4 shadow">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-sky-400" />
                    Bugungi Tantanali Taomnoma
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">Iyul</span>
                </div>

                <div className="space-y-4">
                  {/* Nonushta */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black uppercase">Nonushta</span>
                      <span className="text-[10px] text-slate-500 font-mono">{activeMeal.breakfast.calories} kcal</span>
                    </div>
                    <h4 className="text-white font-bold text-xs mt-2">{activeMeal.breakfast.title}</h4>
                    <span className="text-[10px] text-slate-400 block mt-1">Protein: {activeMeal.breakfast.protein}g</span>
                  </div>

                  {/* Tushlik */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-black uppercase">Tushlik</span>
                      <span className="text-[10px] text-slate-500 font-mono">{activeMeal.lunch.calories} kcal</span>
                    </div>
                    <h4 className="text-white font-bold text-xs mt-2">{activeMeal.lunch.title}</h4>
                    <span className="text-[10px] text-slate-400 block mt-1">Protein: {activeMeal.lunch.protein}g</span>
                  </div>

                  {/* Kechki ovqat */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">Kechki ovqat</span>
                      <span className="text-[10px] text-slate-500 font-mono">{activeMeal.dinner.calories} kcal</span>
                    </div>
                    <h4 className="text-white font-bold text-xs mt-2">{activeMeal.dinner.title}</h4>
                    <span className="text-[10px] text-slate-400 block mt-1">Protein: {activeMeal.dinner.protein}g</span>
                  </div>
                </div>

                {/* AI advice */}
                {activeMeal.breakfast.aiComment && (
                  <div className="p-3.5 bg-gradient-to-tr from-sky-950/20 to-indigo-950/20 rounded-2xl border border-sky-900/30 text-[10px] text-sky-200 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1.5 text-sky-400">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      AI Dietolog Tavsiyasi
                    </div>
                    {activeMeal.breakfast.aiComment}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl text-center text-slate-400 text-xs">
                Bugungi ovqatlanish taomnomasi kiritilmagan.
              </div>
            )}
          </div>
        )}

        {/* Health Tab */}
        {activeTab === "health" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Smart Tibbiy Ma'lumotnoma
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Faol</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[8px] text-slate-500 font-bold uppercase block">Allergiya</span>
                    <span className="text-xs text-rose-400 font-bold mt-1 block">{child.medicalCard.allergies}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[8px] text-slate-500 font-bold uppercase block">Qon guruhi</span>
                    <span className="text-xs text-white font-mono font-bold mt-1 block">{child.medicalCard.bloodGroup} {child.medicalCard.rhFactor}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[8px] text-slate-500 font-bold uppercase block">Bo'yi</span>
                    <span className="text-xs text-white font-mono font-bold mt-1 block">{child.medicalCard.height} sm</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[8px] text-slate-500 font-bold uppercase block">Vazni</span>
                    <span className="text-xs text-white font-mono font-bold mt-1 block">{child.medicalCard.weight} kg</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-1.5">
                  <span className="text-[8px] text-slate-500 font-bold uppercase block">Emlashlar (Vaksinalar)</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {child.medicalCard.vaccinations && child.medicalCard.vaccinations.length > 0 ? (
                      child.medicalCard.vaccinations.map((vac, i) => (
                        <span key={i} className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                          ✓ {vac}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">Sog'lom (Emlashlar tugallangan)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">To'lov va shartnoma holati</h3>
                <span className="text-emerald-400 text-xs font-black font-mono">1,500,000 UZS / oy</span>
              </div>

              {payments.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Oxirgi kvitansiyalar:</span>
                  
                  {payments.map((p) => (
                    <div key={p.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-white font-bold">{p.amount.toLocaleString()} UZS</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                            p.status === "To'landi" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>{p.status}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-1">Oy: {p.month} | Sana: {p.date}</span>
                      </div>
                      
                      <button
                        onClick={() => setViewingReceipt(p)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-sky-400 font-bold px-2.5 py-1.5 rounded-xl cursor-pointer"
                      >
                        Kvitansiya
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-2xl text-center text-slate-400 text-xs">
                  To'lovlar topilmadi.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === "complaint" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Direktorga maxfiy murojaat</h3>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Ushbu forma orqali yuborilgan shikoyat va takliflar faqatgina bog'cha direktori ekranida ko'rinadi va mutlaqo sir saqlanadi.
                </p>
              </div>

              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Murojaat matni</label>
                  <textarea
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    required
                    placeholder="Bog'chadagi xizmatlar, ovqatlar yoki tarbiyachilar haqida o'z fikringiz yoki shikoyatingizni yozib qoldiring..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow shadow-sky-500/10 cursor-pointer active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Murojaatni yuborish
                </button>
              </form>

              {complaintSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] leading-relaxed flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Murojaat muvaffaqiyatli qabul qilindi. Tez orada ko'rib chiqiladi. Rahmat!</span>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Standalone Receipt Modal Viewer */}
      {viewingReceipt && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl relative">
            <div className="text-center space-y-1 pb-3 border-b border-slate-800">
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">Rasmiy Kvitansiya</span>
              <h3 className="text-white font-black text-xs uppercase tracking-wider mt-1">Nihol AI Smart ERP</h3>
              <p className="text-slate-500 text-[9px] font-mono">ID: {viewingReceipt.id}</p>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs font-mono">
              <div className="flex justify-between"><span className="text-slate-500">Bemor/Bola:</span><span className="text-white font-bold">{child.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Ota-ona:</span><span className="text-white">{child.parentName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Xizmat oyi:</span><span className="text-sky-400">{viewingReceipt.month}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Sana:</span><span className="text-white">{viewingReceipt.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Turi:</span><span className="text-white">{viewingReceipt.paymentType}</span></div>
              <div className="border-t border-slate-850 my-2 pt-2 flex justify-between font-bold text-white">
                <span>JAMI TO'LOV:</span>
                <span className="text-emerald-400">{viewingReceipt.amount.toLocaleString()} UZS</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => triggerToast("🖨 Kvitansiya printerga yuborilmoqda...")}
                className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-200 font-bold py-2 px-3 rounded-xl border border-slate-800 text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Chop etish
              </button>
              <button
                onClick={() => setViewingReceipt(null)}
                className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-2 px-3 rounded-xl text-[10px] uppercase cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Bottom Navigation Tabs */}
      <nav className="bg-slate-900 border-t border-slate-850 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-45 flex justify-around py-2.5">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "home" ? "text-sky-400 font-bold" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[9px]">Profil</span>
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "attendance" ? "text-sky-400 font-bold" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[9px]">Davomat</span>
        </button>

        <button
          onClick={() => setActiveTab("meals")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "meals" ? "text-sky-400 font-bold" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span className="text-[9px]">Taomnoma</span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "payments" ? "text-sky-400 font-bold" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[9px]">To'lov</span>
        </button>

        <button
          onClick={() => setActiveTab("complaint")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "complaint" ? "text-sky-400 font-bold" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Send className="w-4 h-4" />
          <span className="text-[9px]">Shikoyat</span>
        </button>
      </nav>
    </div>
  );
}
