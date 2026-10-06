import React, { useEffect, useState, useRef } from "react";
import { User } from "../types";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export function useTelegramWebApp(onAutoLogin: (user: User) => void) {
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>("");
  const [themeParams, setThemeParams] = useState<any>(null);

  // Use a ref to store the latest callback to prevent infinite re-rendering loops
  const onAutoLoginRef = React.useRef(onAutoLogin);
  React.useEffect(() => {
    onAutoLoginRef.current = onAutoLogin;
  }, [onAutoLogin]);

  useEffect(() => {
    // Check if running inside Telegram WebApp
    const webApp = (window as any).Telegram?.WebApp;
    
    if (webApp && webApp.initData) {
      setIsTelegramWebApp(true);
      setInitData(webApp.initData);
      setThemeParams(webApp.themeParams);
      
      const user = webApp.initDataUnsafe?.user as TelegramUser;
      if (user) {
        setTgUser(user);
        console.log("Telegram user identified:", user);
        
        // Attempt automatic session retrieval/login based on Telegram Chat ID
        fetch("/api/telegram-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: String(user.id) }),
        })
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error("No linked account found.");
          })
          .then((data) => {
            if (data.success && data.user) {
              console.log("Telegram WebApp: Auto-logged in successfully as", data.user.name);
              if (data.token) {
                localStorage.setItem("authToken", data.token);
              }
              onAutoLoginRef.current(data.user);
            }
          })
          .catch((err) => {
            console.log("Telegram WebApp Auto-login skipped:", err.message);
          });
      }

      // Configure Mini App display mode and themes
      try {
        webApp.expand();
        webApp.ready();
        
        // Match Telegram Theme with Slate-950 and Emerald-500 accents
        if (webApp.setHeaderColor) {
          webApp.setHeaderColor("#020617"); // Slate-950
        }
        if (webApp.setBackgroundColor) {
          webApp.setBackgroundColor("#020617");
        }
      } catch (err) {
        console.warn("Error setting Telegram WebApp theme/view properties:", err);
      }
    }
  }, []); // Run strictly once on mount to prevent infinite fetch loop

  return {
    isTelegramWebApp,
    tgUser,
    initData,
    themeParams,
  };
}
