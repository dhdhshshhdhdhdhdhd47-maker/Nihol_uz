import React, { useState, useEffect, useRef } from "react";
import { Search, Terminal, Zap, ShieldAlert, Users, Plus, CheckCircle, HelpCircle, Activity, Settings, BookOpen, Clock, Award, Image, FileText, Coffee, Moon, MessageSquare, Calendar, User, ChefHat } from "lucide-react";

interface CommandPaletteProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: any;
  action: () => void;
}

export default function CommandPalette({ user, isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      // Timeout to ensure input is mounted
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Define commands list based on the user's role
  const getCommands = (): CommandItem[] => {
    if (!user) return [];

    const role = user.role;
    const items: CommandItem[] = [];

    // Global commands
    items.push({
      id: "global-help",
      category: "Yordam",
      title: "Tizim Yo'riqnomasi",
      subtitle: "Nihol AI ERP tizimi haqida ko'proq bilish",
      icon: HelpCircle,
      action: () => {
        alert("Ctrl+K yordamida tezkor buyruqlar panelini ochishingiz va darslarni, to'lovlarni yoki tibbiy kartalarni boshqarishingiz mumkin.");
      }
    });

    // Director / SuperAdmin specific commands
    if (role === "SuperAdmin" || role === "Director" || role === "Direktor") {
      items.push(
        {
          id: "dir-dash",
          category: "Navigatsiya",
          title: "Boshqaruv Paneli (Dashboard)",
          subtitle: "Statistikalar, KPI lar va guruh bandligi",
          icon: Users,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "dashboard" } }));
          }
        },
        {
          id: "dir-groups",
          category: "Navigatsiya",
          title: "Guruhlar bo'limi",
          subtitle: "Bog'cha guruhlari ro'yxati va tarbiyachilar",
          icon: BookOpen,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "groups" } }));
          }
        },
        {
          id: "dir-children",
          category: "Navigatsiya",
          title: "Bolalar ro'yxati",
          subtitle: "Tarbiyalanuvchilar, ota-ona ma'lumotlari",
          icon: Users,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "children" } }));
          }
        },
        {
          id: "dir-employees",
          category: "Navigatsiya",
          title: "Xodimlar bo'limi",
          subtitle: "Tarbiyachilar, hamshiralar va maoshlar",
          icon: User,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "employees" } }));
          }
        },
        {
          id: "dir-payments",
          category: "Navigatsiya",
          title: "To'lovlar bo'limi",
          subtitle: "Kvitansiyalar, hisob-faktura va qarzdorlar",
          icon: Coffee,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "payments" } }));
          }
        },
        {
          id: "dir-complaints",
          category: "Navigatsiya",
          title: "Shikoyat va Takliflar",
          subtitle: "Telegram bot orqali ota-onalar murojaati",
          icon: ShieldAlert,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "complaints" } }));
          }
        },
        {
          id: "dir-add-child",
          category: "Tezkor Amallar",
          title: "Yangi Bola Qo'shish ➕",
          subtitle: "Yangi tarbiyalanuvchi anketasini ochish",
          icon: Plus,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "children", openModal: "add-child" } }));
          }
        },
        {
          id: "dir-add-group",
          category: "Tezkor Amallar",
          title: "Yangi Guruh Yaratish 🏫",
          subtitle: "Yangi sinf/guruh kartasini kiritish",
          icon: Plus,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "groups", openModal: "add-group" } }));
          }
        }
      );
    }

    // Teacher specific commands
    if (role === "Tarbiyachi") {
      items.push(
        {
          id: "teach-dash",
          category: "Navigatsiya",
          title: "Dashboard",
          subtitle: "Bugungi guruh holati va davomat",
          icon: Users,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "dashboard" } }));
          }
        },
        {
          id: "teach-attendance",
          category: "Navigatsiya",
          title: "Davomatni belgilash",
          subtitle: "Bolalarni kirdi/chiqdi qayd etish",
          icon: Clock,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "attendance" } }));
          }
        },
        {
          id: "teach-activities",
          category: "Navigatsiya",
          title: "Kundalik Mashg'ulotlar",
          subtitle: "Mashg'ulot mavzulari, rasmlar va video havolalar",
          icon: BookOpen,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "activities" } }));
          }
        },
        {
          id: "teach-childactivity",
          category: "Navigatsiya",
          title: "Bola Faolligini Baholash",
          subtitle: "Nutq, muloqot va intizom ballari",
          icon: Award,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "childactivity" } }));
          }
        },
        {
          id: "teach-mealstatus",
          category: "Navigatsiya",
          title: "Taomlanish Holati",
          subtitle: "Bolalarning bugungi ovqat ishtahasi",
          icon: Coffee,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "mealstatus" } }));
          }
        },
        {
          id: "teach-health",
          category: "Navigatsiya",
          title: "Salomatlik o'lchovlari",
          subtitle: "Tana harorati va yo'tal belgilari",
          icon: Activity,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "health" } }));
          }
        },
        {
          id: "teach-profile",
          category: "Navigatsiya",
          title: "Mening Profilim",
          subtitle: "Sinfingiz, shaxsiy ma'lumotlar va Telegram bildirishnomalar",
          icon: User,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "profile" } }));
          }
        }
      );
    }

    // Accountant specific commands
    if (role === "Buxgalter") {
      items.push(
        {
          id: "acc-dash",
          category: "Navigatsiya",
          title: "Moliya Dashboard",
          subtitle: "Bugungi tushum va oylik statistika",
          icon: Users,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "dashboard" } }));
          }
        },
        {
          id: "acc-payments",
          category: "Navigatsiya",
          title: "To'lovlar bo'limi",
          subtitle: "Ota-onalar kvitansiyalarini tasdiqlash",
          icon: Coffee,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "payments" } }));
          }
        },
        {
          id: "acc-expenses",
          category: "Navigatsiya",
          title: "Xarajatlar bo'limi",
          subtitle: "Oziq-ovqat va maishiy xarajatlarni qayd etish",
          icon: FileText,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "expenses" } }));
          }
        },
        {
          id: "acc-reports",
          category: "Navigatsiya",
          title: "Moliyaviy Hisobotlar",
          subtitle: "Oylik balans va PDF hisobot yuklash",
          icon: FileText,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "reports" } }));
          }
        },
        {
          id: "acc-add-payment",
          category: "Tezkor Amallar",
          title: "Yangi To'lov Kiritish 💳",
          subtitle: "Bolaning oylik badal to'lovini qayd etish",
          icon: Plus,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-dashboard-tab", { detail: { tabId: "payments", openModal: "add-payment" } }));
          }
        }
      );
    }

    // Nurse specific commands
    if (role === "Hamshira") {
      items.push(
        {
          id: "nurse-medical",
          category: "Navigatsiya",
          title: "Bolalar Tibbiy Kartasi",
          subtitle: "Bo'y, vazn, qon guruhi va emlashlar",
          icon: Activity,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-nurse-tab", { detail: { tab: "medical" } }));
          }
        },
        {
          id: "nurse-settings",
          category: "Navigatsiya",
          title: "Tibbiyot Sozlamalari",
          subtitle: "Telegram favqulodda push bildirishnomalari",
          icon: Settings,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-nurse-tab", { detail: { tab: "settings" } }));
          }
        }
      );
    }

    // Chef specific commands
    if (role === "Oshpaz") {
      items.push(
        {
          id: "chef-menu",
          category: "Navigatsiya",
          title: "Haftalik Taomnoma",
          subtitle: "Nonushta, tushlik va peshinlik ovqatlar rejasi",
          icon: ChefHat,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-chef-tab", { detail: { tab: "menu" } }));
          }
        },
        {
          id: "chef-pantry",
          category: "Navigatsiya",
          title: "Omborxona & Ta'minot",
          subtitle: "Oziq-ovqat zaxirasi balansi",
          icon: Settings,
          action: () => {
            window.dispatchEvent(new CustomEvent("jump-to-chef-tab", { detail: { tab: "pantry" } }));
          }
        }
      );
    }

    return items;
  };

  const commands = getCommands();

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Key event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-start justify-center pt-[12vh] px-4">
      <div
        ref={containerRef}
        className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[480px] animate-fade-in"
      >
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Modullarni qidirish... (Masalan: To'lov, Bola, Davomat)"
            className="w-full bg-transparent text-slate-100 font-medium text-xs placeholder-slate-500 outline-none"
          />
          <div className="bg-slate-850 px-2 py-0.5 rounded border border-slate-800 text-[9px] font-mono text-slate-400 select-none">
            ESC
          </div>
        </div>

        {/* Action list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length > 0 ? (
            Object.entries(
              filteredCommands.reduce((groups, item) => {
                const group = item.category;
                if (!groups[group]) groups[group] = [];
                groups[group].push(item);
                return groups;
              }, {} as Record<string, CommandItem[]>)
            ).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="text-[9px] font-extrabold text-rose-400/80 uppercase px-3 pt-2 pb-1 tracking-widest">
                  {category}
                </div>

                {items.map((item) => {
                  const globalIdx = filteredCommands.findIndex(c => c.id === item.id);
                  const isSelected = globalIdx === selectedIndex;
                  const IconComponent = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                          : "border border-transparent hover:bg-slate-850/50 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-rose-500/25 text-rose-400" : "bg-slate-950 text-slate-400"}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className={`text-xs font-bold ${isSelected ? "text-rose-400" : "text-slate-100"}`}>
                            {item.title}
                          </div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                          <Terminal className="w-3 h-3 animate-pulse" /> Tanlash
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Muvofiq buyruq topilmadi
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ - Navigatsiya</span>
            <span>↵ - Tanlash</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Nihol Tezkor Panel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
