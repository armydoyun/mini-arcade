// 브라우저 테스트 공용 도구. Playwright Chromium을 띄우고, 개발 소스(http)와 단일 파일 배포본(file://)을 같은 방식으로 연다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { serve } from "../../tools/serve.mjs";
import { build } from "../../tools/build.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const RESULTS = path.join(ROOT, "test-results", "browser");

let checks = 0;
export const check = (condition, message) => { checks++; if (!condition) throw new Error(`실패: ${message}`); };
export const count = () => checks;

// targets: dev = http로 연 원본 ES Module, deploy = 빌드한 deploy/index.html을 file://로 연 것
export const open = async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
    const server = await serve(ROOT);
    const deployFile = path.join(ROOT, "test-results", "build", "index.html");
    await build({ outFile: deployFile });
    const targets = { dev: `http://127.0.0.1:${server.address().port}/index.html`, deploy: pathToFileURL(deployFile).href };
    const close = async () => { await browser.close(); server.close(); };
    return { browser, targets, close };
};

// 페이지마다 콘솔 오류와 잡히지 않은 예외를 모은다. 하나라도 있으면 실패다.
export const newPage = async (browser, viewport = { width: 1280, height: 800 }) => {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage(), errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(`[console.error] ${message.text()}`); });
    page.on("pageerror", (error) => errors.push(`[pageerror] ${error.message}`));
    page.errors = errors;
    page.closeAll = () => context.close();
    return page;
};

export const screenshot = async (page, name) => {
    fs.mkdirSync(RESULTS, { recursive: true });
    await page.screenshot({ path: path.join(RESULTS, `${name}.png`) });
};
