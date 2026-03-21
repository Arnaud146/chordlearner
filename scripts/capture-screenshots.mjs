/**
 * Capture screenshots for the design brief (docs/screenshots/).
 *
 * Prerequisites:
 *   npm run dev   (app on CHORDLEARNER_BASE_URL, default http://localhost:3000)
 *   npx playwright install chromium
 *
 * Public pages only (default):
 *   npm run screenshots
 *
 * + authenticated pages (after saving storage):
 *   npx playwright codegen --save-storage=playwright/.auth/user.json http://localhost:3000/login
 *   # log in, close the window
 *
 *   CHORDLEARNER_STORAGE_STATE=playwright/.auth/user.json CHORDLEARNER_SONG_ID=<uuid> npm run screenshots
 *
 * Optional OCR review (query string without leading ?):
 *   CHORDLEARNER_OCR_REVIEW_QUERY=ocrImportId=...&imageUrl=...
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const BASE_URL = process.env.CHORDLEARNER_BASE_URL ?? "http://localhost:3000";
const OUT_DIR =
  process.env.CHORDLEARNER_SCREENSHOT_DIR ??
  path.join(REPO_ROOT, "docs", "screenshots");
const STORAGE_STATE = process.env.CHORDLEARNER_STORAGE_STATE;
const SONG_ID = process.env.CHORDLEARNER_SONG_ID;
const OCR_REVIEW_QUERY = process.env.CHORDLEARNER_OCR_REVIEW_QUERY;

const VIEWPORT = { width: 1440, height: 900 };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {import('playwright').Page} page
 * @param {string} filename
 * @param {string} url
 * @param {{ fullPage?: boolean }} [opts]
 */
async function capture(page, filename, url, opts = {}) {
  const { fullPage = false } = opts;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await sleep(1500);
  const outPath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: outPath, fullPage });
  console.log("Wrote", outPath);
}

async function main() {
  await fs.promises.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // --- Public (fresh context, no cookies) ---
  const publicContext = await browser.newContext({ viewport: VIEWPORT });
  const publicPage = await publicContext.newPage();
  try {
    await capture(publicPage, "01-landing.png", `${BASE_URL}/`, {
      fullPage: true,
    });
    await capture(publicPage, "02-login.png", `${BASE_URL}/login`);
    await capture(publicPage, "03-signup.png", `${BASE_URL}/signup`);
  } finally {
    await publicContext.close();
  }

  // --- Authenticated ---
  if (STORAGE_STATE && fs.existsSync(STORAGE_STATE)) {
    const authContext = await browser.newContext({
      viewport: VIEWPORT,
      storageState: STORAGE_STATE,
    });
    const authPage = await authContext.newPage();
    try {
      await capture(authPage, "04-songs-library.png", `${BASE_URL}/songs`, {
        fullPage: true,
      });
      await capture(authPage, "05-new-song.png", `${BASE_URL}/songs/new`, {
        fullPage: true,
      });

      if (OCR_REVIEW_QUERY) {
        const q = OCR_REVIEW_QUERY.startsWith("?")
          ? OCR_REVIEW_QUERY.slice(1)
          : OCR_REVIEW_QUERY;
        await capture(
          authPage,
          "06-ocr-review.png",
          `${BASE_URL}/songs/new/ocr-review?${q}`,
          { fullPage: true },
        );
      } else {
        console.warn(
          "[skip] 06-ocr-review.png — set CHORDLEARNER_OCR_REVIEW_QUERY (e.g. ocrImportId=...&imageUrl=...)",
        );
      }

      if (SONG_ID) {
        await capture(
          authPage,
          "07-song-detail.png",
          `${BASE_URL}/songs/${SONG_ID}`,
          { fullPage: true },
        );
      } else {
        console.warn(
          "[skip] 07-song-detail.png — set CHORDLEARNER_SONG_ID to a real song UUID",
        );
      }

      await capture(authPage, "08-profil.png", `${BASE_URL}/profil`, {
        fullPage: true,
      });
    } finally {
      await authContext.close();
    }
  } else {
    console.warn(
      "[skip] 04–08 — create storage with: npx playwright codegen --save-storage=playwright/.auth/user.json http://localhost:3000/login",
    );
    console.warn("      then set CHORDLEARNER_STORAGE_STATE to that file path.");
  }

  await browser.close();
  console.log("Done. Output directory:", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
