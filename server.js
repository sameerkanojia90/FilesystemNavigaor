const http = require("http");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { json } = require("stream/consumers");
const PORT = 5002;
const SESSION_FILE = "session.json";
const SESSION_EXPIRY = 2 * 60 * 60 * 1000;
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

async function searchFile(startPath, targetName) {
  console.log(startPath);
  console.log(targetName);

  const items = await fs.readdir(startPath, { withFileTypes: true });
  console.log(items);
  for (const item of items) {
    const fullPath = path.join(startPath, item.name);
    if (
      item.name.startsWith(".") ||
      item.name === "AppData" ||
      item.name === "$Recycle.Bin" ||
      item.name === "System Volume Information"
    ) {
      continue;
    }
    console.log(fullPath);
    if (item.isDirectory() && item.name === targetName) {
      console.log(fullPath);
      return fullPath;
    }

    if (item.isFile() && item.name === targetName) {
      console.log(fullPath);
      return fullPath;
    }

    if (item.isDirectory()) {
      const result = await searchFile(fullPath, targetName);
      if (result)
        return result;
    }
  }

  return null;
}


async function checkSession(req, res) {

  const cookies = parseCookies(req);
  let sessions = await readSessions();

  const session = sessions.find(
    s => s.sessionId === cookies.sessionId
  );

  if (!session) {
    res.writeHead(302, { Location: "/" });
    res.end();
    return null;
  }

  if (Date.now() > session.expiry) {

    sessions = sessions.filter(
      s => s.sessionId !== session.sessionId
    );

    await writeSessions(sessions);

    res.writeHead(302, {
      "Set-Cookie": "sessionId=; Max-Age=0",
      Location: "/"
    });

    res.end();
    return null;
  }

  return session;
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

    const users = JSON.parse(await fs.readFile
      ("users.json", "utf8"));
    const user = users.find(u => u.email === email &&
      u.password === password);

    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false }));
      return;
    }

    const sessionId = crypto.randomUUID();
    const sessions = await readSessions();
    const now = Date.now();
    const expiry = now + SESSION_EXPIRY;
    sessions.push({
      sessionId,
      createdAt: now,
      expiry
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
    const session = await checkSession(req, res);
    if (!session) return;

    return serveStaticFile(
      path.join(__dirname, "public", "dashboard.html"),
      res
    );
  }






  if (req.method === "POST" && req.url === "/analyze") {

    try {

      const session = await checkSession(req, res);
      if (!session) return;


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
        res.end(JSON.stringify({ error: "absolute path required" }));
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




  if (req.method === "POST" && req.url === "/searchentire") {
    try {
      const session = await checkSession(req, res);
      if (!session) return;
      const body = JSON.parse(await readBody(req));

      if (!body.fileName) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "fileName required" }));
        return;
      }

      let fileName = body.fileName.trim();
      fileName = fileName.replace(/^"+|"+$/g, "");

      const rootPath = `C:\\Users\\pc\\OneDrive`;
      console.log(rootPath);
      const result = await searchFile(rootPath, fileName);


      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        success: true,
        found: result ? true : false,
        path: result || null
      }));
      return;

    } catch (err) {
      console.error("Search error:", err);

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: "Internal server error"
      }));
      return;
    }
  }


  if (req.method === "GET" && req.url === "/session-time") {

  const session = await checkSession(req, res);

  if (!session) {
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      message: "Session expired"
    }));
  }

  const remainingTime = Math.max(0, session.expiry - Date.now());

  res.writeHead(200, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({
    remainingTime
  }));
}




if (req.method === "POST" && req.url === "/logout") {
  const cookies = parseCookies(req);
  let sessions = await readSessions();

  sessions = sessions.filter(
    s => s.sessionId !== cookies.sessionId
  );

  await writeSessions(sessions);

  res.writeHead(200, {
    "Set-Cookie": "sessionId=; Max-Age=0; Path=/; HttpOnly",
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({ success: true }));
  return;
}


  const filePath = path.join(__dirname, "public", req.url);
  return serveStaticFile(filePath, res);
});






server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});