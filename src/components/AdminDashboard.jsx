import { useMemo } from "react";
import Icon from "./Icon.jsx";
import AccessManager from "./AccessManager.jsx";
import AdminPassword from "./AdminPassword.jsx";
import {
  arNum, initials, totalOf, gradeOf, MAX_TOTAL,
  overallStats, circleStats, gradeDistribution, leaderboard, attentionList, makeWeekTrend,
} from "../data.js";

/* ---------- KPI tile ---------- */
function Kpi({ icon, label, value, sub, tone }) {
  return (
    <div className="kpi" style={tone ? { "--kpi": `var(${tone})` } : undefined}>
      <div className="kpi-icon"><Icon name={icon} size={20} /></div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* ---------- horizontal bar list ---------- */
function Bars({ rows }) {
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar-row" key={r.key} title={`${r.label}: ${r.display}`}>
          <div className="bar-label">{r.label}</div>
          <div className="bar-track">
            <span style={{ width: `${r.value}%`, background: `var(${r.colorVar})` }} />
          </div>
          <div className="bar-value">{r.display}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- grade distribution (stacked) ---------- */
function Distribution({ dist }) {
  const totalDone = dist.reduce((a, g) => a + g.count, 0) || 1;
  return (
    <div>
      <div className="stacked">
        {dist.map((g) =>
          g.count ? (
            <span
              key={g.label}
              style={{ width: `${(g.count / totalDone) * 100}%`, background: `var(${g.v})` }}
              title={`${g.label}: ${arNum(g.count)}`}
            />
          ) : null
        )}
      </div>
      <div className="legend">
        {dist.map((g) => (
          <div className="legend-item" key={g.label}>
            <span className="legend-dot" style={{ background: `var(${g.v})` }} />
            <span className="legend-label">{g.label}</span>
            <span className="legend-count">{arNum(g.count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 7-day trend (area) ---------- */
function Trend({ data }) {
  const W = 700, H = 190, pad = 26;
  const lo = 50, hi = 100;
  const x = (i) => pad + (i * (W - pad * 2)) / (data.length - 1);
  const y = (v) => H - pad - ((v - lo) / (hi - lo)) * (H - pad * 2);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.avg)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;
  const last = data[data.length - 1];
  return (
    <svg className="trend" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
      aria-label="اتجاه المتوسط العام خلال الأسبوع">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[60, 70, 80, 90].map((g) => (
        <line key={g} x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} className="trend-grid" />
      ))}
      <path d={area} fill="url(#trendFill)" />
      <path d={line} className="trend-line" />
      {data.map((d, i) => (
        <g key={d.day}>
          <circle cx={x(i)} cy={y(d.avg)} r={i === data.length - 1 ? 5 : 3.2} className="trend-dot" />
          <text x={x(i)} y={H - 7} className="trend-x">{d.day}</text>
        </g>
      ))}
      <text x={x(data.length - 1)} y={y(last.avg) - 12} className="trend-end">{arNum(last.avg)}</text>
    </svg>
  );
}

/* ---------- ranked student list ---------- */
function RankList({ items, variant }) {
  return (
    <div className="ranklist">
      {items.map(({ student, circle, total }, i) => {
        const grade = gradeOf(total);
        return (
          <div className="rank-row" key={student.id + circle.id}>
            <span className={"rank-num " + variant}>{arNum(i + 1)}</span>
            <div className="avatar sm">{initials(student.name)}</div>
            <div className="rank-body">
              <div className="rank-name">{student.name}</div>
              <div className="rank-meta">{circle.name}</div>
            </div>
            <span className="rank-score" style={{ color: `var(${grade.v})` }}>
              {arNum(total)}<em>/{arNum(MAX_TOTAL)}</em>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- circle status pill ---------- */
function statusOf(st) {
  if (st.done === 0) return { label: "لم تبدأ", cls: "s-idle" };
  if (st.pct === 100) return { label: "مكتملة", cls: "s-done" };
  return { label: "جارية", cls: "s-active" };
}

/* ============ main ============ */
export default function AdminDashboard({ circles, date, onOpenCircle, onSetCode, onManage, onReports, onChangePassword, toast }) {
  const overall = useMemo(() => overallStats(circles), [circles]);
  const perCircle = useMemo(() => circles.map((c) => ({ c, st: circleStats(c) })), [circles]);
  const dist = useMemo(() => gradeDistribution(circles), [circles]);
  const top = useMemo(() => leaderboard(circles, 5), [circles]);
  const attention = useMemo(() => attentionList(circles, 5), [circles]);
  const trend = useMemo(() => makeWeekTrend(), []);
  const grade = gradeOf(overall.avg);

  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  const completionRows = perCircle.map(({ c, st }) => ({
    key: c.id, label: c.name, value: st.pct, display: `${arNum(st.pct)}٪`, colorVar: "--primary",
  }));
  const avgRows = perCircle.map(({ c, st }) => ({
    key: c.id, label: c.name, value: st.avg, display: `${arNum(st.avg)}`, colorVar: gradeOf(st.avg).v,
  }));

  return (
    <div className="page admin">
      <div className="admin-top">
        <div>
          <div className="eyebrow">⬦ الإدارة</div>
          <h1 className="h1">لوحة المشرف</h1>
          <p className="sub">نظرة شاملة على أداء المخيم — {dateLabel}</p>
        </div>
        <div className="admin-top-actions">
          <button className="manage-btn" onClick={onReports}><Icon name="printer" size={16} /> التقارير والطباعة</button>
          <button className="manage-btn" onClick={onManage}><Icon name="settings" size={16} /> إدارة الحلقات والطلاب</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <Kpi icon="users" label="إجمالي الطلاب" value={arNum(overall.total)} tone="--primary" />
        <Kpi icon="library" label="الحلقات" value={arNum(overall.circles)} sub={`${arNum(overall.teachers)} معلمين`} tone="--primary" />
        <Kpi icon="check-circle" label="تم تقييمهم اليوم" value={`${arNum(overall.done)} / ${arNum(overall.total)}`} sub={`${arNum(overall.pct)}٪ من الطلاب`} tone="--q5" />
        <Kpi icon="clock" label="بانتظار التقييم" value={arNum(overall.pending)} tone="--gold" />
        <Kpi icon="target" label="المتوسط العام" value={`${arNum(overall.avg)} / ${arNum(MAX_TOTAL)}`} sub={grade.label} tone={grade.v} />
      </div>

      {/* charts */}
      <div className="admin-grid two">
        <section className="panel">
          <div className="panel-head"><h3>إنجاز التقييم لكل حلقة</h3><span className="panel-note">النسبة المئوية</span></div>
          <Bars rows={completionRows} />
        </section>
        <section className="panel">
          <div className="panel-head"><h3>متوسط الأداء لكل حلقة</h3><span className="panel-note">من {arNum(MAX_TOTAL)}</span></div>
          <Bars rows={avgRows} />
        </section>
      </div>

      <div className="admin-grid two">
        <section className="panel">
          <div className="panel-head"><h3>توزيع التقديرات</h3><span className="panel-note">الطلاب المُقيَّمون</span></div>
          <Distribution dist={dist} />
        </section>
        <section className="panel">
          <div className="panel-head"><h3>اتجاه المتوسط العام</h3><span className="panel-note">آخر ٧ أيام</span></div>
          <Trend data={trend} />
        </section>
      </div>

      {/* lists */}
      <div className="admin-grid two">
        <section className="panel">
          <div className="panel-head"><h3><Icon name="award" size={17} className="ic-lead" /> الأعلى أداءً</h3></div>
          <RankList items={top} variant="top" />
        </section>
        <section className="panel">
          <div className="panel-head"><h3><Icon name="alert-triangle" size={17} className="ic-warn" /> يحتاجون متابعة</h3></div>
          <RankList items={attention} variant="low" />
        </section>
      </div>

      {/* circles table */}
      <section className="panel">
        <div className="panel-head"><h3>الحلقات والمعلمون</h3><span className="panel-note">اضغط لعرض الطلاب</span></div>
        <div className="table-scroll">
          <table className="ctable">
            <thead>
              <tr>
                <th>الحلقة</th><th>المعلم</th><th>الطلاب</th><th>الإنجاز</th><th>المتوسط</th><th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {perCircle.map(({ c, st }) => {
                const s = statusOf(st);
                const g = gradeOf(st.avg);
                return (
                  <tr key={c.id} onClick={() => onOpenCircle(c.id)} tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onOpenCircle(c.id)}>
                    <td className="c-name"><span className="c-ico"><Icon name={c.icon} size={17} /></span>{c.name}</td>
                    <td className="c-muted">{c.teacher}</td>
                    <td>{arNum(st.total)}</td>
                    <td>
                      <div className="cell-prog">
                        <span className="cell-track"><i style={{ width: `${st.pct}%` }} /></span>
                        <span className="cell-pct">{arNum(st.pct)}٪</span>
                      </div>
                    </td>
                    <td><span className="cell-avg" style={{ color: `var(${g.v})` }}>{st.done ? arNum(st.avg) : "—"}</span></td>
                    <td><span className={"cstatus " + s.cls}>{s.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* access codes */}
      <AccessManager circles={circles} onSetCode={onSetCode} toast={toast} />

      {/* admin password */}
      <AdminPassword onChangePassword={onChangePassword} />
    </div>
  );
}
