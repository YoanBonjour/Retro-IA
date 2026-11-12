/* ---------- Ticket formatting ---------- */
export const WIDTH = 32;

function clean(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "")
    .toUpperCase();
}

/* ---------- Text wrapping ---------- */
function wrap(text) {
  const lines = [];

  for (const paragraph of text.split("\n")) {
    let line = "";

    for (let word of paragraph.split(/\s+/).filter(Boolean)) {
      while (word.length > WIDTH) {
        if (line) {
          lines.push(line);
          line = "";
        }
        lines.push(word.slice(0, WIDTH));
        word = word.slice(WIDTH);
      }

      if (!line) {
        line = word;
      } else if ((line + " " + word).length <= WIDTH) {
        line += " " + word;
      } else {
        lines.push(line);
        line = word;
      }
    }

    lines.push(line);
  }

  return lines;
}

function center(text) {
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return " ".repeat(pad) + text;
}

export function formatTicket(answer, number) {
  const now = new Date();
  const date = now.toLocaleDateString("fr-CH");
  const time = now.toLocaleTimeString("fr-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const bar = "=".repeat(WIDTH);
  const dash = "-".repeat(WIDTH);

  return [
    bar,
    center("SYSTEM-84"),
    center(`SESSION ${String(number).padStart(4, "0")}`),
    bar,
    ...wrap(clean(answer)),
    dash,
    `${date} ${time}`,
    bar,
  ].join("\n");
}
