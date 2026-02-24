const container = document.getElementById("fileContainer");
const pathText = document.getElementById("pathText");
const folderCountEl = document.getElementById("folderCount");
const fileCountEl = document.getElementById("fileCount");

const data = JSON.parse(sessionStorage.getItem("folderData")) || [];
const folderPath = sessionStorage.getItem("folderPath") || "";

pathText.textContent = "📁 Path: " + folderPath;

let folderCount = 0;
let fileCount = 0;
const overlay = document.getElementById("overlay");
const modalContent = document.getElementById("modalContent");
const closeModal = document.getElementById("closeModal");

function openModal(html) {
  modalContent.innerHTML = html;
  overlay.classList.add("active");
}

function closeModalFn() {
  overlay.classList.remove("active");
}

closeModal.onclick = closeModalFn;
overlay.onclick = e => e.target === overlay && closeModalFn();

function findPath(items, target, path = []) {
  for (let item of items) {
    const newPath = [...path, item.name];

    if (item.name.toLowerCase() === target.toLowerCase()) {
      return newPath;
    }

    if (item.children) {
      const res = findPath(item.children, target, newPath);
      if (res) return res;
    }
  }
  return null;
}

document.getElementById("searchBtn").addEventListener("click", () => {
  const name = searchInput.value.trim();
  if (!name) return;

  const result = findPath(data, name);

  if (result) {
    openModal(`
      <h3>✅ File / Folder Found</h3>
      <p><b>${name}</b> yaha mil gaya:</p>
      <ol>
        ${result.map(p => `<li>Is folder me jaao → <b>${p}</b></li>`).join("")}
      </ol>
    `);
  } else {
    openModal(`
      <h3 style="color:red;">❌ Not Found</h3>
      <p><b>${name}</b> is directory me exist nahi karta.</p>
    `);
  }
});

function renderItems(items, parent) {
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";

    if (item.type === "Folder") folderCount++;
    if (item.type === "File") fileCount++;

    div.innerHTML = `
      <span class="name">
        ${item.type === "Folder" ? "📂" : "📄"} ${item.name}
      </span>
      <span class="size">
        ${item.type === "File" ? item.size + " bytes" : ""}
      </span>
    `;

    parent.appendChild(div);

    if (item.children && item.children.length) {
      const child = document.createElement("div");
      child.className = "children";
      parent.appendChild(child);
      renderItems(item.children, child);
    }
  });
}

renderItems(data, container);

folderCountEl.textContent = folderCount;
fileCountEl.textContent = fileCount;