import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, ZoomIn, Info, ShieldCheck, Maximize, Clock, Film } from "lucide-react";

interface CameraConfig {
  id: string;
  name: string;
  location: string;
  resolution: string;
  fps: string;
  status: "ONLINE" | "OFFLINE" | "ALERT";
  type: "playground" | "classroom" | "gate" | "kitchen";
}

interface AICameraViewProps {
  camera: CameraConfig;
  webcamActive: boolean;
  onClose: () => void;
}

export default function AICameraView({ camera, webcamActive, onClose }: AICameraViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [scaleFactor, setScaleFactor] = useState(1.0);
  const [aiOverlayActive, setAiOverlayActive] = useState(camera.type === "gate");

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      setCurrentTime(
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web camera activation inside fullscreen view
  useEffect(() => {
    if (webcamActive) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 1920, height: 1080 } })
        .then((s) => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.error("Webcam streaming error in full screen view:", err);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [webcamActive]);

  // Clean, realistic high-definition live drawing loop (without bounding boxes/static dots/overlays)
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Define actors with highly detailed drawing paths (represented as smooth vector figures)
    const actors: any[] = [];
    const count = camera.type === "playground" ? 5 : camera.type === "classroom" ? 4 : 2;

    for (let i = 0; i < count; i++) {
      actors.push({
        x: Math.random() * 1200 + 100,
        y: Math.random() * 600 + 100,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: i % 2 === 0 ? "#38bdf8" : "#fb7185", // sky-400 or rose-400
        size: Math.random() * 6 + 10,
        speed: 0.8 + Math.random() * 0.5
      });
    }

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      if (webcamActive) {
        // Clear background so the webcam video feed underneath is visible
        ctx.clearRect(0, 0, w, h);

        if (aiOverlayActive) {
          // Draw a gorgeous high-tech target bracket in the center of the screen simulating face detection
          const scanBoxSize = 300;
          const cx = w / 2;
          const cy = h / 2;
          
          ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"; // sky-400 with opacity
          ctx.lineWidth = 2;
          ctx.strokeRect(cx - scanBoxSize / 2, cy - scanBoxSize / 2, scanBoxSize, scanBoxSize);
          
          // Corner highlight bracket ticks
          const tickLen = 20;
          ctx.strokeStyle = "#38bdf8"; // glowing sky-400
          ctx.lineWidth = 4;
          
          // Top-left
          ctx.beginPath();
          ctx.moveTo(cx - scanBoxSize / 2 - 2, cy - scanBoxSize / 2 + tickLen);
          ctx.lineTo(cx - scanBoxSize / 2 - 2, cy - scanBoxSize / 2 - 2);
          ctx.lineTo(cx - scanBoxSize / 2 + tickLen, cy - scanBoxSize / 2 - 2);
          ctx.stroke();
          
          // Top-right
          ctx.beginPath();
          ctx.moveTo(cx + scanBoxSize / 2 + 2, cy - scanBoxSize / 2 + tickLen);
          ctx.lineTo(cx + scanBoxSize / 2 + 2, cy - scanBoxSize / 2 - 2);
          ctx.lineTo(cx + scanBoxSize / 2 - tickLen, cy - scanBoxSize / 2 - 2);
          ctx.stroke();
          
          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(cx - scanBoxSize / 2 - 2, cy + scanBoxSize / 2 - tickLen);
          ctx.lineTo(cx - scanBoxSize / 2 - 2, cy + scanBoxSize / 2 + 2);
          ctx.lineTo(cx - scanBoxSize / 2 + tickLen, cy + scanBoxSize / 2 + 2);
          ctx.stroke();
          
          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(cx + scanBoxSize / 2 + 2, cy + scanBoxSize / 2 - tickLen);
          ctx.lineTo(cx + scanBoxSize / 2 + 2, cy + scanBoxSize / 2 + 2);
          ctx.lineTo(cx + scanBoxSize / 2 - tickLen, cy + scanBoxSize / 2 + 2);
          ctx.stroke();

          // Scanning laser line moving up and down
          const laserY = cy - scanBoxSize / 2 + ((Date.now() / 8) % scanBoxSize);
          ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - scanBoxSize / 2 + 5, laserY);
          ctx.lineTo(cx + scanBoxSize / 2 - 5, laserY);
          ctx.stroke();
          
          // Dynamic scanner target text overlay based on location
          let scannerLabel = "AI SURVEILLANCE: TRACKING ACTIVE...";
          if (camera.type === "gate") {
            scannerLabel = "AI FACE ID: SCANNING BIOMETRICS...";
          } else if (camera.type === "classroom") {
            scannerLabel = "AI ANALYTICS: STUDENT ATTENTIVENESS CHECK...";
          } else if (camera.type === "playground") {
            scannerLabel = "AI SECURITY: PLAYGROUND SAFETY RADAR...";
          } else if (camera.type === "kitchen") {
            scannerLabel = "AI MONITOR: HYGIENE & MEAL COUNTER...";
          }

          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 14px monospace";
          ctx.fillText(scannerLabel, cx - scanBoxSize / 2, cy - scanBoxSize / 2 - 15);
          
          ctx.fillStyle = "rgba(56, 189, 248, 0.7)";
          ctx.font = "12px monospace";
          ctx.fillText("TARGET ID: AUTHORIZED NODE", cx - scanBoxSize / 2, cy + scanBoxSize / 2 + 25);
        } else {
          // Draw standard clean CCTV markings instead of face-ID
          const cx = w / 2;
          const cy = h / 2;

          // Draw small center hair-cross
          ctx.strokeStyle = "rgba(250, 204, 21, 0.4)"; // amber-400
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy);
          ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15);
          ctx.stroke();

          // Small focus brackets at corners of screen
          ctx.strokeStyle = "rgba(148, 163, 184, 0.5)"; // slate-400
          ctx.lineWidth = 2;
          const borderOffset = 80;
          // Top-left bracket
          ctx.beginPath();
          ctx.moveTo(borderOffset, borderOffset + 30);
          ctx.lineTo(borderOffset, borderOffset);
          ctx.lineTo(borderOffset + 30, borderOffset);
          ctx.stroke();
          // Bottom-right bracket
          ctx.beginPath();
          ctx.moveTo(w - borderOffset, h - borderOffset - 30);
          ctx.lineTo(w - borderOffset, h - borderOffset);
          ctx.lineTo(w - borderOffset - 30, h - borderOffset);
          ctx.stroke();

          // Live Feed Label
          ctx.fillStyle = "#fbbf24"; // Amber-400
          ctx.font = "bold 14px monospace";
          ctx.fillText("LIVESURV FEED: UNFILTERED RAW STREAM", 40, h - 50);
        }
      } else {
        // Draw background (realistic camera environments in HD quality)
        ctx.fillStyle = "#020617"; // Slate-950
        ctx.fillRect(0, 0, w, h);

        // Draw elegant environment scenery for camera feeds
        if (camera.type === "playground") {
          // Soft hovli background
          ctx.fillStyle = "#052e16"; // deep green
          ctx.beginPath();
          ctx.ellipse(w / 2, h + 100, w * 0.7, h * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sandbox circle
          ctx.strokeStyle = "rgba(234, 179, 8, 0.15)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(w / 2 - 200, h / 2 + 50, 150, 0, Math.PI * 2);
          ctx.stroke();

          // Trees
          ctx.fillStyle = "rgba(22, 163, 74, 0.1)";
          ctx.beginPath();
          ctx.arc(200, 250, 120, 0, Math.PI * 2);
          ctx.arc(w - 200, h / 2 - 100, 160, 0, Math.PI * 2);
          ctx.fill();
        } else if (camera.type === "classroom") {
          // School tables layout in HD
          ctx.fillStyle = "#1e293b"; // slate tables
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
              ctx.fillRect(250 + col * 400, 200 + row * 240, 180, 80);
              // chairs
              ctx.fillStyle = "#0f172a";
              ctx.fillRect(300 + col * 400, 280 + row * 240, 80, 20);
              ctx.fillStyle = "#1e293b";
            }
          }
        } else {
          // Gate / hallway lines
          ctx.strokeStyle = "rgba(100, 116, 139, 0.1)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(100, 0);
          ctx.lineTo(100, h);
          ctx.moveTo(w - 100, 0);
          ctx.lineTo(w - 100, h);
          ctx.stroke();
        }

        // Render natural real-time moving characters smoothly
        actors.forEach((actor) => {
          actor.x += actor.vx * actor.speed;
          actor.y += actor.vy * actor.speed;

          // Boundary bounce
          if (actor.x < 50 || actor.x > w - 50) actor.vx *= -1;
          if (actor.y < 50 || actor.y > h - 50) actor.vy *= -1;

          // Drawing native children as beautifully rendered smooth soft glowing circles (NO static boxes or text labels)
          ctx.fillStyle = actor.color;
          ctx.beginPath();
          ctx.arc(actor.x, actor.y, actor.size, 0, Math.PI * 2);
          ctx.shadowColor = actor.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        });
      }

      // High-Definition HUD layout (Overlay CCTV system controls but NO bounding boxes or target dots on characters)
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`● REC [1080p HD]`, 40, 50);

      ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
      ctx.font = "14px monospace";
      ctx.fillText(`CAM ID: ${camera.id} | ${camera.name}`, 40, 80);

      // Draw active timestamp
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px monospace";
      ctx.fillText(currentTime || "08:00:00", w - 180, 50);

      // Subtle lens grain overlay
      ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [camera, webcamActive, currentTime, aiOverlayActive]);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* Top Bar Controls */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
          <div>
            <h2 className="text-white font-black text-sm uppercase tracking-wider">
              {camera.name} — FULLSCREEN HD VIEW
            </h2>
            <p className="text-xs text-slate-400">
              {camera.location} • Real-time raw surveillance feed (Unfiltered)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850">
            <Film className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
              Stream: 1080p @ {camera.fps}
            </span>
          </div>

          {/* AI vs CCTV Overlay Toggle */}
          <button
            onClick={() => setAiOverlayActive(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border ${
              aiOverlayActive
                ? "bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/30"
                : "bg-slate-800 hover:bg-slate-750 text-slate-400 border-slate-700"
            }`}
            title={aiOverlayActive ? "AI Skanerni o'chirish" : "AI Skanerni yoqish"}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{aiOverlayActive ? "AI Skaner Faol" : "Oddiy CCTV Kamera"}</span>
          </button>

          <button
            onClick={() => setScaleFactor(prev => (prev === 1.0 ? 1.25 : prev === 1.25 ? 1.5 : 1.0))}
            className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Skanerlash darajasini o'zgartirish"
          >
            <ZoomIn className="w-4 h-4" />
            <span>Kattalashtirish ({scaleFactor}x)</span>
          </button>

          <button
            onClick={onClose}
            className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
            Exit Fullscreen
          </button>
        </div>
      </div>

      {/* Screen Monitor Body */}
      <div className="flex-1 relative bg-black flex items-center justify-center p-4">
        <div 
          className="w-full h-full relative max-w-[1920px] max-h-[1080px] rounded-2xl border-4 border-slate-850 overflow-hidden shadow-2xl transition-transform duration-300"
          style={{ transform: `scale(${scaleFactor})` }}
        >
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
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* Interlaced surveillance scanlines effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]"></div>
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.5))] mix-blend-overlay"></div>
        </div>
      </div>

      {/* Footer info banner */}
      <div className="bg-slate-950 border-t border-slate-900 px-6 py-2 flex justify-between items-center text-[10px] text-slate-500 font-mono shrink-0">
        <span>SECURITY ENCRYPTED SHA-256 SYSTEM CONNECTION</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <Clock className="w-3.5 h-3.5" />
          ACTIVE CONNECTION STATUS: SECURE & HIGH DEFINITION
        </span>
      </div>
    </div>
  );
}
