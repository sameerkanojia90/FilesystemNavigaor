const helpToggle = document.getElementById("helpToggle");
const helpPanel = document.getElementById("helpPanel");
const logoutBtn = document.getElementById("logoutBtn");
const pathInput = document.querySelector(".path");
const analyzeBtn = document.querySelector(".analyze-btn");
const Load = document.getElementsByClassName('load');
helpToggle.addEventListener("click", () => {
  helpPanel.classList.toggle("open");
  helpToggle.textContent = helpPanel.classList.contains("open") ? "◀" : "➤";
});

analyzeBtn.addEventListener("click", async () => {
  
  const filePath = pathInput.value.trim();
  if (!filePath) {
    alert("Enter path");
    return;
  }

  try {
    const res = await fetch("/analyze", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: filePath })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }

    sessionStorage.setItem("folderData", JSON.stringify(data.data));
    sessionStorage.setItem("folderPath", filePath);

    window.location.href = "/fileinfo.html";

  } catch {
    alert("Server error");
  }
});


logoutBtn.addEventListener('click', async () => {
  try {
    const res = await fetch("/logout", {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      alert("Logout failed");
      return;
    }

    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    window.location.href = "index.html";
  }
});