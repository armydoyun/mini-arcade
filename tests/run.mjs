#!/usr/bin/env node
// 통합 테스트 실행기.
//   node     tests/*.mjs        — Node만 있으면 된다(모의 DOM으로 40종 실제 모듈 실행, 규칙·완주·빌드 검사)
//   browser  tests/browser/*.mjs — Playwright Chromium으로 개발 소스와 단일 파일 배포본을 실제로 연다
//
//   npm test                      두 묶음 모두
//   npm run test:node             node 묶음만
//   node tests/run.mjs --grep=rules  파일 이름에 rules가 들어간 테스트만
//   --strict   준비되지 않아 건너뛴 묶음(SKIP)도 실패로 친다(CI용)
//   --list     실행하지 않고 분류만 보여 준다
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUITES = ["node", "browser"];
const HELPERS = new Set(["run.mjs", "harness.mjs", "lib.mjs"]);
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const grep = argv.find((a) => a.startsWith("--grep="))?.slice(7);
const chosen = argv.filter((a) => !a.startsWith("--"));
for (const name of chosen) if (!SUITES.includes(name)) { console.error(`알 수 없는 묶음: ${name} (가능: ${SUITES.join(", ")})`); process.exit(2); }
const suites = chosen.length ? chosen : SUITES;
const list = (dir) => fs.readdirSync(path.join(ROOT, dir)).filter((name) => name.endsWith(".mjs") && !HELPERS.has(name) && (!grep || name.includes(grep))).sort().map((name) => `${dir}/${name}`);
const plan = { node: list("tests"), browser: list("tests/browser") };

if (flag("list")) {
    for (const suite of SUITES) console.log(`${suite} (${plan[suite].length})\n${plan[suite].map((n) => `  ${n}`).join("\n")}`);
    process.exit(0);
}

const results = [];
const run = (file) => new Promise((resolve) => {
    const started = Date.now(); let output = "";
    const child = spawn(process.execPath, [file], { cwd: ROOT, env: process.env });
    const timer = setTimeout(() => { output += "\n시간 초과(600s)"; child.kill(); }, 600_000);
    child.stdout.on("data", (d) => (output += d)); child.stderr.on("data", (d) => (output += d));
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, output, ms: Date.now() - started }); });
});
const pool = async (items, size, work) => {
    let next = 0;
    await Promise.all(Array.from({ length: Math.max(1, Math.min(size, items.length)) }, async () => { while (next < items.length) await work(items[next++]); }));
};
const tail = (text, n) => text.trimEnd().split(/\r?\n/).slice(-n).map((line) => `      ${line}`).join("\n");

const browserReady = async () => {
    try {
        const { chromium } = await import("playwright");
        const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
        await browser.close();
        return "";
    } catch (error) {
        return `Chromium을 띄우지 못했습니다(npm install 후 npx playwright install chromium): ${String(error.message).split("\n")[0]}`;
    }
};

for (const suite of suites) {
    console.log(`\n[${suite}]`);
    if (suite === "browser") {
        const reason = await browserReady();
        if (reason) { console.log(`  SKIP ${reason}`); for (const file of plan.browser) results.push({ suite, file, status: "SKIP" }); continue; }
    }
    await pool(plan[suite], suite === "node" ? Math.min(os.cpus().length, 8) : 2, async (file) => {
        const { code, output, ms } = await run(file);
        const status = code === 0 ? "PASS" : "FAIL";
        results.push({ suite, file, status });
        const summary = output.trim().split(/\r?\n/).filter((line) => /^(PASS|FAIL)/.test(line)).at(-1) || "";
        console.log(`  ${status} ${file} (${(ms / 1000).toFixed(1)}s) ${summary}`);
        if (status === "FAIL") console.log(tail(output, 40));
    });
}

const by = (status) => results.filter((r) => r.status === status).length;
console.log(`\n합계: PASS ${by("PASS")} · FAIL ${by("FAIL")} · SKIP ${by("SKIP")}`);
process.exit(by("FAIL") || (flag("strict") && by("SKIP")) ? 1 : 0);
