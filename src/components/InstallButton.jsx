import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";

// هل التطبيق مُثبَّت ويعمل كتطبيق مستقل؟
const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;

// زر تثبيت التطبيق على الجهاز (PWA)
export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null); // حدث beforeinstallprompt (أندرويد/سطح المكتب)
  const [installed, setInstalled] = useState(isStandalone());
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPromptEvent(e); };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); setShowIosHelp(false); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // مُثبَّت مسبقاً — لا حاجة للزر
  if (installed) return null;

  const ios = isIOS();
  // على غير iOS نُظهر الزر فقط حين يتيح المتصفح التثبيت
  if (!ios && !promptEvent) return null;

  const onClick = async () => {
    if (ios) { setShowIosHelp((s) => !s); return; }
    promptEvent.prompt();
    try { await promptEvent.userChoice; } catch { /* تجاهل */ }
    setPromptEvent(null);
  };

  return (
    <div className="install-wrap">
      <button
        className="install-btn"
        onClick={onClick}
        title="تثبيت التطبيق على الجهاز"
        aria-label="تثبيت التطبيق على الجهاز"
      >
        <Icon name="download" size={16} />
        <span className="install-lbl">تثبيت التطبيق</span>
      </button>

      {ios && showIosHelp && (
        <>
          <div className="install-ios-back" onClick={() => setShowIosHelp(false)} />
          <div className="install-ios-pop" role="dialog">
            <b>تثبيت التطبيق على الايفون</b>
            <p>
              اضغط زر المشاركة <Icon name="share" size={15} className="ios-inline" /> في شريط سفاري،
              ثم اختر <span className="ios-em">«إضافة إلى الشاشة الرئيسية»</span>.
            </p>
            <button className="install-ios-ok" onClick={() => setShowIosHelp(false)}>حسناً</button>
          </div>
        </>
      )}
    </div>
  );
}
