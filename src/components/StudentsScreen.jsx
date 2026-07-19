import { useState } from "react";
import Icon from "./Icon.jsx";
import ProgressBar from "./ProgressBar.jsx";
import DatePicker from "./DatePicker.jsx";
import { arNum, initials, totalOf, gradeOf, doneCount, MAX_TOTAL } from "../data.js";

function StudentRow({ student, onOpen }) {
  const total = totalOf(student);
  const grade = gradeOf(total);
  return (
    <button
      className={"srow" + (student.done ? " done" : "")}
      onClick={() => onOpen(student.id)}
    >
      <div className="avatar">{initials(student.name)}</div>
      <div className="srow-body">
        <div className="srow-name">{student.name}</div>
        <div className="srow-meta">
          {student.juz ? `الجزء ${arNum(student.juz)}` : "طالب جديد"}
          {student.done && (
            <>
              {" · "}
              <span style={{ color: `var(${grade.v})`, fontWeight: 700 }}>{grade.label}</span>
            </>
          )}
        </div>
      </div>
      {student.done ? (
        <span className="score-badge" style={{ color: `var(${grade.v})`, borderColor: `var(${grade.v})` }}>
          {arNum(total)}<em>/{arNum(MAX_TOTAL)}</em>
        </span>
      ) : (
        <span className="status-pill pending"><Icon name="clock" size={12} /> بانتظار</span>
      )}
    </button>
  );
}

export default function StudentsScreen({ circle, date, onChangeDate, onBack, onReports, onOpenStudent }) {
  const [q, setQ] = useState("");
  const tot = circle.students.length;
  const d = doneCount(circle);
  const pct = tot ? Math.round((d / tot) * 100) : 0;
  const list = circle.students.filter((s) => s.name.includes(q.trim()));

  return (
    <div className="page">
      {onBack && <button className="back-link" onClick={onBack}><Icon name="chevron-right" size={16} /> لوحة المشرف</button>}
      <div className="students-top">
        <h1 className="h1">{circle.name}</h1>
        {onReports && (
          <button className="manage-btn" onClick={onReports}><Icon name="printer" size={16} /> التقارير</button>
        )}
      </div>

      <DatePicker value={date} onChange={onChangeDate} />

      <div className="overview">
        <div className="stat done"><b>{arNum(d)}</b><span>تم تقييمهم</span></div>
        <div className="stat pending"><b>{arNum(tot - d)}</b><span>بانتظار التقييم</span></div>
        <div className="stat"><b>{arNum(pct)}٪</b><span>نسبة الإنجاز</span></div>
      </div>

      <div className="prog-label" style={{ marginTop: 6 }}>
        <span>الإنجاز الكلي</span>
        <span>{arNum(d)} من {arNum(tot)} طالباً</span>
      </div>
      <ProgressBar value={pct} />

      <div className="search-wrap">
        <div className="search">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="ابحث عن طالب بالاسم…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="student-list">
        {list.length ? (
          list.map((s) => <StudentRow key={s.id} student={s} onOpen={onOpenStudent} />)
        ) : (
          <div className="empty">لا يوجد طالب باسم «{q}»</div>
        )}
      </div>
    </div>
  );
}
