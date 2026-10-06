import React, { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw, Search, Download, Clock, Server, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { AuditLog } from "../types";

interface SystemLogsProps {
  user: any;
  onRefreshGlobal?: () => void;
}

export default function SystemLogs({ user, onRefreshGlobal }: SystemLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoPoll, setAutoPoll] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterType, setFilterType] = useState<"all" | "danger" | "success" | "info">("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const kgId = user?.kindergartenId || "K-1";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      headers["x-kindergarten-id"] = kgId;
      const token = localStorage.getItem("authToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/audit-logs?kindergartenId=${kgId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        // Sort logs: newest first
        const sorted = (data || []).sort((a: any, b: any) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setLogs(sorted);
      }
    } catch (err) {
      console.error("Xatolik audit loglarini yuklashda:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-polling for real-time monitoring
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      fetchLogs();
      if (onRefreshGlobal) {
        onRefreshGlobal();
      }
    }, 5000); // Poll every 5s for real-time compliance

    return () => clearInterval(interval);
  }, [autoPoll, fetchLogs, onRefreshGlobal]);

  // Filtering logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      !searchQuery ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.ip && log.ip.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.device && log.device.toLowerCase().includes(searchQuery.toLowerCase()));

    const isDanger = log.action.toLowerCase().includes("o'chirdi") || 
                     log.action.toLowerCase().includes("delete") || 
                     log.action.toLowerCase().includes("rad") || 
                     log.action.toLowerCase().includes("o'chish");

    const isSuccess = log.action.toLowerCase().includes("muvaffaqiyatli") || 
                      log.action.toLowerCase().includes("login") || 
                      log.action.toLowerCase().includes("tizimga kirdi") || 
                      log.action.toLowerCase().includes("qo'shildi") || 
                      log.action.toLowerCase().includes("saqlandi");

    if (filterType === "danger") return matchesSearch && isDanger;
    if (filterType === "success") return matchesSearch && isSuccess;
    if (filterType === "info") return matchesSearch && !isDanger && !isSuccess;
    return matchesSearch;
  });

  // Pagination calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("Eksport qilish uchun jurnallar mavjud emas!");
      return;
    }

    const headers = ["ID", "Timestamp", "User", "Action", "IP Address", "Device", "Kindergarten ID"];
    const csvRows = [
      headers.join(","),
      ...filteredLogs.map(log => [
        log.id,
        log.timestamp,
        `"${log.user.replace(/"/g, '""')}"`,
        `"${log.action.replace(/"/g, '""')}"`,
        log.ip || "127.0.0.1",
        `"${(log.device || "Noma'lum").replace(/"/g, '""')}"`,
        log.kindergartenId || "K-1"
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Tizim_Auditi_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="system-logs-component">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <Shield className="text-emerald-400 w-5 h-5 animate-pulse" />
            <span>Tizim Amallari Monitoringi (SystemLogs)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Real vaqt rejimida bog'cha xodimlari amallari va ma'lumotlar o'zgarishini kuzatish tizimi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Autopoll status button */}
          <button
            onClick={() => setAutoPoll(!autoPoll)}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              autoPoll 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-slate-900 text-slate-400 border-slate-800"
            }`}
            title={autoPoll ? "Real vaqt yangilanishini to'xtatish" : "Real vaqt yangilanishini boshlash (5s)"}
          >
            {autoPoll ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Real-Time: ON</span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Real-Time: OFF</span>
              </>
            )}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow active:scale-95"
            title="CSV yuklab olish"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Yuklab olish (CSV)</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 p-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            title="Yangilash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search and Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="User, action, IP yoki qurilma bo'yicha qidiruv..."
            className="w-full bg-slate-950 border border-slate-850 text-white placeholder-slate-500 pl-9 pr-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="sm:col-span-4 flex items-center gap-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold mr-1 whitespace-nowrap">Filtr:</span>
          {(["all", "danger", "success", "info"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterType(type);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer border ${
                filterType === type
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-transparent text-slate-400 border-transparent hover:border-slate-800"
              }`}
            >
              {type === "all" ? "Barchasi" : type === "danger" ? "O'chirishlar" : type === "success" ? "Muvaffaqiyat" : "Ma'lumot"}
            </button>
          ))}
        </div>

        <div className="sm:col-span-3 flex items-center justify-end gap-1.5 text-xs text-slate-400">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Limit:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-850 rounded-lg text-xs py-1 px-1.5 outline-none focus:border-emerald-500 text-slate-300"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} qator
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850 select-none">
                <th className="py-3 px-4">Tizim Vaqti</th>
                <th className="py-3 px-4">Foydalanuvchi</th>
                <th className="py-3 px-4">Bajarilgan Amal / O'zgarish</th>
                <th className="py-3 px-4">IP & Qurilma</th>
                <th className="py-3 px-4 text-right">Bog'cha ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    Qidiruv va filtrlarga mos keluvchi audit jurnallari topilmadi.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isDanger = log.action.toLowerCase().includes("o'chirdi") || 
                                   log.action.toLowerCase().includes("delete") || 
                                   log.action.toLowerCase().includes("rad") || 
                                   log.action.toLowerCase().includes("o'chish");

                  const isSuccess = log.action.toLowerCase().includes("muvaffaqiyatli") || 
                                    log.action.toLowerCase().includes("login") || 
                                    log.action.toLowerCase().includes("tizimga kirdi") || 
                                    log.action.toLowerCase().includes("qo'shildi") || 
                                    log.action.toLowerCase().includes("saqlandi");

                  return (
                    <tr key={log.id} className="hover:bg-slate-950/30 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("uz-UZ") : "Hozirgina"}
                      </td>
                      <td className="py-3 px-4 font-bold text-white font-sans whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isDanger ? "bg-rose-500 animate-pulse" : isSuccess ? "bg-emerald-500" : "bg-sky-500"
                          }`}></span>
                          <span>{log.user}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2.5 py-0.5 rounded font-medium text-[10px] ${
                          isDanger ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" :
                          isSuccess ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                          "bg-slate-800 text-slate-300 border border-slate-700/50"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        <span className="text-[10px] text-slate-500 font-sans block">{log.device || "Browser"}</span>
                        <span>{log.ip || "127.0.0.1"}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-right uppercase text-[9px] whitespace-nowrap font-sans">
                        {log.kindergartenId ? `Bog'cha: ${log.kindergartenId}` : "Tizim (Global)"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="bg-slate-950/40 px-4 py-3 border-t border-slate-850 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 select-none">
              Jami <span className="text-white font-bold">{totalItems}</span> ta logdan{" "}
              <span className="text-white font-bold">{(currentPage - 1) * pageSize + 1}</span> -{" "}
              <span className="text-white font-bold">{Math.min(currentPage * pageSize, totalItems)}</span> oralig'i
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-[11px] text-slate-400 px-2 font-bold font-mono">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
