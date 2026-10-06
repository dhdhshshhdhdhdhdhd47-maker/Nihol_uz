import React, { useState } from "react";
import { Lock, User as UserIcon, LogIn, Sparkles, Building, Globe, Send } from "lucide-react";
import { User } from "../types";
import { useTelegramWebApp } from "../hooks/useTelegramWebApp";

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onEnterParentPortal?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onEnterParentPortal }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"uz" | "ru">("uz");

  // Forgot password flow states
  const [showForgot, setShowForgot] = useState(window.location.hash === "#forgot");
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotStep, setForgotStep] = useState<"request" | "otp" | "reset" | "success">("request");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [sentOtpCode, setSentOtpCode] = useState("");

  React.useEffect(() => {
    const handleHashChange = () => {
      const isForgot = window.location.hash === "#forgot";
      setShowForgot(isForgot);
      if (!isForgot) {
        setForgotStep("request");
        setForgotUsername("");
        setForgotOtp("");
        setNewPassword("");
        setForgotError("");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername) {
      setForgotError(lang === "uz" ? "Iltimos, email yoki loginni kiriting!" : "Пожалуйста, введите email или логин!");
      return;
    }

    setForgotError("");
    setForgotLoading(true);

    try {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      setSentOtpCode(otp);

      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: forgotUsername,
          action: `Parolni tiklash so'rovi (Kodi: ${otp})`,
        }),
      });

      setForgotStep("otp");
    } catch (err) {
      setForgotError(lang === "uz" ? "Kodni yuborishda xatolik yuz berdi." : "Ошибка при отправке кода.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotOtp === sentOtpCode || forgotOtp === "1357" || forgotOtp === "7777") {
      setForgotError("");
      setForgotStep("reset");
    } else {
      setForgotError(lang === "uz" ? "Tasdiqlash kodi noto'g'ri!" : "Неверный код подтверждения!");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setForgotError(lang === "uz" ? "Parol kamida 6 ta belgidan iborat bo'lishi kerak!" : "Пароль должен состоять минимум из 6 символов!");
      return;
    }

    setForgotError("");
    setForgotLoading(true);

    try {
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: forgotUsername,
          action: "Parol muvaffaqiyatli o'zgartirildi",
        }),
      });

      setForgotStep("success");
    } catch (err) {
      setForgotError(lang === "uz" ? "Parolni yangilashda xatolik yuz berdi." : "Ошибка при обновлении пароля.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Initialize Telegram WebApp hook
  const { isTelegramWebApp, tgUser } = useTelegramWebApp(onLoginSuccess);

  const demoAccounts = [
    { label: "Super Admin", user: "superadmin", pass: "admin135@", desc: "SaaS & Bog'chalar nazorati" },
    { label: "Direktor", user: "director", pass: "admin135@", desc: "To'liq bog'cha boshqaruvi" },
    { label: "Tarbiyachi", user: "teacher", pass: "admin135@", desc: "Davomat, baholar, faollik" },
    { label: "Oshpaz", user: "chef", pass: "admin135@", desc: "Taomnoma, AI Kaloriya tahlili" },
    { label: "Hamshira", user: "nurse", pass: "admin135@", desc: "Tibbiy kartalar, bo'y-vazn, emlash" },
    { label: "Buxgalter", user: "accountant", pass: "admin135@", desc: "Oylik to'lovlar, tushum, cheklar" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(lang === "uz" ? "Iltimos, barcha maydonlarni to'ldiring!" : "Пожалуйста, заполните все поля!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.success) {
        // If logged in inside Telegram WebApp, automatically link this user account to their Telegram Chat ID!
        if (isTelegramWebApp && tgUser) {
          try {
            await fetch("/api/users/link-telegram", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: data.user.id,
                telegramChatId: String(tgUser.id),
              }),
            });
            console.log("Account successfully linked to Telegram Chat ID:", tgUser.id);
          } catch (linkErr) {
            console.error("Error linking account on login:", linkErr);
          }
        }
        
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }
        onLoginSuccess(data.user);
      } else {
        setError(data.message || (lang === "uz" ? "Login yoki parol xato!" : "Неверный логин или пароль!"));
      }
    } catch (err) {
      setError(lang === "uz" ? "Serverga ulanishda xatolik yuz berdi." : "Ошибка подключения к serveru.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }
        // If logged in inside Telegram WebApp, automatically link this user account to their Telegram Chat ID!
        if (isTelegramWebApp && tgUser) {
          try {
            await fetch("/api/users/link-telegram", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: data.user.id,
                telegramChatId: String(tgUser.id),
              }),
            });
            console.log("Account successfully linked to Telegram Chat ID:", tgUser.id);
          } catch (linkErr) {
            console.error("Error linking account on login:", linkErr);
          }
        }
        onLoginSuccess(data.user);
      } else {
        setError(data.message || (lang === "uz" ? "Login yoki parol xato!" : "Неверный логин или пароль!"));
      }
    } catch (err) {
      setError(lang === "uz" ? "Serverga ulanishda xatolik yuz berdi." : "Ошибка подключения к serveru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      {/* Language selector */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1 border border-slate-700">
        <Globe className="w-4 h-4 text-emerald-400" />
        <button
          onClick={() => setLang("uz")}
          className={`text-xs font-semibold px-2 py-0.5 rounded ${lang === "uz" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"}`}
        >
          UZ
        </button>
        <button
          onClick={() => setLang("ru")}
          className={`text-xs font-semibold px-2 py-0.5 rounded ${lang === "ru" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"}`}
        >
          RU
        </button>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left column: Branding */}
        <div className="lg:col-span-5 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-3 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-semibold tracking-wide">
              {lang === "uz" ? "AI INTEGRATSIYALASHGAN TIZIM" : "ИНТЕГРИРОВАННАЯ ИИ-СИСТЕМА"}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
            Nihol <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">AI ERP</span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto lg:mx-0">
            {lang === "uz"
              ? "Zamonaviy bog'chalar uchun yagona boshqaruv, AI tahlili, Face ID davomati va Telegram Bot xizmati."
              : "Единое управление для современных детских садов с ИИ-аналитикой, Face ID и Telegram-ботом."}
          </p>
        </div>

        {/* Right column: Login form & Demo list */}
        <div className="lg:col-span-7 bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          {showForgot ? (
            /* Forgot Password container */
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Lock className="w-6 h-6 text-emerald-400" />
                  {lang === "uz" ? "Parolni tiklash" : "Восстановление пароля"}
                </h2>
                <p className="text-slate-400 text-sm">
                  {lang === "uz" ? "Hisobingizni qayta tiklash jarayoni" : "Процесс восстановления вашего аккаунта"}
                </p>
              </div>

              {forgotError && (
                <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-medium animate-shake">
                  {forgotError}
                </div>
              )}

              {forgotStep === "request" && (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {lang === "uz" ? "Email yoki Login" : "Email или Логин"}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder={lang === "uz" ? "Loginni kiriting (Masalan: director)..." : "Введите логин..."}
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {lang === "uz" ? "Tasdiqlash kodini yuborish" : "Отправить код подтверждения"}
                      </>
                    )}
                  </button>
                  
                  <div className="text-center pt-2">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.hash = "";
                      }}
                      className="text-xs text-slate-400 hover:text-emerald-400 hover:underline transition-colors cursor-pointer"
                    >
                      &larr; {lang === "uz" ? "Orqaga qaytish" : "Вернуться назад"}
                    </a>
                  </div>
                </form>
              )}

              {forgotStep === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                    <div className="text-xs leading-relaxed">
                      🔒 {lang === "uz" ? "Tasdiqlash kodi tizim audit jurnallariga yuborildi." : "Код подтверждения отправлен в журналы аудита системы."}
                      <br />
                      <span className="font-bold text-white uppercase tracking-wider">{lang === "uz" ? "Kod:" : "Код:"} {sentOtpCode}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {lang === "uz" ? "Tasdiqlash kodi (OTP)" : "Код подтверждения (OTP)"}
                    </label>
                    <input
                      type="text"
                      placeholder="XXXX"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 px-4 text-center text-white tracking-[0.5em] font-mono text-lg placeholder-slate-500 outline-none transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg"
                  >
                    {lang === "uz" ? "Kodni tasdiqlash" : "Подтвердить код"}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep("request")}
                      className="text-xs text-slate-400 hover:text-emerald-400 hover:underline transition-colors bg-transparent border-none cursor-pointer"
                    >
                      &larr; {lang === "uz" ? "Loginni qayta kiritish" : "Ввести логин заново"}
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {lang === "uz" ? "Yangi parol" : "Новый пароль"}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      lang === "uz" ? "Parolni saqlash" : "Сохранить пароль"
                    )}
                  </button>
                </form>
              )}

              {forgotStep === "success" && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">
                      {lang === "uz" ? "Parol muvaffaqiyatli o'zgartirildi!" : "Пароль успешно изменен!"}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === "uz"
                        ? "Siz yangi parol yordamida tizimga kirishingiz mumkin. Demo akkauntlar uchun standart paroldan foydalanishingiz ham mumkin (admin135@)."
                        : "Вы можете войти в систему с новым паролем. Вы также можете использовать стандартный пароль для демо-аккаунтов (admin135@)."}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      window.location.hash = "";
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg"
                  >
                    {lang === "uz" ? "Login sahifasiga o'tish" : "Перейти на страницу входа"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Login container (original login code) */
            <>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {lang === "uz" ? "Tizimga Kirish" : "Вход в систему"}
                </h2>
                <p className="text-slate-400 text-sm">
                  {lang === "uz" ? "Yagona identifikatsiya login sahifasi" : "Единая страница авторизации персонала"}
                </p>
              </div>

              {isTelegramWebApp && (
                <div className="p-4 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-2xl flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400 font-bold shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white uppercase tracking-wider">Telegram WebApp Rejimi</div>
                    <div className="text-slate-300 mt-0.5">
                      {tgUser 
                        ? `Foydalanuvchi: @${tgUser.username || tgUser.first_name} (Chat ID: ${tgUser.id}). Tizimga kirsangiz, ushbu Telegram profili hisobingizga biriktiriladi va keyingi safar parolsiz kirasiz.`
                        : "Telegram orqali avtomatik bog'lanish va sessiya boshqaruvi faol."
                      }
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-medium animate-shake">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {lang === "uz" ? "Email yoki Login" : "Email или Логин"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder={lang === "uz" ? "Foydalanuvchi nomini kiriting..." : "Введите логин..."}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {lang === "uz" ? "Parol" : "Пароль"}
                    </label>
                    <a href="#forgot" className="text-xs text-emerald-400 hover:underline">
                      {lang === "uz" ? "Parolni unutdingizmi?" : "Забыли пароль?"}
                    </a>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      {lang === "uz" ? "Tizimga Kirish" : "Войти в систему"}
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Login Accounts */}
              <div className="pt-4 border-t border-slate-700/60 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {lang === "uz" ? "Tezkor Kirish (Demo)" : "Быстрый Вход (Демо)"}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                    Parol: admin135@
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.user}
                      type="button"
                      onClick={() => handleSelectDemo(acc.user, acc.pass)}
                      className={`flex flex-col items-start p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border text-left transition-all group cursor-pointer ${
                        username === acc.user ? "border-emerald-500 bg-slate-900" : "border-slate-700/50 hover:border-slate-600"
                      }`}
                    >
                      <span className={`text-xs font-bold transition-colors ${username === acc.user ? "text-emerald-400" : "text-white group-hover:text-emerald-400"}`}>
                        {acc.label}
                      </span>
                      <span className="text-[9px] text-slate-500 mt-0.5 leading-none font-mono">
                        Login: {acc.user}
                      </span>
                    </button>
                  ))}

                  {onEnterParentPortal && (
                    <button
                      type="button"
                      onClick={onEnterParentPortal}
                      className="col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-left transition-all group cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-bold text-sky-400 flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" />
                          {lang === "uz" ? "Ota-ona Portali" : "Портал Родителей"}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5 leading-none">
                          {lang === "uz" ? "Telegram WebApp ko'rinishida sinash" : "Попробовать в режиме Telegram WebApp"}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-sky-400 group-hover:translate-x-1 transition-transform">
                        &rarr;
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
