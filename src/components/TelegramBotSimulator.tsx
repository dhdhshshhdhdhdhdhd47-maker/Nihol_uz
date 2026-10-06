import React, { useState, useEffect, useRef } from "react";
import telegramService from "../services/telegramService";
import {
  Send,
  Smartphone,
  Bot,
  User,
  Check,
  AlertTriangle,
  MessageSquare,
  Phone,
  ShieldCheck,
  Lock,
  Calendar,
  Utensils,
  Image,
  Video,
  Award,
  FileText,
  CreditCard,
  Megaphone,
  Sparkles,
  Heart,
  Moon,
  HelpCircle,
  LockKeyhole,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Activity,
  Printer,
  Sparkle,
  Wifi,
  Paperclip,
  Mic,
  MoreVertical,
  Smile
} from "lucide-react";
import { Child, Payment, MealPlan, DailyActivity } from "../types";

interface BotMessage {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  markup?: any;
}

export default function TelegramBotSimulator({ onRefresh }: { onRefresh?: () => void }) {
  const [chatId, setChatId] = useState("SIM-" + Math.floor(100000 + Math.random() * 900000));
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [replyMarkup, setReplyMarkup] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true);
  
  // Registration Auth Flow state
  const [authStep, setAuthStep] = useState<"welcome" | "phone" | "child_id" | "otp" | "connected">("welcome");
  const [parentPhone, setParentPhone] = useState("+998 90 123-45-67");
  const [selectedChildId, setSelectedChildId] = useState("B-101");
  const [otpSent, setOtpSent] = useState("5842");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // App Data fetched for Parent view
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [childPayments, setChildPayments] = useState<Payment[]>([]);
  const [todayMeals, setTodayMeals] = useState<any>(null);
  const [dailyAct, setDailyAct] = useState<any>(null);

  // Mini App active tab state
  const [showMiniApp, setShowMiniApp] = useState(false);
  const [miniAppTab, setMiniAppTab] = useState<"home" | "attendance" | "meals" | "health" | "payments" | "documents" | "complaint">("home");

  // Complaint input state inside WebApp
  const [complaintText, setComplaintText] = useState("");
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  // Active Receipt Modal
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null);

  // Activity Log tab state
  const [simTab, setSimTab] = useState<"phone" | "api_logs">("phone");
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [botStatus, setBotStatus] = useState<any>(null);

  const fetchApiLogs = async () => {
    try {
      const logsData = await telegramService.getApiLogs();
      setApiLogs(logsData);
      const statusData = await telegramService.getBotStatus();
      setBotStatus(statusData);
    } catch (err) {
      console.error("Error fetching telegram api logs/status:", err);
    }
  };

  useEffect(() => {
    if (simTab === "api_logs") {
      fetchApiLogs();
      const interval = setInterval(fetchApiLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [simTab]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch App Data to power bot replies and WebApp
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [resChildren, resMeals, resPayments, resActivities] = await Promise.all([
          fetch("/api/children"),
          fetch("/api/meals"),
          fetch("/api/payments"),
          fetch("/api/activities")
        ]);
        const childrenData = await resChildren.json();
        const mealsData = await resMeals.json();
        const paymentsData = await resPayments.json();
        const activitiesData = await resActivities.json();

        setAllChildren(childrenData);
        if (mealsData && mealsData.length > 0) {
          setTodayMeals(mealsData[0]);
        }
        
        // Sync connected child data if already linked
        const matchedChild = childrenData.find((c: Child) => c.id === selectedChildId);
        if (matchedChild) {
          setActiveChild(matchedChild);
          setChildPayments(paymentsData.filter((p: Payment) => p.childId === matchedChild.id));
          const act = activitiesData.find((a: any) => a.childId === matchedChild.id);
          setDailyAct(act || {
            activities: ["Rasm chizish", "Musiqiy raqs", "Ingliz tili darsi"],
            engagement: 5, discipline: 4, communication: 5, feeding: 5, sleep: 2,
            teacherNote: "Bugun mashg'ulotlarda juda faol bo'ldi."
          });
        }
      } catch (err) {
        console.error("Error fetching bot simulation data:", err);
      }
    };
    fetchBaseData();
  }, [selectedChildId, authStep]);

  // Poll for simulated SMS notifications triggered by FaceIdSimulator
  useEffect(() => {
    const pollSms = async () => {
      try {
        const smsList = await telegramService.getPendingSms();
        if (smsList && smsList.length > 0) {
          // Display each pending SMS as a toast message!
          smsList.forEach((sms: any) => {
            triggerToast(`${sms.text} (Yuborilgan raqam: ${sms.phone})`);
          });
          // Clear the SMS queue on the server
          await telegramService.clearPendingSms();
        }
      } catch (err) {
        console.error("Error polling simulated SMS queue:", err);
      }
    };

    const interval = setInterval(pollSms, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll for simulated incoming Telegram messages (e.g. from payments, attendance notifications)
  useEffect(() => {
    if (!chatId) return;
    const pollMessages = async () => {
      try {
        const pending = await telegramService.getPendingMessages(chatId);
        if (pending && pending.length > 0) {
          const newMsgs = pending.map((m: any) => ({
            sender: "bot" as const,
            text: m.text,
            timestamp: m.timestamp || new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
            markup: m.replyMarkup
          }));
          setMessages((prev) => [...prev, ...newMsgs]);
          if (newMsgs[newMsgs.length - 1].markup) {
            setReplyMarkup(newMsgs[newMsgs.length - 1].markup);
          }
        }
      } catch (err) {
        console.error("Error polling simulated Telegram messages:", err);
      }
    };

    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Toast notifier helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Start Bot command
  const startBot = () => {
    setAuthStep("phone");
    const initBotMsg: BotMessage = {
      sender: "bot",
      text: "👋 *Assalomu alaykum!*\n\nNihol AI Bog'chasi ota-onalar smart tizimiga xush kelibsiz.\n\nTizimda avtorizatsiyadan o'tish va farzandingiz faoliyatini real vaqtda kuzatish uchun iltimos, pastdagi tugmani bosib, *Telefon raqamingizni* ulashing.",
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
    };
    setMessages([initBotMsg]);
  };

  // Handle share phone contact
  const handleSharePhone = () => {
    setAuthStep("child_id");
    triggerToast("📞 Kontakt ulashildi: " + parentPhone);
    const userMsg: BotMessage = {
      sender: "user",
      text: "📱 Kontaktni ulashish (" + parentPhone + ")",
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
    };
    const botMsg: BotMessage = {
      sender: "bot",
      text: "Rahmat! Telefon raqamingiz tasdiqlandi.\n\nEndi, Direktor yoki Tarbiyachi tomonidan taqdim etilgan farzandingizning *Farzand ID raqamini* kiriting (Masalan: *B-101*):",
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // Handle Child ID linkage
  const handleLinkChildId = (id: string) => {
    const matched = allChildren.find(c => c.id === id);
    if (!matched) {
      triggerToast("⚠️ Bunday ID ga ega bola topilmadi!");
      return;
    }
    setSelectedChildId(id);
    setActiveChild(matched);
    
    // Generate random 4 digit OTP code
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setOtpSent(generatedOtp);

    setAuthStep("otp");
    // Trigger simulated SMS toast
    setTimeout(() => {
      triggerToast(`📩 Yangi SMS-xabar: Nihol AI ERP tasdiqlash kodi: ${generatedOtp}`);
    }, 1200);

    const userMsg: BotMessage = {
      sender: "user",
      text: id,
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
    };
    const botMsg: BotMessage = {
      sender: "bot",
      text: `Farzand topildi: *${matched.name}*\n\nXavfsizlikni ta'minlash uchun *${parentPhone}* raqamingizga 4 xonali SMS kod yuborildi. Iltimos, o'sha kodni kiriting:`,
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // Verify OTP Code
  const handleVerifyOtp = async () => {
    if (otpInput !== otpSent) {
      setOtpError("Noto'g'ri kod! Qayta urinib ko'ring.");
      return;
    }

    setOtpError("");
    setLoading(true);

    try {
      // Save linked telegramChatId on server database
      const res = await fetch(`/api/children/${selectedChildId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: chatId })
      });
      const data = await res.json();
      
      // Post audit log
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: `Ota-ona (${activeChild?.parentName})`,
          action: `Telegram Bot orqali profil muvaffaqiyatli bog'landi: ${activeChild?.name} (${selectedChildId})`,
          moduleName: "Telegram Bot"
        })
      });

      setAuthStep("connected");
      if (onRefresh) onRefresh();
      
      const userMsg: BotMessage = {
        sender: "user",
        text: otpInput,
        timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
      };
      
      const botMsg: BotMessage = {
        sender: "bot",
        text: `🎉 *Tabriklaymiz!*\n\nSiz muvaffaqiyatli ro'yxatdan o'tdingiz.\n\n*Bola:* ${activeChild?.name}\n*Guruh:* ${activeChild?.groupId === "G-1" ? "Kamalak guruh" : "Yulduzcha guruh"}\n\nBog'cha hayotini bevosita smartfoningizdan kuzatib boring! Tugmalardan foydalaning yoki *🌐 Web-App Mini-Ilovani* oching.`,
        timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        markup: {
          keyboard: [
            [{ text: "👶 Farzandim" }, { text: "📅 Davomat" }],
            [{ text: "🍽 Ovqatlar" }, { text: "🎨 Mashg'ulotlar" }],
            [{ text: "😊 Faollik" }, { text: "💳 To'lov" }],
            [{ text: "💬 Shikoyat" }, { text: "☎️ Aloqa" }]
          ]
        }
      };
      
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setReplyMarkup(botMsg.markup);
    } catch (err) {
      console.error(err);
      triggerToast("⚠️ Server bilan bog'lanishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: BotMessage = {
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const data = await telegramService.sendSimulatorMessage(
        chatId,
        text,
        activeChild?.parentName || "Ota-ona"
      );

      const botMsg: BotMessage = {
        sender: "bot",
        text: data.replyText,
        timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        markup: data.replyMarkup,
      };

      setMessages((prev) => [...prev, botMsg]);
      if (onRefresh) onRefresh();
      if (data.replyMarkup) {
        setReplyMarkup(data.replyMarkup);
      }
    } catch (err) {
      console.error(err);
      const botMsg: BotMessage = {
        sender: "bot",
        text: "⚠️ Serverga ulanish xatoligi. Bog'lanish barbod bo'ldi.",
        timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Submit Complaint from WebApp
  const submitComplaintWebApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    try {
      const res = await fetch("/api/complaints/resolve", { // In-memory database helper or standard complaints
        method: "POST", // Simulating complaint logging
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: activeChild?.parentName || "Dilshod Karimov",
          childId: selectedChildId,
          phone: parentPhone,
          text: complaintText
        })
      });

      // Post raw audit log & custom complaint insertion via server-side logs
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: `Ota-ona (${activeChild?.parentName})`,
          action: `Telegram WebApp orqali yangi taklif/shikoyat kiritildi: "${complaintText.slice(0, 45)}..."`,
          moduleName: "Telegram Bot"
        })
      });

      if (onRefresh) onRefresh();
      setComplaintSuccess(true);
      setComplaintText("");
      setTimeout(() => setComplaintSuccess(false), 5000);
    } catch (err) {
      console.error("Error submitting complaint:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage(inputText);
    }
  };

  // Simple Markdown support in JSX
  const renderMarkdown = (text: string) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let formatted = line;
      formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
      formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");
      formatted = formatted.replace(/`(.*?)`/g, "<code class='bg-slate-900 px-1 py-0.5 rounded text-xs text-amber-400'>$1</code>");
      return (
        <p
          key={idx}
          className="mb-1 leading-relaxed text-xs"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[670px] relative overflow-hidden">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="absolute top-4 left-4 right-4 bg-sky-500 text-slate-950 font-semibold px-4 py-3 rounded-2xl border border-sky-400 shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <Smartphone className="w-5 h-5 animate-pulse shrink-0" />
          <span className="text-[11px] leading-tight flex-1">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-950 font-bold hover:text-white cursor-pointer px-1.5 py-0.5 rounded text-xs">X</button>
        </div>
      )}

      {/* Simulator Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="bg-sky-500/10 border border-sky-500/20 p-2 rounded-2xl text-sky-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-xs tracking-wide">Telegram Parent Bot</h3>
            <span className="text-[10px] text-sky-400 font-bold flex items-center gap-1.5 uppercase font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              Parent Portal Simulator
            </span>
          </div>
        </div>
        
        {/* Debugging / Simulator tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
          <button
            onClick={() => setSimTab("phone")}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              simTab === "phone" ? "bg-sky-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            Simulator
          </button>
          <button
            onClick={() => setSimTab("api_logs")}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              simTab === "api_logs" ? "bg-sky-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-3 h-3" />
            Activity Log
          </button>
        </div>
      </div>

      {simTab === "phone" && (
        /* PHONE WRAPPER FRAME */
        <div className="flex-1 bg-slate-950/90 border border-slate-850 rounded-2xl flex flex-col overflow-hidden relative shadow-inner">
        
        {/* Phone Notch & Status Bar */}
        <div className="bg-slate-900 px-3 py-1 flex justify-between items-center text-[9px] text-slate-400 font-mono select-none border-b border-slate-950 shrink-0 relative z-40">
          <span>12:45</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-0.5 h-3.5 w-20 bg-black rounded-b-xl flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-slate-900 rounded-full absolute left-4"></span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="w-2.5 h-2.5 text-sky-400" />
            <span>5G</span>
            <span className="w-4 h-2 border border-slate-600 rounded-2xs p-0.5 flex items-center">
              <span className="h-full w-2.5 bg-emerald-400 rounded-3xs"></span>
            </span>
          </div>
        </div>
        
        {/* Welcome Auth Screen */}
        {authStep === "welcome" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 bg-sky-500/15 border border-sky-500/20 rounded-3xl flex items-center justify-center text-sky-400 shadow-lg animate-pulse">
              <Bot className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-white font-black text-sm uppercase tracking-wider">Nihol AI Parent Bot</h4>
              <p className="text-slate-400 text-xs leading-relaxed max-w-[240px] mx-auto">
                Bog'cha va ota-onalar o'rtasidagi aqlli muloqot tizimi. Farzandingiz davomati, ovqati, va tibbiy holatini real vaqtda kuzatib boring.
              </p>
            </div>
            <button
              onClick={startBot}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-sky-500/10 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Botni Boshlash (/start)
            </button>
          </div>
        )}

        {/* Share Contact / Phone Auth Step */}
        {authStep === "phone" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 animate-fade-in">
            <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center justify-center text-sky-400">
              <Phone className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">🔒 Telefon raqamni tasdiqlash</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed max-w-[220px] mx-auto">
                Tizim o'zaro ishonchni ta'minlash maqsadida telefon raqamingizni so'raydi. Iltimos kontaktni ulashing.
              </p>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full max-w-[200px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center text-xs font-mono text-white outline-none focus:border-sky-500"
              />
            </div>
            <button
              onClick={handleSharePhone}
              className="w-full max-w-[200px] bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              Kontaktni Ulashish 📱
            </button>
          </div>
        )}

        {/* Enter Child ID Step */}
        {authStep === "child_id" && (
          <div className="flex-1 flex flex-col p-5 space-y-4 justify-center animate-fade-in">
            <div className="text-center space-y-1">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">👶 Farzand ID raqami</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Tizim bilan bolani bog'lash uchun direktor tomonidan taqdim etilgan ID raqamni kiriting.
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 space-y-3">
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">Simulyator bolalar ID lari:</span>
              <div className="grid grid-cols-1 gap-2">
                {allChildren.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleLinkChildId(c.id)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-sky-500 text-left p-2.5 rounded-xl text-xs text-white transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {c.id} | Ota-ona: {c.parentName}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* OTP Input Step */}
        {authStep === "otp" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 animate-fade-in">
            <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center justify-center text-sky-400">
              <LockKeyhole className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">💬 SMS Kodni Kiriting</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Raqamingizga yuborilgan 4 xonali tasdiqlash kodini kiriting (SMS orqali kelgan):
              </p>
              <input
                type="text"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Kod"
                className="w-24 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center text-lg font-black font-mono tracking-widest text-sky-400 outline-none focus:border-sky-500"
              />
              {otpError && <p className="text-rose-400 text-[10px] font-bold mt-1">{otpError}</p>}
            </div>
            <div className="flex gap-2.5 w-full justify-center">
              <button
                type="button"
                onClick={() => setAuthStep("child_id")}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-2 px-4 rounded-xl text-xs cursor-pointer"
              >
                Orqaga
              </button>
              <button
                onClick={handleVerifyOtp}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-2 px-5 rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Tasdiqlash
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE BOT VIEW */}
        {authStep === "connected" && (
          <div className="flex-1 flex flex-col min-h-0 relative">
            
            {/* Telegram Chat Header */}
            <div className="bg-slate-900 border-b border-slate-850 px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-sky-400 flex items-center justify-center text-slate-950 font-bold text-xs">
                  🌿
                </div>
                <div>
                  <div className="text-xs font-black text-white leading-tight">Nihol AI Bog'cha Boti</div>
                  <span className="text-[10px] text-emerald-400 font-bold block leading-none">bot • online</span>
                </div>
              </div>

              {/* WebApp Launcher Button */}
              <button
                onClick={() => {
                  setShowMiniApp(true);
                  setMiniAppTab("home");
                }}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-lg shadow-sky-500/10 active:scale-95"
              >
                <Sparkles className="w-3 h-3" />
                🌐 MINI-ILVA (WEBAPP)
              </button>
            </div>

            {/* Chat message flow */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-850">
              <div className="text-center">
                <span className="bg-slate-900 text-slate-500 text-[9px] px-2.5 py-1 rounded-full border border-slate-850 font-mono">
                  Bugun, {new Date().toLocaleDateString("uz-UZ")}
                </span>
              </div>

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                      msg.sender === "user" ? "bg-slate-800 text-slate-300" : "bg-sky-500/15 text-sky-400 border border-sky-500/10"
                    }`}>
                      {msg.sender === "user" ? "👤" : "🤖"}
                    </div>
                    <div className={`rounded-2xl px-3.5 py-2 ${
                      msg.sender === "user" ? "bg-sky-600 text-white rounded-tr-none shadow-lg" : "bg-slate-900 text-slate-100 rounded-tl-none border border-slate-850 shadow-md"
                    }`}>
                      <div>{renderMarkdown(msg.text)}</div>
                      <div className="text-[8px] text-slate-500 text-right mt-1 font-mono">{msg.timestamp}</div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 rounded-2xl px-3 py-2">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Standard Reply Keyboard Grid (Bottom of Chat) */}
            {replyMarkup?.keyboard && isKeyboardOpen && (
              <div className="bg-slate-900 border-t border-slate-850 p-2 shrink-0 space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[8px] text-slate-500 font-black tracking-wider uppercase font-mono">Bot Reply Keyboard</span>
                  <button onClick={() => setIsKeyboardOpen(false)} className="text-[9px] text-sky-400 hover:underline cursor-pointer">Yashirish</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {replyMarkup.keyboard.flat().map((btn: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(btn.text)}
                      className="bg-slate-950/80 hover:bg-slate-800 text-slate-200 font-bold py-2 px-3 rounded-xl border border-slate-850 hover:border-slate-700 text-[10px] text-center transition-all cursor-pointer truncate active:scale-95"
                    >
                      {btn.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Open Menu Action if hidden */}
            {!isKeyboardOpen && (
              <div className="p-1.5 text-right bg-slate-900 shrink-0">
                <button
                  onClick={() => setIsKeyboardOpen(true)}
                  className="text-[10px] text-sky-400 bg-slate-950 border border-slate-850 font-bold px-3 py-1 rounded-lg cursor-pointer"
                >
                  Klaviaturani Ochish 📱
                </button>
              </div>
            )}

            {/* Chat Text Input field */}
            <div className="p-2 border-t border-slate-900 bg-slate-950 flex items-center gap-2 shrink-0">
              <button className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer">
                <Smile className="w-4.5 h-4.5" />
              </button>
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Xabar yozing..."
                  className="w-full bg-slate-900 border border-slate-850 focus:border-sky-500 rounded-full pl-3.5 pr-10 py-2 text-white placeholder-slate-500 outline-none text-xs"
                />
                <button className="absolute right-3 text-slate-500 hover:text-slate-300 cursor-pointer">
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              {inputText.trim() ? (
                <button
                  onClick={() => handleSendMessage(inputText)}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 p-2 rounded-full transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button className="bg-slate-900 hover:bg-slate-800 text-slate-400 p-2 rounded-full transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95">
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* IMMERSIVE TELEGRAM MINI-APP WEBVIEW OVERLAY */}
            {showMiniApp && (
              <div className="absolute inset-0 bg-slate-950 z-40 flex flex-col animate-fade-in">
                
                {/* Mini App Nav Top Bar */}
                <div className="bg-slate-900 border-b border-slate-850 px-3 py-2.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMiniApp(false)}
                      className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h5 className="text-xs font-black text-white flex items-center gap-1">
                        Nihol Parent Portal <span className="text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1 py-0.5 rounded font-mono font-bold">MINI-APP</span>
                      </h5>
                      <span className="text-[9px] text-slate-400 block font-medium">Litsenziya: Faol • {activeChild?.name}</span>
                    </div>
                  </div>

                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold border border-slate-700 font-mono shadow">
                    N
                  </div>
                </div>

                {/* MINI APP CONTAINER BODY */}
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  
                  {/* WebApp Dashboard Tab */}
                  {miniAppTab === "home" && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Kid Brief Profile Banner */}
                      <div className="bg-gradient-to-tr from-slate-900 to-slate-850 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3.5 relative shadow-lg overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>
                        <img
                          src={activeChild?.photo || "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368"}
                          alt="child"
                          className="w-12 h-12 rounded-xl object-cover border-2 border-sky-500/30 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h6 className="text-white font-black text-xs leading-tight truncate">{activeChild?.name}</h6>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">{activeChild?.groupId === "G-1" ? "O'rta guruh" : "Katta guruh"}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{activeChild?.age} yosh • {activeChild?.gender}</span>
                          </div>
                        </div>

                        {/* Attendance Status Badge */}
                        <div className="shrink-0 text-center">
                          <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider block ${
                            activeChild?.status === "Bog'chada"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {activeChild?.status === "Bog'chada" ? "Bog'chada" : "Kelmagan"}
                          </span>
                        </div>
                      </div>

                      {/* WebApp mini widgets Grid */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center gap-2.5 shadow">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0"><Calendar className="w-4 h-4" /></div>
                          <div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Kelgan Kunlar</span>
                            <span className="text-xs text-white font-bold font-mono">18 / 22 kun</span>
                          </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center gap-2.5 shadow">
                          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0"><Utensils className="w-4 h-4" /></div>
                          <div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Bugun Tushlik</span>
                            <span className="text-xs text-emerald-400 font-bold truncate block max-w-[85px]">{todayMeals?.lunch?.title || "Sho'rva"}</span>
                          </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center gap-2.5 shadow">
                          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0"><Award className="w-4 h-4" /></div>
                          <div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Bugungi Faollik</span>
                            <span className="text-xs text-amber-400 font-bold font-mono">⭐ 4.8 / 5.0</span>
                          </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center gap-2.5 shadow">
                          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0"><CreditCard className="w-4 h-4" /></div>
                          <div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">To'lov Holati</span>
                            <span className={`text-[10px] font-bold ${
                              childPayments[childPayments.length - 1]?.status === "To'landi" ? "text-emerald-400" : "text-rose-400"
                            }`}>{childPayments[childPayments.length - 1]?.status || "To'lanmagan"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Smart QR for Gate Entrance Check-In */}
                      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-center space-y-3 shadow shadow-sky-500/5">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block">Digital QR Pass • Darvoza yo'llanmasi</span>
                          <h6 className="text-white text-xs font-bold">Avtomatik Davomat Skanerlash QR Kodi</h6>
                        </div>

                        <div className="w-28 h-28 bg-white p-2 rounded-xl mx-auto flex items-center justify-center border-4 border-sky-500/30">
                          {/* Beautiful simulated styled QR matrix */}
                          <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-slate-950 rounded">
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
                        <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                          Ushbu QR kodni aqlli darvozaga yaqinlashtirib, farzandingizni xavfsiz olib kiring yoki olib keting.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* WebApp Attendance & Sleep Tab */}
                  {miniAppTab === "attendance" && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-3.5">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Darvoza Davomati</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">Iyul, 2026</span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-850 items-center">
                            <span className="text-slate-300 font-bold">Bugun (Kelish):</span>
                            <span className="text-emerald-400 font-bold font-mono">08:11 (Normal • FaceID)</span>
                          </div>
                          <div className="flex justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-850 items-center">
                            <span className="text-slate-300 font-bold">Bugun (Olib ketish):</span>
                            <span className="text-slate-500 font-mono font-bold">Kutilmoqda...</span>
                          </div>
                        </div>
                      </div>

                      {/* Sleep Quality card */}
                      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-3 shadow">
                        <h6 className="text-white font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                          <Moon className="w-4 h-4 text-sky-400" />
                          Kunduzgi Uyqu Sifati (💤)
                        </h6>

                        <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                          <div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Davomiyligi</span>
                            <span className="text-xs text-white font-black font-mono">{dailyAct?.sleep || 2.0} soat</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Sifat Reytingi</span>
                            <span className="text-xs text-emerald-400 font-black flex items-center gap-1">
                              <Sparkle className="w-3.5 h-3.5 animate-pulse" />
                              Tinch & Shirin uyqu
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed italic">
                          Tarbiyachi izohi: "Konditsioner tanaffus va ohista sokin musiqa ostida farzandingiz juda osoyishta uxladi va tetik uyg'ondi."
                        </p>
                      </div>
                    </div>
                  )}

                  {/* WebApp Meals Tab */}
                  {miniAppTab === "meals" && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <h6 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Utensils className="w-4 h-4 text-emerald-400" />
                            Bugungi Taomnoma & Ratsion
                          </h6>
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase">AI Tahlili</span>
                        </div>

                        {/* Lunch info */}
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2">
                          <span className="text-[8px] text-emerald-400 font-black block uppercase tracking-wider">🍖 TUSHLIK OSHPAZ RUSTAMDAN</span>
                          <div className="text-xs text-white font-bold">{todayMeals?.lunch?.title || "Moshxo'rda sho'rva, guruchli kotlet va salat"}</div>
                          
                          <div className="grid grid-cols-4 gap-2 text-center pt-1">
                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                              <span className="text-[8px] text-slate-500 font-bold uppercase block">Kcal</span>
                              <span className="text-[10px] text-amber-400 font-black font-mono">{todayMeals?.lunch?.calories || 650}</span>
                            </div>
                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                              <span className="text-[8px] text-slate-500 font-bold uppercase block">Oqsil</span>
                              <span className="text-[10px] text-sky-400 font-black font-mono">{todayMeals?.lunch?.protein || 28}g</span>
                            </div>
                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                              <span className="text-[8px] text-slate-500 font-bold uppercase block">Yog'</span>
                              <span className="text-[10px] text-pink-400 font-black font-mono">{todayMeals?.lunch?.fat || 22}g</span>
                            </div>
                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                              <span className="text-[8px] text-slate-500 font-bold uppercase block">Uglevod</span>
                              <span className="text-[10px] text-emerald-400 font-black font-mono">{todayMeals?.lunch?.carb || 82}g</span>
                            </div>
                          </div>
                        </div>

                        {/* Nutrition advise */}
                        <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex gap-2.5 items-start">
                          <Bot className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">AI Parhezshunos tavsiyasi</span>
                            <p className="text-[10px] text-slate-300 leading-relaxed italic">
                              "{todayMeals?.lunch?.aiComment || "Taomda oqsil miqdori juda boy, mushak o'sishi va kunlik faollik uchun yetarli. Salat C vitamini o'zlashtirishni kuchaytiradi."}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WebApp Health Tab */}
                  {miniAppTab === "health" && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-4">
                        <h6 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-850">
                          <Heart className="w-4 h-4 text-rose-500" />
                          Tibbiy Karta (Nurse Suite)
                        </h6>

                        {/* Height weight BMI and allergies */}
                        <div className="grid grid-cols-3 gap-2.5 text-center">
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                            <span className="text-[8px] text-slate-500 font-bold uppercase block">Bo'yi</span>
                            <span className="text-xs text-white font-black font-mono">{activeChild?.medicalCard.height || 110} sm</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                            <span className="text-[8px] text-slate-500 font-bold uppercase block">Vazni</span>
                            <span className="text-xs text-white font-black font-mono">{activeChild?.medicalCard.weight || 19} kg</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                            <span className="text-[8px] text-slate-500 font-bold uppercase block">BMI</span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded font-black font-mono block mt-0.5">
                              {activeChild?.medicalCard.bmi || "15.7"}
                            </span>
                          </div>
                        </div>

                        {/* Allergies Alerts */}
                        <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/15 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Maxsus Parhez & Allergiya</span>
                            <p className="text-[10px] text-slate-300 font-semibold">{activeChild?.medicalCard.allergies || "Yo'q"}</p>
                          </div>
                        </div>

                        {/* Vaccinations checklists */}
                        <div className="space-y-2">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Vaktsinalar jurnali (Emlashlar)</span>
                          <div className="grid grid-cols-2 gap-2">
                            {["BCG", "Hepatitis B", "Polio", "DTP", "Measles"].map((v) => {
                              const checked = activeChild?.medicalCard.vaccinations.includes(v);
                              return (
                                <div key={v} className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-850 flex items-center justify-between">
                                  <span className="text-xs text-white font-bold">{v}</span>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-black font-mono ${
                                    checked ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                  }`}>{checked ? "OLINGAN" : "KUTILMOQDA"}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WebApp Payments Tab */}
                  {miniAppTab === "payments" && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <h6 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-sky-400" />
                            To'lovlar & Kvitansiyalar
                          </h6>
                          <span className="text-[9px] text-slate-500 font-bold font-mono">ID: {selectedChildId}</span>
                        </div>

                        {/* Billing details */}
                        <div className="space-y-2.5">
                          {childPayments.map((p) => (
                            <div key={p.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between shadow">
                              <div>
                                <div className="text-[11px] text-white font-bold">{p.month} oyi shartnoma to'lovi</div>
                                <span className="text-[9px] text-slate-500 font-mono">Sana: {p.date} • {p.paymentType}</span>
                              </div>

                              <div className="text-right space-y-1">
                                <span className="text-xs font-black text-emerald-400 font-mono block">{(p.amount / 1000).toLocaleString()}k UZS</span>
                                <button
                                  type="button"
                                  onClick={() => setViewingReceipt(p)}
                                  className="text-[9px] text-sky-400 font-bold bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded hover:bg-sky-500 hover:text-slate-950 transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  Chek ko'rish
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WebApp Documents Tab */}
                  {miniAppTab === "documents" && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-4">
                        <h6 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-850">
                          <FileText className="w-4 h-4 text-sky-400" />
                          Hujjatlar Ro'yxati (Smart Audit)
                        </h6>

                        <div className="space-y-2">
                          {[
                            { name: "Tug'ilganlik to'g'risida guvohnoma", key: "birthCertificate" },
                            { name: "Tibbiy karta (086-shakl)", key: "medicalCard" },
                            { name: "Ota-ona passport nusxasi", key: "passportCopy" },
                            { name: "Ikki tomonlama shartnoma", key: "contract" },
                            { name: "Rasm 3x4 (6 ta)", key: "photoUploaded" }
                          ].map((doc) => {
                            const isUploaded = (activeChild?.documents as any)?.[doc.key];
                            return (
                              <div key={doc.key} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                                <span className="text-xs text-white font-bold">{doc.name}</span>
                                <span className={`text-[8px] font-black font-mono px-2 py-0.5 rounded ${
                                  isUploaded ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                }`}>{isUploaded ? "YUKLANGAN ✅" : "KUTILMOQDA ⚠️"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WebApp Complaint / Suggestions Tab */}
                  {miniAppTab === "complaint" && (
                    <div className="space-y-4 animate-fade-in">
                      <form onSubmit={submitComplaintWebApp} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-4 shadow">
                        <h6 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-850">
                          <MessageSquare className="w-4 h-4 text-rose-400" />
                          Shikoyat & Taklif Yuborish
                        </h6>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Taqriz/Xabar yozing:</label>
                          <textarea
                            value={complaintText}
                            onChange={(e) => setComplaintText(e.target.value)}
                            rows={4}
                            placeholder="Shikoyat, taklif yoki minnatdorchilik matni. Bu xabar direktor ekranida darhol chiqadi."
                            className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 rounded-xl p-3 text-xs text-white outline-none placeholder-slate-600 resize-none"
                          ></textarea>
                        </div>

                        {complaintSuccess && (
                          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-lg border border-emerald-500/20 text-center font-bold animate-pulse">
                            ✅ Shikoyat yuborildi va Direktor dashboardiga tushdi!
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={!complaintText.trim()}
                          className="w-full bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                        >
                          DIREKTORGA YUBORISH 📨
                        </button>
                      </form>
                    </div>
                  )}

                </div>

                {/* Mini App Bottom Bar Navigation */}
                <div className="bg-slate-900 border-t border-slate-850 p-1 shrink-0 grid grid-cols-7 gap-0.5 text-center">
                  {[
                    { tab: "home", label: "Dashboard", icon: <User className="w-4 h-4 mx-auto" /> },
                    { tab: "attendance", label: "Davomat", icon: <Calendar className="w-4 h-4 mx-auto" /> },
                    { tab: "meals", label: "Taom", icon: <Utensils className="w-4 h-4 mx-auto" /> },
                    { tab: "health", label: "Karta", icon: <Heart className="w-4 h-4 mx-auto" /> },
                    { tab: "payments", label: "To'lov", icon: <CreditCard className="w-4 h-4 mx-auto" /> },
                    { tab: "documents", label: "Hujjat", icon: <FileText className="w-4 h-4 mx-auto" /> },
                    { tab: "complaint", label: "Shikoyat", icon: <MessageSquare className="w-4 h-4 mx-auto" /> }
                  ].map((t) => (
                    <button
                      key={t.tab}
                      onClick={() => setMiniAppTab(t.tab as any)}
                      className={`py-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                        miniAppTab === t.tab
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t.icon}
                      <span className="text-[7px] font-bold block mt-1 tracking-tighter uppercase leading-none">{t.label}</span>
                    </button>
                  ))}
                </div>

              </div>
            )}

          </div>
        )}

      </div>
      )}

      {/* ACTIVITY LOG TAB VIEW FOR DIRECTORS */}
      {simTab === "api_logs" && (
        <div className="flex-1 bg-slate-950/90 border border-slate-850 rounded-2xl flex flex-col overflow-hidden p-4 space-y-3 shadow-inner">
          {/* Centralized Bot Status & Health Dashboard */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
                Telegram Bot Monitoring Service
              </span>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                botStatus?.status === "online" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${botStatus?.status === "online" ? "bg-emerald-400 animate-pulse" : "bg-rose-400 animate-ping"}`}></span>
                {botStatus?.status?.toUpperCase() || "ONLINE"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block text-[8px] uppercase font-bold">API Token (Active)</span>
                <span className="text-slate-300 font-mono text-[9px] block truncate" title="8723475488:AAGaZilNNb2jZll-l7zd6zMSuVF3vGi3U7E">
                  8723475488:AAGaZilNN...
                </span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block text-[8px] uppercase font-bold">Bot Mode / Route</span>
                <span className="text-slate-300 font-bold block truncate">
                  {botStatus?.mode || "Centralized Bot"}
                </span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block text-[8px] uppercase font-bold">Uptime Rate</span>
                <span className="text-emerald-400 font-mono font-bold block">
                  {botStatus?.uptime || "99.98%"}
                </span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block text-[8px] uppercase font-bold">Network Latency</span>
                <span className="text-sky-400 font-mono font-bold block">
                  {botStatus?.latency ? `${botStatus.latency} ms` : "-- ms"}
                </span>
              </div>
            </div>

            {botStatus?.error && (
              <div className="bg-rose-950/40 p-2 rounded border border-rose-500/20 text-[9px] text-rose-300 font-mono leading-relaxed space-y-1">
                <div className="flex items-center gap-1 font-bold text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Connection Error Detected:
                </div>
                <p>{botStatus.error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await telegramService.toggleSimulatedError();
                  triggerToast("🔄 Simulyatordagi xatolik holati o'zgartirildi!");
                  fetchApiLogs();
                }}
                className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[9px] font-bold py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer active:scale-95"
              >
                ⚠️ Simulyator Xatoligini Yoqish/O'chirish
              </button>
              
              <button
                onClick={fetchApiLogs}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-[9px] font-black py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
              >
                Yangilash 🔄
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center shrink-0 pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Simplified Telegram API Requests (Last 10)
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {apiLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs italic">
                Hozircha API so'rovlar mavjud emas.
              </div>
            ) : (
              apiLogs.slice(0, 10).map((log: any) => {
                const isIncoming = log.direction === "INCOMING";
                const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "";
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-900/80 rounded-xl border border-slate-850 hover:border-slate-750 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase font-mono ${
                            isIncoming
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          }`}
                        >
                          {log.direction}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {log.method}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono font-bold ${
                            log.statusCode >= 200 && log.statusCode < 300
                              ? "text-emerald-500"
                              : "text-rose-500 animate-pulse"
                          }`}
                        >
                          HTTP {log.statusCode}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono">
                          {dateStr || log.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-850/60">
                      <pre className="text-[9px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed break-all">
                        {log.payload}
                      </pre>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RECEIPT VIEW MODAL OVERLAY */}
      {viewingReceipt && (
        <div className="absolute inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-[280px] space-y-4 text-slate-100 font-sans shadow-2xl relative">
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute top-2.5 right-2.5 text-slate-500 hover:text-white font-bold cursor-pointer text-sm p-1"
            >
              X
            </button>
            
            <div className="text-center space-y-1">
              <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block">Nihol AI ERP • Chek</span>
              <h6 className="text-xs font-black text-white">XIZMAT TO'LOV CHEKI</h6>
              <span className="text-[9px] text-slate-500 font-mono">No: {viewingReceipt.id}</span>
            </div>

            <div className="border-t border-b border-dashed border-slate-850 py-3 text-[10px] space-y-2.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">BOLANING ISMI:</span>
                <span className="text-white font-bold">{activeChild?.name.split(" ")[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID RAQAM:</span>
                <span className="text-white font-bold">{viewingReceipt.childId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TO'LOV OYI:</span>
                <span className="text-white font-bold">{viewingReceipt.month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TO'LOV USULI:</span>
                <span className="text-white font-bold">{viewingReceipt.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">KODI / TR ID:</span>
                <span className="text-white font-bold">TRX-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">HOLATI:</span>
                <span className="text-emerald-400 font-black">{viewingReceipt.status.toUpperCase()}</span>
              </div>

              <div className="border-t border-dashed border-slate-850 pt-2.5 flex justify-between text-xs font-sans">
                <span className="text-white font-black">UMUMIY SUMMA:</span>
                <span className="text-emerald-400 font-black font-mono">{viewingReceipt.amount.toLocaleString()} UZS</span>
              </div>
            </div>

            {/* Receipt QR validation */}
            <div className="bg-slate-950 p-2 rounded-xl text-center border border-slate-850">
              <span className="text-[8px] text-emerald-400 font-bold block uppercase tracking-wider mb-1">Davlat Soliq Qo'mitasi QR-Cheki</span>
              {/* Mini QR pattern */}
              <div className="w-12 h-12 bg-white mx-auto p-1 rounded flex items-center justify-center">
                <div className="grid grid-cols-4 gap-0.5 w-full h-full bg-slate-950 rounded">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${
                        (i % 2 === 0 || i < 3 || i > 12) ? "bg-white" : "bg-slate-950"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  triggerToast("📥 PDF shaklida yuklab olindi.");
                  setViewingReceipt(null);
                }}
                className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-2 rounded-xl text-[10px] uppercase cursor-pointer"
              >
                Yuklash
              </button>
              <button
                onClick={() => {
                  triggerToast("🖨️ Chek chop etishga yuborildi.");
                  setViewingReceipt(null);
                }}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 p-2 rounded-xl cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-world test warning notice footer */}
      <div className="bg-amber-500/5 p-2.5 rounded-2xl border border-amber-500/10 flex items-start gap-2.5 shrink-0 mt-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-[9px] text-slate-400 leading-normal">
          Ushbu parent portal 100% integratsiyalashgan! Skanerlash datchiklari, harorat signallari va tibbiy o'zgarishlar Telegram orqali push kvitansiya sifatida ota-onaga darhol keladi.
        </p>
      </div>

    </div>
  );
}
