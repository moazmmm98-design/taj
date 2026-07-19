import { arNum, QVARS, POINT_LABELS } from "../data.js";

// اختيار من قيَم نقاط محددة (١/٥/١٠/١٥) — يُحتسب في المجموع
export default function PointsChoice({ value, options, onChange }) {
  const labels = POINT_LABELS[options.length] || [];
  const colorAt = (i) => QVARS[Math.min(4, Math.round((i / (options.length - 1)) * 4))];

  return (
    <div className="seg">
      {options.map((opt, i) => {
        const on = value === opt;
        return (
          <button
            key={opt}
            className="seg-btn"
            aria-pressed={on}
            aria-label={`${opt} نقاط`}
            onClick={() => onChange(opt)}
            style={on ? { background: `var(${colorAt(i)})`, color: "#fff" } : undefined}
          >
            <span className="num">{arNum(opt)}</span>
            <span className="tick">{labels[i] || "نقاط"}</span>
          </button>
        );
      })}
    </div>
  );
}
