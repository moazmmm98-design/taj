import Icon from "./Icon.jsx";

export default function Toast({ toast }) {
  const ok = toast?.ok !== false;
  return (
    <div className="toast-wrap">
      <div className={"toast" + (toast?.visible ? " show" : "")}>
        <span className="tk" style={{ background: ok ? "var(--q5)" : "var(--gold)" }}>
          <Icon name={ok ? "check" : "alert-triangle"} size={13} stroke={2.5} />
        </span>
        <span>{toast?.msg}</span>
      </div>
    </div>
  );
}
