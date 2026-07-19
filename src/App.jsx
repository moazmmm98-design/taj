import { useEffect, useRef, useState } from "react";
import AppBar from "./components/AppBar.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import StudentsScreen from "./components/StudentsScreen.jsx";
import EvalScreen from "./components/EvalScreen.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import ManageScreen from "./components/ManageScreen.jsx";
import ReportsScreen from "./components/ReportsScreen.jsx";
import Toast from "./components/Toast.jsx";
import { makeCircles, ADMIN_PASSWORD, genCode, arNum } from "./data.js";

const uid = () =>
  (window.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2));

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
  const [circles, setCircles] = useState(makeCircles);
  const [session, setSession] = useState(null); // null | {role:'sheikh', circleId} | {role:'admin'}
  const [view, setView] = useState({ name: "students" });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [theme, setTheme] = useState(null);
  const [toast, setToast] = useState({ msg: "", ok: true, visible: false });
  const [loading, setLoading] = useState(true);
  const toastTimer = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
  }, [theme]);

  // توسيع العرض في شاشات المشرف الواسعة
  useEffect(() => {
    const wideViews = ["admin", "manage", "reports"];
    const wide = session?.role === "admin" && wideViews.includes(view.name);
    document.documentElement.style.setProperty("--maxw", wide ? "1060px" : "560px");
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

  // ---- المصادقة (تمثيلية للنموذج — تُستبدل بنداء API) ----
  const login = (mode, secret) => {
    if (mode === "admin") {
      if (secret === ADMIN_PASSWORD) {
        setSession({ role: "admin" });
        setView({ name: "admin" });
        return { ok: true };
      }
      return { ok: false, error: "كلمة مرور المشرف غير صحيحة" };
    }
    const code = secret.trim().toLowerCase();
    const circle = circles.find((c) => c.accessCode.toLowerCase() === code);
    if (circle) {
      setSession({ role: "sheikh", circleId: circle.id });
      setView({ name: "students", circleId: circle.id });
      showToast(`أهلاً بك في ${circle.name}`);
      return { ok: true };
    }
    return { ok: false, error: "رمز الحلقة غير صحيح — تحقّق من الرمز أو راجع المشرف" };
  };

  const logout = () => { setSession(null); setView({ name: "students" }); };

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
  };
  const deleteCircle = (id) => {
    setCircles((prev) => prev.filter((c) => c.id !== id));
    showToast("حُذفت الحلقة");
  };
  const addStudents = (circleId, names) => {
    const clean = names.map((n) => n.trim()).filter(Boolean);
    if (!clean.length) return;
    const newOnes = clean.map((name) => ({
      id: uid(), name, juz: 0, scores: {}, ranges: {},
      yesterday: { scores: {}, ranges: {} }, notes: "", done: false,
    }));
    setCircles((prev) => prev.map((c) => c.id === circleId ? { ...c, students: [...c.students, ...newOnes] } : c));
    showToast(clean.length > 1 ? `أُضيف ${arNum(clean.length)} طلاب` : `أُضيف ${clean[0]}`);
  };
  const renameStudent = (circleId, sid, name) => {
    setCircles((prev) => prev.map((c) => c.id !== circleId ? c
      : { ...c, students: c.students.map((s) => s.id === sid ? { ...s, name } : s) }));
  };
  const deleteStudent = (circleId, sid) => {
    setCircles((prev) => prev.map((c) => c.id !== circleId ? c
      : { ...c, students: c.students.filter((s) => s.id !== sid) }));
  };

  const handlePersist = (idx, { scores, ranges, notes }) => {
    patchStudent(view.circleId, idx, { scores: { ...scores }, ranges: { ...ranges }, notes });
  };

  const handleSaveAndNext = (idx, { scores, ranges, notes }) => {
    const circleId = view.circleId;
    patchStudent(circleId, idx, { scores: { ...scores }, ranges: { ...ranges }, notes, done: true });

    const students = circleById(circleId).students;
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
  } else if (session.role === "admin" && view.name === "admin") {
    screen = (
      <AdminDashboard
        circles={circles}
        date={date}
        onOpenCircle={(id) => setView({ name: "students", circleId: id, from: "admin" })}
        onSetCode={(id, code) => patchCircle(id, { accessCode: code })}
        onManage={() => setView({ name: "manage" })}
        onReports={() => setView({ name: "reports" })}
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
  } else if (session.role === "admin" && view.name === "manage") {
    screen = (
      <ManageScreen
        circles={circles}
        onBack={() => setView({ name: "admin" })}
        onAddCircle={addCircle}
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
      ? "لوحة المشرف"
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
