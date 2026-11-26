/* ---------- Create printer server ---------- */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { formatTicket } from "./src/js/ticket.js";
import { Printer } from "@node-escpos/core";
import USB from "@node-escpos/usb-adapter";

const VENDOR_ID = 0x4b43;
const PRODUCT_ID = 0x3830;

function printOnPaper(text) {
  return new Promise((resolve, reject) => {
    let device;
    try {
      device = new USB(VENDOR_ID, PRODUCT_ID);
    } catch {
      reject(new Error("Imprimante introuvable"));
      return;
    }

    device.open((error) => {
      if (error) {
        reject(new Error("Impossible d'ouvrir l'imprimante"));
        return;
      }

      try {
        const printer = new Printer(device, { encoding: "GB18030", width: 32 });
        printer.align("ct");
        for (const line of text.split("\n")) {
          printer.text(line);
        }
        printer.text("").text("").text("").cut();
        let finished = false;
        const done = () => {
          if (finished) return;
          finished = true;
          resolve();
        };
        printer.close(done);
        setTimeout(done, 2000);
      } catch (printError) {
        reject(printError);
      }
    });
  });
}

let queue = Promise.resolve();

function enqueue(text) {
  const job = queue.then(() => printOnPaper(text));
  queue = job.catch(() => {});
  return job;
}

const PORT = 4000;
const clients = new Set();
const history = [];

function broadcast(ticket) {
  const message = `data: ${JSON.stringify(ticket)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}

async function printTicket({ number, answer }) {
  const text = formatTicket(answer, number);

  console.log("\n" + text + "\n");

  await enqueue(text);

  const ticket = { number, text };
  history.push(ticket);
  if (history.length > 50) history.shift();

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

    req.on("end", async () => {
      let ticket;
      try {
        ticket = JSON.parse(body);
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Ticket invalide" }));
        return;
      }

      try {
        await printTicket(ticket);
        res.end(JSON.stringify({ printed: true }));
      } catch (error) {
        console.error("Erreur impression :", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
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
