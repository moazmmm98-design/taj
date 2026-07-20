import { useEffect, useRef, useState } from "react";
import AppBar from "./components/AppBar.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import StudentsScreen from "./components/StudentsScreen.jsx";
import EvalScreen from "./components/EvalScreen.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import ManageScreen from "./components/ManageScreen.jsx";
import ParentAccessScreen from "./components/ParentAccessScreen.jsx";
import ReportsScreen from "./components/ReportsScreen.jsx";
import Toast from "./components/Toast.jsx";
import { ADMIN_PASSWORD, SCORE_KEYS, genCode, arNum } from "./data.js";
import {
  loadCircles, saveCircle, saveCircleInfo, removeCircle, saveStudents, saveStudentName,
  saveStudentParentCode, removeStudent, saveAccessCode, saveEvaluation, getAdminPasswordHash, setAdminPasswordHash,
  listAdmins, findAdminByPassword, getAdminById, createAdmin, updateAdmin, deleteAdmin,
} from "./api/repo.js";
import { sha256Hex } from "./lib/hash.js";

const uid = () =>
  (window.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2));

const ADMIN_PW = import.meta.env.VITE_ADMIN_PASSWORD || ADMIN_PASSWORD;
const SUPER_ADMIN_NAME = "المشرف العام";
const evalTotal = (scores) => SCORE_KEYS.reduce((a, k) => a + (Number(scores?.[k]) || 0), 0);

// حفظ الجلسة محلياً كي لا يخرج المستخدم عند تحديث الصفحة
const SESSION_KEY = "taj_session";
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; } };
const saveSession = (s) => { try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } };
const viewForSession = (s) =>
  !s ? { name: "students" }
    : s.role === "admin" ? { name: "admin" }
    : s.role === "parent" ? { name: "reports" }
    : { name: "students", circleId: s.circleId };

function Splash() {
  return (
    <div className="page">
      <div className="stack" style={{ marginTop: 40 }}>
        {[0, 1, 2].map((i) => (
          <div className="sk" key={i}>
            <div className="sk-b" style={{ width: 52, height: 52, borderRadius: 15 }} />
            <div style={{ flex: 1 }}>
              <div className="sk-b" style={{ height: 14, width: "55%", marginBottom: 9 }} />
              <div className="sk-b" style={{ height: 10, width: "75%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const initialSession = readSession();
  const [circles, setCircles] = useState([]);
  const [session, setSession] = useState(initialSession); // null | {role:'sheikh', circleId} | {role:'admin'}
  const [view, setView] = useState(viewForSession(initialSession));
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [theme, setTheme] = useState(null);
  const [toast, setToast] = useState({ msg: "", ok: true, visible: false });
  const [loading, setLoading] = useState(true);
  const [adminHash, setAdminHash] = useState(undefined); // undefined=لم تُحمّل · null=لا توجد · نص=تجزئة
  const [admins, setAdmins] = useState([]); // قائمة المشرفين (للمشرف العام)
  const toastTimer = useRef(null);

  // جلب كلمة مرور المشرف المخزّنة (إن وُجدت)
  useEffect(() => {
    getAdminPasswordHash().then((h) => setAdminHash(h || null)).catch((e) => { console.error(e); setAdminHash(null); });
  }, []);

  // إن كانت جلسة مشرف عادي محفوظة لحساب حُذف، أخرجه عند إعادة التحميل
  useEffect(() => {
    if (initialSession?.role === "admin" && !initialSession.isSuper && initialSession.adminId) {
      getAdminById(initialSession.adminId)
        .then((a) => { if (!a) { saveSession(null); setSession(null); setView({ name: "students" }); } })
        .catch((e) => console.error(e));
    }
  }, []);

  // تحميل قائمة المشرفين للمشرف العام
  useEffect(() => {
    if (session?.role === "admin" && session.isSuper) {
      listAdmins().then(setAdmins).catch((e) => console.error(e));
    }
  }, [session]);

  // تحميل البيانات (من Supabase إن ضُبطت المفاتيح، وإلا بيانات وهمية)
  useEffect(() => {
    let alive = true;
    loadCircles()
      .then((cs) => {
        if (!alive) return;
        setCircles(cs);
        // إن كانت جلسة معلّم محفوظة لحلقة لم تعد موجودة، أخرجه
        if (initialSession?.role === "sheikh" && !cs.some((c) => c.id === initialSession.circleId)) {
          saveSession(null); setSession(null); setView({ name: "students" });
        }
        // إن كانت جلسة ولي أمر لطالب لم يعد موجوداً، أخرجه
        if (initialSession?.role === "parent") {
          const c = cs.find((c) => c.id === initialSession.circleId);
          if (!c?.students.some((s) => s.id === initialSession.studentId)) {
            saveSession(null); setSession(null); setView({ name: "students" });
          }
        }
      })
      .catch((e) => { console.error(e); if (alive) showToast("تعذّر تحميل البيانات من الخادم", false); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // حفظ في الخلفية مع تنبيه عند الفشل
  const persist = (fn) => Promise.resolve().then(fn).catch((e) => {
    console.error(e);
    showToast("تعذّر الحفظ في الخادم — تحقّق من الاتصال", false);
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
  }, [theme]);

  // توسيع العرض في شاشات المشرف الواسعة (وعرض مريح لتقرير ولي الأمر)
  useEffect(() => {
    const wideViews = ["admin", "manage", "reports", "parents"];
    let mw = "560px";
    if (session?.role === "admin" && wideViews.includes(view.name)) mw = "1060px";
    else if (session?.role === "parent") mw = "820px";
    document.documentElement.style.setProperty("--maxw", mw);
  }, [session, view.name]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1900);
  };

  const toggleTheme = () => {
    const isDark = theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(isDark ? "light" : "dark");
  };

  const circleById = (id) => circles.find((c) => c.id === id);

  // كلمة المرور صحيحة؟ (التجزئة المخزّنة إن وُجدت، وإلا قيمة البيئة/الافتراضية)
  const checkAdminPassword = async (secret) => {
    let h = adminHash;
    if (h === undefined) { // لم تُحمّل بعد — اجلبها الآن لتفادي التسابق
      try { h = await getAdminPasswordHash(); } catch { h = null; }
      setAdminHash(h || null);
    }
    return h ? (await sha256Hex(secret)) === h : secret === ADMIN_PW;
  };

  // ---- المصادقة (رمز الحلقة للمعلّم، كلمة مرور للمشرف) ----
  const login = async (mode, secret) => {
    if (mode === "admin") {
      // المشرف العام (كلمة مرور البيئة/التطبيق)
      if (await checkAdminPassword(secret)) {
        const s = { role: "admin", isSuper: true, name: SUPER_ADMIN_NAME };
        setSession(s); saveSession(s);
        setView({ name: "admin" });
        return { ok: true };
      }
      // مشرف عادي: طابِق كلمة مروره مع جدول المشرفين
      try {
        const admin = await findAdminByPassword(await sha256Hex(secret));
        if (admin) {
          const s = { role: "admin", isSuper: false, adminId: admin.id, name: admin.name };
          setSession(s); saveSession(s);
          setView({ name: "admin" });
          showToast(`أهلاً ${admin.name}`);
          return { ok: true };
        }
      } catch (e) { console.error(e); }
      return { ok: false, error: "كلمة مرور المشرف غير صحيحة" };
    }
    if (mode === "parent") {
      const code = secret.trim().toLowerCase();
      for (const c of circles) {
        const child = c.students.find((s) => s.parentCode && s.parentCode.toLowerCase() === code);
        if (child) {
          const s = { role: "parent", circleId: c.id, studentId: child.id, name: child.name };
          setSession(s); saveSession(s);
          setView({ name: "reports" });
          showToast(`أهلاً بك — متابعة ${child.name}`);
          return { ok: true };
        }
      }
      return { ok: false, error: "رمز ولي الأمر غير صحيح — راجع المشرف" };
    }
    const code = secret.trim().toLowerCase();
    const circle = circles.find((c) => c.accessCode.toLowerCase() === code);
    if (circle) {
      const s = { role: "sheikh", circleId: circle.id };
      setSession(s); saveSession(s);
      setView({ name: "students", circleId: circle.id });
      showToast(`أهلاً بك في ${circle.name}`);
      return { ok: true };
    }
    return { ok: false, error: "رمز الحلقة غير صحيح — تحقّق من الرمز أو راجع المشرف" };
  };

  const logout = () => { setSession(null); saveSession(null); setView({ name: "students" }); };

  // تغيير كلمة مرور المشرف
  const changeAdminPassword = async (current, next) => {
    if (!(await checkAdminPassword(current))) return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
    if (!next || next.length < 4) return { ok: false, error: "الكلمة الجديدة قصيرة (٤ أحرف على الأقل)" };
    const hash = await sha256Hex(next);
    try { await setAdminPasswordHash(hash); }
    catch (e) { console.error(e); return { ok: false, error: "تعذّر الحفظ في الخادم" }; }
    setAdminHash(hash);
    showToast("تم تغيير كلمة مرور المشرف");
    return { ok: true };
  };

  // ---- إدارة المشرفين (المشرف العام فقط) ----
  const createAdminAccount = async (name, password) => {
    const nm = (name || "").trim();
    if (!nm) return { ok: false, error: "أدخل اسم المشرف" };
    if (!password || password.length < 4) return { ok: false, error: "كلمة المرور قصيرة (٤ أحرف على الأقل)" };
    if (await checkAdminPassword(password)) return { ok: false, error: "كلمة المرور محجوزة للمشرف العام — اختر غيرها" };
    try {
      await createAdmin(nm, await sha256Hex(password));
      setAdmins(await listAdmins());
      showToast(`أُضيف المشرف ${nm}`);
      return { ok: true };
    } catch (e) {
      console.error(e);
      if (e.code === "23505") return { ok: false, error: "كلمة المرور مستخدمة من مشرف آخر — اختر غيرها" };
      return { ok: false, error: "تعذّر إنشاء المشرف — تحقّق من الاتصال" };
    }
  };
  const updateAdminAccount = async (id, { name, password }) => {
    const patch = {};
    if (name !== undefined) {
      const nm = name.trim();
      if (!nm) return { ok: false, error: "اسم المشرف مطلوب" };
      patch.name = nm;
    }
    if (password) {
      if (password.length < 4) return { ok: false, error: "كلمة المرور قصيرة (٤ أحرف على الأقل)" };
      if (await checkAdminPassword(password)) return { ok: false, error: "كلمة المرور محجوزة للمشرف العام — اختر غيرها" };
      patch.passwordHash = await sha256Hex(password);
    }
    if (!Object.keys(patch).length) return { ok: true };
    try {
      await updateAdmin(id, patch);
      setAdmins(await listAdmins());
      showToast("تم تحديث بيانات المشرف");
      return { ok: true };
    } catch (e) {
      console.error(e);
      if (e.code === "23505") return { ok: false, error: "كلمة المرور مستخدمة من مشرف آخر — اختر غيرها" };
      return { ok: false, error: "تعذّر تحديث المشرف — تحقّق من الاتصال" };
    }
  };
  const deleteAdminAccount = async (id) => {
    try {
      await deleteAdmin(id);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      showToast("حُذف المشرف");
    } catch (e) { console.error(e); showToast("تعذّر حذف المشرف", false); }
  };

  // ---- تعديل غير قابل للتغيير المباشر ----
  const patchStudent = (circleId, idx, patch) => {
    setCircles((prev) => prev.map((c) => c.id !== circleId ? c : {
      ...c, students: c.students.map((s, i) => i === idx ? { ...s, ...patch } : s),
    }));
  };
  const patchCircle = (circleId, patch) => {
    setCircles((prev) => prev.map((c) => c.id === circleId ? { ...c, ...patch } : c));
  };

  // ---- إدارة الحلقات والطلاب ----
  const addCircle = ({ name, teacher, icon }) => {
    const circle = {
      id: uid(), name, teacher, level: "", room: "", icon: icon || "book-open",
      codePrefix: "HALQA", accessCode: genCode("HALQA"), students: [],
    };
    setCircles((prev) => [...prev, circle]);
    showToast(`أُضيفت ${name}`);
    persist(() => saveCircle(circle));
  };
  const updateCircle = (id, patch) => {
    patchCircle(id, patch);
    showToast("تم تحديث بيانات الحلقة");
    persist(() => saveCircleInfo(id, patch));
  };
  const deleteCircle = (id) => {
    setCircles((prev) => prev.filter((c) => c.id !== id));
    showToast("حُذفت الحلقة");
    persist(() => removeCircle(id));
  };
  const addStudents = (circleId, names) => {
    const clean = names.map((n) => n.trim()).filter(Boolean);
    if (!clean.length) return;
    const newOnes = clean.map((name) => ({
      id: uid(), name, juz: 0, parentCode: genCode("WALI"), scores: {}, ranges: {},
      yesterday: { scores: {}, ranges: {} }, notes: "", done: false,
    }));
    setCircles((prev) => prev.map((c) => c.id === circleId ? { ...c, students: [...c.students, ...newOnes] } : c));
    showToast(clean.length > 1 ? `أُضيف ${arNum(clean.length)} طلاب` : `أُضيف ${clean[0]}`);
    persist(() => saveStudents(circleId, newOnes));
  };
  const setStudentParentCode = (circleId, sid, code) => {
    setCircles((prev) => prev.map((c) => c.id !== circleId ? c
      : { ...c, students: c.students.map((s) => s.id === sid ? { ...s, parentCode: code } : s) }));
    persist(() => saveStudentParentCode(sid, code));
  };
  const renameStudent = (circleId, sid, name) => {
    setCircles((prev) => prev.map((c) => c.id !== circleId ? c
      : { ...c, students: c.students.map((s) => s.id === sid ? { ...s, name } : s) }));
    persist(() => saveStudentName(sid, name));
  };
  const deleteStudent = (circleId, sid) => {
    setCircles((prev) => prev.map((c) => c.id !== circleId ? c
      : { ...c, students: c.students.filter((s) => s.id !== sid) }));
    persist(() => removeStudent(sid));
  };

  const handlePersist = (idx, { scores, ranges, notes }) => {
    patchStudent(view.circleId, idx, { scores: { ...scores }, ranges: { ...ranges }, notes });
  };

  const handleSaveAndNext = (idx, { scores, ranges, notes }) => {
    const circleId = view.circleId;
    patchStudent(circleId, idx, { scores: { ...scores }, ranges: { ...ranges }, notes, done: true });

    const students = circleById(circleId).students;
    persist(() => saveEvaluation(students[idx].id, date, { scores, ranges, notes, total: evalTotal(scores), done: true }));
    const isDone = (i) => i === idx || students[i].done;
    let next = -1;
    for (let step = 1; step < students.length; step++) {
      const i = (idx + step) % students.length;
      if (!isDone(i)) { next = i; break; }
    }
    showToast(`تم حفظ تقييم ${students[idx].name.split(" ")[0]} ✦`);
    const from = view.from;
    setTimeout(() => {
      if (next !== -1) setView({ name: "eval", circleId, idx: next, from });
      else if (idx < students.length - 1) setView({ name: "eval", circleId, idx: idx + 1, from });
      else { showToast("اكتمل تقييم جميع طلاب الحلقة 🎉"); setTimeout(() => setView({ name: "students", circleId, from }), 700); }
    }, 480);
  };

  const handleNav = (dir) => {
    const students = circleById(view.circleId).students;
    const ni = view.idx + dir;
    if (ni < 0 || ni >= students.length) return;
    setView({ name: "eval", circleId: view.circleId, idx: ni, from: view.from });
  };

  const openStudent = (sid) => {
    const idx = circleById(view.circleId).students.findIndex((s) => s.id === sid);
    setView({ name: "eval", circleId: view.circleId, idx, from: view.from });
  };

  // ---- routing ----
  let screen;
  if (loading) {
    screen = <Splash />;
  } else if (!session) {
    screen = <LoginScreen onLogin={login} />;
  } else if (session.role === "parent") {
    const circle = circleById(session.circleId);
    const child = circle?.students.find((s) => s.id === session.studentId);
    screen = circle && child ? (
      <ReportsScreen role="parent" circles={[circle]} date={date} onBack={null} lockStudentId={child.id} />
    ) : (
      <div className="page"><div className="empty">تعذّر العثور على سجل الطالب — راجع المشرف</div></div>
    );
  } else if (session.role === "admin" && view.name === "admin") {
    screen = (
      <AdminDashboard
        circles={circles}
        date={date}
        isSuper={session.isSuper}
        admins={admins}
        onCreateAdmin={createAdminAccount}
        onUpdateAdmin={updateAdminAccount}
        onDeleteAdmin={deleteAdminAccount}
        onOpenCircle={(id) => setView({ name: "students", circleId: id, from: "admin" })}
        onSetCode={(id, code) => { patchCircle(id, { accessCode: code }); persist(() => saveAccessCode(id, code)); }}
        onManage={() => setView({ name: "manage" })}
        onReports={() => setView({ name: "reports" })}
        onParents={() => setView({ name: "parents" })}
        onChangePassword={changeAdminPassword}
        toast={showToast}
      />
    );
  } else if (view.name === "reports") {
    const forAdmin = session.role === "admin";
    screen = (
      <ReportsScreen
        role={session.role}
        circles={forAdmin ? circles : [circleById(session.circleId)]}
        date={date}
        onBack={() => setView(forAdmin ? { name: "admin" } : { name: "students", circleId: session.circleId })}
      />
    );
  } else if (session.role === "admin" && session.isSuper && view.name === "parents") {
    screen = (
      <ParentAccessScreen
        circles={circles}
        onSetParentCode={setStudentParentCode}
        onBack={() => setView({ name: "admin" })}
        toast={showToast}
      />
    );
  } else if (session.role === "admin" && view.name === "manage") {
    screen = (
      <ManageScreen
        circles={circles}
        onBack={() => setView({ name: "admin" })}
        onAddCircle={addCircle}
        onUpdateCircle={updateCircle}
        onDeleteCircle={deleteCircle}
        onAddStudents={addStudents}
        onRenameStudent={renameStudent}
        onDeleteStudent={deleteStudent}
        toast={showToast}
      />
    );
  } else if (view.name === "students") {
    const backToAdmin = session.role === "admin";
    screen = (
      <StudentsScreen
        circle={circleById(view.circleId)}
        date={date}
        onChangeDate={setDate}
        onBack={backToAdmin ? () => setView({ name: "admin" }) : null}
        onReports={session.role === "sheikh" ? () => setView({ name: "reports" }) : null}
        onOpenStudent={openStudent}
      />
    );
  } else {
    screen = (
      <EvalScreen
        key={`${view.circleId}-${view.idx}`}
        circle={circleById(view.circleId)}
        studentIdx={view.idx}
        date={date}
        onBack={() => setView({ name: "students", circleId: view.circleId, from: view.from })}
        onPersist={handlePersist}
        onSaveAndNext={handleSaveAndNext}
        onNav={handleNav}
        toast={showToast}
      />
    );
  }

  const identity = !session
    ? ""
    : session.role === "admin"
      ? (session.name || "لوحة المشرف")
      : session.role === "parent"
        ? `ولي أمر · ${session.name}`
        : circleById(session.circleId)?.name || "";

  return (
    <>
      <AppBar
        identity={identity}
        session={session}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="shell">{screen}</main>
      <Toast toast={toast} />
    </>
  );
}
