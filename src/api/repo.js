// طبقة الوصول للبيانات — Supabase عند ضبط المفاتيح، وإلا بيانات وهمية في الذاكرة.
import { supabase, hasSupabase } from "../lib/supabase.js";
import { TODAY, addDays } from "../data.js";

const HISTORY_DAYS = 34; // كم يوماً ماضياً نحمّله للتقارير

// ============ تحميل الحلقات + تقييمات الفترة الأخيرة ============
export async function loadCircles() {
  if (!hasSupabase) return []; // بدون خادم: تبدأ فارغة (تُنشأ الحلقات من إدارة المشرف)

  const { data: circles, error } = await supabase
    .from("circles")
    .select("id,name,teacher,icon,access_code,students(id,name,juz,parent_code)")
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
        id: s.id, name: s.name, juz: s.juz || 0, parentCode: s.parent_code || "",
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
  const rows = students.map((s) => ({ id: s.id, circle_id: circleId, name: s.name, juz: s.juz || 0, parent_code: s.parentCode || null }));
  const { error } = await supabase.from("students").insert(rows);
  if (error) throw error;
}
export async function saveStudentName(id, name) {
  if (!hasSupabase) return;
  const { error } = await supabase.from("students").update({ name }).eq("id", id);
  if (error) throw error;
}
export async function saveStudentParentCode(id, code) {
  if (!hasSupabase) return;
  const { error } = await supabase.from("students").update({ parent_code: code }).eq("id", id);
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

// ============ المشرفون (يديرهم المشرف العام) ============
// المشرف العام = صاحب كلمة مرور البيئة/التطبيق (خارج هذا الجدول).
// المشرفون هنا يدخلون بكلمة مرورهم فقط، ويُطابَق تجزئتها للتعرّف عليهم.
let demoAdmins = []; // للوضع التجريبي فقط (بدون خادم) — يُعاد ضبطه عند إعادة التحميل

export async function listAdmins() {
  if (!hasSupabase) return demoAdmins.map(({ id, name, created_at }) => ({ id, name, created_at }));
  const { data, error } = await supabase
    .from("admins").select("id,name,created_at").order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function findAdminByPassword(hash) {
  if (!hasSupabase) {
    const a = demoAdmins.find((x) => x.password_hash === hash);
    return a ? { id: a.id, name: a.name } : null;
  }
  const { data, error } = await supabase
    .from("admins").select("id,name").eq("password_hash", hash).maybeSingle();
  if (error) throw error;
  return data || null;
}
export async function getAdminById(id) {
  if (!hasSupabase) {
    const a = demoAdmins.find((x) => x.id === id);
    return a ? { id: a.id, name: a.name } : null;
  }
  const { data, error } = await supabase
    .from("admins").select("id,name").eq("id", id).maybeSingle();
  if (error) throw error;
  return data || null;
}
export async function createAdmin(name, passwordHash) {
  if (!hasSupabase) {
    if (demoAdmins.some((x) => x.password_hash === passwordHash)) { const e = new Error("duplicate"); e.code = "23505"; throw e; }
    const admin = { id: (crypto.randomUUID?.() || String(Date.now())), name, password_hash: passwordHash, created_at: new Date().toISOString() };
    demoAdmins.push(admin);
    return { id: admin.id, name: admin.name };
  }
  const { data, error } = await supabase
    .from("admins").insert({ name, password_hash: passwordHash }).select("id,name").single();
  if (error) throw error;
  return data;
}
export async function updateAdmin(id, patch) {
  // patch: { name?, passwordHash? }
  const fields = {};
  if (patch.name !== undefined) fields.name = patch.name;
  if (patch.passwordHash !== undefined) fields.password_hash = patch.passwordHash;
  if (!Object.keys(fields).length) return;
  if (!hasSupabase) {
    const a = demoAdmins.find((x) => x.id === id);
    if (!a) return;
    if (fields.password_hash !== undefined && demoAdmins.some((x) => x.id !== id && x.password_hash === fields.password_hash)) {
      const e = new Error("duplicate"); e.code = "23505"; throw e;
    }
    if (fields.name !== undefined) a.name = fields.name;
    if (fields.password_hash !== undefined) a.password_hash = fields.password_hash;
    return;
  }
  const { error } = await supabase.from("admins").update(fields).eq("id", id);
  if (error) throw error;
}
export async function deleteAdmin(id) {
  if (!hasSupabase) { demoAdmins = demoAdmins.filter((x) => x.id !== id); return; }
  const { error } = await supabase.from("admins").delete().eq("id", id);
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
