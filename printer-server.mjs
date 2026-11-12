/* ---------- Create printer server ---------- */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { formatTicket } from "./src/js/ticket.js";

const PORT = 4000;
const clients = new Set();
const history = [];

function broadcast(ticket) {
  const message = `data: ${JSON.stringify(ticket)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}

function printTicket({ number, answer }) {
  const text = formatTicket(answer, number);

  // 1. Dans la fenetre de terminal
  console.log("\n" + text + "\n");

  // 2. En memoire (les 50 derniers)
  const ticket = { number, text };
  history.push(ticket);
  if (history.length > 50) history.shift();

  // 3. Vers les pages web connectees
  broadcast(ticket);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/") {
    try {
      const html = await readFile(
        new URL("./printer.html", import.meta.url),
        "utf-8",
      );
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(html);
    } catch {
      res.statusCode = 500;
      res.end("printer.html introuvable");
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connecte\n\n");
    for (const ticket of history) {
      res.write(`data: ${JSON.stringify(ticket)}\n\n`);
    }
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  if (req.method === "GET" && url.pathname === "/status") {
    res.end("ok");
    return;
  }

  if (req.method === "POST" && url.pathname === "/print") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const ticket = JSON.parse(body);
        printTicket(ticket);
        res.end(JSON.stringify({ printed: true }));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Ticket invalide" }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Serveur imprimante pret : http://localhost:${PORT}`);
});
