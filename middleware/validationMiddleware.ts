import { dbState, isPg, query } from "../db";

export function getKgId(req: any): string {
  const queryVal = req.query?.kindergartenId;
  if (typeof queryVal === "string" && queryVal) return queryVal;
  const bodyVal = req.body?.kindergartenId;
  if (typeof bodyVal === "string" && bodyVal) return bodyVal;
  const headerVal = req.headers?.["x-kindergarten-id"];
  if (typeof headerVal === "string" && headerVal) return headerVal;
  if (Array.isArray(headerVal) && headerVal.length > 0) return headerVal[0];
  return "K-1";
}

export async function validateKindergartenData(req: any, res: any, next: any) {
  let kgId = getKgId(req);
  
  // Gracefully default to the first available kindergarten ID if missing
  if (!kgId || typeof kgId !== "string" || kgId.trim() === "" || kgId === "all") {
    if (isPg()) {
      try {
        const result = await query("SELECT id FROM kindergartens ORDER BY id ASC LIMIT 1");
        kgId = result.rows[0]?.id || "K-1";
      } catch {
        kgId = "K-1";
      }
    } else {
      kgId = dbState.kindergartens[0]?.id || "K-1";
    }
    req.headers["x-kindergarten-id"] = kgId;
    if (req.body) {
      req.body.kindergartenId = kgId;
    }
  }

  let kgExists = false;
  if (isPg()) {
    try {
      const result = await query("SELECT 1 FROM kindergartens WHERE id = $1", [kgId]);
      kgExists = result.rows.length > 0;
    } catch {
      kgExists = false;
    }
  } else {
    kgExists = dbState.kindergartens.some(k => k.id === kgId);
  }

  if (!kgExists && kgId !== "K-1") {
    return res.status(400).json({ 
      success: false, 
      error: `Xatolik: Tizimda '${kgId}' identifikatorli bog'cha mavjud emas! Iltimos, avval ushbu bog'chani yarating.` 
    });
  }

  next();
}
