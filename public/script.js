// ── State ──────────────────────────────────────────────────────────────────
let accessToken = localStorage.getItem("accessToken");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let selectedSeat = null;

// ── User Area ──────────────────────────────────────────────────────────────
function renderUserArea() {
  const el = document.getElementById("userArea");
  if (accessToken && currentUser) {
    el.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-400">Hi, <strong class="text-white">${currentUser.name}</strong></span>
        <button class="btn btn-ghost" style="padding:7px 14px;font-size:13px;" onclick="logout()">Logout</button>
      </div>`;
  } else {
    el.innerHTML = `<button class="btn btn-gold" onclick="openAuthModal()">Login / Register</button>`;
  }
}

// ── Auth Modal ─────────────────────────────────────────────────────────────
function openAuthModal() {
  document.getElementById("authModal").classList.add("open");
}

function closeAuthModal() {
  document.getElementById("authModal").classList.remove("open");
}

function switchTab(tab) {
  document.getElementById("loginForm").style.display =
    tab === "login" ? "" : "none";
  document.getElementById("registerForm").style.display =
    tab === "register" ? "" : "none";
  document.getElementById("tabLogin").className =
    "btn flex-1 " + (tab === "login" ? "btn-gold tab-active" : "btn-ghost");
  document.getElementById("tabRegister").className =
    "btn flex-1 " + (tab === "register" ? "btn-gold tab-active" : "btn-ghost");
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = "block";
}

function clearErr(id) {
  const el = document.getElementById(id);
  el.textContent = "";
  el.style.display = "none";
}

// ── Auth Handlers ──────────────────────────────────────────────────────────
async function handleLogin() {
  clearErr("loginErr");
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) return showErr("loginErr", "Please fill all fields");

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  const data = await res.json();

  if (!data.success) return showErr("loginErr", data.message);

  accessToken = data.data.accessToken;
  currentUser = data.data.user;
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("user", JSON.stringify(currentUser));
  closeAuthModal();
  renderUserArea();
  toast("Logged in successfully!", "success");
}

async function handleRegister() {
  clearErr("regErr");
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  if (!name || !email || !password)
    return showErr("regErr", "Please fill all fields");

  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();

  if (!data.success) return showErr("regErr", data.message);

  toast("Account created! Please log in.", "success");
  switchTab("login");
  document.getElementById("loginEmail").value = email;
}

async function logout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
  } catch (_) {}
  accessToken = null;
  currentUser = null;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  renderUserArea();
  toast("Logged out", "success");
}

// ── Token Refresh ──────────────────────────────────────────────────────────
async function tryRefresh() {
  const res = await fetch("/api/auth/refresh-token", {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (data.success) {
    accessToken = data.data.accessToken;
    localStorage.setItem("accessToken", accessToken);
    return true;
  }
  return false;
}

// Wrapper that auto-retries once with a refreshed token on 401
async function authFetch(url, options = {}) {
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };
  options.credentials = "include";
  let res = await fetch(url, options);
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      options.headers.Authorization = `Bearer ${accessToken}`;
      res = await fetch(url, options);
    }
  }
  return res;
}

// ── Seats ──────────────────────────────────────────────────────────────────
async function loadSeats() {
  document.getElementById("seatsContainer").innerHTML =
    `<p class="text-gray-600 text-sm">Loading...</p>`;
  const res = await fetch("/api/seats");
  const seats = await res.json();
  renderSeats(seats.sort((a, b) => a.id - b.id));
}

function renderSeats(seats) {
  const container = document.getElementById("seatsContainer");
  container.innerHTML = "";
  const COLS = 10;
  const rows = [];
  for (let i = 0; i < seats.length; i += COLS)
    rows.push(seats.slice(i, i + COLS));

  rows.forEach((row, ri) => {
    const rowEl = document.createElement("div");
    rowEl.className = "flex items-center gap-1.5";

    const label = document.createElement("div");
    label.className =
      "w-4 text-right text-xs text-gray-700 font-mono select-none";
    label.textContent = String.fromCharCode(65 + ri);
    rowEl.appendChild(label);

    row.forEach((seat) => {
      const el = document.createElement("div");
      el.className = "seat " + (seat.isbooked ? "booked" : "available");
      el.textContent = seat.id;

      if (seat.isbooked && seat.name) {
        el.innerHTML = `${seat.id}<span class="tip">Booked by ${seat.name}</span>`;
      }
      if (!seat.isbooked) {
        el.addEventListener("click", () => onSeatClick(seat.id));
      }
      rowEl.appendChild(el);
    });
    container.appendChild(rowEl);
  });
}

// ── Booking ────────────────────────────────────────────────────────────────
function onSeatClick(id) {
  if (!accessToken || !currentUser) {
    openAuthModal();
    toast("Please login to book a seat", "error");
    return;
  }
  selectedSeat = id;
  document.getElementById("confirmSeatId").textContent = id;
  document.getElementById("confirmName").textContent = currentUser.name;
  document.getElementById("bookModal").classList.add("open");
}

function closeBookModal() {
  selectedSeat = null;
  document.getElementById("bookModal").classList.remove("open");
}

async function confirmBook() {
  if (!selectedSeat) return;
  const res = await authFetch(`/api/seats/${selectedSeat}`, { method: "PUT" });
  const data = await res.json();
  closeBookModal();

  if (!data.success) {
    toast(data.message || "Booking failed", "error");
  } else {
    toast(`Seat ${selectedSeat} booked! Enjoy the show 🎬`, "success");
    loadSeats();
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = "success") {
  const el = document.getElementById("toast");
  const icon = type === "success" ? "✓" : "✕";
  el.innerHTML = `<span style="color:${type === "success" ? "#4ade80" : "#f87171"}">${icon}</span> ${msg}`;
  el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "";
  }, 3200);
}

// ── Init ───────────────────────────────────────────────────────────────────
document.getElementById("authModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeAuthModal();
});
document.getElementById("bookModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeBookModal();
});

renderUserArea();
loadSeats();
