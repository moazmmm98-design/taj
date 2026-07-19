import { useState } from "react";
import Icon from "./Icon.jsx";
import logo from "../assets/logo.jpg";
import { ORG } from "../data.js";
import { hasSupabase } from "../lib/supabase.js";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("sheikh"); // 'sheikh' | 'admin'
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  const switchMode = (m) => { setMode(m); setSecret(""); setError(""); setShow(false); };

  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!secret.trim()) return setError(mode === "admin" ? "أدخل كلمة مرور المشرف" : "أدخل رمز الحلقة");
    setBusy(true);
    try {
      const res = await onLogin(mode, secret);
      if (!res.ok) setError(res.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <img src={logo} alt={ORG.camp} className="login-logo" />
          <h1>{ORG.camp}</h1>
          <p>{ORG.waqf} · منصّة تقييم الطلاب</p>
        </div>

        <div className="login-tabs" role="tablist">
          <button className={"login-tab" + (mode === "sheikh" ? " active" : "")}
            onClick={() => switchMode("sheikh")} aria-selected={mode === "sheikh"}>
            <Icon name="user" size={16} /> معلّم
          </button>
          <button className={"login-tab" + (mode === "admin" ? " active" : "")}
            onClick={() => switchMode("admin")} aria-selected={mode === "admin"}>
            <Icon name="shield" size={16} /> مشرف
          </button>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label className="login-label">
            {mode === "admin" ? "كلمة مرور المشرف" : "رمز الحلقة"}
          </label>
          <div className={"login-field" + (error ? " err" : "")}>
            <input
              type={mode === "admin" && !show ? "password" : "text"}
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setError(""); }}
              placeholder={mode === "admin" ? "••••••••" : "مثال: NAFI-4821"}
              autoComplete="off"
              autoFocus
              dir={mode === "admin" ? "ltr" : "ltr"}
              style={{ textAlign: "center", letterSpacing: mode === "admin" ? "2px" : "1px" }}
            />
            {mode === "admin" && (
              <button type="button" className="login-eye" onClick={() => setShow((s) => !s)}
                aria-label={show ? "إخفاء" : "إظهار"}><Icon name={show ? "eye-off" : "eye"} size={17} /></button>
            )}
          </div>

          {error && <div className="login-error"><Icon name="alert-triangle" size={14} /> {error}</div>}

          <button type="submit" className="login-btn" disabled={busy}>
            {busy ? "جارٍ الدخول…" : (mode === "admin" ? "دخول لوحة المشرف" : "دخول الحلقة")}
          </button>
        </form>

        <div className="login-hint">
          {mode === "admin"
            ? (hasSupabase
                ? <>أدخل كلمة مرور المشرف الخاصة بك</>
                : <>للتجربة، كلمة المرور: <code>admin1234</code></>)
            : <>احصل على رمز حلقتك من المشرف</>}
        </div>
      </div>

      <p className="login-foot"><Icon name="lock" size={13} /> الوصول مُقيَّد — كل معلّم يرى طلاب حلقته فقط</p>
    </div>
  );
}
