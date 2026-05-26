const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const rootDir = path.resolve(__dirname, "..");
const htmlPath = path.join(__dirname, "gurusuite-promo-video.html");
const outputPath = path.join(__dirname, "gurusuite-promo-video.webm");

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"]
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 720, height: 1280 },
      deviceScaleFactor: 1
    });

    await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`);
    await page.waitForSelector("#promoCanvas");

    const bytes = await page.evaluate(async () => {
      const canvas = document.querySelector("#promoCanvas");
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 6000000
      });
      const chunks = [];

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size) chunks.push(event.data);
      });

      const done = new Promise((resolve) => {
        recorder.addEventListener("stop", async () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const buffer = await blob.arrayBuffer();
          resolve(Array.from(new Uint8Array(buffer)));
        });
      });

      window.dispatchEvent(new Event("focus"));
      if (typeof window.recordGuruSuitePromo === "function") {
        window.recordGuruSuitePromo();
      } else {
        recorder.start();
        await new Promise((resolve) => setTimeout(resolve, 20200));
        recorder.stop();
      }

      await new Promise((resolve) => setTimeout(resolve, 20400));
      if (recorder.state !== "inactive") recorder.stop();
      return done;
    });

    fs.writeFileSync(outputPath, Buffer.from(bytes));
    console.log(`Video created: ${path.relative(rootDir, outputPath)}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
