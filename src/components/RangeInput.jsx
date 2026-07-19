// إدخال كتابي: من – إلى (بدون اسم سورة) — لا يُحتسب في المجموع
export default function RangeInput({ value = {}, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="rangeinput">
      <div className="pf">
        <label>من</label>
        <input
          value={value.from || ""}
          onChange={(e) => set({ from: e.target.value })}
          placeholder="من…"
          autoComplete="off"
        />
      </div>
      <span className="range-dash">–</span>
      <div className="pf">
        <label>إلى</label>
        <input
          value={value.to || ""}
          onChange={(e) => set({ to: e.target.value })}
          placeholder="إلى…"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
