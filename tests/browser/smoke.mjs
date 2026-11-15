// 실제 Chromium에서 40종을 모두 연다. 개발 소스(http)와 단일 파일 배포본(file://)을 같은 절차로 검사한다.
//   홈: 카드 수·필터·검색 / 게임: 시작 → 키·마우스 입력 → 일시정지·재개 → 재시작 → 홈 복귀
//   어느 단계에서든 console.error·pageerror가 나오면 실패. Canvas 게임은 실제로 무언가 그렸는지도 본다.
import { games } from "../../js/catalog.js";
import { open, newPage, check, count, screenshot } from "./lib.mjs";

const KEYS = ["Enter", "ArrowRight", "ArrowUp", "Space", "ArrowLeft", "KeyD", "KeyW", "ArrowDown", "Digit1", "KeyS"];
const { browser, targets, close } = await open();
const failures = [];
try {
    for (const [target, url] of Object.entries(targets)) {
        const home = await newPage(browser);
        await home.goto(url);
        await home.waitForSelector(".game-grid > *");
        const cards = await home.locator("#game-grid > *").count();
        check(cards === games.length, `${target}: 홈 카드 ${cards}개 (기대 ${games.length})`);
        await home.fill("#game-search", "테트리스");
        check(await home.locator("#game-grid > *:visible").count() >= 1, `${target}: 검색 결과`);
        await home.fill("#game-search", "");
        await home.click('[data-player="2"]');
        const duo = await home.locator("#game-grid > *:visible").count();
        check(duo > 0 && duo < games.length, `${target}: 둘이 하기 필터 ${duo}개`);
        if (target === "deploy") await screenshot(home, "home");
        check(home.errors.length === 0, `${target} 홈 오류\n${home.errors.join("\n")}`);
        await home.closeAll();

        for (const game of games) {
            const page = await newPage(browser);
            try {
                await page.goto(`${url}#${game.id}`);
                await page.waitForFunction(() => !document.getElementById("play").hidden && document.getElementById("game-root").childElementCount > 0);
                const root = page.locator("#game-root");
                await page.keyboard.press("Enter");
                await page.waitForTimeout(80);
                const box = await root.boundingBox();
                check(box && box.width > 200 && box.height > 150, `${game.id}: 게임 영역 크기 ${JSON.stringify(box)}`);
                for (const key of KEYS) { await page.keyboard.press(key); await page.waitForTimeout(25); }
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.6);
                await page.waitForTimeout(150);
                const painted = await page.evaluate(() => {
                    const canvas = document.querySelector("#game-root canvas");
                    if (!canvas) return null;
                    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data, seen = new Set();
                    for (let i = 0; i < data.length && seen.size < 4; i += 4 * 97) seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
                    return seen.size;
                });
                if (painted !== null) check(painted >= 2, `${game.id}: Canvas가 한 가지 색뿐입니다`);
                await page.keyboard.press("KeyP"); await page.waitForTimeout(40); await page.keyboard.press("KeyP");
                await page.click("#restart");
                const leave = page.locator("#leave-dialog[open] #leave-confirm");
                if (await leave.count()) await leave.click();
                await page.waitForTimeout(60);
                await page.click("#back-home");
                if (await leave.count()) await leave.click();
                await page.waitForFunction(() => !document.getElementById("home").hidden);
                if (target === "deploy" && ["tetris", "golf", "sudoku", "tanks"].includes(game.id)) {
                    await page.goto(`${url}#${game.id}`); await page.keyboard.press("Enter"); await page.waitForTimeout(250); await screenshot(page, game.id);
                }
                check(page.errors.length === 0, `${target}/${game.id} 오류\n${page.errors.join("\n")}`);
            } catch (error) {
                failures.push(`${target}/${game.id}: ${error.message.split("\n").slice(0, 6).join("\n")}`);
            } finally {
                await page.closeAll();
            }
        }
    }
    // 혼자 · 컴퓨터와 모드: 실제 브라우저에서 내가 두면 컴퓨터가 응수한다(배포본 기준).
    for (const game of games.filter((item) => item.modes?.some((mode) => mode.cpu))) {
        for (const mode of game.modes.filter((item) => item.cpu)) {
            const page = await newPage(browser);
            try {
                await page.goto(`${targets.deploy}#${game.id}`);
                await page.waitForSelector("#game-mode");
                await page.selectOption("#game-mode", mode.id);
                await page.keyboard.press("Enter");
                await page.waitForTimeout(100);
                const hud = await page.textContent("#game-hud");
                check(hud.includes("컴퓨터"), `${game.id}/${mode.id}: HUD에 컴퓨터 표시`);
                if (game.id !== "pong") {
                    const stones = () => page.locator("#game-root .cell.p1, #game-root .cell.p2").count(), before = await stones();
                    const target = game.id === "reversi" ? "#game-root .cell.legal" : "#game-root .cell:not(.p1):not(.p2)";
                    await page.locator(target).nth(game.id === "gomoku" ? 112 : 0).click();
                    await page.waitForTimeout(900);
                    check((await stones()) >= before + 2, `${game.id}/${mode.id}: 컴퓨터가 응수`);
                } else await page.waitForTimeout(1500);
                check(page.errors.length === 0, `${game.id}/${mode.id} 오류\n${page.errors.join("\n")}`);
            } catch (error) {
                failures.push(`cpu/${game.id}/${mode.id}: ${error.message.split("\n").slice(0, 6).join("\n")}`);
            } finally {
                await page.closeAll();
            }
        }
    }
} finally {
    await close();
}
if (failures.length) { console.error(failures.join("\n\n")); console.error(`FAIL: ${failures.length}개 게임`); process.exit(1); }
console.log(`PASS: ${count()} browser smoke conditions (${games.length} games × dev/deploy)`);
