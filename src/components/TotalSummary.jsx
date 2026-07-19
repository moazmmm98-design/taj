import { SCORE_KEYS, MAXES, MAX_TOTAL, META, arNum, gradeOf } from "../data.js";

// بطاقة المجموع النهائي — تظهر في آخر الشاشة وتتحدّث لحظياً
export default function TotalSummary({ scores }) {
  const total = SCORE_KEYS.reduce((a, k) => a + (Number(scores?.[k]) || 0), 0);
  const grade = gradeOf(total);
  const pct = Math.round((total / MAX_TOTAL) * 100);

  return (
    <div className="total-card" style={{ "--g": `var(${grade.v})` }}>
      <div className="total-head">
        <div>
          <div className="total-eyebrow">المجموع النهائي</div>
          <div className="total-num">
            {arNum(total)}<span className="total-den"> / {arNum(MAX_TOTAL)}</span>
          </div>
        </div>
        <span className="grade-pill">{grade.label}</span>
      </div>

      <div className="total-bar"><span style={{ width: `${pct}%` }} /></div>

      <div className="breakdown">
        {SCORE_KEYS.map((k) => {
          const v = Number(scores?.[k]) || 0;
          const max = MAXES[k];
          return (
            <div className="bd-row" key={k}>
              <span className="bd-label">{META[k].label}</span>
              <span className="bd-mini"><i style={{ width: `${(v / max) * 100}%` }} /></span>
              <span className="bd-val">{arNum(v)}<em>/{arNum(max)}</em></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
