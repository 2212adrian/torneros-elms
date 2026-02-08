const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const studentId = body.student_id;
    const studentIds = Array.isArray(body.student_ids) ? body.student_ids : [];
    const ids = studentId ? [studentId] : studentIds;
    if (!ids.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "student_id(s) required" }) };
    }
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials missing.");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { error } = await supabase
      .schema("torneros-elms")
      .from("student_tokens")
      .delete()
      .in("student_id", ids);
    if (error) throw error;
    return {
      statusCode: 200,
      body: JSON.stringify({ deleted: ids.length }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err.message || err) }),
    };
  }
};
