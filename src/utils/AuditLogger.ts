export class AuditLogger {
  static async log(user: string, action: string, moduleName: string, kindergartenId?: string) {
    try {
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          action,
          moduleName,
          kindergartenId,
        }),
      });
    } catch (err) {
      console.error("Centralized Audit Logger failed:", err);
    }
  }
}
