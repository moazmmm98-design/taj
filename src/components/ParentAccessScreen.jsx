import { useState } from "react";
import Icon from "./Icon.jsx";
import { initials, genCode } from "../data.js";

/* ---------- one student's parent access code ---------- */
function StudentCodeRow({ circleId, student, onSetCode, toast }) {
  const [reveal, setReveal] = useState(false);
  const code = student.parentCode || "";

  const copy = async () => {
    if (!code) return toast("لا يوجد رمز بعد — ولّد رمزاً أولاً", false);
    try { await navigator.clipboard.writeText(code); toast(`نُسخ رمز ${student.name.split(" ")[0]}`); }
    catch { toast("تعذّر النسخ", false); }
  };
  const regen = () => { onSetCode(circleId, student.id, genCode("WALI")); toast("تم توليد رمز جديد لولي الأمر"); };

  return (
    <div className="code-row">
      <div className="code-info">
        <div className="code-circle"><div className="avatar sm">{initials(student.name) || "؟"}</div>{student.name}</div>
        <div className="code-teacher">رمز متابعة ولي الأمر</div>
      </div>
      <div className="code-controls">
        <div className="code-field">
          <input
            type={reveal ? "text" : "password"}
            value={code}
            onChange={(e) => onSetCode(circleId, student.id, e.target.value)}
            placeholder="—"
            aria-label={`رمز ولي أمر ${student.name}`}
            spellCheck="false"
          />
          <button className="code-eye" onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "إخفاء" : "إظهار"} title={reveal ? "إخفاء" : "إظهار"}>
            <Icon name={reveal ? "eye-off" : "eye"} size={15} />
          </button>
        </div>
        <button className="code-btn" onClick={regen} title="توليد رمز جديد"><Icon name="refresh-cw" size={16} /></button>
        <button className="code-btn" onClick={copy} title="نسخ الرمز"><Icon name="copy" size={16} /></button>
      </div>
    </div>
  );
}

/* ============ main ============ */
export default function ParentAccessScreen({ circles, onSetParentCode, onBack, toast }) {
  return (
    <div className="page admin">
      <button className="back-link" onClick={onBack}><Icon name="chevron-right" size={16} /> لوحة المشرف</button>
      <h1 className="h1">أكواد أولياء الأمور</h1>
      <p className="sub">لكل طالب رمز فريد يدخل به وليّ أمره من تبويب «ولي أمر» لمتابعة التقييم وطباعته</p>

      {circles.length === 0 ? (
        <div className="empty" style={{ marginTop: 26 }}>لا توجد حلقات بعد — أنشئ حلقات وأضِف طلاباً أولاً</div>
      ) : (
        <div className="manage-list" style={{ marginTop: 18 }}>
          {circles.map((c) => (
            <section className="panel" key={c.id}>
              <div className="panel-head">
                <h3><Icon name={c.icon} size={17} className="ic-lead" /> {c.name}</h3>
                <span className="panel-note">{c.teacher}</span>
              </div>
              {c.students.length === 0 ? (
                <div className="empty" style={{ padding: "18px 10px" }}>لا يوجد طلاب في هذه الحلقة</div>
              ) : (
                <div className="code-list">
                  {c.students.map((s) => (
                    <StudentCodeRow key={s.id} circleId={c.id} student={s} onSetCode={onSetParentCode} toast={toast} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="code-note" style={{ marginTop: 18 }}>
        <Icon name="lock" size={12} /> الرمز يمنح وليّ الأمر متابعة تقييم ابنه فقط (قراءة وطباعة) — دون أي تعديل.
      </p>
    </div>
  );
}
