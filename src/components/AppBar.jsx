import Icon from "./Icon.jsx";
import logo from "../assets/logo.jpg";
import { ORG } from "../data.js";

export default function AppBar({ identity, session, onLogout, theme, onToggleTheme }) {
  const isDark =
    theme === "dark" ||
    (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <header className="appbar">
      <div className="appbar-in">
        <div className="brandmark"><img src={logo} alt={ORG.camp} /></div>
        <div className="brand-txt">
          <b>{ORG.camp}</b>
          <span>{identity || ORG.waqf}</span>
        </div>
        <div className="ab-spacer" />

        {session && (
          <button className="logout-btn" onClick={onLogout} title="تسجيل الخروج">
            <Icon name="power" size={16} />
            <span className="logout-lbl">خروج</span>
          </button>
        )}

        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title="تبديل الوضع الليلي"
          aria-label="تبديل الوضع الليلي"
        >
          <Icon name={isDark ? "sun" : "moon"} size={18} />
        </button>
      </div>
    </header>
  );
}
