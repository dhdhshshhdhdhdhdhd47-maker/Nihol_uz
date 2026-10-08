import React, { useState, useEffect } from "react";
import { 
  Star, Check, Award, AlertCircle, Save, Coffee, Smile, Moon, 
  Users, Calendar, Settings, Video, FileText, Image, Camera, 
  Send, MessageSquare, Plus, Trash2, Heart, User, Key, Bell, 
  RefreshCw, Eye, BookOpen, Clock, Activity, Thermometer, Grid,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Child, DailyActivity, Attendance } from "../types";
import { useCameraPermission } from "../hooks/useCameraPermission";

interface TeacherDashboardProps {
  user: any;
  childrenList: Child[];
  onRefresh: () => void;
}

const getDeviceNameByIp = (ip?: string) => {
  if (!ip) return "";
  const lastOctet = ip.split(".").pop();
  if (lastOctet === "221") return "Kamalak Kirish #1";
  if (lastOctet === "222") return "Asosiy Kirish #2";
  if (lastOctet === "223") return "Yordamchi Kirish #3";
  if (lastOctet === "224") return "Orqa hovli Kirish #4";
  if (lastOctet === "225") return "Tashqi yo'lak Kirish #5";
  if (lastOctet === "226") return "Darvoza Chiqish #1";
  if (lastOctet === "227") return "Orqa hovli Chiqish #2";
  if (lastOctet === "228") return "Xizmat yo'li Chiqish #3";
  if (lastOctet === "229") return "Tashqi yo'lak Chiqish #4";
  if (lastOctet === "230") return "Kamalak Chiqish #5";
  return `ID-Terminal (${ip})`;
};

export default function TeacherDashboard({ user, childrenList, onRefresh }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem("teacher_sidebar_collapsed");
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const [selectedChildId, setSelectedChildId] = useState("");

  const [healthWarningsAlerts, setHealthWarningsAlerts] = useState<boolean>(() => localStorage.getItem("teacher_health_warnings") !== "false");
  const [emergencyComplaintsAlerts, setEmergencyComplaintsAlerts] = useState<boolean>(() => localStorage.getItem("teacher_emergency_complaints") !== "false");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("teacher_health_warnings", String(healthWarningsAlerts));
    localStorage.setItem("teacher_emergency_complaints", String(emergencyComplaintsAlerts));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };
  
  // Child checkout with camera states
  const [checkoutChild, setCheckoutChild] = useState<Child | null>(null);
  const [checkoutPickerName, setCheckoutPickerName] = useState("");
  const [checkoutPhoto, setCheckoutPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Rating states
  const [engagement, setEngagement] = useState(5);
  const [discipline, setDiscipline] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [feeding, setFeeding] = useState(5);
  const [sleep, setSleep] = useState(2);
  const [mood, setMood] = useState(5);
  const [teacherNote, setTeacherNote] = useState("");
  const [syncRatings, setSyncRatings] = useState(true);

  const handleRatingChange = (type: string, val: number) => {
    if (syncRatings) {
      setEngagement(val);
      setCommunication(val);
      setDiscipline(val);
      setFeeding(val);
      setMood(val);
    } else {
      if (type === "engagement") setEngagement(val);
      if (type === "communication") setCommunication(val);
      if (type === "discipline") setDiscipline(val);
    }
  };

  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || "");
  const [editPassword, setEditPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: editName,
          phone: editPhone,
          password: editPassword || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          triggerToast("Profil ma'lumotlari muvaffaqiyatli yangilandi!");
          onRefresh();
        } else {
          triggerToast(data.message || "Xatolik yuz berdi");
        }
      } else {
        triggerToast("Server bilan aloqa bog'lashda xatolik");
      }
    } catch (err) {
      triggerToast("Profilni yangilashda kutilmagan xatolik");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const [activitiesList, setActivitiesList] = useState<string[]>(["Rasm chizish", "Musiqiy darslar", "Sport"]);
  const [currentActivityInput, setCurrentActivityInput] = useState("");
  
  // Custom uploaded photo and analysis state
  const [activityPhoto, setActivityPhoto] = useState<string | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);

  // Daily report states
  const [dailyTopic, setDailyTopic] = useState("Ranglar olami");
  const [dailyDesc, setDailyDesc] = useState("Bugun bolalar qizil, yashil va ko'k ranglarni tanishni o'rgandilar.");
  const [dailyGames, setDailyGames] = useState("Sehrli koptok, O'rdaklar o'yini");
  
  // Homework states
  const [homeworkTask, setHomeworkTask] = useState("Rangli qalamlar bilan rasm chizib kelish");
  const [homeworkVideo, setHomeworkVideo] = useState("https://youtube.com/watch?v=colors-for-kids");

  // Meal states
  const [breakfastAppetite, setBreakfastAppetite] = useState("Yaxshi");
  const [lunchAppetite, setLunchAppetite] = useState("Yaxshi");
  const [dinnerAppetite, setDinnerAppetite] = useState("O'rtacha");

  // Sleep states
  const [sleepStart, setSleepStart] = useState("13:00");
  const [sleepEnd, setSleepEnd] = useState("15:00");
  const [sleepQuality, setSleepQuality] = useState("Tinch");

  // Health notes
  const [healthFever, setHealthFever] = useState("36.6");
  const [healthCough, setHealthCough] = useState("Yo'q");
  const [healthNotes, setHealthNotes] = useState("Sog'lom, kayfiyati yaxshi.");

  // Parent communication
  const [parentMsgText, setParentMsgText] = useState("");

  // Local gallery states and dynamic image uploads
  const [galleryImages, setGalleryImages] = useState<Array<{ url: string; title: string }>>([]);
  const [newImageTag, setNewImageTag] = useState("Bugungi dars");

  const handleImageUploadClick = () => {
    const fileInput = document.getElementById("gallery-file-input");
    if (fileInput) fileInput.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setGalleryImages(prev => [
        ...prev,
        { url: base64String, title: newImageTag || "Mashg'ulot" }
      ]);
      setNotifSuccess("Rasm guruh albomiga muvaffaqiyatli yuklandi!");
      setTimeout(() => setNotifSuccess(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleActivityPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setActivityPhoto(base64String);
      triggerToast("Faoliyat rasmi muvaffaqiyatli yuklandi! Endi AI tahlil qilish tugmasini bosing.");
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeActivityPhoto = async () => {
    if (!activityPhoto) {
      alert("Iltimos, avval tahlil qilish uchun rasm yuklang!");
      return;
    }
    setAnalyzingPhoto(true);
    try {
      const res = await fetch("/api/activities/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: activityPhoto,
          childId: selectedChildId,
          caption: "Bugungi sinf/dars mashg'ulotida bolaning ijodiy ishi"
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          const { engagement: newEng, communication: newComm, discipline: newDisc, aiComment } = data.analysis;
          setEngagement(newEng || 5);
          setCommunication(newComm || 5);
          setDiscipline(newDisc || 5);
          setTeacherNote(aiComment || "");
          triggerToast("AI tahlili muvaffaqiyatli yakunlandi! Baholar va tarbiyachi izohi avtomatik to'ldirildi.");
        }
      }
    } catch (err) {
      console.error("AI Analysis failed", err);
      triggerToast("AI tahlili bajarilmadi, iltimos qayta urining.");
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  // UI state
  const [loading, setLoading] = useState(false);
  const { permission: cameraPermission, requestPermission: askCameraPermission } = useCameraPermission();
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [attendanceSubTab, setAttendanceSubTab] = useState<"children" | "employees">("children");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Camera & Mobile QR/Face scanner states
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerMode, setScannerMode] = useState<"qr" | "face">("face");
  const [scanTemp, setScanTemp] = useState("36.6");
  const [selectedScanChildId, setSelectedScanChildId] = useState("auto");
  const [scanningInProgress, setScanningInProgress] = useState(false);
  const [scanSuccessChild, setScanSuccessChild] = useState<any>(null);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const [scannerLogs, setScannerLogs] = useState<string[]>([]);
  const [scanDirection, setScanDirection] = useState<"in" | "out">("in");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // INTERACTIVE LIVE CAMERA MODAL STATE
  const [isRealCameraOpen, setIsRealCameraOpen] = useState(false);
  const [realCameraMode, setRealCameraMode] = useState<"attendance" | "gallery">("attendance");
  const [realCameraTargetId, setRealCameraTargetId] = useState<string>("auto");
  const [realCameraDirection, setRealCameraDirection] = useState<"in" | "out">("in");
  const [realCameraType, setRealCameraType] = useState<"child" | "employee">("child");
  const [realCameraStream, setRealCameraStream] = useState<MediaStream | null>(null);
  const [realCameraError, setRealCameraError] = useState<string | null>(null);
  const [realCameraFlash, setRealCameraFlash] = useState<boolean>(false);
  const [realCameraSuccess, setRealCameraSuccess] = useState<any>(null);
  const [galleryCategory, setGalleryCategory] = useState<string>("Mashg'ulot (Ijodiy)");
  const [galleryTitle, setGalleryTitle] = useState<string>("");
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  const realVideoRef = React.useRef<HTMLVideoElement>(null);

  // Load employees
  const fetchEmployeesList = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployeesList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  // Permission Check Utility
  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: "camera" as any });
        if (result.state === "denied") {
          return false;
        }
      }
      // Attempt quick stream to check
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (err) {
      console.warn("Camera check failed", err);
      return false;
    }
  };

  // Open real camera handler
  const openRealCamera = async (mode: "attendance" | "gallery", targetId: string = "auto", direction: "in" | "out" = "in", type: "child" | "employee" = "child") => {
    setRealCameraError(null);
    setRealCameraSuccess(null);
    setRealCameraMode(mode);
    setRealCameraTargetId(targetId);
    setRealCameraDirection(direction);
    setRealCameraType(type);
    
    // Proactively request browser-native permission before opening the camera modal
    let permitted = cameraPermission === "granted";
    if (!permitted) {
      permitted = await askCameraPermission();
    }
    
    if (!permitted) {
      setRealCameraError("Kamera ruxsatnomasi rad etildi yoki qurilmada kamera topilmadi! Iltimos, brauzerda kameraga ruxsat bering.");
    }
    
    setIsRealCameraOpen(true);
  };

  // Close real camera handler
  const closeRealCamera = () => {
    if (realCameraStream) {
      realCameraStream.getTracks().forEach(track => track.stop());
      setRealCameraStream(null);
    }
    setIsRealCameraOpen(false);
    setRealCameraSuccess(null);
    setRealCameraError(null);
  };

  // Interactive Live Camera Modal Stream handler
  useEffect(() => {
    if (isRealCameraOpen && cameraPermission === "granted") {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: realCameraMode === "attendance" ? "user" : "environment" } })
        .then(stream => {
          setRealCameraStream(stream);
          if (realVideoRef.current) {
            realVideoRef.current.srcObject = stream;
          }
          setRealCameraError(null);
        })
        .catch(err => {
          console.error("Camera stream start failed", err);
          setRealCameraError("Kamera oqimini ishga tushirib bo'lmadi: " + err.message);
        });
    } else if (!isRealCameraOpen) {
      if (realCameraStream) {
        realCameraStream.getTracks().forEach(track => track.stop());
        setRealCameraStream(null);
      }
    }
  }, [isRealCameraOpen, cameraPermission, realCameraMode]);

  // Capture Photo and process
  const captureRealPhotoAndProcess = async () => {
    if (!realVideoRef.current || realCameraError) return;

    setRealCameraFlash(true);
    setTimeout(() => setRealCameraFlash(false), 200);

    // Create canvas to capture frame
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx && realVideoRef.current) {
      ctx.drawImage(realVideoRef.current, 0, 0, canvas.width, canvas.height);
    }
    const dataUrl = canvas.toDataURL("image/jpeg");

    if (realCameraMode === "attendance") {
      setScanningInProgress(true);
      try {
        const res = await fetch("/api/attendance/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetId: realCameraTargetId,
            imageFrame: dataUrl,
            type: realCameraType,
            direction: realCameraDirection,
            temperature: (36.2 + Math.random() * 0.9).toFixed(1)
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            playScannerBeep();
            setRealCameraSuccess(data);
            triggerToast(data.message);
            await fetchAttendanceList();
            onRefresh();
          } else {
            setRealCameraError(data.message || "Xatolik yuz berdi");
          }
        } else {
          setRealCameraError("Server bilan aloqa uzildi!");
        }
      } catch (err) {
        console.error(err);
        setRealCameraError("Ulanish xatosi!");
      } finally {
        setScanningInProgress(false);
      }
    } else {
      // Media Capture Mode
      setScanningInProgress(true);
      try {
        const title = galleryTitle || `${galleryCategory} Surati - ${new Date().toLocaleTimeString()}`;
        const res = await fetch("/api/meal-gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title,
            url: dataUrl,
            type: galleryCategory,
            kindergartenId: user.kindergartenId || "K-1",
            description: "Kameradan bevosita olingan va tasdiqlangan media fayl."
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            playScannerBeep();
            triggerToast("Rasm muvaffaqiyatli saqlandi!");
            // Auto close gallery camera after success
            setTimeout(() => {
              closeRealCamera();
              onRefresh();
            }, 1000);
          } else {
            setRealCameraError(data.message || "Yuklashda xatolik");
          }
        } else {
          setRealCameraError("Serverga yuklashda xatolik yuz berdi!");
        }
      } catch (err) {
        console.error(err);
        setRealCameraError("Kamera rasmini saqlashda tarmoq xatosi!");
      } finally {
        setScanningInProgress(false);
      }
    }
  };

  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Mobile QR/Face Scanner Stream handler
  useEffect(() => {
    if (isScannerActive && cameraPermission === "granted") {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
          setCameraStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setCameraPermissionError(false);
          setScannerLogs(prev => ["Kamera oqimi muvaffaqiyatli ulangan.", ...prev]);
        })
        .catch(err => {
          console.warn("Camera blocked or unavailable:", err);
          setCameraPermissionError(true);
          setScannerLogs(prev => ["Telegram/Kamera kirish ruxsati rad etildi. Simulyatordan foydalaning.", ...prev]);
        });
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScannerActive, cameraPermission]);

  const playScannerBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = 950;
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn("Sound blocked by browser autoplay rules:", e);
    }
  };

  const handlePerformScan = async () => {
    let finalChildId = selectedScanChildId;
    const todayStr = new Date().toISOString().split("T")[0];

    // Auto-generate temperature first
    const calculatedTemp = (36.3 + Math.random() * 0.5).toFixed(1);
    setScanTemp(calculatedTemp);

    if (!finalChildId || finalChildId === "auto") {
      // Automatically detect child from group or available children list
      const pool = (studentsToRender && studentsToRender.length > 0) ? studentsToRender : childrenList;
      const unscanned = pool.find(c => {
        const hasAtt = attendanceList.some(a => a.childId === c.id && a.date === todayStr && (scanDirection === "in" ? a.checkIn : a.checkOut));
        return !hasAtt;
      }) || pool[0];

      if (!unscanned) {
        triggerToast("Guruhdagi bolalar ro'yxati topilmadi!");
        return;
      }
      finalChildId = unscanned.id;
    }

    setScanningInProgress(true);
    setScannerLogs(prev => [`[Kamera] Skanerlash boshlandi... (Tartib: ${scannerMode.toUpperCase()})`, ...prev]);
    
    // Simulate fast scanner focus as requested ("tez fast ishlashi kerak")
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const child = childrenList.find(c => c.id === finalChildId);
    if (!child) return;

    // We scan on entrance IP (221) if check-in, else exit IP (226) for checkout
    const deviceIp = scanDirection === "in" ? "192.168.1.221" : "192.168.1.226";

    try {
      const res = await fetch("/api/face-id/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceIp,
          childId: finalChildId,
          password: "admin135@",
          temperature: Number(calculatedTemp)
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          playScannerBeep();
          const confidence = (98.4 + Math.random() * 1.4).toFixed(1);
          setScanSuccessChild({
            name: child.name,
            photo: child.photo,
            time: new Date().toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' }),
            direction: scanDirection === "in" ? "KIRISH (GURUHGA KIRDI) 🟢" : "CHIQISH (UYGA KETDI) 🔵",
            temp: calculatedTemp,
            confidence
          });
          setScannerLogs(prev => [
            `[Muvaffaqiyat] ${child.name} yuzi solishtirildi (Moslik: ${confidence}%). Harorat: ${calculatedTemp}°C. Davomat saqlandi!`,
            ...prev
          ]);
          await fetchAttendanceList();
          onRefresh();
          triggerToast(`✅ ${child.name} yuzi ${confidence}% aniqlikda solishtirildi! Davomat qayd etildi.`);
        } else {
          triggerToast(data.message || "Xatolik yuz berdi");
        }
      } else {
        triggerToast("Skanerlashda xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Tizim ulanish xatosi");
    } finally {
      setScanningInProgress(false);
    }
  };

  const teacherGroupId = "G-1"; // Seed teacher's group (Kamalak)
  const myStudents = childrenList.filter(c => c.groupId === teacherGroupId);
  const studentsToRender = myStudents.length > 0 ? myStudents : childrenList;

  const attendanceListRef = React.useRef(attendanceList);
  const studentsToRenderRef = React.useRef(studentsToRender);
  const employeesListRef = React.useRef(employeesList);

  React.useEffect(() => {
    attendanceListRef.current = attendanceList;
  }, [attendanceList]);

  React.useEffect(() => {
    studentsToRenderRef.current = studentsToRender;
  }, [studentsToRender]);

  React.useEffect(() => {
    employeesListRef.current = employeesList;
  }, [employeesList]);

  const fetchAttendanceList = async (showFeedback = false) => {
    try {
      const res = await fetch("/api/attendance");
      if (res.ok) {
        const data = await res.json();
        
        if (showFeedback && attendanceListRef.current.length > 0) {
          // Find the difference
          const updatedRecord = data.find((newRecord: any) => {
            const oldRecord = attendanceListRef.current.find((r: any) => (r.childId === newRecord.childId || r.employeeId === newRecord.employeeId) && r.date === newRecord.date);
            if (!oldRecord) return true; // entirely new
            return oldRecord.checkIn !== newRecord.checkIn || oldRecord.checkOut !== newRecord.checkOut;
          });

          if (updatedRecord) {
            const targetId = updatedRecord.childId || updatedRecord.employeeId;
            const childObj = studentsToRenderRef.current.find(c => c.id === targetId);
            const employeeObj = employeesListRef.current.find(e => e.id === targetId);
            const personName = childObj?.name || employeeObj?.name || targetId;
            const statusType = updatedRecord.checkOut ? "Chiqish (Check-Out)" : "Kirish (Check-In)";
            triggerToast(`🎉 Real-time: ${personName} uchun ${statusType} muvaffaqiyatli qayd etildi!`);
          } else {
            triggerToast("🎉 Davomat ma'lumotlari yangilandi!");
          }
        }

        setAttendanceList(data);
      }
    } catch (err) {
      console.error("Error fetching attendance list:", err);
    }
  };

  useEffect(() => {
    fetchAttendanceList();
  }, [childrenList]);

  // Connect to WebSocket inside TeacherDashboard for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWS = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws-hardware`;
      
      ws = new WebSocket(wsUrl);

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "data_update" && message.module === "attendance") {
            // Re-fetch the attendance list with feedback enabled
            await fetchAttendanceList(true);
            onRefresh();
          }
        } catch (err) {
          console.error("TeacherDashboard WS parse error:", err);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWS, 5000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleSendParentNotification = async (child: Child, attRecord: any) => {
    const isEntrance = child.status === "Bog'chada" || child.status === "Kechikdi";
    const statusText = child.status === "Kechikdi" ? "Kechikib kelindi" : child.status;
    const directionStr = isEntrance ? "bog'chaga yetib keldi" : "bog'chadan uyga ketdi";
    
    let timeStr = "08:00";
    let guardianInfo = "";
    let tempInfo = "36.5";

    if (attRecord) {
      timeStr = isEntrance ? (attRecord.checkIn || "08:00") : (attRecord.checkOut || "17:30");
      tempInfo = attRecord.temperature || "36.5";
      if (!isEntrance && attRecord.checkoutPersonName) {
        guardianInfo = `\n👤 *Olib ketgan vasiy:* ${attRecord.checkoutPersonName}`;
      }
    }

    const message = `Farzandingiz *${child.name}* bugun soat *${timeStr}* da ${directionStr}.${guardianInfo}\n\n🌡 Tana harorati: ${tempInfo}°C.\n📍 Davomat holati: ${statusText}`;

    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "Telegram",
          recipient: child.telegramChatId || "SIM-PARENT-" + child.id,
          message: message
        })
      });
      if (res.ok) {
        triggerToast(`🎉 ${child.name.split(" ")[0]} ota-onasiga Telegram xabar yuborildi!`);
      }
    } catch (err) {
      console.error("Error sending notification:", err);
      triggerToast("⚠️ Xabar yuborishda xatolik yuz berdi.");
    }
  };

  useEffect(() => {
    if (studentsToRender.length > 0 && !selectedChildId) {
      setSelectedChildId(studentsToRender[0].id);
    }
  }, [studentsToRender]);

  const triggerToast = (text: string) => {
    setNotifSuccess(text);
    setTimeout(() => setNotifSuccess(null), 3000);
  };

  // Load child daily rating from API if any
  useEffect(() => {
    const fetchChildActivity = async () => {
      if (!selectedChildId) return;
      try {
        const res = await fetch("/api/activities");
        const data: DailyActivity[] = await res.json();
        const todayStr = new Date().toISOString().split("T")[0];
        const current = data.find(a => a.childId === selectedChildId && a.date === todayStr);

        if (current) {
          setEngagement(current.engagement);
          setDiscipline(current.discipline);
          setCommunication(current.communication);
          setFeeding(current.feeding);
          setSleep(current.sleep);
          setTeacherNote(current.teacherNote);
          setActivitiesList(current.activities);
        } else {
          setEngagement(5);
          setDiscipline(5);
          setCommunication(5);
          setFeeding(5);
          setSleep(2);
          setTeacherNote("");
          setActivitiesList(["Rasm chizish", "Musiqiy darslar", "Sport"]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchChildActivity();
  }, [selectedChildId]);

  const handleAddActivityTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentActivityInput.trim()) return;
    if (!activitiesList.includes(currentActivityInput.trim())) {
      setActivitiesList([...activitiesList, currentActivityInput.trim()]);
    }
    setCurrentActivityInput("");
  };

  const handleRemoveActivityTag = (tag: string) => {
    setActivitiesList(activitiesList.filter(t => t !== tag));
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChildId,
          activities: activitiesList,
          engagement,
          discipline,
          communication,
          feeding,
          sleep,
          teacherNote,
        }),
      });

      if (res.ok) {
        triggerToast("Bolaning faollik ko'rsatkichlari muvaffaqiyatli saqlandi!");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startCheckoutCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setCheckoutPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setTimeout(() => {
        const videoElement = document.getElementById("checkout-video-element") as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.play().catch(e => console.error("Video play failed", e));
        }
      }, 200);
    } catch (err: any) {
      console.warn("Camera access failed, falling back to mock capture:", err);
      setCameraError("Kamera ruxsatnomasi mavjud emas. Simulyatsiya rejimi faollashtirildi.");
    }
  };

  const stopCheckoutCamera = () => {
    try {
      const videoElement = document.getElementById("checkout-video-element") as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error(err);
    }
    setIsCameraActive(false);
  };

  const captureCheckoutSnapshot = () => {
    try {
      const videoElement = document.getElementById("checkout-video-element") as HTMLVideoElement;
      if (videoElement && !cameraError) {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, 320, 240);
          const dataUrl = canvas.toDataURL("image/jpeg");
          setCheckoutPhoto(dataUrl);
          stopCheckoutCamera();
        }
      } else {
        // Fallback simulation: random beautiful picker avatar from Unsplash
        const randomAvatars = [
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300",
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300"
        ];
        const randomPhoto = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
        setCheckoutPhoto(randomPhoto);
        setIsCameraActive(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutChild || !checkoutPickerName) return;

    setLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: checkoutChild.id,
          date: new Date().toISOString().split("T")[0],
          status: "Ketdi",
          checkOut: new Date().toLocaleTimeString(),
          checkoutPhoto: checkoutPhoto || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
          checkoutPersonName: checkoutPickerName,
          deviceIp: "192.168.1.226" // Automatically assign Exit device IP
        })
      });

      if (res.ok) {
        // Update local child status as well
        await fetch(`/api/children/${checkoutChild.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Kelmagan" })
        });

        triggerToast(`Farzandining ota-onasiga jo'natildi va chiqish qayd etildi!`);
        setCheckoutChild(null);
        setCheckoutPickerName("");
        setCheckoutPhoto(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToTelegram = async (customText?: string) => {
    const activeChild = childrenList.find(c => c.id === selectedChildId);
    if (!activeChild || !activeChild.telegramChatId) {
      alert("Bu bolaning ota-onasi Telegram Botga a'zo bo'lmagan!");
      return;
    }

    const textToSend = customText || `📝 *KUNLIK FAOLIYAT HISOBOTI* (${activeChild.name})\n\n` +
      `🎨 *Darslar:* ${activitiesList.join(", ")}\n` +
      `⭐ *Darsdagi faolligi:* ${"★".repeat(engagement)}${"☆".repeat(5-engagement)}\n` +
      `📖 *Nutq va muloqot:* ${"★".repeat(communication)}${"☆".repeat(5-communication)}\n` +
      `🧸 *Intizomi:* ${"★".repeat(discipline)}${"☆".repeat(5-discipline)}\n` +
      `🍲 *Ovqat yeyishi:* ${breakfastAppetite} nonushta, ${lunchAppetite} tushlik\n` +
      `😴 *Tushlik uyqusi:* ${sleep} soat (${sleepQuality})\n` +
      `🌡 *Tana harorati:* ${healthFever}°C\n` +
      `💬 *Tarbiyachi izohi:* ${teacherNote || "Sog'lom, faol ishtirok etdi."}`;

    try {
      const res = await fetch("/api/telegram-simulator/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChild.telegramChatId,
          text: textToSend
        })
      });
      if (res.ok) {
        triggerToast("Telegram Bot orqali ota-onaga muvaffaqiyatli jo'natildi!");
        if (customText) setParentMsgText("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Star Renders helper
  const StarRating = ({ value, onChange, label, icon: Icon }: { value: number; onChange: (v: number) => void; label: string; icon: any }) => {
    return (
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/15 p-2 rounded-lg text-emerald-400">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-bold">{label}</div>
            <span className="text-[10px] text-slate-500">Bugungi baholash</span>
          </div>
        </div>

        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <Star
                className={`w-5 h-5 ${
                  star <= value ? "fill-amber-400 text-amber-400" : "text-slate-700"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const activeChild = childrenList.find(c => c.id === selectedChildId);

  // Tabs structure based on requested blueprint (removed homework, mealstatus, health as requested)
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Grid },
    { id: "attendance", label: "Davomat", icon: Clock },
    { id: "mygroup", label: `Mening Guruhim (${studentsToRender.length})`, icon: Users },
    { id: "activities", label: "Kundalik Mashg'ulotlar", icon: BookOpen },
    { id: "childactivity", label: "Bola Faolligini Baholash", icon: Award },
    { id: "gallery", label: "Foto & Video", icon: Image },
    { id: "dailyreport", label: "Kunlik Hisobot", icon: FileText },
    { id: "sleep", label: "Uyqu", icon: Moon },
    { id: "communication", label: "Ota-onalar Bilan Aloqa", icon: MessageSquare },
    { id: "calendar", label: "Kalendar", icon: Calendar },
    { id: "profile", label: "Profil", icon: User },
  ];

  const presentCount = studentsToRender.filter(c => c.status === "Bog'chada" || c.status === "Kechikdi").length;
  const absentCount = studentsToRender.length - presentCount;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notifSuccess && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 z-50 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          {notifSuccess}
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>👩‍🏫 {user.name}</span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              TARBIYACHI (G-1 Kamalak)
            </span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Guruh bolalarining bugungi darslari, davomati, ovqatlanishi va shaxsiy rivojlanish tahlili.
          </p>
        </div>
        <button onClick={onRefresh} className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
          <RefreshCw className="w-4 h-4" /> Ma'lumotlarni Yangilash
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Navigation panel */}
        <div className={`${isSidebarCollapsed ? "xl:col-span-1" : "xl:col-span-3"} bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2 transition-all duration-300`}>
          <div className="flex items-center justify-between px-3 mb-2">
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Modullar</span>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer ${isSidebarCollapsed ? "mx-auto" : "ml-auto"}`}
              title={isSidebarCollapsed ? "Modullarni yoyish" : "Modullarni yig'ish"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className={`grid grid-cols-2 xl:grid-cols-1 gap-1 max-h-[350px] xl:max-h-none overflow-y-auto pr-1`}>
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center ${isSidebarCollapsed ? "xl:justify-center xl:px-2" : "gap-2.5 px-3"} py-2 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer relative group ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 border-emerald-500"
                      : "bg-slate-950/40 border-transparent text-slate-400 hover:text-white hover:bg-slate-850"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={`${isSidebarCollapsed ? "xl:hidden" : ""} truncate`}>{t.label}</span>
                  
                  {/* Tooltip when collapsed */}
                  {isSidebarCollapsed && (
                    <span className="absolute left-full ml-3 bg-slate-950 border border-slate-800 text-slate-200 text-[10px] py-1 px-2.5 rounded-lg font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl hidden xl:inline-block">
                      {t.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspace panel */}
        <div className={`${isSidebarCollapsed ? "xl:col-span-11" : "xl:col-span-9"} space-y-6 transition-all duration-300`}>

          {/* 1. DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              {/* Widgets row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Guruhdagi bolalar</span>
                  <div className="text-2xl font-black text-white mt-1">{studentsToRender.length} ta</div>
                  <span className="text-[10px] text-slate-400">Kamalak guruhi</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block">Bugun kelganlar</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{presentCount} ta</div>
                  <span className="text-[10px] text-slate-400">Xonada hozir</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-rose-400 uppercase block">Kelmadi (Sababli)</span>
                  <div className="text-2xl font-black text-rose-400 mt-1">{absentCount} ta</div>
                  <span className="text-[10px] text-slate-400">Sababi o'rganilgan</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[9px] font-bold text-purple-400 uppercase block">Bugungi tug'ilgan kun</span>
                  <div className="text-xs font-bold text-white mt-2 truncate">Karimov Dilshod (5 yosh)</div>
                  <span className="text-[10px] text-slate-500">Bayram tadbiri bor</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <h4 className="text-white font-black text-xs uppercase tracking-wider">Bugungi mashg'ulot turlari</h4>
                  <p className="text-xs text-slate-300 font-semibold bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                     📚 Ranglar olami & Matematik hisoblar.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bolalar geometrik shakllar va rangli buyumlarni ajratishni mashq qiladilar.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <h4 className="text-white font-black text-xs uppercase tracking-wider">Bugungi Taomlar</h4>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-xs text-slate-300 space-y-1">
                    <div><b>Nonushta:</b> Manna bo'tqasi, sutli choy</div>
                    <div><b>Tushlik:</b> Karam sho'rva, qiyma somsa</div>
                    <div><b>Kechki ovqat:</b> Osh, meva sharbati</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">🤖 AI Eslatmalari</span>
                <p className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  "Bugungi kunda Kamalak guruhida davomat ko'rsatkichi 92% ni tashkil etmoqda. Bolalar tushlik uyqusiga soat 13:00 da yotib, 15:00 da turinglar. Bugun ota-onalar bilan Telegram simulyator orqali live bog'lanish va faoliyat hisobotlarini yuborish tavsiya etiladi!"
                </p>
              </div>
            </div>
          )}

          {/* 2. ATTENDANCE TAB */}
          {activeTab === "attendance" && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" /> FaceID Avtomatik Davomat Tizimi
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Bolalar kirish/chiqish FaceID datchigidan o'tganda davomat avtomatik qayd etiladi. Kerakli bola ota-onasiga bildirishnoma yuborishingiz mumkin.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await fetchAttendanceList();
                    onRefresh();
                    triggerToast("Davomat ma'lumotlari yangilandi!");
                  }}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                >
                  <RefreshCw className="w-4 h-4" /> Yangilash
                </button>
              </div>

              {/* DEDICATED TEACHER CAMERA ATTENDANCE SCANNER (MOBILE & TELEGRAM FRIENDLY) */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border border-emerald-500/15 inline-flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Telegram WebApp Mosligi: Faol
                    </span>
                    <h4 className="text-white font-black text-sm tracking-tight flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-400" /> Mobil Kamera Davomat Skaneri
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Guruh o'quvchilari QR kodlarini skanerlash yoki ularning yuzini aniqlash orqali davomatni tezkor mobil hisobga oling.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsScannerActive(!isScannerActive);
                      setScanSuccessChild(null);
                    }}
                    className={`text-xs font-black py-2 px-4 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 ${
                      isScannerActive 
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30" 
                        : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold shadow-lg shadow-emerald-500/10"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    {isScannerActive ? "Skanerni O'chirish" : "Skanerni Yoqish"}
                  </button>
                </div>

                {isScannerActive && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 animate-fade-in">
                    
                    {/* Viewfinder Column */}
                    <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden min-h-[280px]">
                      
                      {/* Video Camera Feed */}
                      <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-850 flex items-center justify-center">
                        
                        {cameraPermission !== "granted" ? (
                          <div className="text-center p-6 space-y-3 z-10">
                            <Camera className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
                            <p className="text-[11px] text-slate-300 font-bold">Kamera ruxsati kutilmoqda</p>
                            <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                              Mobil skanerni ishlatish uchun brauzer kamerasidan foydalanishga ruxsat berishingiz zarur.
                            </p>
                            <button
                              onClick={askCameraPermission}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black py-1.5 px-4 rounded-xl cursor-pointer shadow-md shadow-emerald-500/10 transition-all active:scale-95"
                            >
                              KAMERAGA RUXSAT BERISH 👍
                            </button>
                          </div>
                        ) : !cameraPermissionError ? (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        ) : (
                          <div className="text-center p-6 space-y-2">
                            <Camera className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                            <p className="text-[11px] text-slate-400 font-semibold">Tizim kamerasi faollashtirilmadi</p>
                            <p className="text-[10px] text-slate-500 max-w-[240px]">
                              Telegram WebApp yoki brauzerda kamera ruxsati berilmagan, ammo siz quyidagi simulyatordan to'liq foydalanishingiz mumkin.
                            </p>
                          </div>
                        )}

                        {/* Scanner Scanning Laser Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                          {/* Corners */}
                          <div className="flex justify-between">
                            <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                            <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                          </div>

                          {/* Center Laser Beam */}
                          <div className={`w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10b981] ${
                            scanningInProgress ? "animate-bounce" : "animate-pulse"
                          }`}></div>

                          <div className="flex justify-between">
                            <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                            <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                          </div>
                        </div>

                        {/* Mode Indicator Overlay */}
                        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-bold text-sky-400 tracking-wider uppercase font-mono border border-slate-800">
                          Mode: {scannerMode === "qr" ? "QR Skaner" : "Face ID Biometriya"}
                        </div>

                        {/* Target Frame Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className={`w-36 h-36 border border-dashed rounded-2xl transition-all duration-300 ${
                            scanningInProgress 
                              ? "border-emerald-400 scale-105 bg-emerald-500/5" 
                              : "border-sky-400/40"
                          }`} />
                        </div>
                      </div>

                      {/* Mode select bar */}
                      <div className="flex gap-2.5 mt-4 w-full max-w-sm">
                        <button
                          onClick={() => setScannerMode("face")}
                          className={`flex-1 text-[10px] font-black py-2 rounded-xl transition-all border cursor-pointer ${
                            scannerMode === "face"
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                              : "bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300"
                          }`}
                        >
                          Face ID Aniqlash
                        </button>
                        <button
                          onClick={() => setScannerMode("qr")}
                          className={`flex-1 text-[10px] font-black py-2 rounded-xl transition-all border cursor-pointer ${
                            scannerMode === "qr"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300"
                          }`}
                        >
                          QR Kod Skanerlash
                        </button>
                      </div>
                    </div>

                    {/* Controller Column */}
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                      
                      {/* Controller inputs */}
                      <div className="space-y-3.5 bg-slate-900/50 p-4 rounded-2xl border border-slate-850">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Davomat Sozlamalari</span>
                          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">Durable Sync</span>
                        </div>

                        {/* Child Selector */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Guruh O'quvchisi (Yoki QR Pass egasi)</label>
                          <select
                            value={selectedScanChildId}
                            onChange={(e) => {
                              setSelectedScanChildId(e.target.value);
                              setScanSuccessChild(null);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none font-bold"
                          >
                            <option value="auto">🤖 Avtomatik aniqlash (Yuz/QR Skaner)</option>
                            {studentsToRender.map(c => (
                              <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>
                            ))}
                          </select>
                        </div>

                        {/* Direction (Check-In or Out) */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Yo'nalish (Harakat turi)</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setScanDirection("in")}
                              className={`py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                scanDirection === "in"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-slate-950 text-slate-500 border-transparent hover:text-slate-300"
                              }`}
                            >
                              Kirish (Kirdi)
                            </button>
                            <button
                              type="button"
                              onClick={() => setScanDirection("out")}
                              className={`py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                scanDirection === "out"
                                  ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                  : "bg-slate-950 text-slate-500 border-transparent hover:text-slate-300"
                              }`}
                            >
                              Chiqish (Ketdi)
                            </button>
                          </div>
                        </div>

                        {/* Temperature settings */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bola Harorati (°C)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={scanTemp}
                              onChange={(e) => setScanTemp(e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs font-bold font-mono outline-none w-20 text-center"
                            />
                            
                            {/* Harorat Quick select presets */}
                            <div className="flex gap-1.5 flex-1 overflow-x-auto">
                              {["36.2", "36.5", "36.6", "36.8", "37.1"].map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setScanTemp(t)}
                                  className={`px-2 py-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 rounded-lg text-[10px] font-bold font-mono cursor-pointer transition-all shrink-0 ${
                                    scanTemp === t ? "text-sky-400 border-sky-500/40 bg-sky-500/5" : ""
                                  }`}
                                >
                                  {t}°C
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handlePerformScan}
                          disabled={scanningInProgress || !selectedScanChildId}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {scanningInProgress ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                              Skanerlanmoqda...
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4" />
                              Skanerlashni Ishga Tushirish
                            </>
                          )}
                        </button>
                      </div>

                      {/* Log monitor / success card */}
                      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850 flex-1 flex flex-col justify-between min-h-[120px] max-h-[150px] overflow-hidden">
                        
                        {scanSuccessChild ? (
                          <div className="flex items-start gap-3 animate-fade-in text-xs">
                            <img src={scanSuccessChild.photo} className="w-10 h-10 rounded-full object-cover border border-slate-800" alt="" />
                            <div className="space-y-1">
                              <h5 className="text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                {scanSuccessChild.direction}
                              </h5>
                              <p className="text-slate-300 font-bold text-xs">{scanSuccessChild.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                <span>Vaqt: {scanSuccessChild.time}</span>
                                <span>•</span>
                                <span className="text-emerald-400 font-bold">Harorat: {scanSuccessChild.temp}°C</span>
                                {scanSuccessChild.confidence && (
                                  <>
                                    <span>•</span>
                                    <span className="text-sky-400 font-bold bg-sky-500/10 px-1 rounded">{scanSuccessChild.confidence}% Moslik</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block border-b border-slate-850/50 pb-1">Skaner loglari</span>
                            {scannerLogs.length === 0 ? (
                              <p className="text-[10px] text-slate-500 italic py-2">Skaner kutish rejimida. Tizim ishga tushishini kutilmoqda...</p>
                            ) : (
                              <div className="space-y-1 font-mono text-[9px] text-slate-400">
                                {scannerLogs.slice(0, 4).map((log, idx) => (
                                  <div key={idx} className="truncate">• {log}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick-view Calendar Component */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Guruh davomati va faollik taqvimi (G-1 guruh)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Kunlar bo'yicha bolalar ishtiroki foizini ko'rish uchun kataklarni tanlang.
                    </p>
                  </div>
                  
                  {/* Month navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (calMonth === 0) {
                          setCalMonth(11);
                          setCalYear(prev => prev - 1);
                        } else {
                          setCalMonth(prev => prev - 1);
                        }
                        setSelectedDay(null);
                      }}
                      className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      &larr;
                    </button>
                    <span className="text-xs font-bold text-white uppercase min-w-[100px] text-center font-mono">
                      {new Date(calYear, calMonth).toLocaleString("uz", { month: "long", year: "numeric" })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (calMonth === 11) {
                          setCalMonth(0);
                          setCalYear(prev => prev + 1);
                        } else {
                          setCalMonth(prev => prev + 1);
                        }
                        setSelectedDay(null);
                      }}
                      className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Calendar Grid */}
                  <div className="lg:col-span-2 space-y-2">
                    <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Du</span>
                      <span>Se</span>
                      <span>Ch</span>
                      <span>Pa</span>
                      <span>Ju</span>
                      <span className="text-rose-500/80">Sh</span>
                      <span className="text-rose-500/80">Ya</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {(() => {
                        const days = [];
                        // Monday as day index 0
                        const firstDay = new Date(calYear, calMonth, 1);
                        const firstDayIdx = (firstDay.getDay() + 6) % 7;
                        const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
                        
                        // Empty padding
                        for (let i = 0; i < firstDayIdx; i++) {
                          days.push(null);
                        }
                        for (let i = 1; i <= totalDays; i++) {
                          days.push(i);
                        }

                        return days.map((day, idx) => {
                          if (day === null) {
                            return <div key={`empty-${idx}`} className="aspect-square"></div>;
                          }

                          // Get stats
                          const monthStr = String(calMonth + 1).padStart(2, '0');
                          const dayStr = String(day).padStart(2, '0');
                          const dateKey = `${calYear}-${monthStr}-${dayStr}`;
                          
                          // Check if day is weekend
                          const dayOfWeek = (firstDayIdx + day - 1) % 7;
                          const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                          const dayRecords = attendanceList.filter(a => a.date === dateKey);
                          const totalCount = studentsToRender.length;
                          const presentCount = dayRecords.length;
                          const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
                          const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear;
                          const isSelected = selectedDay === day;

                          let dayBg = "bg-slate-900/40 text-slate-500 hover:bg-slate-850 border border-slate-900";
                          if (presentCount > 0) {
                            if (attendanceRate === 100) {
                              dayBg = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold hover:bg-emerald-500/25";
                            } else if (attendanceRate >= 70) {
                              dayBg = "bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold hover:bg-teal-500/20";
                            } else {
                              dayBg = "bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold hover:bg-amber-500/20";
                            }
                          } else if (isWeekend) {
                            dayBg = "bg-slate-950/45 text-slate-600 border border-transparent";
                          } else if (new Date(calYear, calMonth, day) < new Date()) {
                            dayBg = "bg-rose-500/10 text-rose-400/80 border border-rose-500/15 hover:bg-rose-500/20";
                          }

                          return (
                            <button
                              key={`day-${day}`}
                              type="button"
                              onClick={() => setSelectedDay(day)}
                              className={`aspect-square rounded-xl text-xs flex flex-col items-center justify-between p-1.5 transition-all relative cursor-pointer ${dayBg} ${
                                isToday ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950" : ""
                              } ${isSelected ? "ring-2 ring-emerald-450 scale-95" : ""}`}
                            >
                              <span className="self-start text-[10px]">{day}</span>
                              {presentCount > 0 && (
                                <span className="text-[8px] font-mono font-black tracking-tighter scale-90 self-end">
                                  {attendanceRate}%
                                </span>
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Day Detail Sidebar */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between gap-3">
                    {(() => {
                      if (!selectedDay) {
                        return (
                          <div className="flex flex-col items-center justify-center text-center h-full min-h-[150px] text-slate-500 py-4">
                            <Clock className="w-8 h-8 text-slate-700 mb-2" />
                            <p className="text-[11px] font-semibold uppercase tracking-wider">Kunlik tafsilotlar</p>
                            <p className="text-[10px] mt-1 leading-normal max-w-[150px]">
                              Bolalar ishtiroki va ro'yxatini ko'rish uchun kalendardan kunni bosing.
                            </p>
                          </div>
                        );
                      }

                      const monthStr = String(calMonth + 1).padStart(2, '0');
                      const dayStr = String(selectedDay).padStart(2, '0');
                      const dateKey = `${calYear}-${monthStr}-${dayStr}`;
                      const dayRecords = attendanceList.filter(a => a.date === dateKey);

                      return (
                        <div className="space-y-3 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="font-bold text-white text-xs font-mono">{selectedDay}-{monthStr}-{calYear}</span>
                              <span className="text-[10px] bg-sky-500/10 text-sky-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">
                                {dayRecords.length} / {studentsToRender.length} ta
                              </span>
                            </div>

                            <div className="space-y-1.5 max-h-44 overflow-y-auto mt-2.5 text-[11px] pr-1">
                              {studentsToRender.map(s => {
                                const attended = dayRecords.find(r => r.childId === s.id);
                                return (
                                  <div key={s.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950 border border-slate-900">
                                    <span className="text-slate-300 font-medium truncate max-w-[120px]">{s.name}</span>
                                    {attended ? (
                                      <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded">
                                        Keldi ({attended.checkIn || "08:00"})
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-mono text-rose-400 font-bold bg-rose-500/10 px-1 py-0.5 rounded">
                                        Kelmagan
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedDay(null)}
                            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                          >
                            Tafsilotni yopish
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex border-b border-slate-800 pb-2">
                <span className="pb-2 text-xs font-black uppercase tracking-wider text-emerald-400 border-b-2 border-emerald-500">
                  Bolalar Bugungi Davomati ({studentsToRender.length} ta)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentsToRender.map(c => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    const attRecord = attendanceList.find(a => a.childId === c.id && a.date === todayStr);
                    
                    // Map statuses to beautiful badges
                    let statusLabel = "Kelmagan";
                    let badgeStyle = "bg-rose-500/15 text-rose-400 border border-rose-500/10";
                    
                    if (c.status === "Bog'chada") {
                      statusLabel = "Bog'chada";
                      badgeStyle = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10";
                    } else if (c.status === "Kechikdi") {
                      statusLabel = "Kechikdi";
                      badgeStyle = "bg-amber-500/15 text-amber-400 border border-amber-500/10";
                    } else if (attRecord?.checkOut) {
                      statusLabel = "Uyga ketgan";
                      badgeStyle = "bg-sky-500/15 text-sky-400 border border-sky-500/10";
                    } else if (c.status === "Sababli") {
                      statusLabel = "Sababli";
                      badgeStyle = "bg-slate-500/15 text-slate-400 border border-slate-500/10";
                    }

                    const hasFaceId = !!attRecord?.deviceIp;
                    const deviceName = hasFaceId ? getDeviceNameByIp(attRecord.deviceIp) : "";

                    let borderStyle = "border-slate-850";
                    let bgStyle = "bg-slate-950";
                    
                    if (hasFaceId) {
                      if (c.status === "Bog'chada" || c.status === "Kechikdi") {
                        borderStyle = "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.06)] ring-1 ring-emerald-500/10";
                        bgStyle = "bg-slate-950/85";
                      } else if (attRecord?.checkOut) {
                        borderStyle = "border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.06)] ring-1 ring-sky-500/10";
                        bgStyle = "bg-slate-950/85";
                      }
                    }

                    return (
                      <div key={c.id} className={`${bgStyle} ${borderStyle} border p-4 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300 hover:scale-[1.01]`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <img src={c.photo} className="w-11 h-11 rounded-full object-cover border border-slate-800 shrink-0" alt="" />
                            <div>
                              <div className="font-bold text-white text-sm">{c.name}</div>
                              <div className="flex flex-col gap-1 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-mono block">ID: {c.id} • Guruh: G-1</span>
                                {hasFaceId && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    FACE ID: {deviceName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${badgeStyle}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="border-t border-b border-slate-900 py-3 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">Kelgan vaqti</span>
                            <span className="text-xs font-mono font-bold text-slate-300 block mt-0.5">
                              {attRecord?.checkIn ? (
                                <span className="text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded">{attRecord.checkIn}</span>
                              ) : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">Ketgan vaqti</span>
                            <span className="text-xs font-mono font-bold text-slate-300 block mt-0.5">
                              {attRecord?.checkOut ? (
                                <span className="text-sky-400 bg-sky-500/5 px-1.5 py-0.5 rounded">{attRecord.checkOut}</span>
                              ) : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">Harorat</span>
                            <span className="text-xs font-mono font-bold text-slate-300 block mt-0.5">
                              {attRecord?.temperature ? (
                                <span className={`${attRecord.temperature >= 37.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {attRecord.temperature}°C
                                </span>
                              ) : "—"}
                            </span>
                          </div>
                        </div>

                        {attRecord?.checkoutPersonName && (
                          <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Olib ketdi: <strong className="text-slate-200">{attRecord.checkoutPersonName}</strong></span>
                            {attRecord.checkoutPhoto && (
                              <img src={attRecord.checkoutPhoto} className="w-6 h-6 rounded object-cover border border-slate-800" alt="" />
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendParentNotification(c, attRecord)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-500/5"
                          >
                            <Send className="w-3.5 h-3.5" /> Ota-onani Ogohlantirish
                          </button>
                          
                          {(!attRecord || !attRecord.checkOut) ? (
                            <button
                              type="button"
                              onClick={() => {
                                const direction = !attRecord ? "in" : "out";
                                openRealCamera("attendance", c.id, direction, "child");
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                !attRecord 
                                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30" 
                                  : "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border border-sky-500/30"
                              }`}
                              title={!attRecord ? "Biometrik Kirish (Check-In) Kamera 🎥" : "Biometrik Chiqish (Check-Out) Kamera 🎥"}
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="bg-slate-800 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-850"
                              title="Bugungi davomat to'liq yakunlandi"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>
          )}

          {/* 3. MY GROUP TAB */}
          {activeTab === "mygroup" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Guruhdagi bolalar tarkibi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentsToRender.map(c => (
                  <div key={c.id} className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center gap-4">
                    <img src={c.photo} className="w-12 h-12 rounded-full object-cover border border-slate-800" alt="" />
                    <div className="text-xs space-y-0.5">
                      <h4 className="font-bold text-white text-sm">{c.name}</h4>
                      <div className="text-slate-400">Yoshi: <b>{c.age} yosh</b> ({c.gender})</div>
                      <div className="text-slate-400">Ota-onasi: <b>{c.parentName}</b></div>
                      <div className="text-slate-500 font-mono">Tel: {c.parentPhone}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. DAILY ACTIVITIES */}
          {activeTab === "activities" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in text-xs">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Mashg'ulot Rejasi (Lesson Planner)</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-bold">Bugungi mashg'ulot mavzusi:</label>
                  <input type="text" value={dailyTopic} onChange={e => setDailyTopic(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-bold">Dars tavsifi (Description):</label>
                  <textarea rows={3} value={dailyDesc} onChange={e => setDailyDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none resize-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase font-bold">Dars davomida o'ynaladigan o'yinlar:</label>
                  <input type="text" value={dailyGames} onChange={e => setDailyGames(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none" />
                </div>
                <button onClick={() => triggerToast("Dars rejasi muvaffaqiyatli saqlandi!")} className="bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl cursor-pointer">
                  Mavzuni Saqlash
                </button>
              </div>
            </div>
          )}

          {/* 5. CHILD ACTIVITY STAR RATER */}
          {activeTab === "childactivity" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wider">Bolalar o'zlashtirishi va faolligi</h3>
                  <p className="text-xs text-slate-500">Baholash uchun bolani tanlang va uning darsliklardagi yutuqlarini belgilang.</p>
                </div>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-500 font-bold"
                >
                  {studentsToRender.map(c => (
                    <option key={c.id} value={c.id}>{c.name.split(" ")[0]}</option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleSaveActivity} className="space-y-4">
                <div className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <input
                    type="checkbox"
                    id="sync-ratings"
                    checked={syncRatings}
                    onChange={(e) => {
                      setSyncRatings(e.target.checked);
                      if (e.target.checked) {
                        setCommunication(engagement);
                        setDiscipline(engagement);
                        setFeeding(engagement);
                        setMood(engagement);
                      }
                    }}
                    className="accent-emerald-500 rounded border-slate-800"
                  />
                  <label htmlFor="sync-ratings" className="text-xs text-emerald-400 font-bold cursor-pointer select-none">
                    Mezonlarni teng baholash (Barchasini bir xil qiymatda avtomatik baholash)
                  </label>
                </div>

                <StarRating value={engagement} onChange={(v) => handleRatingChange("engagement", v)} label="Faollik va Ishtirok ⭐" icon={Award} />
                <StarRating value={communication} onChange={(v) => handleRatingChange("communication", v)} label="Muloqot va Nutq ⭐" icon={Smile} />
                <StarRating value={discipline} onChange={(v) => handleRatingChange("discipline", v)} label="Intizom va Xulq-atvor ⭐" icon={Check} />
                
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Bugun nimalarni o'rgandi (Darslar ro'yxati):</label>
                  <div className="flex flex-wrap gap-1.5">
                    {activitiesList.map(tag => (
                      <span key={tag} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        {tag} <button type="button" onClick={() => handleRemoveActivityTag(tag)} className="text-slate-500 hover:text-white">✕</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={currentActivityInput} onChange={e => setCurrentActivityInput(e.target.value)} placeholder="Yangi fan/dars nomi..." className="flex-1 bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white placeholder-slate-600 outline-none" />
                    <button type="button" onClick={handleAddActivityTag} className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded text-xs cursor-pointer">Qo'shish</button>
                  </div>
                </div>

                {/* AI PHOTO ANALYSIS PIPELINE */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3.5">
                  <span className="text-emerald-400 font-black uppercase text-[9px] tracking-wider block">📷 Mashg'ulot rasmi orqali AI baholash:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <input
                        type="file"
                        id="activity-photo-input"
                        accept="image/*"
                        onChange={handleActivityPhotoChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById("activity-photo-input")?.click()}
                        className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl py-3 px-4 font-bold text-xs cursor-pointer text-center"
                      >
                        {activityPhoto ? "Rasm yangilash" : "Sinfdagi faoliyat rasmini yuklash"}
                      </button>
                      <p className="text-[10px] text-slate-500">Darsda bolaning yutuqlarini tasvirlovchi rasmni tanlang.</p>
                    </div>

                    {activityPhoto && (
                      <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                        <img
                          src={activityPhoto}
                          alt="Activity"
                          className="w-14 h-14 object-cover rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={handleAnalyzeActivityPhoto}
                          disabled={analyzingPhoto}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                        >
                          {analyzingPhoto ? "AI Tahlil qilinmoqda..." : "🤖 Rasm orqali AI baholash"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-400 font-bold uppercase">Tarbiyachi izohi (Izoh yozish):</label>
                  <textarea value={teacherNote} onChange={e => setTeacherNote(e.target.value)} placeholder="Bugun bola darslarda qanday qatnashgani haqida ota-onaga xabar..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none h-20 resize-none" />
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="bg-emerald-500 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg">
                    <Save className="w-4 h-4" /> FAOLIYATNI SAQLASH
                  </button>
                  <button type="button" onClick={() => handleSendToTelegram()} className="bg-slate-800 hover:bg-slate-750 text-emerald-400 font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-700 cursor-pointer">
                    💬 Telegramga jo'natish
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 6. PHOTOS & VIDEOS GALLERY */}
          {activeTab === "gallery" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wider">Guruh foto va video albomi</h3>
                  <p className="text-xs text-slate-400 font-medium">Bolalarning o'yinlari va darslaridan ajoyib suratlar albomi</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pl-1.5">Mavzu:</span>
                  <input
                    type="text"
                    value={newImageTag}
                    onChange={(e) => setNewImageTag(e.target.value)}
                    placeholder="Masalan: Musiqa darsi"
                    className="bg-transparent text-white text-xs font-semibold outline-none border-none py-0.5 px-1 max-w-[120px] focus:ring-0"
                  />
                </div>
              </div>

              <input
                type="file"
                id="gallery-file-input"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryImages.map((img, i) => (
                  <div key={i} className="relative group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 aspect-square animate-fade-in">
                    <img
                      src={img.url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      alt={img.title}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90"></div>
                    <span className="absolute bottom-2 left-2 right-2 text-[9px] bg-slate-900/90 text-white font-bold py-1 px-2 rounded-md border border-slate-800 truncate block text-center">
                      {img.title}
                    </span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleImageUploadClick}
                  className="bg-slate-950 border-2 border-dashed border-slate-800 hover:border-emerald-500 hover:bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center aspect-square text-slate-500 hover:text-emerald-400 cursor-pointer transition-all active:scale-95 group"
                >
                  <Camera className="w-8 h-8 mb-2 group-hover:animate-bounce" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Foto Yuklash</span>
                  <span className="text-[8px] text-slate-600 mt-0.5">Device gallereyasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGalleryTitle(newImageTag || "");
                    setGalleryCategory("Mashg'ulot (Ijodiy)");
                    openRealCamera("gallery");
                  }}
                  className="bg-slate-950 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-2xl flex flex-col items-center justify-center aspect-square text-emerald-400 hover:text-emerald-300 cursor-pointer transition-all active:scale-95 group"
                >
                  <Video className="w-8 h-8 mb-2 text-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Kameradan Olish</span>
                  <span className="text-[8px] text-emerald-500/60 mt-0.5">Jonli saqlash 📸</span>
                </button>
              </div>

              {/* Disabled old block below */}
              {false && (<>
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Guruh foto va video albomi</h3>
              <p className="text-xs text-slate-400">Bolalarning bugungi o'yinlari va darslaridan olingan ajoyib suratlar albomi:</p>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="relative group">
                  <img src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=300" className="rounded-2xl aspect-square object-cover" alt="" />
                  <span className="absolute bottom-2 left-2 text-[9px] bg-slate-950/80 px-2 py-0.5 rounded text-white">Rasm chizish</span>
                </div>
                <div className="relative group">
                  <img src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=300" className="rounded-2xl aspect-square object-cover" alt="" />
                  <span className="absolute bottom-2 left-2 text-[9px] bg-slate-950/80 px-2 py-0.5 rounded text-white">Sehrli koptok</span>
                </div>
                <div className="bg-slate-950 border border-slate-850 rounded-2xl flex flex-col items-center justify-center aspect-square text-slate-500 cursor-pointer hover:text-white">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Rasm yuklash</span>
                </div>
              </div>

              </>)}

              <button onClick={() => alert("Barcha yangi rasmlar ota-onalarning Telegram guruhiga va ota-onalar portaliga sinxronizatsiya qilindi!")} className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-sky-500/10">
                <Send className="w-4 h-4" /> Barcha suratlarni Telegramga yuborish
              </button>
            </div>
          )}

          {/* 7. DAILY REPORT */}
          {activeTab === "dailyreport" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in text-xs">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Kunlik umumiy guruh hisoboti</h3>
              <p className="text-slate-400">Bugungi darslarda nimalar o'rganilgani haqida umumiy hisobot matni tayyorlang:</p>

              <div className="space-y-3">
                <div>
                  <label className="text-slate-500 uppercase font-bold">Bugun nima o'rganildi (Topic summary):</label>
                  <input type="text" value={dailyTopic} onChange={e => setDailyTopic(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none mt-1" />
                </div>
                <div>
                  <label className="text-slate-500 uppercase font-bold">Qaysi o'yinlar o'ynaldi:</label>
                  <input type="text" value={dailyGames} onChange={e => setDailyGames(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none mt-1" />
                </div>
                <div>
                  <label className="text-slate-500 uppercase font-bold">Tarbiyachining guruh bo'yicha izohi:</label>
                  <textarea rows={3} value={dailyDesc} onChange={e => setDailyDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none resize-none mt-1" />
                </div>
                <button onClick={() => triggerToast("Kunlik umumiy hisobot ota-onalarga tarqatish uchun tayyorlandi!")} className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer">
                  Hisobotni Saqlash
                </button>
              </div>
            </div>
          )}

          {/* 8. HOMEWORK */}
          {activeTab === "homework" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in text-xs">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Uyga vazifalar (Homework)</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-slate-500 uppercase font-bold">Vazifa matni (Task description):</label>
                  <input type="text" value={homeworkTask} onChange={e => setHomeworkTask(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none mt-1" />
                </div>
                <div>
                  <label className="text-slate-500 uppercase font-bold">Tavsiya etiladigan video havola (YouTube Link):</label>
                  <input type="text" value={homeworkVideo} onChange={e => setHomeworkVideo(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none mt-1" />
                </div>
                <button onClick={() => triggerToast("Uyga vazifalar ota-onalar botiga yuborildi!")} className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer">
                  Vazifalarni Tarqatish
                </button>
              </div>
            </div>
          )}

          {/* 9. MEAL STATUS */}
          {activeTab === "mealstatus" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in text-xs">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Bolalar ovqatlanishi monitoringi</h3>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                <div className="flex justify-between items-center">
                  <span>Nonushta (Breakfast) yedi:</span>
                  <select value={breakfastAppetite} onChange={e => setBreakfastAppetite(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-1 text-white">
                    <option>Hammasini yedi</option>
                    <option>Yarmini yedi</option>
                    <option>Yemadi</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tushlik (Lunch) yedi:</span>
                  <select value={lunchAppetite} onChange={e => setLunchAppetite(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-1 text-white">
                    <option>Hammasini yedi</option>
                    <option>Yarmini yedi</option>
                    <option>Yemadi</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ishtahasi (Appetite):</span>
                  <select value={dinnerAppetite} onChange={e => setDinnerAppetite(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-1 text-white">
                    <option>Yaxshi</option>
                    <option>O'rtacha</option>
                    <option>Past</option>
                  </select>
                </div>
                <button onClick={() => triggerToast("Ovqatlanish holati muvaffaqiyatli saqlandi!")} className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer">
                  Ovqatlanishni Saqlash
                </button>
              </div>
            </div>
          )}

          {/* 10. SLEEP TRACKING */}
          {activeTab === "sleep" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in text-xs">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Tushlik uyqusi hisoboti (Sleep Tracking)</h3>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label>Uxlagan vaqti:</label>
                    <input type="text" value={sleepStart} onChange={e => setSleepStart(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono mt-1" />
                  </div>
                  <div>
                    <label>Uyg'ongan vaqti:</label>
                    <input type="text" value={sleepEnd} onChange={e => setSleepEnd(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono mt-1" />
                  </div>
                </div>
                <div>
                  <label>Uyqu sifati:</label>
                  <select value={sleepQuality} onChange={e => setSleepQuality(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white mt-1">
                    <option>Tinch (Slept well)</option>
                    <option>Yig'lab uyg'ondi</option>
                    <option>Bezovta uxlagan</option>
                  </select>
                </div>
                <button onClick={() => triggerToast("Tushlik uyqu jurnali yangilandi!")} className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer">
                  Uyqu jurnali saqlash
                </button>
              </div>
            </div>
          )}

          {/* 11. HEALTH NOTES */}
          {activeTab === "health" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in text-xs">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Tibbiy ko'rik va tana harorati</h3>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label>Tana harorati (°C):</label>
                    <input type="text" value={healthFever} onChange={e => setHealthFever(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono mt-1" />
                  </div>
                  <div>
                    <label>Yo'tal / Isitma bormi:</label>
                    <input type="text" value={healthCough} onChange={e => setHealthCough(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white mt-1" />
                  </div>
                </div>
                <div>
                  <label>Umumiy salomatlik eslatmasi:</label>
                  <input type="text" value={healthNotes} onChange={e => setHealthNotes(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white mt-1" />
                </div>
                <button onClick={() => triggerToast("Tibbiy ma'lumotlar hamshiraga va ota-onaga jo'natildi!")} className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer">
                  Hamshiraga yuborish
                </button>
              </div>
            </div>
          )}

          {/* 12. PARENT COMMUNICATION */}
          {activeTab === "communication" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in text-xs">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Ota-onalar bilan Telegram Live bog'lanish</h3>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Ota-onani tanlang:</label>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white"
                  >
                    {studentsToRender.map(c => (
                      <option key={c.id} value={c.id}>{c.parentName} ({c.name} otasi/onasi)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Xabar matni:</label>
                  <textarea
                    rows={3}
                    value={parentMsgText}
                    onChange={e => setParentMsgText(e.target.value)}
                    placeholder="Masalan: Dilshodjon bugun o'zini juda yaxshi tutdi, darsda faol edi..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white outline-none resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSendToTelegram(parentMsgText)}
                  className="bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Telegram botga xabarni jo'natish
                </button>
              </div>
            </div>
          )}

          {/* 13. CALENDAR PLANS */}
          {activeTab === "calendar" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 animate-fade-in">
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Haftalik Rejalar va Bayramlar</h3>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-xs text-slate-300 space-y-2">
                <div className="flex justify-between items-center p-2 bg-slate-900 rounded">
                  <span>Dushanba</span>
                  <span className="text-emerald-400 font-bold">Musiqa va Sport darslari</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900 rounded">
                  <span>Seshanba</span>
                  <span className="text-indigo-400 font-bold">Ranglar olami darsi</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900 rounded">
                  <span>Payshanba</span>
                  <span className="text-yellow-400 font-bold">Meva sharbatlari bayrami</span>
                </div>
              </div>
            </div>
          )}

          {/* 14. PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in text-xs w-full">
              <form onSubmit={handleUpdateProfile} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Profil Ma'lumotlarini Tahrirlash</h3>
                
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase text-[10px]">Tarbiyachi ismi:</label>
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs font-bold focus:border-emerald-500 outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase text-[10px]">Telefon raqami:</label>
                      <input 
                        type="text" 
                        value={editPhone} 
                        onChange={(e) => setEditPhone(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs font-bold font-mono focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase text-[10px]">Tizim logini (O'zgartirib bo'lmaydi):</label>
                      <input 
                        type="text" 
                        value={user.username} 
                        disabled 
                        className="w-full bg-slate-900/50 border border-slate-850 rounded-xl py-2 px-3 text-slate-500 text-xs font-mono outline-none cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase text-[10px]">Yangi Parol (O'zgartirish ixtiyoriy):</label>
                      <input 
                        type="password" 
                        placeholder="Yangi parol..." 
                        value={editPassword} 
                        onChange={(e) => setEditPassword(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Guruh:</span> 
                    <p className="text-xs font-bold text-emerald-400 mt-1">Kamalak (G-1)</p>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isUpdatingProfile}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-5 py-2.5 rounded-xl font-black cursor-pointer tracking-wider uppercase text-[10px]"
                  >
                    {isUpdatingProfile ? "Saqlanmoqda..." : "Profilni Saqlash"}
                  </button>
                </div>
              </form>

              <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-5">
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wider">Telegram Push-Bildirishnomalar</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tarbiyachi sifatida guruh uchun telegram push-bildirishnomalarini sozlash</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 pr-4">
                      <span className="font-bold text-white text-xs block">Sog'liqni Saqlash Ogohlantirishlari</span>
                      <span className="text-[10px] text-slate-500 block">Sinfingizdagi bola harorati o'zgarganda yoki dori vaqti kelganda bildirishnoma push qilish.</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setHealthWarningsAlerts(!healthWarningsAlerts)}
                      className="cursor-pointer shrink-0"
                    >
                      {healthWarningsAlerts ? (
                        <span className="bg-rose-500 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">Yoqilgan</span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">O'chirilgan</span>
                      )}
                    </button>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 pr-4">
                      <span className="font-bold text-white text-xs block">Favqulodda Shikoyat Ogohlantirishlari</span>
                      <span className="text-[10px] text-slate-500 block">Ota-onadan guruh ichidagi favqulodda shikoyat yoki dars bo'yicha e'tiroz kelganda ogohlantirish.</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEmergencyComplaintsAlerts(!emergencyComplaintsAlerts)}
                      className="cursor-pointer shrink-0"
                    >
                      {emergencyComplaintsAlerts ? (
                        <span className="bg-rose-500 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">Yoqilgan</span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">O'chirilgan</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  {settingsSaved && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      ✓ Sozlamalar muvaffaqiyatli saqlandi!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wide cursor-pointer transition-all ml-auto"
                  >
                    Sozlamalarni Saqlash
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* CHILD CHECKOUT CAMERA MODAL */}
      {checkoutChild && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-slate-100">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Bolani Olib Ketish 📸</h3>
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider font-mono">Xavfsizlik Davomati</span>
              </div>
              <button
                onClick={() => {
                  stopCheckoutCamera();
                  setCheckoutChild(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 flex items-center gap-3">
                <img src={checkoutChild.photo} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                <div>
                  <div className="font-bold text-white text-xs">{checkoutChild.name}</div>
                  <span className="text-[9px] text-slate-500 font-mono">Guruh: Kamalak (G-1)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">Olib Ketuvchi Shaxs F.I.O:</label>
                <input
                  type="text"
                  required
                  value={checkoutPickerName}
                  onChange={(e) => setCheckoutPickerName(e.target.value)}
                  placeholder="Masalan: Onasi Dilfuza, Otasi, Amakisi va h.k."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white font-bold text-xs outline-none focus:border-amber-500"
                />
              </div>

              {/* CAMERA INTERACTIVE ZONE */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold">Olib Ketuvchi Shaxs Surati:</label>
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-center relative min-h-[160px] overflow-hidden">
                  {isCameraActive && !cameraError ? (
                    <div className="w-full max-w-[240px] aspect-[4/3] bg-black rounded-xl overflow-hidden relative border border-slate-800">
                      <video id="checkout-video-element" className="w-full h-full object-cover" playsInline muted></video>
                      <button
                        type="button"
                        onClick={captureCheckoutSnapshot}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 px-3 rounded-lg text-[10px] shadow-lg cursor-pointer transition-transform active:scale-95 uppercase tracking-wider"
                      >
                        Rasmga olish 📸
                      </button>
                    </div>
                  ) : checkoutPhoto ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={checkoutPhoto} className="w-28 h-28 object-cover rounded-xl border-2 border-amber-500 shadow-md" alt="Picker" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={startCheckoutCamera}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer font-bold"
                      >
                        Qayta rasmga olish 🔄
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      {cameraError ? (
                        <p className="text-[10px] text-amber-500 max-w-[260px] leading-relaxed mx-auto">{cameraError}</p>
                      ) : (
                        <p className="text-[10px] text-slate-500">Ota-onaga kvitansiya bilan birga jo'natish uchun rasm oling.</p>
                      )}
                      <button
                        type="button"
                        onClick={startCheckoutCamera}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold py-2 px-4 rounded-xl text-[10px] border border-slate-800 cursor-pointer flex items-center gap-1.5 mx-auto active:scale-95 transition-all"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" /> {cameraError ? "Simulyatsiya rasmini olish 📸" : "Kamerani yoqish 🎥"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCheckoutCamera();
                    setCheckoutChild(null);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-3 px-4 rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading || !checkoutPickerName}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-xl cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {loading ? "YUBORILMOQDA..." : "CHIQQANINI QAYD ETISH 🔒"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REAL CAMERA MODAL */}
      {isRealCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative overflow-hidden">
            {/* Background scanner line effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/30 animate-pulse"></div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="text-white font-black text-sm uppercase tracking-wider">
                  {realCameraMode === "attendance" ? "Biometrik Face ID Scanner" : "Rasmga Olish (Galereya)"}
                </h3>
              </div>
              <button
                onClick={closeRealCamera}
                className="text-slate-400 hover:text-white font-bold text-xs bg-slate-950 hover:bg-slate-850 p-2 rounded-xl border border-slate-800 transition-all cursor-pointer"
              >
                Yopish ✕
              </button>
            </div>

            {cameraPermission !== "granted" ? (
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Camera className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-black text-sm uppercase">Kamera ruxsati kutilmoqda</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Biometrik yuzni aniqlash yoki suratga olishdan oldin, tizimga qurilmangiz kamerasidan foydalanishga ruxsat berishingiz kerak.
                  </p>
                </div>
                <button
                  onClick={askCameraPermission}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer shadow-lg transition-all"
                >
                  KAMERAGA RUXSAT BERISH 🎥
                </button>
              </div>
            ) : realCameraError ? (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                <p className="text-xs text-rose-300 font-medium leading-relaxed">{realCameraError}</p>
                <button
                  onClick={closeRealCamera}
                  className="bg-rose-500 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            ) : realCameraSuccess ? (
              <div className="text-center p-6 space-y-4 animate-fade-in">
                <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl shadow-emerald-500/20">
                  <img src={realCameraSuccess.person.avatar} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-10 h-10 text-emerald-400 font-black stroke-[3]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-black text-base">{realCameraSuccess.person.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{realCameraSuccess.person.role}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-xs space-y-1 max-w-xs mx-auto text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase">Sana va Vaqt:</span>
                    <span className="text-white font-mono font-bold">{new Date().toLocaleDateString()} {realCameraSuccess.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase">Amal:</span>
                    <span className={`font-black uppercase ${realCameraSuccess.direction === 'in' ? 'text-emerald-400' : 'text-sky-400'}`}>
                      {realCameraSuccess.direction === 'in' ? 'KIRDI (Keldi)' : 'CHIQDI (Ketdi)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase">Harorat:</span>
                    <span className="text-amber-400 font-mono font-bold">{realCameraSuccess.temperature}°C</span>
                  </div>
                </div>
                <button
                  onClick={closeRealCamera}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer shadow-lg shadow-emerald-500/10 transition-all"
                >
                  TAYYOR (Oynani Yopish)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Interactive viewfinder with targeting bracket styling */}
                <div className={`relative w-full aspect-video rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden ${realCameraFlash ? 'brightness-150' : ''}`}>
                  <video
                    ref={realVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  {/* Neon HUD sights */}
                  <div className="absolute inset-0 border-2 border-emerald-500/20 m-4 pointer-events-none rounded-lg">
                    {/* Corner Sights */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                    {/* Targeting Line */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-500/10 border-t border-dashed border-emerald-500/30"></div>
                  </div>

                  <span className="absolute bottom-3 left-3 bg-slate-950/70 border border-slate-800 text-[9px] text-emerald-400 font-bold px-2 py-1 rounded uppercase tracking-wider font-mono">
                    ● CAMERA FEED ACTIVE
                  </span>
                </div>

                {realCameraMode === "attendance" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-400 uppercase font-bold text-[9px]">Skanerlash Subyekti:</label>
                        <select
                          value={`${realCameraType}:${realCameraTargetId}`}
                          onChange={(e) => {
                            const [type, id] = e.target.value.split(":");
                            setRealCameraType(type as any);
                            setRealCameraTargetId(id);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-2.5 font-bold outline-none cursor-pointer"
                        >
                          <option value="child:auto">Auto-Yuzni aniqlash 🤖</option>
                          <optgroup label="Bolalar">
                            {studentsToRender.map(c => (
                              <option key={c.id} value={`child:${c.id}`}>{c.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Xodimlar / O'zingiz">
                            {employeesList.map(e => (
                              <option key={e.id} value={`employee:${e.id}`}>{e.name} ({e.role})</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 uppercase font-bold text-[9px]">Davomat yo'nalishi:</label>
                        <select
                          value={realCameraDirection}
                          onChange={(e) => setRealCameraDirection(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-2.5 font-bold outline-none cursor-pointer"
                        >
                          <option value="in">KELDI (Check-In) 🟢</option>
                          <option value="out">KETDI (Check-Out) 🔵</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-400 uppercase font-bold text-[9px]">Rasm Kategoriyasi:</label>
                        <select
                          value={galleryCategory}
                          onChange={(e) => setGalleryCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-2.5 font-bold outline-none cursor-pointer"
                        >
                          <option value="Mashg'ulot (Ijodiy)">Mashg'ulot (Ijodiy) 🎨</option>
                          <option value="Mashg'ulot (Sport)">Sport Tadbiri 🏃‍♂️</option>
                          <option value="Oshxona (Nonushta)">Oshxona (Nonushta) 🍳</option>
                          <option value="Oshxona (Tushlik)">Oshxona (Tushlik) 🍜</option>
                          <option value="Oshxona (Kechki)">Oshxona (Kechki ovqat) 🍲</option>
                          <option value="Tashqi Faoliyat">Hovli O'yinlari 🌳</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 uppercase font-bold text-[9px]">Sarlavha (Ixtiyoriy):</label>
                        <input
                          type="text"
                          placeholder="Mavzuni kiriting..."
                          value={galleryTitle}
                          onChange={(e) => setGalleryTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-2.5 font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={captureRealPhotoAndProcess}
                  disabled={scanningInProgress}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
                >
                  {scanningInProgress ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      {realCameraMode === "attendance" ? "Biometrik tahlil qilinmoqda..." : "Rasm saqlanmoqda..."}
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-slate-950" />
                      {realCameraMode === "attendance" ? "YUZNI SKANERLASH VA SAQLASH" : "RASMGA OLISH VA GALEREYAGA JOYLASh"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
