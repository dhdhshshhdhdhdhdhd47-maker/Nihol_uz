import { Router } from "express";
import { ChefController } from "../controllers/chefController";
import { validateKindergartenData } from "../middleware/validationMiddleware";

const router = Router();

router.get("/meals", validateKindergartenData, ChefController.getMenu);
router.post("/meals", validateKindergartenData, ChefController.createMenu);

// Menus aliases
router.get("/menus", validateKindergartenData, ChefController.getMenu);
router.post("/menus", validateKindergartenData, ChefController.updateMenuType);
router.delete("/menus/:date", validateKindergartenData, ChefController.deleteMenu);

// Chef dashboard
router.get("/chef/dashboard", validateKindergartenData, ChefController.getChefDashboard);

// Food Ingredients
router.get("/ingredients", ChefController.getIngredients);
router.post("/ingredients", ChefController.createIngredient);
router.put("/ingredients/:id", ChefController.updateIngredient);
router.delete("/ingredients/:id", ChefController.deleteIngredient);
router.get("/inventory", ChefController.getInventory);

// Cooking Recipes
router.get("/recipes", ChefController.getRecipes);
router.post("/recipes", ChefController.createRecipe);

// Dish Photo Gallery
router.get("/meal-gallery", validateKindergartenData, ChefController.getMealGallery);
router.post("/meal-gallery", validateKindergartenData, ChefController.submitMealGallery);
router.delete("/meal-gallery/:id", ChefController.deleteMealGallery);

// Allergen Alerts & Nutrition Reports
router.get("/allergies", validateKindergartenData, ChefController.getAllergies);
router.get("/reports/nutrition", ChefController.getNutritionReport);

// Gemini AI Analyzers
router.post("/meals/analyze", ChefController.analyzeMeal);
router.post("/activities/analyze-image", ChefController.analyzeActivityImage);

export default router;
