const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const PORTAL_LINK = process.env.PORTAL_LINK || "";

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
    const studentId = body.student_id;
    if (!studentId) {
      return { statusCode: 400, body: JSON.stringify({ error: "student_id required" }) };
    }
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials missing.");
    }
    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error("SMTP credentials missing.");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: student, error: stuErr } = await supabase
      .schema("torneros-elms")
      .from("students")
      .select("student_id, full_name, email, course")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .single();
    if (stuErr) throw stuErr;
    if (!student || !student.email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Student email not found." }) };
    }

    const newToken = generateToken();
    const { error: upsertErr } = await supabase
      .schema("torneros-elms")
      .from("student_tokens")
      .upsert([{ student_id: studentId, token: newToken }], { onConflict: "student_id" });
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

    let subjectInfo = {};
    if (student.full_name) {
      const { data: subjData, error: subjErr } = await supabase
        .schema("torneros-elms")
        .from("subjects")
        .select("student_name, year_level, semester, updated_at")
        .eq("student_name", student.full_name)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (subjErr) throw subjErr;
      subjectInfo = (subjData && subjData[0]) || {};
    }

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
    const replacements = {
      "{Session_Token}": newToken,
      "{Date}": dateStr,
      "{Time}": timeStr,
      "{Student_Name}": student.full_name || "Student",
      "{Course}": student.course || "",
      "{Student_ID}": student.student_id || "",
      "{Email}": student.email || "",
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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: SMTP_FROM,
      to: student.email,
      subject,
      text,
      html,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ token: newToken }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err.message || err) }),
    };
  }
};
