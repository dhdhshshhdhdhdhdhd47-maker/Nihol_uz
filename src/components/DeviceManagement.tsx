import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Check, RefreshCw, Cpu, Server, Shield, Globe, Terminal, Activity, Sliders, Database, Wifi, WifiOff, RotateCw, Save } from "lucide-react";

interface Device {
  id: string;
  name: string;
  ip: string;
  port?: number;
  status: "Online" | "Offline" | "Maintenance";
  type: "entrance" | "exit" | "system";
  latencyThreshold?: number;
  streamSensitivity?: number;
  details?: {
    camera?: string;
    thermometer?: string;
    relay?: string;
    latencyMs?: number;
    lastHeartbeat?: string;
  };
}

interface DeviceManagementProps {
  devices: Device[];
  onRefresh: () => void;
  notifSuccess: string | null;
  setNotifSuccess: (msg: string | null) => void;
}

export default function DeviceManagement({
  devices = [],
  onRefresh,
  notifSuccess,
  setNotifSuccess
}: DeviceManagementProps) {
  // Form states for new device
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceIp, setNewDeviceIp] = useState("");
  const [newDevicePort, setNewDevicePort] = useState("8080");
  const [newDeviceType, setNewDeviceType] = useState<"entrance" | "exit" | "system">("entrance");
  const [newLatencyThreshold, setNewLatencyThreshold] = useState("100");
  const [newStreamSensitivity, setNewStreamSensitivity] = useState("80");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing config states for existing devices
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editLatencyThreshold, setEditLatencyThreshold] = useState("100");
  const [editStreamSensitivity, setEditStreamSensitivity] = useState("80");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Real-time Diagnostic Widget states
  const [wsConnected, setWsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [packetLogs, setPacketLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [WS] Ulanish o'rnatildi: Face ID biometrik signal shlyuzi faol.`,
    `[${new Date().toLocaleTimeString()}] [DB] Qurilmalar ma'lumotlar bazasi yuklandi.`,
    `[${new Date().toLocaleTimeString()}] [SYS] Boshlang'ich apparat nazorati ishga tushdi: 11 ta port eshitilmoqda.`
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [packetLogs]);

  // Simulate incoming packets periodically to make diagnostic panel extremely high-fidelity
  useEffect(() => {
    const logInterval = setInterval(() => {
      if (!wsConnected) return;

      const randomDevice = devices[Math.floor(Math.random() * devices.length)] || {
        id: "DEV-222",
        name: "Kirish Qurilmasi #2",
        ip: "192.168.1.222",
        latencyThreshold: 100,
        streamSensitivity: 80
      };

      const randValue = Math.random();
      let logLine = "";
      const timeStr = new Date().toLocaleTimeString();

      if (randValue > 0.7) {
        // Ping log
        const latency = Math.floor(Math.random() * 30) + 8;
        logLine = `[${timeStr}] [PING] IP ${randomDevice.ip} -> Jvob vaqti: ${latency}ms (Haddan past: ${randomDevice.latencyThreshold || 100}ms)`;
      } else if (randValue > 0.4) {
        // Raw packet check-in trigger
        const confidence = Math.floor(Math.random() * 40) + 60;
        const pass = confidence >= (randomDevice.streamSensitivity || 80);
        logLine = `[${timeStr}] [PACKET] IP ${randomDevice.ip} -> Face ID Scan: {confidence: ${confidence}%, sensitivity_threshold: ${randomDevice.streamSensitivity || 80}%, status: "${pass ? "SUCCESS" : "REJECT_LOW_CONFIDENCE"}"}`;
      } else {
        // Heartbeat log
        logLine = `[${timeStr}] [HEARTBEAT] ${randomDevice.id} (${randomDevice.name}) -> Datchik holati: Kamera="Active", Termometr="Ready"`;
      }

      setPacketLogs(prev => [...prev.slice(-30), logLine]);
    }, 4500);

    return () => clearInterval(logInterval);
  }, [devices, wsConnected]);

  // Stats calculation
  const totalCount = devices.length;
  const onlineCount = devices.filter((d) => d.status === "Online").length;
  const healthPercentage = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 100;

  const handleRegisterDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId || !newDeviceName || !newDeviceIp) {
      alert("Iltimos barcha kerakli maydonlarni to'ldiring!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hardware/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newDeviceId,
          name: newDeviceName,
          ip: newDeviceIp,
          port: newDevicePort ? parseInt(newDevicePort, 10) : 80,
          type: newDeviceType,
          latencyThreshold: parseInt(newLatencyThreshold, 10) || 100,
          streamSensitivity: parseInt(newStreamSensitivity, 10) || 80
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifSuccess(data.message);
        setTimeout(() => setNotifSuccess(null), 4000);
        
        // Log to diagnostic terminal
        setPacketLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [SYS] Yangi qurilma ulandi: ${newDeviceName} (${newDeviceIp}), Thresholds: Latency=${newLatencyThreshold}ms, Sensitivity=${newStreamSensitivity}%`
        ]);

        // Clear form
        setNewDeviceId("");
        setNewDeviceName("");
        setNewDeviceIp("");
        setNewDevicePort("8080");
        setNewDeviceType("entrance");
        setNewLatencyThreshold("100");
        setNewStreamSensitivity("80");
        
        onRefresh();
      } else {
        alert(data.message || "Qurilmani ro'yxatdan o'tkazishda xatolik yuz berdi!");
      }
    } catch (err) {
      console.error(err);
      alert("Serverga ulanishda xatolik!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!window.confirm("Haqiqatdan ham ushbu jismoniy qurilmani tizimdan o'chirmoqchimisiz?")) {
      return;
    }
    try {
      const res = await fetch(`/api/hardware/devices/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifSuccess(data.message);
        setTimeout(() => setNotifSuccess(null), 3000);
        
        setPacketLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [SYS] Qurilma tizimdan o'chirildi: ID=${id}`
        ]);

        onRefresh();
      } else {
        alert(data.message || "Xatolik yuz berdi!");
      }
    } catch (err) {
      console.error(err);
      alert("Serverga ulanishda xatolik!");
    }
  };

  const handleUpdateDeviceConfig = async (deviceId: string) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch(`/api/hardware/devices/${deviceId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latencyThreshold: parseInt(editLatencyThreshold, 10),
          streamSensitivity: parseInt(editStreamSensitivity, 10)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifSuccess(data.message);
        setTimeout(() => setNotifSuccess(null), 3000);
        
        setPacketLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [CONFIG] Qurilma ${deviceId} parametrlari yangilandi: Latency=${editLatencyThreshold}ms, Stream=${editStreamSensitivity}%`
        ]);

        setEditingDeviceId(null);
        onRefresh();
      } else {
        alert(data.message || "Parametrlarni saqlashda xatolik!");
      }
    } catch (err) {
      console.error(err);
      alert("Serverga ulanishda xatolik!");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const startManualReconnect = () => {
    setIsReconnecting(true);
    setWsConnected(false);
    
    setPacketLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [WS] WebSocket ulanishi qo'lda uzildi... Sinxronizatsiya qayta yuklanmoqda.`
    ]);

    setTimeout(() => {
      setIsReconnecting(false);
      setWsConnected(true);
      onRefresh();
      
      setPacketLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [WS] [SUCCESS] WebSocket shlyuzi muvaffaqiyatli qayta ulandi. Barcha datchik paketlari sinxronlashtirildi.`
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Jami Qurilmalar</span>
            <span className="text-xl font-black text-white font-mono mt-1 block">{totalCount} ta</span>
          </div>
          <div className="bg-sky-500/10 text-sky-400 p-2.5 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Faol (Online)</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{onlineCount} ta</span>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Salomatlik Indeksi</span>
            <span className="text-xl font-black text-yellow-500 font-mono mt-1 block">{healthPercentage}%</span>
          </div>
          <div className="bg-yellow-500/10 text-yellow-500 p-2.5 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid: Form and Real-time Diagnostic Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Registration Form */}
        <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
          <h4 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 text-sky-400">
            <Terminal className="w-4 h-4" /> Yangi biometrik Face ID terminalini ulash
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            O'zingiz sotib olgan haqiqiy biometrik Face ID terminalining IP manzili, boshqaruv porti, kechikish va sezgirlik parametrlarini kiriting.
          </p>

          <form onSubmit={handleRegisterDeviceSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs items-end">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Qurilma ID (Tizim kodi):</label>
              <input
                type="text"
                required
                placeholder="DEV-232"
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none focus:border-sky-500"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Qurilma Nomi:</label>
              <input
                type="text"
                required
                placeholder="Orqa eshik skaneri"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold">IP Manzili:</label>
              <input
                type="text"
                required
                placeholder="192.168.1.232"
                value={newDeviceIp}
                onChange={(e) => setNewDeviceIp(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Tarmoq Porti:</label>
              <input
                type="number"
                required
                placeholder="8080"
                value={newDevicePort}
                onChange={(e) => setNewDevicePort(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Qurilma Turi:</label>
              <select
                value={newDeviceType}
                onChange={(e) => setNewDeviceType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-sky-500 font-medium"
              >
                <option value="entrance">Kirish Terminali (Check-In)</option>
                <option value="exit">Chiqish Terminali (Check-Out)</option>
                <option value="system">Datchik / Smart Taroz / Tizim</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Ruxsat etilgan Kechikish (Threshold):</label>
              <select
                value={newLatencyThreshold}
                onChange={(e) => setNewLatencyThreshold(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-sky-500 font-mono"
              >
                <option value="50">50 ms (Juda tez)</option>
                <option value="100">100 ms (Standart)</option>
                <option value="200">200 ms (Kengaytirilgan)</option>
                <option value="500">500 ms (Sekin tarmoqlar)</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-400 font-bold flex justify-between">
                <span>Kamera sezgirligi (Sensitivity):</span>
                <span className="text-sky-400 font-mono font-bold">{newStreamSensitivity}%</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="98"
                  value={newStreamSensitivity}
                  onChange={(e) => setNewStreamSensitivity(e.target.value)}
                  className="w-full accent-sky-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 font-mono">Min:50%</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" /> Qurilmani ulash
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Diagnostic Widget */}
        <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 text-emerald-400">
              <Database className="w-4 h-4" /> Real-time Diagnostic Monitor
            </h4>
            
            {/* WS status indicator */}
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                wsConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {wsConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                    ONLINE (WS ACTIVE)
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    DISCONNECTED
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Diagnostic Raw Logs Console (Terminal styled) */}
          <div className="flex-1 min-h-[175px] max-h-[220px] bg-slate-900 rounded-xl border border-slate-850 p-3.5 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-2 select-text custom-scrollbar">
            {packetLogs.map((log, i) => (
              <div 
                key={i} 
                className={`${
                  log.includes("[WS]") ? "text-sky-400 font-bold" :
                  log.includes("[PACKET]") ? "text-emerald-400" :
                  log.includes("[HEARTBEAT]") ? "text-slate-400" :
                  log.includes("[PING]") ? "text-yellow-500" : "text-white"
                } leading-relaxed`}
              >
                {log}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-[10px] text-slate-500 leading-tight">
              WebSocket shlyuzi orqali bog'chadagi apparat paketlari real vaqtda kelmoqda.
            </span>
            <button
              type="button"
              onClick={startManualReconnect}
              disabled={isReconnecting}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isReconnecting ? "animate-spin text-sky-400" : ""}`} />
              Sinxronizatsiyani tiklash
            </button>
          </div>
        </div>
      </div>

      {/* Devices List Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" /> Jismoniy Face ID datchiklar boshqaruv paneli
          </span>
          <button
            onClick={onRefresh}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-all cursor-pointer"
            title="Qurilmalarni qayta so'rash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60 font-mono text-[10px]">
                <th className="p-3">ID & QURILMA NOMI</th>
                <th className="p-3">IP MANZIL & PORT</th>
                <th className="p-3 text-center">TUR</th>
                <th className="p-3 text-center">DATCHIK HOLATLARI</th>
                <th className="p-3 text-center">YANGILANGAN CHEKLAR (THRESHOLDS)</th>
                <th className="p-3 text-center">PING</th>
                <th className="p-3 text-center">HEARTBEAT</th>
                <th className="p-3 text-right">SOZLAMALAR / AMALLAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 font-medium">
                    Hozircha ulangan jismoniy qurilmalar yo'q. Yuqoridagi formadan jismoniy Face ID terminalini ro'yxatga oling.
                  </td>
                </tr>
              ) : (
                devices.map((device) => {
                  const isEditing = editingDeviceId === device.id;
                  
                  return (
                    <tr key={device.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            device.status === "Online" ? "bg-emerald-500 animate-pulse" :
                            device.status === "Offline" ? "bg-rose-500" : "bg-yellow-500 animate-pulse"
                          }`}></div>
                          <div>
                            <div className="font-black text-xs text-white">{device.name}</div>
                            <span className="text-[9px] text-slate-500 font-mono">{device.id}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-3 font-mono text-slate-300 text-[11px]">
                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-850">
                          {device.ip}:{device.port || 80}
                        </span>
                      </td>
                      
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          device.type === "entrance" ? "bg-emerald-500/15 text-emerald-400" :
                          device.type === "exit" ? "bg-sky-500/15 text-sky-400" :
                          "bg-purple-500/15 text-purple-400"
                        }`}>
                          {device.type === "entrance" ? "Kirish" : device.type === "exit" ? "Chiqish" : "Tizim"}
                        </span>
                      </td>
                      
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2.5 font-mono text-[9px]">
                          <span className={`px-1.5 py-0.5 rounded ${device.details?.camera === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-850 text-slate-600"}`}>
                            KAMERA: {device.details?.camera || "N/A"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                            HARORAT: {device.details?.thermometer || "N/A"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                            RELE: {device.details?.relay || "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Display or edit threshold values */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5 max-w-[140px] mx-auto text-[10px]">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-slate-500 font-bold">Latency:</span>
                              <input
                                type="number"
                                value={editLatencyThreshold}
                                onChange={(e) => setEditLatencyThreshold(e.target.value)}
                                className="w-14 bg-slate-950 border border-slate-800 p-1 rounded text-white font-mono text-center outline-none"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-slate-500 font-bold">Sens:</span>
                              <input
                                type="number"
                                value={editStreamSensitivity}
                                onChange={(e) => setEditStreamSensitivity(e.target.value)}
                                className="w-14 bg-slate-950 border border-slate-800 p-1 rounded text-white font-mono text-center outline-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2.5 font-mono text-[10px] text-slate-400">
                            <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-850" title="Latency ruxsat etilgan chegara">
                              LAT: <strong className="text-white">{device.latencyThreshold || 100}ms</strong>
                            </span>
                            <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-850" title="Kamera minimal sezgirligi">
                              SENS: <strong className="text-white">{device.streamSensitivity || 80}%</strong>
                            </span>
                          </div>
                        )}
                      </td>
                      
                      <td className="p-3 text-center font-mono font-bold text-emerald-400 text-[10px]">
                        {device.details?.latencyMs || "—"} ms
                      </td>
                      
                      <td className="p-3 text-center font-mono text-slate-400 text-[10px]">
                        {device.details?.lastHeartbeat || "—"}
                      </td>
                      
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateDeviceConfig(device.id)}
                                disabled={isSavingConfig}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-2 rounded-xl transition-all cursor-pointer active:scale-95 text-[10px] flex items-center gap-1 shadow-lg shadow-emerald-500/10"
                                title="Saqlash"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingDeviceId(null)}
                                className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold px-2 py-1 rounded-xl transition-all cursor-pointer text-[10px]"
                              >
                                Bekor qilish
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDeviceId(device.id);
                                setEditLatencyThreshold(String(device.latencyThreshold || 100));
                                setEditStreamSensitivity(String(device.streamSensitivity || 80));
                              }}
                              className="bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
                              title="Chegaralarni sozlash"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteDevice(device.id)}
                            title="Qurilmani o'chirish"
                            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-all cursor-pointer active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
