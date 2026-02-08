const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const TOKEN_MODE_DEFAULT = process.env.TOKEN_MODE || "reuse";

function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) token += "-";
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const mode = body.mode || TOKEN_MODE_DEFAULT;
    const requestedIds = Array.isArray(body.student_ids) ? body.student_ids : [];
    const tokenMode = mode === "both" ? "reuse" : mode;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials missing.");
    }
    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error("SMTP credentials missing.");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let query = supabase
      .schema("torneros-elms")
      .from("students")
      .select("student_id, full_name, email")
      .is("deleted_at", null);
    if (tokenMode === "selected" && requestedIds.length > 0) {
      query = query.in("student_id", requestedIds);
    }
    const { data: students, error } = await query;
    if (error) throw error;
    if (!students || students.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No students found." }),
      };
    }

    const { data: existingTokens, error: tokenErr } = await supabase
      .schema("torneros-elms")
      .from("student_tokens")
      .select("student_id, token")
      .in(
        "student_id",
        students.map((s) => s.student_id)
      );
    if (tokenErr) throw tokenErr;

    const tokenMap = new Map(
      (existingTokens || []).map((t) => [t.student_id, t.token])
    );

    const payload = students.map((s) => ({
      student_id: s.student_id,
      token:
        tokenMode === "reuse" && tokenMap.get(s.student_id)
          ? tokenMap.get(s.student_id)
          : generateToken(),
    }));

    const { error: upsertErr } = await supabase
      .schema("torneros-elms")
      .from("student_tokens")
      .upsert(payload, { onConflict: "student_id" });
    if (upsertErr) throw upsertErr;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    let sent = 0;
    for (const s of students) {
      if (!s.email) continue;
      const token = payload.find((p) => p.student_id === s.student_id)?.token;
      if (!token) continue;
      await transporter.sendMail({
        from: SMTP_FROM,
        to: s.email,
        subject: "Your ELMS Access Token",
        text: `Hello ${s.full_name || "Student"},\n\nYour access token is:\n${token}\n\nUse this to view your grades.\n`,
      });
      sent += 1;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Tokens generated and emails sent.",
        sent,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err.message || err) }),
    };
  }
};
