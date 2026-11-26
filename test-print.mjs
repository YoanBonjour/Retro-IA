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
        printer.align("lt");
        for (const line of text.split("\n")) {
          printer.text(line);
        }
        printer
          .text("")
          .text("")
          .text("")
          .cut()
          .close((closeError) => {
            if (closeError) reject(closeError);
            else resolve();
          });
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
