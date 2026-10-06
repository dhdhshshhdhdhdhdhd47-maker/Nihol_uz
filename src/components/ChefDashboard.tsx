import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import {
  Coffee,
  Salad,
  Soup,
  Sparkles,
  ChefHat,
  Save,
  RefreshCw,
  AlertCircle,
  FileText,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Settings,
  ShieldAlert,
  BookOpen,
  Image,
  FileDown,
  Heart,
  User,
  CheckCircle2,
  ShoppingCart,
  Eye,
  AlertTriangle,
  ArrowRightLeft,
  Clock,
  Layers,
  ChevronRight,
  ClipboardList,
  Flame,
  Scale,
  Award,
  Send,
  Download,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import MacronutrientsRechartsChart from "./MacronutrientsRechartsChart";

interface ChefDashboardProps {
  user: any;
  mealsList: any[];
  onRefresh: () => void;
}

export default function ChefDashboard({ user, mealsList, onRefresh }: ChefDashboardProps) {
  // Tabs: dashboard, menu, inventory, purchases, ai, recipes, extra
  const [activeTab, setActiveTab] = useState<"dashboard" | "menu" | "inventory" | "purchases" | "ai" | "recipes" | "extra">("dashboard");

  // Core stats loaded from API
  const [stats, setStats] = useState<any>({
    todayBreakfast: "Sutli suli bo'tqasi",
    todayLunch: "Frikadelkali sho'rva",
    todayAfternoonSnack: "Mevalar va keks",
    todayDinner: "Tvorogli zapekanka",
    totalMealsPrepared: 120,
    childrenEatingToday: 38,
    specialDietChildren: 4,
    allergyAlerts: 3,
    lowStockIngredients: 2,
    purchaseRequests: 2,
    kitchenTasks: 5,
    aiNutritionScore: 94
  });

  const [chartsData, setChartsData] = useState<any>({
    weeklyMenu: [],
    caloriesDistribution: [],
    proteinIntake: [],
    wasteStatistics: []
  });

  // State Lists
  const [menus, setMenus] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);

  // Self-Attendance and Group Stats States
  const [myAttendance, setMyAttendance] = useState<any>(null);
  const [groupStats, setGroupStats] = useState<any[]>([]);
  const employeeId = "E-105"; // Chef ID (Rustam Karimov)

  const fetchMyAttendance = async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/attendance");
      if (res.ok) {
        const list = await res.json();
        const record = list.find((a: any) => a.childId === employeeId && a.date === todayStr);
        setMyAttendance(record);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchGroupStats = async () => {
    try {
      const chRes = await fetch("/api/children");
      const attRes = await fetch("/api/attendance");
      if (chRes.ok && attRes.ok) {
        const children = await chRes.json();
        const attendance = await attRes.json();
        const todayStr = new Date().toISOString().split("T")[0];

        const groupsMap: Record<string, { total: number; present: number }> = {
          "Kamalak": { total: 0, present: 0 },
          "Shodlik": { total: 0, present: 0 },
          "Quyosh": { total: 0, present: 0 },
          "Yulduzcha": { total: 0, present: 0 }
        };

        children.forEach((c: any) => {
          const groupName = c.group || "Kamalak";
          if (!groupsMap[groupName]) {
            groupsMap[groupName] = { total: 0, present: 0 };
          }
          groupsMap[groupName].total++;
          
          const hasAtt = attendance.some((a: any) => a.childId === c.id && a.date === todayStr && (a.status === "Bog'chada" || a.status === "Keldi" || a.status === "Kechikdi"));
          if (hasAtt) {
            groupsMap[groupName].present++;
          }
        });

        const list = Object.entries(groupsMap).map(([name, val]) => ({
          name,
          ...val
        }));
        setGroupStats(list);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSelfAttendance = async (direction: "in" | "out") => {
    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: employeeId,
          type: "employee",
          direction: direction,
          temperature: (36.3 + Math.random() * 0.5).toFixed(1)
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast(`Davomat muvaffaqiyatli saqlandi! (${direction === "in" ? "Ishni boshladingiz" : "Ishni yakunladingiz"})`);
          fetchMyAttendance();
          onRefresh();
        } else {
          showToast(data.message || "Xatolik yuz berdi");
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Ulanish xatosi");
    }
  };

  // Loading and action triggers
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states: New Menu Creation
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split("T")[0]);
  const [menuType, setMenuType] = useState("Lunch");
  const [menuMealName, setMenuMealName] = useState("");
  const [menuCalories, setMenuCalories] = useState(480);
  const [menuProtein, setMenuProtein] = useState(18);
  const [menuFat, setMenuFat] = useState(12);
  const [menuCarb, setMenuCarb] = useState(65);
  const [menuVitamins, setMenuVitamins] = useState("Vitamin A, C, B6");
  const [menuMinerals, setMenuMinerals] = useState("Temir, Kaltsiy, Magniy");
  const [menuAllergens, setMenuAllergens] = useState("Yo'q");
  const [menuPortionSize, setMenuPortionSize] = useState("200g");
  const [menuServingTime, setMenuServingTime] = useState("12:30");
  const [menuAgeGroup, setMenuAgeGroup] = useState("3-6 yosh");
  const [menuInstructions, setMenuInstructions] = useState("Qaynatib, pishgach ko'katlar bilan bezatiladi.");
  const [menuImage, setMenuImage] = useState("https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=200");

  // Form states: Add Ingredient
  const [ingName, setIngName] = useState("");
  const [ingCategory, setIngCategory] = useState("Vegetables");
  const [ingQuantity, setIngQuantity] = useState(15);
  const [ingUnit, setIngUnit] = useState("kg");
  const [ingSupplier, setIngSupplier] = useState("Dehqon Bozori");
  const [ingExpDate, setIngExpDate] = useState("2026-07-25");
  const [ingPrice, setIngPrice] = useState(8000);

  // Form states: Purchase Request
  const [reqProduct, setReqProduct] = useState("");
  const [reqQty, setReqQty] = useState(10);
  const [reqPrice, setReqPrice] = useState(15000);
  const [reqSupplier, setReqSupplier] = useState("Agromir meat-supply LLC");
  const [reqPriority, setReqPriority] = useState("O'rtacha");

  // Form states: AI Assistant
  const [aiMealName, setAiMealName] = useState("");
  const [aiMealDesc, setAiMealDesc] = useState("");
  const [aiMealType, setAiMealType] = useState<"breakfast" | "lunch" | "dinner">("lunch");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Form states: Recipe Builder
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeCat, setRecipeCat] = useState("Soups");
  const [recipeInstructions, setRecipeInstructions] = useState("");
  const [recipeCal, setRecipeCal] = useState(300);
  const [recipeProt, setRecipeProt] = useState(12);
  const [recipeCost, setRecipeCost] = useState(8500);

  // Form states: Photo Upload
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryType, setGalleryType] = useState("After Cooking");
  const [galleryFile, setGalleryFile] = useState<string>("");

  // Settings states
  const [mealTimesSetting, setMealTimesSetting] = useState({
    breakfast: "08:30",
    snack1: "10:30",
    lunch: "12:30",
    snack2: "15:30",
    dinner: "18:00"
  });
  const [ageGroupStandard, setAgeGroupStandard] = useState("3-6 yosh (Davlat standarti)");
  const [defaultSupplier, setDefaultSupplier] = useState("Agromir LLC");

  // Load all data
  const loadKmsData = async () => {
    setLoading(true);
    try {
      // 1. Dashboard
      const dashRes = await fetch("/api/chef/dashboard");
      if (dashRes.ok) {
        const d = await dashRes.json();
        if (d.success) {
          setStats(d.stats);
          setChartsData(d.charts);
        }
      }

      // 2. Menus
      const menusRes = await fetch("/api/menus");
      if (menusRes.ok) {
        const d = await menusRes.json();
        setMenus(d);
      }

      // 3. Ingredients & Inventory
      const ingRes = await fetch("/api/ingredients");
      if (ingRes.ok) {
        const d = await ingRes.json();
        setIngredients(d);
      }

      // 4. Recipes
      const recRes = await fetch("/api/recipes");
      if (recRes.ok) {
        const d = await recRes.json();
        setRecipes(d);
      }

      // 5. Allergies
      const allRes = await fetch("/api/allergies");
      if (allRes.ok) {
        const d = await allRes.json();
        setAllergies(d);
      }

      // 6. Gallery
      const galRes = await fetch("/api/meal-gallery");
      if (galRes.ok) {
        const d = await galRes.json();
        setGallery(d);
      }

      // 7. Purchase Requests (general system endpoint)
      const prRes = await fetch("/api/purchase-requests");
      if (prRes.ok) {
        const d = await prRes.json();
        setPurchaseRequests(d);
      }
    } catch (err) {
      console.error("Error loading KMS data:", err);
      showToast("Tizim ma'lumotlarini yuklashda ulanish xatosi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKmsData();
    fetchMyAttendance();
    fetchGroupStats();

    const handleJumpTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.tab) {
        const targetTab = customEvent.detail.tab;
        if (["dashboard", "menu", "inventory", "purchases", "ai", "recipes", "extra"].includes(targetTab)) {
          setActiveTab(targetTab as any);
        }
      }
    };

    window.addEventListener("jump-to-chef-tab", handleJumpTab);
    return () => {
      window.removeEventListener("jump-to-chef-tab", handleJumpTab);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // AI Meal Nutrition Analyzer (Gemini powered)
  const handleAiAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMealName) return;

    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch("/api/meals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: aiMealName,
          description: aiMealDesc,
          mealType: aiMealType === "breakfast" ? "Nonushta" : aiMealType === "lunch" ? "Tushlik" : "Kechki ovqat",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiResult(data.analysis);
        showToast("Gemini AI taom tarkibini muvaffaqiyatli tahlil qildi!");
      } else {
        showToast("AI tahlilida xatolik yuz berdi. Qayta urinib ko'ring.");
      }
    } catch (err) {
      console.error(err);
      showToast("AI Server bilan ulanish xatoligi.");
    } finally {
      setAiLoading(false);
    }
  };

  // Apply AI values directly to the active Menu Creator Form
  const applyAiToForm = () => {
    if (!aiResult) return;
    setMenuMealName(aiMealName);
    setMenuCalories(aiResult.calories || 450);
    setMenuProtein(aiResult.protein || 15);
    setMenuFat(aiResult.fat || 10);
    setMenuCarb(aiResult.carb || 60);
    setMenuVitamins(aiResult.vitamins || "A, C");
    setMenuMinerals(aiResult.minerals || "Kaltsiy, Temir");
    setMenuInstructions(aiResult.aiComment || "Sog'lom taom standarti.");
    setActiveTab("menu");
    showToast("AI tahlili taomnoma shakliga ko'chirildi!");
  };

  // Add Daily Menu
  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuMealName) {
      showToast("Taom nomini kiritishingiz shart!");
      return;
    }

    try {
      const payload = {
        date: menuDate,
        mealType: menuType,
        mealName: menuMealName,
        calories: Number(menuCalories),
        protein: Number(menuProtein),
        fat: Number(menuFat),
        carb: Number(menuCarb),
        vitamins: menuVitamins,
        minerals: menuMinerals,
        allergens: menuAllergens,
        cookingInstructions: menuInstructions,
        portionSize: menuPortionSize,
        servingTime: menuServingTime,
        ageGroup: menuAgeGroup,
        image: menuImage
      };

      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Yangi taomnoma muvaffaqiyatli yaratildi va Telegram Botga yuklandi!");
        setMenuMealName("");
        loadKmsData();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      showToast("Taomnomani saqlashda xatolik.");
    }
  };

  // Copy Previous Menu
  const handleCopyMenu = async (dateStr: string) => {
    const matched = menus.find(m => m.date === dateStr);
    if (!matched) return;

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // Send post to duplicate
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: tomorrowStr,
          breakfast: matched.breakfast,
          lunch: matched.lunch,
          dinner: matched.dinner
        })
      });

      if (res.ok) {
        showToast(`Sana ${tomorrowStr} uchun menyu nusxalandi!`);
        loadKmsData();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Menu
  const handleDeleteMenu = async (dateStr: string) => {
    if (!window.confirm("Ushbu kunlik menyuni o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/menus/${dateStr}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Menyu tizimdan o'chirildi.");
        loadKmsData();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Ingredient
  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName) return;

    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-kindergarten-id": user?.kindergartenId || ""
        },
        body: JSON.stringify({
          name: ingName,
          category: ingCategory,
          quantity: Number(ingQuantity),
          unit: ingUnit,
          supplier: ingSupplier,
          expirationDate: ingExpDate,
          purchasePrice: Number(ingPrice)
        })
      });

      if (res.ok) {
        showToast("Yangi mahsulot omborga qo'shildi!");
        setIngName("");
        setIngQuantity(10);
        loadKmsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Adjust stock
  const handleAdjustStock = async (id: string, amount: number) => {
    const ing = ingredients.find(i => i.id === id);
    if (!ing) return;
    const newQty = Math.max(0, ing.quantity + amount);

    try {
      const res = await fetch(`/api/ingredients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty })
      });

      if (res.ok) {
        showToast("Zaxira darajasi yangilandi.");
        loadKmsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Ingredient
  const handleDeleteIngredient = async (id: string) => {
    if (!window.confirm("Ushbu mahsulotni o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Mahsulot ombordan o'chirildi.");
        loadKmsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Purchase Request
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqProduct) return;

    try {
      const res = await fetch("/api/purchase-requests", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-kindergarten-id": user?.kindergartenId || ""
        },
        body: JSON.stringify({
          product: reqProduct,
          quantity: Number(reqQty),
          price: Number(reqPrice),
          supplier: reqSupplier,
          priority: reqPriority,
          senderName: user?.name || "Abdullayev Rustam",
          senderRole: "Oshpaz"
        })
      });

      if (res.ok) {
        showToast("Xarid so'rovi muvaffaqiyatli yuborildi va Direktorga yo'llandi!");
        setReqProduct("");
        setReqQty(10);
        loadKmsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Recipe
  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeTitle) return;

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipeTitle,
          category: recipeCat,
          instructions: recipeInstructions,
          calories: Number(recipeCal),
          protein: Number(recipeProt),
          cost: Number(recipeCost),
          ingredients: [{ name: "Mol go'shti", amount: 100, unit: "g" }]
        })
      });

      if (res.ok) {
        showToast("Yangi pishiriq retsepti kutubxonaga qo'shildi!");
        setRecipeTitle("");
        setRecipeInstructions("");
        loadKmsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Photo Upload / Selection
  const handlePhotoSelect = (url: string) => {
    setGalleryFile(url);
    showToast("Taom surati tanlandi!");
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryTitle || !galleryFile) {
      showToast("Iltimos sarlavha va rasm kiriting!");
      return;
    }

    try {
      const res = await fetch("/api/meal-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: galleryTitle,
          url: galleryFile,
          type: galleryType
        })
      });

      if (res.ok) {
        showToast("Rasm taom galereyasiga qo'shildi!");
        setGalleryTitle("");
        setGalleryFile("");
        loadKmsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Document downloads
  const handleDownloadDoc = (docType: string) => {
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
      doc.setFontSize(18);
      doc.text(cleanText("OSHPazlik VA TAOMNOMA HISOBOTI"), 14, 20);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
      doc.text(cleanText(`Hujjat turi: ${docType}`), 14, 30);
      doc.text(cleanText(`Sana: ${new Date().toLocaleDateString()}`), 14, 37);
      doc.text(cleanText("Tizim: Nihol ERP Oshpazlik Tizimi"), 14, 44);
      
      doc.line(14, 50, 196, 50);
      
      doc.setFont("Helvetica", "bold");
      doc.text(cleanText("Mundarija va Tasdiqlar"), 14, 60);
      
      doc.setFont("Helvetica", "normal");
      doc.text(cleanText("- Joriy taomnoma tahlili va kaloriyasi: 100% standartga mos"), 14, 70);
      doc.text(cleanText("- Muzlatgich va oziq-ovqat zaxiralari me'yorida"), 14, 77);
      doc.text(cleanText("- Sanitariya va xavfsizlik nazorati o'tkazildi"), 14, 84);
      
      doc.line(14, 100, 196, 100);
      doc.setFontSize(9);
      doc.text(cleanText("* Ushbu PDF hujjat Nihol AI ERP tizimi tomonidan avtomatik ravishda generatsiya qilindi."), 14, 110);
      
      doc.save(`${docType.replace(/\s+/g, "_")}_Hisoboti.pdf`);
      showToast(`"${docType}" hujjati yuklab olindi!`);
    } catch (err) {
      console.error(err);
      showToast("PDF yuklashda xatolik yuz berdi.");
    }
  };

  // Colors mapping for calories, proteins
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-slate-950 font-black px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KMS Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-400/20">
            <ChefHat className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">Chef Panel</h2>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-mono px-2 py-0.5 rounded-md font-black">
                KMS v2.4 (Enterprise)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Xush kelibsiz, <strong className="text-emerald-400">{user?.name || "Bosh Oshpaz Rustam"}</strong>. Oshxona va ozuqa jarayonlarini boshqarish.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto text-xs font-mono">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-right">
            <span className="text-[10px] text-slate-500 block">KIRISH VAQTI:</span>
            <span className="font-bold text-white flex items-center gap-1.5 justify-end">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              2026-07-04 13:06 UTC
            </span>
          </div>
          <button
            onClick={loadKmsData}
            disabled={loading}
            className="bg-slate-850 hover:bg-slate-800 border border-slate-750 text-white p-2.5 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto pb-1 gap-2 border-b border-slate-850">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all ${
            activeTab === "dashboard"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          📊 1. Dashboard
        </button>

        <button
          onClick={() => setActiveTab("menu")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all ${
            activeTab === "menu"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Coffee className="w-4 h-4" />
          🍽️ 2. Kunlik Taomnoma & Menyu
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all ${
            activeTab === "inventory"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          🥦 3. Ombor & Masalliqlar
        </button>

        <button
          onClick={() => setActiveTab("purchases")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all ${
            activeTab === "purchases"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          🛒 4. Xarid So'rovlari
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all ${
            activeTab === "ai"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          🤖 5. AI Nutrition & Allergiyalar
        </button>

        <button
          onClick={() => setActiveTab("recipes")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all ${
            activeTab === "recipes"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          🍳 6. Retseptlar va Galereya
        </button>

        <button
          onClick={() => setActiveTab("extra")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all ${
            activeTab === "extra"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4" />
          📄 7. Kalendar, Xujjatlar & Sozlamalar
        </button>
      </div>

      {/* -------------------- 1. DASHBOARD TAB -------------------- */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* SPECIAL ADDITIONS: MENING DAVOMATIM & GURUHLARDAGI BOLALAR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mening Davomatim */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/25 p-5 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0 uppercase">
                  {user?.name ? user.name.split(" ").map((n: string) => n[0]).join("") : "RK"}
                </div>
                <div className="text-xs">
                  <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded border border-indigo-500/15">Mening Shaxsiy Davomatim</span>
                  <h3 className="text-white text-base font-black tracking-tight mt-1">{user?.name || "Rustam Karimov"}</h3>
                  <p className="text-slate-400 mt-0.5">Lavozim: Bosh Oshpaz • ID: E-105</p>
                  
                  <div className="mt-2 flex items-center gap-3">
                    <div className="text-[10px]">
                      <span className="text-slate-500 block uppercase font-bold">KIRISH</span>
                      <span className="text-emerald-400 font-mono font-bold">{myAttendance?.checkIn ? myAttendance.checkIn : "—"}</span>
                    </div>
                    <div className="text-[10px]">
                      <span className="text-slate-500 block uppercase font-bold">CHIQISH</span>
                      <span className="text-sky-400 font-mono font-bold">{myAttendance?.checkOut ? myAttendance.checkOut : "—"}</span>
                    </div>
                    <div className="text-[10px]">
                      <span className="text-slate-500 block uppercase font-bold">HARORAT</span>
                      <span className="text-amber-400 font-mono font-bold">{myAttendance?.temperature ? `${myAttendance.temperature}°C` : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {!myAttendance ? (
                  <button
                    type="button"
                    onClick={() => handleSelfAttendance("in")}
                    className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    Check-In
                  </button>
                ) : !myAttendance.checkOut ? (
                  <button
                    type="button"
                    onClick={() => handleSelfAttendance("out")}
                    className="bg-sky-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-sky-400 transition-all cursor-pointer shadow-lg shadow-sky-500/10"
                  >
                    Check-Out
                  </button>
                ) : (
                  <span className="bg-slate-800 text-slate-400 px-3 py-2 rounded-xl text-xs font-bold border border-slate-750 flex items-center gap-1">
                    ✓ Yakunlandi
                  </span>
                )}
              </div>
            </div>

            {/* Guruhlardagi Bolalar Soni */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded border border-emerald-500/15">Guruhlar Keldi-Ketdisi</span>
                <span className="text-xs text-slate-400 font-medium">Guruhlardagi bolalar soni</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {groupStats.length > 0 ? groupStats.map(g => {
                  const percent = g.total > 0 ? Math.round((g.present / g.total) * 100) : 0;
                  return (
                    <div key={g.name} className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">{g.name}</span>
                        <span className="font-mono text-[10px] text-emerald-400 font-bold">{g.present}/{g.total}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-2 text-center text-slate-500 py-4 text-xs font-medium">Guruhlar yuklanmoqda...</div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Grid - 12 Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Today's Breakfast</span>
              <span className="text-xs font-black text-white mt-1.5 truncate">{stats.todayBreakfast}</span>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-400">
                <Coffee className="w-3.5 h-3.5" /> Nonushta • 08:30
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Today's Lunch</span>
              <span className="text-xs font-black text-white mt-1.5 truncate">{stats.todayLunch}</span>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-blue-400">
                <Soup className="w-3.5 h-3.5" /> Tushlik • 12:30
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Afternoon Snack</span>
              <span className="text-xs font-black text-white mt-1.5 truncate">{stats.todayAfternoonSnack}</span>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-amber-400">
                <Salad className="w-3.5 h-3.5" /> Peshindan keyin • 15:30
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Today's Dinner</span>
              <span className="text-xs font-black text-white mt-1.5 truncate">{stats.todayDinner}</span>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-indigo-400">
                <ChefHat className="w-3.5 h-3.5" /> Kechki ovqat • 18:00
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Total Meals Prepared</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-mono font-extrabold text-white">{stats.totalMealsPrepared}</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Tizimli</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">Bugun tarqatilgan umumiy porsiya</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Children Eating Today</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-mono font-extrabold text-white">{stats.childrenEatingToday} ta</span>
                <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">Kelganlar</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">Bog'chadagi bolalar davomati bo'yicha</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Special Diet Children</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-mono font-extrabold text-amber-400">{stats.specialDietChildren} ta</span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Maxsus</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">Diabet / Gluten-free parhezli</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Allergy Alerts</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-mono font-extrabold text-rose-500">{stats.allergyAlerts} ta</span>
                <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">XAVF!</span>
              </div>
              <p className="text-[9px] text-rose-400/80 mt-1 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" /> Taomda allergen ogohlantirish
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Low Stock Ingredients</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-mono font-extrabold text-amber-500">{stats.lowStockIngredients} ta</span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Kam qolgan</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">Zaxirasi 10 kg/litrdan kam mahsulot</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Purchase Requests</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-mono font-extrabold text-white">{stats.purchaseRequests} ta</span>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-1.5 py-0.5 rounded">Kutilmoqda</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">Direktor tasdig'ini kutayotgan xaridlar</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Kitchen Tasks</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-mono font-extrabold text-emerald-400">5 / 6</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Faol</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">Bugungi tozalash va texnik nazoratlar</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">AI Nutrition Score</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-mono font-extrabold text-emerald-400">{stats.aiNutritionScore} / 100</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">A'lo</span>
              </div>
              <p className="text-[9px] text-emerald-400 mt-1">Vitamin va kaloriya balansi a'lo</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Calorie & Cost Analysis */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-sm">Haftalik Taomnoma va Kaloriya tahlili</h3>
                <span className="text-[10px] text-slate-500 font-mono">Dushanba - Juma</span>
              </div>
              <div className="h-64 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartsData.weeklyMenu || []}>
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
                    <Legend />
                    <Bar dataKey="calories" name="Kaloriyalar (kcal)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" name="Tannarx (UZS)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Calories Distribution by Meal types */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-sm">Ozuqa ulushlarining taqsimoti</h3>
                <span className="text-[10px] text-slate-500 font-mono">Taom turlari bo'yicha (%)</span>
              </div>
              <div className="h-64 text-xs font-mono flex items-center justify-between">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartsData.caloriesDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(chartsData.caloriesDistribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2 text-[11px] text-slate-300">
                  {(chartsData.caloriesDistribution || []).map((entry: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="capitalize">{entry.name}:</span>
                      <strong className="text-white font-mono">{entry.value}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Protein Intake actual vs standard norm */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-sm">Haftalik Protein (Oqsil) iste'moli normasi</h3>
                <span className="text-[10px] text-slate-500 font-mono">Me'yoriy vs Haqiqiy (gramm)</span>
              </div>
              <div className="h-64 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartsData.proteinIntake || []}>
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
                    <Legend />
                    <Area type="monotone" dataKey="norm" name="Standart norma" stroke="#64748b" fill="#1e293b" />
                    <Area type="monotone" dataKey="actual" name="Taqdim etilgan" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Food waste tracking */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-sm">Oziq-ovqat Isrofi (Waste Tracker)</h3>
                <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded">Kamaytirish tahlili</span>
              </div>
              <div className="h-64 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartsData.wasteStatistics || []}>
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
                    <Legend />
                    <Bar dataKey="prepared" name="Pishirilgan porsiya" fill="#3b82f6" />
                    <Bar dataKey="waste" name="Isrof bo'lgan porsiya" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recharts weekly macronutrient distribution chart */}
            <div className="lg:col-span-2">
              <MacronutrientsRechartsChart data={chartsData.weeklyMenu} />
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="text-white font-bold text-sm">Tezkor Operatsiyalar</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <button
                onClick={() => { setActiveTab("menu"); setMenuType("Breakfast"); }}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white p-3.5 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-bold">Today's Menu</span>
              </button>

              <button
                onClick={() => setActiveTab("recipes")}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white p-3.5 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-bold">Add New Meal</span>
              </button>

              <button
                onClick={() => { setActiveTab("recipes"); }}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white p-3.5 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Image className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-bold">Upload Meal Photo</span>
              </button>

              <button
                onClick={() => setActiveTab("purchases")}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white p-3.5 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-bold">Request Ingredients</span>
              </button>

              <button
                onClick={() => setActiveTab("inventory")}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white p-3.5 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Layers className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-bold">View Inventory</span>
              </button>

              <button
                onClick={() => handleDownloadDoc("Nutrition Analysis Report")}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white p-3.5 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <FileDown className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-bold">Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. DAILY MENU TAB -------------------- */}
      {activeTab === "menu" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Menu Creation Form */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-bold text-sm">Yangi taom yoki menyu qo'shish</h3>
            </div>

            <form onSubmit={handleAddMenu} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Sana:</span>
                  <input
                    type="date"
                    required
                    value={menuDate}
                    onChange={(e) => setMenuDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Taom turi (Meal Type):</span>
                  <select
                    value={menuType}
                    onChange={(e) => setMenuType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="Breakfast">Breakfast (Nonushta)</option>
                    <option value="Morning Snack">Morning Snack (Ertalabki gazak)</option>
                    <option value="Lunch">Lunch (Tushlik)</option>
                    <option value="Afternoon Snack">Afternoon Snack (Tushdan keyingi snack)</option>
                    <option value="Dinner">Dinner (Kechki ovqat)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Taom nomi:</span>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Mastava sho'rva, ko'k choy..."
                  value={menuMealName}
                  onChange={(e) => setMenuMealName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold block">Kaloriya</span>
                  <input
                    type="number"
                    value={menuCalories}
                    onChange={(e) => setMenuCalories(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-center"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold block">Oqsil (g)</span>
                  <input
                    type="number"
                    value={menuProtein}
                    onChange={(e) => setMenuProtein(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-center"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold block">Yog' (g)</span>
                  <input
                    type="number"
                    value={menuFat}
                    onChange={(e) => setMenuFat(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-center"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold block">Uglevod</span>
                  <input
                    type="number"
                    value={menuCarb}
                    onChange={(e) => setMenuCarb(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Vitaminlar:</span>
                  <input
                    type="text"
                    value={menuVitamins}
                    onChange={(e) => setMenuVitamins(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Minerallar:</span>
                  <input
                    type="text"
                    value={menuMinerals}
                    onChange={(e) => setMenuMinerals(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Porsiya (Portion):</span>
                  <input
                    type="text"
                    value={menuPortionSize}
                    onChange={(e) => setMenuPortionSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Tortish vaqti:</span>
                  <input
                    type="text"
                    value={menuServingTime}
                    onChange={(e) => setMenuServingTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Yosh guruhi:</span>
                  <input
                    type="text"
                    value={menuAgeGroup}
                    onChange={(e) => setMenuAgeGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Allergenlar borligi:</span>
                <input
                  type="text"
                  value={menuAllergens}
                  onChange={(e) => setMenuAllergens(e.target.value)}
                  placeholder="G'alla, tuxum, sut yoki yo'q"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 font-bold block">Taom Rasmi (Rasm tanlang yoki URL kiriting):</span>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { id: "porridge", url: "https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?auto=format&fit=crop&q=80&w=300", label: "Bo'tqa" },
                    { id: "soup", url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=300", label: "Sho'rva" },
                    { id: "salad", url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300", label: "Salat" },
                    { id: "rice", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300", label: "Osh" },
                    { id: "fruit", url: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&q=80&w=300", label: "Meva" },
                    { id: "pasta", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=300", label: "Issiq taom" }
                  ].map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setMenuImage(img.url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        menuImage === img.url ? "border-emerald-500 scale-105" : "border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white py-0.5 text-center truncate">{img.label}</div>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Yoki maxsus rasm URL manzili..."
                  value={menuImage}
                  onChange={(e) => setMenuImage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2 text-[10px] text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Pishirish texnologiyasi & Tayyorlanishi:</span>
                <textarea
                  value={menuInstructions}
                  onChange={(e) => setMenuInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl cursor-pointer shadow flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-xs"
              >
                <Save className="w-4 h-4" /> TAOMNOMANI SAQLASH & PUSH
              </button>
            </form>
          </div>

          {/* Menus / Meal Plans Table & History */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                Kunlik taomnomalar tarixi
              </h3>
              <div className="flex gap-2">
                <span className="text-[10px] text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md font-mono border border-slate-850">
                  Jami: {menus.length} kun
                </span>
              </div>
            </div>

            {/* Quick Filter planning modes */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
              <div className="bg-slate-950 text-emerald-400 p-2 rounded-xl border border-slate-850">Weekly Planning</div>
              <div className="bg-slate-950 text-slate-400 p-2 rounded-xl border border-slate-850 cursor-pointer hover:text-white">Monthly Planning</div>
              <div className="bg-slate-950 text-slate-400 p-2 rounded-xl border border-slate-850 cursor-pointer hover:text-white">Seasonal Menu</div>
              <div className="bg-slate-950 text-slate-400 p-2 rounded-xl border border-slate-850 cursor-pointer hover:text-white">Holiday Menu</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[9px] tracking-wider">
                    <th className="py-3 px-2">Sana</th>
                    <th className="py-3 px-2">Nonushta</th>
                    <th className="py-3 px-2">Tushlik</th>
                    <th className="py-3 px-2">Kechki ovqat</th>
                    <th className="py-3 px-2 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {menus.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-950/40">
                      <td className="py-3 px-2 font-mono font-bold text-emerald-400">{item.date}</td>
                      <td className="py-3 px-2">
                        <div className="max-w-[120px] truncate" title={item.breakfast?.title}>{item.breakfast?.title || "Sutli bo'tqa"}</div>
                        <span className="text-[9px] text-slate-500 block">{item.breakfast?.calories} kcal</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="max-w-[120px] truncate font-bold text-white" title={item.lunch?.title}>{item.lunch?.title || "Sho'rva"}</div>
                        <span className="text-[9px] text-slate-500 block">{item.lunch?.calories} kcal</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="max-w-[120px] truncate" title={item.dinner?.title}>{item.dinner?.title || "Zapekanka"}</div>
                        <span className="text-[9px] text-slate-500 block">{item.dinner?.calories} kcal</span>
                      </td>
                      <td className="py-3 px-2 text-right space-x-1.5">
                        <button
                          onClick={() => handleCopyMenu(item.date)}
                          className="bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 px-2 py-1 rounded text-[9px] font-bold cursor-pointer"
                          title="Nusxalash"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(item.date)}
                          className="bg-slate-950 hover:bg-rose-950 text-rose-500 border border-slate-800 hover:border-rose-900 px-2 py-1 rounded text-[9px] font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {menus.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-bold">
                        Hozircha saqlangan taomnomalar mavjud emas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 3. INVENTORY TAB -------------------- */}
      {activeTab === "inventory" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Ingredient Form */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-bold text-sm">Yangi mahsulot kirim qilish</h3>
            </div>

            <form onSubmit={handleAddIngredient} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Mahsulot nomi:</span>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Guruch Alanga premium..."
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Kategoriya:</span>
                  <select
                    value={ingCategory}
                    onChange={(e) => setIngCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="Vegetables">Vegetables (Sabzavot)</option>
                    <option value="Fruits">Fruits (Mevalar)</option>
                    <option value="Meat">Meat (Go'sht)</option>
                    <option value="Dairy">Dairy (Sut/Tuxum)</option>
                    <option value="Flour">Flour (Ular)</option>
                    <option value="Rice">Rice (Donlar)</option>
                    <option value="Oil">Oil (Yog'lar)</option>
                    <option value="Sugar">Sugar (Shakar)</option>
                    <option value="Spices">Spices (Ziravorlar)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">O'lchov birligi:</span>
                  <select
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="kg">kilogramm (kg)</option>
                    <option value="litr">litr (L)</option>
                    <option value="dona">dona (pcs)</option>
                    <option value="qop">qop (bag)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Kirim miqdori:</span>
                  <input
                    type="number"
                    value={ingQuantity}
                    onChange={(e) => setIngQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Sotib olish narxi (1 birlik):</span>
                  <input
                    type="number"
                    value={ingPrice}
                    onChange={(e) => setIngPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Yetkazib beruvchi (Supplier):</span>
                <input
                  type="text"
                  placeholder="Masalan: Agromir LLC"
                  value={ingSupplier}
                  onChange={(e) => setIngSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Yaroqlilik muddati (Expiration Date):</span>
                <input
                  type="date"
                  value={ingExpDate}
                  onChange={(e) => setIngExpDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex flex-col items-center gap-1">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Barcode / QR generator</span>
                <div className="h-7 w-2/3 bg-slate-900 border border-slate-800 flex items-center justify-between px-2 font-mono text-[9px] text-slate-400">
                  <span>||| | ||| || |||</span>
                  <span>{ingName ? ingName.slice(0,3).toUpperCase() + "-" + Date.now().toString().slice(-4) : "BARCODE-0000"}</span>
                </div>
                <span className="text-[7px] text-slate-500">Ombor inventarizatsiyasi uchun skanerlash kodi</span>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl cursor-pointer shadow flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> OMBOREMENTGA QO'SHISH
              </button>
            </form>
          </div>

          {/* Current Stock Levels Table */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Mavjud oziq-ovqat mahsulotlari zaxirasi (Current Stock)
              </h3>
              <div className="flex gap-2">
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Low Stock alerts: {ingredients.filter(i => i.quantity <= 10).length}
                </span>
              </div>
            </div>

            {/* Low stock indicators alert alert */}
            {ingredients.filter(i => i.quantity <= 10).map((ing, idx) => (
              <div key={idx} className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-3 rounded-2xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>ZAXIRA KAM:</strong> <strong>{ing.name}</strong> mahsuloti zaxirada juda kam qolgan: <strong>{ing.quantity} {ing.unit}</strong>. Direktorga yangi xarid so'rovi jo'natishingiz tavsiya etiladi.
                </span>
              </div>
            ))}

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[9px] tracking-wider">
                    <th className="py-3 px-2">Mahsulot</th>
                    <th className="py-3 px-2">Kategoriya</th>
                    <th className="py-3 px-2">Miqdori (Zaxira)</th>
                    <th className="py-3 px-2">Yetkazib beruvchi / Narx</th>
                    <th className="py-3 px-2">Yaroqlilik muddati</th>
                    <th className="py-3 px-2 text-right">Zaxira amali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {ingredients.map((item: any, index: number) => {
                    const isExpired = new Date(item.expirationDate) < new Date();
                    const isLow = item.quantity <= 10;
                    return (
                      <tr key={index} className="hover:bg-slate-950/40">
                        <td className="py-3 px-2">
                          <span className="font-extrabold text-white">{item.name}</span>
                          <span className="text-[9px] text-slate-500 block">ID: {item.id}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="bg-slate-950 border border-slate-800 text-slate-400 text-[9px] px-2 py-0.5 rounded-full uppercase">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`font-mono font-black text-xs ${isLow ? "text-amber-500" : "text-white"}`}>
                            {item.quantity} {item.unit}
                          </span>
                          <span className={`text-[8px] block font-bold ${isLow ? "text-amber-500/80" : "text-emerald-400"}`}>
                            {isLow ? "KAM QOLDI ⚠️" : "YETARLI ✅"}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-slate-400 block">{item.supplier}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{(item.purchasePrice || 0).toLocaleString()} UZS</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`font-mono font-bold ${isExpired ? "text-red-500" : "text-slate-400"}`}>
                            {item.expirationDate}
                          </span>
                          {isExpired && <span className="text-[8px] text-red-500 block font-bold">⚠️ MUDDATI O'TDI</span>}
                        </td>
                        <td className="py-3 px-2 text-right space-x-1">
                          <button
                            onClick={() => handleAdjustStock(item.id, 5)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer"
                            title="+5 kg qo'shish"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleAdjustStock(item.id, -5)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer"
                            title="-5 kg ishlatildi"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleDeleteIngredient(item.id)}
                            className="bg-slate-950 hover:bg-rose-950 text-rose-500 border border-slate-800 hover:border-rose-900 px-1.5 py-0.5 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {ingredients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 font-bold">
                        Zaxiralar ro'yxati yuklanmoqda...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 4. PURCHASE REQUESTS TAB -------------------- */}
      {activeTab === "purchases" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Purchase request creation */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-bold text-sm font-sans">Yangi Xarid So'rovi yaratish</h3>
            </div>

            <form onSubmit={handleAddPurchase} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Sotib olinishi kerak bo'lgan mahsulot (Product):</span>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Mol go'shti (Sux filiali) 25kg..."
                  value={reqProduct}
                  onChange={(e) => setReqProduct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Miqdor / Hajm:</span>
                  <input
                    type="number"
                    value={reqQty}
                    onChange={(e) => setReqQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Kutilayotgan narx:</span>
                  <input
                    type="number"
                    value={reqPrice}
                    onChange={(e) => setReqPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Kutilayotgan yetkazib beruvchi:</span>
                <input
                  type="text"
                  value={reqSupplier}
                  onChange={(e) => setReqSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Ustuvorlik darajasi (Priority):</span>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="Kam">Kam (Low)</option>
                  <option value="O'rtacha">O'rtacha (Medium)</option>
                  <option value="Shoshilinch">Shoshilinch (Urgent)</option>
                </select>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-1 text-[10px] text-slate-400">
                <strong className="text-white block uppercase text-[8px] tracking-wider">Xarid tasdiqlanish jarayoni:</strong>
                <p>1. Oshpaz so'rov yaratadi (Hozirgi qadam)</p>
                <p>2. Direktor ko'rib chiqadi va tasdiqlaydi</p>
                <p>3. Buxgalter to'lovni o'tkazadi</p>
                <p>4. Ombor avtomatik yangilanadi</p>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl cursor-pointer shadow flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" /> SO'ROVNI DIREKTORGA JO'NATISH
              </button>
            </form>
          </div>

          {/* Requests History List */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="text-white font-bold text-sm flex items-center gap-2 pb-3 border-b border-slate-850">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              Direktor va Buxgalterga yo'llangan xarid so'rovlari holati
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[9px] tracking-wider">
                    <th className="py-3 px-2">Request ID</th>
                    <th className="py-3 px-2">Xarid Sarlavhasi</th>
                    <th className="py-3 px-2">Umumiy Miqdor (Summa)</th>
                    <th className="py-3 px-2">Yuborilgan Sana</th>
                    <th className="py-3 px-2">Tasdiqladi</th>
                    <th className="py-3 px-2 text-right">Holati (Status)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {purchaseRequests.map((item: any, index: number) => {
                    const isApproved = item.status === "Tasdiqlandi" || item.status === "To'landi";
                    const isPaid = item.status === "To'landi";
                    return (
                      <tr key={index} className="hover:bg-slate-950/40">
                        <td className="py-3 px-2 font-mono font-bold text-emerald-400">{item.id}</td>
                        <td className="py-3 px-2">
                          <span className="font-extrabold text-white block">{item.title}</span>
                          <span className="text-[9px] text-slate-500 font-medium">Yuboruvchi: {item.senderName} ({item.senderRole})</span>
                        </td>
                        <td className="py-3 px-2 font-mono text-white font-bold">{(item.amount || 0).toLocaleString()} UZS</td>
                        <td className="py-3 px-2 font-mono text-slate-400">{item.date}</td>
                        <td className="py-3 px-2">
                          <span className="text-slate-400 font-medium">{item.approvedBy || "—"}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              isPaid
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isApproved
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {purchaseRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 font-bold">
                        Hozircha xarid so'rovlari mavjud emas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 5. AI NUTRITION & ALLERGIES TAB -------------------- */}
      {activeTab === "ai" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gemini Nutrition Calculator */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 flex flex-col justify-between h-[580px] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/10 p-2 rounded-2xl text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">🤖 AI Ozuqa va Kaloriya Tahlili</h3>
                  <span className="text-[10px] text-slate-500 font-medium font-mono">Gemini-3.5-flash model</span>
                </div>
              </div>

              <form onSubmit={handleAiAnalyze} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase block">Taom nomi:</span>
                  <input
                    type="text"
                    required
                    value={aiMealName}
                    onChange={(e) => setAiMealName(e.target.value)}
                    placeholder="Masalan: Frikadelkali moshxo'rda..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase block">Masalliqlar / Tavsif:</span>
                  <textarea
                    value={aiMealDesc}
                    onChange={(e) => setAiMealDesc(e.target.value)}
                    placeholder="Mol go'shti, mosh, guruch, piyoz, sabzi, o'simlik yog'i, ziravorlar..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none h-16 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase block">Taom turi (Meal Type):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAiMealType("breakfast")}
                      className={`py-2 px-2 rounded-lg font-bold border transition-all cursor-pointer ${
                        aiMealType === "breakfast" ? "bg-emerald-500 text-slate-950 border-emerald-500" : "bg-slate-950 text-slate-400 border-slate-850"
                      }`}
                    >
                      Breakfast
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiMealType("lunch")}
                      className={`py-2 px-2 rounded-lg font-bold border transition-all cursor-pointer ${
                        aiMealType === "lunch" ? "bg-emerald-500 text-slate-950 border-emerald-500" : "bg-slate-950 text-slate-400 border-slate-850"
                      }`}
                    >
                      Lunch
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiMealType("dinner")}
                      className={`py-2 px-2 rounded-lg font-bold border transition-all cursor-pointer ${
                        aiMealType === "dinner" ? "bg-emerald-500 text-slate-950 border-emerald-500" : "bg-slate-950 text-slate-400 border-slate-850"
                      }`}
                    >
                      Dinner
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={aiLoading || !aiMealName}
                  className="w-full bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black py-2.5 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  {aiLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      AI HISOBLAMOQDA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      NUTRITION TAHLILINI CHIQARISH
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* AI Results displaying beautifully */}
            {aiResult && (
              <div className="mt-4 bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/20 text-xs space-y-3 animate-fade-in shrink-0">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Tahlil Natijalari
                  </span>
                  <button
                    onClick={applyAiToForm}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-1 rounded text-[10px] font-black cursor-pointer active:scale-95"
                  >
                    FORMAGA YUKLASH 📥
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                  <div className="bg-slate-900 p-1.5 rounded-lg">
                    <span className="text-[8px] text-slate-500 block uppercase">Kcal</span>
                    <span className="font-black text-white">{aiResult.calories}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded-lg">
                    <span className="text-[8px] text-slate-500 block uppercase">Oqsil</span>
                    <span className="font-black text-emerald-400">{aiResult.protein}g</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded-lg">
                    <span className="text-[8px] text-slate-500 block uppercase">Yog'</span>
                    <span className="font-black text-white">{aiResult.fat}g</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded-lg">
                    <span className="text-[8px] text-slate-500 block uppercase">Uglevod</span>
                    <span className="font-black text-white">{aiResult.carb}g</span>
                  </div>
                </div>

                <div className="text-[10px] leading-relaxed text-slate-300">
                  <strong>Vitaminlar:</strong> {aiResult.vitamins}
                  <br />
                  <strong>Minerallar:</strong> {aiResult.minerals}
                </div>

                <p className="text-[10px] text-slate-400 italic bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 leading-relaxed">
                  "{aiResult.aiComment}"
                </p>
              </div>
            )}
          </div>

          {/* Allergies Board & Special Diet Lists */}
          <div className="lg:col-span-7 space-y-6">
            {/* Allergies Alerts */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-white font-bold text-sm">
                  Oshxona Allergiya Ogohlantirish Tizimi (Allergy Management)
                </h3>
              </div>

              <p className="text-xs text-slate-400">
                Hamshira tomonidan bolalarning tibbiy kartalariga yozilgan barcha allergiyalar ushbu panelda ko'rinib turadi. Oshpaz taom tayyorlashda ushbu bolalarga allergen tarkibiy qismlarni qo'shmasligi shart.
              </p>

              <div className="space-y-3">
                {allergies.map((item: any, idx: number) => (
                  <div key={idx} className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        {item.childName}
                      </span>
                      <span className="bg-slate-950 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-800">
                        Guruh: {item.group}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[8px]">Allergiya turi:</span>
                        <span className="text-rose-400 font-black">{item.allergy}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[8px]">Tavsiya etilgan muqobil (Alternative):</span>
                        <span className="text-emerald-400 font-extrabold">{item.suggestedAlternative}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {allergies.length === 0 && (
                  <div className="text-center py-6 text-slate-500 font-bold text-xs">
                    Tizimda og'ir allergiyali bolalar ro'yxati mavjud emas.
                  </div>
                )}
              </div>
            </div>

            {/* Special Diet children */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                <Heart className="w-5 h-5 text-emerald-400" /> Maxsus Parhezlar Ro'yxati (Special Diet Categories)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-center font-bold">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                  <span className="text-slate-400 block uppercase text-[8px] tracking-wider mb-1">Diabetik</span>
                  <span className="text-emerald-400 font-mono text-sm">2 ta bola</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                  <span className="text-slate-400 block uppercase text-[8px] tracking-wider mb-1">Gluten-Free</span>
                  <span className="text-emerald-400 font-mono text-sm">1 ta bola</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                  <span className="text-slate-400 block uppercase text-[8px] tracking-wider mb-1">Lactose-Free</span>
                  <span className="text-emerald-400 font-mono text-sm">3 ta bola</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 6. RECIPES & GALLERY TAB -------------------- */}
      {activeTab === "recipes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recipe builder form */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-bold text-sm">Yangi taom retsepti qo'shish</h3>
            </div>

            <form onSubmit={handleAddRecipe} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Taom sarlavhasi (Recipe Title):</span>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Tovuqli pasta shirin..."
                  value={recipeTitle}
                  onChange={(e) => setRecipeTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Kategoriya:</span>
                  <select
                    value={recipeCat}
                    onChange={(e) => setRecipeCat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="Soups">Soups (Sho'rvalar)</option>
                    <option value="Rice">Rice (Guruchli taomlar)</option>
                    <option value="Pasta">Pasta (Xamirli taomlar)</option>
                    <option value="Meat">Meat (Go'shtli)</option>
                    <option value="Desserts">Desserts (Desertlar)</option>
                    <option value="Drinks">Drinks (Ichimliklar)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Porsiya tannarxi (Cost):</span>
                  <input
                    type="number"
                    value={recipeCost}
                    onChange={(e) => setRecipeCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Kaloriya:</span>
                  <input
                    type="number"
                    value={recipeCal}
                    onChange={(e) => setRecipeCal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Oqsil miqdori:</span>
                  <input
                    type="number"
                    value={recipeProt}
                    onChange={(e) => setRecipeProt(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Tayyorlash va pishirish bosqichlari:</span>
                <textarea
                  required
                  placeholder="Go'sht va sabzavotlarni qovurib suv solasiz..."
                  value={recipeInstructions}
                  onChange={(e) => setRecipeInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl cursor-pointer shadow flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> RETSEPT KUTUBXONASIGA QO'SHISH
              </button>
            </form>
          </div>

          {/* Recipes Library List & Meal Gallery photo upload */}
          <div className="lg:col-span-8 space-y-6">
            {/* Library Grid */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-2 pb-3 border-b border-slate-850">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                Bog'cha oshxonasi retseptlar kutubxonasi (Recipe Library)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((item: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-white text-xs block">{item.title}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 line-clamp-3">
                        {item.instructions}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-900 grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                      <div className="bg-slate-900 p-1.5 rounded-lg text-slate-300">
                        <span>Kcal: <strong>{item.calories}</strong></span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded-lg text-slate-300">
                        <span>Oqsil: <strong>{item.protein}g</strong></span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded-lg text-emerald-400">
                        <span>Sum: <strong>{(item.cost || 8000).toLocaleString()}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meal Gallery container before/after */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Image className="w-5 h-5 text-emerald-400" />
                  Meal Gallery & Parent TG Preview Sharing
                </h3>
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  Active Bot Live!
                </span>
              </div>

              {/* Photo library select simulator */}
              <div className="space-y-3">
                <span className="text-[10.5px] text-slate-400 block">
                  Tayyor bo'lgan taomlarni rasmga olib galereyaga va ota-onalar Telegram guruhiga bitta bosish bilan yuborishingiz mumkin.
                </span>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=200",
                    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=200",
                    "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&q=80&w=200",
                    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=200"
                  ].map((url, i) => (
                    <div
                      key={i}
                      onClick={() => handlePhotoSelect(url)}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 ${
                        galleryFile === url ? "border-emerald-400" : "border-transparent"
                      }`}
                    >
                      <img src={url} alt="Meal preview" className="w-full h-14 object-cover" />
                      {galleryFile === url && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center font-bold text-slate-950 text-[10px]">
                          TANLANDI ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Form to submit gallery */}
                <form onSubmit={handleAddGallery} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs items-end pt-3">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold">Rasm sarlavhasi (Meal Name):</span>
                    <input
                      type="text"
                      required
                      placeholder="Mastava tushlik taomimiz..."
                      value={galleryTitle}
                      onChange={(e) => setGalleryTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold">Bosqich (Status Photo):</span>
                    <select
                      value={galleryType}
                      onChange={(e) => setGalleryType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                    >
                      <option value="Before Cooking">Before Cooking (Pishishdan oldin)</option>
                      <option value="After Cooking">After Cooking (Tayyor taom)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl cursor-pointer shadow flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <Send className="w-4 h-4" /> BOT ORQALI TARQATISH
                  </button>
                </form>

                {/* Gallery item list list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4">
                  {gallery.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-850 flex items-center p-2.5 gap-3">
                      <img src={item.url} alt={item.title} className="w-16 h-16 object-cover rounded-xl shrink-0" />
                      <div className="text-xs space-y-1">
                        <span className="font-extrabold text-white block truncate max-w-[150px]">{item.title}</span>
                        <span className="text-[9px] text-slate-500 block">Sana: {item.date}</span>
                        <span className="bg-slate-900 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-800 uppercase">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 7. CALENDAR, DOCUMENTS & SETTINGS TAB -------------------- */}
      {activeTab === "extra" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kitchen Calendar */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="text-white font-bold text-sm flex items-center gap-2 pb-2 border-b border-slate-850">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Oshxona Taqvim rejalari (Kitchen Calendar)
            </h3>
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] text-slate-500 font-bold border-b border-slate-900 pb-1">
              <span>Du</span><span>Se</span><span>Ch</span><span>Pa</span><span>Ju</span><span>Sha</span><span>Ya</span>
            </div>
            {/* Simple calendar preview */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const isToday = day === 4;
                const hasEvent = [2, 4, 10, 15, 22].includes(day);
                return (
                  <div
                    key={i}
                    className={`p-2 rounded-lg flex flex-col items-center justify-between h-11 relative ${
                      isToday ? "bg-emerald-500 text-slate-950 font-black" : "bg-slate-950 text-slate-400"
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvent && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isToday ? "bg-slate-950" : "bg-emerald-400"}`}></span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Events List */}
            <div className="space-y-2.5 text-[11px] pt-3">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-white block">Kompleks Tozalash (Deep Cleaning)</span>
                  <span className="text-slate-500 font-mono text-[9px]">Sana: Har Yakshanba, 09:00</span>
                </div>
                <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/20">
                  Muhim
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-white block">Tibbiy Sanitar Inspeksiya (Kitchen Inspection)</span>
                  <span className="text-slate-500 font-mono text-[9px]">Sana: 2026-07-10</span>
                </div>
                <span className="bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-rose-500/20">
                  Majburiy
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-white block">Dilerlik yetkazib berish (Agromir Delivery)</span>
                  <span className="text-slate-500 font-mono text-[9px]">Sana: Har seshanba va payshanba</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20">
                  Grafik
                </span>
              </div>
            </div>
          </div>

          {/* Documents, settings and profile */}
          <div className="lg:col-span-6 space-y-6">
            {/* Kitchen Documents & Nutrition reports */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-2 pb-2 border-b border-slate-850">
                <FileText className="w-5 h-5 text-emerald-400" />
                Oshxona Xujjatlari va Hisobotlari (Kitchen Documents)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Supplier Contracts</span>
                    <span className="text-[10px] text-slate-500">Agromir LLC 2026-2027</span>
                  </div>
                  <button
                    onClick={() => handleDownloadDoc("Yetkazib beruvchi shartnomasi")}
                    className="p-1.5 hover:bg-slate-900 text-emerald-400 rounded-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Health Certificates</span>
                    <span className="text-[10px] text-slate-500">Oshxona xodimlari tibbiy kitobi</span>
                  </div>
                  <button
                    onClick={() => handleDownloadDoc("Salomatlik sertifikati")}
                    className="p-1.5 hover:bg-slate-900 text-emerald-400 rounded-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Inspection Reports</span>
                    <span className="text-[10px] text-slate-500">SES Sanitar tahlil bayonnomasi</span>
                  </div>
                  <button
                    onClick={() => handleDownloadDoc("Sanitar tekshirish hujjati")}
                    className="p-1.5 hover:bg-slate-900 text-emerald-400 rounded-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Weekly Waste Statistics</span>
                    <span className="text-[10px] text-slate-500">Iyun-Iyul oyi ovqat chiqindilari</span>
                  </div>
                  <button
                    onClick={() => handleDownloadDoc("Oziq-ovqat isrofi statistikasi")}
                    className="p-1.5 hover:bg-slate-900 text-emerald-400 rounded-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Kitchen Settings config */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-emerald-400" /> Oshxona Sozlamalari (Kitchen Settings)
              </h3>
              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block">Bolalar yosh guruhi standarti:</span>
                    <input
                      type="text"
                      value={ageGroupStandard}
                      onChange={(e) => setAgeGroupStandard(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block">Standart yetkazib beruvchi:</span>
                    <input
                      type="text"
                      value={defaultSupplier}
                      onChange={(e) => setDefaultSupplier(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                  <div>
                    <span className="text-slate-500 block font-bold mb-1 uppercase text-[8px]">Breakfast</span>
                    <input
                      type="text"
                      value={mealTimesSetting.breakfast}
                      onChange={(e) => setMealTimesSetting({ ...mealTimesSetting, breakfast: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-white text-center"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold mb-1 uppercase text-[8px]">Lunch</span>
                    <input
                      type="text"
                      value={mealTimesSetting.lunch}
                      onChange={(e) => setMealTimesSetting({ ...mealTimesSetting, lunch: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-white text-center"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold mb-1 uppercase text-[8px]">Dinner</span>
                    <input
                      type="text"
                      value={mealTimesSetting.dinner}
                      onChange={(e) => setMealTimesSetting({ ...mealTimesSetting, dinner: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-white text-center"
                    />
                  </div>
                </div>

                <button
                  onClick={() => showToast("Oshxona sozlamalari muvaffaqiyatli yangilandi!")}
                  className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:text-white text-slate-300 font-bold py-2 px-4 rounded-xl cursor-pointer"
                >
                  Sozlamalarni saqlash
                </button>
              </div>
            </div>

            {/* Profile Panel */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                <User className="w-5 h-5 text-emerald-400" /> Bosh Oshpaz Shaxsiy Profili (Chef Profile)
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center font-black text-emerald-400 font-mono">
                  CHEF
                </div>
                <div className="space-y-1">
                  <span className="font-extrabold text-white block">Abdullayev Rustam G'ofurovich</span>
                  <span className="text-slate-400 block font-mono">ID: CHEF-4889 • Lavozim: Bosh Oshpaz</span>
                  <span className="text-[10px] text-slate-500 block">Oxirgi kirish: Bugun 08:11 (IP: 192.168.1.104)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
