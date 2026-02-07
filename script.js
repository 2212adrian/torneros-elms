const loginScreen = document.getElementById("login-screen");
const teacherScreen = document.getElementById("teacher-screen");
const guestScreen = document.getElementById("guest-screen");
const teacherContent = document.getElementById("teacher-content");
const modalRoot = document.getElementById("modal-root");
const moreDrawer = document.getElementById("more-drawer");
const closeDrawerBtn = document.getElementById("close-drawer");
const logoutBtn = document.getElementById("logout-btn");

const SUPABASE_URL = "https://ehupnvkselcupxqyofzy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ukXQMZOYRzfPHmYlqfZ60g_ncSENBr3";
const DB_SCHEMA = "torneros-elms";
if (!window.supabase) {
  console.error("Supabase library not loaded. Check script tags in HTML.");
}
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      apikey: SUPABASE_ANON_KEY,
    },
  },
});
const LS_TOKENS = "elms_tokens";

let currentUser = null;
let currentView = "dashboard";
let students = [];
let grades = [];
let subjectsData = [];
let tokens = [];
const masterlistState = { page: 1, pageSize: 10, query: "" };
const gradingState = { page: 1, pageSize: 10, query: "", yearLevel: "", semester: "" };

const sections = ["BSIT-3B", "BSIT-3A", "BSCS-2A"];
const subjects = [
  "Introduction to Computing",
  "Programming 1",
  "Discrete Mathematics",
  "Data Structures",
  "Database Systems",
  "Software Engineering",
  "Web Development",
  "Mobile App Dev",
  "Artificial Intelligence",
];
const schoolYears = ["2023-2024", "2024-2025", "2025-2026"];
const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

function randomUUID() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxx-xxxx-xxxx-xxxx".replace(/[x]/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) token += "-";
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function loadLocalTokens() {
  const savedTokens = localStorage.getItem(LS_TOKENS);
  tokens = savedTokens ? JSON.parse(savedTokens) : [];
}

function saveLocalTokens() {
  localStorage.setItem(LS_TOKENS, JSON.stringify(tokens));
}

async function fetchStudents() {
  const { data, error } = await supabaseClient
    .schema(DB_SCHEMA)
    .from("students")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchStudents error", error);
    throw error;
  }
  students = data.map((s) => ({
    id: s.id,
    idCode: s.student_id,
    fullName: s.full_name,
    gender: s.gender,
    birthdate: s.birthdate,
    age: s.age,
    contactNumber: s.contact_number,
    email: s.email,
    course: s.course,
  }));
}

async function fetchSubjects() {
  const { data, error } = await supabaseClient
    .schema(DB_SCHEMA)
    .from("subjects")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchSubjects error", error);
    throw error;
  }
  subjectsData = data.map((s) => ({
    id: s.id,
    subjectName: s.subject_name,
    studentName: s.student_name,
    prelim: s.prelim,
    midterm: s.midterm,
    prefinal: s.prefinal,
    finals: s.finals,
    average: s.average,
    gpa: s.gpa,
    remarks: s.remarks,
    yearLevel: s.year_level,
    semester: s.semester,
  }));
  return subjectsData;
}

async function fetchGrades() {
  grades = [];
}

async function loadData() {
  await fetchStudents();
  await fetchSubjects();
  await fetchGrades();
  loadLocalTokens();
}

async function upsertStudents(records) {
  if (records.length === 0) return;
  const payload = records.map((s) => ({
    student_id: s.idCode,
    full_name: s.fullName,
    gender: s.gender || null,
    birthdate: s.birthdate || null,
    age: s.age || null,
    contact_number: s.contactNumber || null,
    email: s.email || null,
    course: s.course || null,
  }));
  const { error } = await supabaseClient
    .schema(DB_SCHEMA)
    .from("students")
    .upsert(payload, { onConflict: "student_id" });
  if (error) {
    console.error("upsertStudents error", error, payload.slice(0, 3));
    throw error;
  }
}

async function upsertSubjects(records) {
  if (records.length === 0) return;
  const payload = records
    .map((s) => ({
      subject_name: s.subjectName,
      student_name: s.studentName || null,
      prelim: s.prelim ?? null,
      midterm: s.midterm ?? null,
      prefinal: s.prefinal ?? null,
      finals: s.finals ?? null,
      average: s.average ?? null,
      gpa: s.gpa ?? null,
      remarks: s.remarks ?? null,
      year_level: s.yearLevel ?? null,
      semester: s.semester ?? null,
    }))
    .filter((row) => row.subject_name);
  const { error } = await supabaseClient
    .schema(DB_SCHEMA)
    .from("subjects")
    .insert(payload);
  if (error) {
    console.error("upsertSubjects error", error, payload.slice(0, 3));
    throw error;
  }
}

async function upsertGrades(records) {
  if (records.length === 0) return;
  const seen = new Set();
  const payload = records
    .map((g) => ({
      student_name: g.studentName || null,
      subject_name: g.subjectName || null,
      prelim: g.prelim,
      midterm: g.midterm,
      prefinal: g.prefinal,
      finals: g.finals,
      average: g.average ?? null,
      gpa: g.gpa ?? null,
      remarks: g.remarks ?? null,
      school_year: g.schoolYear ?? null,
      semester: g.semester ?? null,
    }))
    .filter((row) => {
      if (!row.student_name || !row.subject_name) return false;
      const key = [
        row.student_name.trim().toLowerCase(),
        row.subject_name.trim().toLowerCase(),
        (row.school_year || "").trim().toLowerCase(),
        (row.semester || "").trim().toLowerCase(),
      ].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const { error } = await supabaseClient
    .schema(DB_SCHEMA)
    .from("grades")
    .upsert(payload, { onConflict: "student_name,subject_name,school_year,semester" });
  if (error) {
    console.error("upsertGrades error", error, payload.slice(0, 3));
    throw error;
  }
}

async function softDeleteAll(table) {
  const { error } = await supabaseClient
    .schema(DB_SCHEMA)
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .is("deleted_at", null);
  if (error) {
    console.error(`softDeleteAll error (${table})`, error);
    throw error;
  }
}

function showLogin() {
  loginScreen.innerHTML = `
    <div class="login-brand">
      <div class="brand-icon" style="margin:0 auto;">EL</div>
      <h1>Torneros ELMS</h1>
      <p>Electronic Learning Management System</p>
    </div>
    <div class="login-card">
      <div class="login-tabs">
        <button class="tab-btn active" data-tab="teacher">Teacher Login</button>
        <button class="tab-btn" data-tab="token">Token Access</button>
      </div>
      <div id="login-content"></div>
    </div>
  `;

  const loginContent = document.getElementById("login-content");
  const tabButtons = loginScreen.querySelectorAll(".tab-btn");
  let activeTab = "teacher";

  function renderTab() {
    if (activeTab === "teacher") {
      loginContent.innerHTML = `
        <form id="teacher-login" class="grid-2">
          <div class="section">
            <label>Email</label>
            <input class="input" type="email" name="email" placeholder="torneros@elms.com" required />
          </div>
          <div class="section">
            <label>Password</label>
            <input class="input" type="password" name="password" placeholder="admin" required />
          </div>
          <button class="btn primary" style="grid-column:1/-1;">Sign In</button>
          <p id="login-error" style="color:#ef4444;font-weight:600;"></p>
        </form>
      `;
      const form = document.getElementById("teacher-login");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = form.email.value.trim();
        const pass = form.password.value.trim();
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) {
          document.getElementById("login-error").textContent =
            "Invalid credentials. Please try again.";
          return;
        }
        currentUser = { role: "teacher" };
        window.location.href = "main.html";
      });
    } else {
      loginContent.innerHTML = `
        <form id="token-login">
          <label>Access Token</label>
          <input class="input" type="text" name="token" placeholder="XXXX-XXXX-XXXX-XXXX" required />
          <button class="btn indigo" style="width:100%;margin-top:12px;">Validate Access</button>
          <p id="token-error" style="color:#ef4444;font-weight:600;"></p>
        </form>
      `;
      const form = document.getElementById("token-login");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const token = form.token.value.trim().toUpperCase();
        const found = tokens.find((t) => t.token === token);
        if (found) {
          currentUser = { role: "guest", token };
          localStorage.setItem("elms_guest_token", token);
          window.location.href = "main.html";
        } else {
          document.getElementById("token-error").textContent =
            "Invalid Access Token.";
        }
      });
    }
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.dataset.tab;
      renderTab();
    });
  });

  renderTab();
}

async function showTeacher() {
  if (!teacherScreen) return;
  guestScreen && guestScreen.classList.add("hidden");
  teacherScreen.classList.remove("hidden");
  await loadData();
  renderView(currentView);
}

function showGuest() {
  if (!guestScreen) return;
  teacherScreen && teacherScreen.classList.add("hidden");
  guestScreen.classList.remove("hidden");
  renderGuestPortal();
}

function renderView(view) {
  currentView = view;
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  switch (view) {
    case "dashboard":
      teacherContent.innerHTML = renderDashboard();
      bindDashboardActions();
      break;
    case "masterlist":
      teacherContent.innerHTML = renderMasterlist();
      bindMasterlistActions();
      break;
    case "grading":
      teacherContent.innerHTML = renderGrades();
      bindGradeActions();
      break;
    case "tokens":
      teacherContent.innerHTML = renderTokens();
      bindTokenActions();
      break;
    case "analytics":
      teacherContent.innerHTML = renderAnalytics();
      break;
    default:
      teacherContent.innerHTML = renderDashboard();
      bindDashboardActions();
  }
}

async function refreshAndRender(view) {
  await loadData();
  renderView(view);
}

function renderDashboard() {
  const validAvgs = subjectsData
    .map((s) => Number(s.average))
    .filter((n) => !Number.isNaN(n));
  const avg =
    validAvgs.length > 0
      ? (validAvgs.reduce((acc, v) => acc + v, 0) / validAvgs.length).toFixed(1)
      : "N/A";
  const subjectCount = new Set(subjectsData.map((s) => s.subjectName)).size;
  return `
    <section class="section">
      <h2>Welcome back, Professor</h2>
      <p>Here's what's happening in your system today.</p>
    </section>
    <div class="stat-grid section">
      ${statCard("Total Students", students.length)}
      ${statCard("Courses/Subjects", subjectCount)}
      ${statCard("Active Tokens", tokens.length)}
      ${statCard("Overall Average", avg)}
    </div>
    <div class="section grid-2">
      <div class="card">
        <h3>Quick Actions</h3>
        <div class="grid-2" style="margin-top:16px;">
          <button class="btn ghost" data-action="masterlist">Import Masterlist</button>
          <button class="btn ghost" data-action="grading">Record Grades</button>
          <button class="btn ghost" data-action="tokens">Generate Access</button>
          <button class="btn ghost" data-action="analytics">View Insights</button>
        </div>
      </div>
      <div class="card">
        <h3>Recent Tokens</h3>
        <div style="margin-top:12px;display:grid;gap:10px;">
          ${
            tokens.length
              ? tokens
                  .slice(0, 5)
                  .map(
                    (t) => `
                    <div class="chip blue">${t.token}</div>
                    <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">${t.description || "Student Key"}</div>
                  `
                  )
                  .join("")
              : `<p style="color:var(--muted);">No tokens generated yet.</p>`
          }
        </div>
      </div>
    </div>
  `;
}

function statCard(label, value) {
  return `
    <div class="stat-card">
      <div class="stat-title">${label}</div>
      <div class="stat-value">${value}</div>
    </div>
  `;
}

function renderMasterlist() {
  return `
    <section class="section">
      <h2>Student Masterlist</h2>
      <p>Comprehensive student data and record management.</p>
    </section>
    <div class="section card">
      <div class="grid-2">
        <input id="student-search" class="input" placeholder="Search by ID, Name or Section..." />
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn ghost" id="clear-students">Clear All</button>
        </div>
      </div>
      <div style="margin-top:20px;overflow:auto;">
        <table class="table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Gender</th>
              <th>Birthdate</th>
              <th>Age</th>
              <th>Course</th>
              <th>Contact #</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody id="student-rows"></tbody>
        </table>
        <div class="pager" id="student-pager">
          <button class="btn ghost" id="student-prev">Prev</button>
          <span class="pager-info" id="student-page-info"></span>
          <button class="btn ghost" id="student-next">Next</button>
        </div>
      </div>
    </div>
  `;
}

function renderGrades() {
  const yearOptions = Array.from(
    new Set(subjectsData.map((s) => s.yearLevel).filter(Boolean))
  );
  const semesterOptions = Array.from(
    new Set(subjectsData.map((s) => s.semester).filter(Boolean))
  );
  return `
    <section class="section">
      <h2>Grading Records</h2>
      <p>Manage and edit academic scores linked by ID Code.</p>
    </section>
    <div class="section card">
      <div class="grid-2">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;">
          <input id="grade-search" class="input" placeholder="Search by ID, Name or Subject..." />
          <select id="filter-year" class="input">
            <option value="">All Year Levels</option>
            ${yearOptions.map((y) => `<option value="${y}">${y}</option>`).join("")}
          </select>
          <select id="filter-semester" class="input">
            <option value="">All Semesters</option>
            ${semesterOptions.map((s) => `<option value="${s}">${s}</option>`).join("")}
          </select>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn ghost" id="clear-grades">Reset</button>
        </div>
      </div>
      <div style="margin-top:20px;overflow:auto;">
        <table class="table">
          <thead>
            <tr>
              <th>subject_name</th>
              <th>student_name</th>
              <th>prelim</th>
              <th>midterm</th>
              <th>prefinal</th>
              <th>finals</th>
              <th>average</th>
              <th>gpa</th>
              <th>remarks</th>
              <th>year_level</th>
              <th>semester</th>
            </tr>
          </thead>
          <tbody id="grade-rows"></tbody>
        </table>
        <div class="pager" id="grade-pager">
          <button class="btn ghost" id="grade-prev">Prev</button>
          <span class="pager-info" id="grade-page-info"></span>
          <button class="btn ghost" id="grade-next">Next</button>
        </div>
      </div>
    </div>
  `;
}

function renderTokens() {
  const available = students.filter(
    (s) => !tokens.some((t) => t.studentIdCode === s.idCode)
  );
  return `
    <section class="section">
      <h2>Access Key Distribution</h2>
      <p>Generate student keys in the standard XXXX-XXXX-XXXX-XXXX format.</p>
    </section>
    <div class="section grid-2">
      <div class="card">
        <h3>Issue Keys</h3>
        <p style="color:var(--muted);">Select students below then publish.</p>
        <div id="token-student-list" style="margin-top:16px;max-height:300px;overflow:auto;">
          ${available
            .map(
              (s) => `
              <label style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <input type="checkbox" value="${s.idCode}" />
                <span>${s.fullName} (${s.idCode})</span>
              </label>
            `
            )
            .join("")}
        </div>
        <button class="btn primary" id="publish-selected" style="margin-top:12px;">Publish Selected</button>
        <button class="btn ghost" id="publish-all" style="margin-top:8px;">Publish All</button>
      </div>
      <div class="card">
        <h3>Active Keys</h3>
        <div style="margin-top:12px;display:grid;gap:10px;">
          ${
            tokens.length
              ? tokens
                  .map(
                    (t) => `
                    <div class="glass" style="padding:14px;border-radius:18px;">
                      <div style="font-weight:700;">${t.token}</div>
                      <div style="font-size:11px;color:var(--muted);">${t.studentIdCode}</div>
                    </div>
                  `
                  )
                  .join("")
              : `<p style="color:var(--muted);">No keys managed.</p>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderAnalytics() {
  const subjectAvgs = {};
  grades.forEach((g) => {
    if (!subjectAvgs[g.subjectName]) subjectAvgs[g.subjectName] = [];
    subjectAvgs[g.subjectName].push(g.average);
  });
  const subjectRows = Object.entries(subjectAvgs).map(([sub, arr]) => {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return { sub, avg: Number(avg.toFixed(1)) };
  });
  const maxAvg = Math.max(...subjectRows.map((s) => s.avg), 100);
  return `
    <section class="section">
      <h2>Performance Analytics</h2>
      <p>Quick insights into subject averages.</p>
    </section>
    <div class="section card">
      <h3>Subject Comparison (Avg)</h3>
      <div style="margin-top:16px;display:grid;gap:10px;">
        ${subjectRows
          .map(
            (s) => `
            <div>
              <div style="display:flex;justify-content:space-between;font-weight:600;">
                <span>${s.sub}</span>
                <span>${s.avg}</span>
              </div>
              <div style="height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
                <div style="height:100%;width:${(s.avg / maxAvg) * 100}%;background:var(--indigo);"></div>
              </div>
            </div>
          `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderGuestPortal() {
  const token = currentUser.token;
  const tokenRecord = tokens.find((t) => t.token === token);
  const student = tokenRecord
    ? students.find((s) => s.idCode === tokenRecord.studentIdCode)
    : null;
  if (!student) {
    guestScreen.innerHTML = `
      <div class="guest-card">
        <h2>Access Error</h2>
        <p>Token is not active. Return to login.</p>
        <button class="btn ghost" id="guest-logout">Return to Login</button>
      </div>
    `;
    document.getElementById("guest-logout").onclick = logout;
    return;
  }

  const studentGrades = grades.filter((g) => g.studentIdCode === student.idCode);
  const overall =
    studentGrades.length > 0
      ? (
          studentGrades.reduce((acc, g) => acc + g.average, 0) /
          studentGrades.length
        ).toFixed(2)
      : "N/A";

  guestScreen.innerHTML = `
    <div class="guest-card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h2>${student.fullName}</h2>
          <p>${student.section} · ${student.yearLevel}</p>
        </div>
        <button class="btn danger" id="guest-logout">Logout</button>
      </div>
      <div class="section card">
        <h3>Current GWA</h3>
        <div class="stat-value">${overall}</div>
      </div>
      <div class="section card">
        <h3>Grades</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>P</th>
              <th>M</th>
              <th>PF</th>
              <th>F</th>
              <th>Avg</th>
            </tr>
          </thead>
          <tbody>
            ${studentGrades
              .map(
                (g) => `
              <tr>
                <td>${g.subjectName}</td>
                <td>${g.prelim}</td>
                <td>${g.midterm}</td>
                <td>${g.prefinal}</td>
                <td>${g.finals}</td>
                <td>${g.average}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById("guest-logout").onclick = logout;
}

function bindDashboardActions() {
  teacherContent.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => renderView(btn.dataset.action));
  });
}

function bindMasterlistActions() {
  const search = document.getElementById("student-search");
  const rows = document.getElementById("student-rows");
  const prevBtn = document.getElementById("student-prev");
  const nextBtn = document.getElementById("student-next");
  const pageInfo = document.getElementById("student-page-info");

  function getFilteredStudents() {
    const q = masterlistState.query.toLowerCase();
    return students.filter(
      (s) =>
        (s.fullName || "").toLowerCase().includes(q) ||
        (s.course || "").toLowerCase().includes(q) ||
        (s.idCode || "").includes(q)
    );
  }

  function paginate(list, page, pageSize) {
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      items: list.slice(start, start + pageSize),
      page: safePage,
      totalPages,
    };
  }

  function renderStudentRows() {
    const filtered = getFilteredStudents();
    const { items, page, totalPages } = paginate(
      filtered,
      masterlistState.page,
      masterlistState.pageSize
    );
    masterlistState.page = page;
    rows.innerHTML = items
      .map(
        (s) => `
          <tr>
            <td>${s.idCode || ""}</td>
            <td>${s.fullName || ""}</td>
            <td>${s.gender || ""}</td>
            <td>${s.birthdate || ""}</td>
            <td>${s.age || ""}</td>
            <td>${s.course || ""}</td>
            <td>${s.contactNumber || ""}</td>
            <td>${s.email || ""}</td>
          </tr>
        `
      )
      .join("");
    pageInfo.textContent = `Page ${page} of ${totalPages} · ${filtered.length} records`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
  }

  search.addEventListener("input", () => {
    masterlistState.query = search.value.trim();
    masterlistState.page = 1;
    renderStudentRows();
  });

  prevBtn.addEventListener("click", () => {
    masterlistState.page -= 1;
    renderStudentRows();
  });
  nextBtn.addEventListener("click", () => {
    masterlistState.page += 1;
    renderStudentRows();
  });
  renderStudentRows();

  document.getElementById("clear-students").onclick = async () => {
    await softDeleteAll("grades");
    await softDeleteAll("students");
    students = [];
    grades = [];
    await refreshAndRender("masterlist");
  };
}

function bindGradeActions() {
  const search = document.getElementById("grade-search");
  const rows = document.getElementById("grade-rows");
  const yearFilter = document.getElementById("filter-year");
  const semesterFilter = document.getElementById("filter-semester");
  const prevBtn = document.getElementById("grade-prev");
  const nextBtn = document.getElementById("grade-next");
  const pageInfo = document.getElementById("grade-page-info");

  function spectralColor(value, min = 0, max = 100) {
    const safe = Math.min(Math.max(value, min), max);
    const ratio = (safe - min) / (max - min || 1);
    const hue = 120 * ratio;
    return `hsl(${hue}, 70%, 45%)`;
  }

  function gradeChip(value) {
    if (value === null || value === undefined || value === "") return "";
    const num = Number(value);
    if (Number.isNaN(num)) return `${value}`;
    return `<span class="score-pill">${num}</span>`;
  }

  function colorBadge(value, invert = false) {
    if (value === null || value === undefined || value === "") return "";
    const num = Number(value);
    if (Number.isNaN(num)) return `${value}`;
    const normalized = invert ? 100 - (num - 1) * 25 : num;
    const color = spectralColor(normalized, 0, 100);
    return `<span class="score-badge" style="background:${color};">${num}</span>`;
  }

  function getFilteredSubjects() {
    const q = gradingState.query.toLowerCase();
    return subjectsData.filter((s) => {
      const matchesText =
        (s.subjectName || "").toLowerCase().includes(q) ||
        (s.studentName || "").toLowerCase().includes(q);
      const matchesYear = !gradingState.yearLevel || s.yearLevel === gradingState.yearLevel;
      const matchesSemester = !gradingState.semester || s.semester === gradingState.semester;
      return matchesText && matchesYear && matchesSemester;
    });
  }

  function paginate(list, page, pageSize) {
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      items: list.slice(start, start + pageSize),
      page: safePage,
      totalPages,
    };
  }

  function renderGradeRows() {
    const filtered = getFilteredSubjects();
    const { items, page, totalPages } = paginate(
      filtered,
      gradingState.page,
      gradingState.pageSize
    );
    gradingState.page = page;
    rows.innerHTML = items
      .map((s) => {
        const remarksChip =
          (s.remarks || "").toUpperCase() === "FAILED"
            ? `<span class="chip red">FAILED</span>`
            : (s.remarks || "").toUpperCase() === "PASSED"
            ? `<span class="chip green">PASSED</span>`
            : `${s.remarks || ""}`;
        return `
          <tr>
            <td>${s.subjectName || ""}</td>
            <td>${s.studentName || ""}</td>
            <td>${gradeChip(s.prelim)}</td>
            <td>${gradeChip(s.midterm)}</td>
            <td>${gradeChip(s.prefinal)}</td>
            <td>${gradeChip(s.finals)}</td>
            <td>${colorBadge(s.average)}</td>
            <td>${colorBadge(s.gpa, true)}</td>
            <td>${remarksChip}</td>
            <td>${s.yearLevel || ""}</td>
            <td>${s.semester || ""}</td>
          </tr>
        `;
      })
      .join("");
    pageInfo.textContent = `Page ${page} of ${totalPages} · ${filtered.length} records`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
  }

  search.addEventListener("input", () => {
    gradingState.query = search.value.trim();
    gradingState.page = 1;
    renderGradeRows();
  });
  yearFilter.addEventListener("change", () => {
    gradingState.yearLevel = yearFilter.value;
    gradingState.page = 1;
    renderGradeRows();
  });
  semesterFilter.addEventListener("change", () => {
    gradingState.semester = semesterFilter.value;
    gradingState.page = 1;
    renderGradeRows();
  });
  prevBtn.addEventListener("click", () => {
    gradingState.page -= 1;
    renderGradeRows();
  });
  nextBtn.addEventListener("click", () => {
    gradingState.page += 1;
    renderGradeRows();
  });
  renderGradeRows();

  document.getElementById("clear-grades").onclick = async () => {
    await softDeleteAll("subjects");
    grades = [];
    await refreshAndRender("grading");
  };
}

function bindTokenActions() {
  document.getElementById("publish-selected").onclick = () => {
    const selected = Array.from(
      document.querySelectorAll("#token-student-list input:checked")
    ).map((el) => el.value);
    if (selected.length === 0) return;
    const now = new Date().toISOString();
    const newTokens = selected.map((idCode) => ({
      id: randomUUID(),
      token: generateToken(),
      studentIdCode: idCode,
      description: "Student Key",
      createdAt: now,
    }));
    tokens = [...newTokens, ...tokens];
    saveLocalTokens();
    renderView("tokens");
  };

  document.getElementById("publish-all").onclick = () => {
    const available = students.filter(
      (s) => !tokens.some((t) => t.studentIdCode === s.idCode)
    );
    const now = new Date().toISOString();
    const newTokens = available.map((s) => ({
      id: randomUUID(),
      token: generateToken(),
      studentIdCode: s.idCode,
      description: "Student Key",
      createdAt: now,
    }));
    tokens = [...newTokens, ...tokens];
    saveLocalTokens();
    renderView("tokens");
  };
}

let importCache = { studentsText: "", subjectsText: "" };

function openImportCenter() {
  if (!supabaseClient.auth.getSession) {
    Swal.fire({
      icon: "error",
      title: "Auth not ready",
      text: "Supabase session is not available. Please refresh and login again.",
    });
    return;
  }
  importCache = { studentsText: "", subjectsText: "" };
  modalRoot.classList.remove("hidden");
  modalRoot.innerHTML = `
    <div class="modal">
      <h3>Import Excel</h3>
      <p style="color:var(--muted);font-size:12px;margin-top:6px;">
        Choose where to import and whether to overwrite or stack rows.
      </p>
      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <select id="import-target" class="input">
          <option value="students">Masterlist (Students)</option>
          <option value="grades">Grading (Subjects)</option>
          <option value="both">Both</option>
        </select>
        <select id="import-mode" class="input">
          <option value="stack">Stack rows (append)</option>
          <option value="overwrite">Overwrite (clear then import)</option>
        </select>
      </div>
      <div style="margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input type="file" id="import-file" accept=".xlsx,.xls" />
        <button class="btn ghost" id="read-file">Read Excel</button>
      </div>
      <div id="import-text-wrap" style="margin-top:12px;"></div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
        <button class="btn ghost" id="cancel-import">Cancel</button>
        <button class="btn primary" id="process-import">Process</button>
      </div>
    </div>
  `;

  const targetSelect = document.getElementById("import-target");
  const wrap = document.getElementById("import-text-wrap");

  function renderTextareas() {
    const target = targetSelect.value;
    if (target === "both") {
      wrap.innerHTML = `
        <label style="font-size:12px;color:var(--muted);">Students (tab-separated)</label>
        <textarea id="import-text-students" class="input" style="height:160px;"></textarea>
        <label style="font-size:12px;color:var(--muted);margin-top:10px;">Subjects (tab-separated)</label>
        <textarea id="import-text-grades" class="input" style="height:160px;"></textarea>
      `;
    } else {
      wrap.innerHTML = `
        <textarea id="import-text" class="input" style="height:200px;"></textarea>
      `;
    }
  }

  renderTextareas();
  targetSelect.addEventListener("change", renderTextareas);

  document.getElementById("cancel-import").onclick = closeModal;
  document.getElementById("read-file").onclick = () => readExcelFile(targetSelect.value);
  document.getElementById("process-import").onclick = async () => {
    const sessionResult = await supabaseClient.auth.getSession();
    if (!sessionResult.data.session) {
      Swal.fire({
        icon: "warning",
        title: "Login required",
        text: "Please login first before importing.",
      });
      return;
    }

    const mode = document.getElementById("import-mode").value;
    const target = targetSelect.value;

    try {
      if (mode === "overwrite") {
        if (target === "students" || target === "both") {
          await softDeleteAll("students");
        }
        if (target === "grades" || target === "both") {
          await softDeleteAll("subjects");
        }
      }

      if (target === "students") {
        const data = document.getElementById("import-text").value.trim();
        if (!data) return;
        await importStudentsFromText(data);
        await refreshAndRender("masterlist");
      } else if (target === "grades") {
        const data = document.getElementById("import-text").value.trim();
        if (!data) return;
        await importSubjectsFromText(data);
        await refreshAndRender("grading");
      } else {
        const studentText = (document.getElementById("import-text-students")?.value || "").trim();
        const subjectText = (document.getElementById("import-text-grades")?.value || "").trim();
        if (studentText) await importStudentsFromText(studentText);
        if (subjectText) await importSubjectsFromText(subjectText);
        await refreshAndRender("dashboard");
      }

      closeModal();
    } catch (err) {
      console.error("Import failed", err);
      Swal.fire({
        icon: "error",
        title: "Import failed",
        text: err?.message || "Check your data or login session.",
      });
    }
  };
}

function openImportModal(type) {
  if (!supabaseClient.auth.getSession) {
    Swal.fire({
      icon: "error",
      title: "Auth not ready",
      text: "Supabase session is not available. Please refresh and login again.",
    });
    return;
  }
  modalRoot.classList.remove("hidden");
  modalRoot.innerHTML = `
    <div class="modal">
      <h3>${type === "students" ? "Import Masterlist" : "Import Grades"}</h3>
      <p style="color:var(--muted);font-size:12px;margin-top:6px;">
        Paste tab-separated rows.
        ${type === "students"
          ? "Unified format: Student ID, Full Name, Gender, Birthdate, Age, Course, Contact Number, Email"
          : "Unified format: Subject Name, Student Name, Prelim, Midterm, Prefinal, Finals, Average, GPA, Remarks, Year Level, Semester"}
      </p>
      <div style="margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input type="file" id="import-file" accept=".xlsx,.xls" />
        <button class="btn ghost" id="read-file">Read Excel</button>
      </div>
      <textarea id="import-text" class="input" style="height:200px;margin-top:12px;"></textarea>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
        <button class="btn ghost" id="cancel-import">Cancel</button>
        <button class="btn primary" id="process-import">Process</button>
      </div>
    </div>
  `;

  document.getElementById("cancel-import").onclick = closeModal;
  document.getElementById("read-file").onclick = () => readExcelFile(type);
  document.getElementById("process-import").onclick = async () => {
    const sessionResult = await supabaseClient.auth.getSession();
    if (!sessionResult.data.session) {
      Swal.fire({
        icon: "warning",
        title: "Login required",
        text: "Please login first before importing.",
      });
      return;
    }
    const data = document.getElementById("import-text").value.trim();
    if (!data) return;
    try {
      if (type === "students") {
        await importStudentsFromText(data);
        await refreshAndRender("masterlist");
      } else {
        await importSubjectsFromText(data);
        await refreshAndRender("grading");
      }
      closeModal();
    } catch (err) {
      console.error("Import failed", err);
      Swal.fire({
        icon: "error",
        title: "Import failed",
        text: err?.message || "Check your data or login session.",
      });
    }
  };
}

function closeModal() {
  modalRoot.classList.add("hidden");
  modalRoot.innerHTML = "";
}

async function logout() {
  await supabaseClient.auth.signOut();
  localStorage.removeItem("elms_guest_token");
  currentUser = null;
  currentView = "dashboard";
  window.location.href = "index.html";
}

function bindMainEvents() {
  if (!teacherScreen) return;
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.view === "more") {
        moreDrawer.classList.remove("hidden");
      } else if (btn.dataset.view === "import") {
        openImportCenter();
      } else {
        renderView(btn.dataset.view);
      }
    });
  });

  document.querySelectorAll(".drawer-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      renderView(btn.dataset.view);
      moreDrawer.classList.add("hidden");
    });
  });

  closeDrawerBtn.addEventListener("click", () => {
    moreDrawer.classList.add("hidden");
  });

  logoutBtn.addEventListener("click", logout);
}

async function init() {
  loadLocalTokens();
  const { data } = await supabaseClient.auth.getSession();
  const guestToken = localStorage.getItem("elms_guest_token");

  if (loginScreen) {
    if (data.session || guestToken) {
      window.location.href = "main.html";
      return;
    }
    showLogin();
    return;
  }

  if (!data.session && !guestToken) {
    window.location.href = "index.html";
    return;
  }

  if (guestToken && !data.session) {
    currentUser = { role: "guest", token: guestToken };
    showGuest();
    return;
  }

  currentUser = { role: "teacher" };
  bindMainEvents();
  await showTeacher();
}

init();

function normalizeHeader(text) {
  const raw = (text || "").toString().trim().toLowerCase();
  if (raw === "s.y" || raw === "s.y.") return "schoolyear";
  return raw;
}

function getHeaderIndexMap(headers) {
  const map = {};
  headers.forEach((h, idx) => {
    map[normalizeHeader(h)] = idx;
  });
  return map;
}

function showImportError(message) {
  Swal.fire({
    icon: "error",
    title: "Invalid Excel File",
    text: message,
  });
}

function readExcelFile(type) {
  const input = document.getElementById("import-file");
  const file = input.files && input.files[0];
  if (!file) {
    showImportError("Please select an Excel file first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const studentsText = extractStudentsText(workbook);
      const subjectsText = extractSubjectsText(workbook);
      importCache = { studentsText, subjectsText };

      if (type === "both") {
        const studentBox = document.getElementById("import-text-students");
        const subjectBox = document.getElementById("import-text-grades");
        if (studentBox) studentBox.value = studentsText;
        if (subjectBox) subjectBox.value = subjectsText;
      } else if (type === "students") {
        const target = document.getElementById("import-text");
        if (target) target.value = studentsText;
      } else {
        const target = document.getElementById("import-text");
        if (target) target.value = subjectsText;
      }
    } catch (err) {
      showImportError("Could not read this Excel file.");
    }
  };
  reader.readAsArrayBuffer(file);
}

function extractStudentsText(workbook) {
  const sheet = workbook.Sheets["Students"];
  if (!sheet) {
    showImportError('Students sheet not found. Only "Students" sheet is allowed for Masterlist.');
    return "";
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const [headerRow, ...dataRows] = rows;
  const headers = getHeaderIndexMap(headerRow || []);
  const required = ["student_id", "fullname", "gender", "birthdate", "age", "course", "contactnumber", "email"];
  const missing = required.filter((r) => headers[r] === undefined);
  if (missing.length) {
    showImportError(`Missing columns: ${missing.join(", ")}`);
    return "";
  }
  const textRows = [];
  for (const r of dataRows) {
    const studentId = r[headers["student_id"]];
    const fullName = r[headers["fullname"]];
    const gender = r[headers["gender"]];
    const birthdate = r[headers["birthdate"]];
    const age = r[headers["age"]];
    const course = r[headers["course"]];
    const contactNumber = r[headers["contactnumber"]];
    const email = r[headers["email"]];

    if (
      studentId === "" &&
      fullName === "" &&
      gender === "" &&
      birthdate === "" &&
      age === "" &&
      course === "" &&
      contactNumber === "" &&
      email === ""
    ) {
      break;
    }

    if (!studentId || !fullName) continue;
    if (
      normalizeHeader(fullName) === "subjectname" ||
      normalizeHeader(studentId) === "subject_id"
    ) {
      continue;
    }

    textRows.push([
      studentId,
      fullName,
      gender,
      birthdate,
      age,
      course,
      contactNumber,
      email,
    ].join("\t"));
  }
  return textRows.join("\n");
}

function extractSubjectsText(workbook) {
  const sheet = workbook.Sheets["Subjects"];
  if (!sheet) {
    showImportError('Subjects sheet not found. Only "Subjects" sheet is allowed for Grading.');
    return "";
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const [headerRow, ...dataRows] = rows;
  const headers = getHeaderIndexMap(headerRow || []);
  const required = ["subject_name"];
  const missing = required.filter((r) => headers[r] === undefined);
  if (missing.length) {
    showImportError(`Missing columns: ${missing.join(", ")}`);
    return "";
  }
  return dataRows
    .filter((r) => r[headers["subject_name"]])
    .map((r) =>
      [
        r[headers["subject_name"]],
        r[headers["student_name"]] || "",
        r[headers["prelim"]] || "",
        r[headers["midterm"]] || "",
        r[headers["prefinal"]] || "",
        r[headers["finals"]] || "",
        r[headers["average"]] || "",
        r[headers["gpa"]] || "",
        r[headers["remarks"]] || "",
        r[headers["year_level"]] || "",
        r[headers["semester"]] || "",
      ].join("\t")
    )
    .join("\n");
}

async function importStudentsFromText(data) {
  const rows = data.split("\n");
  const newStudents = rows
    .map((row) => row.split("\t"))
    .map((parts) => {
      const [idCode, name, gender, dob, age, course, contact, email] = parts;
      return {
        idCode: (idCode || "").trim() || (Math.floor(100000 + Math.random() * 900000)).toString(),
        fullName: (name || "").trim(),
        gender: gender || null,
        birthdate: dob || null,
        course: course || null,
        age,
        contactNumber: contact,
        email,
      };
    })
    .filter((s) => s.fullName);
  await upsertStudents(newStudents);
}

async function importSubjectsFromText(data) {
  const rows = data.split("\n");
  const rawGrades = rows
    .map((row) => row.split("\t"))
    .map((parts) => {
      const [
        subjectName,
        studentName,
        prelim,
        midterm,
        prefinal,
        finals,
        average,
        gpa,
        remarks,
        yearLevel,
        semester,
      ] = parts;
      return {
        subjectName: (subjectName || "").trim(),
        studentName: (studentName || "").trim(),
        prelim: prelim !== undefined && prelim !== "" ? Number(prelim) : null,
        midterm: midterm !== undefined && midterm !== "" ? Number(midterm) : null,
        prefinal: prefinal !== undefined && prefinal !== "" ? Number(prefinal) : null,
        finals: finals !== undefined && finals !== "" ? Number(finals) : null,
        average: average !== undefined && average !== "" ? Number(average) : null,
        gpa: gpa !== undefined && gpa !== "" ? Number(gpa) : null,
        remarks: (remarks || "").trim() || null,
        yearLevel: (yearLevel || "").trim() || null,
        semester: (semester || "").trim() || null,
      };
    })
    .filter((g) => g.subjectName);

  await upsertSubjects(rawGrades);
}
