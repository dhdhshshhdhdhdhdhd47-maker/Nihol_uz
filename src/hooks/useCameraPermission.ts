import { useState, useEffect } from "react";

export function useCameraPermission() {
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions || !navigator.permissions.query) {
      setPermission("prompt");
      return;
    }

    navigator.permissions.query({ name: "camera" as any })
      .then((status) => {
        setPermission(status.state as any);
        status.onchange = () => {
          setPermission(status.state as any);
        };
      })
      .catch((err) => {
        console.warn("navigator.permissions.query failed, falling back", err);
        setPermission("prompt");
      });
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    setChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermission("granted");
      setChecking(false);
      return true;
    } catch (err) {
      console.warn("Camera permission request failed:", err);
      setPermission("denied");
      setChecking(false);
      return false;
    }
  };

  return { permission, requestPermission, checking, setPermission };
}
