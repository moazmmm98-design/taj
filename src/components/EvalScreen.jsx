import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import RangeInput from "./RangeInput.jsx";
import NumberField from "./NumberField.jsx";
import PointsChoice from "./PointsChoice.jsx";
import TotalSummary from "./TotalSummary.jsx";
import {
  FIELDS, isComplete, arNum, initials, qVarByRatio, POINT_LABELS,
} from "../data.js";

const RECS = ["أداء متميز، واصل", "بحاجة لمزيد من المراجعة", "ينصح بمتابعة الحضور", "تحسّن ملحوظ هذا اليوم"];

export default function EvalScreen({
  circle, studentIdx, date, onBack, onPersist, onSaveAndNext, onNav, toast,
}) {
  const student = circle.students[studentIdx];
  const [scores, setScores] = useState({ ...student.scores });
  const [ranges, setRanges] = useState({ ...student.ranges });
  const [notes, setNotes] = useState(student.notes || "");
  const [recording, setRecording] = useState(false);
  const recogRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    setScores({ ...student.scores });
    setRanges({ ...student.ranges });
    setNotes(student.notes || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [studentIdx, circle.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (s, r, n) => onPersist(studentIdx, { scores: s, ranges: r, notes: n });

  const setScore = (key, v) => {
    const next = { ...scores };
    if (v == null) delete next[key]; else next[key] = v;
    setScores(next);
    persist(next, ranges, notes);
  };
  const setRange = (key, v) => {
    const next = { ...ranges, [key]: v };
    setRanges(next);
    persist(scores, next, notes);
  };
  const changeNotes = (v) => { setNotes(v); persist(scores, ranges, v); };
  const addChip = (t) => { changeNotes(notes ? notes.replace(/\s*$/, "") + " · " + t : t); taRef.current?.focus(); };

  const copyYesterday = () => {
    const s = { ...student.yesterday.scores };
    const r = { ...student.yesterday.ranges };
    setScores(s); setRanges(r);
    persist(s, r, notes);
    toast("نُسخ تقييم الأمس — عدّله كما تشاء");
  };

  const save = () => {
    if (!isComplete(scores)) return toast("أكمل جميع بنود التقييم المُحتسبة أولاً", false);
    onSaveAndNext(studentIdx, { scores, ranges, notes });
  };
  const navTo = (dir) => { persist(scores, ranges, notes); onNav(dir); };

  const micToggle = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast("التعرّف الصوتي غير مدعوم هنا — جرّبه على الجوال", false);
    if (recording) return recogRef.current?.stop();
    try {
      const recog = new SR();
      recog.lang = "ar-SA"; recog.interimResults = false;
      recog.onstart = () => setRecording(true);
      recog.onerror = () => toast("تعذّر التقاط الصوت", false);
      recog.onend = () => setRecording(false);
      recog.onresult = (e) => {
        const txt = e.results[0][0].transcript;
        changeNotes(notes ? notes + " " + txt : txt);
        toast("حُوِّلت الملاحظة الصوتية إلى نص");
      };
      recogRef.current = recog; recog.start();
    } catch { toast("تعذّر بدء التسجيل", false); }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === "ArrowLeft") navTo(1);
      else if (e.key === "ArrowRight") navTo(-1);
      else if (e.key === "Enter") { save(); e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const total = circle.students.length;
  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })
    : "";

  const valueTag = (item) => {
    if (item.type === "range") {
      const r = ranges[item.key];
      const filled = r && (r.from || r.to);
      return (
        <span className="crit-value passage-tag">
          {filled ? `${r.from || "؟"} – ${r.to || "؟"}` : "لا يُحتسب"}
        </span>
      );
    }
    const v = scores[item.key];
    if (v == null) return <span className="crit-value unset">لم يُقيَّم</span>;
    if (item.type === "number") {
      return (
        <span className="crit-value" style={{ color: `var(${qVarByRatio(v / item.max)})` }}>
          {arNum(v)} / {arNum(item.max)}
        </span>
      );
    }
    const idx = item.options.indexOf(v);
    const lbl = (POINT_LABELS[item.options.length] || [])[idx];
    return <span className="crit-value" style={{ color: "var(--primary)" }}>{arNum(v)} نقاط · {lbl}</span>;
  };

  const isRated = (item) =>
    item.type === "range"
      ? !!(ranges[item.key] && (ranges[item.key].from || ranges[item.key].to))
      : scores[item.key] != null;

  return (
    <>
      <div className="page">
        <button className="back-link" onClick={onBack}><Icon name="chevron-right" size={16} /> {circle.name}</button>

        <div className="eval-head">
          <div className="avatar">{initials(student.name)}</div>
          <div className="eh-body">
            <div className="eh-name">{student.name}</div>
            <div className="eh-meta">{student.juz ? `الجزء ${arNum(student.juz)} · ` : ""}{circle.level}</div>
          </div>
          <span className="pos-chip">{arNum(studentIdx + 1)} / {arNum(total)}</span>
        </div>

        {dateLabel && <div className="date-chip"><Icon name="calendar" size={14} /> تقييم يوم {dateLabel}</div>}

        <button className="copy-btn" onClick={copyYesterday}><Icon name="copy" size={16} /> نسخ تقييم الأمس ثم التعديل</button>

        {FIELDS.map((sec) => (
          <div key={sec.title}>
            <div className="section-title">
              <Icon name={sec.icon} size={18} className="ic-lead" />{sec.title}<span className="ln" />
            </div>
            {sec.items.map((item) => (
              <div key={item.key} className={"crit" + (isRated(item) ? " rated" : "")}>
                <div className="crit-top">
                  <span className="crit-label">{item.label}</span>
                  {valueTag(item)}
                </div>
                {item.type === "range" && (
                  <RangeInput value={ranges[item.key]} onChange={(v) => setRange(item.key, v)} />
                )}
                {item.type === "number" && (
                  <NumberField value={scores[item.key]} max={item.max} onChange={(v) => setScore(item.key, v)} />
                )}
                {item.type === "points" && (
                  <PointsChoice value={scores[item.key]} options={item.options} onChange={(v) => setScore(item.key, v)} />
                )}
              </div>
            ))}
          </div>
        ))}

        <div className="notes-card">
          <div className="section-title"><Icon name="message-square" size={18} className="ic-lead" />توصيات المشرف<span className="ln" /></div>
          <div className="notes-tools">
            <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>اختياري</span>
            <button className={"mic-btn" + (recording ? " rec" : "")} onClick={micToggle}>
              <Icon name={recording ? "square" : "mic"} size={14} /> {recording ? "يستمع… اضغط للإيقاف" : "إملاء صوتي"}
            </button>
          </div>
          <textarea
            ref={taRef} value={notes}
            onChange={(e) => changeNotes(e.target.value)}
            placeholder="اكتب توصية للمشرف… (اختياري)"
          />
          <div className="chips">
            {RECS.map((t) => <button key={t} className="chip" onClick={() => addChip(t)}>{t}</button>)}
          </div>
        </div>

        <div className="section-title"><Icon name="calculator" size={18} className="ic-lead" />النتيجة<span className="ln" /></div>
        <TotalSummary scores={scores} />

        <div className="kbd-hint">اختصارات: <kbd>→ ←</kbd> للتنقل بين الطلاب · <kbd>Enter</kbd> للحفظ</div>
      </div>

      <div className="actionbar">
        <div className="actionbar-in">
          <button className="nav-btn" onClick={() => navTo(-1)} disabled={studentIdx === 0} title="السابق"><Icon name="chevron-right" /></button>
          <button className={"save-btn" + (student.done ? " done-state" : "")} onClick={save}>
            {student.done ? <><Icon name="check" size={18} /> محفوظ — التالي</> : "حفظ والانتقال للتالي"}
          </button>
          <button className="nav-btn" onClick={() => navTo(1)} disabled={studentIdx === total - 1} title="التالي"><Icon name="chevron-left" /></button>
        </div>
      </div>
    </>
  );
}
