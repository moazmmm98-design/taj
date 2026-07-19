// تجزئة SHA-256 → نص سداسي عشري (لتخزين كلمة مرور المشرف دون نص صريح)
export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
