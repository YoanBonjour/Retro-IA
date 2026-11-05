import { formatTicket } from "./ticket.js";

async function askServer(question) {
  const response = await fetch(
    `http://localhost:3000/ask?q=${encodeURIComponent(question)}`,
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erreur serveur");
  }
  return data.answer;
}

window.askServer = askServer;

const log = document.querySelector("#log");
const input = document.querySelector("#input");
let busy = false;
let ticketNumber = 0;

function addLine(text, className = "") {
  const line = document.createElement("pre");
  line.className = `terminal__text ${className}`;
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
  return line;
}

input.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter" || busy) return;

  const question = input.value.trim();
  if (!question) return;

  input.value = "";
  busy = true;
  addLine(`> ${question}`);
  const status = addLine("TRAITEMENT EN COURS...");

  try {
    const answer = await askServer(question);
    status.textContent = "REPONSE RECUE.";
    ticketNumber += 1;
    addLine(formatTicket(answer, ticketNumber), "ticket");
  } catch (error) {
    status.textContent = `ERREUR : ${error.message}`;
  } finally {
    busy = false;
    input.focus();
  }
});
