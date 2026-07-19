import { useState } from "react";
import Icon from "./Icon.jsx";
import { genCode } from "../data.js";

function CodeRow({ circle, onSetCode, toast }) {
  const [reveal, setReveal] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(circle.accessCode);
      toast(`نُسخ رمز ${circle.name}`);
    } catch {
      toast("تعذّر النسخ", false);
    }
  };
  const regen = () => {
    onSetCode(circle.id, genCode(circle.codePrefix));
    toast(`تم توليد رمز جديد لـ${circle.name} — أُلغي الرمز القديم`);
  };

  return (
    <div className="code-row">
      <div className="code-info">
        <div className="code-circle"><span>{circle.icon}</span>{circle.name}</div>
        <div className="code-teacher">{circle.teacher}</div>
      </div>
      <div className="code-controls">
        <div className="code-field">
          <input
            type={reveal ? "text" : "password"}
            value={circle.accessCode}
            onChange={(e) => onSetCode(circle.id, e.target.value)}
            aria-label={`رمز ${circle.name}`}
            spellCheck="false"
          />
          <button className="code-eye" onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "إخفاء" : "إظهار"} title={reveal ? "إخفاء" : "إظهار"}>
            <Icon name={reveal ? "eye-off" : "eye"} size={15} />
          </button>
        </div>
        <button className="code-btn" onClick={regen} title="توليد رمز جديد"><Icon name="refresh-cw" size={16} /></button>
        <button className="code-btn" onClick={copy} title="نسخ الرمز"><Icon name="copy" size={16} /></button>
      </div>
    </div>
  );
}

export default function AccessManager({ circles, onSetCode, toast }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3><Icon name="key" size={17} className="ic-lead" /> أكواد دخول الحلقات</h3>
        <span className="panel-note">لكل حلقة رمز فريد يدخل به معلّمها</span>
      </div>
      <div className="code-list">
        {circles.map((c) => (
          <CodeRow key={c.id} circle={c} onSetCode={onSetCode} toast={toast} />
        ))}
      </div>
      <p className="code-note">
        <Icon name="lock" size={12} /> للنموذج فقط: في الإنتاج تُخزَّن الرموز مُجزّأة (hashed) في الخادم، ويُفرض التقييد على مستوى الـ API.
      </p>
    </section>
  );
}
