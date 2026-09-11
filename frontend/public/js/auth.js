const AUTH_API_URL = "https://krishishell.onrender.com/api/auth";
let authMode = "register";

function handleLogin(event) {
  event.preventDefault();

  const name = document.getElementById("userName").value.trim();
  const phone = document.getElementById("userContact").value.trim();
  const password = document.getElementById("userPass").value;
  if (!phone || !password || (authMode === "register" && !name)) {
    showAuthMessage("Please complete all required fields.");
    return;
  }

  const payload = authMode === "register"
    ? { name, phone, password }
    : { phone, password };

  fetch(`${AUTH_API_URL}/${authMode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Authentication failed.");
      return result;
    })
    .then(({ user }) => {
      localStorage.setItem("krishiUser", JSON.stringify(user));
      localStorage.setItem("isLoggedIn", "true");
      window.location.href = "add-crop.html";
    })
    .catch((error) => showAuthMessage(error.message));
}

function showAuthMessage(message) {
  const messageElement = document.getElementById("loginMessage");
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.classList.toggle("visible", Boolean(message));
  }
}

function checkAuth() {
  const storedUser = localStorage.getItem("krishiUser");
  if (localStorage.getItem("isLoggedIn") !== "true" || !storedUser) {
    window.location.href = "login.html";
    return null;
  }

  return JSON.parse(storedUser);
}

function farmerStorageKey(name) {
  const user = JSON.parse(localStorage.getItem("krishiUser") || "null");
  return user?.id ? `${name}_${user.id}` : name;
}

function logout() {
  localStorage.removeItem("krishiUser");
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}

function toggleAuthMode() {
  authMode = authMode === "register" ? "login" : "register";
  document.getElementById("loginTitle").textContent =
    authMode === "register" ? "Create Farmer Account" : "Farmer Login";
  document.getElementById("loginSubtitle").textContent =
    authMode === "register" ? "Create an account to continue." : "Sign in to continue.";
  document.getElementById("authSubmit").textContent =
    authMode === "register" ? "Create Account" : "Sign In";
  document.getElementById("authModeToggle").textContent =
    authMode === "register" ? "Already have an account? Sign in" : "New farmer? Create an account";
  document.getElementById("userName").required = authMode === "register";
  showAuthMessage("");
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("authModeToggle");
  if (toggle) toggle.addEventListener("click", toggleAuthMode);
});