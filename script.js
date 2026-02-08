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
const fetchDebug = { students: { fetched: 0, visible: 0 } };

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
const DARK_MODE_KEY = "elms_dark_mode";

function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add("dark-mode");
    localStorage.setItem(DARK_MODE_KEY, "dark");
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem(DARK_MODE_KEY, "light");
  }
}

function toggleDarkMode() {
  const isDark = document.body.classList.contains("dark-mode");
  applyTheme(!isDark);
}

function setupDarkModeToggle() {
  const toggle = document.getElementById("dark-mode-toggle");
  if (toggle) {
    // Initialize from localStorage or system preference
    const savedMode = localStorage.getItem(DARK_MODE_KEY);
    const initialDark = savedMode === "dark" || (!savedMode && window.matchMedia("(prefers-color-scheme: dark)").matches);
    applyTheme(initialDark);
    
    // Set checkbox state
    toggle.checked = initialDark;

    // Add listener
    toggle.addEventListener("change", toggleDarkMode);
  }
}

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
  const { data: allRows, error } = await supabaseClient
    .schema(DB_SCHEMA)
    .from("students")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchStudents error", error);
    throw error;
  }
  const rows = allRows || [];
  const visibleRows = rows.filter((r) => r.deleted_at == null);
  const data = visibleRows.length > 0 ? visibleRows : rows;
  fetchDebug.students = {
    fetched: rows.length,
    visible: visibleRows.length,
  };

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
    gwa: s.gwa,
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
      gwa: s.gwa ?? null,
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
      gwa: g.gwa ?? null,
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
      <p class="debug-pill">
        Debug: fetched ${fetchDebug.students.fetched} · visible ${fetchDebug.students.visible} · showing ${students.length}
      </p>
    </section>
    <div class="section card">
      <div class="grid-2">
        <input id="student-search" class="input" placeholder="Search by ID, Name or Section..." />
        <div style="display:flex;gap:10px;justify-content:flex-end;">
        </div>
      </div>
      <div class="table-wrap">
        <div class="table-scroll">
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
        </div>
      </div>
      <div class="pager" id="student-pager">
        <button class="btn ghost" id="student-prev">Prev</button>
        <span class="pager-info" id="student-page-info"></span>
        <button class="btn ghost" id="student-next">Next</button>
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
        </div>
      </div>
      <div class="table-wrap">
        <div class="table-scroll">
          <table class="table">
          <thead>
            <tr>
              <th>subject_name</th>
              <th>student_name</th>
              <th>average</th>
              <th>gwa</th>
              <th>remarks</th>
              <th>year_level</th>
              <th>semester</th>
            </tr>
          </thead>
          <tbody id="grade-rows"></tbody>
          </table>
        </div>
      </div>
      <div class="pager" id="grade-pager">
        <button class="btn ghost" id="grade-prev">Prev</button>
        <span class="pager-info" id="grade-page-info"></span>
        <button class="btn ghost" id="grade-next">Next</button>
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
        <div style="height:12px;"></div>
        <button class="btn indigo" id="send-tokens" style="margin-top:6px;">Send Tokens to All Emails</button>
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
            <td>
              <span class="avg-tooltip">
                <span class="avg-wrap">
                  ${colorBadge(s.average)}
                  <span class="avg-line"></span>
                </span>
                <span class="avg-tooltip-card">
                  <span class="avg-title">Grade Breakdown</span>
                  <span class="avg-row"><span>Prelim</span><strong>${s.prelim ?? "-"}</strong></span>
                  <span class="avg-row"><span>Midterm</span><strong>${s.midterm ?? "-"}</strong></span>
                  <span class="avg-row"><span>Prefinal</span><strong>${s.prefinal ?? "-"}</strong></span>
                  <span class="avg-row"><span>Finals</span><strong>${s.finals ?? "-"}</strong></span>
                </span>
              </span>
            </td>
            <td>${colorBadge(s.gwa, true)}</td>
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


  rows.addEventListener("click", (e) => {
    const tooltip = e.target.closest(".avg-tooltip");
    if (!tooltip) return;
    rows.querySelectorAll(".avg-tooltip.active").forEach((el) => {
      if (el !== tooltip) el.classList.remove("active");
    });
    tooltip.classList.toggle("active");
  });
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

  const sendBtn = document.getElementById("send-tokens");
  if (sendBtn) {
    sendBtn.onclick = async () => {
      const sessionResult = await supabaseClient.auth.getSession();
      if (!sessionResult.data.session) {
        Swal.fire({
          icon: "warning",
          title: "Login required",
          text: "Please login first before sending tokens.",
        });
        return;
      }
      sendBtn.disabled = true;
      sendBtn.textContent = "Sending...";
      try {
        const resp = await fetch("/.netlify/functions/send-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "reuse" }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || "Send failed");
        Swal.fire({
          icon: "success",
          title: "Emails sent",
          text: data?.message || "Tokens were sent to all student emails.",
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Send failed",
          text: err?.message || "Could not send tokens.",
        });
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send Tokens to All Emails";
      }
    };
  }
}

let importCache = {
  studentsText: "",
  subjectsText: "",
  studentsData: null,
  subjectsData: null,
  hasFile: false,
  activeTab: "students",
};

function openImportCenter() {
  if (!supabaseClient.auth.getSession) {
    Swal.fire({
      icon: "error",
      title: "Auth not ready",
      text: "Supabase session is not available. Please refresh and login again.",
    });
    return;
  }
  importCache = {
    studentsText: "",
    subjectsText: "",
    studentsData: null,
    subjectsData: null,
    hasFile: false,
    activeTab: "students",
  };
  modalRoot.classList.remove("hidden");
  modalRoot.innerHTML = `
    <div class="modal import-modal">
      <div class="modal-body">
        <h3>Import Excel</h3>
        <p style="color:var(--muted);font-size:12px;margin-top:6px;">
          Choose where to import and whether to overwrite or stack rows.
        </p>
        <div class="import-drop">
          <input type="file" id="import-file" accept=".xlsx,.xls" />
        </div>
        <div class="import-panel">
          <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <select id="import-target" class="input">
            <option value="students">Masterlist (Students)</option>
            <option value="grades">Grading (Subjects)</option>
            <option value="both">Both</option>
          </select>
            <div class="import-switch" id="import-switch">
              <span class="switch-label left active" id="mode-label-left">Add</span>
              <label class="switch">
                <input type="checkbox" id="import-mode-toggle" />
                <span class="slider"></span>
              </label>
              <span class="switch-label right" id="mode-label-right">New</span>
            </div>
          </div>
          <div id="import-filters" class="import-filters"></div>
          <div id="import-tabs" class="import-tabs"></div>
          <div id="import-text-wrap" class="import-preview"></div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn ghost" id="cancel-import">Cancel</button>
        <button class="btn primary" id="process-import">Process</button>
      </div>
    </div>
  `;

  const targetSelect = document.getElementById("import-target");
  const importFile = document.getElementById("import-file");

  function setImportReady() {
    modalRoot.querySelector(".modal").classList.add("import-ready");
  }

  function renderTabs() {
    const tabWrap = document.getElementById("import-tabs");
    if (targetSelect.value !== "both") {
      tabWrap.innerHTML = "";
      return;
    }
    tabWrap.innerHTML = `
      <button class="tab-btn ${importCache.activeTab === "students" ? "active" : ""}" data-tab="students">Masterlist</button>
      <button class="tab-btn ${importCache.activeTab === "grades" ? "active" : ""}" data-tab="grades">Grading</button>
    `;
    tabWrap.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        importCache.activeTab = btn.dataset.tab;
        renderPreview();
      });
    });
  }

  function renderFilters() {
    const filterWrap = document.getElementById("import-filters");
    const target = targetSelect.value;
    const parts = [];
    if (target === "students" || target === "both") {
      const genders = Array.from(
        new Set((importCache.studentsData?.rows || []).map((r) => r.gender).filter(Boolean))
      );
      const courses = Array.from(
        new Set((importCache.studentsData?.rows || []).map((r) => r.course).filter(Boolean))
      );
      parts.push(`
        <div class="filter-group">
          <select id="filter-gender" class="input">
            <option value="">All Genders</option>
            ${genders.map((g) => `<option value="${g}">${g}</option>`).join("")}
          </select>
          <select id="filter-course" class="input">
            <option value="">All Courses</option>
            ${courses.map((c) => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
      `);
    }
    if (target === "grades" || target === "both") {
      const subjects = Array.from(
        new Set((importCache.subjectsData?.rows || []).map((r) => r.subject_name).filter(Boolean))
      );
      const years = Array.from(
        new Set((importCache.subjectsData?.rows || []).map((r) => r.year_level).filter(Boolean))
      );
      const semesters = Array.from(
        new Set((importCache.subjectsData?.rows || []).map((r) => r.semester).filter(Boolean))
      );
      parts.push(`
        <div class="filter-group">
          <select id="filter-subject" class="input">
            <option value="">All Subjects</option>
            ${subjects.map((s) => `<option value="${s}">${s}</option>`).join("")}
          </select>
          <select id="filter-year" class="input">
            <option value="">All Year Levels</option>
            ${years.map((y) => `<option value="${y}">${y}</option>`).join("")}
          </select>
          <select id="filter-semester" class="input">
            <option value="">All Semesters</option>
            ${semesters.map((s) => `<option value="${s}">${s}</option>`).join("")}
          </select>
        </div>
      `);
    }
    filterWrap.innerHTML = parts.join("");

    filterWrap.querySelectorAll("select").forEach((sel) => {
      sel.addEventListener("change", renderPreview);
    });
  }

  function renderPreview() {
    const target = targetSelect.value;
    const wrap = document.getElementById("import-text-wrap");
    const active = target === "both" ? importCache.activeTab : target;
    if (!importCache.hasFile) {
      wrap.innerHTML = "";
      return;
    }
    if (active === "students") {
      const gender = document.getElementById("filter-gender")?.value || "";
      const course = document.getElementById("filter-course")?.value || "";
      const data = importCache.studentsData?.rows || [];
      const rows = data.filter((r) => {
        const okGender = !gender || r.gender === gender;
        const okCourse = !course || r.course === course;
        return okGender && okCourse;
      });
      wrap.innerHTML = buildPreviewTable(importCache.studentsData?.headers || [], rows);
    } else {
      const subject = document.getElementById("filter-subject")?.value || "";
      const year = document.getElementById("filter-year")?.value || "";
      const semester = document.getElementById("filter-semester")?.value || "";
      const data = importCache.subjectsData?.rows || [];
      const rows = data.filter((r) => {
        const okSubject = !subject || r.subject_name === subject;
        const okYear = !year || r.year_level === year;
        const okSemester = !semester || r.semester === semester;
        return okSubject && okYear && okSemester;
      });
      wrap.innerHTML = buildPreviewTable(importCache.subjectsData?.headers || [], rows);
    }
  }

  function updateImportUI() {
    renderTabs();
    renderFilters();
    renderPreview();
  }

  targetSelect.addEventListener("change", () => {
    if (targetSelect.value !== "both") {
      importCache.activeTab = targetSelect.value;
    }
    updateImportUI();
  });

  importFile.addEventListener("change", () => {
    readExcelFile(targetSelect.value);
    setImportReady();
  });

  const modal = modalRoot.querySelector(".modal");
  if (modal) {
    modal.addEventListener("import-data-ready", updateImportUI);
  }

  document.getElementById("cancel-import").onclick = () => {
    if (!importCache.hasFile) {
      closeModal();
      return;
    }
    Swal.fire({
      icon: "warning",
      title: "Discard upload?",
      text: "You have already uploaded a file. Canceling will discard the preview.",
      showCancelButton: true,
      confirmButtonText: "Discard",
    }).then((result) => {
      if (result.isConfirmed) closeModal();
    });
  };

  document.getElementById("import-mode-toggle").addEventListener("change", (e) => {
    const left = document.getElementById("mode-label-left");
    const right = document.getElementById("mode-label-right");
    if (e.target.checked) {
      left.classList.remove("active");
      right.classList.add("active");
    } else {
      right.classList.remove("active");
      left.classList.add("active");
    }
  });

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

    const mode = document.getElementById("import-mode-toggle").checked
      ? "overwrite"
      : "stack";
    const target = targetSelect.value;

    try {
      if (mode === "overwrite") {
        if (target === "students" || target === "both") {
          const { error: delErr } = await supabaseClient
            .schema(DB_SCHEMA)
            .from("students")
            .delete()
            .not("id", "is", null);
          if (delErr) throw delErr;
        }
        if (target === "grades" || target === "both") {
          const { error: delErr } = await supabaseClient
            .schema(DB_SCHEMA)
            .from("subjects")
            .delete()
            .not("id", "is", null);
          if (delErr) throw delErr;
        }
      }

      if (!importCache.hasFile) {
        showImportError("Please select an Excel file first.");
        return;
      }

      if (target === "students") {
        await importStudentsFromRows(importCache.studentsData?.rows || []);
        await refreshAndRender("masterlist");
      } else if (target === "grades") {
        await importSubjectsFromRows(importCache.subjectsData?.rows || []);
        await refreshAndRender("grading");
      } else {
        await importStudentsFromRows(importCache.studentsData?.rows || []);
        await importSubjectsFromRows(importCache.subjectsData?.rows || []);
        await refreshAndRender("dashboard");
      }

      closeModal();
      showImportSuccess();
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
          : "Unified format: Subject Name, Student Name, Prelim, Midterm, Prefinal, Finals, Average, GWA, Remarks, Year Level, Semester"}
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
  setupDarkModeToggle();

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

      const studentsData = extractStudentsData(workbook);
      const subjectsData = extractSubjectsData(workbook);
      importCache.studentsData = studentsData;
      importCache.subjectsData = subjectsData;
      importCache.studentsText = studentsData.text || "";
      importCache.subjectsText = subjectsData.text || "";
      importCache.hasFile = true;

      const modal = modalRoot.querySelector(".modal");
      if (modal) {
        const updateEvent = new Event("import-data-ready");
        modal.dispatchEvent(updateEvent);
      }
    } catch (err) {
      showImportError("Could not read this Excel file.");
    }
  };
  reader.readAsArrayBuffer(file);
}

function showImportSuccess() {
  const confetti = document.createElement("div");
  confetti.className = "confetti";
  const colors = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444", "#0ea5e9"];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confetti.appendChild(piece);
  }
  document.body.appendChild(confetti);
  setTimeout(() => confetti.remove(), 1500);

  Swal.fire({
    html: `
      <div class="success-modal">
        <div class="success-check">
          <svg viewBox="0 0 52 52">
            <path d="M14 27 L23 36 L39 18"></path>
          </svg>
        </div>
        <div style="font-weight:700;font-size:18px;">Import Successful</div>
        <div style="color:var(--muted);font-size:12px;margin-top:6px;">Your records are now up to date.</div>
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: "OK",
    customClass: {
      popup: "modal success-popup",
      confirmButton: "btn primary",
    },
  });
}

function extractStudentsData(workbook) {
  const sheet = workbook.Sheets["Students"];
  if (!sheet) {
    showImportError('Students sheet not found. Only "Students" sheet is allowed for Masterlist.');
    return { headers: [], rows: [], text: "" };
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const [headerRow, ...dataRows] = rows;
  const headers = getHeaderIndexMap(headerRow || []);
  const required = ["student_id", "fullname", "gender", "birthdate", "age", "course", "contactnumber", "email"];
  const missing = required.filter((r) => headers[r] === undefined);
  if (missing.length) {
    showImportError(`Missing columns: ${missing.join(", ")}`);
    return { headers: [], rows: [], text: "" };
  }
  const textRows = [];
  const outRows = [];
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

    outRows.push({
      student_id: studentId,
      full_name: fullName,
      gender,
      birthdate,
      age,
      course,
      contact_number: contactNumber,
      email,
    });
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
  return {
    headers: [
      "student_id",
      "full_name",
      "gender",
      "birthdate",
      "age",
      "course",
      "contact_number",
      "email",
    ],
    rows: outRows,
    text: textRows.join("\n"),
  };
}

function extractSubjectsData(workbook) {
  const sheet = workbook.Sheets["Subjects"];
  if (!sheet) {
    showImportError('Subjects sheet not found. Only "Subjects" sheet is allowed for Grading.');
    return { headers: [], rows: [], text: "" };
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const [headerRow, ...dataRows] = rows;
  const headers = getHeaderIndexMap(headerRow || []);
  const required = ["subject_name"];
  const missing = required.filter((r) => headers[r] === undefined);
  if (missing.length) {
    showImportError(`Missing columns: ${missing.join(", ")}`);
    return { headers: [], rows: [], text: "" };
  }
  const outRows = [];
  const textRows = dataRows
    .filter((r) => r[headers["subject_name"]])
    .map((r) => {
      const row = {
        subject_name: r[headers["subject_name"]],
        student_name: r[headers["student_name"]] || "",
        prelim: r[headers["prelim"]] || "",
        midterm: r[headers["midterm"]] || "",
        prefinal: r[headers["prefinal"]] || "",
        finals: r[headers["finals"]] || "",
        average: r[headers["average"]] || "",
        gwa: r[headers["gwa"]] || "",
        remarks: r[headers["remarks"]] || "",
        year_level: r[headers["year_level"]] || "",
        semester: r[headers["semester"]] || "",
      };
      outRows.push(row);
      return [
        row.subject_name,
        row.student_name,
        row.prelim,
        row.midterm,
        row.prefinal,
        row.finals,
        row.average,
        row.gwa,
        row.remarks,
        row.year_level,
        row.semester,
      ].join("\t");
    });
  return {
    headers: [
      "subject_name",
      "student_name",
      "prelim",
      "midterm",
      "prefinal",
      "finals",
      "average",
      "gwa",
      "remarks",
      "year_level",
      "semester",
    ],
    rows: outRows,
    text: textRows.join("\n"),
  };
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
        gwa,
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
        gwa: gwa !== undefined && gwa !== "" ? Number(gwa) : null,
        remarks: (remarks || "").trim() || null,
        yearLevel: (yearLevel || "").trim() || null,
        semester: (semester || "").trim() || null,
      };
    })
    .filter((g) => g.subjectName);

  await upsertSubjects(rawGrades);
}

async function importStudentsFromRows(rows) {
  if (!rows.length) return;
  const newStudents = rows
    .map((r) => ({
      idCode:
        (r.student_id || "").trim() ||
        (Math.floor(100000 + Math.random() * 900000)).toString(),
      fullName: (r.full_name || "").trim(),
      gender: r.gender || null,
      birthdate: r.birthdate || null,
      course: r.course || null,
      age: r.age || null,
      contactNumber: r.contact_number || null,
      email: r.email || null,
    }))
    .filter((s) => s.fullName);
  await upsertStudents(newStudents);
}

async function importSubjectsFromRows(rows) {
  if (!rows.length) return;
  const payload = rows
    .map((r) => ({
      subjectName: (r.subject_name || "").trim(),
      studentName: (r.student_name || "").trim(),
      prelim: r.prelim !== "" ? Number(r.prelim) : null,
      midterm: r.midterm !== "" ? Number(r.midterm) : null,
      prefinal: r.prefinal !== "" ? Number(r.prefinal) : null,
      finals: r.finals !== "" ? Number(r.finals) : null,
      average: r.average !== "" ? Number(r.average) : null,
      gwa: r.gwa !== "" ? Number(r.gwa) : null,
      remarks: (r.remarks || "").trim() || null,
      yearLevel: (r.year_level || "").trim() || null,
      semester: (r.semester || "").trim() || null,
    }))
    .filter((g) => g.subjectName);
  await upsertSubjects(payload);
}

function buildPreviewTable(headers, rows) {
  if (!headers.length) {
    return `<div style="color:var(--muted);font-size:12px;">No data to preview.</div>`;
  }
  const bodyRows = rows
    .map(
      (r) => `
      <tr>
        ${headers
          .map((h) => `<td>${r[h] ?? ""}</td>`)
          .join("")}
      </tr>
    `
    )
    .join("");
  return `
    <div class="preview-table">
      <table class="table">
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
}
