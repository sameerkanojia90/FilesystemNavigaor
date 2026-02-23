
setTimeout(() => {
  alert("Welcome! to the dashboard");
}, 1000);

const startBtn = document.getElementById("startNavigator");

startBtn.addEventListener("click", () => {
    window.location.href = "Filesystem.html";
});