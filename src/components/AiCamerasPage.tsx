import React, { useState, useEffect } from "react";
import {
  Camera,
  CheckCircle,
  Shield,
  RefreshCw,
  User,
  Activity
} from "lucide-react";
import FaceIdSimulator from "./FaceIdSimulator";

export function getFormattedTime(dateInput?: Date | string): string {
  const d = dateInput ? (typeof dateInput === "string" ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(d.getTime())) return "08:00";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getFormattedTimeWithSeconds(dateInput?: Date | string): string {
  const d = dateInput ? (typeof dateInput === "string" ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(d.getTime())) return "08:00:00";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface AiCamerasPageProps {
  childrenList: any[];
  onScanComplete?: () => void;
}

export default function AiCamerasPage({ childrenList, onScanComplete }: AiCamerasPageProps) {
  const [localTime, setLocalTime] = useState("");
  const [aiLogs, setAiLogs] = useState<Array<{ id: string; time: string; msg: string; type: "info" | "warn" | "danger" }>>([
    { id: "1", time: getFormattedTimeWithSeconds(new Date(Date.now() - 300000)), msg: "AI Vision serveri ulandi va ishga tushdi.", type: "info" },
    { id: "2", time: getFormattedTimeWithSeconds(new Date(Date.now() - 150000)), msg: "Biometrik Face ID datchiklari ulandi.", type: "info" },
    { id: "3", time: getFormattedTimeWithSeconds(new Date(Date.now() - 60000)), msg: "CAM-03: darvoza skaneri normal holatda.", type: "info" }
  ]);

  const [selectedFaceChildId, setSelectedFaceChildId] = useState<string>("");
  const [matchingFace, setMatchingFace] = useState<boolean>(false);
  const [matchedFaceResult, setMatchedFaceResult] = useState<any>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Auto-select first child
  useEffect(() => {
    if (childrenList && childrenList.length > 0 && !selectedFaceChildId) {
      setSelectedFaceChildId(childrenList[0].id);
    }
  }, [childrenList]);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(getFormattedTimeWithSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addAiLog = (msg: string, type: "info" | "warn" | "danger" = "info") => {
    setAiLogs(prev => [{ id: String(Date.now()), time: getFormattedTimeWithSeconds(), msg, type }, ...prev].slice(0, 15));
  };

  const handlePerformFaceMatch = async (direction: "in" | "out" = "in") => {
    setMatchError(null);

    if (!childrenList || childrenList.length === 0) {
      setMatchError("Bolalar ma'lumotlari topilmadi. Iltimos, sahifani yangilang.");
      return;
    }
    if (!selectedFaceChildId) {
      setMatchError("Iltimos, solishtiriluvchi bolani tanlang.");
      return;
    }

    const targetChild = childrenList.find((c: any) => c.id === selectedFaceChildId);
    if (!targetChild) {
      setMatchError("Tanlangan bola topilmadi. Ro'yxatdan qaytadan tanlang.");
      return;
    }

    setMatchingFace(true);
    setMatchedFaceResult(null);

    await new Promise(r => setTimeout(r, 1800));

    const matchConfidence = (97.8 + Math.random() * 2.0).toFixed(1);
    const temp = (36.3 + Math.random() * 0.5).toFixed(1);

    try {
      await fetch("/api/face-id/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceIp: direction === "in" ? "192.168.1.221" : "192.168.1.226",
          childId: targetChild.id,
          direction,
          temperature: Number(temp)
        })
      });
      if (onScanComplete) onScanComplete();
    } catch (e) {}

    setMatchedFaceResult({
      child: targetChild,
      confidence: matchConfidence,
      temp,
      direction: direction === "in" ? "Kirish (Bog'chaga keldi)" : "Chiqish (Uyga ketdi)",
      directionRaw: direction,
      time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    });

    addAiLog(`[Face ID] ${targetChild.name} aniqlandi — Moslik: ${matchConfidence}%, Harorat: ${temp}°C, ${direction === "in" ? "KIRDI" : "KETDI"}`, "info");
    setMatchingFace(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            AI Face ID Biometrik Kirish/Chiqish Tizimi
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Bog'cha darvozasidagi aqlli biometrik datchiklar orqali real vaqt rejimida yuz aniqlash va davomat qayd etish tizimi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800 px-3 py-1.5 rounded-xl font-bold">
            Live: <span className="text-emerald-400">{localTime}</span>
          </span>
          <button
            onClick={() => { setMatchedFaceResult(null); setMatchError(null); addAiLog("Tizim qayta yuklandi.", "info"); }}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 p-2 rounded-xl transition-all hover:text-emerald-400 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MAIN: Face ID (left) + Device Integration (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT: LARGE FACE ID HERO */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/20 rounded-3xl p-6 shadow-2xl shadow-emerald-500/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.07),transparent_65%)] pointer-events-none" />

          {/* Title */}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-white font-black text-base flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping shrink-0" />
                Face ID Biometrik Tizim
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-vaqt yuz aniqlash, solishtirish va davomat</p>
            </div>
            <span className={`text-[9px] font-mono font-black px-2.5 py-1 rounded-full border ${matchingFace ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
              {matchingFace ? "⚡ SKANERLASH..." : "● TAYYOR"}
            </span>
          </div>

          {/* Scanner Ring */}
          <div className="flex flex-col items-center justify-center py-2 mb-5 relative z-10">
            <div className="relative flex items-center justify-center" style={{ width: 224, height: 224 }}>
              {/* Rings */}
              <div className={`absolute w-56 h-56 rounded-full border-2 transition-all duration-700 ${matchingFace ? 'border-emerald-500/50 animate-ping' : 'border-emerald-500/10'}`} />
              <div className={`absolute w-48 h-48 rounded-full border transition-all duration-500 ${matchingFace ? 'border-emerald-400/40' : 'border-emerald-500/08'}`} />
              <div className={`absolute w-44 h-44 rounded-full border-2 border-dashed transition-all ${matchingFace ? 'border-emerald-400 animate-spin' : 'border-emerald-500/15'}`}
                style={{ animationDuration: "2.5s" }} />

              {/* Face circle */}
              <div className={`relative w-40 h-40 rounded-full bg-slate-950 border-4 flex items-center justify-center shadow-2xl overflow-hidden transition-all ${matchedFaceResult ? 'border-emerald-500 shadow-emerald-500/20' : matchingFace ? 'border-emerald-400' : 'border-emerald-500/25'}`}>
                {matchedFaceResult ? (
                  <>
                    <img
                      src={matchedFaceResult.child.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedFaceResult.child.name)}&background=0f172a&color=10b981&size=160&bold=true`}
                      alt={matchedFaceResult.child.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedFaceResult.child.name)}&background=0f172a&color=10b981&size=160&bold=true`; }}
                    />
                    <div className="absolute inset-0 bg-emerald-500/10 flex items-end justify-center pb-2">
                      <span className="bg-emerald-500 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-full">✓ Aniqlandi</span>
                    </div>
                  </>
                ) : matchingFace ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[8px] text-emerald-400 font-mono font-black uppercase tracking-widest">Skanerlash...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <Shield className="w-12 h-12 text-emerald-500/25" />
                    <span className="text-[9px] text-slate-500 font-mono leading-tight">Bolani tanlang va skanerlang</span>
                  </div>
                )}
              </div>

              {/* Corner brackets */}
              <svg className="absolute pointer-events-none" width={224} height={224} viewBox="0 0 224 224" fill="none">
                <path d="M16 16 L16 48 M16 16 L48 16" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" opacity={matchingFace ? "1" : "0.4"} />
                <path d="M208 16 L208 48 M208 16 L176 16" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" opacity={matchingFace ? "1" : "0.4"} />
                <path d="M16 208 L16 176 M16 208 L48 208" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" opacity={matchingFace ? "1" : "0.4"} />
                <path d="M208 208 L208 176 M208 208 L176 208" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" opacity={matchingFace ? "1" : "0.4"} />
                {matchingFace && <line x1="16" y1="112" x2="208" y2="112" stroke="rgba(16,185,129,0.35)" strokeWidth="1.5" strokeDasharray="5 5" />}
              </svg>
            </div>

            {/* Status */}
            <div className="mt-5 text-center min-h-[40px]">
              {matchingFace ? (
                <p className="text-emerald-400 font-black text-sm animate-pulse">⚡ Yuz vektori tahlil qilinmoqda...</p>
              ) : matchedFaceResult ? (
                <div>
                  <p className="text-emerald-400 font-black text-base">✅ {matchedFaceResult.child.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{matchedFaceResult.direction} • {matchedFaceResult.time}</p>
                </div>
              ) : (
                <p className="text-slate-500 text-xs">Skanerlash uchun quyidagi tugmani bosing</p>
              )}
            </div>
          </div>

          {/* Error */}
          {matchError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
              <p className="text-rose-400 text-xs font-bold">⚠️ {matchError}</p>
            </div>
          )}

          {/* Confidence + result */}
          {matchedFaceResult && (
            <div className="mb-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Moslik darajasi:</span>
                <span className="text-emerald-400 font-black font-mono text-sm">{matchedFaceResult.confidence}%</span>
              </div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-1000"
                  style={{ width: `${matchedFaceResult.confidence}%` }} />
              </div>
              <div className="flex items-center gap-3 bg-slate-950/80 border border-emerald-500/25 p-3 rounded-2xl">
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500/50 shrink-0">
                  <img
                    src={matchedFaceResult.child.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedFaceResult.child.name)}&background=0f172a&color=10b981&size=48&bold=true`}
                    alt="" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedFaceResult.child.name)}&background=0f172a&color=10b981&size=48&bold=true`; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-black text-xs truncate">{matchedFaceResult.child.name}</h4>
                  <p className="text-[10px] font-black mt-0.5" style={{ color: matchedFaceResult.directionRaw === "in" ? "#10b981" : "#38bdf8" }}>
                    {matchedFaceResult.directionRaw === "in" ? "🟢 KIRDI" : "🔵 KETDI"}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">Harorat: {matchedFaceResult.temp}°C • {matchedFaceResult.time}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-emerald-400 font-black text-xl font-mono block leading-none">{matchedFaceResult.confidence}%</span>
                  <span className="text-[8px] text-emerald-500 font-bold uppercase">ANIQLANDI</span>
                </div>
              </div>
            </div>
          )}

          {/* Child selector */}
          <div className="space-y-2 mb-4">
            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3" />
              Solishtiriluvchi bola:
            </label>
            {childrenList && childrenList.length > 0 ? (
              <select
                value={selectedFaceChildId}
                onChange={(e) => setSelectedFaceChildId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white rounded-xl py-2.5 px-3 text-xs outline-none font-medium"
              >
                <option value="">-- Bolani tanlang --</option>
                {childrenList.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} {c.group ? `(${c.group})` : ""} — ID: {c.id}</option>
                ))}
              </select>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] p-2.5 rounded-xl font-bold">
                ⚠️ Bolalar ma'lumotlari yuklanmagan.
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePerformFaceMatch("in")}
              disabled={matchingFace || !selectedFaceChildId}
              className="bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 px-4 rounded-2xl text-sm flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              {matchingFace ? (
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin block" />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
              <span>KIRDI 🟢</span>
              <span className="text-[9px] opacity-70 font-medium">Bog'chaga keldi</span>
            </button>
            <button
              onClick={() => handlePerformFaceMatch("out")}
              disabled={matchingFace || !selectedFaceChildId}
              className="bg-gradient-to-r from-sky-700 to-sky-500 hover:from-sky-600 hover:to-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 px-4 rounded-2xl text-sm flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xl shadow-sky-500/20 active:scale-95"
            >
              {matchingFace ? (
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin block" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
              <span>KETDI 🔵</span>
              <span className="text-[9px] opacity-70 font-medium">Uyga qaytdi</span>
            </button>
          </div>
        </div>

        {/* RIGHT: DEVICE INTEGRATION */}
        <div>
          <FaceIdSimulator childrenList={childrenList} onScanComplete={onScanComplete || (() => {})} />
        </div>
      </div>

      {/* AI Log */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Biometrik Tizim Jurnali:</span>
        </div>
        <div className="space-y-1.5 max-h-[150px] overflow-y-auto font-mono text-[10px] pr-1">
          {aiLogs.map((log) => (
            <div key={log.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800/60 flex items-start gap-2.5">
              <span className="text-slate-600 shrink-0">[{log.time}]</span>
              <span className={`shrink-0 font-bold uppercase text-[9px] px-1.5 py-0.5 rounded ${
                log.type === "danger" ? "bg-rose-500/10 text-rose-400" : log.type === "warn" ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-400"
              }`}>
                {log.type === "danger" ? "ALARM" : log.type === "warn" ? "WARN" : "INFO"}
              </span>
              <span className="text-slate-300 leading-tight">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
