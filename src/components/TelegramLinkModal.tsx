import React, { useState, useEffect } from "react";
import { X, Send, CheckCircle2, MessageSquare, AlertCircle, Activity, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { User } from "../types";

interface TelegramLinkModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export default function TelegramLinkModal({ user, isOpen, onClose, onSuccess }: TelegramLinkModalProps) {
  const [chatId, setChatId] = useState(user.telegramChatId || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Diagnostic states
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen && showDiagnostics) {
      fetchDiagnostics();
    }
  }, [isOpen, showDiagnostics]);

  const fetchDiagnostics = async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        fetch("/api/telegram-simulator/status"),
        fetch("/api/telegram-simulator/logs")
      ]);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setBotStatus(statusData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setRecentLogs(logsData.slice(0, 5)); // top 5 most recent
      }
    } catch (err) {
      console.error("Diagnostic fetch failed:", err);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setTestSuccess(null);
    try {
      const res = await fetch("/api/telegram-simulator/test-connection", {
        method: "POST"
      });
      const data = await res.json();
      setTestSuccess(data.success);
      setTestResult(data.message);
      // Refresh logs & status
      fetchDiagnostics();
    } catch (err) {
      setTestSuccess(false);
      setTestResult("Tarmoq ulanishida xatolik yuz berdi.");
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId.trim()) {
      setError("Iltimos, Telegram Chat ID kiriting!");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/users/link-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.id,
          telegramChatId: chatId.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Telegram hisobingiz muvaffaqiyatli bog'landi!");
        onSuccess({
          ...user,
          telegramChatId: chatId.trim()
        });
      } else {
        setError(data.message || "Xatolik yuz berdi.");
      }
    } catch (err) {
      setError("Server bilan aloqa muvaffaqiyatsiz tugadi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Telegramni Bog'lash</h3>
            <p className="text-xs text-slate-400">Shaxsiy profilni Telegram WebApp bilan ulash</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 mb-4 text-xs font-semibold">
          <button
            type="button"
            className={`pb-2 px-4 border-b-2 transition-all ${!showDiagnostics ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            onClick={() => setShowDiagnostics(false)}
          >
            Hisobni Ulash
          </button>
          <button
            type="button"
            className={`pb-2 px-4 border-b-2 transition-all flex items-center gap-1.5 ${showDiagnostics ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            onClick={() => setShowDiagnostics(true)}
          >
            <Activity className="w-3.5 h-3.5" />
            Tizim Diagnostikasi
          </button>
        </div>

        {!showDiagnostics ? (
          <form onSubmit={handleLink} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Sizning Telegram Chat ID:
              </label>
              <input
                type="text"
                placeholder="Masalan: 539451072"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl py-3 px-4 text-white placeholder-slate-600 outline-none transition-all text-sm font-mono"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs text-slate-400">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                Chat ID ni qanday aniqlash mumkin?
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                <li>Telegramda <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">@userinfobot</a> botini qidiring</li>
                <li>Botga <code className="bg-slate-900 px-1 py-0.5 rounded text-white text-[10px]">/start</code> buyrug'ini yuboring</li>
                <li>Bot yuborgan <code className="text-sky-400 font-bold">Id</code> raqamini nusxalab ushbu maydonga kiriting</li>
              </ol>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 py-3 rounded-xl font-bold text-xs transition-all"
              >
                Yopish
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Hisobni Ulash
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Live Webhook / API Status Card */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Ulanish Statusi:</span>
                {botStatus?.status === "online" ? (
                  <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    <Wifi className="w-3 h-3" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-lg text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    <WifiOff className="w-3 h-3" /> Offline
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-slate-500 block">Ishlash vaqti (Uptime):</span>
                  <span className="text-white font-mono font-bold">{botStatus?.uptime || "99.9%"}</span>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-slate-500 block">Kechikish (Latency):</span>
                  <span className="text-sky-400 font-mono font-bold">{botStatus?.latency ? `${botStatus.latency} ms` : "—"}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Ishlash Rejimi:</span>
                <span className="text-white font-semibold font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                  {botStatus?.mode || "Simulator Mode"}
                </span>
              </div>

              {botStatus?.error && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-400 font-mono">
                  {botStatus.error}
                </div>
              )}

              {/* Test connection action */}
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full bg-slate-900 border border-slate-800 hover:border-sky-500 hover:bg-slate-850 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>Bog'lanishni Sinash (Test Connection)</span>
              </button>

              {testResult !== null && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${testSuccess ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                  {testSuccess ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span className="leading-normal">{testResult}</span>
                </div>
              )}
            </div>

            {/* Last Synced Events Logs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">So'nggi hodisalar loglari:</h4>
                <button 
                  type="button" 
                  onClick={fetchDiagnostics} 
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-850 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden max-h-40 overflow-y-auto font-mono text-[10px] p-2 space-y-1.5 divide-y divide-slate-900">
                {recentLogs.length === 0 ? (
                  <p className="text-slate-600 text-center py-4">Hech qanday hodisa topilmadi.</p>
                ) : (
                  recentLogs.map((log, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0">
                      <div className="flex items-center justify-between text-slate-500 text-[9px] mb-0.5">
                        <span className={`font-bold px-1 rounded uppercase tracking-wider ${log.direction === "INCOMING" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                          {log.direction}
                        </span>
                        <span>{log.timestamp}</span>
                      </div>
                      <div className="text-slate-300 font-bold break-words">{log.apiMethod}</div>
                      <div className="text-slate-400 break-words line-clamp-2 mt-0.5">
                        {typeof log.payload === "string" ? log.payload : JSON.stringify(log.payload)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 py-3 rounded-xl font-bold text-xs transition-all mt-2"
            >
              Yopish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
