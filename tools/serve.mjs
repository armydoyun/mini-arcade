// 개발용 정적 서버. ES Module은 file://에서 막히므로 http://localhost로 연다.
//   node tools/serve.mjs [port]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json" };

export const serve = (root = ROOT, port = 0) => new Promise((resolve) => {
    const server = http.createServer((req, res) => {
        const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
        const file = path.resolve(root, "." + (url.endsWith("/") ? url + "index.html" : url));
        if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
        fs.readFile(file, (error, body) => {
            if (error) { res.writeHead(404); res.end("not found"); return; }
            res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
            res.end(body);
        });
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
});

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
    const server = await serve(ROOT, Number(process.argv[2]) || 8000);
    console.log(`http://localhost:${server.address().port}`);
}
