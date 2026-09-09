function handleLogin(event) {
  event.preventDefault();

  const role = document.getElementById("userRole").value;
  const name = document.getElementById("userName").value.trim();
  const contact = document.getElementById("userContact").value.trim();

  if (!name || !contact) {
    alert("Please enter both Name and Contact details.");
    return;
  }

  const userData = { name, contact, role };
  localStorage.setItem("krishiUser", JSON.stringify(userData));

  if (role === "farmer") {
    window.location.href = "add-crop.html";
  } else if (role === "buyer") {
    window.location.href = "add-requirement.html";
  }
}

function checkAuth() {
  const storedUser = localStorage.getItem("krishiUser");
  if (!storedUser) {
    window.location.href = "login.html";
    return null;
  }
  return JSON.parse(storedUser);
}

function logout() {
  localStorage.removeItem("krishiUser");
  window.location.href = "login.html";
}