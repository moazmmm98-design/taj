import { useState } from "react";
import Icon from "./Icon.jsx";
import { arNum, initials } from "../data.js";

const ICONS = ["book-open", "book", "library", "bookmark", "graduation-cap", "star"];

/* ---------- add-circle form ---------- */
function AddCircleForm({ onAddCircle }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddCircle({ name: name.trim(), teacher: teacher.trim() || "غير محدد", icon });
    setName(""); setTeacher(""); setIcon(ICONS[0]); setOpen(false);
  };

  if (!open) {
    return <button className="add-circle-btn" onClick={() => setOpen(true)}><Icon name="plus" size={18} /> إضافة حلقة جديدة</button>;
  }
  return (
    <form className="panel add-form" onSubmit={submit}>
      <div className="panel-head"><h3>حلقة جديدة</h3>
        <button type="button" className="ghost-x" onClick={() => setOpen(false)} aria-label="إلغاء"><Icon name="x" size={16} /></button>
      </div>
      <div className="form-grid">
        <label className="fg full"><span>اسم الحلقة *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: حلقة الإمام الدوري" autoFocus />
        </label>
        <label className="fg full"><span>المعلّم</span>
          <input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="اسم الشيخ" />
        </label>
        <div className="fg full"><span>الأيقونة</span>
          <div className="icon-pick">
            {ICONS.map((ic) => (
              <button type="button" key={ic} className={"icon-opt" + (icon === ic ? " on" : "")} onClick={() => setIcon(ic)}><Icon name={ic} size={20} /></button>
            ))}
          </div>
        </div>
      </div>
      <button type="submit" className="save-btn" style={{ marginTop: 14 }}>إنشاء الحلقة</button>
    </form>
  );
}

/* ---------- per-circle student manager ---------- */
function CircleCard({ circle, onUpdateCircle, onDeleteCircle, onAddStudents, onRenameStudent, onDeleteStudent, toast }) {
  const [name, setName] = useState("");
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const addOne = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddStudents(circle.id, [name]);
    setName("");
  };
  const addBulk = () => {
    const names = bulkText.split(/[\n,،]+/).map((n) => n.trim()).filter(Boolean);
    if (!names.length) return toast("لا توجد أسماء صالحة", false);
    onAddStudents(circle.id, names);
    setBulkText(""); setBulk(false);
  };
  const removeCircle = () => {
    if (window.confirm(`حذف «${circle.name}» وكل طلابها؟`)) onDeleteCircle(circle.id);
  };

  return (
    <section className="panel manage-card">
      <div className="mc-head">
        <div className="mc-title"><span className="mc-ico"><Icon name={circle.icon} size={22} /></span>
          <div className="mc-edit">
            <input className="mc-name-input" value={circle.name}
              onChange={(e) => onUpdateCircle(circle.id, { name: e.target.value })} aria-label="اسم الحلقة" />
            <div className="mc-teacher-row">
              <input className="mc-teacher-input" value={circle.teacher}
                onChange={(e) => onUpdateCircle(circle.id, { teacher: e.target.value })} aria-label="اسم الشيخ" placeholder="اسم الشيخ" />
              <span className="mc-count">· {arNum(circle.students.length)} طالب</span>
            </div>
          </div>
        </div>
        <button className="del-circle" onClick={removeCircle} title="حذف الحلقة"><Icon name="trash" size={16} /></button>
      </div>

      {/* add students */}
      {!bulk ? (
        <form className="add-student" onSubmit={addOne}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الطالب…" />
          <button type="submit" className="mini-btn primary"><Icon name="plus" size={14} /> إضافة</button>
          <button type="button" className="mini-btn" onClick={() => setBulk(true)}><Icon name="clipboard" size={14} /> لصق عدة أسماء</button>
        </form>
      ) : (
        <div className="bulk-add">
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)}
            placeholder={"الصق الأسماء — اسم في كل سطر:\nعبدالله الحربي\nمحمد القحطاني\n…"} rows={5} />
          <div className="bulk-actions">
            <button className="mini-btn primary" onClick={addBulk}>إضافة الكل</button>
            <button className="mini-btn" onClick={() => { setBulk(false); setBulkText(""); }}>إلغاء</button>
          </div>
        </div>
      )}

      {/* student list */}
      {circle.students.length === 0 ? (
        <div className="empty" style={{ padding: "22px 10px" }}>لا يوجد طلاب بعد — أضِف الأسماء بالأعلى</div>
      ) : (
        <div className="ms-list">
          {circle.students.map((s, i) => (
            <div className="ms-row" key={s.id}>
              <span className="ms-idx">{arNum(i + 1)}</span>
              <div className="avatar sm">{initials(s.name) || "؟"}</div>
              <input className="ms-name" value={s.name}
                onChange={(e) => onRenameStudent(circle.id, s.id, e.target.value)} aria-label="اسم الطالب" />
              <button className="ms-del" onClick={() => onDeleteStudent(circle.id, s.id)} title="حذف الطالب"><Icon name="x" size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============ main ============ */
export default function ManageScreen({
  circles, onBack, onAddCircle, onUpdateCircle, onDeleteCircle, onAddStudents, onRenameStudent, onDeleteStudent, toast,
}) {
  return (
    <div className="page admin">
      <button className="back-link" onClick={onBack}><Icon name="chevron-right" size={16} /> لوحة المشرف</button>
      <h1 className="h1">إدارة الحلقات والطلاب</h1>
      <p className="sub">أنشئ حلقات جديدة وأضِف أسماء الطلاب — فردياً أو دفعةً واحدة</p>

      <div style={{ marginTop: 18 }}><AddCircleForm onAddCircle={onAddCircle} /></div>

      <div className="manage-list">
        {circles.map((c) => (
          <CircleCard key={c.id} circle={c}
            onUpdateCircle={onUpdateCircle}
            onDeleteCircle={onDeleteCircle} onAddStudents={onAddStudents}
            onRenameStudent={onRenameStudent} onDeleteStudent={onDeleteStudent} toast={toast} />
        ))}
      </div>
    </div>
  );
}
