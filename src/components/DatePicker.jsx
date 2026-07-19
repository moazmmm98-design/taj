import Icon from "./Icon.jsx";

// اختيار تاريخ التقييم عبر التقويم — value بصيغة yyyy-mm-dd
export default function DatePicker({ value, onChange }) {
  const d = value ? new Date(value + "T00:00:00") : new Date();
  const label = d.toLocaleDateString("ar-EG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const openPicker = (e) => {
    const input = e.currentTarget.querySelector("input");
    if (input?.showPicker) { try { input.showPicker(); } catch { /* noop */ } }
  };
  return (
    <label className="datepick" onClick={openPicker}>
      <span className="dp-cal" aria-hidden="true"><Icon name="calendar" size={19} /></span>
      <span className="dp-text">
        <span className="dp-eyebrow">تاريخ التقييم</span>
        <span className="dp-value">{label}</span>
      </span>
      <span className="dp-chevron" aria-hidden="true"><Icon name="chevron-down" size={16} /></span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="تاريخ التقييم"
      />
    </label>
  );
}
