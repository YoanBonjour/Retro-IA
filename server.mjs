import http from "node:http";
import { askAI } from "./ai.mjs";

const PORT = 3000;

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

    try {
      const answer = await askAI(question);
      res.end(JSON.stringify({ answer }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Serveur pret : http://localhost:${PORT}`);
});
