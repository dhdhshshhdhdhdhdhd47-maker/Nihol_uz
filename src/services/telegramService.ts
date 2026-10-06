/**
 * Centralized Service for handling Telegram Bot API Requests and status tracking.
 * Configured with token: 8723475488:AAGaZilNNb2jZll-l7zd6zMSuVF3vGi3U7E
 */

export interface TelegramBotStatus {
  success: boolean;
  status: "online" | "offline";
  uptime: string;
  latency: number | null;
  error: string | null;
  mode: string;
}

export interface TelegramApiLog {
  id: string;
  direction: "INCOMING" | "OUTGOING";
  method: string;
  statusCode: number;
  payload: string;
  timestamp: string;
}

const TELEGRAM_TOKEN = "8723475488:AAGaZilNNb2jZll-l7zd6zMSuVF3vGi3U7E";

class TelegramService {
  private token: string = TELEGRAM_TOKEN;

  public getToken(): string {
    return this.token;
  }

  /**
   * Fetch current bot health status and connection details
   */
  async getBotStatus(): Promise<TelegramBotStatus> {
    try {
      const res = await fetch("/api/telegram-simulator/status");
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        status: "offline",
        uptime: "92.4%",
        latency: null,
        error: err.message || "Centralized Connection failed",
        mode: "Simulator mode (Fallback)"
      };
    }
  }

  /**
   * Toggle the simulated error status on the backend
   */
  async toggleSimulatedError(): Promise<{ success: boolean; simulatedError: boolean }> {
    try {
      const res = await fetch("/api/telegram-simulator/toggle-error", {
        method: "POST"
      });
      return await res.json();
    } catch (err) {
      console.error("Error toggling simulated error:", err);
      return { success: false, simulatedError: false };
    }
  }

  /**
   * Send a client-side message simulation to the backend bot
   */
  async sendSimulatorMessage(chatId: string, text: string, senderName: string): Promise<{ chatId: string; replyText: string; replyMarkup?: any }> {
    try {
      const res = await fetch("/api/telegram-simulator/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, text, senderName })
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      console.error("Error sending simulator message:", err);
      throw err;
    }
  }

  /**
   * Fetch simplified, filtered API logs
   */
  async getApiLogs(): Promise<TelegramApiLog[]> {
    try {
      const res = await fetch("/api/telegram-simulator/logs");
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const logs = await res.json();
      // Keep only essential structured fields to simplify logs
      return logs.map((log: any) => ({
        id: log.id || String(Math.random()),
        direction: log.direction || "OUTGOING",
        method: log.method || "unknown",
        statusCode: log.statusCode || 200,
        payload: typeof log.payload === "string" ? log.payload : JSON.stringify(log.payload || {}),
        timestamp: log.timestamp || new Date().toISOString()
      }));
    } catch (err) {
      console.error("Error fetching telegram api logs:", err);
      return [];
    }
  }

  /**
   * Clear pending SMS notifications
   */
  async clearPendingSms(): Promise<boolean> {
    try {
      const res = await fetch("/api/telegram-simulator/pending-sms/clear", { method: "POST" });
      return res.ok;
    } catch (err) {
      console.error("Error clearing pending SMS:", err);
      return false;
    }
  }

  /**
   * Poll for simulated SMS notifications
   */
  async getPendingSms(): Promise<any[]> {
    try {
      const res = await fetch("/api/telegram-simulator/pending-sms");
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Error fetching pending SMS:", err);
    }
    return [];
  }

  /**
   * Poll for simulated incoming Telegram messages
   */
  async getPendingMessages(chatId: string): Promise<any[]> {
    try {
      const res = await fetch(`/api/telegram-simulator/pending-messages?chatId=${chatId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Error fetching pending messages:", err);
    }
    return [];
  }
}

export const telegramService = new TelegramService();
export default telegramService;
