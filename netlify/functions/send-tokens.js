const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const PORTAL_LINK = process.env.PORTAL_LINK || "";
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
      .select("student_id, full_name, email, course")
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

    const { data: templates, error: tplErr } = await supabase
      .schema("torneros-elms")
      .from("mail_templates")
      .select("title, body_html, status, updated_at")
      .eq("status", "final")
      .order("updated_at", { ascending: false })
      .limit(1);
    if (tplErr) throw tplErr;

    const template = templates && templates[0];
    const defaultSubject = "Your ELMS Access Token";
    const defaultHtml =
      "<p>Hello {Student_Name},</p><p>Your access token is: <strong>{Session_Token}</strong></p><p>Use this to view your grades.</p>";

    const studentNames = students.map((s) => s.full_name).filter(Boolean);
    let subjectRows = [];
    if (studentNames.length) {
      const { data: subjData, error: subjErr } = await supabase
        .schema("torneros-elms")
        .from("subjects")
        .select("student_name, year_level, semester, updated_at")
        .in("student_name", studentNames)
        .order("updated_at", { ascending: false });
      if (subjErr) throw subjErr;
      subjectRows = subjData || [];
    }
    const subjectMap = new Map();
    subjectRows.forEach((row) => {
      if (!subjectMap.has(row.student_name)) {
        subjectMap.set(row.student_name, row);
      }
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    let sent = 0;
    for (const s of students) {
      if (!s.email) continue;
      const token = payload.find((p) => p.student_id === s.student_id)?.token;
      if (!token) continue;
      const when = new Date();
      const dateStr = when.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timeStr = when.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const subjectInfo = subjectMap.get(s.full_name) || {};
      const replacements = {
        "{Session_Token}": token,
        "{Date}": dateStr,
        "{Time}": timeStr,
        "{Student_Name}": s.full_name || "Student",
        "{Course}": s.course || "",
        "{Student_ID}": s.student_id || "",
        "{Email}": s.email || "",
        "{Year_Level}": subjectInfo.year_level || "",
        "{Semester}": subjectInfo.semester || "",
        "{Portal_Link}": PORTAL_LINK,
      };
      const applyTemplate = (input) => {
        let out = input || "";
        Object.entries(replacements).forEach(([key, value]) => {
          out = out.split(key).join(String(value));
        });
        return out;
      };
      const subject = applyTemplate(template?.title || defaultSubject);
      const html = applyTemplate(template?.body_html || defaultHtml);
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      await transporter.sendMail({
        from: SMTP_FROM,
        to: s.email,
        subject,
        text,
        html,
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
