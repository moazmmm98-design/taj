import { arNum, qVarByRatio } from "../data.js";

// إدخال رقمي بحدّ أعلى (جودة الحفظ/المراجعة) — يُحتسب في المجموع
export default function NumberField({ value, max, onChange }) {
  const has = value != null && value !== "";
  const num = has ? Number(value) : null;
  const clamp = (v) => Math.max(0, Math.min(max, v));
  const color = has ? `var(${qVarByRatio(num / max)})` : "var(--ink-3)";

  const setVal = (v) => {
    if (v === "" || v == null) return onChange(undefined);
    onChange(clamp(Number(v)));
  };
  const step = (d) => onChange(clamp((num || 0) + d));

  return (
    <div className="numfield">
      <button className="num-step" onClick={() => step(-1)} aria-label="إنقاص" tabIndex={-1}>−</button>
      <div className="num-box" style={{ borderColor: has ? color : "var(--line)" }}>
        <input
          type="number" min="0" max={max} inputMode="numeric"
          value={has ? value : ""}
          onChange={(e) => setVal(e.target.value)}
          placeholder="0"
          style={{ color }}
        />
        <span className="num-max">/ {arNum(max)}</span>
      </div>
      <button className="num-step" onClick={() => step(1)} aria-label="زيادة" tabIndex={-1}>+</button>
    </div>
  );
}
