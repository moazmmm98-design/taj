// طبقة الوصول للبيانات — Supabase عند ضبط المفاتيح، وإلا بيانات وهمية في الذاكرة.
import { supabase, hasSupabase } from "../lib/supabase.js";
import { TODAY, addDays } from "../data.js";

const HISTORY_DAYS = 34; // كم يوماً ماضياً نحمّله للتقارير

// ============ تحميل الحلقات + تقييمات الفترة الأخيرة ============
export async function loadCircles() {
  if (!hasSupabase) return []; // بدون خادم: تبدأ فارغة (تُنشأ الحلقات من إدارة المشرف)

  const { data: circles, error } = await supabase
    .from("circles")
    .select("id,name,teacher,icon,access_code,students(id,name,juz)")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const studentIds = (circles || []).flatMap((c) => (c.students || []).map((s) => s.id));
  let evals = [];
  if (studentIds.length) {
    const { data, error: e2 } = await supabase
      .from("evaluations")
      .select("student_id,date,scores,ranges,notes,total,done")
      .gte("date", addDays(TODAY, -HISTORY_DAYS))
      .lte("date", TODAY);
    if (e2) throw e2;
    evals = data || [];
  }

  const byStudent = {};
  evals.forEach((r) => { (byStudent[r.student_id] ||= []).push(r); });
  const yesterday = addDays(TODAY, -1);

  return (circles || []).map((c) => ({
    id: c.id, name: c.name, teacher: c.teacher, icon: c.icon || "book-open",
    level: "", room: "", codePrefix: "HALQA", accessCode: c.access_code,
    students: (c.students || []).map((s) => {
      const recs = (byStudent[s.id] || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
      const today = recs.find((r) => r.date === TODAY);
      const yRec = recs.find((r) => r.date === yesterday);
      return {
        id: s.id, name: s.name, juz: s.juz || 0,
        scores: today?.scores || {}, ranges: today?.ranges || {}, notes: today?.notes || "",
        done: Boolean(today?.done),
        yesterday: { scores: yRec?.scores || {}, ranges: yRec?.ranges || {} },
        history: recs.filter((r) => r.date !== TODAY)
          .map((r) => ({ date: r.date, scores: r.scores || {}, ranges: r.ranges || {}, total: r.total || 0 })),
      };
    }),
  }));
}

// ============ عمليات الكتابة (لا تفعل شيئاً في الوضع التجريبي) ============
export async function saveCircle(c) {
  if (!hasSupabase) return;
  const { error } = await supabase.from("circles")
    .insert({ id: c.id, name: c.name, teacher: c.teacher, icon: c.icon, access_code: c.accessCode });
  if (error) throw error;
}
export async function saveCircleInfo(id, patch) {
  if (!hasSupabase) return;
  const fields = {};
  if (patch.name !== undefined) fields.name = patch.name;
  if (patch.teacher !== undefined) fields.teacher = patch.teacher;
  if (!Object.keys(fields).length) return;
  const { error } = await supabase.from("circles").update(fields).eq("id", id);
  if (error) throw error;
}
export async function removeCircle(id) {
  if (!hasSupabase) return;
  const { error } = await supabase.from("circles").delete().eq("id", id);
  if (error) throw error;
}
export async function saveStudents(circleId, students) {
  if (!hasSupabase) return;
  const rows = students.map((s) => ({ id: s.id, circle_id: circleId, name: s.name, juz: s.juz || 0 }));
  const { error } = await supabase.from("students").insert(rows);
  if (error) throw error;
}
export async function saveStudentName(id, name) {
  if (!hasSupabase) return;
  const { error } = await supabase.from("students").update({ name }).eq("id", id);
  if (error) throw error;
}
export async function removeStudent(id) {
  if (!hasSupabase) return;
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}
export async function saveAccessCode(id, code) {
  if (!hasSupabase) return;
  const { error } = await supabase.from("circles").update({ access_code: code }).eq("id", id);
  if (error) throw error;
}
export async function saveEvaluation(studentId, date, { scores, ranges, notes, total, done }) {
  if (!hasSupabase) return;
  const { error } = await supabase.from("evaluations").upsert(
    { student_id: studentId, date, scores, ranges, notes: notes || "", total, done: !!done, updated_at: new Date().toISOString() },
    { onConflict: "student_id,date" }
  );
  if (error) throw error;
}

// ============ إعدادات التطبيق (كلمة مرور المشرف) ============
export async function getAdminPasswordHash() {
  if (!hasSupabase) return null;
  const { data, error } = await supabase
    .from("app_config").select("value").eq("key", "admin_password_hash").maybeSingle();
  if (error) throw error;
  return data?.value || null;
}
export async function setAdminPasswordHash(hash) {
  if (!hasSupabase) return;
  const { error } = await supabase.from("app_config").upsert(
    { key: "admin_password_hash", value: hash, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) throw error;
}
