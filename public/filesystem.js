const helpToggle = document.getElementById("helpToggle");
const helpPanel = document.getElementById("helpPanel");
const logoutBtn = document.getElementById("logoutBtn");

helpToggle.addEventListener("click", () => {
    helpPanel.classList.toggle("open");
    helpToggle.textContent = helpPanel.classList.contains("open") ? "◀" : "➤";
});




const pathInput = document.querySelector(".path");
const analyzeBtn = document.querySelector(".analyze-btn");

analyzeBtn.addEventListener("click", async () => {
  const filePath = pathInput.value.trim();

  if (filePath === "") {
    alert("Please enter a file or folder path");
    return;
  }

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ path: filePath })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Request failed");
      return;
    }

    console.log(data);
    alert(`Total items: ${data.totalItems}`);

    pathInput.value = "";

  } catch (error) {
    console.error(error);
    alert("Server error");
  }
});





logoutBtn.addEventListener("click", () => {
    alert("Logged out successfully!");
    window.location.href = "index.html";
});
