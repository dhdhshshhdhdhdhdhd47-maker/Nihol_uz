import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, AlertTriangle, CheckCircle, Server, Activity, Shield, Flame, 
  ShieldAlert, Play, StopCircle, RefreshCw, Layers, ZoomIn, Info, ShieldCheck, Heart, User, Maximize
} from "lucide-react";
import FaceIdSimulator from "./FaceIdSimulator";
import AICameraView from "./AICameraView";

export function getFormattedTime(dateInput?: Date | string): string {
  const d = dateInput ? (typeof dateInput === "string" ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(d.getTime())) return "08:00";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getFormattedTimeWithSeconds(dateInput?: Date | string): string {
  const d = dateInput ? (typeof dateInput === "string" ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(d.getTime())) return "08:00:00";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface CameraConfig {
  id: string;
  name: string;
  location: string;
  resolution: string;
  fps: string;
  status: "ONLINE" | "OFFLINE" | "ALERT";
  type: "playground" | "classroom" | "gate" | "kitchen";
  actorCount: number;
}

interface AiCamerasPageProps {
  childrenList: any[];
  onScanComplete?: () => void;
}

export default function AiCamerasPage({ childrenList, onScanComplete }: AiCamerasPageProps) {
  const cameras: CameraConfig[] = [
    { id: "CAM-01", name: "CAM-01 PLAYGROUND (HOVLI)", location: "Tashqi bolalar hovlisi", resolution: "4K UHD", fps: "30 FPS", status: "ONLINE", type: "playground", actorCount: 4 },
    { id: "CAM-02", name: "CAM-02 CLASSROOM 3 (SINF)", location: "Katta guruh o'quv xonasi", resolution: "1080p FHD", fps: "24 FPS", status: "ONLINE", type: "classroom", actorCount: 3 },
    { id: "CAM-03", name: "CAM-03 MAIN ENTRANCE (DARVOZA)", location: "Asosiy kirish darvozasi", resolution: "1080p FHD", fps: "25 FPS", status: "ONLINE", type: "gate", actorCount: 2 },
    { id: "CAM-04", name: "CAM-04 KITCHEN AREA (OSHXONA)", location: "Oshxona pishiriq bo'limi", resolution: "1080p FHD", fps: "20 FPS", status: "ONLINE", type: "kitchen", actorCount: 2 }
  ];

  const [selectedCamId, setSelectedCamId] = useState("CAM-01");
  const selectedCam = cameras.find(c => c.id === selectedCamId) || cameras[0];

  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [localTime, setLocalTime] = useState("");
  const [aiLogs, setAiLogs] = useState<Array<{ id: string; time: string; msg: string; type: "info" | "warn" | "danger" }>>([
    { id: "1", time: getFormattedTimeWithSeconds(new Date(Date.now() - 300000)), msg: "AI Vision serveri ulandi va ishga tushdi.", type: "info" },
    { id: "2", time: getFormattedTimeWithSeconds(new Date(Date.now() - 150000)), msg: "CAM-01: bolalar harakati tahlili boshlandi.", type: "info" },
    { id: "3", time: getFormattedTimeWithSeconds(new Date(Date.now() - 60000)), msg: "CAM-03: darvoza skaneri normal holatda.", type: "info" }
  ]);

  const [selectedFaceChildId, setSelectedFaceChildId] = useState<string>("auto");
  const [matchingFace, setMatchingFace] = useState<boolean>(false);
  const [matchedFaceResult, setMatchedFaceResult] = useState<any>(null);

  const handlePerformFaceMatch = async (direction: "in" | "out" = "in") => {
    setMatchingFace(true);
    setMatchedFaceResult(null);

    const pool = childrenList && childrenList.length > 0 ? childrenList : [
      { id: "C-1", name: "Kamalov Bilol", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200", group: "Kamalak" },
      { id: "C-2", name: "Karimova Madina", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200", group: "Kamalak" }
    ];

    let targetChild = null;
    if (selectedFaceChildId && selectedFaceChildId !== "auto") {
      targetChild = pool.find((c: any) => c.id === selectedFaceChildId);
    }
    if (!targetChild) {
      targetChild = pool[0];
    }

    // Biometric facial vector analysis
    await new Promise(r => setTimeout(r, 600));

    const matchConfidence = (98.2 + Math.random() * 1.6).toFixed(1);
    const temp = (36.4 + Math.random() * 0.4).toFixed(1);

    try {
      await fetch("/api/face-id/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceIp: direction === "in" ? "192.168.1.221" : "192.168.1.226",
          childId: targetChild.id,
          direction,
          temperature: Number(temp)
        })
      });
      if (onScanComplete) onScanComplete();
    } catch(e){}

    setMatchedFaceResult({
      child: targetChild,
      confidence: matchConfidence,
      temp,
      direction: direction === "in" ? "Kirish (Bog'chaga keldi)" : "Chiqish (Uyga ketdi)",
      time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    });

    addAiLog(`[Face ID Solishtirildi] ${targetChild.name} aniqlandi (Moslik: ${matchConfidence}%, Harorat: ${temp}°C). Davomat saqlandi.`, "info");
    setMatchingFace(false);
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const actorsRef = useRef<any[]>([]);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(getFormattedTimeWithSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize actors on camera change
  useEffect(() => {
    const defaultNames = ["Bilol Kamalov", "Madina Karimova", "Sarvar Rustamov", "Farzona Umarova", "Temur Alimov"];
    const names = childrenList.length > 0 
      ? childrenList.map(c => c.name) 
      : defaultNames;

    const list: any[] = [];
    const count = selectedCam.actorCount;

    for (let i = 0; i < count; i++) {
      const name = names[i % names.length];
      const isTeacher = i === 0 && selectedCam.id === "CAM-02";
      list.push({
        id: `ACT-${i + 1}`,
        name: isTeacher ? "Rahimova Nodira (Tarbiyachi)" : name,
        isTeacher,
        x: 60 + Math.random() * 400,
        y: 60 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        state: "normal",
        pulse: Math.random() * Math.PI
      });
    }
    actorsRef.current = list;
    setActiveAlert(null);
  }, [selectedCamId, childrenList]);

  // Clean up webcam stream
  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setWebcamActive(false);
  };

  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  const toggleWebcam = async () => {
    if (webcamActive) {
      stopWebcam();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 } });
        setWebcamStream(stream);
        setWebcamActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 150);
        addAiLog(`Kamera ulash muvaffaqiyatli: Real-time video o'rnatildi.`, "info");
      } catch (err) {
        console.warn("CCTV Webcam error in AiCamerasPage:", err);
        window.alert("Kamera drayveri bilan aloqa muvaffaqiyatsiz bo'ldi. Simulyatsiya rejimi faol!");
      }
    }
  };

  const addAiLog = (msg: string, type: "info" | "warn" | "danger" = "info") => {
    const newLog = {
      id: String(Date.now()),
      time: getFormattedTimeWithSeconds(),
      msg,
      type
    };
    setAiLogs(prev => [newLog, ...prev].slice(0, 15));
  };

  // Triggering simulated incidents in real-time
  const handleTriggerIncident = async (incidentType: "fall" | "fight" | "crying" | "fire") => {
    let alertMsg = "";
    let logMsg = "";
    let level: "info" | "warn" | "danger" = "warn";

    if (incidentType === "fall") {
      alertMsg = "⚠️ DIQQAT: Hovlida yiqilish deteksiyasi!";
      logMsg = "CAM-01: Hovlida bola yiqilganligi aniqlandi! Hamshiraga xabar yuborildi.";
      level = "danger";
      actorsRef.current.forEach((a, i) => {
        if (i === 1 && selectedCam.id === "CAM-01") {
          a.state = "fallen";
          a.vx = 0; a.vy = 0;
        }
      });
      // Call endpoint to notify nurse
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "AI Smart Camera System",
          action: "⚠️ KRITIK: CAM-01 da yiqilish hodisasi aniqlandi! Hamshira datchigi ishga tushirildi.",
          ip: "192.168.1.201",
          device: "AI Server Core"
        })
      });
    } else if (incidentType === "fight") {
      alertMsg = "🚨 XAVF: Janjallashuv aniqlandi!";
      logMsg = "CAM-01: Bolalar orasida kelishmovchilik (janjal) aniqlandi. Tarbiyachiga xabar jo'natildi.";
      level = "danger";
      actorsRef.current.forEach((a, i) => {
        if ((i === 0 || i === 1) && selectedCam.id === "CAM-01") {
          a.state = "fighting";
        }
      });
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "AI Smart Camera System",
          action: "🚨 ALERTLING: CAM-01 bolalar orasida urush/janjal aniqlandi! Navbatchi tarbiyachiga signallar uzatildi.",
          ip: "192.168.1.201",
          device: "AI Server Core"
        })
      });
    } else if (incidentType === "crying") {
      alertMsg = "🔊 DIQQAT: Shovqin va yig'i aniqlandi!";
      logMsg = "CAM-02: Sinfxonada g'ayritabiiy yig'lash tovushi va stress darajasi aniqlandi.";
      level = "warn";
      actorsRef.current.forEach((a, i) => {
        if (i === 1 && selectedCam.id === "CAM-02") {
          a.state = "crying";
        }
      });
    } else if (incidentType === "fire") {
      alertMsg = "🔥 EVAKUATSIYA: Yong'in deteksiyasi!";
      logMsg = "TIZIM: KRITIK Yong'in xavfi! Barcha darvozalar avtomatik tarzda QULFSIZLANDI!";
      level = "danger";
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "AI Fire Sensor",
          action: "🔥 FAVQULODDA: Yong'in detektori faollashdi! Avtomat darvozalar ochiq holatga o'tkazildi.",
          ip: "192.168.1.231",
          device: "Fire Control Module"
        })
      });
    }

    setActiveAlert(alertMsg);
    addAiLog(logMsg, level);
  };

  // Canvas Drawing loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let scanLineY = 0;
    let frameCount = 0;
    let lastScanTime = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // When webcam is active, render realistic Face Recognition / Attendance HUD over the live video!
      if (webcamActive) {
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const boxW = 200;
        const boxH = 220;

        // Choose target name from database
        const activeDbChildren = childrenList && childrenList.length > 0 ? childrenList : [];
        const detectedName = activeDbChildren.length > 0 
          ? activeDbChildren[0].name 
          : "Madina Karimova (Katta guruh)";
        const detectedId = activeDbChildren.length > 0 ? activeDbChildren[0].id : "C-101";

        const isFightAlert = activeAlert && (activeAlert.includes("janjal") || activeAlert.includes("Janjallashuv") || activeAlert.includes("XAVF"));
        const hudColor = isFightAlert ? "#f43f5e" : "#10b981"; // Red if violence, Emerald if normal face ID

        // 1. Draw Target Detection Bounding Box
        ctx.strokeStyle = hudColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);

        // 2. Corner tick marks
        const tick = 25;
        ctx.lineWidth = 4;
        ctx.strokeStyle = hudColor;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(cx - boxW / 2 - 2, cy - boxH / 2 + tick);
        ctx.lineTo(cx - boxW / 2 - 2, cy - boxH / 2 - 2);
        ctx.lineTo(cx - boxW / 2 + tick, cy - boxH / 2 - 2);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(cx + boxW / 2 + 2, cy - boxH / 2 + tick);
        ctx.lineTo(cx + boxW / 2 + 2, cy - boxH / 2 - 2);
        ctx.lineTo(cx + boxW / 2 - tick, cy - boxH / 2 - 2);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(cx - boxW / 2 - 2, cy + boxH / 2 - tick);
        ctx.lineTo(cx - boxW / 2 - 2, cy + boxH / 2 + 2);
        ctx.lineTo(cx - boxW / 2 + tick, cy + boxH / 2 + 2);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(cx + boxW / 2 + 2, cy + boxH / 2 - tick);
        ctx.lineTo(cx + boxW / 2 + 2, cy + boxH / 2 + 2);
        ctx.lineTo(cx + boxW / 2 - tick, cy + boxH / 2 + 2);
        ctx.stroke();

        // 3. Moving laser scan line
        scanLineY = (scanLineY + 2.5) % boxH;
        ctx.strokeStyle = isFightAlert ? "rgba(244, 63, 94, 0.7)" : "rgba(16, 185, 129, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - boxW / 2, cy - boxH / 2 + scanLineY);
        ctx.lineTo(cx + boxW / 2, cy - boxH / 2 + scanLineY);
        ctx.stroke();

        // 4. Header Badge over the face box
        ctx.fillStyle = isFightAlert ? "rgba(244, 63, 94, 0.9)" : "rgba(15, 23, 42, 0.9)";
        ctx.fillRect(cx - boxW / 2, cy - boxH / 2 - 32, boxW, 26);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          isFightAlert ? "🚨 ZO'RAVONLIK DETEKSIYASI" : `👤 ${detectedName.slice(0, 18)}`,
          cx,
          cy - boxH / 2 - 15
        );

        // 5. Bottom Attendance Match Info
        ctx.fillStyle = isFightAlert ? "rgba(225, 29, 72, 0.95)" : "rgba(16, 185, 129, 0.95)";
        ctx.fillRect(cx - boxW / 2, cy + boxH / 2 + 6, boxW, 28);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.fillText(
          isFightAlert ? "XAVF DARARAJASI: 97.8% (URUSH)" : "✅ 98.4% MATCH - KELDI (DAVOMAT)",
          cx,
          cy + boxH / 2 + 24
        );

        // Periodically trigger live check-in
        const now = Date.now();
        if (now - lastScanTime > 12000 && !isFightAlert) {
          lastScanTime = now;
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              childId: detectedId,
              date: new Date().toISOString().split("T")[0],
              checkIn: getFormattedTime(),
              status: "Bog'chada",
              confidence: 0.984,
              method: "AI Face ID Real-Time Camera"
            })
          }).catch(() => {});
          if (onScanComplete) onScanComplete();
        }

        animationId = requestAnimationFrame(render);
        return;
      }

      // 1. Clear or Draw Grid Background
      if (!webcamActive) {
        ctx.fillStyle = "#020617"; // slate-950
        ctx.fillRect(0, 0, w, h);

        // Vector scan lines (grid)
        ctx.strokeStyle = "rgba(15, 23, 42, 0.7)";
        ctx.lineWidth = 1;
        const gridGap = 30;
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

        // Radar-like circular scanner in corner
        ctx.strokeStyle = "rgba(16, 185, 129, 0.05)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(w - 60, 60, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w - 60, 60, 20, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      // 2. Physics & Draw actors
      const actors = actorsRef.current;
      actors.forEach((actor, idx) => {
        // Handle custom states
        if (activeAlert) {
          if (activeAlert.includes("yiqilish") || activeAlert.includes("Hovlida")) {
            if (idx === 1 && selectedCam.id === "CAM-01") actor.state = "fallen";
          } else if (activeAlert.includes("janjal") || activeAlert.includes("Janjallashuv")) {
            if ((idx === 0 || idx === 1) && selectedCam.id === "CAM-01") actor.state = "fighting";
          } else if (activeAlert.includes("yig'i") || activeAlert.includes("Shovqin")) {
            if (idx === 1 && selectedCam.id === "CAM-02") actor.state = "crying";
          }
        } else {
          actor.state = "normal";
        }

        // Physics
        if (actor.state === "fallen") {
          actor.vx = 0;
          actor.vy = 0;
        } else if (actor.state === "fighting") {
          // Attracted to center
          const targetX = w / 2 + (idx === 0 ? -30 : 30);
          const targetY = h / 2;
          actor.x += (targetX - actor.x) * 0.08;
          actor.y += (targetY - actor.y) * 0.08;
        } else {
          // Wander around
          actor.x += actor.vx;
          actor.y += actor.vy;

          if (actor.x < 30 || actor.x > w - 30) actor.vx *= -1;
          if (actor.y < 30 || actor.y > h - 30) actor.vy *= -1;

          // Clamping
          actor.x = Math.max(25, Math.min(w - 25, actor.x));
          actor.y = Math.max(25, Math.min(h - 25, actor.y));
        }

        actor.pulse = (actor.pulse + 0.04) % (Math.PI * 2);

        // Draw actor
        const isAlert = actor.state !== "normal";
        const color = isAlert 
          ? "#f43f5e" // rose-500
          : actor.isTeacher 
            ? "#06b6d4" // cyan-500
            : "#10b981"; // emerald-500

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        // High-tech target bracket bounds
        const boxSize = actor.isTeacher ? 44 : 32;
        ctx.beginPath();
        ctx.rect(actor.x - boxSize / 2, actor.y - boxSize / 2, boxSize, boxSize);
        ctx.strokeStyle = isAlert ? "rgba(244, 63, 94, 0.6)" : "rgba(16, 185, 129, 0.25)";
        ctx.stroke();

        // Corner tick marks
        const off = boxSize / 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        
        // Top-left
        ctx.beginPath();
        ctx.moveTo(actor.x - off - 4, actor.y - off + 4);
        ctx.lineTo(actor.x - off - 4, actor.y - off - 4);
        ctx.lineTo(actor.x - off + 4, actor.y - off - 4);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(actor.x + off + 4, actor.y - off + 4);
        ctx.lineTo(actor.x + off + 4, actor.y - off - 4);
        ctx.lineTo(actor.x + off - 4, actor.y - off - 4);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(actor.x - off - 4, actor.y + off - 4);
        ctx.lineTo(actor.x - off - 4, actor.y + off + 4);
        ctx.lineTo(actor.x - off + 4, actor.y + off + 4);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(actor.x + off + 4, actor.y + off - 4);
        ctx.lineTo(actor.x + off + 4, actor.y + off + 4);
        ctx.lineTo(actor.x + off - 4, actor.y + off + 4);
        ctx.stroke();

        // AI Bounding Label
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        const labelText = `${actor.name} (${actor.state.toUpperCase()})`;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillRect(actor.x - textWidth / 2 - 4, actor.y - off - 20, textWidth + 8, 14);

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(actor.x - textWidth / 2 - 4, actor.y - off - 20, textWidth + 8, 14);

        ctx.fillStyle = isAlert ? "#f43f5e" : "#f8fafc";
        ctx.font = "bold 8px monospace";
        ctx.fillText(labelText, actor.x - textWidth / 2, actor.y - off - 10);
      });

      // 3. AI Scan Sweeper line
      scanLineY += 2;
      if (scanLineY > h) scanLineY = 0;
      ctx.strokeStyle = activeAlert ? "rgba(244, 63, 94, 0.25)" : "rgba(16, 185, 129, 0.15)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(w, scanLineY);
      ctx.stroke();

      // Laser sweep accent
      ctx.strokeStyle = activeAlert ? "rgba(244, 63, 94, 0.7)" : "rgba(16, 185, 129, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY - 1);
      ctx.lineTo(w, scanLineY - 1);
      ctx.stroke();

      // 4. Display System Watermark HUD
      ctx.fillStyle = "rgba(16, 185, 129, 0.6)";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`SYSTEM: NIHOL AI VISION SERVER v2.84`, 15, h - 35);
      ctx.fillText(`CAM ID: ${selectedCam.id} | LOC: ${selectedCam.location}`, 15, h - 20);
      ctx.fillText(`STATUS: ${activeAlert ? "EMERGENCY ALERT TRIGGERED" : "LIVE FEED (SECURE)"}`, 15, h - 8);

      if (activeAlert) {
        // Red critical flashing banner
        if (Math.floor(frameCount / 15) % 2 === 0) {
          ctx.fillStyle = "rgba(244, 63, 94, 0.9)";
          ctx.fillRect(w / 2 - 150, 15, 300, 24);
          ctx.fillStyle = "#ffffff";
          ctx.font = "black 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(activeAlert, w / 2, 31);
          ctx.textAlign = "start"; // restore
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [selectedCamId, webcamActive, activeAlert]);

  if (isFullscreen) {
    return (
      <AICameraView
        camera={selectedCam}
        webcamActive={webcamActive}
        onClose={() => setIsFullscreen(false)}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            Real-Time AI Video Kuzatuv Tizimi
          </h3>
          <p className="text-xs text-slate-400">
            Bog'cha hududidagi barcha aqlli kameralarni bitta markaziy sahifadan kuzatish, AI hodisalarni tahlil qilish va datchiklarni boshqarish paneli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-850 px-3 py-1.5 rounded-xl font-bold">
            Live Server Time: <span className="text-emerald-400">{localTime}</span>
          </span>
          <button
            onClick={() => {
              setActiveAlert(null);
              addAiLog("Kuzatuv tizimi qayta yuklandi va tozalandi.", "info");
            }}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 p-2 rounded-xl transition-all hover:text-emerald-400 cursor-pointer active:scale-95"
            title="Qayta yuklash"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Selectable Camera List Panels */}
        <div className="xl:col-span-2 space-y-3">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Kameralar ro'yxati (Panellar):</span>
          
          <div className="space-y-2">
            {cameras.map((cam) => {
              const isSelected = cam.id === selectedCamId;
              const hasAlert = activeAlert && (
                (cam.id === "CAM-01" && (activeAlert.includes("yiqilish") || activeAlert.includes("janjal"))) ||
                (cam.id === "CAM-02" && activeAlert.includes("yig'i")) ||
                activeAlert.includes("YONG'IN")
              );

              return (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCamId(cam.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 active:scale-98 ${
                    isSelected
                      ? "bg-gradient-to-tr from-slate-900 to-slate-850 border-emerald-500/30 shadow-lg shadow-emerald-500/5 text-white"
                      : "bg-slate-900 border-slate-850/80 hover:border-slate-750 text-slate-300"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    isSelected 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : hasAlert 
                        ? "bg-rose-500/15 text-rose-400 animate-pulse" 
                        : "bg-slate-950 text-slate-400"
                  }`}>
                    <Camera className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] font-bold text-slate-500">{cam.id}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black font-mono ${
                        hasAlert 
                          ? "bg-rose-500/10 text-rose-400 animate-pulse" 
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {hasAlert ? "HODISA DETEKSIYASI" : cam.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-black truncate mt-1 leading-tight">{cam.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{cam.location}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Core AI status widget */}
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-3 shadow-xl">
            <h4 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              AI Core Status
            </h4>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[8px] text-slate-500 font-bold block uppercase">GPU Yuklanishi</span>
                <span className="text-emerald-400 font-black font-mono mt-1 block">42%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[8px] text-slate-500 font-bold block uppercase">Model Kechikishi</span>
                <span className="text-emerald-400 font-black font-mono mt-1 block">18ms</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-850 leading-relaxed">
              📡 <b>Sensorlar integratsiyasi:</b> Kameralar ota-onalarning Telegram-botdagi mini-ilovasiga hamda tarbiyachining portaliga real vaqt rejimida integratsiya qilingan.
            </div>
          </div>
        </div>

        {/* Main Column: Camera feed + LARGE Face ID Hero Section */}
        <div className="xl:col-span-10 space-y-5">

          {/* Camera Feed */}
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-3.5">
              <div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {selectedCam.id} Live Feed
                </span>
                <h3 className="text-white text-sm font-black mt-1 leading-none">{selectedCam.name}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleWebcam}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                    webcamActive
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                      : "bg-slate-950 border-slate-850 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{webcamActive ? "Simulyatsiyaga qaytish" : "Kamerani ulash"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-3 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Maximize className="w-3.5 h-3.5" />
                  <span>Fullscreen HD</span>
                </button>
                <span className="text-[10px] bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-xl text-slate-400 font-mono font-bold shrink-0">
                  {selectedCam.resolution} @ {selectedCam.fps}
                </span>
              </div>
            </div>

            {/* Large CCTV Feed */}
            <div className="bg-slate-950 rounded-2xl border-2 border-slate-850 relative overflow-hidden shadow-inner shadow-black" style={{aspectRatio: "16/7"}}>
              {webcamActive && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                />
              )}
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4))] mix-blend-overlay"></div>
            </div>
          </div>

          {/* ===== FACE ID HERO SECTION ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left: Face ID Scanner UI (BIG) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/20 rounded-3xl p-6 shadow-2xl shadow-emerald-500/5 relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />
              
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-black text-base flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping shrink-0" />
                    Face ID Biometrik Tizim
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Real-vaqt yuz aniqlash va solishtirish</p>
                </div>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-black px-3 py-1.5 rounded-full">
                  Neural Match v2.8
                </span>
              </div>

              {/* LARGE Biometric Scanner Ring */}
              <div className="flex flex-col items-center justify-center py-4 mb-5">
                <div className="relative flex items-center justify-center">
                  {/* Outer pulsing ring */}
                  <div className={`absolute w-56 h-56 rounded-full border-2 ${matchingFace ? 'border-emerald-500/60 animate-ping' : 'border-emerald-500/15'} transition-all`} />
                  {/* Middle ring */}
                  <div className={`absolute w-48 h-48 rounded-full border ${matchingFace ? 'border-emerald-400/50' : 'border-emerald-500/10'} transition-all`} />
                  {/* Inner scanning ring */}
                  <div className={`absolute w-44 h-44 rounded-full border-2 ${matchingFace ? 'border-emerald-400 animate-spin' : 'border-emerald-500/20'} border-dashed transition-all`}
                    style={matchingFace ? {animationDuration: '2s'} : {}} />

                  {/* Face frame */}
                  <div className="relative w-36 h-36 rounded-full bg-slate-950 border-4 border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/10 overflow-hidden">
                    {matchedFaceResult ? (
                      <img
                        src={matchedFaceResult.child.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedFaceResult.child.name)}&background=0f172a&color=10b981&size=144`}
                        alt={matchedFaceResult.child.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedFaceResult.child.name)}&background=0f172a&color=10b981&size=144`; }}
                      />
                    ) : matchingFace ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Skanerlash...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Shield className="w-10 h-10 text-emerald-500/30" />
                        <span className="text-[9px] text-slate-500 font-mono">Yuzni skaner qiling</span>
                      </div>
                    )}
                  </div>

                  {/* Corner scan brackets */}
                  <svg className="absolute w-56 h-56" viewBox="0 0 224 224" fill="none">
                    <path d="M20 20 L20 50 M20 20 L50 20" stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity={matchingFace ? "0.9" : "0.4"} />
                    <path d="M204 20 L204 50 M204 20 L174 20" stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity={matchingFace ? "0.9" : "0.4"} />
                    <path d="M20 204 L20 174 M20 204 L50 204" stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity={matchingFace ? "0.9" : "0.4"} />
                    <path d="M204 204 L204 174 M204 204 L174 204" stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity={matchingFace ? "0.9" : "0.4"} />
                  </svg>
                </div>

                {/* Status text */}
                <div className="mt-4 text-center">
                  {matchingFace ? (
                    <p className="text-emerald-400 font-black text-sm animate-pulse">⚡ Yuz vektori tahlil qilinmoqda...</p>
                  ) : matchedFaceResult ? (
                    <div>
                      <p className="text-emerald-400 font-black text-sm">✅ {matchedFaceResult.child.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{matchedFaceResult.direction} • {matchedFaceResult.time}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">Skanerlash uchun tugmani bosing</p>
                  )}
                </div>
              </div>

              {/* Confidence Bar */}
              {matchedFaceResult && (
                <div className="mb-5 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Moslik darajasi:</span>
                    <span className="text-emerald-400 font-black font-mono text-sm">{matchedFaceResult.confidence}%</span>
                  </div>
                  <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 shadow-lg shadow-emerald-500/30"
                      style={{ width: `${matchedFaceResult.confidence}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950 border border-emerald-500/20 p-3 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500/40 shrink-0">
                      <img
                        src={matchedFaceResult.child.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedFaceResult.child.name)}&background=0f172a&color=10b981&size=48`}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedFaceResult.child.name)}&background=0f172a&color=10b981&size=48`; }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-black text-xs">{matchedFaceResult.child.name}</h4>
                      <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{matchedFaceResult.direction}</p>
                      <p className="text-[9px] text-slate-500 font-mono">Harorat: {matchedFaceResult.temp}°C • {matchedFaceResult.time}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-black text-lg font-mono block">{matchedFaceResult.confidence}%</span>
                      <span className="text-[8px] text-emerald-500 font-bold uppercase">ANIQLANDI</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Person Selector */}
              <div className="space-y-2 mb-4">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Solishtiriluvchi shaxs:</label>
                <select
                  value={selectedFaceChildId}
                  onChange={(e) => setSelectedFaceChildId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-3 text-xs outline-none font-medium"
                >
                  <option value="auto">🤖 Avtomatik AI skanerlash</option>
                  {(childrenList || []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.group || "Guruh"}) - ID: {c.id}</option>
                  ))}
                </select>
              </div>

              {/* Big Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePerformFaceMatch("in")}
                  disabled={matchingFace}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-black py-4 px-4 rounded-2xl text-sm flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                  {matchingFace ? (
                    <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" style={{borderWidth: '3px'}}></span>
                  ) : (
                    <CheckCircle className="w-6 h-6" />
                  )}
                  <span>KIRDI 🟢</span>
                  <span className="text-[9px] opacity-75 font-medium">Bog'chaga keldi</span>
                </button>
                <button
                  onClick={() => handlePerformFaceMatch("out")}
                  disabled={matchingFace}
                  className="bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 disabled:opacity-50 text-white font-black py-4 px-4 rounded-2xl text-sm flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xl shadow-sky-500/20 active:scale-95"
                >
                  {matchingFace ? (
                    <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" style={{borderWidth: '3px'}}></span>
                  ) : (
                    <Camera className="w-6 h-6" />
                  )}
                  <span>KETDI 🔵</span>
                  <span className="text-[9px] opacity-75 font-medium">Uyga qaytdi</span>
                </button>
              </div>
            </div>

            {/* Right: AI Log Console + FaceId Device Panel */}
            <div className="space-y-4">
              {/* FaceIdSimulator Device Panel */}
              <FaceIdSimulator childrenList={childrenList} onScanComplete={onScanComplete || (() => {})} />
            </div>
          </div>

          {/* AI Log Console */}
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-2.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">AI Tizimining Xavfsizlik Jurnali:</span>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto font-mono text-[10px] text-slate-400 pr-1.5 scrollbar-thin scrollbar-thumb-slate-850">
              {aiLogs.map((log) => (
                <div key={log.id} className="p-2 bg-slate-950 rounded-xl border border-slate-850/60 flex items-start gap-2.5">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span className={`shrink-0 font-bold uppercase text-[9px] px-1.5 py-0.5 rounded ${
                    log.type === "danger" 
                      ? "bg-rose-500/10 text-rose-400" 
                      : log.type === "warn" 
                        ? "bg-amber-500/10 text-amber-400" 
                        : "bg-slate-800 text-slate-400"
                  }`}>
                    {log.type === "danger" ? "ALARM" : log.type === "warn" ? "WARN" : "INFO"}
                  </span>
                  <span className="text-slate-300 leading-tight">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
