const http = require("http");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const PORT = 8001;
const SESSION_FILE = "session.json";
//expire in 2hour session pending

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
  try {
    return JSON.parse(await fs.readFile(SESSION_FILE, "utf8"));
  } catch {
    return [];
  }
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



async function readFolderStructure(folderPath) {
  const items = await fs.readdir(folderPath, { withFileTypes: true });
  const result = [];

  for (const item of items) {
    const fullPath = path.join(folderPath, item.name);

    if (item.isDirectory()) {
      result.push({
        name: item.name,
        type: "Folder",
        children: await readFolderStructure(fullPath)
      });
    } else {
      const stats = await fs.stat(fullPath);
      result.push({
        name: item.name,
        type: "File",
        size: stats.size
      });
    }
  }
  return result;
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
    const sessions = await readSessions();
    if (!sessions.find(s => s.sessionId === cookies.sessionId)) {
      res.writeHead(302, { Location: "/" });
      return res.end();
    }

    return serveStaticFile(
      path.join(__dirname, "public", "dashboard.html"),
      res
    );
  }




if (req.method === "POST" && req.url === "/analyze") {

  try {


    const cookies = parseCookies(req);
    const sessions = await readSessions();

    const isValidSession = sessions.find(
      s => s.sessionId === cookies.sessionId
    );

    if (!isValidSession) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not authorized" }));
      return;
    }
    

    const body = JSON.parse(await readBody(req));

if (!body.path) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Path required" }));
  return;
}

let folderPath = body.path.trim();
folderPath = folderPath.replace(/^"+|"+$/g, "");

if (!path.isAbsolute(folderPath)) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Absolute path required" }));
  return;
}

try {
  await fs.access(folderPath);
} catch {
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Path does not exist" }));
  return;
}

const structure = await readFolderStructure(folderPath);

res.writeHead(200, { "Content-Type": "application/json" });
res.end(JSON.stringify({
  success: true,
  data: structure
}));
return;

  } catch (err) {
    console.error("ANALYZE ERROR:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
    return;
  }
}

  const filePath = path.join(__dirname, "public", req.url);
  return serveStaticFile(filePath, res);
});




 



server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});