import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Camera,
  ShieldAlert,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Bell,
  BellOff,
  RefreshCw,
  Maximize2,
  X,
  Activity,
  Mic,
  Flame,
  Zap,
  Radio,
  Monitor,
  ChevronRight,
  Eye,
  UserCheck,
  MapPin,
  Siren,
  Video,
} from "lucide-react";
import { ViolenceAlert } from "../types";
import { AuditLogger } from "../utils/AuditLogger";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CameraFeed {
  id: string;
  name: string;
  location: string;
  type: "playground" | "classroom" | "gate" | "kitchen" | "corridor";
  resolution: string;
  fps: number;
  status: "ONLINE" | "OFFLINE" | "ALERT";
  actorCount: number;
  audioSensitivity: number;
}

interface AlertNotification {
  id: string;
  camId: string;
  camName: string;
  type: "Aggression" | "AcousticScream" | "PanicFall" | "BlindSpotSuspicion";
  severity: "Yuqori" | "O'rta" | "Kritik";
  timestamp: string;
  message: string;
  dismissed: boolean;
  sentToBackend: boolean;
}

interface Actor {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  name: string;
  age: number;
  isTeacher: boolean;
  shirtColor: string;
  state: "normal" | "fallen" | "fighting" | "crying" | "running";
  stepPhase: number;
}

interface AiViolenceMonitorProps {
  kindergartenId?: string;
  userName?: string;
}

// ─── Web Audio Siren Generator ─────────────────────────────────────────────
function playAlarmSiren(type: "high" | "medium" | "fire") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    if (type === "fire") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.4);
      osc.frequency.linearRampToValueAtTime(900, now + 0.8);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (type === "high") {
      osc.type = "square";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1000, now + 0.2);
      osc.frequency.setValueAtTime(800, now + 0.4);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (err) {
    console.warn("Audio Context playback error:", err);
  }
}

// ─── Camera Configuration ──────────────────────────────────────────────────
const CAMERAS: CameraFeed[] = [
  { id: "CAM-01", name: "Hovli (Playground)", location: "Tashqi bolalar hovlisi", type: "playground", resolution: "4K UHD", fps: 30, status: "ONLINE", actorCount: 5, audioSensitivity: 75 },
  { id: "CAM-02", name: "Sinf Xona 1", location: "Kamalak guruhi xonasi", type: "classroom", resolution: "1080p", fps: 25, status: "ONLINE", actorCount: 6, audioSensitivity: 80 },
  { id: "CAM-03", name: "Sinf Xona 2", location: "Nilufar guruhi xonasi", type: "classroom", resolution: "1080p", fps: 25, status: "ONLINE", actorCount: 4, audioSensitivity: 70 },
  { id: "CAM-04", name: "Kirish Darvoza", location: "Asosiy kirish darvozasi", type: "gate", resolution: "1080p", fps: 30, status: "ONLINE", actorCount: 3, audioSensitivity: 60 },
  { id: "CAM-05", name: "Oshxona", location: "Taom tayyorlash bo'limi", type: "kitchen", resolution: "1080p", fps: 20, status: "ONLINE", actorCount: 3, audioSensitivity: 55 },
  { id: "CAM-06", name: "Yo'lak (Koridor)", location: "2-qavat yo'lagi", type: "corridor", resolution: "720p", fps: 15, status: "ONLINE", actorCount: 3, audioSensitivity: 65 },
];

const CHILD_NAMES = ["Bilol K.", "Madina K.", "Sarvar R.", "Farzona U.", "Temur A.", "Nilufar H."];
const SHIRT_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#10b981", "#a855f7", "#ec4899"];

function createActorsForCam(cam: CameraFeed): Actor[] {
  return Array.from({ length: cam.actorCount }, (_, i) => {
    const isTeacher = i === 0 && (cam.type === "classroom" || cam.type === "playground");
    return {
      id: `${cam.id}-ACT-${i}`,
      x: 100 + Math.random() * 400,
      y: 80 + Math.random() * 200,
      vx: (Math.random() - 0.5) * 1.8,
      vy: (Math.random() - 0.5) * 1.8,
      name: isTeacher ? "Tarbiyachi Nigora" : CHILD_NAMES[i % CHILD_NAMES.length],
      age: isTeacher ? 32 : 5 + (i % 3),
      isTeacher,
      shirtColor: isTeacher ? "#0891b2" : SHIRT_COLORS[i % SHIRT_COLORS.length],
      state: "normal",
      stepPhase: Math.random() * Math.PI * 2,
    };
  });
}

function formatTime(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// ─── Canvas Background Drawer ──────────────────────────────────────────────
function drawRoomBackground(ctx: CanvasRenderingContext2D, w: number, h: number, type: CameraFeed["type"]) {
  if (type === "playground") {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#15803d");
    grad.addColorStop(1, "#166534");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#fde047";
    ctx.fillRect(w * 0.1, h * 0.55, w * 0.25, h * 0.35);
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.1, h * 0.55, w * 0.25, h * 0.35);
    ctx.fillStyle = "#854d0e";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("QUM MAYDONCHASI", w * 0.12, h * 0.62);

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(w * 0.75, h * 0.3);
    ctx.lineTo(w * 0.9, h * 0.8);
    ctx.lineTo(w * 0.85, h * 0.8);
    ctx.lineTo(w * 0.72, h * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(w * 0.7, h * 0.2, w * 0.05, h * 0.6);

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, h * 0.15); ctx.lineTo(w, h * 0.15); ctx.stroke();
    for (let x = 0; x < w; x += 15) {
      ctx.beginPath(); ctx.moveTo(x, h * 0.15); ctx.lineTo(x, 0); ctx.stroke();
    }
  } else if (type === "classroom") {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(w * 0.05, h * 0.2, w * 0.9, h * 0.75);

    ctx.fillStyle = "#064e3b";
    ctx.fillRect(w * 0.25, 8, w * 0.5, h * 0.18);
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.25, 8, w * 0.5, h * 0.18);
    ctx.fillStyle = "#ecfdf5";
    ctx.font = "bold 11px monospace";
    ctx.fillText("BOG'CHA O'QUV XONASI - ALIFBO & HISOB", w * 0.28, 24);

    const deskPositions = [
      { x: w * 0.15, y: h * 0.4 },
      { x: w * 0.5, y: h * 0.4 },
      { x: w * 0.75, y: h * 0.4 },
      { x: w * 0.3, y: h * 0.7 },
      { x: w * 0.6, y: h * 0.7 },
    ];
    deskPositions.forEach((pos) => {
      ctx.fillStyle = "#78350f";
      ctx.fillRect(pos.x, pos.y, 60, 35);
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x, pos.y, 60, 35);
      ctx.fillStyle = "#92400e";
      ctx.font = "8px sans-serif";
      ctx.fillText("PARTA", pos.x + 12, pos.y + 20);
    });
  } else if (type === "gate") {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#9a3412";
    ctx.fillRect(w * 0.1, 0, 40, h);
    ctx.fillRect(w * 0.8, 0, 40, h);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    for (let x = w * 0.1 + 45; x < w * 0.8; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(w * 0.82, h * 0.3, w * 0.15, h * 0.5);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.84, h * 0.35, w * 0.11, h * 0.2);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 8px monospace";
    ctx.fillText("POST", w * 0.86, h * 0.47);
  } else if (type === "kitchen") {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    ctx.fillStyle = "#475569";
    ctx.fillRect(w * 0.1, h * 0.2, w * 0.8, 40);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(w * 0.1, h * 0.2, w * 0.8, 8);

    ctx.fillStyle = "#334155";
    ctx.fillRect(w * 0.35, 0, w * 0.3, 35);
    ctx.fillStyle = "#f97316";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("OSHXONA OSHPAZLIK ZONASI", w * 0.37, 22);
  } else {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.2);
    ctx.lineTo(w * 0.7, h * 0.2);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#991b1b";
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.2);
    ctx.lineTo(w * 0.58, h * 0.2);
    ctx.lineTo(w * 0.7, h);
    ctx.lineTo(w * 0.3, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#334155";
    ctx.fillRect(10, h * 0.3, 30, 80);
    ctx.fillRect(w - 40, h * 0.3, 30, 80);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "8px monospace";
    ctx.fillText("101", 15, h * 0.28);
    ctx.fillText("102", w - 35, h * 0.28);
  }
}

// ─── Human Actor Rendering ────────────────────────────────────────────────
function drawHumanActor(
  ctx: CanvasRenderingContext2D,
  a: Actor,
  isBigView: boolean,
  alertActive: boolean
) {
  const isAlert = a.state !== "normal" || alertActive;
  const sz = isBigView ? (a.isTeacher ? 22 : 16) : a.isTeacher ? 12 : 9;

  ctx.save();
  const step = Math.sin(a.stepPhase) * (a.state === "fighting" ? 8 : 4);

  // Body shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(a.x, a.y + sz * 1.6, sz * 0.8, sz * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (a.state === "fallen") {
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(a.x - sz * 1.5, a.y, sz * 3, sz * 0.8);
    ctx.fillStyle = "#ffd1a9";
    ctx.beginPath();
    ctx.arc(a.x - sz * 1.8, a.y + sz * 0.4, sz * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Legs
    ctx.strokeStyle = isAlert ? "#f43f5e" : "#1e293b";
    ctx.lineWidth = isBigView ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(a.x - sz * 0.3, a.y + sz * 0.8);
    ctx.lineTo(a.x - sz * 0.3 + step, a.y + sz * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a.x + sz * 0.3, a.y + sz * 0.8);
    ctx.lineTo(a.x + sz * 0.3 - step, a.y + sz * 1.6);
    ctx.stroke();

    // Torso
    const shirtColor = isAlert ? "#f43f5e" : a.shirtColor;
    ctx.fillStyle = shirtColor;
    ctx.fillRect(a.x - sz * 0.6, a.y - sz * 0.2, sz * 1.2, sz * 1.1);

    if (a.isTeacher) {
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(a.x - sz * 0.15, a.y - sz * 0.1, sz * 0.3, sz * 0.7);
    }

    // Arms
    ctx.strokeStyle = shirtColor;
    ctx.lineWidth = isBigView ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(a.x - sz * 0.6, a.y);
    ctx.lineTo(a.x - sz * 1.0 - step, a.y + sz * 0.5);
    ctx.moveTo(a.x + sz * 0.6, a.y);
    ctx.lineTo(a.x + sz * 1.0 + step, a.y + sz * 0.5);
    ctx.stroke();

    // Head
    ctx.fillStyle = "#ffd1a9";
    ctx.beginPath();
    ctx.arc(a.x, a.y - sz * 0.8, sz * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = a.isTeacher ? "#475569" : "#1e293b";
    ctx.beginPath();
    ctx.arc(a.x, a.y - sz * 0.95, sz * 0.62, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  // Bounding Box
  const bw = sz * (isBigView ? 3.2 : 2.6);
  const bh = sz * (isBigView ? 4.2 : 3.4);
  const bx = a.x - bw / 2;
  const by = a.y - sz * 1.8;

  ctx.strokeStyle = isAlert ? "#ef4444" : a.isTeacher ? "#06b6d4" : "#10b981";
  ctx.lineWidth = isAlert ? 2.5 : 1.5;
  ctx.strokeRect(bx, by, bw, bh);

  const tk = isBigView ? 8 : 4;
  ctx.strokeStyle = isAlert ? "#f43f5e" : "#34d399";
  ctx.lineWidth = 2;

  ctx.beginPath(); ctx.moveTo(bx + tk, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + tk); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + bw - tk, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + tk); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + tk, by + bh); ctx.lineTo(bx, by + bh); ctx.lineTo(bx, by + bh - tk); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + bw - tk, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - tk); ctx.stroke();

  const labelFont = isBigView ? "bold 10px monospace" : "bold 8px monospace";
  ctx.font = labelFont;
  const stateText =
    a.state === "fighting" ? "🚨 ZO'RAVONLIK!" :
    a.state === "fallen"   ? "⚠️ YIQILDI!" :
    a.state === "crying"   ? "🔊 SHOVQIN/YIG'I" : "🟢 TINCH";

  const fullLabel = `${a.name} | ${stateText}`;
  const metrics = ctx.measureText(fullLabel);
  const lw = metrics.width + 10;
  const lh = isBigView ? 18 : 14;

  ctx.fillStyle = isAlert ? "rgba(225,29,72,0.92)" : "rgba(15,23,42,0.85)";
  ctx.fillRect(a.x - lw / 2, by - lh - 4, lw, lh);
  ctx.strokeStyle = isAlert ? "#f43f5e" : "#0284c7";
  ctx.lineWidth = 1;
  ctx.strokeRect(a.x - lw / 2, by - lh - 4, lw, lh);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(fullLabel, a.x, by - lh / 2);
  ctx.textAlign = "left";

  ctx.restore();
}

// ─── Mini Camera Canvas Component ─────────────────────────────────────────
interface MiniCamCanvasProps {
  cam: CameraFeed;
  alertActive: boolean;
  audioLevel: number;
  isSelected: boolean;
  onSelect: () => void;
  webcamStream: MediaStream | null;
}

function MiniCamCanvas({ cam, alertActive, audioLevel, isSelected, onSelect, webcamStream }: MiniCamCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actorsRef = useRef<Actor[]>(createActorsForCam(cam));
  const animRef = useRef<number>(0);

  useEffect(() => { actorsRef.current = createActorsForCam(cam); }, [cam.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      if (!webcamStream || !isSelected) {
        drawRoomBackground(ctx, w, h, cam.type);

        actorsRef.current.forEach((a) => {
          if (alertActive && Math.random() < 0.01 && a.state === "normal") {
            a.state = "fighting";
          }
          if (!alertActive) a.state = "normal";

          if (a.state !== "fallen") {
            a.x += a.vx;
            a.y += a.vy;
            a.stepPhase += 0.15;
            if (a.x < 30 || a.x > w - 30) a.vx *= -1;
            if (a.y < 30 || a.y > h - 30) a.vy *= -1;
            a.x = Math.max(30, Math.min(w - 30, a.x));
            a.y = Math.max(30, Math.min(h - 30, a.y));
          }

          drawHumanActor(ctx, a, false, alertActive);
        });
      } else {
        // Clear canvas when webcam active so video shows cleanly underneath
        ctx.clearRect(0, 0, w, h);
      }

      if (alertActive) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 6;
        ctx.strokeRect(0, 0, w, h);

        if (Math.floor(frame / 12) % 2 === 0) {
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(0, 0, w, 22);
          ctx.fillStyle = "#ffffff";
          ctx.font = "black 9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🚨 XAVF DETEKTSIYA QILINDI", w / 2, 14);
          ctx.textAlign = "left";
        }
      }

      ctx.fillStyle = "rgba(15,23,42,0.85)";
      ctx.fillRect(6, h - 20, 90, 16);
      ctx.fillStyle = alertActive ? "#f43f5e" : "#10b981";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`● ${cam.id}`, 10, h - 8);

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [cam, alertActive, audioLevel, isSelected, webcamStream]);

  return (
    <button
      onClick={onSelect}
      className={`relative w-full rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
        alertActive
          ? "border-rose-600 shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse"
          : isSelected
          ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
          : "border-slate-800 hover:border-slate-600"
      }`}
      style={{ aspectRatio: "16/9" }}
    >
      <canvas ref={canvasRef} width={320} height={180} className="w-full h-full" />
      {alertActive && (
        <div className="absolute top-2 right-2 bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase animate-bounce shadow-md">
          🚨 XAVF HODISASI
        </div>
      )}
      <div className="absolute bottom-1.5 right-1.5 bg-slate-950/80 px-1.5 py-0.5 rounded text-[8px] text-slate-300 font-mono">
        {cam.fps} FPS
      </div>
    </button>
  );
}

// ─── Big Main Camera View Component ─────────────────────────────────────────
interface BigCamCanvasProps {
  cam: CameraFeed;
  alertState: string | null;
  audioLevel: number;
  webcamStream: MediaStream | null;
}

function BigCamCanvas({ cam, alertState, audioLevel, webcamStream }: BigCamCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const actorsRef = useRef<Actor[]>(createActorsForCam(cam));
  const animRef = useRef<number>(0);
  const [clock, setClock] = useState(formatTime());

  useEffect(() => { actorsRef.current = createActorsForCam(cam); }, [cam.id]);
  useEffect(() => { const t = setInterval(() => setClock(formatTime()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (videoRef.current && webcamStream) videoRef.current.srcObject = webcamStream; }, [webcamStream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      if (!webcamStream) {
        // SIMULATION MODE: Draw room background + 2D graphic human actors
        drawRoomBackground(ctx, w, h, cam.type);

        actorsRef.current.forEach((a, idx) => {
          if (alertState === "fight") {
            a.state = idx < 2 ? "fighting" : "normal";
            if (idx < 2) {
              const cx = w / 2;
              const cy = h / 2;
              a.x += (cx + (idx === 0 ? -40 : 40) - a.x) * 0.08;
              a.y += (cy - a.y) * 0.08;
            } else {
              a.x += a.vx; a.y += a.vy;
            }
          } else if (alertState === "fall") {
            a.state = idx === 1 ? "fallen" : "normal";
            if (a.state !== "fallen") { a.x += a.vx; a.y += a.vy; }
          } else if (alertState === "scream") {
            a.state = "crying";
            a.x += a.vx * 0.3; a.y += a.vy * 0.3;
          } else {
            a.state = "normal";
            a.x += a.vx; a.y += a.vy;
          }

          a.stepPhase += 0.12;
          if (a.x < 50 || a.x > w - 50) a.vx *= -1;
          if (a.y < 50 || a.y > h - 50) a.vy *= -1;
          a.x = Math.max(50, Math.min(w - 50, a.x));
          a.y = Math.max(50, Math.min(h - 50, a.y));

          drawHumanActor(ctx, a, true, !!alertState);
        });
      } else {
        // REAL WEBCAM MODE: Clear canvas completely so real camera video is 100% visible!
        // DO NOT DRAW 2D cartoon avatars over live webcam video!
        ctx.clearRect(0, 0, w, h);

        // Render AI Vision HUD & Real Bounding Detection Boxes over live video!
        const boxX = w / 2;
        const boxY = h / 2.1;
        const boxW = alertState ? 360 : 280;
        const boxH = alertState ? 380 : 300;

        ctx.strokeStyle = alertState ? "#ef4444" : "#10b981";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(boxX - boxW / 2, boxY - boxH / 2, boxW, boxH);

        // Corner brackets on real camera stream
        const tk = 16;
        const bx = boxX - boxW / 2;
        const by = boxY - boxH / 2;
        ctx.strokeStyle = alertState ? "#f43f5e" : "#34d399";
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(bx + tk, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + tk); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + boxW - tk, by); ctx.lineTo(bx + boxW, by); ctx.lineTo(bx + boxW, by + tk); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + tk, by + boxH); ctx.lineTo(bx, by + boxH); ctx.lineTo(bx, by + boxH - tk); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + boxW - tk, by + boxH); ctx.lineTo(bx + boxW, by + boxH); ctx.lineTo(bx + boxW, by + boxH - tk); ctx.stroke();

        // Overhead tag over detected person in live camera feed
        ctx.fillStyle = alertState ? "rgba(225,29,72,0.92)" : "rgba(15,23,42,0.88)";
        ctx.fillRect(boxX - 130, by - 30, 260, 26);
        ctx.strokeStyle = alertState ? "#f43f5e" : "#10b981";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boxX - 130, by - 30, 260, 26);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          alertState ? "🚨 XAVF: ZO'RAVONLIK DETEKTSIYASI!" : "REAL LIVE KAMERA | AI VISION [NORMAL]",
          boxX,
          by - 13
        );
        ctx.textAlign = "left";
      }

      // XAVF DANGER BANNER OVERLAY
      if (alertState) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, w, h);

        if (Math.floor(frame / 12) % 2 === 0) {
          const bW = 560;
          ctx.fillStyle = "rgba(220,38,38,0.95)";
          ctx.fillRect(w / 2 - bW / 2, 16, bW, 40);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.strokeRect(w / 2 - bW / 2, 16, bW, 40);

          ctx.fillStyle = "#ffffff";
          ctx.font = "black 16px sans-serif";
          ctx.textAlign = "center";
          const alertTitle =
            alertState === "fight" ? "🚨 XAVF: JISMONIY ZO'RAVONLIK / JANJAL!" :
            alertState === "fall"  ? "⚠️ XAVF: BOLA YIQILIB TUSHISHI!" :
            "🔊 XAVF: BALAND QICHQIRIQ VA SHOVQIN!";
          ctx.fillText(alertTitle, w / 2, 42);
          ctx.textAlign = "left";
        }
      }

      // HUD overlay info
      ctx.fillStyle = "rgba(15,23,42,0.85)";
      ctx.fillRect(12, h - 36, 480, 26);
      ctx.fillStyle = alertState ? "#f43f5e" : "#34d399";
      ctx.font = "bold 11px monospace";
      ctx.fillText(
        `NIHOL AI VISION v3.0 | ${webcamStream ? "JONLI VEBKAMERA" : cam.id} | ${cam.name} | OVOZ: ${Math.round(audioLevel)}dB`,
        20,
        h - 18
      );

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [cam, alertState, audioLevel, webcamStream]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border-4 transition-all duration-300 shadow-2xl bg-black ${
      alertState ? "border-rose-600 shadow-[0_0_40px_rgba(244,63,94,0.8)]" : "border-slate-800"
    }`} style={{ aspectRatio: "16/9" }}>
      {webcamStream && (
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      )}
      <canvas ref={canvasRef} width={960} height={540} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {webcamStream && (
          <div className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-lg border border-emerald-400">
            <Video className="w-4 h-4 animate-pulse" /> REAL JONLI KAMERA YONIQ
          </div>
        )}
        {alertState && (
          <div className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase animate-bounce flex items-center gap-1.5 shadow-lg">
            <Siren className="w-4 h-4 animate-spin" /> XAVF DETEKTSIYASI
          </div>
        )}
        <div className="bg-rose-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-ping" /> REC LIVE
        </div>
      </div>
      <div className="absolute top-3 left-3 text-emerald-400 font-mono font-bold text-xs bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
        {clock}
      </div>
    </div>
  );
}

// ─── Audio Meter Component ──────────────────────────────────────────────────
function AudioBar({ level }: { level: number }) {
  const bars = 18;
  return (
    <div className="flex items-end gap-0.5 h-6">
      {Array.from({ length: bars }, (_, i) => {
        const threshold = ((i + 1) / bars) * 100;
        const active = level >= threshold;
        const isDanger = threshold > 70;
        return (
          <div
            key={i}
            className={`w-1.5 rounded-sm transition-all duration-75 ${
              active ? (isDanger ? "bg-rose-500 animate-pulse" : "bg-emerald-400") : "bg-slate-800"
            }`}
            style={{ height: `${30 + i * 3.5}%` }}
          />
        );
      })}
    </div>
  );
}

// ─── Main Component Export ──────────────────────────────────────────────────
export default function AiViolenceMonitor({ kindergartenId, userName }: AiViolenceMonitorProps) {
  const [selectedCamId, setSelectedCamId] = useState("CAM-01");
  const selectedCam = CAMERAS.find(c => c.id === selectedCamId) ?? CAMERAS[0];

  const [audioLevels, setAudioLevels] = useState<Record<string, number>>(
    () => Object.fromEntries(CAMERAS.map(c => [c.id, 25 + Math.random() * 20]))
  );
  const [camAlerts, setCamAlerts] = useState<Record<string, string | null>>(
    () => Object.fromEntries(CAMERAS.map(c => [c.id, null]))
  );
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [alertsMuted, setAlertsMuted] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [connectingWebcam, setConnectingWebcam] = useState(false);
  const [aiActive, setAiActive] = useState(true);
  const [fullscreenCam, setFullscreenCam] = useState<string | null>(null);
  const [historicalAlerts, setHistoricalAlerts] = useState<ViolenceAlert[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fluctuating audio level simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevels(prev => {
        const next = { ...prev };
        CAMERAS.forEach(c => {
          const jitter = (Math.random() - 0.5) * 20;
          const base = c.audioSensitivity * 0.35;
          next[c.id] = Math.max(8, Math.min(99, (prev[c.id] ?? 30) + jitter + (base - prev[c.id]) * 0.08));
        });
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Fetch backend alert history
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/safety/violence-alerts");
      if (res.ok) {
        const data = await res.json();
        setHistoricalAlerts((data.data ?? []).slice(0, 15));
      }
    } catch (err) {
      console.error("[AiViolenceMonitor] History error:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Post alert to backend API & Audit Logger
  const postAlertToBackend = useCallback(async (
    camId: string,
    type: AlertNotification["type"],
    severity: AlertNotification["severity"]
  ) => {
    try {
      const cam = CAMERAS.find(c => c.id === camId);
      const res = await fetch("/api/safety/violence-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cameraOrRoom: cam ? `${cam.id} — ${cam.location}` : camId,
          type,
          severity,
          snapshotUrl: "",
        }),
      });
      if (res.ok) {
        await AuditLogger.log(
          userName ?? "AI Kamera Tizimi",
          `🚨 ${type} aniqlandi: ${camId} kamerasida`,
          "AiViolenceMonitor",
          kindergartenId
        );
        loadHistory();
      }
    } catch (err) {
      console.error("[AiViolenceMonitor] Post alert error:", err);
    }
  }, [kindergartenId, userName, loadHistory]);

  // Trigger Alert Function
  const triggerAlert = useCallback((
    camId: string,
    type: AlertNotification["type"],
    severity: AlertNotification["severity"],
    alertState: string,
    message: string
  ) => {
    if (alertsMuted) return;

    if (audioEnabled) {
      playAlarmSiren(severity === "Kritik" ? "high" : "medium");
    }

    const notifId = `NOTIF-${Date.now()}-${camId}`;
    const notif: AlertNotification = {
      id: notifId, camId,
      camName: CAMERAS.find(c => c.id === camId)?.name ?? camId,
      type, severity, timestamp: formatTime(), message, dismissed: false, sentToBackend: false,
    };

    setNotifications(prev => [notif, ...prev].slice(0, 20));
    setCamAlerts(prev => ({ ...prev, [camId]: alertState }));

    postAlertToBackend(camId, type, severity).then(() => {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, sentToBackend: true } : n));
    });

    setTimeout(() => setCamAlerts(prev => ({ ...prev, [camId]: null })), 10000);
  }, [alertsMuted, audioEnabled, postAlertToBackend]);

  // High noise auto detection (>86dB)
  const prevHighRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!aiActive) return;
    CAMERAS.forEach(c => {
      const lvl = audioLevels[c.id] ?? 0;
      const wasHigh = prevHighRef.current[c.id];
      if (lvl > 86 && !wasHigh && !camAlerts[c.id]) {
        prevHighRef.current[c.id] = true;
        triggerAlert(c.id, "AcousticScream", "O'rta", "scream",
          `${c.name}: Baland qichqiriq va shovqin aniqlandi (${Math.round(lvl)}dB)`
        );
        setTimeout(() => { prevHighRef.current[c.id] = false; }, 12000);
      }
    });
  }, [audioLevels, aiActive, camAlerts, triggerAlert]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, dismissed: true } : n));
  };

  const connectWebcam = async () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
      return;
    }
    setConnectingWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 960, height: 540 }, audio: false });
      setWebcamStream(stream);
    } catch {
      alert("Kamera ulashda xatolik. Simulyatsiya rejimi davom etadi.");
    } finally {
      setConnectingWebcam(false);
    }
  };

  const handleTrigger = (type: "fight" | "fall" | "scream" | "fire") => {
    if (type === "fire") {
      playAlarmSiren("fire");
      CAMERAS.forEach(c => triggerAlert(c.id, "BlindSpotSuspicion", "Kritik", "fight",
        `BARCHA KAMERALAR: 🔥 Yong'in xavfi — FAVQULODDA EVAKUATSIYA!`
      ));
    } else if (type === "fight") {
      triggerAlert(selectedCam.id, "Aggression", "Kritik", "fight",
        `${selectedCam.name}: 🚨 ZO'RAVONLIK DETEKTSIYASI! Bolalar orasida urishish aniqlandi!`
      );
    } else if (type === "fall") {
      triggerAlert(selectedCam.id, "PanicFall", "Yuqori", "fall",
        `${selectedCam.name}: ⚠️ YIQILISH HODISASI! Bola yiqilib tushdi!`
      );
    } else {
      triggerAlert(selectedCam.id, "AcousticScream", "O'rta", "scream",
        `${selectedCam.name}: 🔊 BALAND SHOVQIN / QICHQIRIQ! (${Math.round(audioLevels[selectedCam.id] ?? 0)}dB)`
      );
    }
  };

  const activeAlertsCount = Object.values(camAlerts).filter(Boolean).length;
  const undismissed = notifications.filter(n => !n.dismissed);

  if (fullscreenCam) {
    const cam = CAMERAS.find(c => c.id === fullscreenCam) ?? CAMERAS[0];
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col font-sans">
        <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            <div>
              <h2 className="text-white font-black text-sm uppercase tracking-wider">{cam.name} — FULLSCREEN MONITORING</h2>
              <p className="text-[11px] text-slate-400">{cam.location} • {cam.resolution} @ {cam.fps}fps</p>
            </div>
          </div>
          <button
            onClick={() => setFullscreenCam(null)}
            className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" /> CHIQISH
          </button>
        </div>
        <div className="flex-1 p-4 bg-black flex items-center justify-center">
          <div className="w-full max-w-6xl">
            <BigCamCanvas cam={cam} alertState={camAlerts[cam.id] ?? null} audioLevel={audioLevels[cam.id] ?? 30} webcamStream={fullscreenCam === selectedCamId ? webcamStream : null} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl backdrop-blur shadow-xl">
        <div>
          <h3 className="text-white font-black text-base uppercase tracking-wider flex items-center gap-2">
            <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            AI Zo'ravonlik, Shovqin va Xavfsizlik Monitoring Tizimi
            {activeAlertsCount > 0 && (
              <span className="bg-rose-600 text-white text-xs font-black px-3 py-0.5 rounded-full animate-bounce shadow-lg">
                🚨 {activeAlertsCount} TA FAOL XAVF!
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-vaqtli video tahlil • Insonlarni aniqlash & Joylashuvi • Ovoz spektri va Siyosat buzilishi alertlari
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAudioEnabled(p => !p)}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 border transition-all cursor-pointer active:scale-95 ${
              audioEnabled ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            {audioEnabled ? "🔊 Alarm Ovoz Yoqiq" : "🔇 Ovoz O'chiq"}
          </button>

          <button
            onClick={() => setAiActive(p => !p)}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 border transition-all cursor-pointer active:scale-95 ${
              aiActive ? "bg-sky-500/20 border-sky-500/40 text-sky-300" : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
          >
            <Eye className="w-4 h-4" /> AI Detector {aiActive ? "FAOL" : "O'CHIQ"}
          </button>

          <button
            onClick={connectWebcam}
            disabled={connectingWebcam}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border transition-all cursor-pointer active:scale-95 ${
              webcamStream
                ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30 animate-pulse"
                : "bg-sky-600 hover:bg-sky-500 border-sky-400 text-white"
            }`}
          >
            <Camera className="w-4 h-4" />
            {connectingWebcam ? "Ulanmoqda..." : webcamStream ? "📹 Real Kamera Yoniq (O'chirish)" : "📹 Real Kamera Yoqish"}
          </button>

          <button
            onClick={loadHistory}
            disabled={loadingHistory}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 p-2.5 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHistory ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Critical Active Alert Banner */}
      {undismissed.slice(0, 2).map(n => (
        <div key={n.id} className="flex items-center justify-between p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 rounded-xl text-white">
              <ShieldAlert className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  🚨 {n.severity} XAVF!
                </span>
                <span className="text-slate-300 font-mono text-xs">{n.timestamp}</span>
                <span className="text-emerald-400 font-bold text-xs">✓ MMTB Portaliga Xabar Yuborildi</span>
              </div>
              <h4 className="text-white font-black text-sm">{n.message}</h4>
            </div>
          </div>
          <button onClick={() => dismissNotification(n.id)} className="bg-rose-900/60 hover:bg-rose-800 text-white p-2 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: 6 Camera Feeds */}
        <div className="xl:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" /> Kameralar ({CAMERAS.length} ta)
            </span>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
            {CAMERAS.map(cam => (
              <div key={cam.id} className="space-y-1 bg-slate-900/60 border border-slate-800 p-2 rounded-2xl">
                <MiniCamCanvas
                  cam={cam}
                  alertActive={!!camAlerts[cam.id]}
                  audioLevel={audioLevels[cam.id] ?? 30}
                  isSelected={cam.id === selectedCamId}
                  onSelect={() => setSelectedCamId(cam.id)}
                  webcamStream={webcamStream}
                />
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-slate-300 font-black font-mono">{cam.name}</span>
                  <AudioBar level={audioLevels[cam.id] ?? 0} />
                  <span className={`text-[10px] font-mono font-black ${(audioLevels[cam.id] ?? 0) > 70 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                    {Math.round(audioLevels[cam.id] ?? 0)}dB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: Big Selected Camera Feed + Trigger Console */}
        <div className="xl:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-black uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {selectedCam.id} — ASOSIY MONITORING
                </span>
                <h3 className="text-white font-black text-lg mt-1">{selectedCam.name}</h3>
                <p className="text-xs text-slate-400">{selectedCam.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300 font-mono font-bold">
                  {selectedCam.resolution} @ {selectedCam.fps} FPS
                </span>
                <button
                  onClick={() => setFullscreenCam(selectedCam.id)}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 p-2.5 rounded-xl transition-all cursor-pointer font-bold"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <BigCamCanvas
              cam={selectedCam}
              alertState={camAlerts[selectedCam.id] ?? null}
              audioLevel={audioLevels[selectedCam.id] ?? 30}
              webcamStream={webcamStream}
            />

            {/* Audio db Meter */}
            <div className="flex items-center gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <Mic className={`w-5 h-5 shrink-0 ${(audioLevels[selectedCam.id] ?? 0) > 70 ? "text-rose-500 animate-bounce" : "text-emerald-400"}`} />
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-400 font-bold">Ovoz Spektri & Intensivligi</span>
                  <span className={`text-xs font-black font-mono ${(audioLevels[selectedCam.id] ?? 0) > 70 ? "text-rose-400" : "text-emerald-400"}`}>
                    {Math.round(audioLevels[selectedCam.id] ?? 0)} dB (SHOVQIN SENSOORI)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${(audioLevels[selectedCam.id] ?? 0) > 70 ? "bg-rose-500" : "bg-emerald-500"}`}
                    style={{ width: `${audioLevels[selectedCam.id] ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Event Simulator Trigger Console */}
          <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-black uppercase text-slate-200 tracking-wider">
                AI Hodisa Simulyatsiyasi va Xavf Sinovi
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: "fight", emoji: "🥊", label: "Janjal / Urish", sub: "Aggression Alert", cls: "hover:border-rose-500/60 hover:bg-rose-950/40" },
                { key: "fall",  emoji: "👦", label: "Yiqilish",       sub: "PanicFall Alert",  cls: "hover:border-orange-500/60 hover:bg-orange-950/40" },
                { key: "scream",emoji: "😱", label: "Qichqiriq",      sub: "Acoustic Noise",  cls: "hover:border-amber-500/60 hover:bg-amber-950/40" },
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={() => handleTrigger(btn.key as "fight" | "fall" | "scream")}
                  className={`bg-slate-950 border border-slate-800 text-left p-3.5 rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-3 group active:scale-95 ${btn.cls}`}
                >
                  <span className="text-2xl">{btn.emoji}</span>
                  <div>
                    <div className="font-black text-slate-200 group-hover:text-white">{btn.label}</div>
                    <span className="text-[9px] text-slate-500">{btn.sub}</span>
                  </div>
                </button>
              ))}
              <button
                onClick={() => handleTrigger("fire")}
                className="bg-rose-600/20 hover:bg-rose-600/30 border-2 border-rose-500 text-left p-3.5 rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-3 active:scale-95 animate-pulse"
              >
                <Flame className="w-6 h-6 text-rose-500 shrink-0 animate-bounce" />
                <div>
                  <div className="font-black text-rose-300">Evakuatsiya</div>
                  <span className="text-[9px] text-rose-400">Yong'in Xavfi</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Alert History & Notifications */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" /> Jonli Xabar Loglari
              </h4>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold">
                {notifications.length} ta
              </span>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Barcha kameralarda vaziyat tinch</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border text-xs transition-all ${
                      n.dismissed ? "opacity-40 bg-slate-950 border-slate-850"
                      : n.severity === "Kritik" ? "bg-rose-950/70 border-rose-500/50"
                      : "bg-amber-950/50 border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${n.severity === "Kritik" ? "bg-rose-500 text-white" : "bg-amber-500/20 text-amber-300"}`}>
                            {n.severity}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">{n.timestamp}</span>
                        </div>
                        <p className="text-slate-200 font-bold leading-snug">{n.message}</p>
                      </div>
                      {!n.dismissed && (
                        <button onClick={() => dismissNotification(n.id)} className="text-slate-500 hover:text-white cursor-pointer p-1 shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Backend History */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-slate-400" /> Backend Baza Tarixi
              </h4>
              <button onClick={loadHistory} className="text-slate-500 hover:text-emerald-400 cursor-pointer transition-all p-1">
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {historicalAlerts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  {loadingHistory ? "Baza yuklanmoqda..." : "Bazada ma'lumot yo'q"}
                </p>
              ) : historicalAlerts.map((alert: ViolenceAlert) => (
                <div key={alert.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-850 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      alert.severity === "Kritik" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                    }`}>{alert.severity}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(alert.timestamp).toLocaleTimeString("uz-UZ")}
                    </span>
                  </div>
                  <p className="text-slate-200 font-bold leading-snug">{alert.cameraOrRoom}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
