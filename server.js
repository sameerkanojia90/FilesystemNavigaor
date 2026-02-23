const http = require("http");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const PORT = 8001;
const SESSION_FILE = "session.json";
// const SESSION_EXPIRE = 1000 * 60 * 60 * 60;

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json"
};

async function serveStaticFile(filePath, res) {
  try {
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "text/plain";
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("404 Not Found");
  }
}

async function readBody(req) {
  return new Promise(resolve => {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => resolve(body));
  });
}

async function readSessions() {
  return JSON.parse(await fs.readFile(SESSION_FILE, "utf8"));
}

async function writeSessions(data) {
  await fs.writeFile(SESSION_FILE, JSON.stringify(data, null, 2));
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((cookies, item) => {
    const [key, value] = item.trim().split("=");
    cookies[key] = value;
    return cookies;
  }, {});
}

const server = http.createServer(async (req, res) => {

  if (req.method === "GET" && req.url === "/") {
    return serveStaticFile(
      path.join(__dirname, "public", "index.html"),
      res
    );
  }

  if (req.method === "POST" && req.url === "/signup") {
    const body = await readBody(req);
    const { email, password, name } = JSON.parse(body);

    const users = JSON.parse(await fs.readFile("users.json", "utf8"));
    const exists = users.find(u => u.email === email);
    if (exists) {
      res.end("User already exists");
      return;
    }

    users.push({
      id: crypto.randomUUID(),
      name,
      email,
      password
    });

    await fs.writeFile("users.json", JSON.stringify(users, null, 2));
    res.end("Signup successful");
    return;
  }

  if (req.method === "POST" && req.url === "/login") {
    const body = await readBody(req);
    const { email, password } = JSON.parse(body);

    const users = JSON.parse(await fs.readFile("users.json", "utf8"));
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false }));
      return;
    }

    const sessionId = crypto.randomUUID();
    const sessions = await readSessions();

    sessions.push({
      sessionId,
      userId: user.id,
      createdAt: Date.now()
    });

    await writeSessions(sessions);

    res.writeHead(200, {
      "Set-Cookie": `sessionId=${sessionId}; HttpOnly`,
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      success: true,
      redirect: "/dashboard.html"
    }));
    return;
  }

  if (req.method === "GET" && req.url === "/dashboard.html") {
    const cookies = parseCookies(req);
    const sessionId = cookies.sessionId;

    if (!sessionId) {
      res.writeHead(302, { Location: "/" });
      res.end();
      return;
    }

    const sessions = await readSessions();
    const session = sessions.find(s => s.sessionId === sessionId);

    if (!session) {
      res.writeHead(302, { Location: "/" });
      res.end();
      return;
    }

    return serveStaticFile(
      path.join(__dirname, "public", "dashboard.html"),
      res
    );
  }

  const filePath = path.join(__dirname, "public", req.url);
  serveStaticFile(filePath, res);





if (req.method === "POST" && req.url === "/analyze") {

  const cookies = parseCookies(req);
  const sessionId = cookies.sessionId;

  if (!sessionId) {
    res.writeHead(302, { Location: "/" });
    return res.end();
  }

  const sessions = await readSessions();
  const session = sessions.find(s => s.sessionId === sessionId);

  if (!session) {
    res.writeHead(302, { Location: "/" });
    return res.end();
  }

  let folderPath;

  try {
    const body = await readBody(req);

    if (!body) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
         error: "Empty request body"
         }));
    }

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid JSON format" }));
    }

    folderPath = parsed.path;

    if (!folderPath) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Path is required" }));
    }

    try {
      await fs.access(folderPath);
    } catch {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Path not found" }));
    }

    const items = await fs.readdir(folderPath);
    const details = [];

    for (const item of items) {
      const fullPath = path.join(folderPath, item);
      const stats = await fs.stat(fullPath);

      details.push({
        name: item,
        type: stats.isDirectory() ? "Folder" : "File",
        size: stats.isFile() ? stats.size : null
      });
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      success: true,
      totalItems: details.length,
      data: details
    }));

  } catch (err) {
    console.error("Analyze Error:", err);

    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server Error" }));
    }
  }
}













});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});