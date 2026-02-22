const helpToggle = document.getElementById("helpToggle");
const helpPanel = document.getElementById("helpPanel");
const logoutBtn = document.getElementById("logoutBtn");

helpToggle.addEventListener("click", () => {
    helpPanel.classList.toggle("open");

    helpToggle.textContent = helpPanel.classList.contains("open") ? "◀" : "➤";
});

logoutBtn.addEventListener("click", () => {
    alert("Logged out successfully!");
    // window.location.href = "login.html";
});