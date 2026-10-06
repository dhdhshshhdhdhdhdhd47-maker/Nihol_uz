import { useEffect, useState } from "react";
import { Attendance } from "../types";

export function useTelegramAttendance(childId?: string, onNewAttendance?: (att: Attendance) => void) {
  const [latestAttendance, setLatestAttendance] = useState<Attendance | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
          console.log("useTelegramAttendance: Real-time socket connected.");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Check for attendance updates or generic data updates
            if (data.type === "attendance_update" || data.type === "data_update") {
              const att: Attendance = data.attendance;
              
              if (att) {
                // Filter by childId if specified
                if (childId && att.childId !== childId) {
                  return;
                }

                setLatestAttendance(att);
                setAttendanceLogs((prev) => [att, ...prev.slice(0, 19)]);

                // Native Telegram WebApp integration
                const webApp = (window as any).Telegram?.WebApp;
                if (webApp) {
                  // Trigger Haptic Feedback
                  if (webApp.HapticFeedback) {
                    webApp.HapticFeedback.notificationOccurred("success");
                  }
                  
                  // Show Telegram WebApp Alert / Notification
                  if (webApp.showAlert) {
                    const time = att.checkIn || att.checkOut || "";
                    const statusText = att.status === "Keldi" ? "keldi (Check-In)" : "ketdi (Check-Out)";
                    webApp.showAlert(
                      `🔔 Davomat Yangilanishi!\n\nBola ID: ${att.childId}\nHolati: ${statusText}\nSoat: ${time}\nHarorat: ${att.temperature ? att.temperature + "°C" : "N/A"}`
                    );
                  }
                }

                if (onNewAttendance) {
                  onNewAttendance(att);
                }
              }
            }
          } catch (err) {
            console.error("useTelegramAttendance parse error:", err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        console.error("useTelegramAttendance connection error:", err);
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [childId, onNewAttendance]);

  return {
    latestAttendance,
    attendanceLogs,
    isConnected,
  };
}
