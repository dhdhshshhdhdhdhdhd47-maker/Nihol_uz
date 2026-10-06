import React, { useState, useEffect } from "react";
import {
  Camera,
  ShieldCheck,
  HelpCircle,
  Activity,
  Key,
  CheckCircle,
  Wifi,
  Users,
  CreditCard,
  Fingerprint,
  QrCode,
  Thermometer,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Server,
  Zap,
  Volume2,
  Lock,
  Unlock,
  RefreshCw,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Child } from "../types";

// Audio Feedback utility (Web Audio API beep sound)
const playBeepSound = (type: "success" | "error" | "warning") => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === "success") {
      // High-pitched hardware double beep: "bip-bip!"
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.setValueAtTime(1250, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === "error") {
      // Low-pitched warning/error buzz: "buzz"
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "warning") {
      // Short warning alert
      osc.type = "triangle";
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (e) {
    console.warn("Audio Context beep error:", e);
  }
};

interface HistoricalLog {
  id: string;
  childName: string;
  timestamp: string;
  method: "Face ID" | "QR Code" | "RFID Card" | "Barmoq izi";
  direction: "KIRISH" | "CHIQISH";
  snapshot?: string;
}

interface CctvFeedProps {
  cameraId: string;
  cameraName: string;
  alert: string | null;
  childrenList: any[];
  resolution: string;
  fps: string;
}

function CctvFeed({ cameraId, cameraName, alert, childrenList, resolution, fps }: CctvFeedProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [localTime, setLocalTime] = useState("");

  // Simulated actors in the camera view
  const actorsRef = React.useRef<any[]>([]);

  // Initialize simulated actors once we have childrenList
  useEffect(() => {
    const defaultNames = ["Alisher", "Madina", "Jasur", "Zarina", "Malika", "Temur"];
    const names = childrenList.length > 0 
      ? childrenList.map(c => c.name) 
      : defaultNames;

    const list: any[] = [];
    const count = cameraId === "CAM-01" ? 4 : 3;

    for (let i = 0; i < count; i++) {
      const name = names[i % names.length];
      const id = childrenList[i % childrenList.length]?.id || `B-10${i+1}`;
      list.push({
        id,
        name,
        x: 40 + Math.random() * 180,
        y: 40 + Math.random() * 100,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        role: i === 0 && cameraId === "CAM-02" ? "Tarbiyachi" : "Bola",
        state: "normal",
        pulse: 0
      });
    }
    actorsRef.current = list;
  }, [childrenList, cameraId]);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLocalTime(now.toLocaleTimeString("uz-UZ") + "." + String(now.getMilliseconds()).slice(0, 2));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Toggle Webcam
  const toggleWebcam = async () => {
    if (webcamActive) {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        setWebcamStream(null);
      }
      setWebcamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 180 } });
        setWebcamStream(stream);
        setWebcamActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 150);
      } catch (err) {
        console.warn("CCTV Webcam error:", err);
        window.alert("Kameraga ulanib bo'lmadi yoki ruxsat berilmadi.");
      }
    }
  };

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  // Canvas Drawing and Physics Loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let scanLineY = 0;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Clear background if not using webcam
      if (!webcamActive) {
        // High-tech deep dark blueprint background
        ctx.fillStyle = "#020617"; // slate-950
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = "rgba(30, 41, 59, 0.5)"; // slate-800
        ctx.lineWidth = 1;
        const gridGap = 20;
        for (let x = 0; x < w; x += gridGap) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridGap) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      } else {
        // Clear canvas with transparent so video stream underneath shows through
        ctx.clearRect(0, 0, w, h);
      }

      // 2. Physics & State updates for actors
      const actors = actorsRef.current;
      actors.forEach((actor, idx) => {
        // Update state based on active alerts
        if (alert) {
          const upperAlert = alert.toUpperCase();
          if (upperAlert.includes("YIQILISH") && idx === 1 && cameraId === "CAM-01") {
            actor.state = "fallen";
          } else if (upperAlert.includes("JANJAL") && (idx === 0 || idx === 1) && cameraId === "CAM-01") {
            actor.state = "fighting";
          } else if (upperAlert.includes("YIG'I") && idx === 1 && cameraId === "CAM-02") {
            actor.state = "crying";
          } else {
            actor.state = "normal";
          }
        } else {
          actor.state = "normal";
        }

        // Apply physics
        if (actor.state === "fallen") {
          // Stay down
          actor.vx = 0;
          actor.vy = 0;
        } else if (actor.state === "fighting") {
          // Lock together
          const targetX = w / 2 + (idx === 0 ? -15 : 15);
          const targetY = h / 2;
          actor.x += (targetX - actor.x) * 0.1;
          actor.y += (targetY - actor.y) * 0.1;
        } else {
          // Normal wandering
          actor.x += actor.vx;
          actor.y += actor.vy;

          // Boundary checks
          if (actor.x < 20 || actor.x > w - 20) actor.vx *= -1;
          if (actor.y < 20 || actor.y > h - 20) actor.vy *= -1;

          // Keep in bounds
          actor.x = Math.max(15, Math.min(w - 15, actor.x));
          actor.y = Math.max(15, Math.min(h - 15, actor.y));
        }

        // Pulse animation tracker
        actor.pulse = (actor.pulse + 0.05) % (Math.PI * 2);
      });

      // 3. Draw simulated actors (CCTV smart tags)
      actors.forEach((actor, idx) => {
        const isAlert = actor.state !== "normal";
        const color = isAlert 
          ? "#f43f5e" // rose-500
          : actor.role === "Tarbiyachi" 
            ? "#38bdf8" // sky-400
            : "#10b981"; // emerald-500

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.5;

        // Draw node dot or icon
        ctx.beginPath();
        if (actor.state === "fallen") {
          // Draw "fallen" cross shape
          ctx.arc(actor.x, actor.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(actor.x, actor.y, 10 + Math.sin(actor.pulse) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
          ctx.stroke();
        } else if (actor.state === "fighting") {
          // Shaking dot
          const shakeX = Math.sin(frameCount) * 3;
          ctx.arc(actor.x + shakeX, actor.y, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Normal smooth breathing dot
          ctx.arc(actor.x, actor.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw bounding box
        const boxSize = actor.role === "Tarbiyachi" ? 22 : 16;
        ctx.beginPath();
        ctx.rect(actor.x - boxSize / 2, actor.y - boxSize / 2, boxSize, boxSize);
        ctx.strokeStyle = isAlert ? "rgba(244, 63, 94, 0.7)" : "rgba(16, 185, 129, 0.3)";
        ctx.stroke();

        // Target corner indicators
        const offset = boxSize / 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        // Top Left corner
        ctx.beginPath();
        ctx.moveTo(actor.x - offset - 2, actor.y - offset + 2);
        ctx.lineTo(actor.x - offset - 2, actor.y - offset - 2);
        ctx.lineTo(actor.x - offset + 2, actor.y - offset - 2);
        ctx.stroke();
        // Top Right corner
        ctx.beginPath();
        ctx.moveTo(actor.x + offset + 2, actor.y - offset + 2);
        ctx.lineTo(actor.x + offset + 2, actor.y - offset - 2);
        ctx.lineTo(actor.x + offset - 2, actor.y - offset - 2);
        ctx.stroke();
        // Bottom Left corner
        ctx.beginPath();
        ctx.moveTo(actor.x - offset - 2, actor.y + offset - 2);
        ctx.lineTo(actor.x - offset - 2, actor.y + offset + 2);
        ctx.lineTo(actor.x - offset + 2, actor.y + offset + 2);
        ctx.stroke();
        // Bottom Right corner
        ctx.beginPath();
        ctx.moveTo(actor.x + offset + 2, actor.y + offset - 2);
        ctx.lineTo(actor.x + offset + 2, actor.y + offset + 2);
        ctx.lineTo(actor.x + offset - 2, actor.y + offset + 2);
        ctx.stroke();

        // Soundwaves for crying stress
        if (actor.state === "crying") {
          ctx.beginPath();
          ctx.arc(actor.x, actor.y, 10 + (frameCount % 15) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(245, 158, 11, 0.5)"; // amber
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw target tag details
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 6.5px monospace";
        const tagY = actor.y - offset - 4;
        const roleLabel = actor.role === "Tarbiyachi" ? "PREPOD" : "KID";
        const trackingText = actor.state === "fallen" ? "🚨 CRITICAL FALL!" : actor.state === "fighting" ? "🚨 JANJAL/FIGHT!" : actor.state === "crying" ? "⚠️ STRESS/CRYING!" : `${roleLabel}:${actor.id}`;
        
        ctx.fillText(trackingText, actor.x - offset, tagY);
        
        // Draw real-time label underneath
        ctx.fillStyle = color;
        ctx.font = "400 5.5px monospace";
        ctx.fillText(actor.name, actor.x - offset, actor.y + offset + 8);
      });

      // 4. CCTV Scan Line sweep
      scanLineY += 1.2;
      if (scanLineY > h) scanLineY = 0;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(w, scanLineY);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.08)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Horizontal noise bars
      if (frameCount % 60 < 3) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.03)";
        ctx.fillRect(0, Math.random() * h, w, 5);
      }

      // 5. Drawing HUD text, timestamps, overlay details
      ctx.fillStyle = "#10b981"; // green HUD text
      ctx.font = "bold 7px monospace";

      // Top bar overlays
      ctx.fillText(`● REC [LIVE]`, 10, 15);
      
      // Right side settings
      ctx.textAlign = "right";
      ctx.fillText(`${fps} | ${resolution}`, w - 10, 15);
      ctx.textAlign = "left";

      // Alarm banner overlay if active
      if (alert) {
        ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
        ctx.fillRect(0, h - 30, w, 20);

        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, h - 30, w, 20);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 7px monospace";
        ctx.fillText("⚠️ SMART EYE DETEKTORI OGOHLANTIRISHI:", 10, h - 22);

        ctx.fillStyle = "#f43f5e";
        ctx.font = "black 6.5px monospace";
        ctx.fillText(alert.slice(0, 48), 10, h - 14);
      } else {
        // Draw green status line
        ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
        ctx.fillRect(0, h - 18, w, 12);
        
        ctx.fillStyle = "#10b981";
        ctx.font = "500 6.5px monospace";
        ctx.fillText(`STATUS: KUZATUV CHIZIG'I NOMINAL | SENSORLAR: NORMAL`, 10, h - 10);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [alert, webcamActive, cameraId]);

  return (
    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 relative overflow-hidden h-36 flex flex-col justify-between group shadow-lg">
      {/* Absolute overlay elements */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur px-1.5 py-0.5 rounded border border-slate-800">
          <span className="text-[7.5px] text-slate-300 font-mono font-black uppercase tracking-wider">{cameraName}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${alert ? "bg-rose-500 animate-ping" : "bg-emerald-500 animate-pulse"}`}></span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Webcam access button */}
          <button
            type="button"
            onClick={toggleWebcam}
            title="Real Kamerani Ulash"
            className={`p-1 rounded cursor-pointer transition-all ${
              webcamActive 
                ? "bg-rose-500/20 border border-rose-500/40 text-rose-400" 
                : "bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400"
            }`}
          >
            <Camera className="w-2.5 h-2.5" />
          </button>
          
          <span className="text-[7.5px] text-slate-400 font-mono bg-slate-900/80 backdrop-blur px-1.5 py-0.5 rounded border border-slate-800 font-bold whitespace-nowrap">
            {localTime}
          </span>
        </div>
      </div>

      {/* Media container */}
      <div className="absolute inset-0 w-full h-full">
        {/* Hidden or active HTML video stream */}
        {webcamActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 filter sepia saturate-150 contrast-125 brightness-75 hue-rotate-[95deg]"
          />
        )}
        
        {/* Transparent grid / tracker lines on top of webcam, or normal blue vectors */}
        <canvas
          ref={canvasRef}
          width={320}
          height={144}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* Screen noise/overlay layer */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.3))] mix-blend-overlay"></div>
    </div>
  );
}

interface FaceIdSimulatorProps {
  childrenList: Child[];
  onScanComplete: () => void;
}

export default function FaceIdSimulator({ childrenList, onScanComplete }: FaceIdSimulatorProps) {
  const [selectedChildId, setSelectedChildId] = useState("");
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [deviceIp, setDeviceIp] = useState("192.168.1.221");
  const [password, setPassword] = useState("admin135@");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; isFever?: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEmployeesList(data);
        }
      })
      .catch((err) => console.error("Error fetching employees in FaceIdSimulator:", err));
  }, []);
  const [logs, setLogs] = useState<Array<{ time: string; text: string; type: "success" | "error" | "warning" | "danger" }>>([]);
  const [historicalLogs, setHistoricalLogs] = useState<HistoricalLog[]>([
    {
      id: "H-001",
      childName: "Kamalov Bilol",
      timestamp: "08:15:32",
      method: "Face ID",
      direction: "KIRISH",
      snapshot: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
    },
    {
      id: "H-002",
      childName: "Karimova Madina",
      timestamp: "08:18:11",
      method: "QR Code",
      direction: "KIRISH",
      snapshot: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
    },
    {
      id: "H-003",
      childName: "Rustamov Sarvar",
      timestamp: "08:22:45",
      method: "Face ID",
      direction: "KIRISH",
      snapshot: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
    },
  ]);

  const handleSimulateGateEntry = async () => {
    if (!selectedChildId || !deviceIp || !password) return;

    // Force scan method to face or qr for gate entry simulation
    const simulatedMethod = (scanMethod === "face" || scanMethod === "qr") ? scanMethod : "face";
    setScanMethod(simulatedMethod);

    setScanning(true);
    setResult(null);

    // Simulate standard scanner processing time
    await new Promise((r) => setTimeout(r, 1000));

    const matchedChild = childrenList.find((c) => c.id === selectedChildId);
    const matchedEmployee = employeesList.find((e) => e.id === selectedChildId);
    const childName = matchedChild ? matchedChild.name : (matchedEmployee ? `${matchedEmployee.name} (${matchedEmployee.role})` : "Noma'lum");

    // FEVER DETECTION BLOCK RULE
    if (temperature >= 38.0) {
      setGateState("fever_lock");
      playBeepSound("error");
      setResult({
        success: false,
        message: `XAVF: Yuqori tana harorati aniqlandi: ${temperature}°C! Xavfsizlik nuqtai nazaridan kirish taqiqlandi va aqlli darvoza bloklandi.`,
        isFever: true
      });
      addLog(`❌ [IP: ${deviceIp}] ${childName} da yuqori harorat (${temperature}°C) aniqlanib, kirish bloklandi!`, "danger");

      try {
        await fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: `FaceID Datchik .${deviceIp.split(".").pop()}`,
            action: `⚠️ TIBBIY OGOHLANTIRISH: ${childName} (${selectedChildId}) tana harorati ${temperature}°C! Darvoza bloklandi, hamshiraga push jo'natildi.`,
            moduleName: "Device Integration"
          })
        });
        onScanComplete();
      } catch (err) {
        console.error(err);
      }

      setScanning(false);
      return;
    }

    const isExit = [
      "192.168.1.226",
      "192.168.1.227",
      "192.168.1.228",
      "192.168.1.229",
      "192.168.1.230"
    ].includes(deviceIp);

    const photoToSubmit = captureSnapshot();

    try {
      const res = await fetch("/api/face-id/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceIp,
          childId: selectedChildId,
          password,
          checkoutPersonName: isExit ? checkoutPersonName : null,
          checkoutPhoto: photoToSubmit,
          imageFrame: photoToSubmit,
          temperature, // Transmit temperature reading
        }),
      });

      const data = await res.json();
      const methodLabel = simulatedMethod === "face" ? "Face ID" : "QR Code";

      if (data.success) {
        setGateState("unlocked");
        playBeepSound("success");
        setResult({ success: true, message: `${methodLabel} tasdiqlandi. Harorat: ${temperature}°C. ${data.message}` });
        addLog(`✅ [IP: ${deviceIp}] ${childName} datchikdan o'tdi (${methodLabel}, ${temperature}°C). Darvoza ochildi.`, "success");
        onScanComplete();

        // Add to historical logs
        const isEntrance = entranceDevices.some((d) => d.ip === deviceIp);
        const direction: "KIRISH" | "CHIQISH" = isEntrance ? "KIRISH" : "CHIQISH";
        const newLog: HistoricalLog = {
          id: "H-" + Math.floor(1000 + Math.random() * 9000),
          childName,
          timestamp: new Date().toLocaleTimeString("uz-UZ"),
          method: methodLabel,
          direction,
          snapshot: photoToSubmit
        };
        setHistoricalLogs((prev) => [newLog, ...prev].slice(0, 10));

        // Lock gate back automatically after 5 seconds if enabled
        if (autoLock) {
          setTimeout(() => {
            setGateState("locked");
          }, 5000);
        }
      } else {
        setResult({ success: false, message: data.message });
        playBeepSound("error");
        addLog(`❌ [IP: ${deviceIp}] Skanerlash barbod bo'ldi: ${data.message}`, "error");
      }
    } catch (err) {
      console.error(err);
      setResult({ success: false, message: "Tarmoq ulanish xatoligi." });
      playBeepSound("warning");
      addLog(`⚠️ [IP: ${deviceIp}] Qurilma ulanish xatosi (Timeout)`, "error");
    } finally {
      setScanning(false);
    }
  };

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"biometric" | "ai_vision" | "kitchen_iot" | "network">("biometric");

  // Advanced Biometric Settings
  const [scanMethod, setScanMethod] = useState<"face" | "rfid" | "qr" | "fingerprint">("face");
  const [temperature, setTemperature] = useState(36.5);
  const [gateState, setGateState] = useState<"locked" | "unlocked" | "fever_lock" | "evac_open">("locked");

  // Configurable Auto-Lock & Real Camera States
  const [autoLock, setAutoLock] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [checkoutPersonName, setCheckoutPersonName] = useState("Otasi (Dilshod Karimov)");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  // Privacy Shutter state
  const [privacyShutterActive, setPrivacyShutterActive] = useState(false);
  // Camera rotation state
  const [cameraRotation, setCameraRotation] = useState<0 | 90 | 180 | 270>(0);
  
  // Dynamic facial landmark detection simulator (instead of static dots)
  const [landmarks, setLandmarks] = useState<Array<{ name: string; x: number; y: number; locked: boolean; px: number; py: number }>>([
    { name: "L-EYE", x: 35, y: 35, locked: true, px: 35, py: 35 },
    { name: "R-EYE", x: 65, y: 35, locked: true, px: 65, py: 35 },
    { name: "NOSE", x: 50, y: 50, locked: true, px: 50, py: 50 },
    { name: "MOUTH-L", x: 40, y: 70, locked: true, px: 40, py: 70 },
    { name: "MOUTH-R", x: 60, y: 70, locked: true, px: 60, py: 70 },
    { name: "CHIN", x: 50, y: 85, locked: true, px: 50, py: 85 },
    { name: "BROW-L", x: 30, y: 25, locked: true, px: 30, py: 25 },
    { name: "BROW-R", x: 70, y: 25, locked: true, px: 70, py: 25 },
  ]);

  // Dynamic landmark drift simulation loop
  useEffect(() => {
    if (!cameraActive || privacyShutterActive) return;
    const interval = setInterval(() => {
      setLandmarks((prev) =>
        prev.map((lm) => {
          const jitterX = (Math.random() - 0.5) * 3;
          const jitterY = (Math.random() - 0.5) * 3;
          const px = Math.max(lm.x - 6, Math.min(lm.x + 6, lm.px + jitterX));
          const py = Math.max(lm.y - 6, Math.min(lm.y + 6, lm.py + jitterY));
          const isLocked = Math.random() > 0.15;
          return {
            ...lm,
            px,
            py,
            locked: isLocked,
          };
        })
      );
    }, 120);
    return () => clearInterval(interval);
  }, [cameraActive, privacyShutterActive]);

  // Network/Device Tab Sub-States
  const [networkSubTab, setNetworkSubTab] = useState<"list" | "architecture">("list");

  // Cleanup camera streams on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    if (privacyShutterActive) {
      addLog("⚠️ Privacy Shutter yopiq! Kamera ulanishi taqiqlandi.", "error");
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setStream(mediaStream);
      setCameraActive(true);
      // Give DOM half a beat to update and mount the video node
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 150);
      addLog("📷 Kamera oqimi muvaffaqiyatli ulangan.", "success");
    } catch (err) {
      console.warn("Kamera ulanishda xato yoki ruxsat berilmadi:", err);
      addLog("⚠️ Kameraga ruxsat berilmadi (Virtual simulyatsiya rejimi faol)", "warning");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setCapturedImage(null);
    addLog("📷 Kamera oqimi o'chirildi.", "warning");
  };

  const captureSnapshot = () => {
    const isExit = [
      "192.168.1.226",
      "192.168.1.227",
      "192.168.1.228",
      "192.168.1.229",
      "192.168.1.230"
    ].includes(deviceIp);

    if (videoRef.current && cameraActive) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 320;
        canvas.height = videoRef.current.videoHeight || 240;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          // Green futuristic overlay text
          ctx.font = "bold 10px monospace";
          ctx.fillStyle = "#10b981";
          ctx.fillText("AI ERP SMART EYE - CAPTURED", 10, 20);
          if (isExit) {
            ctx.fillText(`PICKUP: ${checkoutPersonName}`, 10, 35);
          }
          ctx.fillText(`TIME: ${new Date().toLocaleTimeString()}`, 10, canvas.height - 10);
          
          const dataUrl = canvas.toDataURL("image/jpeg");
          setCapturedImage(dataUrl);
          addLog(`📸 Skanerlashda kameradan haqiqiy rasm olindi! (${isExit ? 'Bola + Vasiy' : 'Bola'})`, "success");
          return dataUrl;
        }
      } catch (e) {
        console.error("Failed to capture canvas frame:", e);
      }
    }
    
    // Default placeholder photo to represent successful smart eye scan
    const defaultPhoto = isExit
      ? "https://images.unsplash.com/photo-1543269608-fa3d96937649?auto=format&fit=crop&q=80&w=400"
      : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200";
    setCapturedImage(defaultPhoto);
    addLog(`📸 Virtual kamera snapshot rasm olindi (${isExit ? 'Bola + Vasiy' : 'Bola'}).`, "success");
    return defaultPhoto;
  };

  // AI Vision camera simulation states
  const [playgroundsFeedAlert, setPlaygroundsFeedAlert] = useState<string | null>(null);
  const [classroomFeedAlert, setClassroomFeedAlert] = useState<string | null>(null);
  const [kitchenFeedAlert, setKitchenFeedAlert] = useState<string | null>(null);

  // Environmental IoT Kitchen sensors state
  const [fridgeTemp, setFridgeTemp] = useState(3.2);
  const [stoveGas, setStoveGas] = useState(0);

  const [dynamicDevices, setDynamicDevices] = useState<any[]>([]);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const res = await fetch("/api/hardware/status");
        if (res.ok) {
          const data = await res.json();
          if (data.devices && data.devices.length > 0) {
            setDynamicDevices(data.devices);
          }
        }
      } catch (err) {
        console.error("Error loading devices in simulator:", err);
      }
    };
    loadDevices();
  }, []);

  const entranceDevices = dynamicDevices.length > 0 
    ? dynamicDevices.filter((d: any) => d.type === "entrance").map((d: any) => ({ ip: d.ip, label: d.name }))
    : [
        { ip: "192.168.1.221", label: "Kirish Qurilmasi #1 (Kamalak)" },
        { ip: "192.168.1.222", label: "Kirish Qurilmasi #2 (Asosiy)" },
        { ip: "192.168.1.223", label: "Kirish Qurilmasi #3 (Yordamchi)" },
        { ip: "192.168.1.224", label: "Kirish Qurilmasi #4 (Orqa hovli)" },
        { ip: "192.168.1.225", label: "Kirish Qurilmasi #5 (Tashqi yo'lak)" },
      ];

  const exitDevices = dynamicDevices.length > 0
    ? dynamicDevices.filter((d: any) => d.type === "exit").map((d: any) => ({ ip: d.ip, label: d.name }))
    : [
        { ip: "192.168.1.226", label: "Chiqish Qurilmasi #1 (Darvoza)" },
        { ip: "192.168.1.227", label: "Chiqish Qurilmasi #2 (Orqa hovli)" },
        { ip: "192.168.1.228", label: "Chiqish Qurilmasi #3 (Xizmat yo'li)" },
        { ip: "192.168.1.229", label: "Chiqish Qurilmasi #4 (Tashqi yo'lak)" },
        { ip: "192.168.1.230", label: "Chiqish Qurilmasi #5 (Kamalak)" },
      ];

  useEffect(() => {
    if (childrenList.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenList[0].id);
    }
  }, [childrenList]);

  // Log helper
  const addLog = (text: string, type: "success" | "error" | "warning" | "danger" = "success") => {
    const time = new Date().toLocaleTimeString("uz-UZ");
    setLogs((prev) => [{ time, text, type }, ...prev]);
  };

  // Perform Gate Biometric Scan (RFID, Fingerprint, QR, Face ID)
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !deviceIp || !password) return;

    setScanning(true);
    setResult(null);

    // Simulate standard scanner processing time
    await new Promise((r) => setTimeout(r, 1000));

    const matchedChild = childrenList.find((c) => c.id === selectedChildId);
    const matchedEmployee = employeesList.find((e) => e.id === selectedChildId);
    const childName = matchedChild ? matchedChild.name : (matchedEmployee ? `${matchedEmployee.name} (${matchedEmployee.role})` : "Noma'lum");

    // 1. FEVER DETECTION BLOCK RULE
    if (temperature >= 38.0) {
      setGateState("fever_lock");
      playBeepSound("error");
      setResult({
        success: false,
        message: `XAVF: Yuqori tana harorati aniqlandi: ${temperature}°C! Xavfsizlik nuqtai nazaridan kirish taqiqlandi va aqlli darvoza bloklandi.`,
        isFever: true
      });
      addLog(`❌ [IP: ${deviceIp}] ${childName} da yuqori harorat (${temperature}°C) aniqlanib, kirish bloklandi!`, "danger");

      // Post urgent audit log to database
      try {
        await fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: `FaceID Datchik .${deviceIp.split(".").pop()}`,
            action: `⚠️ TIBBIY OGOHLANTIRISH: ${childName} (${selectedChildId}) tana harorati ${temperature}°C! Darvoza bloklandi, hamshiraga push jo'natildi.`,
            moduleName: "Device Integration"
          })
        });
        onScanComplete(); // update logs on parent dashboards
      } catch (err) {
        console.error(err);
      }

      setScanning(false);
      return;
    }

    // 2. BIOMETRIC PASS
    const isExit = [
      "192.168.1.226",
      "192.168.1.227",
      "192.168.1.228",
      "192.168.1.229",
      "192.168.1.230"
    ].includes(deviceIp);

    const photoToSubmit = captureSnapshot();

    try {
      const res = await fetch("/api/face-id/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceIp,
          childId: selectedChildId,
          password,
          checkoutPersonName: isExit ? checkoutPersonName : null,
          checkoutPhoto: photoToSubmit,
          imageFrame: photoToSubmit,
          temperature, // Transmit temperature reading
        }),
      });

      const data = await res.json();
      const methodLabel = scanMethod === "face" ? "Face ID" : scanMethod === "rfid" ? "RFID Card" : scanMethod === "qr" ? "QR Code" : "Barmoq izi";

      if (data.success) {
        setGateState("unlocked");
        playBeepSound("success");
        setResult({ success: true, message: `${methodLabel} tasdiqlandi. Harorat: ${temperature}°C. ${data.message}` });
        addLog(`✅ [IP: ${deviceIp}] ${childName} datchikdan o'tdi (${methodLabel}, ${temperature}°C). Darvoza ochildi.`, "success");
        onScanComplete();

        // Add to historical logs
        const isEntrance = entranceDevices.some((d) => d.ip === deviceIp);
        const direction: "KIRISH" | "CHIQISH" = isEntrance ? "KIRISH" : "CHIQISH";
        const newLog: HistoricalLog = {
          id: "H-" + Math.floor(1000 + Math.random() * 9000),
          childName,
          timestamp: new Date().toLocaleTimeString("uz-UZ"),
          method: methodLabel as any,
          direction,
          snapshot: photoToSubmit
        };
        setHistoricalLogs((prev) => [newLog, ...prev].slice(0, 10));

        // Lock gate back automatically after 5 seconds if enabled
        if (autoLock) {
          setTimeout(() => {
            setGateState("locked");
          }, 5000);
        }
      } else {
        setResult({ success: false, message: data.message });
        playBeepSound("error");
        addLog(`❌ [IP: ${deviceIp}] Skanerlash barbod bo'ldi: ${data.message}`, "error");
      }
    } catch (err) {
      console.error(err);
      setResult({ success: false, message: "Tarmoq ulanish xatoligi." });
      playBeepSound("warning");
      addLog(`⚠️ [IP: ${deviceIp}] Qurilma ulanish xatosi (Timeout)`, "error");
    } finally {
      setScanning(false);
    }
  };

  // TRIGGER AI VISION SECURITY INCIDENT (FALL, FIGHT, CRYING, FIRE)
  const triggerAiVisionIncident = async (incident: "fall" | "fight" | "crying" | "fire") => {
    const matchedChild = childrenList[Math.floor(Math.random() * childrenList.length)] || { id: "B-101", name: "Karimova Madina" };
    let logAction = "";
    let alertMsg = "";

    if (incident === "fall") {
      setPlaygroundsFeedAlert(`⚠️ YIQILISH DETEKSIYASI: ${matchedChild.name}`);
      alertMsg = `O'yingoh sharqiy kamerasida bolaning yiqilishi aniqlandi!`;
      logAction = `🚨 AI VISION ALARM: Playground kamerasida ${matchedChild.name} yiqilganligi datchikda aniqlandi. Birinchi yordam guruhi (Hamshira Nilufar) xabardor qilindi.`;
      setTimeout(() => setPlaygroundsFeedAlert(null), 5000);
    } else if (incident === "fight") {
      setPlaygroundsFeedAlert(`🥊 JANJAL DETEKSIYASI`);
      alertMsg = `Kutubxona dahlizida bolalarning o'zaro tajovuzkor faolligi aniqlandi!`;
      logAction = `🚨 AI VISION ALARM: Dahliz kamerasida o'zaro janjallashuv (aggressiv harakatlar) aniqlandi. Tarbiyachilarga ovozli signal berildi.`;
      setTimeout(() => setPlaygroundsFeedAlert(null), 5000);
    } else if (incident === "crying") {
      setClassroomFeedAlert(`😭 STRESS/YIG'I DETEKSIYASI: ${matchedChild.name}`);
      alertMsg = `Sinf xonasida bolaning baland ovozli yig'isi/vokal stressi aniqlandi!`;
      logAction = `🚨 AI CAMERA STRESS: 3-sonli guruh xonasida ${matchedChild.name} yig'layotganligi datchikda aniqlandi. Tarbiyachiga push eslatma jo'natildi.`;
      setTimeout(() => setClassroomFeedAlert(null), 5000);
    } else if (incident === "fire") {
      setKitchenFeedAlert(`🔥 TUTUN VA YONG'IN XAVFI!`);
      setGateState("evac_open");
      alertMsg = `FAVQULODDA XOLAT: Oshxona dahlizida qora tutun va yong'in o'chog'i aniqlandi!`;
      logAction = `🔥 EMERGENY ALARM (CRITICAL): Oshxonada yong'in/tutun datchiklari ishga tushdi! Favqulodda evakuatsiya rejimi: barcha 10 ta darvoza blokirovkadan yechildi, barcha tarbiyachi va direktorlar daxshatli signal oldi!`;
      addLog(`🚨 KRITIK ALARM: YONG'IN XAVFI! BARCHA DARVOZALAR EVAKUATSIYA UCHUN OCHILDI!`, "danger");
      setTimeout(() => setKitchenFeedAlert(null), 10000);
    }

    addLog(`🚨 AI Vision Datchigi: ${alertMsg}`, incident === "fire" ? "danger" : "warning");

    // POST to Audit Logs on server
    try {
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "AI Smart Eye",
          action: logAction,
          moduleName: "Device Integration"
        })
      });
      onScanComplete(); // refresh parent dash to sync logs
    } catch (err) {
      console.error(err);
    }
  };

  // TRIGGER ENVIRONMENTAL KITCHEN IOT EVENT
  const triggerKitchenIotIncident = async (type: "fridge" | "gas") => {
    let logAction = "";
    if (type === "fridge") {
      setFridgeTemp(12.8); // warming
      addLog(`⚠️ IoT Ogohlantirish: Oziq-ovqat ombori muzlatgich harorati ko'tarildi: 12.8°C!`, "warning");
      logAction = `⚠️ IoT OGOHLANTIRISH: Oziq-ovqat muzlatgichi harorati me'yordan oshdi (12.8°C)! Mahsulotlarning buzilish xavfi bor, Oshpaz Rustamga datchik eslatmasi ketdi.`;
    } else if (type === "gas") {
      setStoveGas(820); // gas leak
      addLog(`🚨 DANGER: Oshxonada Gaz sizib chiqishi aniqlandi: 820 ppm!`, "danger");
      logAction = `🚨 IoT KRITIK XATО: Oshxonada xavfli darajada gaz sizib chiqishi aniqlandi (820 ppm)! Avtomat gaz klapanlari berkitildi, favqulodda ventilyatsiya ishga tushirildi.`;
    }

    try {
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "Kitchen IoT Hub",
          action: logAction,
          moduleName: "Device Integration"
        })
      });
      onScanComplete();
    } catch (err) {
      console.error(err);
    }
  };

  const resetKitchenIot = () => {
    setFridgeTemp(3.2);
    setStoveGas(0);
    addLog("✅ Oshxona IoT tizimlari me'yoriy holatga qaytarildi.", "success");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[670px] overflow-hidden">
      
      {/* Module Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/15 border border-emerald-500/20 p-2 rounded-2xl text-emerald-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-xs tracking-wide">Device Integration (IoT)</h3>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              Biometriya, AI Kameralar & IoT Sensorlari
            </span>
          </div>
        </div>

        {/* Global smart gate safety status */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-full text-[9px] font-mono font-bold border border-slate-800">
          Darvoza:{" "}
          {gateState === "locked" && <span className="text-emerald-400 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Yopiq</span>}
          {gateState === "unlocked" && <span className="text-sky-400 flex items-center gap-0.5 animate-pulse"><Unlock className="w-2.5 h-2.5" /> Ochiq</span>}
          {gateState === "fever_lock" && <span className="text-rose-400 flex items-center gap-0.5 animate-bounce"><Lock className="w-2.5 h-2.5" /> FEVER BLOCK</span>}
          {gateState === "evac_open" && <span className="text-amber-400 flex items-center gap-0.5 animate-ping"><Unlock className="w-2.5 h-2.5" /> EVACUATION</span>}
        </div>
      </div>

      {/* TABS CONTROLLERS */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-850 mb-3.5 shrink-0">
        {[
          { id: "biometric", label: "Biometriya", icon: <Fingerprint className="w-3.5 h-3.5" /> },
          { id: "ai_vision", label: "AI Kameralar", icon: <Camera className="w-3.5 h-3.5" /> },
          { id: "kitchen_iot", label: "Oshxona IoT", icon: <Flame className="w-3.5 h-3.5" /> },
          { id: "network", label: "Qurilmalar", icon: <Server className="w-3.5 h-3.5" /> }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-2 rounded-xl text-[9px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === t.id
                ? "bg-slate-800 text-emerald-400 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ACTIVE TAB VIEWS */}
      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* Left Side Workspace */}
        <div className="flex flex-col gap-4 shrink-0">
          
          {/* TAB 1: BIOMETRIC SIMULATION */}
          {activeTab === "biometric" && (
            <form onSubmit={handleScan} className="space-y-4 animate-fade-in flex flex-col h-full justify-between">
              
              {/* Select Scan method */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Avtorizatsiya usuli:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "face", label: "FaceID", icon: <Camera className="w-4 h-4" /> },
                    { id: "rfid", label: "Karta", icon: <CreditCard className="w-4 h-4" /> },
                    { id: "qr", label: "QR Skaner", icon: <QrCode className="w-4 h-4" /> },
                    { id: "fingerprint", label: "Barmoq", icon: <Fingerprint className="w-4 h-4" /> }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setScanMethod(m.id as any)}
                      className={`py-2 rounded-xl border text-[9px] font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        scanMethod === m.id
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-950/60 border-slate-850 text-slate-400 hover:text-white"
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* IP address & gate */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-emerald-400 font-bold block">📥 KIRISH DARVOZALARI</span>
                  <select
                    value={deviceIp}
                    onChange={(e) => setDeviceIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-[11px] outline-none font-mono"
                  >
                    {entranceDevices.map((d) => (
                      <option key={d.ip} value={d.ip}>{d.ip} (.{d.ip.split(".").pop()})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-sky-400 font-bold block">📤 CHIQISH DARVOZALARI</span>
                  <select
                    value={deviceIp}
                    onChange={(e) => setDeviceIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-[11px] outline-none font-mono"
                  >
                    {exitDevices.map((d) => (
                      <option key={d.ip} value={d.ip}>{d.ip} (.{d.ip.split(".").pop()})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Person list dropdown & Manual entry */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Identifikatsiya qilinuvchi shaxs:</label>
                <div className="flex gap-2">
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                  >
                    <option value="">-- Ro'yxatdan tanlang --</option>
                    <optgroup label="Bolalar">
                      {childrenList.map((c) => (
                        <option key={c.id} value={c.id}>{c.id} - {c.name} ({c.status})</option>
                      ))}
                    </optgroup>
                    <optgroup label="Xodimlar">
                      {employeesList.map((e) => (
                        <option key={e.id} value={e.id}>{e.id} - {e.name} ({e.role})</option>
                      ))}
                    </optgroup>
                    <option value="B-999">Noma'lum ID (Xato testi uchun)</option>
                  </select>
                  
                  <input
                    type="text"
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    placeholder="Yoki ID yozing"
                    className="w-[120px] bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs font-mono"
                  />
                </div>
                <p className="text-[9px] text-slate-500">
                  Ushbu aqlli darvoza hovlidagi datchik bo'lib hohlagan kishi o'tishi mumkin. Baza ma'lumotlarimizda bor shaxs bo'lsa darvoza ochiladi, begona bo'lsa darvoza ochilmaydi.
                </p>
              </div>

              {/* Olib ketayotgan vasiy (Faqat chiqish darvozalari uchun) */}
              {[
                "192.168.1.226",
                "192.168.1.227",
                "192.168.1.228",
                "192.168.1.229",
                "192.168.1.230"
              ].includes(deviceIp) && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-sky-500/5 border border-sky-500/10 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">👤 Olib ketuvchi vasiy ismi:</label>
                    <span className="text-[8px] bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">CHIQISH NAZORATI</span>
                  </div>
                  <input
                    type="text"
                    value={checkoutPersonName}
                    onChange={(e) => setCheckoutPersonName(e.target.value)}
                    placeholder="Masalan: Otasi (Dilshod Karimov)"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded-xl py-2 px-3 text-white text-xs outline-none font-medium"
                    required
                  />
                  <p className="text-[8px] text-slate-500 leading-normal">
                    * Chiqish datchigi orqali bolani olib ketayotgan shaxs ismi va kameradagi "Bola + Vasiy" surati ota-onaga Telegram hamda SMS orqali yuboriladi.
                  </p>
                </div>
              )}

              {/* Smart temperature scanner slider */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                    Tana Harorati datchigi:
                  </span>
                  <span className={`text-xs font-black font-mono ${temperature >= 38 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                    {temperature}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="35.8"
                  max="39.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-900 cursor-pointer h-1 rounded-lg"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                  <span>36.0°C (Sog'lom)</span>
                  <span>37.5°C</span>
                  <span className="text-rose-500 font-bold">38.5°C (Isitma xavfi)</span>
                </div>
              </div>

              {/* DATCHIK QO'SHIMCHA SOZLAMALARI: AUTO-LOCK & LIVE WEBCAM SNAPSHOT */}
              <div className="bg-slate-950/50 border border-slate-850/80 p-3 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-sky-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-white font-bold block">Smart Auto-Lock (5s)</span>
                      <span className="text-[8.5px] text-slate-400 block">Skanerlashdan 5 soniya o'tib darvozani yopish</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoLock(!autoLock)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer ${
                      autoLock ? "bg-emerald-500" : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-slate-950 shadow-md transition-transform duration-300 transform ${
                        autoLock ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* PRIVACY SHUTTER TOGGLE */}
                <div className="flex items-center justify-between border-t border-slate-850/60 pt-2.5">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-amber-500">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-white font-bold block">Privacy Shutter (Maxfiylik pardasi)</span>
                      <span className="text-[8.5px] text-slate-400 block">Kamerani jismoniy tarmoqdan uzish</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !privacyShutterActive;
                      setPrivacyShutterActive(nextState);
                      if (nextState && cameraActive) {
                        stopCamera();
                      }
                      addLog(
                        nextState
                          ? "🔒 Maxfiylik pardasi YOPILDI. Kamera oqimi xavfsizlik uchun uzildi."
                          : "🔓 Maxfiylik pardasi OCHILDI. Kamera oqimidan foydalanish mumkin.",
                        nextState ? "warning" : "success"
                      );
                    }}
                    className={`px-3 py-1 rounded-xl text-[9px] font-mono font-black border transition-all uppercase cursor-pointer ${
                      privacyShutterActive
                        ? "bg-amber-500/25 border-amber-500/40 text-amber-300"
                        : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                    }`}
                  >
                    {privacyShutterActive ? "CLOSED" : "OPEN"}
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-850/60 pt-2.5">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-emerald-400">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-white font-bold block">Live Web-Camera Feed</span>
                      <span className="text-[8.5px] text-slate-400 block">Kamera orqali haqiqiy surat olish (MediaDevices API)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startCamera}
                    disabled={privacyShutterActive}
                    className={`px-3 py-1 rounded-xl text-[9px] font-mono font-black border transition-all uppercase cursor-pointer ${
                      privacyShutterActive
                        ? "bg-slate-900 border-slate-850 text-slate-600 cursor-not-allowed"
                        : cameraActive
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {cameraActive ? "OFF" : "ON"}
                  </button>
                </div>

                {/* Camera stream display within the form */}
                {cameraActive && !privacyShutterActive ? (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 relative h-48 flex items-center justify-center shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{
                        transform: `scaleX(-1) rotate(${cameraRotation}deg)`,
                        transition: "transform 0.3s ease"
                      }}
                    />
                    
                    {/* Camera Control Overlays (Interactive) */}
                    <div className="absolute bottom-2 right-2 flex gap-1.5 z-10 pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setCameraRotation((prev) => ((prev + 90) % 360) as any);
                          addLog(`🔄 Kamera burildi: ${((cameraRotation + 90) % 360)}°`, "success");
                        }}
                        className="bg-slate-900/95 hover:bg-slate-850 border border-slate-800 p-1.5 rounded-lg text-slate-300 hover:text-emerald-400 cursor-pointer active:scale-95 transition-all shadow"
                        title="Kamerani burish (Rotate 90°)"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  privacyShutterActive && (
                    <div className="border-2 border-dashed border-amber-500/30 rounded-xl overflow-hidden bg-slate-950/90 relative h-48 flex flex-col items-center justify-center p-4 text-center space-y-2 animate-fade-in">
                      <div className="bg-amber-500/10 text-amber-400 p-3 rounded-full border border-amber-500/20">
                        <Lock className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider">Privacy Shutter Faol</h4>
                        <p className="text-[9px] text-slate-400 mt-1 max-w-[200px] leading-relaxed mx-auto">
                          Kamera jismoniy tarmoqdan uzilgan. Live video oqimi bloklandi. Foydalanish uchun pardani oching (OPEN).
                        </p>
                      </div>
                    </div>
                  )
                )}

                {/* Snapshot display thumb if captured */}
                {capturedImage && (
                  <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex items-center gap-3">
                    <img
                      src={capturedImage}
                      alt="Snapshot"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-800 shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-[8px] text-slate-500 block font-mono uppercase tracking-widest">Olingan Skaner Surati:</span>
                      <span className="text-[9px] text-emerald-400 font-bold block">Xavfsizlik tizimiga yuborildi ✓</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <button
                type="submit"
                disabled={scanning}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {scanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    Skanerlanmoqda...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 animate-pulse" />
                    Datchikni Ishga Tushirish
                  </>
                )}
              </button>

              {/* SCAN RESULT PANEL */}
              {result && (
                <div className={`p-3 rounded-xl border text-xs flex gap-2.5 animate-fade-in ${
                  result.success
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}>
                  {result.success ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
                  <div>
                    <h5 className="font-bold mb-0.5">{result.success ? "Ruxsat etildi ✅" : "Ruxsat berilmadi ❌"}</h5>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{result.message}</p>
                    {result.success && (
                      <span className="text-[9px] text-sky-400 font-black block mt-1 animate-pulse">
                        💬 Telegram-boti orqali ota-onaga push-bildirishnoma jo'natildi!
                      </span>
                    )}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: AI VISION SECURITY CAMERAS */}
          {activeTab === "ai_vision" && (
            <div className="space-y-4 animate-fade-in">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">AI Kameralar Live & Triggers:</span>
              
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* Simulated Camera 1 */}
                <CctvFeed 
                  cameraId="CAM-01" 
                  cameraName="CAM-01 PLAYGROUND (HOVLI)" 
                  alert={playgroundsFeedAlert} 
                  childrenList={childrenList} 
                  resolution="4K" 
                  fps="30 FPS" 
                />

                {/* Simulated Camera 2 */}
                <CctvFeed 
                  cameraId="CAM-02" 
                  cameraName="CAM-02 CLASSROOM 3 (SINF)" 
                  alert={classroomFeedAlert} 
                  childrenList={childrenList} 
                  resolution="1080p" 
                  fps="24 FPS" 
                />
              </div>

              {/* AI incident trigger buttons */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">AI hodisalarni simulyatsiya qilish:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => triggerAiVisionIncident("fall")}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-rose-500 text-left p-2.5 rounded-xl text-[10px] text-slate-300 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="w-4 h-4 rounded bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center">👦</span>
                    <div>
                      <div className="font-bold text-white">Yiqilish Deteksiyasi</div>
                      <span className="text-[8px] text-slate-500 block">Nurse xabarnoma datchigi</span>
                    </div>
                  </button>

                  <button
                    onClick={() => triggerAiVisionIncident("fight")}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-rose-500 text-left p-2.5 rounded-xl text-[10px] text-slate-300 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="w-4 h-4 rounded bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center">🥊</span>
                    <div>
                      <div className="font-bold text-white">Janjallashuv (Urush)</div>
                      <span className="text-[8px] text-slate-500 block">Tarbiyachi ogohlantiruvi</span>
                    </div>
                  </button>

                  <button
                    onClick={() => triggerAiVisionIncident("crying")}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-amber-500 text-left p-2.5 rounded-xl text-[10px] text-slate-300 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">😭</span>
                    <div>
                      <div className="font-bold text-white">Yig'lash stress datchigi</div>
                      <span className="text-[8px] text-slate-500 block">Sinf shovqin monitoringi</span>
                    </div>
                  </button>

                  <button
                    onClick={() => triggerAiVisionIncident("fire")}
                    className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500 text-left p-2.5 rounded-xl text-[10px] text-rose-400 transition-all cursor-pointer flex items-center gap-2 animate-pulse"
                  >
                    <span className="w-4 h-4 rounded bg-rose-500 text-slate-950 text-xs font-bold flex items-center justify-center"><Flame className="w-3 h-3" /></span>
                    <div>
                      <div className="font-black text-rose-400 uppercase">Yong'in & Evakuatsiya!</div>
                      <span className="text-[8px] text-rose-500/80 block">Kritik xavf (Darvozalar yechiladi)</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KITCHEN FOOD SAFETY IOT */}
          {activeTab === "kitchen_iot" && (
            <div className="space-y-4 animate-fade-in">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Oshxona & Oziq-ovqat xavfsizligi datchiklari:</span>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Fridge Temperature Sensor */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Muzlatgich Temp</span>
                    <span className={`w-2 h-2 rounded-full ${fridgeTemp > 5 ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`}></span>
                  </div>
                  <div className={`text-xl font-black font-mono ${fridgeTemp > 5 ? "text-amber-400" : "text-white"}`}>
                    {fridgeTemp}°C
                  </div>
                  <span className="text-[8px] text-slate-500 block font-mono">Normal diapazon: 2.0°C - 5.0°C</span>
                </div>

                {/* Gas detector */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Gaz sizishi (PPM)</span>
                    <span className={`w-2 h-2 rounded-full ${stoveGas > 100 ? "bg-rose-500 animate-bounce" : "bg-emerald-500"}`}></span>
                  </div>
                  <div className={`text-xl font-black font-mono ${stoveGas > 100 ? "text-rose-400" : "text-white"}`}>
                    {stoveGas} ppm
                  </div>
                  <span className="text-[8px] text-slate-500 block font-mono">Normal: 0 ppm (Safe)</span>
                </div>
              </div>

              {/* IoT Incident Simulation Actions */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Datchik nosozliklarini simulyatsiya qilish:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => triggerKitchenIotIncident("fridge")}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-amber-500 text-[10px] font-bold p-2.5 rounded-xl text-slate-300 cursor-pointer text-center transition-all"
                  >
                    ❄️ Muzlatgich Isishi
                  </button>
                  <button
                    onClick={() => triggerKitchenIotIncident("gas")}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-rose-500 text-[10px] font-bold p-2.5 rounded-xl text-slate-300 cursor-pointer text-center transition-all"
                  >
                    🔥 Gaz Sizib chiqishi
                  </button>
                  <button
                    onClick={resetKitchenIot}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black p-2.5 rounded-xl cursor-pointer text-center transition-all"
                  >
                    🔄 Sensorlarni qaytarish
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEVICE LISTINGS MANAGEMENT */}
          {activeTab === "network" && (
            <div className="space-y-4 animate-fade-in flex flex-col h-full min-h-0">
              {/* Sub-tabs inside network */}
              <div className="flex gap-2 border-b border-slate-800 pb-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setNetworkSubTab("list")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    networkSubTab === "list"
                      ? "bg-slate-850 text-emerald-400 border border-slate-750"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🟢 Qurilmalar Ro'yxati
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkSubTab("architecture")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    networkSubTab === "architecture"
                      ? "bg-slate-850 text-emerald-400 border border-slate-750"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🌐 Integratsiya Arxitekturasi (Backend)
                </button>
              </div>

              {networkSubTab === "list" ? (
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Barcha integratsiyalashgan datchiklar (10 ta darvoza):</span>

                  <div className="space-y-1.5 scrollbar-thin scrollbar-thumb-slate-850">
                    {[
                      ...entranceDevices.map((d, i) => ({ ...d, type: "Kirish Skaneri", model: "Yuz-F1-AI" })),
                      ...exitDevices.map((d, i) => ({ ...d, type: "Chiqish Skaneri", model: "Yuz-E1-AI" }))
                    ].map((dev, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{dev.ip} - {dev.label}</div>
                          <span className="text-[9px] text-slate-500 font-mono">{dev.type} ({dev.model}) • SN: SN-901{idx}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">Ping: 12ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                    <h4 className="font-black text-white text-[11px] mb-1 uppercase tracking-wider text-emerald-400">
                      Qurilmalar va Backend integratsiya arxitekturasi
                    </h4>
                    <p className="text-[10px] leading-relaxed text-slate-400">
                      Professional bog'cha tizimida hech qaysi qurilma (Face terminal, RFID yoki datchiklar) to'g'ridan-to'g'ri ma'lumotlar omboriga yozmaydi. Ular xavfsiz va markazlashtirilgan API orqali ishlaydi.
                    </p>
                  </div>

                  {/* Visual Flowchart */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-2">
                    <span className="text-[8.5px] text-slate-500 font-mono font-bold uppercase block text-center">Tizim Ish Oqimi Diagrammasi (Workflow)</span>
                    
                    <div className="flex flex-col gap-1.5 text-[9px] font-mono text-center">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 py-1 rounded text-emerald-300 font-bold">
                        Qurilma (Yuz / Karta / QR)
                      </div>
                      <div className="text-slate-600">▼ (HTTPS TLS + Token)</div>
                      <div className="bg-sky-500/10 border border-sky-500/20 py-1 rounded text-sky-300 font-bold">
                        API Gateway & Auth (Bearer JWT)
                      </div>
                      <div className="text-slate-600">▼</div>
                      <div className="bg-purple-500/10 border border-purple-500/20 py-1 rounded text-purple-300 font-bold">
                        Node.js Backend & Business Logic
                      </div>
                      <div className="text-slate-600">▼</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 py-1 rounded text-indigo-300 font-bold">
                          PostgreSQL (Durable DB)
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/20 py-1 rounded text-rose-300 font-bold">
                          Redis & Socket.IO (Real-time)
                        </div>
                      </div>
                      <div className="text-slate-600">▼</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-amber-500/10 border border-amber-500/20 py-1 rounded text-amber-300 font-bold">
                          Telegram Bot (Parent Push)
                        </div>
                        <div className="bg-teal-500/10 border border-teal-500/20 py-1 rounded text-teal-300 font-bold">
                          React Dashboard Update
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Steps description */}
                  <div className="space-y-3">
                    <div className="border-l-2 border-emerald-500 pl-2.5">
                      <h5 className="font-bold text-white text-[11.5px] mb-0.5">1. Qurilma Ro'yxatdan O'tishi (Registration)</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Har bir terminal <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-300 text-[9px] font-mono">POST /api/devices/register</code> orqali ro'yxatdan o'tadi va unga maxsus <strong>API Key</strong> hamda <strong>JWT Token</strong> beriladi. Terminal so'rov yuborganda <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 text-[9px] font-mono">x-api-key</code> yoki <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 text-[9px] font-mono">Authorization: Bearer</code> sarlavhasidan foydalanadi.
                      </p>
                    </div>

                    <div className="border-l-2 border-sky-500 pl-2.5">
                      <h5 className="font-bold text-white text-[11.5px] mb-0.5">2. Face recognition & Biometric oqimi</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Terminal yuzni aniqlagach, <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-300 text-[9px] font-mono">POST /api/device/attendance</code> manziliga bola ID si va tasdiq ishonchliligini (<code className="bg-slate-950 px-1 py-0.5 rounded text-slate-300 text-[9px]">confidence: 99.8%</code>) yuboradi. Backend datchik faolligini, bolaning ruxsatini tekshiradi va ma'lumotlarni saqlab, ota-onaga Telegram bot va tarbiyachiga Socket orqali xabar yuboradi.
                      </p>
                    </div>

                    <div className="border-l-2 border-rose-500 pl-2.5">
                      <h5 className="font-bold text-white text-[11.5px] mb-0.5">3. Tibbiy va Harorat datchigi monitoringi</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Harorat skaneri bolada yuqori tana haroratini aniqlasa (masalan, <strong>38.5°C</strong> va undan yuqori), darhol darvoza ochilishi bloklanadi. Tizimda <strong>Emergency Alarm</strong> yoqilib, oshpaz, hamshira hamda bog'cha direktorining ekraniga qizil ogohlantirish datchigi hamda Telegram orqali shoshilinch bildirishnoma ketadi.
                      </p>
                    </div>

                    <div className="border-l-2 border-amber-500 pl-2.5">
                      <h5 className="font-bold text-white text-[11.5px] mb-0.5">4. Device Heartbeat va Offline rejim</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Qurilmalar har 60 soniyada o'z holatini (CPU, xotira, IP manzili va dasturiy ta'minot talqini) yuborib turadi. Internet uzilib qolgan holatda qurilmalar ma'lumotlarni o'zining ichki <strong>SQLite</strong> bazasida saqlaydi va aloqa tiklangach, backend bilan sinxronizatsiya (Sync) qiladi.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side Column containing Smart Gate Live visualizer, Historical table, and network logs */}
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3 flex flex-col gap-3 shrink-0">
          
          {/* Section 1: Live Smart Gate Animation & Trigger */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-3 shrink-0 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase font-mono">
                AQLLI DARVOZA (LIVE STATUS)
              </span>
              <span className="text-[8px] bg-slate-950 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-800">
                Gate-01
              </span>
            </div>

            {/* Simulated Video Feed / Scanning HUD & Gate Barrier */}
            <div className="h-28 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center">
              
              {/* Dynamic live temperature display overlay */}
              <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-850 px-2 py-0.5 rounded text-[8px] font-black font-mono tracking-wider flex items-center gap-1 shadow z-10">
                <Thermometer className="w-3 h-3 text-rose-400" />
                <span>HARORAT:</span>
                <span className={temperature >= 38 ? "text-rose-400 animate-pulse" : "text-emerald-400"}>
                  {temperature}°C
                </span>
              </div>
              
              {/* Cloned real-time camera stream background if camera is active */}
              {cameraActive && (
                <div className="absolute inset-0 w-full h-full opacity-40 pointer-events-none z-0">
                  <video
                    ref={(el) => {
                      if (el && stream) {
                        el.srcObject = stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                </div>
              )}

              {/* Visual 'Gate Opened' animation overlay using Framer Motion */}
              <AnimatePresence>
                {gateState === "unlocked" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-emerald-950/95 z-30 flex flex-col items-center justify-center border border-emerald-500/50 backdrop-blur-sm"
                  >
                    {/* Animated scanning lines and grid decoration */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.04)_1px,transparent_1px)] bg-[size:12px_12px]" />
                    
                    {/* Pulsing/spinning outer ring */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.08, 1], opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-400 flex items-center justify-center text-emerald-300 mb-1.5 relative z-10"
                    >
                      <Unlock className="w-5 h-5" />
                      <span className="absolute inset-0 rounded-full border border-emerald-400/55 animate-ping opacity-75"></span>
                    </motion.div>

                    <motion.span
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
                      className="text-[10px] font-black font-mono text-emerald-400 tracking-widest uppercase z-10"
                    >
                      DARVOZA OCHILDI / GATE OPENED
                    </motion.span>
                    
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ delay: 0.2 }}
                      className="text-[7.5px] font-mono text-slate-300 uppercase tracking-widest mt-0.5 text-center px-4 z-10"
                    >
                      MUVAFFAQIYATLI VERIFIKATSIYA • SUCCESSFUL SCAN
                    </motion.span>

                    {/* Decorative scanning corners */}
                    <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-emerald-400/80"></div>
                    <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-emerald-400/80"></div>
                    <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-emerald-400/80"></div>
                    <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-emerald-400/80"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scanline laser effect when scanning */}
              {scanning && (
                <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-bounce z-20"></div>
              )}

              {/* Viewfinder brackets in the corners */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-slate-800"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-slate-800"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-slate-800"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-slate-800"></div>

              {/* Left and Right swing/sliding gates */}
              <div className="absolute inset-y-0 left-0 right-0 px-8 flex justify-between items-center pointer-events-none z-10">
                
                {/* Left Gate Panel */}
                <div 
                  className={`h-16 w-14 bg-gradient-to-r from-slate-800 to-slate-700/80 border-r-2 border-sky-500 shadow-md rounded-l-md transition-all duration-700 ease-in-out origin-left ${
                    (gateState === "unlocked" || gateState === "evac_open") 
                      ? "-rotate-90 opacity-20" 
                      : "rotate-0 opacity-100"
                  }`}
                >
                  <div className="h-full flex items-center justify-start pl-2">
                    <span className="text-[8px] text-slate-400 font-mono uppercase tracking-widest -rotate-90 whitespace-nowrap select-none">SEC-L</span>
                  </div>
                </div>

                {/* Gate Center Gap / Scanner LED */}
                <div className="flex flex-col items-center justify-center space-y-1">
                  {gateState === "locked" && (
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                  {gateState === "unlocked" && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
                      <Unlock className="w-4 h-4" />
                    </div>
                  )}
                  {gateState === "fever_lock" && (
                    <div className="w-8 h-8 rounded-full bg-rose-600 border border-rose-400 flex items-center justify-center text-white animate-bounce">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}
                  {gateState === "evac_open" && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                      <Unlock className="w-4 h-4" />
                    </div>
                  )}

                  <span className={`text-[8.5px] font-mono font-black whitespace-nowrap ${
                    gateState === "locked" ? "text-rose-500" :
                    gateState === "unlocked" ? "text-emerald-400" :
                    gateState === "fever_lock" ? "text-rose-400 animate-pulse" :
                    "text-amber-400"
                  }`}>
                    {gateState === "locked" ? "DARVOZA YOPILGAN" :
                     gateState === "unlocked" ? "DARVOZA OCHIQ" :
                     gateState === "fever_lock" ? "BLOKLANGAN (ISITMA)" :
                     "FAVQULODDA OCHIQ"}
                  </span>
                </div>

                {/* Right Gate Panel */}
                <div 
                  className={`h-16 w-14 bg-gradient-to-l from-slate-800 to-slate-700/80 border-l-2 border-sky-500 shadow-md rounded-r-md transition-all duration-700 ease-in-out origin-right ${
                    (gateState === "unlocked" || gateState === "evac_open") 
                      ? "rotate-90 opacity-20" 
                      : "rotate-0 opacity-100"
                  }`}
                >
                  <div className="h-full flex items-center justify-end pr-2">
                    <span className="text-[8px] text-slate-400 font-mono uppercase tracking-widest rotate-90 whitespace-nowrap select-none">SEC-R</span>
                  </div>
                </div>

              </div>
              
              {/* Overlay LED background glow strip */}
              <div className={`absolute bottom-0 inset-x-0 h-1.5 transition-all duration-500 ${
                gateState === "locked" ? "bg-rose-500" :
                gateState === "unlocked" ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" :
                gateState === "fever_lock" ? "bg-rose-600 animate-pulse" :
                "bg-amber-500 animate-pulse"
              }`}></div>
            </div>

            {/* Simulate Gate Entry Button */}
            <button
              type="button"
              onClick={handleSimulateGateEntry}
              disabled={scanning}
              className="mt-2.5 w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-black py-2 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer shadow-lg shadow-sky-500/10 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Simulate Gate Entry (Face/QR)
            </button>
          </div>

          {/* Section 2: Historical Entries/Exits Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-3 shrink-0 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase font-mono">
                Recent Logs (So'nggi Kirish/Chiqish)
              </span>
              <span className="text-[8px] text-sky-400 font-mono font-bold bg-sky-950/40 border border-sky-900/35 px-1.5 py-0.5 rounded">
                Last 10 Logs
              </span>
            </div>

            <div className="overflow-x-auto max-h-[160px] scrollbar-thin scrollbar-thumb-slate-800">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold">
                    <th className="py-1 pb-1.5">Bola</th>
                    <th className="py-1 pb-1.5 text-center">Yo'nalish</th>
                    <th className="py-1 pb-1.5 text-center">Usul</th>
                    <th className="py-1 pb-1.5 text-right">Vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {historicalLogs.map((h) => (
                    <tr key={h.id} className="text-slate-300 hover:bg-slate-850/40 transition-colors">
                      <td className="py-1.5 font-bold flex items-center gap-2 max-w-[110px]">
                        {h.snapshot && (
                          <div className="relative group shrink-0">
                            <img
                              src={h.snapshot}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-md object-cover border border-slate-800"
                              alt="Captured"
                            />
                            {/* Expand tooltip on hover */}
                            <div className="absolute left-7 top-[-30px] hidden group-hover:flex flex-col z-50 bg-slate-900 border border-slate-700 p-1.5 rounded-xl shadow-2xl w-28 h-24">
                              <img
                                src={h.snapshot}
                                referrerPolicy="no-referrer"
                                className="w-full h-16 object-cover rounded-lg mb-1"
                                alt="Captured"
                              />
                              <span className="text-[7px] text-center text-slate-400 font-mono">AUDIT TRAIL</span>
                            </div>
                          </div>
                        )}
                        <span className="truncate">{h.childName}</span>
                      </td>
                      <td className="py-1.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          h.direction === "KIRISH" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        }`}>
                          {h.direction}
                        </span>
                      </td>
                      <td className="py-1.5 text-center text-slate-400 font-mono text-[9px]">{h.method}</td>
                      <td className="py-1.5 text-right font-mono text-slate-500 text-[9px]">{h.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Network Event Logs */}
          <div className="h-[140px] bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col shrink-0 min-h-0">
            <span className="text-[9px] text-slate-500 font-black tracking-wider uppercase mb-2 block font-mono shrink-0">
              Datchiklar Tarmoq Event jurnali
            </span>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[9px] font-mono scrollbar-thin scrollbar-thumb-slate-850">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-1 text-center py-4">
                  <Clock className="w-5 h-5 text-slate-800" />
                  <span>Aloqa barqaror.</span>
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-1.5 rounded-lg border leading-tight ${
                      log.type === "success"
                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400/90"
                        : log.type === "warning"
                        ? "bg-amber-500/5 border-amber-500/10 text-amber-400/90"
                        : log.type === "danger"
                        ? "bg-rose-500/15 border-rose-500/20 text-rose-400/90 animate-pulse"
                        : "bg-rose-500/5 border-rose-500/10 text-rose-400/90"
                    }`}
                  >
                    <span className="text-slate-500 mr-1 font-bold">[{log.time}]</span>
                    {log.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
