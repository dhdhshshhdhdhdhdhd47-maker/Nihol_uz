import React, { useState, useEffect, useRef } from "react";
import { LogOut, Sparkles, Smartphone, Camera, Users, ShieldAlert, Heart, Calendar, HelpCircle, Activity, Globe, RefreshCw, ChefHat, CreditCard, Search, Send, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { User, Child, Group, Employee, Complaint, AuditLog, Payment, MealPlan } from "./types";
import LoginScreen from "./components/LoginScreen";
import TelegramBotSimulator from "./components/TelegramBotSimulator";
import DirectorDashboard from "./components/DirectorDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import NurseDashboard from "./components/NurseDashboard";
import ChefDashboard from "./components/ChefDashboard";
import AccountantDashboard from "./components/AccountantDashboard";
import CommandPalette from "./components/CommandPalette";
import ParentPortal from "./components/ParentPortal";
import TelegramLinkModal from "./components/TelegramLinkModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

function decodeJWT(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded);
    }
  } catch (err) {
    console.error("JWT Decode failed:", err);
  }
  return null;
}

const apiCache = {
  data: {} as Record<string, { value: any; timestamp: number }>,
  get(key: string, ttl = 15000) {
    const entry = this.data[key];
    if (entry && Date.now() - entry.timestamp < ttl) {
      return entry.value;
    }
    return null;
  },
  set(key: string, value: any) {
    this.data[key] = { value, timestamp: Date.now() };
  },
  clear() {
    this.data = {};
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    const token = localStorage.getItem("authToken");
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded) {
        return decoded;
      }
    }
    return null;
  });

  const [checkingSession, setCheckingSession] = useState<boolean>(() => {
    return !!localStorage.getItem("authToken");
  });

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setCheckingSession(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem("currentUser", JSON.stringify(data.user));
          }
        } else {
          // Only force logout if the token is explicitly rejected (401 Unauthorized or 403 Forbidden)
          if (res.status === 401 || res.status === 403) {
            console.warn("[Session] Token is invalid or expired. Logging out.");
            localStorage.removeItem("authToken");
            localStorage.removeItem("currentUser");
            apiCache.clear();
            setCurrentUser(null);
          } else {
            console.warn("[Session] Server returned non-ok status but not 401/403. Retaining session for offline resilience:", res.status);
          }
        }
      } catch (err) {
        console.error("[Session] Verification failed:", err);
        // On network/timeout errors (e.g. Render spin-up), retain the cached user to prevent unwanted logout
      } finally {
        setCheckingSession(false);
      }
    };

    verifySession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  // Global window.fetch Interceptor & Silent 2-second Keep-Alive Cron
  useEffect(() => {
    const originalFetch = window.fetch;
    let isPatched = false;

    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      
      // Rewrite relative API URLs to point to Render production backend when not in local/preview env
      if (url.startsWith('/api/')) {
        const apiBase = window.location.hostname === "localhost" || window.location.hostname.includes("ais-")
          ? ""
          : "https://bogcham-uz.onrender.com";
        url = `${apiBase}${url}`;
        input = url;
      }

      const newInit = { ...(init || {}) };
      const headers = new Headers(newInit.headers || {});
      
      // Lazily fetch and attach kindergarten ID from stored user
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.kindergartenId && !headers.has('x-kindergarten-id')) {
            headers.set('x-kindergarten-id', parsed.kindergartenId);
          }
        } catch (e) {}
      }
      
      // Automatically attach Authorization JWT token if available
      const token = localStorage.getItem("authToken");
      if (token && !headers.has('Authorization') && !headers.has('authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      newInit.headers = headers;
      return originalFetch(input, newInit);
    };

    try {
      window.fetch = customFetch;
      isPatched = true;
    } catch (err) {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true
      });
      isPatched = true;
    }

    // Silent background keep-alive ping every 2 seconds
    // Resolves to the correct base URL and pings /api/health to prevent Render spin-down.
    // Does not update React states or cause any page refreshes or re-renders.
    const keepAliveInterval = setInterval(() => {
      const apiBase = window.location.hostname === "localhost" || window.location.hostname.includes("ais-")
        ? ""
        : "https://bogcham-uz.onrender.com";
      
      originalFetch(`${apiBase}/api/health`, { method: "GET" })
        .catch(() => {
          // Completely silent catch to avoid console noise during transient disconnects
        });
    }, 2000);

    return () => {
      if (isPatched) {
        try {
          window.fetch = originalFetch;
        } catch (e) {
          try {
            Object.defineProperty(window, 'fetch', {
              value: originalFetch,
              writable: true,
              configurable: true
            });
          } catch (err) {}
        }
      }
      clearInterval(keepAliveInterval);
    };
  }, []);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Helper to merge local user modifications and prevent deleted items from reappearing
  const applyLocalOverrides = (cacheKey: string, sourceList: any[]): any[] => {
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem(`deleted_${cacheKey}_ids`) || "[]");
      const addedItems: any[] = JSON.parse(localStorage.getItem(`added_${cacheKey}`) || "[]");
      const modItems: Record<string, any> = JSON.parse(localStorage.getItem(`modified_${cacheKey}`) || "{}");

      let result = (sourceList || []).filter(item => item && item.id && !deletedIds.includes(item.id));
      result = result.map(item => modItems[item.id] ? { ...item, ...modItems[item.id] } : item);

      for (const added of addedItems) {
        if (added && added.id && !result.find(i => i.id === added.id) && !deletedIds.includes(added.id)) {
          result.unshift(added);
        }
      }
      return result;
    } catch {
      return sourceList || [];
    }
  };

  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem("cache_lastSyncTime") || "";
  });

  const [children, setChildren] = useState<Child[]>(() => {
    try {
      const cached = localStorage.getItem("cache_children");
      const list = cached ? JSON.parse(cached) : [];
      return applyLocalOverrides("children", list);
    } catch {
      return [];
    }
  });
  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const cached = localStorage.getItem("cache_groups");
      const list = cached ? JSON.parse(cached) : [];
      return applyLocalOverrides("groups", list);
    } catch {
      return [];
    }
  });
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const cached = localStorage.getItem("cache_employees");
      const list = cached ? JSON.parse(cached) : [];
      return applyLocalOverrides("employees", list);
    } catch {
      return [];
    }
  });
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const cached = localStorage.getItem("cache_complaints");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const cached = localStorage.getItem("cache_auditLogs");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const cached = localStorage.getItem("cache_payments");
      const list = cached ? JSON.parse(cached) : [];
      return applyLocalOverrides("payments", list);
    } catch {
      return [];
    }
  });
  const [meals, setMeals] = useState<MealPlan[]>(() => {
    try {
      const cached = localStorage.getItem("cache_meals");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [activeSimulator, setActiveSimulator] = useState<"none" | "telegram">("none");
  const [loadingData, setLoadingData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tgTheme, setTgTheme] = useState<any>(null);
  const [forceParentPortal, setForceParentPortal] = useState(false);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  const [telegramInitError, setTelegramInitError] = useState<string | null>(null);
  const [skipTelegramFallback, setSkipTelegramFallback] = useState(false);

  const [telegramOffline, setTelegramOffline] = useState(false);
  const [telegramLatency, setTelegramLatency] = useState<number | null>(null);

  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        const res = await fetch("/api/telegram-simulator/status");
        if (res.ok) {
          const status = await res.json();
          setTelegramOffline(status.status === "offline" || !status.success);
          setTelegramLatency(status.latency);
        } else {
          setTelegramOffline(true);
        }
      } catch (err) {
        setTelegramOffline(true);
      }
    };

    const checkSystemHealth = async () => {
      try {
        const res = await fetch("/api/health-check");
        if (res.ok) {
          const data = await res.json();
          setSystemHealth(data);
        }
      } catch (err) {
        console.error("System health check error:", err);
      }
    };

    checkBotStatus();
    checkSystemHealth();

    const botInterval = setInterval(checkBotStatus, 5000);
    const healthInterval = setInterval(checkSystemHealth, 15000);

    return () => {
      clearInterval(botInterval);
      clearInterval(healthInterval);
    };
  }, []);

  useEffect(() => {
    try {
      const webApp = (window as any).Telegram?.WebApp;
      if (webApp) {
        // Correct initialization for mobile Telegram users
        webApp.ready();
        
        if (webApp.themeParams) {
          setTgTheme(webApp.themeParams);
          
          const tp = webApp.themeParams;
          const root = document.documentElement;
          
          // Inject CSS variables to override defaults dynamically
          const styleEl = document.createElement("style");
          styleEl.innerHTML = `
            :root {
              ${tp.bg_color ? `--tg-bg-color: ${tp.bg_color};` : ""}
              ${tp.text_color ? `--tg-text-color: ${tp.text_color};` : ""}
              ${tp.button_color ? `--tg-button-color: ${tp.button_color};` : ""}
              ${tp.button_text_color ? `--tg-button-text-color: ${tp.button_text_color};` : ""}
              ${tp.secondary_bg_color ? `--tg-secondary-bg-color: ${tp.secondary_bg_color};` : ""}
              ${tp.accent_text_color ? `--tg-accent-text-color: ${tp.accent_text_color};` : ""}
            }
            
            .tg-themed-bg {
              background-color: var(--tg-bg-color, #020617) !important;
            }
            .tg-themed-text {
              color: var(--tg-text-color, #f8fafc) !important;
            }
            .tg-themed-button {
              background-color: var(--tg-button-color, #10b981) !important;
              color: var(--tg-button-text-color, #020617) !important;
            }
            .tg-themed-border {
              border-color: var(--tg-secondary-bg-color, #1e293b) !important;
            }
          `;
          document.head.appendChild(styleEl);
        }
      }
    } catch (err: any) {
      console.error("Xatolik Telegram WebApp yuklashda:", err);
      setTelegramInitError(err?.message || "Noma'lum xatolik");
    }
  }, []);

  // No auto-open for simulator on load (as requested: saytdagi telegram sim kerak mas)
  useEffect(() => {
    setActiveSimulator("none");
  }, [currentUser]);

  const lastFetchTimeRef = useRef<number>(0);

  // Load all data from API
  const loadAllData = async (manual = false) => {
    if (manual) {
      setIsRefreshing(true);
      apiCache.clear();
    }
    const isFirstLoad = children.length === 0 && employees.length === 0;
    if (isFirstLoad) {
      setLoadingData(true);
    }

    lastFetchTimeRef.current = Date.now();

    const kgId = currentUser?.kindergartenId || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (kgId) {
      headers["x-kindergarten-id"] = kgId;
    }
    const token = localStorage.getItem("authToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Helper for resilient fetch to handle specific error codes (401, 403, 404, 500)
    const resilientFetch = async (url: string, defaultValue: any = null, useCache = false) => {
      if (useCache && !manual) {
        const cached = apiCache.get(url, 4000);
        if (cached) {
          return cached;
        }
      }
      try {
        const res = await fetch(url, { headers });
        if (!res.ok) {
          console.warn(`[SWR] HTTP Error ${res.status} returned for: ${url}`);
          return defaultValue;
        }
        const data = await res.json();
        if (useCache) {
          apiCache.set(url, data);
        }
        return data;
      } catch (err) {
        console.error(`[SWR] Fetch failed for ${url}:`, err);
        return defaultValue;
      }
    };

    // Non-blocking background updater helper
    const fetchAndCache = async (url: string, cacheKey: string, setter: (val: any) => void) => {
      const rawData = await resilientFetch(url, null, !manual);
      if (rawData !== null) {
        const mergedData = Array.isArray(rawData) ? applyLocalOverrides(cacheKey, rawData) : rawData;
        setter(mergedData);
        localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(mergedData));
      }
    };

    try {
      const promises = [
        fetchAndCache(`/api/children?kindergartenId=${kgId}`, "children", setChildren),
        fetchAndCache(`/api/groups?kindergartenId=${kgId}`, "groups", setGroups),
        fetchAndCache(`/api/employees?kindergartenId=${kgId}`, "employees", setEmployees),
        fetchAndCache(`/api/complaints?kindergartenId=${kgId}`, "complaints", setComplaints),
        fetchAndCache(`/api/audit-logs?kindergartenId=${kgId}`, "auditLogs", setAuditLogs),
        fetchAndCache(`/api/payments?kindergartenId=${kgId}`, "payments", setPayments),
        fetchAndCache(`/api/meals?kindergartenId=${kgId}`, "meals", setMeals),
      ];

      await Promise.allSettled(promises);

      const syncTime = new Date().toLocaleTimeString();
      setLastSyncTime(syncTime);
      localStorage.setItem("cache_lastSyncTime", syncTime);
    } catch (err) {
      console.error("Xatolik ma'lumotlarni yuklashda:", err);
    } finally {
      setLoadingData(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // If logged in, fetch data
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  // Real-time server update subscriptions via WebSocket
  useEffect(() => {
    if (!currentUser) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWS = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws-hardware`;
      
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "data_update") {
            // Instantly refresh all tables and states on any database changes (e.g. Face ID scans)
            loadAllData();
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWS, 5000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem("authToken");
    }
  };

  // Check for Telegram parent WebApp route or query chatId or WebApp user id
  const queryParams = new URLSearchParams(window.location.search);
  const urlChatId = queryParams.get("chatId");
  const tgWebAppUserId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
  const activeChatId = urlChatId || (tgWebAppUserId ? String(tgWebAppUserId) : "");
  const isParentPortalPath = window.location.pathname.includes("/parent-portal") || !!activeChatId || forceParentPortal;

  if (isParentPortalPath) {
    const finalChatId = activeChatId || "SIM-PARENT";
    
    // Check if Telegram environment is detected (tgWebAppUserId exists or we have an active Telegram WebApp)
    const isTelegramEnvironment = !!(window as any).Telegram?.WebApp?.initData;
    
    if (!isTelegramEnvironment && !skipTelegramFallback) {
      setSkipTelegramFallback(true);
    }

    return (
      <div 
        className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans"
        style={tgTheme ? {
          backgroundColor: tgTheme.bg_color || "#020617",
          color: tgTheme.text_color || "#f8fafc"
        } : {}}
      >
        <ParentPortal chatId={finalChatId} onBackToApp={() => {
          if (forceParentPortal) {
            setForceParentPortal(false);
          } else {
            window.history.replaceState({}, document.title, "/");
            window.location.reload();
          }
        }} />
      </div>
    );
  }

  // If checking session, show a beautiful loader instead of login redirect
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Tizim yuklanmoqda...</p>
      </div>
    );
  }

  // If not logged in, render LoginScreen
  if (!currentUser) {
    return (
      <div 
        className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans"
        style={tgTheme ? {
          backgroundColor: tgTheme.bg_color || "#020617",
          color: tgTheme.text_color || "#f8fafc"
        } : {}}
      >
        <LoginScreen 
          onLoginSuccess={(user) => setCurrentUser(user)} 
          onEnterParentPortal={() => setForceParentPortal(true)}
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans"
      style={tgTheme ? {
        backgroundColor: tgTheme.bg_color || "#020617",
        color: tgTheme.text_color || "#f8fafc"
      } : {}}
    >
      {/* Dynamic Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-slate-950 tracking-tight text-xl shadow-lg shadow-emerald-500/20">
            N
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
              Nihol AI ERP <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">SaaS</span>
            </h1>
            <p className="text-[11px] text-slate-400">Bog'cha aqlli boshqaruv ekotizimi</p>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Command Palette Button */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="bg-slate-950/80 hover:bg-slate-850/80 border border-slate-800 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-[10px] text-slate-400 font-bold tracking-wide transition-all cursor-pointer select-none active:scale-95"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Qidirish...</span>
            <span className="bg-slate-850 text-slate-500 border border-slate-800 rounded px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase ml-1">Ctrl+K</span>
          </button>

          {/* Telegram Account Connection status trigger */}
          {currentUser && (
            <button
              onClick={() => setIsTelegramModalOpen(true)}
              className="bg-slate-950/80 hover:bg-slate-850/80 border border-slate-800 hover:border-sky-500/40 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-sky-400 font-bold tracking-wide transition-all cursor-pointer select-none active:scale-95"
              title="Telegram hisobini sozlash / bog'lash"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentUser.telegramChatId ? `Telegram: Bog'langan` : "Telegramni ulash"}</span>
            </button>
          )}

          {/* Real-time live status / sync indicator badge */}
          {lastSyncTime && (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-950/85 border border-slate-850 rounded-2xl px-3 py-1.5 text-[10px] text-emerald-400 font-bold font-mono select-none" title="Tizim ma'lumotlari real vaqtda yangilanmoqda (Face ID)">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
              <span>Sinx: {lastSyncTime}</span>
            </div>
          )}

          {/* Sync Now manual trigger button */}
          <button
            onClick={() => loadAllData(true)}
            disabled={isRefreshing || loadingData}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black px-3 py-1.5 rounded-2xl text-[10px] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/10 uppercase select-none"
            title="Tizimdagi barcha modullar ma'lumotlarini qo'lda sinxronlash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Sinxronlanmoqda..." : "Sync Now"}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
            className="bg-slate-950/80 hover:bg-slate-850/80 border border-slate-800 p-2 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer select-none active:scale-95"
            title={theme === "dark" ? "Kunduzgi rejim (Light mode)" : "Tungi rejim (Dark mode)"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <button
              onClick={() => setIsTelegramModalOpen(true)}
              className="flex items-center gap-2.5 text-right cursor-pointer hover:opacity-80 transition-all text-left"
              title="Profil va Telegram hisobi"
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-700 shadow-inner" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-white hover:text-sky-400">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase font-mono">{currentUser.role}</div>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-rose-400 p-2.5 rounded-xl border border-slate-700/60 transition-all cursor-pointer active:scale-95"
              title="Tizimdan chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout (Full width since on-page simulator is hidden) */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 gap-6 items-start">
        {/* Active Dashboard container (Takes full width) */}
        <div className="space-y-6">

          {loadingData ? (
            <div className="space-y-6 animate-pulse">
              {/* Header skeleton */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-2/3">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl shrink-0"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-5 bg-slate-800 rounded-lg w-1/3"></div>
                    <div className="h-3.5 bg-slate-800 rounded-lg w-1/2"></div>
                  </div>
                </div>
                <div className="w-24 h-10 bg-slate-800 rounded-xl self-end md:self-center"></div>
              </div>

              {/* 4 Cards skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                    <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                    <div className="h-7 bg-slate-800 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-800 rounded w-2/3"></div>
                  </div>
                ))}
              </div>

              {/* Grid content skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3 items-center" style={{ contentVisibility: 'auto' }}>
                      <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0"></div>
                      <div className="space-y-1.5 w-full">
                        <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                        <div className="h-2.5 bg-slate-800 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="h-4 bg-slate-800 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-8 bg-slate-800 rounded-lg"></div>
                    <div className="h-20 bg-slate-800 rounded-xl"></div>
                    <div className="h-20 bg-slate-800 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <motion.div variants={itemVariants}>
                {/* Render corresponding dashboard based on logged in user's role */}
                {(currentUser.role === "SuperAdmin" || currentUser.role === "Direktor") && (
                  <DirectorDashboard
                    user={currentUser}
                    childrenList={children}
                    groupsList={groups}
                    employeesList={employees}
                    complaintsList={complaints}
                    auditLogsList={auditLogs}
                    paymentsList={payments}
                    mealsList={meals}
                    onRefresh={loadAllData}
                    onUpdateAvatar={(newAvatar: string) => setCurrentUser({ ...currentUser, avatar: newAvatar })}
                    onUpdateChildren={(newChildren) => {
                      setChildren(newChildren);
                      try { localStorage.setItem("cache_children", JSON.stringify(newChildren)); } catch(e){}
                    }}
                    onUpdateGroups={(newGroups) => {
                      setGroups(newGroups);
                      try { localStorage.setItem("cache_groups", JSON.stringify(newGroups)); } catch(e){}
                    }}
                    onUpdateEmployees={(newEmployees) => {
                      setEmployees(newEmployees);
                      try { localStorage.setItem("cache_employees", JSON.stringify(newEmployees)); } catch(e){}
                    }}
                    onUpdatePayments={(newPayments) => {
                      setPayments(newPayments);
                      try { localStorage.setItem("cache_payments", JSON.stringify(newPayments)); } catch(e){}
                    }}
                  />
                )}

                {currentUser.role === "Tarbiyachi" && (
                  <TeacherDashboard
                    user={currentUser}
                    childrenList={children}
                    onRefresh={loadAllData}
                  />
                )}

                {currentUser.role === "Hamshira" && (
                  <NurseDashboard
                    user={currentUser}
                    childrenList={children}
                    onRefresh={loadAllData}
                  />
                )}

                {currentUser.role === "Oshpaz" && (
                  <ChefDashboard
                    user={currentUser}
                    mealsList={meals}
                    onRefresh={loadAllData}
                  />
                )}

                {currentUser.role === "Buxgalter" && (
                  <AccountantDashboard
                    user={currentUser}
                    childrenList={children}
                    paymentsList={payments}
                    onRefresh={loadAllData}
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer / Status bar */}
      <footer className="bg-slate-950 border-t border-slate-900 px-6 py-4 text-center md:flex md:justify-between items-center text-[11px] text-slate-500 mt-auto">
        <div className="flex flex-col md:flex-row items-center gap-2 justify-center md:justify-start">
          <span>© 2026 Nihol AI ERP. Barcha huquqlar himoyalangan.</span>
          {systemHealth && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${systemHealth.status === "healthy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border border-rose-500/15"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${systemHealth.status === "healthy" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`}></span>
              Tizim holati: {systemHealth.status === "healthy" ? "Barqaror" : "Xatolik"}
            </span>
          )}
        </div>
        <div className="flex justify-center items-center gap-4 mt-2 md:mt-0 font-mono">
          <span>Uptime: <span className="text-slate-300">{systemHealth?.uptime ? `${Math.floor(systemHealth.uptime)}s` : "..."}</span></span>
          <span>•</span>
          <span>Database: <span className={systemHealth?.database?.status === "connected" ? "text-emerald-400" : "text-amber-400"}>
            {systemHealth?.database?.status === "connected" ? "Connected" : "Offline"}
          </span></span>
          <span>•</span>
          <span>Telegram: <span className={systemHealth?.telegram?.status === "online" ? "text-emerald-400" : "text-rose-400"}>
            {systemHealth?.telegram?.status === "online" ? "Online" : "Offline"}
          </span></span>
        </div>
      </footer>

      {/* Global System Health Telegram Connection Dropped Notification */}
      {telegramOffline && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm bg-rose-950/95 border border-rose-500/30 p-4 rounded-2xl shadow-2xl flex items-start gap-3.5 backdrop-blur-md animate-bounce">
          <div className="bg-rose-500/20 text-rose-400 p-2 rounded-xl shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h5 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>System Health: Telegram Bot API Drop</span>
            </h5>
            <p className="text-[11px] text-rose-200 leading-relaxed">
              Telegram Bot API shlyuzi bilan aloqa uzildi! Ota-onalarga SMS va xabarnomalar kechikishi mumkin.
            </p>
            <div className="pt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
              <span className="text-[9px] text-rose-300 font-mono font-bold uppercase tracking-wider">
                Xizmat javobsiz (Unresponsive)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette 
        user={currentUser} 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

      {/* Telegram link profile configuration modal */}
      {currentUser && (
        <TelegramLinkModal
          user={currentUser}
          isOpen={isTelegramModalOpen}
          onClose={() => setIsTelegramModalOpen(false)}
          onSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            loadAllData();
          }}
        />
      )}
    </div>
  );
}
