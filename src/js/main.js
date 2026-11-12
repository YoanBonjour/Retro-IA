async function askServer(question) {
  const response = await fetch(
    `http://localhost:3000/ask?q=${encodeURIComponent(question)}`,
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erreur serveur");
  }
  return data;
}

window.askServer = askServer;

const log = document.querySelector("#log");
const input = document.querySelector("#input");
let busy = false;
let ticketNumber = 0;

function focusInput() {
  if (window.getSelection().toString()) return;
  input.focus({ preventScroll: true });
}

window.addEventListener("load", focusInput);
window.addEventListener("focus", focusInput);
document.addEventListener("click", focusInput);
input.addEventListener("blur", () => setTimeout(focusInput, 0));
input.addEventListener("keydown", (event) => {
  if (event.key === "Tab") event.preventDefault();
});

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
    const result = await askServer(question);
    status.textContent = `TICKET ${String(result.number).padStart(4, "0")} ENVOYE A L'IMPRIMANTE.`;
  } catch (error) {
    status.textContent = `ERREUR : ${error.message}`;
  } finally {
    busy = false;
    input.focus();
  }
});

/* ---------- Gros titre en ASCII ---------- */

const BANNER = [
  " #### #   #  #### ##### ##### #   #        ###  #  #",
  "#      # #  #       #   #     ## ##       #   # #  #",
  " ###    #    ###    #   ####  # # #  ###   ###  #####",
  "    #   #       #   #   #     #   #       #   #    #",
  "####    #   ####    #   ##### #   #        ###     #",
].join("\n");

/* ---------- Statut des serveurs ---------- */

const statusBar = document.querySelector("#statusbar");

async function checkStatus() {
  try {
    const response = await fetch("http://localhost:3000/status", {
      signal: AbortSignal.timeout(3000),
    });
    const data = await response.json();
    return { server: true, printer: data.printer };
  } catch {
    return { server: false, printer: null };
  }
}

const label = (value) =>
  value === true ? "EN LIGNE" : value === false ? "HORS LIGNE" : "INCONNU";

function setStatusLine(line, name, value) {
  line.textContent = `${name} `.padEnd(24, ".") + ` ${label(value)}`;
  line.classList.toggle("status--error", value !== true);
}

function renderStatusBar(status) {
  statusBar.textContent =
    `SERVEUR PRINCIPAL : ${label(status.server)}  |  ` +
    `IMPRIMANTE : ${label(status.printer)}`;
  statusBar.dataset.ok = String(status.server && status.printer === true);
}

let mainLine = null;
let printerLine = null;
let readyLine = null;

function renderAll(status) {
  renderStatusBar(status);

  if (mainLine) {
    setStatusLine(mainLine, "SERVEUR PRINCIPAL", status.server);
  }
  if (printerLine) {
    setStatusLine(printerLine, "SERVEUR IMPRIMANTE", status.printer);
  }
  if (readyLine) {
    const ready = status.server && status.printer === true;
    readyLine.textContent = ready
      ? "PRET. POSEZ VOTRE QUESTION, OPERATEUR."
      : "SYSTEME INCOMPLET. LANCEZ LES SERVEURS.";
    readyLine.classList.toggle("status--error", !ready);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function typeLine(text, className = "", speed = 25) {
  const line = addLine("", className);
  for (const char of text) {
    line.textContent += char;
    log.scrollTop = log.scrollHeight;
    await sleep(speed);
  }
  return line;
}

async function revealBanner() {
  const line = addLine("", "banner");
  for (const row of BANNER.split("\n")) {
    line.textContent += (line.textContent ? "\n" : "") + row;
    await sleep(120);
  }
}

async function refreshStatus() {
  renderAll(await checkStatus());
}

/* ---------- Démarrage ---------- */

async function boot() {
  busy = true;

  await revealBanner();
  await sleep(400);
  addLine("");

  await typeLine("VERIFICATION DU SYSTEME...");
  await sleep(600);

  mainLine = addLine("SERVEUR PRINCIPAL ...... ...");
  await sleep(500);
  printerLine = addLine("SERVEUR IMPRIMANTE .... ...");
  await sleep(500);
  addLine("");
  readyLine = addLine("");
  addLine("");

  const status = await checkStatus();
  renderStatusBar(status);

  setStatusLine(mainLine, "SERVEUR PRINCIPAL", status.server);
  await sleep(700);
  setStatusLine(printerLine, "SERVEUR IMPRIMANTE", status.printer);
  await sleep(700);
  renderAll(status);

  busy = false;
  input.focus();
  setInterval(refreshStatus, 5000);
}

boot();
