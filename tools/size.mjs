// 실행 원본(index.html · style.css · js/**/*.js) 바이트 합계를 잰다. docs/DEVELOPMENT.md의 1,000,000 B 상한을 지킨다.
//   node tools/size.mjs           파일별 표와 합계
//   node tools/size.mjs --check   합계가 상한을 넘으면 실패
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const LIMIT = 1_000_000;
const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    return entry.isDirectory() ? walk(rel) : entry.name.endsWith(".js") ? [rel] : [];
});
export const runtimeFiles = () => ["index.html", "style.css", ...walk("js").sort()];
export const measure = () => runtimeFiles().map((file) => ({ file, bytes: fs.statSync(path.join(ROOT, file)).size }));

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
    const rows = measure(), total = rows.reduce((sum, row) => sum + row.bytes, 0);
    if (!process.argv.includes("--check")) for (const row of rows) console.log(`${String(row.bytes).padStart(8)}  ${row.file}`);
    console.log(`합계 ${total.toLocaleString("en-US")} B / 상한 ${LIMIT.toLocaleString("en-US")} B (${((total / LIMIT) * 100).toFixed(2)}%) · 파일 ${rows.length}개`);
    if (total >= LIMIT) { console.error("실행 원본 합계가 상한을 넘었습니다."); process.exit(1); }
}
