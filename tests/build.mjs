// 단일 파일 배포본 검사: 빌드 결과가 바깥 파일·ES Module 없이 한 파일로 닫혀 있고, 스크립트가 본문 뒤에서 실행되는지 본다.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build } from "../tools/build.mjs";
import { inlineHtml, scriptSafe } from "../tools/inline-html.mjs";
import { measure, LIMIT } from "../tools/size.mjs";

let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks++; };
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mini-arcade-build-")), "index.html");
const result = await build({ outFile: out });
const html = fs.readFileSync(out, "utf8");
ok(result.bytes === Buffer.byteLength(html), "보고한 바이트 수와 파일 크기가 같다");
ok(!/<link[^>]+stylesheet/i.test(html), "스타일시트 링크가 남지 않는다");
ok(!/<script[^>]+src=/i.test(html) && !/type="module"/.test(html), "외부·모듈 스크립트가 남지 않는다");
ok((html.match(/<style>/g) || []).length === 1, "<style>은 하나");
const scriptAt = html.lastIndexOf("<script>"), bodyEnd = html.lastIndexOf("</body>");
ok(scriptAt > html.indexOf('id="leave-dialog"') && scriptAt < bodyEnd, "번들 스크립트는 모든 마크업 뒤, </body> 앞에 온다");
ok(html.includes("오프라인 단일 파일 배포본"), "배포본 표시 주석");
ok(!html.slice(scriptAt + 8, html.indexOf("</script>", scriptAt)).includes("</script"), "번들 안에 </script가 없다");
ok(scriptSafe('a="</script>"') === 'a="<\\/script>"', "scriptSafe가 </script를 바꾼다");
assert.throws(() => scriptSafe("x='<!--'"), /<!--/); checks++;
assert.throws(() => inlineHtml({ html: "<html></html>", css: "", js: "" }), /정확히 한 번/); checks++;
const total = measure().reduce((sum, row) => sum + row.bytes, 0);
ok(total < LIMIT, `실행 원본 합계 ${total} B < ${LIMIT} B`);
console.log(`PASS: ${checks} build conditions · deploy ${(result.bytes / 1024).toFixed(0)} KB`);
