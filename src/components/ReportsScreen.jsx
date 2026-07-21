import { useState, useMemo } from "react";
import Icon from "./Icon.jsx";
import logo from "../assets/logo.jpg";
import {
  SCORE_KEYS, RANGE_KEYS, MAXES, MAX_TOTAL, META, ORG, arNum, totalOf, gradeOf, qVarByRatio,
  periodMeta, periodRange, fmtDate, studentRecords, rangeStats, circlePeriodStats,
} from "../data.js";

const PERIOD_LIST = ["daily", "weekly", "monthly"];

// نص المقدار: «من – إلى»
const rangeText = (r) => (!r || (!r.from && !r.to)) ? "—" : `${r.from || "؟"} – ${r.to || "؟"}`;

function GradePill({ total }) {
  const g = gradeOf(total);
  return <span className="rep-grade" style={{ background: `var(${g.v})` }}>{g.label}</span>;
}

function CritBars({ perCrit }) {
  return (
    <div className="bars">
      {SCORE_KEYS.map((k) => {
        const v = perCrit[k], max = MAXES[k];
        return (
          <div className="bar-row" key={k}>
            <div className="bar-label">{META[k].label}</div>
            <div className="bar-track"><span style={{ width: `${(v / max) * 100}%`, background: `var(${qVarByRatio(v / max)})` }} /></div>
            <div className="bar-value">{arNum(v)}<em style={{ color: "var(--ink-3)", fontWeight: 600, fontSize: 11 }}>/{arNum(max)}</em></div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- تقرير طالب ---------- */
function StudentReport({ student, circle, period, range }) {
  const records = useMemo(() => studentRecords(student, range.from, range.to), [student, range.from, range.to]);
  const stats = useMemo(() => rangeStats(records), [records]);

  if (period === "daily") {
    const rec = records.find((r) => r.date === range.to);
    return (
      <>
        <ReportHeader title={student.name} subtitle={`${circle.name} · تقرير يومي`} range={range} single />
        {!rec ? (
          <div className="rep-empty">لم يُقيَّم الطالب في هذا اليوم.</div>
        ) : (
          <>
            <div className="rep-scoreline">
              <div className="rep-big">{arNum(rec.total)}<span>/ {arNum(MAX_TOTAL)}</span></div>
              <GradePill total={rec.total} />
            </div>
            <table className="rep-table">
              <thead><tr><th>البند</th><th>الدرجة</th><th>من</th></tr></thead>
              <tbody>
                {SCORE_KEYS.map((k) => (
                  <tr key={k}><td>{META[k].label}</td>
                    <td className="num" style={{ color: `var(${qVarByRatio((rec.scores[k] || 0) / MAXES[k])})`, fontWeight: 800 }}>{arNum(rec.scores[k] || 0)}</td>
                    <td className="num muted">{arNum(MAXES[k])}</td></tr>
                ))}
                <tr className="rep-total-row"><td>المجموع</td><td className="num">{arNum(rec.total)}</td><td className="num">{arNum(MAX_TOTAL)}</td></tr>
              </tbody>
            </table>

            <h4 className="rep-h4">المقادير</h4>
            <table className="rep-table">
              <tbody>
                {RANGE_KEYS.map((k) => (
                  <tr key={k}><td>{META[k].label}</td><td className="num" style={{ fontWeight: 700 }}>{rangeText(rec.ranges?.[k])}</td></tr>
                ))}
              </tbody>
            </table>

            {rec.live && student.notes && <div className="rep-note"><b>توصيات المشرف:</b> {student.notes}</div>}
          </>
        )}
      </>
    );
  }

  // أسبوعي / شهري
  return (
    <>
      <ReportHeader title={student.name} subtitle={`${circle.name} · تقرير ${periodMeta(period).label}`} range={range} />
      <div className="rep-summary">
        <div className="rep-sum-tile"><b style={{ color: `var(${gradeOf(stats.avgTotal).v})` }}>{arNum(stats.avgTotal)}<em>/{arNum(MAX_TOTAL)}</em></b><span>متوسط الأداء</span></div>
        <div className="rep-sum-tile"><b>{gradeOf(stats.avgTotal).label}</b><span>التقدير العام</span></div>
        <div className="rep-sum-tile"><b>{arNum(stats.count)}<em>/{arNum(range.days)}</em></b><span>أيام التقييم</span></div>
      </div>

      <h4 className="rep-h4">متوسط البنود</h4>
      <CritBars perCrit={stats.perCrit} />

      <h4 className="rep-h4">التقييم اليومي خلال الجلسة</h4>
      <table className="rep-table">
        <thead><tr><th>اليوم</th><th>المجموع</th><th>التقدير</th></tr></thead>
        <tbody>
          {records.length === 0 && <tr><td colSpan={3} className="muted">لا سجلات في هذه الجلسة</td></tr>}
          {records.map((r) => (
            <tr key={r.date}><td>{fmtDate(r.date, { weekday: "long", day: "numeric", month: "short" })}</td>
              <td className="num" style={{ fontWeight: 800 }}>{arNum(r.total)}</td>
              <td style={{ color: `var(${gradeOf(r.total).v})`, fontWeight: 700 }}>{gradeOf(r.total).label}</td></tr>
          ))}
        </tbody>
      </table>

      {records.length > 0 && (
        <>
          <h4 className="rep-h4">سجل المقادير اليومية</h4>
          <div className="rep-table-scroll">
            <table className="rep-table">
              <thead><tr><th>اليوم</th><th>حفظ (ج1)</th><th>حفظ (ج2)</th><th>مراجعة (ج1)</th><th>مراجعة (ج2)</th></tr></thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.date}>
                    <td>{fmtDate(r.date, { day: "numeric", month: "short" })}</td>
                    <td className="num">{rangeText(r.ranges?.hifz_p1)}</td>
                    <td className="num">{rangeText(r.ranges?.hifz_p2)}</td>
                    <td className="num">{rangeText(r.ranges?.rev_p1)}</td>
                    <td className="num">{rangeText(r.ranges?.rev_p2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

/* ---------- تقرير حلقة (الشيخ لطلابه / المشرف لحلقة) ---------- */
function GroupReport({ circle, period, range }) {
  const cs = useMemo(() => circlePeriodStats(circle, range.from, range.to), [circle, range.from, range.to]);
  const isDaily = period === "daily";
  const rows = [...cs.rows].sort((a, b) => b.avgTotal - a.avgTotal);

  // لليومي: سجل اليوم لكل طالب (لعرض المقادير)
  const dayRecOf = (student) =>
    isDaily ? studentRecords(student, range.from, range.to).find((r) => r.date === range.to) : null;

  return (
    <>
      <ReportHeader title={circle.name} subtitle={`${circle.teacher} · تقرير ${periodMeta(period).label} لجميع الطلاب`} range={range} single={isDaily} />
      <div className="rep-summary">
        <div className="rep-sum-tile"><b style={{ color: `var(${gradeOf(cs.avg).v})` }}>{arNum(cs.avg)}<em>/{arNum(MAX_TOTAL)}</em></b><span>متوسط الحلقة</span></div>
        <div className="rep-sum-tile"><b>{arNum(cs.evaluated)}<em>/{arNum(cs.total)}</em></b><span>{isDaily ? "تم تقييمهم" : "طلاب لهم سجل"}</span></div>
        <div className="rep-sum-tile"><b>{gradeOf(cs.avg).label}</b><span>تقدير الحلقة</span></div>
      </div>

      <div className="rep-table-scroll">
        <table className="rep-table">
          <thead><tr>
            <th>#</th><th>الطالب</th><th>{isDaily ? "المجموع" : "المتوسط"}</th>
            {isDaily && <><th>مقدار الحفظ</th><th>مقدار المراجعة</th></>}
            {!isDaily && <th>أيام</th>}
            <th>التقدير</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const rec = dayRecOf(r.student);
              return (
                <tr key={r.student.id}>
                  <td className="num muted">{arNum(i + 1)}</td>
                  <td>{r.student.name}</td>
                  <td className="num" style={{ fontWeight: 800 }}>{r.count ? arNum(r.avgTotal) : "—"}</td>
                  {isDaily && (
                    <>
                      <td className="amt">
                        <div>ف١: {rangeText(rec?.ranges?.hifz_p1)}</div>
                        <div>ف٢: {rangeText(rec?.ranges?.hifz_p2)}</div>
                      </td>
                      <td className="amt">
                        <div>ف١: {rangeText(rec?.ranges?.rev_p1)}</div>
                        <div>ف٢: {rangeText(rec?.ranges?.rev_p2)}</div>
                      </td>
                    </>
                  )}
                  {!isDaily && <td className="num muted">{arNum(r.count)}</td>}
                  <td style={{ color: r.count ? `var(${gradeOf(r.avgTotal).v})` : "var(--ink-3)", fontWeight: 700 }}>
                    {r.count ? gradeOf(r.avgTotal).label : "لم يُقيَّم"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- تقرير المشرف (كل الحلقات) ---------- */
function AdminReport({ circles, period, range }) {
  const data = useMemo(() => circles.map((c) => ({ circle: c, cs: circlePeriodStats(c, range.from, range.to) })), [circles, range.from, range.to]);
  const evaluatedCircles = data.filter((d) => d.cs.avg > 0);
  const overallAvg = evaluatedCircles.length ? Math.round(evaluatedCircles.reduce((a, d) => a + d.cs.avg, 0) / evaluatedCircles.length) : 0;
  const totalStudents = data.reduce((a, d) => a + d.cs.total, 0);
  const totalEval = data.reduce((a, d) => a + d.cs.evaluated, 0);
  const isDaily = period === "daily";

  return (
    <>
      <ReportHeader title="جميع الحلقات" subtitle={`تقرير ${periodMeta(period).label} — المخيم القرآني`} range={range} single={isDaily} />
      <div className="rep-summary">
        <div className="rep-sum-tile"><b>{arNum(circles.length)}</b><span>الحلقات</span></div>
        <div className="rep-sum-tile"><b>{arNum(totalStudents)}</b><span>الطلاب</span></div>
        <div className="rep-sum-tile"><b>{arNum(totalEval)}<em>/{arNum(totalStudents)}</em></b><span>{isDaily ? "تم تقييمهم" : "لهم سجل"}</span></div>
        <div className="rep-sum-tile"><b style={{ color: `var(${gradeOf(overallAvg).v})` }}>{arNum(overallAvg)}<em>/{arNum(MAX_TOTAL)}</em></b><span>المتوسط العام</span></div>
      </div>

      <table className="rep-table">
        <thead><tr><th>الحلقة</th><th>المعلّم</th><th>الطلاب</th><th>{isDaily ? "الإنجاز" : "لهم سجل"}</th><th>المتوسط</th><th>التقدير</th></tr></thead>
        <tbody>
          {data.map(({ circle, cs }) => (
            <tr key={circle.id}>
              <td style={{ fontWeight: 700 }}>{circle.name}</td>
              <td className="muted">{circle.teacher}</td>
              <td className="num">{arNum(cs.total)}</td>
              <td className="num">{arNum(cs.evaluated)}<span className="muted"> / {arNum(cs.total)}</span></td>
              <td className="num" style={{ fontWeight: 800, color: cs.avg ? `var(${gradeOf(cs.avg).v})` : "var(--ink-3)" }}>{cs.avg ? arNum(cs.avg) : "—"}</td>
              <td style={{ color: cs.avg ? `var(${gradeOf(cs.avg).v})` : "var(--ink-3)", fontWeight: 700 }}>{cs.avg ? gradeOf(cs.avg).label : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ---------- رأس التقرير المطبوع ---------- */
function ReportHeader({ title, subtitle, range, single }) {
  return (
    <div className="rep-header">
      <div className="rep-brand">
        <img src={logo} alt={ORG.camp} className="rep-logo-img" />
        <div className="rep-org">
          <b>{ORG.waqf}</b>
          <span>{ORG.camp}</span>
        </div>
      </div>
      <h2 className="rep-title">{title}</h2>
      <div className="rep-sub">{subtitle}</div>
      <div className="rep-range">
        {single ? fmtDate(range.to) : `من ${fmtDate(range.from, { day: "numeric", month: "short" })} إلى ${fmtDate(range.to)}`}
      </div>
    </div>
  );
}

/* ============ main ============ */
export default function ReportsScreen({ role, circles, date, onBack, lockStudentId }) {
  const isParent = role === "parent";
  const [period, setPeriod] = useState("daily");
  const [circleId, setCircleId] = useState(role === "admin" ? "all" : circles[0].id);
  const [studentId, setStudentId] = useState(lockStudentId || "all");
  const [anchor, setAnchor] = useState(date);

  const range = periodRange(anchor, period);
  const circle = circleId === "all" ? null : circles.find((c) => c.id === circleId);
  const student = circle && studentId !== "all" ? circle.students.find((s) => s.id === studentId) : null;

  const onCircleChange = (id) => { setCircleId(id); setStudentId("all"); };

  let report;
  if (!circle) report = <AdminReport circles={circles} period={period} range={range} />;
  else if (!student) report = <GroupReport circle={circle} period={period} range={range} />;
  else report = <StudentReport student={student} circle={circle} period={period} range={range} />;

  return (
    <div className="page admin">
      <div className="no-print">
        {onBack && (
          <button className="back-link" onClick={onBack}>
            <Icon name="chevron-right" size={16} /> {role === "admin" ? "لوحة المشرف" : "الطلاب"}
          </button>
        )}
        <div className="admin-top">
          <div>
            <div className="eyebrow"><Icon name={isParent ? "users" : "printer"} size={13} className="ic-lead" /> {isParent ? "متابعة ولي الأمر" : "التقارير"}</div>
            <h1 className="h1">{isParent ? "متابعة أداء الطالب" : "التقارير والطباعة"}</h1>
            <p className="sub">{isParent ? "تابع تقييم ابنك يومياً وأسبوعياً وشهرياً — ويمكنك طباعته" : "اختر النطاق والجلسة ثم اطبع أو احفظ PDF"}</p>
          </div>
          <button className="manage-btn print-btn" onClick={() => window.print()}>
            <Icon name="printer" size={16} /> طباعة / حفظ PDF
          </button>
        </div>

        {/* controls */}
        <div className="rep-controls">
          <div className="rep-tabs">
            {PERIOD_LIST.map((p) => (
              <button key={p} className={"rep-tab" + (period === p ? " active" : "")} onClick={() => setPeriod(p)}>
                {periodMeta(p).label}
              </button>
            ))}
          </div>

          <div className="rep-selects">
            {role === "admin" && (
              <label className="rep-select"><span>الحلقة</span>
                <select value={circleId} onChange={(e) => onCircleChange(e.target.value)}>
                  <option value="all">كل الحلقات</option>
                  {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}
            {circle && !lockStudentId && (
              <label className="rep-select"><span>الطالب</span>
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                  <option value="all">كل الطلاب</option>
                  {circle.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            )}
            <label className="rep-select"><span>التاريخ المرجعي</span>
              <input type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      {/* printable */}
      <div className="printable"><div className="rep-doc">{report}</div></div>
    </div>
  );
}
