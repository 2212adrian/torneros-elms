// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ReqPayload {
  mode?: "reuse" | "new" | "both";
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SMTP_USER = Deno.env.get("SMTP_USER")!;
const SMTP_PASS = Deno.env.get("SMTP_PASS")!;
const SMTP_FROM = Deno.env.get("SMTP_FROM") || SMTP_USER;
const TOKEN_MODE_DEFAULT = (Deno.env.get("TOKEN_MODE") || "reuse") as
  | "reuse"
  | "new"
  | "both";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  global: { headers: { "x-client-info": "edge-mailer" } },
});

function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) token += "-";
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

Deno.serve(async (req: Request) => {
  try {
    const { mode }: ReqPayload = await req.json().catch(() => ({}));
    const tokenMode = (mode || TOKEN_MODE_DEFAULT) === "both" ? "reuse" : (mode || TOKEN_MODE_DEFAULT);

    const { data: students, error } = await supabase
      .schema("torneros-elms")
      .from("students")
      .select("student_id, full_name, email")
      .is("deleted_at", null);

    if (error) throw error;
    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ message: "No students found." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
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
    }

    return new Response(
      JSON.stringify({ message: "Tokens generated and emails sent." }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: String(err?.message || err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
