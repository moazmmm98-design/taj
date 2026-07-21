// ============ نموذج التقييم ============
// أنواع الحقول:
//   range   : كتابي (من – إلى) — لا يُحتسب في المجموع
//   number  : رقمي بحدّ أعلى (جودة) — يُحتسب
//   points  : اختيار من قيَم نقاط محددة — يُحتسب

export const FIELDS = [
  {
    icon: "book-open", title: "الحفظ", items: [
      { key: "hifz_p1",      label: "مقدار الحفظ (الجلسة الأولى)",  type: "range" },
      { key: "hifz_p2",      label: "مقدار الحفظ (الجلسة الثانية)", type: "range" },
      { key: "hifz_quality", label: "جودة الحفظ",                    type: "number", max: 20 },
    ],
  },
  {
    icon: "repeat", title: "المراجعة", items: [
      { key: "rev_p1",       label: "مقدار المراجعة (الجلسة الأولى)",  type: "range" },
      { key: "rev_p2",       label: "مقدار المراجعة (الجلسة الثانية)", type: "range" },
      { key: "rev_quality",  label: "جودة المراجعة",                    type: "number", max: 20 },
    ],
  },
  {
    icon: "clock", title: "الانضباط", items: [
      { key: "attend", label: "حضور الحلقة في الوقت",       type: "points", options: [1, 5, 10] },
      { key: "commit", label: "الالتزام بتعليمات المخيم",   type: "points", options: [1, 5, 10] },
    ],
  },
  {
    icon: "star", title: "السلوك والعبادة", items: [
      { key: "manners",  label: "حسن الأدب مع المعلم والزملاء", type: "points", options: [1, 5, 10, 15] },
      { key: "prayers",  label: "المحافظة على الصلوات والأذكار", type: "points", options: [1, 5, 10, 15] },
      { key: "activity", label: "المشاركة الفاعلة في الأنشطة",  type: "points", options: [1, 5, 10] },
    ],
  },
];

// الحقول التي تدخل في المجموع النهائي (جودة الحفظ والمراجعة ضمنها)
export const SCORE_KEYS = ["hifz_quality", "rev_quality", "attend", "commit", "manners", "prayers", "activity"];
export const RANGE_KEYS = ["hifz_p1", "hifz_p2", "rev_p1", "rev_p2"];

// الحدّ الأقصى لكل حقل مُحتسب (مشتق من التعريف أعلاه)
export const MAXES = (() => {
  const m = {};
  FIELDS.forEach((sec) => sec.items.forEach((it) => {
    if (it.type === "number") m[it.key] = it.max;
    else if (it.type === "points") m[it.key] = Math.max(...it.options);
  }));
  return m;
})();

export const MAX_TOTAL = SCORE_KEYS.reduce((a, k) => a + MAXES[k], 0); // = 100

export const META = (() => {
  const m = {};
  FIELDS.forEach((sec) => sec.items.forEach((it) => (m[it.key] = it)));
  return m;
})();

// تسميات وصفية لأزرار النقاط (حسب عدد الخيارات)
export const POINT_LABELS = {
  3: ["ضعيف", "جيد", "ممتاز"],
  4: ["ضعيف", "مقبول", "جيد", "ممتاز"],
};

// متغيّرات CSS لمقياس اللون 1..5
export const QVARS = ["--q1", "--q2", "--q3", "--q4", "--q5"];

export const GRADES = [
  { min: 90, label: "ممتاز",        v: "--q5" },
  { min: 80, label: "جيد جداً",     v: "--q4" },
  { min: 70, label: "جيد",          v: "--q3" },
  { min: 60, label: "مقبول",        v: "--q2" },
  { min: 0,  label: "يحتاج تحسين",  v: "--q1" },
];

export const SURAHS = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];

// ---- تواريخ (ISO yyyy-mm-dd) ----
export const TODAY = new Date().toISOString().slice(0, 10);
export const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// هوية المخيم
export const ORG = {
  waqf: "وقف أنوار القرآن",
  camp: "مخيم تاج الوقار 8",
  full: "وقف أنوار القرآن — مخيم تاج الوقار 8",
};

// كلمة مرور المشرف (للنموذج فقط — في الإنتاج تُدار في الخادم)
export const ADMIN_PASSWORD = "admin1234";

// توليد رمز دخول للحلقة: بادئة + 4 أرقام (مثال: NAFI-4821)
export const genCode = (prefix = "HALQA") =>
  `${prefix}-${1000 + Math.floor(Math.random() * 9000)}`;

// ============ أدوات مساعدة ============
export const arNum = (n) => Number(n).toLocaleString("ar-EG");
export const initials = (name) => {
  const p = name.trim().split(/\s+/);
  return (p[0]?.charAt(0) || "") + (p[1]?.charAt(0) || "");
};
export const totalOf = (student) =>
  SCORE_KEYS.reduce((a, k) => a + (Number(student.scores?.[k]) || 0), 0);
export const isComplete = (scores) => SCORE_KEYS.every((k) => scores?.[k] != null && scores[k] !== "");
export const gradeOf = (total) => GRADES.find((g) => total >= g.min);
export const doneCount = (circle) => circle.students.filter((s) => s.done).length;

// لون حسب النسبة (0..1) من مقياس الجودة
export const qVarByRatio = (r) => QVARS[Math.min(4, Math.max(0, Math.round(r * 4)))];

// ============ إحصاءات لوحة المشرف ============
export const circleStats = (c) => {
  const total = c.students.length;
  const done = c.students.filter((s) => s.done);
  const doneN = done.length;
  const avg = doneN ? Math.round(done.reduce((a, s) => a + totalOf(s), 0) / doneN) : 0;
  return { total, done: doneN, pending: total - doneN, pct: total ? Math.round((doneN / total) * 100) : 0, avg };
};

export const overallStats = (circles) => {
  const students = circles.flatMap((c) => c.students);
  const done = students.filter((s) => s.done);
  const doneN = done.length;
  const avg = doneN ? Math.round(done.reduce((a, s) => a + totalOf(s), 0) / doneN) : 0;
  return {
    circles: circles.length,
    teachers: new Set(circles.map((c) => c.teacher)).size,
    total: students.length,
    done: doneN,
    pending: students.length - doneN,
    pct: students.length ? Math.round((doneN / students.length) * 100) : 0,
    avg,
  };
};

// توزيع التقديرات بين الطلاب المُقيَّمين (مرتّب ممتاز → يحتاج تحسين)
export const gradeDistribution = (circles) => {
  const counts = GRADES.map((g) => ({ ...g, count: 0 }));
  circles.flatMap((c) => c.students).filter((s) => s.done).forEach((s) => {
    const gi = GRADES.findIndex((g) => totalOf(s) >= g.min);
    if (gi >= 0) counts[gi].count++;
  });
  return counts;
};

const rankedStudents = (circles) =>
  circles.flatMap((c) => c.students.filter((s) => s.done).map((s) => ({ student: s, circle: c, total: totalOf(s) })));

export const leaderboard = (circles, n = 5) =>
  rankedStudents(circles).sort((a, b) => b.total - a.total).slice(0, n);

export const attentionList = (circles, n = 5) =>
  rankedStudents(circles).sort((a, b) => a.total - b.total).slice(0, n);

// ============ التقارير (يومي / أسبوعي / شهري) ============
export const PERIODS = {
  daily:   { key: "daily",   label: "يومي",   days: 1 },
  weekly:  { key: "weekly",  label: "أسبوعي", days: 7 },
  monthly: { key: "monthly", label: "شهري",   days: 30 },
};
export const periodMeta = (p) => PERIODS[p] || PERIODS.daily;

export const periodRange = (anchor, period) => {
  const days = periodMeta(period).days;
  return { from: addDays(anchor, -(days - 1)), to: anchor, days };
};

export const fmtDate = (dateStr, opts) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("ar-EG", opts || { day: "numeric", month: "long", year: "numeric" });

// سجلات طالب ضمن مدى (تشمل تقييم اليوم الحيّ إن وُجد)
export const studentRecords = (student, from, to) => {
  const hist = (student.history || []).filter((r) => r.date >= from && r.date <= to);
  const live = TODAY >= from && TODAY <= to && student.done && Object.keys(student.scores || {}).length
    ? [{ date: TODAY, scores: student.scores, ranges: student.ranges, total: totalOf(student), live: true }]
    : [];
  const merged = [...hist.filter((r) => r.date !== TODAY), ...live];
  return merged.sort((a, b) => (a.date < b.date ? -1 : 1));
};

// اتجاه المتوسط العام خلال ٧ أيام (من التقييمات الفعلية)
export const weekTrend = (circles) => {
  const students = circles.flatMap((c) => c.students);
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(TODAY, -i);
    let sum = 0, n = 0;
    students.forEach((s) => studentRecords(s, d, d).forEach((r) => { sum += r.total; n++; }));
    const day = new Date(d + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "long" });
    out.push({ day, avg: n ? Math.round(sum / n) : 0 });
  }
  return out;
};

// إحصاء مدى من سجلات
export const rangeStats = (records) => {
  const count = records.length;
  const avgTotal = count ? Math.round(records.reduce((a, r) => a + r.total, 0) / count) : 0;
  const perCrit = {};
  SCORE_KEYS.forEach((k) => {
    perCrit[k] = count ? Math.round(records.reduce((a, r) => a + (r.scores[k] || 0), 0) / count) : 0;
  });
  return { count, avgTotal, perCrit };
};

// إحصاء حلقة خلال مدى (متوسط متوسطات طلابها الذين قُيّموا)
export const circlePeriodStats = (circle, from, to) => {
  const rows = circle.students.map((s) => ({ student: s, ...rangeStats(studentRecords(s, from, to)) }));
  const evaluated = rows.filter((r) => r.count > 0);
  const avg = evaluated.length ? Math.round(evaluated.reduce((a, r) => a + r.avgTotal, 0) / evaluated.length) : 0;
  return { rows, evaluated: evaluated.length, total: circle.students.length, avg };
};
