import http from "node:http";
import { askAI } from "./ai.mjs";

/* ---------- Background server configuration ---------- */
const PORT = 3000;
const PRINTER_URL = "http://localhost:4000/print";
let ticketNumber = 0;

async function printerIsOnline() {
  try {
    const response = await fetch(new URL("/status", PRINTER_URL), {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/* ---------- Send ticket to printer ---------- */
async function sendToPrinter(ticket) {
  const response = await fetch(PRINTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticket),
  });

  if (!response.ok) {
    throw new Error(`Serveur imprimante : erreur ${response.status}`);
  }
}

/* ---------- Create background server ---------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:1234");

  if (url.pathname === "/ask") {
    const question = url.searchParams.get("q");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (!question) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Question manquante" }));
      return;
    }

    if (!(await printerIsOnline())) {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: "Serveur imprimante injoignable" }));
      return;
    }

    try {
      const answer = await askAI(question);
      ticketNumber += 1;
      await sendToPrinter({ number: ticketNumber, answer });
      res.end(JSON.stringify({ number: ticketNumber }));
    } catch (error) {
      console.error("Erreur /ask :", error);
      res.statusCode = 500;
      res.end(
        JSON.stringify({ error: error.message, cause: error.cause?.code }),
      );
    }
    return;
  }
  if (url.pathname === "/status") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ server: true, printer: await printerIsOnline() }));
    return;
  }
  res.statusCode = 404;
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Serveur principal pret : http://localhost:${PORT}`);
});
