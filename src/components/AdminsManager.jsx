import { useState } from "react";
import Icon from "./Icon.jsx";
import { initials } from "../data.js";

/* ---------- add-admin form ---------- */
function AddAdminForm({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setName(""); setPassword(""); setShow(false); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await onCreate(name, password);
      if (!res.ok) return setError(res.error);
      reset(); setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return <button className="mini-btn primary" onClick={() => setOpen(true)}><Icon name="user-plus" size={14} /> إضافة مشرف</button>;
  }
  return (
    <form className="pw-form" onSubmit={submit} style={{ maxWidth: "none" }}>
      <label className="fg"><span>اسم المشرف</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أحمد العتيبي" autoFocus />
      </label>
      <label className="fg"><span>كلمة المرور</span>
        <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password" placeholder="٤ أحرف على الأقل — يدخل بها المشرف" />
      </label>
      <label className="pw-show">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> إظهار كلمة المرور
      </label>
      {error && <div className="login-error"><Icon name="alert-triangle" size={14} /> {error}</div>}
      <div className="pw-actions">
        <button type="submit" className="mini-btn primary" disabled={busy}>{busy ? "جارٍ الحفظ…" : "إنشاء المشرف"}</button>
        <button type="button" className="mini-btn" onClick={() => { reset(); setOpen(false); }}>إلغاء</button>
      </div>
    </form>
  );
}

/* ---------- one admin row (view / edit) ---------- */
function AdminRow({ admin, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(admin.name);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const cancel = () => { setEditing(false); setName(admin.name); setPassword(""); setShow(false); setError(""); };
  const remove = () => { if (window.confirm(`حذف المشرف «${admin.name}»؟ لن يتمكّن من الدخول بعد الآن.`)) onDelete(admin.id); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await onUpdate(admin.id, { name, password: password || undefined });
      if (!res.ok) return setError(res.error);
      setPassword(""); setShow(false); setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <div className="ms-row">
        <div className="avatar sm">{initials(admin.name) || "؟"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mc-name" style={{ fontSize: 14 }}>{admin.name}</div>
          <div className="mc-teacher">مشرف</div>
        </div>
        <button className="ms-del" onClick={() => setEditing(true)} title="تعديل المشرف"
          style={{ color: "var(--ink-2)" }}><Icon name="settings" size={15} /></button>
        <button className="ms-del" onClick={remove} title="حذف المشرف"><Icon name="trash" size={15} /></button>
      </div>
    );
  }

  return (
    <form className="pw-form" onSubmit={submit} style={{ maxWidth: "none", padding: "4px 2px 10px" }}>
      <label className="fg"><span>اسم المشرف</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <label className="fg"><span>كلمة مرور جديدة <em style={{ color: "var(--ink-3)", fontStyle: "normal", fontWeight: 600 }}>(اتركها فارغة للإبقاء عليها)</em></span>
        <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password" placeholder="•••• لتغيير كلمة المرور" />
      </label>
      <label className="pw-show">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> إظهار كلمة المرور
      </label>
      {error && <div className="login-error"><Icon name="alert-triangle" size={14} /> {error}</div>}
      <div className="pw-actions">
        <button type="submit" className="mini-btn primary" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ التعديلات"}</button>
        <button type="button" className="mini-btn" onClick={cancel}>إلغاء</button>
      </div>
    </form>
  );
}

/* ============ main ============ */
export default function AdminsManager({ admins, onCreate, onUpdate, onDelete }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3><Icon name="users" size={17} className="ic-lead" /> المشرفون</h3>
        <span className="panel-note">للمشرف العام فقط — يدخل كل مشرف بكلمة مروره</span>
      </div>

      {admins.length === 0 ? (
        <p className="code-note" style={{ margin: "0 0 12px" }}>
          <Icon name="shield-check" size={13} /> لا يوجد مشرفون بعد. أضِف مشرفاً وامنحه كلمة مرور ليدخل بها ويظهر اسمه.
        </p>
      ) : (
        <div className="ms-list" style={{ maxHeight: "none", marginBottom: 12 }}>
          {admins.map((a) => (
            <AdminRow key={a.id} admin={a} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}

      <AddAdminForm onCreate={onCreate} />

      <p className="code-note">
        <Icon name="lock" size={12} /> تُخزَّن كلمات المرور مُجزّأة (SHA-256). يدخل المشرف من تبويب «مشرف» بكلمة مروره فقط.
      </p>
    </section>
  );
}
