const container = document.getElementById("fileContainer");
const pathText = document.getElementById("pathText");
const folderCount= document.getElementById("folderCount");
const fileCount = document.getElementById("fileCount");

const data = JSON.parse(sessionStorage.getItem("folderData")) || [];
const folderPath = sessionStorage.getItem("folderPath") || "";

pathText.textContent = folderPath;


function renderItems(items, parent) {
  items.forEach(item => {
    const div = document.createElement("div");
    div.innerHTML = `
      <span>${item.type === "Folder" ? "FOLDER" : "FILE"} ${item.name}</span>
      <span>${item.type === "File" ? item.size + " bytes" : "Folder"}</span>
    `;
    parent.appendChild(div);

    if (item.children && item.children.length) {
      const child = document.createElement("div");
      child.style.marginLeft = "20px";
      parent.appendChild(child);
      renderItems(item.children, child);
    }
  });
}

renderItems(data, container);