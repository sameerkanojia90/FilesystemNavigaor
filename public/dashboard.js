
setTimeout(() => {
  alert("Welcome! to the dashboard");
}, 1000);

// Start File System Navigator
const startBtn = document.getElementById("startNavigator");

startBtn.addEventListener("click", () => {
    // yahan apna file system / navigator page ka naam do
    window.location.href = "Filesystem.html";
});