import { useState } from "react";
import Icon from "./Icon.jsx";

export default function AdminPassword({ onChangePassword }) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setCur(""); setNext(""); setConfirm(""); setError(""); setShow(false); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) return setError("الكلمة الجديدة وتأكيدها غير متطابقين");
    setBusy(true);
    try {
      const res = await onChangePassword(cur, next);
      if (!res.ok) return setError(res.error);
      reset(); setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h3><Icon name="lock" size={16} className="ic-lead" /> كلمة مرور المشرف</h3>
        {!open && (
          <button className="mini-btn" onClick={() => setOpen(true)}>
            <Icon name="key" size={14} /> تغيير كلمة المرور
          </button>
        )}
      </div>

      {!open ? (
        <p className="code-note" style={{ margin: 0 }}>
          <Icon name="shield-check" size={13} /> غيّر كلمة مرور دخولك للوحة المشرف من هنا.
        </p>
      ) : (
        <form className="pw-form" onSubmit={submit}>
          <label className="fg"><span>كلمة المرور الحالية</span>
            <input type={show ? "text" : "password"} value={cur} onChange={(e) => setCur(e.target.value)} autoFocus autoComplete="current-password" />
          </label>
          <label className="fg"><span>كلمة المرور الجديدة</span>
            <input type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </label>
          <label className="fg"><span>تأكيد الكلمة الجديدة</span>
            <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </label>

          <label className="pw-show">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> إظهار كلمات المرور
          </label>

          {error && <div className="login-error"><Icon name="alert-triangle" size={14} /> {error}</div>}

          <div className="pw-actions">
            <button type="submit" className="mini-btn primary" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ"}</button>
            <button type="button" className="mini-btn" onClick={() => { reset(); setOpen(false); }}>إلغاء</button>
          </div>
        </form>
      )}
    </section>
  );
}
