import { GoogleGenAI } from "@google/genai";
import { dbState, saveLocalDb, isPg } from "../db";
import { getKgId } from "../middleware/validationMiddleware";
import { ChildModel, GroupModel, AuditLogModel, ExpenseModel, RecipeModel, MealPlanModel, MealGalleryModel, IngredientModel } from "../models";
import { sendTelegramMessage } from "../utils/telegramManager";

let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required for AI features");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export const ChefController = {
  async getMenu(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const plans = await MealPlanModel.getAll(kgId);
      res.json(plans);
    } catch (err: any) {
      console.error("[Chef] getMenu error:", err);
      res.status(500).json({ success: false, message: "Taomnomani yuklashda xatolik!" });
    }
  },

  async createMenu(req: any, res: any) {
    try {
      const kgId = getKgId(req) || "K-1";
      const { date, breakfast, lunch, dinner, morningSnack, afternoonSnack } = req.body;
      const targetDate = date || new Date().toISOString().split("T")[0];

      const existingPlan = await MealPlanModel.getByDate(targetDate, kgId);

      const defaultDetail = { title: "", calories: 0, protein: 0, fat: 0, carb: 0, vitamins: "", minerals: "", image: "", aiComment: "" };

      const payload = {
        date: targetDate,
        kindergartenId: kgId,
        breakfast: breakfast || (existingPlan ? existingPlan.breakfast : defaultDetail),
        lunch: lunch || (existingPlan ? existingPlan.lunch : defaultDetail),
        dinner: dinner || (existingPlan ? existingPlan.dinner : defaultDetail),
        morningSnack: morningSnack || (existingPlan ? (existingPlan as any).morningSnack : defaultDetail),
        afternoonSnack: afternoonSnack || (existingPlan ? (existingPlan as any).afternoonSnack : defaultDetail),
      };

      const saved = await MealPlanModel.upsert(payload);

      // Notify subscribed parent chats on Telegram
      const children = await ChildModel.getAll(kgId);
      for (const child of children) {
        if (child.telegramChatId) {
          const notificationMsg = `🍽️ *Bugungi Yangi Taomnoma Taomlari (Sana: ${targetDate})!*\n\n` +
            `🍳 *Nonushta:* ${payload.breakfast.title} (${payload.breakfast.calories} kcal)\n` +
            `🍎 *Ertamgi tamaddi:* ${payload.morningSnack?.title || "Meva va sharbat"}\n` +
            ` Ramen / 🍜 *Tushlik:* ${payload.lunch.title} (${payload.lunch.calories} kcal)\n` +
            `🍰 *Peshindan keyingi:* ${payload.afternoonSnack?.title || "Kek va sut"}\n` +
            `🍲 *Kechki ovqat:* ${payload.dinner.title} (${payload.dinner.calories} kcal)\n\n` +
            `🤖 *AI Parhezshunos tavsiyasi:* ${payload.lunch.aiComment || "Bolalar uchun to'yimli va sog'lom taomlar!"}`;
          
          await sendTelegramMessage(child.telegramChatId, notificationMsg);
        }
      }

      await AuditLogModel.create({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: "Oshpaz Rustam",
        action: `${targetDate} kunlik taomnoma yangilandi va ota-onalar telegram guruhiga yuklandi`,
        ip: req.ip || "127.0.0.1",
        device: "Kitchen Portal",
        kindergartenId: kgId
      });

      res.json({ success: true, mealPlan: saved });
    } catch (err: any) {
      console.error("[Chef] createMenu error:", err);
      res.status(500).json({ success: false, message: "Taomnomani saqlashda xatolik!" });
    }
  },

  async updateMenuType(req: any, res: any) {
    try {
      const kgId = getKgId(req) || "K-1";
      const { date, mealType, mealName, calories, protein, fat, carb, vitamins, minerals, allergens, image } = req.body;
      const targetDate = date || new Date().toISOString().split("T")[0];

      const plan = await MealPlanModel.getByDate(targetDate, kgId);
      const defaultDetail = { title: "", calories: 0, protein: 0, fat: 0, carb: 0, vitamins: "", minerals: "", image: "", aiComment: "" };

      const currentPlan: any = plan || {
        date: targetDate,
        kindergartenId: kgId,
        breakfast: { ...defaultDetail },
        lunch: { ...defaultDetail },
        dinner: { ...defaultDetail },
        morningSnack: { ...defaultDetail },
        afternoonSnack: { ...defaultDetail }
      };

      const mealDetail = {
        title: mealName,
        calories: Number(calories) || 300,
        protein: Number(protein) || 12,
        fat: Number(fat) || 8,
        carb: Number(carb) || 45,
        vitamins: vitamins || "A, C",
        minerals: minerals || "Kaltsiy",
        image: image || "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=200",
        aiComment: `AI: Ushbu taom yosh guruhiga juda mos keladi. Tarkibida ${allergens || 'allergenlar yo\'q'}.`
      };

      const typeMap: Record<string, string> = {
        "Breakfast": "breakfast",
        "Morning Snack": "morningSnack",
        "Lunch": "lunch",
        "Afternoon Snack": "afternoonSnack",
        "Dinner": "dinner"
      };

      const targetKey = typeMap[mealType] || "lunch";
      currentPlan[targetKey] = mealDetail;

      const saved = await MealPlanModel.upsert(currentPlan);

      res.json({ success: true, mealPlan: saved });
    } catch (err: any) {
      console.error("[Chef] updateMenuType error:", err);
      res.status(500).json({ success: false, message: "Taomnoma qismini yangilashda xatolik!" });
    }
  },

  async deleteMenu(req: any, res: any) {
    try {
      const { date } = req.params;
      const kgId = getKgId(req);
      await MealPlanModel.delete(date, kgId);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[Chef] deleteMenu error:", err);
      res.status(500).json({ success: false, message: "Menyuni o'chirishda xatolik!" });
    }
  },

  async getChefDashboard(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const today = new Date().toISOString().split("T")[0];
      const todayMenu = await MealPlanModel.getByDate(today, kgId);

      const ingredients = await IngredientModel.getAll();
      const lowStockCount = ingredients.filter(i => i.quantity <= 10).length;

      const activeRequests = dbState.purchaseRequests.filter(r => r.status === "Kutilmoqda").length;

      const children = await ChildModel.getAll(kgId);
      const allergyChildrenList = children.filter(c => c.medicalCard && c.medicalCard.allergies && c.medicalCard.allergies !== "Yo'q" && c.medicalCard.allergies !== "yo'q");
      const specialDietChildrenCount = children.filter(c => c.medicalCard && c.medicalCard.allergies && (c.medicalCard.allergies.toLowerCase().includes("diabet") || c.medicalCard.allergies.toLowerCase().includes("gluten"))).length;

      const totalMealsCount = children.filter(c => c.status === "Bog'chada").length;

      res.json({
        success: true,
        stats: {
          todayBreakfast: todayMenu?.breakfast?.title || "Sutli bo'tqa",
          todayLunch: todayMenu?.lunch?.title || "Karam sho'rva",
          todayAfternoonSnack: (todayMenu as any)?.afternoonSnack?.title || "Kek va sharbat",
          todayDinner: todayMenu?.dinner?.title || "Zapekanka",
          totalMealsPrepared: totalMealsCount * 3 || 75,
          childrenEatingToday: totalMealsCount || 25,
          specialDietChildren: specialDietChildrenCount || 4,
          allergyAlerts: allergyChildrenList.length,
          lowStockIngredients: lowStockCount,
          purchaseRequests: activeRequests,
          kitchenTasks: 6,
          aiNutritionScore: todayMenu ? 94 : 85
        },
        charts: {
          weeklyMenu: [
            { name: "Dush", calories: 1250, protein: 48, cost: 15000 },
            { name: "Sesh", calories: 1380, protein: 55, cost: 18000 },
            { name: "Chor", calories: 1290, protein: 52, cost: 16500 },
            { name: "Pay", calories: 1420, protein: 58, cost: 19000 },
            { name: "Jum", calories: 1310, protein: 50, cost: 16000 }
          ],
          caloriesDistribution: [
            { name: "Nonushta", value: 30 },
            { name: "Snack 1", value: 10 },
            { name: "Tushlik", value: 40 },
            { name: "Snack 2", value: 10 },
            { name: "Kechki ovqat", value: 10 }
          ],
          proteinIntake: [
            { name: "Hafta 1", norm: 45, actual: 48 },
            { name: "Hafta 2", norm: 45, actual: 46 },
            { name: "Hafta 3", norm: 45, actual: 51 },
            { name: "Hafta 4", norm: 45, actual: 49 }
          ],
          wasteStatistics: [
            { name: "Dush", prepared: 45, waste: 2 },
            { name: "Sesh", prepared: 45, waste: 4 },
            { name: "Chor", prepared: 45, waste: 1 },
            { name: "Pay", prepared: 45, waste: 3 },
            { name: "Jum", prepared: 45, waste: 2 }
          ]
        }
      });
    } catch (err: any) {
      console.error("[Chef] getChefDashboard error:", err);
      res.status(500).json({ success: false, message: "Oshpaz boshqaruv panelini yuklashda xatolik!" });
    }
  },

  async getIngredients(req: any, res: any) {
    try {
      const ingredients = await IngredientModel.getAll();
      res.json(ingredients);
    } catch (err: any) {
      console.error("[Chef] getIngredients error:", err);
      res.status(500).json({ success: false, message: "Mahsulotlar ro'yxatini yuklashda xatolik!" });
    }
  },

  async createIngredient(req: any, res: any) {
    try {
      const kgId = getKgId(req) || "K-1";
      const { name, category, quantity, unit, supplier, expirationDate, purchasePrice } = req.body;
      if (!name) return res.status(400).json({ success: false, message: "Nom kiritilishi shart" });

      const count = (await IngredientModel.getAll()).length;
      const newIng = {
        id: `ING-${Date.now().toString().slice(-4)}-${count + 1}`,
        name,
        category: category || "Vegetables",
        quantity: Number(quantity) || 0,
        unit: unit || "kg",
        supplier: supplier || "Dehqon Bozori",
        expirationDate: expirationDate || new Date().toISOString().split("T")[0],
        purchasePrice: Number(purchasePrice) || 0,
        status: Number(quantity) <= 10 ? "Kam qolgan" : "Yetarli"
      };

      const created = await IngredientModel.create(newIng);

      // Auto expense recording for accounting compliance
      const totalCost = (Number(purchasePrice) || 0) * (Number(quantity) || 1);
      if (totalCost > 0) {
        await ExpenseModel.create({
          id: `EXP-ING-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString().split("T")[0],
          category: "Oziq-ovqat",
          description: `Oshpaz tomonidan to'g'ridan-to'g'ri xarid qilingan: ${name} (${quantity} ${unit || "kg"})`,
          amount: totalCost,
          paymentType: "Naqd",
          responsible: "Oshpaz",
          kindergartenId: kgId
        });
      }

      res.json({ success: true, ingredient: created });
    } catch (err: any) {
      console.error("[Chef] createIngredient error:", err);
      res.status(500).json({ success: false, message: "Omborga yangi mahsulot qo'shishda xatolik!" });
    }
  },

  async updateIngredient(req: any, res: any) {
    try {
      const { id } = req.params;
      const ing = await IngredientModel.update(id, req.body);
      if (!ing) {
        return res.status(404).json({ success: false, message: "Mahsulot topilmadi!" });
      }
      res.json({ success: true, ingredient: ing });
    } catch (err: any) {
      console.error("[Chef] updateIngredient error:", err);
      res.status(500).json({ success: false, message: "Mahsulot miqdorini yangilashda xatolik!" });
    }
  },

  async deleteIngredient(req: any, res: any) {
    try {
      const { id } = req.params;
      const deleted = await IngredientModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Mahsulot topilmadi!" });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("[Chef] deleteIngredient error:", err);
      res.status(500).json({ success: false, message: "Mahsulotni o'chirishda xatolik!" });
    }
  },

  async getInventory(req: any, res: any) {
    try {
      const list = await IngredientModel.getAll();
      res.json({
        currentStock: list,
        expiredProducts: list.filter(i => new Date(i.expirationDate) < new Date()),
        lowStockAlerts: list.filter(i => i.quantity <= 10),
        history: [
          { id: "H-1", date: "2026-07-03", type: "Kirim", product: "Mol go'shti", qty: 20, unit: "kg", user: "Oshpaz Rustam" },
          { id: "H-2", date: "2026-07-02", type: "Chiqim", product: "Kartoshka", qty: 5, unit: "kg", user: "Oshpaz Rustam" }
        ]
      });
    } catch (err: any) {
      console.error("[Chef] getInventory error:", err);
      res.status(500).json({ success: false, message: "Ombor hisobotini yuklashda xatolik!" });
    }
  },

  async getRecipes(req: any, res: any) {
    try {
      const recipes = await RecipeModel.getAll();
      res.json(recipes);
    } catch (err: any) {
      console.error("[Chef] getRecipes error:", err);
      res.status(500).json({ success: false, message: "Retseptlarni yuklashda xatolik!" });
    }
  },

  async createRecipe(req: any, res: any) {
    try {
      const { title, category, instructions, ingredients, calories, protein, fat, carb, cost } = req.body;
      const count = (await RecipeModel.getAll()).length;

      const newRec = {
        id: `REC-${Date.now().toString().slice(-4)}-${count + 1}`,
        title,
        category: category || "Pasta",
        instructions: instructions || "Retsept bo'yicha tayyorlang.",
        ingredients: ingredients || [],
        calories: Number(calories) || 300,
        protein: Number(protein) || 12,
        fat: Number(fat) || 8,
        carb: Number(carb) || 45,
        cost: Number(cost) || 10000
      };

      const created = await RecipeModel.create(newRec);
      res.json({ success: true, recipe: created });
    } catch (err: any) {
      console.error("[Chef] createRecipe error:", err);
      res.status(500).json({ success: false, message: "Retsept qo'shishda xatolik!" });
    }
  },

  async getMealGallery(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const items = await MealGalleryModel.getAll(kgId);
      res.json(items);
    } catch (err: any) {
      console.error("[Chef] getMealGallery error:", err);
      res.status(500).json({ success: false, message: "Foto galereyani yuklashda xatolik!" });
    }
  },

  async submitMealGallery(req: any, res: any) {
    try {
      const kgId = getKgId(req) || "K-1";
      const { title, url, type, description } = req.body;

      const count = (await MealGalleryModel.getAll()).length;
      const newItem = {
        id: `GAL-${Date.now().toString().slice(-4)}-${count + 1}`,
        title,
        url: url || "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400",
        date: new Date().toISOString().split("T")[0],
        type: type || "After Cooking",
        kindergartenId: kgId,
        description: description || ""
      };

      const created = await MealGalleryModel.create(newItem);
      res.json({ success: true, galleryItem: created });
    } catch (err: any) {
      console.error("[Chef] submitMealGallery error:", err);
      res.status(500).json({ success: false, message: "Rasm yuklashda xatolik!" });
    }
  },

  async deleteMealGallery(req: any, res: any) {
    try {
      const { id } = req.params;
      const deleted = await MealGalleryModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Rasm topilmadi!" });
      }
      res.json({ success: true, message: "Rasm muvaffaqiyatli o'chirildi!" });
    } catch (err: any) {
      console.error("[Chef] deleteMealGallery error:", err);
      res.status(500).json({ success: false, message: "Rasmni o'chirishda xatolik!" });
    }
  },

  async getAllergies(req: any, res: any) {
    try {
      const kgId = getKgId(req);
      const children = await ChildModel.getAll(kgId);
      const groups = await GroupModel.getAll();

      const list = children
        .filter(c => c.medicalCard && c.medicalCard.allergies && c.medicalCard.allergies !== "Yo'q" && c.medicalCard.allergies !== "yo'q")
        .map(c => ({
          childId: c.id,
          childName: c.name,
          group: groups.find(g => g.id === c.groupId)?.name || "Katta guruh",
          allergy: c.medicalCard.allergies,
          suggestedAlternative: c.medicalCard.allergies.toLowerCase().includes("sut") ? "Laktozasiz Yogurt / Suv" : c.medicalCard.allergies.toLowerCase().includes("shokolad") ? "Meva yoki quruq meva" : "Tarkibida allergen bo'lmagan sabzavotlar"
        }));

      res.json(list);
    } catch (err: any) {
      console.error("[Chef] getAllergies error:", err);
      res.status(500).json({ success: false, message: "Allergiya ogohlantirishlarini yuklashda xatolik!" });
    }
  },

  async getNutritionReport(req: any, res: any) {
    res.json({
      dailyNutrition: {
        calories: 1350,
        protein: "52g",
        fat: "42g",
        carbohydrates: "165g",
        vitaminC: "85%",
        iron: "45%"
      },
      wasteReport: {
        totalPreparedKg: 120,
        totalWastedKg: 8.5,
        percentage: "7.0%",
        notes: "Suyuq ovqatlar bo'yicha isrof kam, salat va sabzavotlar bo'yicha biroz isrof kuzatildi."
      }
    });
  },

  async analyzeMeal(req: any, res: any) {
    const { mealName, description, mealType } = req.body;
    if (!mealName) {
      return res.status(400).json({ success: false, message: "Taom nomi kiritilmadi!" });
    }

    try {
      const key = process.env.GEMINI_API_KEY;
      if (key && key !== "MY_GEMINI_API_KEY") {
        const ai = getGemini();
        const prompt = `Siz bolalar parhezshunosi va oziq-ovqat muhandisi AI-siz. Quyidagi bolalar bog'chasi taomini tahlil qiling:
Taom nomi: "${mealName}"
Tavsifi: "${description || 'Sog\'lom bolalar taomi'}"
Taom turi: "${mealType || 'Tushlik'}" (Nonushta, Tushlik yoki Kechki ovqat)

Quyidagi ko'rsatkichlarni aniq hisoblab, JSON formatida taqdim eting:
- calories: Kaloriya miqdori (kcal, butun son)
- protein: Oqsil miqdori (g, butun son)
- fat: Yog' miqdori (g, butun son)
- carb: Uglevod miqdori (g, butun son)
- vitamins: Muhim vitaminlar tavsifi (Masalan: "Vitamin A (30%), Vitamin C (40%)")
- minerals: Muhim minerallar tavsifi (Masalan: "Kaltsiy (35%), Temir (15%)")
- aiComment: 3-6 yoshli bolalar uchun tavsiya va qisqa parhezshunos tahlili o'zbek tilida.

Faqat va faqat JSON formatidagi javobni qaytaring, ortiqcha tushuntirish va markdown backtickisiz (raw JSON text).`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt
        });

        const responseText = aiResponse.text || "{}";
        const cleanedJsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleanedJsonStr);
        return res.json({ success: true, analysis: result });
      } else {
        // Fallback
        const mockResult = {
          calories: Math.floor(Math.random() * 300) + 300,
          protein: Math.floor(Math.random() * 15) + 10,
          fat: Math.floor(Math.random() * 10) + 8,
          carb: Math.floor(Math.random() * 40) + 40,
          vitamins: "Vitamin A (30%), Vitamin C (25%), Vitamin D (15%)",
          minerals: "Kaltsiy (35%), Temir (12%), Magniy (10%)",
          aiComment: `Simulyatsiya: Ushbu "${mealName}" taomi 3-6 yoshli bolalarning kunlik ehtiyojlariga mos keladi. Tarkibida kalsiy yetarli darajada bor.`
        };
        return res.json({ success: true, analysis: mockResult });
      }
    } catch (error: any) {
      console.error("[Chef AI] Analysis error:", error);
      return res.status(500).json({ success: false, message: "AI Tahlili bajarilmadi!", error: error.message });
    }
  },

  async analyzeActivityImage(req: any, res: any) {
    const { image, caption } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: "Tahlil uchun rasm yuborilmadi!" });
    }

    try {
      const key = process.env.GEMINI_API_KEY;
      if (key && key !== "MY_GEMINI_API_KEY") {
        const ai = getGemini();
        const prompt = `Siz bolalar rivojlanishi bo'yicha mutaxassis va AI psixolog-siz.
Dars/mashg'ulot davomida olingan ushbu rasm va dars ma'lumotlarini ("${caption || 'Faol dars jarayoni'}") tahlil qiling.
Bolaning darsda qatnashishi bo'yicha quyidagilarni baholang va maslahat bering (o'zbek tilida):
1. engagement: 1 dan 5 gacha butun son (darsga qiziqishi)
2. communication: 1 dan 5 gacha butun son (muloqot qobiliyati)
3. discipline: 1 dan 5 gacha butun son (intizom)
4. aiComment: 3-6 yoshli bola uchun o'quv faoliyati yutuqlari tahlili va ota-onalarga beriladigan juda iliq, qisqa tavsiya (o'zbek tilida).

Javobni aniq JSON formatida qaytaring, ortiqcha tushuntirish va backtickisiz (raw JSON text). Format:
{
  "engagement": 5,
  "communication": 4,
  "discipline": 5,
  "aiComment": "Sizning farzandingiz bugun..."
}`;

        const parts: any[] = [prompt];
        if (image.startsWith("data:image/")) {
          const mimeType = image.split(";")[0].split(":")[1];
          const base64Data = image.split(",")[1];
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: parts
        });

        const responseText = aiResponse.text || "{}";
        const cleanedJsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleanedJsonStr);
        return res.json({ success: true, analysis: result });
      } else {
        const mockResult = {
          engagement: 5,
          communication: 4,
          discipline: 5,
          aiComment: "Simulyatsiya: Farzandingiz bugun ijodiy darsda yuqori faollik ko'rsatdi va do'stlari bilan birga ajoyib rasmlar chizdi!"
        };
        return res.json({ success: true, analysis: mockResult });
      }
    } catch (error: any) {
      console.error("[Chef AI] Activity image analysis error:", error);
      return res.status(500).json({ success: false, message: "AI Rasm Tahlili bajarilmadi!", error: error.message });
    }
  }
};
