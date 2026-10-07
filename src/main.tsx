import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

function getRequestBody(init?: RequestInit): any {
  if (!init || !init.body) return {};
  try { if (typeof init.body === 'string') return JSON.parse(init.body); } catch { return {}; }
  return {};
}

function createJsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function localHashPassword(password: string): string {
  return 'local:' + btoa(encodeURIComponent(password));
}

function localVerifyPassword(password: string, hash: string): boolean {
  if (!hash) return false;
  if (hash.startsWith('local:')) { try { return hash === localHashPassword(password); } catch { return false; } }
  return hash === password;
}

function getLocalList(resource: string): any[] {
  try {
    const cached: any[] = JSON.parse(localStorage.getItem(`cache_${resource}`) || '[]');
    const deletedIds: string[] = JSON.parse(localStorage.getItem(`deleted_${resource}_ids`) || '[]');
    const modItems: Record<string, any> = JSON.parse(localStorage.getItem(`modified_${resource}`) || '{}');
    let list = (cached || []).filter((item: any) => item && item.id && !deletedIds.includes(item.id));
    list = list.map((item: any) => modItems[item.id] ? { ...item, ...modItems[item.id] } : item);
    return list;
  } catch { return []; }
}

function addLocalItem(resource: string, newItem: any): void {
  try {
    const cached: any[] = JSON.parse(localStorage.getItem(`cache_${resource}`) || '[]');
    if (cached.find((i: any) => i.id === newItem.id)) return;
    cached.unshift(newItem);
    localStorage.setItem(`cache_${resource}`, JSON.stringify(cached));
  } catch {}
}

function handleLocalApi(method: string, relativePath: string, init?: RequestInit): Response {
  const body = getRequestBody(init);
  const cleanPath = relativePath.split('?')[0];
  const pathParts = cleanPath.split('/').filter(Boolean);
  const resource = pathParts[1] || '';
  const id = pathParts[2] || '';
  const subAction = pathParts[3] || '';

  if (cleanPath.includes('health')) return createJsonResponse({ status: "healthy", uptime: 120, database: { status: "connected" }, telegram: { status: "online" }, success: true });
  if (cleanPath.includes('telegram-simulator')) return createJsonResponse({ status: "online", latency: 35, success: true });

  if (cleanPath.includes('reset-db')) {
    ["deleted_employees_ids","deleted_groups_ids","deleted_children_ids","deleted_payments_ids","deleted_menus_ids","deleted_ingredients_ids","deleted_recipes_ids","modified_employees","modified_groups","modified_children","modified_kindergartens","modified_payments","modified_menus","modified_ingredients","cache_children","cache_groups","cache_employees","cache_payments","cache_complaints","cache_auditLogs","cache_menus","cache_ingredients","cache_recipes","cache_purchase-requests","cache_meal-gallery","cache_attendance"].forEach(k => localStorage.removeItem(k));
    return createJsonResponse({ success: true, message: "Tizim tozalandi!" });
  }

  if (cleanPath.includes('hardware')) { if (method === 'DELETE') return createJsonResponse({ success: true }); return createJsonResponse({ success: true, devices: [], status: "online" }); }
  if (cleanPath.includes('notifications')) { if (method === 'GET') return createJsonResponse({ sms: [], telegram: [] }); return createJsonResponse({ success: true }); }
  if (cleanPath.includes('failed-checkins')) return createJsonResponse([]);
  if (cleanPath.includes('gemini') || cleanPath.includes('meals/analyze')) return createJsonResponse({ success: true, analysis: { calories: 450, protein: 18, fat: 12, carb: 60, vitamins: "A, C, D", minerals: "Kaltsiy, Temir", aiComment: "Sog'lom taom." } });

  if (cleanPath.includes('face-id/scan') || cleanPath.includes('face-recognition') || cleanPath.includes('face-id')) {
    const childId = body.childId || body.targetId;
    const temp = body.temperature || "36.6";
    const nowTime = new Date().toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' });
    const today = new Date().toISOString().split('T')[0];
    const direction = (body.deviceIp && body.deviceIp.includes('226')) || body.direction === 'out' ? 'out' : 'in';
    const children = getLocalList('children');
    const matchedChild = children.find((c: any) => c.id === childId) || children[0] || { id: childId || "C-1", name: "O'quvchi", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" };
    const finalChildId = matchedChild ? matchedChild.id : (childId || "C-1");
    const rec = {
      id: `ATT-${Date.now()}`,
      childId: finalChildId,
      date: today,
      checkIn: direction === 'in' ? nowTime : null,
      checkOut: direction === 'out' ? nowTime : null,
      status: "Keldi",
      temperature: String(temp)
    };
    addLocalItem('attendance', rec);
    return createJsonResponse({ success: true, record: rec, child: matchedChild });
  }

  if (cleanPath.includes('chef/dashboard')) {
    const menus = getLocalList('menus');
    const today = new Date().toISOString().split('T')[0];
    const todayMenus = menus.filter((m: any) => m.date === today);
    const children = getLocalList('children');
    const ingredients = getLocalList('ingredients');
    const requests = getLocalList('purchase-requests');
    const specialDietCount = children.filter((c: any) => c.medicalCard && c.medicalCard.allergies && (c.medicalCard.allergies.toLowerCase().includes('diabet') || c.medicalCard.allergies.toLowerCase().includes('gluten'))).length;
    const allergyCount = children.filter((c: any) => c.medicalCard && c.medicalCard.allergies && c.medicalCard.allergies !== "Yo'q" && c.medicalCard.allergies !== "yo'q").length;
    return createJsonResponse({
      success: true,
      stats: {
        todayBreakfast: todayMenus.find((m: any) => m.mealType === 'Breakfast')?.mealName || "Kiritilmagan",
        todayLunch: todayMenus.find((m: any) => m.mealType === 'Lunch')?.mealName || "Kiritilmagan",
        todayAfternoonSnack: todayMenus.find((m: any) => m.mealType === 'Snack')?.mealName || "Kiritilmagan",
        todayDinner: todayMenus.find((m: any) => m.mealType === 'Dinner')?.mealName || "Kiritilmagan",
        totalMealsPrepared: todayMenus.length > 0 ? children.length * todayMenus.length : 0,
        childrenEatingToday: children.length,
        specialDietChildren: specialDietCount,
        allergyAlerts: allergyCount,
        lowStockIngredients: ingredients.filter((i: any) => Number(i.quantity) < 5).length,
        purchaseRequests: requests.length,
        kitchenTasks: 0,
        aiNutritionScore: todayMenus.length > 0 ? 95 : 0
      },
      charts: { weeklyMenu: [], caloriesDistribution: [], proteinIntake: [], wasteStatistics: [] }
    });
  }

  if (cleanPath.includes('dashboard/statistics') || cleanPath.includes('dashboard/metrics')) {
    const payments = getLocalList('payments');
    const children = getLocalList('children');
    const expenses = getLocalList('expenses');
    const employees = getLocalList('employees');
    const pr = getLocalList('purchase-requests');
    const today = new Date().toISOString().split('T')[0];
    const todayPayments = payments.filter((p: any) => p.date === today || (p.createdAt && p.createdAt.startsWith(today)));
    const bugungiTushum = todayPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const oylikDaromad = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const todayExpenses = expenses.filter((e: any) => e.date === today || (e.createdAt && e.createdAt.startsWith(today)));
    const bugungiXarajat = todayExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    const paidChildIds = new Set(payments.map((p: any) => p.childId));
    const tolovQilganBolalar = children.filter((c: any) => paidChildIds.has(c.id)).length;
    const tolamaganBolalar = Math.max(0, children.length - tolovQilganBolalar);
    const xodimlarIshHaqi = employees.reduce((sum: number, e: any) => sum + (Number(e.salary) || 0), 0);
    return createJsonResponse({
      success: true,
      bugungiTushum,
      oylikDaromad,
      bugungiXarajat,
      qarzdorOtaOnalarSoni: tolamaganBolalar,
      tolovQilganBolalar,
      tolamaganBolalar,
      xodimlarIshHaqi,
      xaridlar: pr.length,
      bugungiCheklar: todayPayments.length
    });
  }

  if (resource === 'login' && method === 'POST') {
    const { username, password } = body;
    if (!username || !password) return createJsonResponse({ success: false, message: "Username va parol shart!" }, 400);
    const employees = getLocalList('employees');
    const localUser = employees.find((e: any) => (e.username && e.username.toLowerCase() === username.toLowerCase()) || (e.login && e.login.toLowerCase() === username.toLowerCase()));
    if (localUser) {
      const ok = localVerifyPassword(password, localUser.passwordHash || '') || localUser.plainPassword === password || localUser.password === password;
      if (ok) {
        const tp = { id: localUser.id, username: localUser.username || username, role: localUser.role, name: localUser.name, phone: localUser.phone || '', kindergartenId: localUser.kindergartenId || 'K-1', avatar: localUser.avatar || localUser.photo || null };
        return createJsonResponse({ success: true, token: 'local_' + btoa(JSON.stringify(tp)), user: tp });
      }
    }
    const defaults: Record<string, any> = { 'superadmin': { password: 'admin135@', role: 'SuperAdmin', name: 'Super Administrator', id: 'E-SA', kindergartenId: 'K-1' }, 'admin': { password: 'admin135@', role: 'SuperAdmin', name: 'Super Administrator', id: 'E-SA', kindergartenId: 'K-1' }, 'direktor1': { password: 'dir123', role: 'Direktor', name: 'Dilnoza Rahimova', id: 'E-D1', kindergartenId: 'K-1' }, 'direktor2': { password: 'dir123', role: 'Direktor', name: 'Aziza Karimova', id: 'E-D2', kindergartenId: 'K-2' }, 'direktor3': { password: 'dir123', role: 'Direktor', name: 'Gulnora Aliyeva', id: 'E-D3', kindergartenId: 'K-3' }, 'tarbiyachi': { password: 'tarbiyachi123', role: 'Tarbiyachi', name: 'Malika Yusupova', id: 'E-T1', kindergartenId: 'K-1' }, 'hamshira': { password: 'hamshira123', role: 'Hamshira', name: 'Sitora Aliyeva', id: 'E-N1', kindergartenId: 'K-1' }, 'oshpaz': { password: 'oshpaz123', role: 'Oshpaz', name: 'Rustam Karimov', id: 'E-C1', kindergartenId: 'K-1' }, 'buxgalter': { password: 'buxgalter123', role: 'Buxgalter', name: 'Nilufar Hasanova', id: 'E-B1', kindergartenId: 'K-1' } };
    const demo = defaults[username];
    if (demo && demo.password === password) { const tp = { id: demo.id, username, role: demo.role, name: demo.name, phone: '', kindergartenId: demo.kindergartenId, avatar: null }; return createJsonResponse({ success: true, token: 'local_' + btoa(JSON.stringify(tp)), user: tp }); }
    return createJsonResponse({ success: false, message: "Login yoki parol noto'g'ri!" }, 401);
  }

  if (resource === 'auth' && id === 'me') { try { const s = localStorage.getItem('currentUser'); if (s) return createJsonResponse({ success: true, user: JSON.parse(s) }); } catch {} return createJsonResponse({ success: false }, 401); }
  if (resource === 'logout') return createJsonResponse({ success: true });

  if (resource === 'users') {
    const { userId, name, phone, avatar } = body;
    if (userId) {
      try {
        const updates: any = {};
        if (name) updates.name = name; if (phone) updates.phone = phone; if (avatar) updates.avatar = avatar;
        const mod: Record<string, any> = JSON.parse(localStorage.getItem('modified_employees') || '{}');
        mod[userId] = { ...(mod[userId] || {}), ...updates };
        localStorage.setItem('modified_employees', JSON.stringify(mod));
        const cached: any[] = JSON.parse(localStorage.getItem('cache_employees') || '[]');
        localStorage.setItem('cache_employees', JSON.stringify(cached.map((e: any) => e.id === userId ? { ...e, ...updates } : e)));
        try { const cu = JSON.parse(localStorage.getItem('currentUser') || '{}'); if (cu.id === userId) localStorage.setItem('currentUser', JSON.stringify({ ...cu, ...updates })); } catch {}
      } catch {}
    }
    return createJsonResponse({ success: true, user: { ...body, id: userId } });
  }

  if (cleanPath.includes('medical/update') && method === 'POST') {
    const { childId, allergies, bloodGroup, rhFactor, height, weight, vaccinations } = body;
    if (childId) {
      try {
        const mod: Record<string, any> = JSON.parse(localStorage.getItem('modified_children') || '{}');
        mod[childId] = { ...(mod[childId] || {}), medicalCard: { ...(mod[childId]?.medicalCard || {}), allergies, bloodGroup, rhFactor, height, weight, vaccinations, lastCheckup: new Date().toISOString().split('T')[0] } };
        localStorage.setItem('modified_children', JSON.stringify(mod));
        const cached: any[] = JSON.parse(localStorage.getItem('cache_children') || '[]');
        localStorage.setItem('cache_children', JSON.stringify(cached.map((c: any) => c.id === childId ? { ...c, medicalCard: { ...(c.medicalCard || {}), allergies, bloodGroup, rhFactor, height, weight, vaccinations } } : c)));
      } catch {}
    }
    return createJsonResponse({ success: true });
  }

  if (resource === 'attendance') {
    if (id === 'scan' && method === 'POST') { const rec = { id: `ATT-${Date.now()}`, childId: body.targetId, date: new Date().toISOString().split('T')[0], checkIn: body.direction === 'in' ? new Date().toLocaleTimeString() : null, checkOut: body.direction === 'out' ? new Date().toLocaleTimeString() : null, status: "Keldi", temperature: body.temperature || "36.6" }; addLocalItem('attendance', rec); return createJsonResponse({ success: true, record: rec }); }
    if (method === 'POST') { const rec = { id: `ATT-${Date.now()}`, ...body }; addLocalItem('attendance', rec); return createJsonResponse({ success: true, record: rec }); }
    if (method === 'PUT') { try { const mod: Record<string, any> = JSON.parse(localStorage.getItem('modified_attendance') || '{}'); mod[id] = { ...(mod[id] || {}), ...body }; localStorage.setItem('modified_attendance', JSON.stringify(mod)); const cached: any[] = JSON.parse(localStorage.getItem('cache_attendance') || '[]'); localStorage.setItem('cache_attendance', JSON.stringify(cached.map((i: any) => i.id === id ? { ...i, ...body } : i))); } catch {} return createJsonResponse({ success: true }); }
    return createJsonResponse(getLocalList('attendance'));
  }

  if (resource === 'kindergartens') {
    if (subAction === 'director' && method === 'POST') {
      const kgId = id;
      const { name, username, password, phone, passport } = body;
      const empId = `E-DIR-${Date.now().toString().slice(-6)}`;
      const newDir = { id: empId, name: name || 'Yangi Direktor', username: username || `dir_${kgId}`, login: username || `dir_${kgId}`, passwordHash: localHashPassword(password || 'dir123'), plainPassword: password || 'dir123', password: password || 'dir123', role: 'Direktor', phone: phone || '', passport: passport || '', kindergartenId: kgId, status: 'Faol', joinedDate: new Date().toISOString().split('T')[0], avatar: null };
      addLocalItem('employees', newDir);
      try {
        const mod: Record<string, any> = JSON.parse(localStorage.getItem('modified_kindergartens') || '{}');
        mod[kgId] = { ...(mod[kgId] || {}), directorName: name || 'Yangi Direktor', directorUsername: username || `dir_${kgId}`, directorPhone: phone || '' };
        localStorage.setItem('modified_kindergartens', JSON.stringify(mod));
        const cached: any[] = JSON.parse(localStorage.getItem('cache_kindergartens') || '[]');
        localStorage.setItem('cache_kindergartens', JSON.stringify(cached.map((k: any) => k.id === kgId ? { ...k, directorName: name || 'Yangi Direktor', directorUsername: username || `dir_${kgId}`, directorPhone: phone || '' } : k)));
      } catch {}
      return createJsonResponse({ success: true, message: "Direktor logini yaratildi!" });
    }
    if (cleanPath.includes('/toggle-portal')) return createJsonResponse({ success: true });
    if (method === 'GET') {
      let list = getLocalList('kindergartens');
      if (list.length === 0) {
        list = [
          { id: "K-1", name: "1-son Davlat Bog'chasi (Markaziy)", address: "Toshkent sh., Chilonzor 1-mavze", phone: "+998712001122", directorName: "Dilnoza Rahimova", directorUsername: "direktor1", capacity: 120, status: "Faol" },
          { id: "K-2", name: "2-son Nihol Filiali", address: "Toshkent sh., Yunusobod 4-mavze", phone: "+998712002233", directorName: "Aziza Karimova", directorUsername: "direktor2", capacity: 90, status: "Faol" },
          { id: "K-3", name: "3-son Kamalak Filiali", address: "Toshkent sh., Mirzo Ulug'bek", phone: "+998712003344", directorName: "Gulnora Aliyeva", directorUsername: "direktor3", capacity: 150, status: "Faol" }
        ];
        localStorage.setItem('cache_kindergartens', JSON.stringify(list));
      }
      return createJsonResponse(list);
    }
    if (method === 'POST') {
      const nk = { id: body.id || `K-${Date.now().toString().slice(-4)}`, name: body.name || "Yangi Bog'cha", address: body.address || "Toshkent shahri", phone: body.phone || "+998900000000", directorName: body.directorName || "", directorUsername: body.directorUsername || "", capacity: Number(body.capacity || 100), status: "Faol", createdDate: new Date().toISOString().split('T')[0] };
      addLocalItem('kindergartens', nk);
      return createJsonResponse({ success: true, kindergarten: nk });
    }
    if (method === 'PUT') {
      try {
        const mod: Record<string, any> = JSON.parse(localStorage.getItem('modified_kindergartens') || '{}');
        mod[id] = { ...(mod[id] || {}), ...body };
        localStorage.setItem('modified_kindergartens', JSON.stringify(mod));
        const c: any[] = JSON.parse(localStorage.getItem('cache_kindergartens') || '[]');
        localStorage.setItem('cache_kindergartens', JSON.stringify(c.map((k: any) => k.id === id ? { ...k, ...body } : k)));
      } catch {}
      return createJsonResponse({ success: true });
    }
    if (method === 'DELETE') {
      try {
        const del: string[] = JSON.parse(localStorage.getItem('deleted_kindergartens_ids') || '[]');
        if (!del.includes(id)) {
          del.push(id);
          localStorage.setItem('deleted_kindergartens_ids', JSON.stringify(del));
        }
        const c: any[] = JSON.parse(localStorage.getItem('cache_kindergartens') || '[]');
        localStorage.setItem('cache_kindergartens', JSON.stringify(c.filter((k: any) => k.id !== id)));
      } catch {}
      return createJsonResponse({ success: true });
    }
  }

  const crudResources = ['employees','groups','children','payments','meals','ingredients','menus','complaints','audit-logs','documents','activities','payroll','purchase-requests','meal-gallery','recipes'];
  if (crudResources.includes(resource)) {
    if (method === 'GET') return createJsonResponse(getLocalList(resource));
    if (method === 'POST') {
      const ni = { ...body, id: body.id || `${resource.replace('-','')[0].toUpperCase()}${Date.now().toString().slice(-6)}` };
      if (resource === 'employees' && body.password && !body.passwordHash) { ni.passwordHash = localHashPassword(body.password); ni.plainPassword = body.password; }
      addLocalItem(resource, ni);
      return createJsonResponse({ success: true, data: ni, item: ni });
    }
    if (method === 'PUT') {
      const tid = id || body.id;
      if (tid) { try { const mod: Record<string, any> = JSON.parse(localStorage.getItem(`modified_${resource}`) || '{}'); mod[tid] = { ...(mod[tid] || {}), ...body }; localStorage.setItem(`modified_${resource}`, JSON.stringify(mod)); const c: any[] = JSON.parse(localStorage.getItem(`cache_${resource}`) || '[]'); localStorage.setItem(`cache_${resource}`, JSON.stringify(c.map((i: any) => i.id === tid ? { ...i, ...body } : i))); } catch {} }
      return createJsonResponse({ success: true });
    }
    if (method === 'DELETE') {
      const tid = id || body.id;
      if (tid) { try { const del: string[] = JSON.parse(localStorage.getItem(`deleted_${resource}_ids`) || '[]'); if (!del.includes(tid)) { del.push(tid); localStorage.setItem(`deleted_${resource}_ids`, JSON.stringify(del)); } const mod: Record<string, any> = JSON.parse(localStorage.getItem(`modified_${resource}`) || '{}'); delete mod[tid]; localStorage.setItem(`modified_${resource}`, JSON.stringify(mod)); const c: any[] = JSON.parse(localStorage.getItem(`cache_${resource}`) || '[]'); localStorage.setItem(`cache_${resource}`, JSON.stringify(c.filter((i: any) => i.id !== tid))); } catch {} }
      return createJsonResponse({ success: true });
    }
  }

  if (method === 'GET') return createJsonResponse([]);
  return createJsonResponse({ success: true, data: [] });
}

if (typeof window !== 'undefined') {
  const BACKEND_HOST = 'bogcham-uz.onrender.com';
  const BACKEND_URL = `https://${BACKEND_HOST}`;
  try {
    const originalFetch = window.fetch;
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const origin = window.location.origin;
      let isApiCall = false;
      let relativePath = '';
      if (url.startsWith('/api')) { isApiCall = true; relativePath = url; }
      else if (url.startsWith(`${origin}/api`)) { isApiCall = true; relativePath = url.substring(origin.length); }
      else if (url.startsWith('api/') || url.startsWith('./api/')) { isApiCall = true; relativePath = '/' + url.replace(/^\.\/?/, ''); }
      if (isApiCall) {
        const method = (init?.method || 'GET').toUpperCase();
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) { try { const res = await originalFetch(input, init); if (res.ok) return res; return handleLocalApi(method, relativePath, init); } catch { return handleLocalApi(method, relativePath, init); } }
        try { const targetUrl = `${BACKEND_URL}${relativePath}`; const controller = new AbortController(); const tid2 = setTimeout(() => controller.abort(), 3000); const res = await originalFetch(targetUrl, { ...init, signal: controller.signal }); clearTimeout(tid2); if (res.ok) return res; return handleLocalApi(method, relativePath, init); } catch { return handleLocalApi(method, relativePath, init); }
      }
      return originalFetch(input, init);
    };
    try { window.fetch = customFetch; } catch { Object.defineProperty(window, 'fetch', { value: customFetch, writable: true, configurable: true }); }
  } catch {}
  try {
    const OWS = window.WebSocket;
    const CWS = function (this: any, url: string | URL, protocols?: string | string[]) {
      let tu = typeof url === 'string' ? url : url.toString();
      if (tu.includes(window.location.host)) { tu = tu.replace(window.location.host, BACKEND_HOST); if (tu.startsWith('ws://')) tu = tu.replace('ws://', 'wss://'); }
      try { const ws = new OWS(tu, protocols); ws.addEventListener('error', () => {}); return ws; } catch { return { send: () => {}, close: () => {}, addEventListener: () => {}, removeEventListener: () => {} }; }
    };
    // @ts-ignore
    CWS.prototype = OWS.prototype;
    try { // @ts-ignore
      window.WebSocket = CWS;
    } catch { Object.defineProperty(window, 'WebSocket', { value: CWS, writable: true, configurable: true }); }
  } catch {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
