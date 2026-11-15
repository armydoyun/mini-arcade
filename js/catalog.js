import tetris from './games/tetris.js';
import snake from './games/snake.js';
import breakout from './games/breakout.js';
import swipeBreak from './games/swipe-break.js';
import flappy from './games/flappy.js';
import merge from './games/merge.js';
import mines from './games/mines.js';
import nonogram from './games/nonogram.js';
import sliding from './games/sliding.js';
import lights from './games/lights.js';
import flood from './games/flood.js';
import stack from './games/stack.js';
import dodge from './games/dodge.js';
import asteroids from './games/asteroids.js';
import invaders from './games/invaders.js';
import catchGame from './games/catch.js';
import runner from './games/runner.js';
import memory from './games/memory.js';
import simon from './games/simon.js';
import maze from './games/maze.js';
import tictactoe from './games/tictactoe.js';
import gomoku from './games/gomoku.js';
import connectFour from './games/connect-four.js';
import reversi from './games/reversi.js';
import dots from './games/dots.js';
import hex from './games/hex.js';
import pong from './games/pong.js';
import cycles from './games/cycles.js';
import { nonograms, sokobanLevels, duoLevels, laserPuzzles, pipePuzzles, sudokuPuzzles } from './puzzles.js';
import sokoban from './games/sokoban.js';
import samegame from './games/samegame.js';
import wallRace from './games/wall-race.js';
import tanks from './games/tanks.js';
import territory from './games/territory.js';
import bubbles from './games/bubbles.js';
import golf from './games/golf.js';
import switchDuo from './games/switch-duo.js';
import laser from './games/laser.js';
import pipes from './games/pipes.js';
import sudoku from './games/sudoku.js';
import mancala from './games/mancala.js';

const game = (id, name, category, players, color, description, controls, rules, create, record = 'high') => ({ id, name, category, players, color, description, controls, rules, create, record });
export const games = [
    game('tetris', '테트리스', '아케이드', 1, '#bda0ff', '세 블록 앞을 읽고, 콤보를 이어가요.', ['← → 이동', '↓ 빠르게', '↑ / X 시계 회전', 'Z 반대 회전', 'C 보관', 'Space 즉시 낙하'], ['7종 블록을 한 묶음씩 섞어요. 10줄마다 속도가 올라가고 착지 후 0.45초 동안 조정할 수 있어요.', '연속 줄 제거와 연속 4줄 제거는 보너스! 스프린트는 화면의 타이머로 40줄 완주 시간을 겨뤄요.'], tetris),
    game('snake', '스네이크', '아케이드', 1, '#b9f86b', '끝없이 길어지는 작은 욕심.', ['방향키 / WASD'], ['먹이를 먹으면 성장하고 조금씩 빨라져요. 방향을 두 번까지 예약할 수 있어요.', '클래식은 벽과 몸을 피해요. 경계 통과 모드는 반대편으로 이어지고, 고속 모드는 처음부터 빨라요.'], snake),
    game('breakout', '벽돌깨기', '아케이드', 1, '#82b6ff', '반사각, 연속 파괴, 한 번의 기회.', ['← → / 마우스 이동', 'Space / 클릭 발사'], ['패들 끝으로 치면 각도가 커져요. 패들에 다시 닿기 전 연속 파괴는 최대 5배 점수예요.', '초록 ↔은 14초 패들 확장, ♥은 생명 회복. 정밀 도전은 작은 패들과 생명 1개예요.'], breakout),
    game('swipe-break', '스와이프 벽돌깨기', '아케이드', 1, '#f5d47d', '반사 경로에 담는 한 수 앞의 조준.', ['마우스 드래그', '← → 조준', 'Space 발사 / 속도 전환', 'C 공 회수'], ['+를 맞히면 다음 턴의 공이 늘어요. 첫 번째 귀환 위치가 다음 발사점이에요.', '발사 중 Space로 1배/3배 속도 전환. C로 회수하거나 22초 후 자동 회수해요. 벽돌이 붉은 선까지 내려오면 끝나요.'], swipeBreak),
    game('flappy', '플래피', '아케이드', 1, '#ff9fa8', '작은 날갯짓으로 다음 틈까지.', ['Space / ↑ / 클릭'], ['기둥 사이를 지나면 +1. 기둥의 높이는 이전 틈에서 도달 가능한 범위 안에서 바뀌어요.', '넓은 틈 모드는 간격이 넓고 느려요. 천장·바닥·기둥에 부딪히면 종료돼요.'], flappy),
    game('merge', '2048', '퍼즐', 1, '#e6bb7d', '다음 빈칸을 남기는 숫자의 기술.', ['방향키', 'Z 되돌리기'], ['한 번 이동에서 같은 타일은 한 번만 합쳐져요. 무효 이동에는 새 타일이 생기지 않아요.', '2048 이후 계속 도전할 수 있어요. 되돌리기는 새 타일·점수까지 복원하며 이번 판은 연습 기록이 돼요.'], merge),
    game('mines', '지뢰찾기', '퍼즐', 1, '#a4c6ec', '숫자를 읽고 안전을 확신하는 순간.', ['클릭 열기', '우클릭 깃발', 'M 깃발 모드', '숫자 클릭 주변 열기'], ['첫 칸과 주변은 안전해요. 깃발 개수가 숫자와 같으면 숫자를 눌러 나머지 이웃을 한 번에 열어요.', '초급 9×9·10개, 중급 16×16·40개, 고급 24×16·99개. 잘못 세운 깃발로 주변을 열면 지뢰를 밟을 수 있어요.'], mines, 'low'),
    game('nonogram', '네모네모 로직', '퍼즐', 1, '#8ed5ce', '스물네 장의 숨은 그림을 찾아요.', ['클릭 / 드래그 채우기', '우클릭 ×', 'M 표시 모드', 'Z 되돌리기', 'H 한 칸 힌트'], ['숫자는 연속된 채움 칸의 길이예요. 묶음 사이는 한 칸 이상 비워요. 완성한 단서는 초록색으로 바뀌어요.', '24문제 모두 유일해를 검증했어요. ✓ 완료 · ◐ 보조 사용 완료. 보조 사용은 연습 기록이며, 문제마다 기록을 따로 저장해요.'], nonogram, 'low'),
    game('sliding', '슬라이딩 퍼즐', '퍼즐', 1, '#c1a0ff', '한 칸을 비워 두는 현명한 순서.', ['인접 타일 클릭', '방향키 빈칸 이동', 'Z 되돌리기'], ['3×3과 4×4 모두 합법 이동으로 섞어 풀 수 있어요. 점이 찍힌 타일은 올바른 자리에 있어요.', '필요 이동 하한은 각 타일의 맨해튼 거리 합이에요. 실제 최단 해답은 더 길 수 있어요. 되돌리기는 연습으로 기록해요.'], sliding, 'low'),
    game('lights', 'Lights Out', '퍼즐', 1, '#d5e995', '하나를 누르면 다섯 칸이 달라져요.', ['클릭 반전', 'Z 되돌리기', 'H 한 칸 힌트'], ['자신과 상하좌우의 불을 뒤집어 모두 끄세요. 시작 판에는 항상 해답이 있어요.', '표시된 최소 해답은 시작 판의 최솟값이에요. 힌트는 현재 판의 해답 중 다음 한 칸을 보여줘요. 보조 사용은 연습 기록이에요. 최고 기록은 최적해 대비 초과 이동으로 비교해요.'], lights, 'low'),
    game('flood', 'Flood It', '퍼즐', 1, '#ffac8d', '좋은 색 하나가 여는 넓은 길.', ['1~6 색 선택', '색상 버튼', 'Z 되돌리기'], ['왼쪽 위에서 연결 영역을 넓혀요. 현재 영역의 테두리가 밝게 표시돼요.', '넉넉하게 30회, 클래식 25회, 도전 22회. 제한 안에 풀 수 있는 경로를 확인한 판을 생성해요. 되돌리기는 연습 기록이에요.'], flood, 'low'),
    game('stack', 'Stack Tower', '액션', 1, '#9edcc5', '완벽한 타이밍은 여유를 돌려줘요.', ['Space / 클릭 놓기'], ['겹친 부분만 남아요. 가까이 맞히면 PERFECT! 3연속부터 폭을 조금씩 회복해요.', '한 층 100점, 연속 PERFECT 추가 점수. 타워가 높아지면 화면이 부드럽게 올라가요.'], stack),
    game('dodge', 'Dodge', '액션', 1, '#ff8e7a', '틈을 읽고, 대시로 빠져나가요.', ['방향키 / WASD', '마우스 드래그', 'Shift 대시'], ['적은 0.55초 동안 출현을 예고해요. Shift는 0.23초 무적 대시이며 3초마다 쓸 수 있어요.', '장애물 가까이를 스치면 GRAZE +5점. 오래 버틸수록 패턴과 속도가 강해져요.'], dodge),
    game('asteroids', 'Asteroids', '액션', 1, '#b4c4e0', '관성을 타고 운석 사이를 갈라요.', ['← → 회전', '↑ 추진', 'Space 연속 발사', 'Shift 방어막'], ['운석은 부서지며 작은 조각으로 나뉘어요. 화면과 충돌 판정 모두 가장자리에서 이어져요.', '연속 격추는 최대 4배 점수. Shift 방어막 1초, 재충전 6초. 기회는 3번이에요.'], asteroids),
    game('invaders', 'Space Invaders', '액션', 1, '#b4c980', '방벽의 틈에서 되찾는 주도권.', ['← → 이동', 'Space 연속 발사', '마우스 드래그 + 연사'], ['전방 사수부터 공격해요. 방벽은 적 탄환과 내 탄환 모두에 부서져요.', 'UFO +150점, 웨이브 클리어 +150점. 적이 방어선에 닿거나 생명을 모두 잃으면 종료돼요.'], invaders),
    game('catch', 'Catch Game', '액션', 1, '#f5d47d', '별을 놓치지 않는 작은 리듬.', ['← → / 마우스 이동'], ['별을 연속 5개 받을 때마다 배율이 올라가 최대 4배가 돼요. 큰 금빛 별은 기본 30점, 초록 +는 생명 회복이에요.', '붉은 가시는 생명과 콤보를 잃게 해요. 별을 놓치면 콤보만 끊겨요. 마우스와 키보드의 이동 속도는 같아요. 60초 동안 도전하세요.'], catchGame),
    game('runner', 'Endless Runner', '액션', 1, '#96c9f4', '넘거나 숙이거나, 코인을 향해서.', ['Space / ↑ / 클릭 점프', '공중에서 한 번 더 점프', '↓ / S 숙이기'], ['낮은 장애물은 점프, 보라 가로 막대는 숙여 피하세요. 코인은 +10점이에요.', '공중 점프는 착지할 때 다시 충전돼요. 거리 점수는 실제로 달린 거리를 누적해요.'], runner),
    game('memory', '카드 짝맞추기', '기억·탐색', 1, '#e4b8d5', '잠깐의 기억으로 이어지는 한 쌍.', ['클릭 뒤집기', 'H 둘러보기'], ['시작하면 1.5초 미리 보여줘요. 이후 두 장씩 뒤집어 모든 쌍을 찾으세요.', '6쌍·8쌍·10쌍 모드가 있어요. H로 1.2초 둘러볼 수 있지만 이번 판은 연습 기록으로 구분해요.'], memory, 'low'),
    game('simon', 'Simon Says', '기억·탐색', 1, '#bca6e8', '빛나는 순서가 조금씩 길어져요.', ['패드 클릭 / 1~4', 'H 다시 보기'], ['패턴이 끝난 뒤 같은 순서로 눌러요. 단계가 오르면 재생 속도도 조금씩 빨라져요.', '클래식은 기회 1번, 여유 모드는 3번이에요. H로 패턴을 다시 보면 연습 기록이 돼요.'], simon),
    game('maze', '미로 탈출', '기억·탐색', 1, '#8bd8ba', '지도에 남는 발걸음, 가까워지는 출구.', ['방향키 / WASD', 'T 이동 흔적', 'H 세 칸 힌트'], ['R로 같은 미로에 재도전하고 N으로 새 미로를 만들어요. 출구는 오른쪽 아래, 기록은 최단 경로 대비 효율이에요.', '안개 모드는 21×21이며 주변만 보여요. 탐색한 지역은 지도에 남아요. 힌트 사용은 연습 기록이에요.'], maze, 'high'),
    game('tictactoe', '틱택토', '턴제 대전', 2, '#c8a1ed', '세 칸을 잇거나, 끝까지 피하거나.', ['보드 번갈아 클릭', '방향키 + Enter', 'Z 한 수 되돌리기'], ['클래식은 3개를 먼저 이으면 승리해요. 보드가 가득 차면 무승부예요.', '역전 규칙 모드는 세 개를 이은 사람이 패배해요. 선택한 모드의 이름을 확인하세요.'], tictactoe, 'duel'),
    game('gomoku', '오목', '턴제 대전', 2, '#d4b58d', '다섯 수 뒤의 승리를 그려요.', ['보드 번갈아 클릭', '방향키 + Enter', 'Z 한 수 되돌리기'], ['15×15 자유형. P1 흑이 먼저 두며, 가로·세로·대각선으로 5개 이상 연결하면 승리해요.', '금수는 없어요. 최근 수와 승리 연결을 표시하고, 되돌리면 차례도 함께 복원해요.'], gomoku, 'duel'),
    game('connect-four', '사목', '턴제 대전', 2, '#82b6ff', '떨어지는 한 돌로 잇는 네 칸.', ['열 클릭 / 1~7', 'Z 한 수 되돌리기'], ['돌은 해당 열의 맨 아래 빈칸에 떨어져요. 가득 찬 열에는 둘 수 없어요.', '희미한 칸은 착지 위치예요. 가로·세로·대각선으로 먼저 4개를 연결하세요.'], connectFour, 'duel'),
    game('reversi', '오델로', '턴제 대전', 2, '#a8cfb7', '뒤집힐 돌까지 읽는 한 수.', ['숫자가 있는 칸 클릭', '방향키 + Enter', '마우스 / 키보드 미리보기', 'Z 한 수 되돌리기'], ['숫자는 뒤집을 돌의 수예요. 칸에 마우스를 올리거나 키보드로 선택하면 뒤집을 돌을 강조해요.', '둘 곳이 없으면 자동 패스, 둘 다 둘 수 없으면 종료해요. 흑·백 중 돌이 많은 쪽이 승리해요.'], reversi, 'duel'),
    game('dots', '점과 상자', '턴제 대전', 2, '#e8ae93', '마지막 선을 긋고 한 번 더.', ['점 사이 선 클릭', '방향키 + Enter', 'Z 한 수 되돌리기'], ['상자의 네 번째 선을 그으면 점수를 얻고 추가로 한 번 둬요. 한 선으로 두 상자를 완성할 수도 있어요.', '가운데 점이 보이는 상자는 변이 하나 남았어요. 16개를 모두 채우면 점수를 비교해요.'], dots, 'duel'),
    game('hex', '헥스', '턴제 대전', 2, '#ff9f91', '반대쪽 변을 향해 놓는 연결의 길.', ['빈 육각형 클릭', '방향키 + Enter', 'Z 한 수 되돌리기'], ['P1은 붉은 위↕아래, P2는 푸른 왼쪽↔오른쪽 변을 연결해요.', '변을 공유한 육각형만 연결돼요. 7×7과 9×9 모드가 있으며 승리 경로를 강조해요.'], hex, 'duel'),
    game('pong', 'Pong', '실시간 대전', 2, '#a4c5f5', '패들에 싣는 마지막 한 점의 스핀.', ['P1 W / S', 'P2 ↑ / ↓'], ['패들 위치와 움직임이 반사각과 스핀을 결정해요. 랠리가 길어지면 공이 빨라져요.', '7점 또는 11점을 먼저 얻으면 승리해요. 서브 방향은 득점자와 관계없이 번갈아 바뀌어요.'], pong, 'duel'),
    game('cycles', 'Light Cycles', '실시간 대전', 2, '#a7d8d5', '길을 남기며 이어가는 세 번의 승부.', ['P1 WASD', 'P2 방향키'], ['두 사람의 다음 위치를 같은 틱에 판정해요. 같은 칸·맞충돌·동시 충돌은 무승부예요.', '3승 매치는 라운드마다 출발 위치와 속도가 바뀌어요. 단판 모드는 첫 승리로 종료해요.'], cycles, 'duel'),
    game('sokoban', '소코반', '퍼즐', 1, '#e6bb7d', '빈자리 하나에서 시작되는 상자의 순서.', ['방향키 / WASD 이동', '바닥 클릭 자동 걷기', 'Z 되돌리기'], ['상자를 목표 테두리에 모두 밀어 넣으세요. 당길 수 없고, 상자 두 개를 한꺼번에 밀 수 없어요.', '직접 구성한 20개 스테이지의 풀이와 최소 밀기를 검증했어요. 밀기 수가 적을수록, 같으면 이동이 적을수록 좋은 기록이에요. 되돌리기는 자유롭게 사용해요.'], sokoban, 'low'),
    game('samegame', '블록 묶음 지우기', '퍼즐', 1, '#a8d59a', '지금 지운 빈칸이 만드는 더 큰 묶음.', ['클릭 선택 / 다시 클릭 제거', '방향키 + Enter 선택', 'Space 제거 · C 선택 취소', 'Z 되돌리기'], ['같은 색 두 개 이상을 선택하고 한 번 더 눌러 제거해요. 아래로 떨어진 뒤 빈 열은 왼쪽으로 당겨져요.', '묶음 크기보다 1 작은 수의 제곱만큼 점수! 더 지울 묶음이 없으면 정산하고 완전 제거는 +1,000점이에요. R은 같은 판, N은 새 판. 되돌리기는 연습 기록이에요.'], samegame),
    game('wall-race', '길막기 대전', '턴제 대전', 2, '#9ecac7', '한 걸음의 전진, 한 장벽의 우회.', ['방향키 + Enter 선택', 'M 말 이동 · H 가로 · V 세로', '장벽 미리보기 후 클릭', 'Z 한 수 되돌리기'], ['P1은 위쪽, P2는 아래쪽 끝에 먼저 도착하면 승리해요. 매 차례 말 이동 또는 장벽 하나를 선택해요. 장벽은 각 10개예요.', '장벽은 겹치거나 교차할 수 없으며 두 사람 모두 도착할 길이 남아야 해요. 마주 선 상대는 뛰어넘고, 뒤가 막히면 옆으로 돌아갈 수 있어요.'], wallRace, 'duel'),
    game('tanks', '반사 탄환 탱크 대전', '실시간 대전', 2, '#b8c3dc', '튕겨 돌아올 한 발까지 읽는 승부.', ['P1 WASD 이동 · Space 발사', 'P2 방향키 이동 · Enter 발사'], ['이동 방향으로 포탑이 부드럽게 돌아가요. 탄창은 3발, 모두 쏘면 1.25초 자동 재장전이에요. 점선은 가까운 조준 경로예요.', '반사탄은 자신도 맞아요. 60초 제한, 동시 격파와 시간 초과는 무승부. 먼저 3승하면 승리하며 순환 모드에서는 경기장이 바뀌어요.'], tanks, 'duel'),
    game('territory', '땅따먹기', '액션', 1, '#b9dba2', '한 줄의 모험으로 넓어지는 나의 영역.', ['방향키 / WASD 이동', 'Space 그리기 ON / OFF'], ['안전 구역에서 그리기를 켜고, 영역 밖으로 나갔다 돌아오면 빛이 없는 쪽을 점령해요. 그리던 선에 빛이 닿거나 선을 교차하면 기회가 줄어요.', '기회는 3번. 클래식은 75%, 여유 모드는 70% 점령이 목표예요. 점령 칸당 5점과 선 길이 보너스를 얻어요. 같은 시드는 빛의 시작 상태가 같아요.'], territory),
    game('bubbles', '버블 슈터', '아케이드', 1, '#d7a6da', '연결 고리 하나로 가벼워지는 하늘.', ['마우스 / ← → 조준', '클릭 / Space 발사', 'X 다음 색과 교환'], ['같은 색 3개 이상을 이으면 터져요. 천장과 연결이 끊긴 버블은 떨어지며 더 많은 점수를 얻어요. 빈 원은 벽 반사까지 계산한 부착 위치예요.', '5번 연속 연결에 실패하면 천장이 한 줄 내려와요. 붉은 선에 닿으면 종료, 전부 지우면 성공이에요. 남아 있는 색만 발사하며 교환은 발사 전 한 번 가능해요.'], bubbles),
    game('golf', '미니 골프', '스포츠', 1, '#9ed2b4', '힘을 조금 덜어내면 가까워지는 홀.', ['공을 뒤로 당겨 놓기', '← → 각도 · ↑ ↓ 힘', 'Space 퍼팅'], ['9개의 코스를 순서대로 돌아요. 벽에는 반사되고, 물에 빠지면 1벌타 후 샷 출발점으로 돌아와요. 홀당 최대 12타이며 PAR는 기준 타수예요.', '혼자는 총 타수 기록에 도전해요. 둘이서는 샷마다 번갈아 치고, 서로 독립된 공으로 플레이해요. 9홀 총 타수가 적으면 승리해요.'], golf, 'low'),
    game('switch-duo', 'Switch Duo', '협동 퍼즐', 2, '#e6c786', '내가 밟는 발판이 친구의 길이 되도록.', ['P1 WASD · P2 방향키', '1 / 2 마우스 조작자 선택', '인접 바닥 클릭', 'Z 함께 되돌리기'], ['두 플레이어가 자기 번호의 출구에 동시에 서면 성공해요. 숫자 발판은 밟고 있는 동안, ↺ 스위치는 들어설 때마다 같은 번호의 문을 바꿔요.', '붉은 바닥은 P1, 푸른 바닥은 P2만 지나가요. 문 위에 서 있는 친구는 문이 닫히지 않게 잡아줘요. 12개 스테이지의 풀이를 검증하며 걸음 합을 기록해요.'], switchDuo, 'low'),
    game('laser', '레이저 반사 퍼즐', '퍼즐', 1, '#c0a6e9', '거울 한 장이 바꾸는 빛의 목적지.', ['클릭 / Space 거울 회전', '방향키 선택', 'Z 되돌리기 · H 한 수 힌트'], ['거울을 돌려 모든 ◎ 목표에 빛을 연결하세요. + 분광기는 들어온 빛을 직진·좌우 세 방향으로 나눠요. 빛은 벽과 보드 끝에서 멈춰요.', '12개 스테이지의 해답과 시작 최소 회전을 전수 검사했어요. 회전 수가 적을수록 좋은 기록이에요. 되돌리기는 자유, 힌트는 연습 기록이에요.'], laser, 'low'),
    game('mancala', '만칼라', '턴제 대전', 2, '#ddb78b', '한 줌의 씨앗으로 읽는 다음 차례.', ['자기 칸 클릭 / 숫자 1~6', '← → 선택 · Enter / Space', 'Z 한 수 되돌리기'], ['아래 P1, 위 P2. 자기 줄의 왼쪽부터 1~6번이에요. 한 칸의 씨앗을 모두 집어 반시계로 하나씩 담고 상대 저장소는 건너뛰어요. 자기 저장소에서 끝나면 한 번 더 둬요.', '빈 자기 칸에 마지막 씨앗이 들어가고 맞은편에 씨앗이 있으면 양쪽을 포획해요. 한쪽 줄이 비면 남은 씨앗을 각자의 저장소에 모아 비교해요. 칼라 규칙이며 선공 교환 규칙은 없어요.'], mancala, 'duel'),
    game('sudoku', '스도쿠', '퍼즐', 1, '#a4c6ec', '작은 확신을 모아 완성하는 아홉 칸.', ['칸 선택 후 1~9 입력', 'N 메모 · Del / 0 지우기', 'Z 되돌리기 · H 한 칸 힌트'], ['각 행·열·3×3 상자에 1~9가 한 번씩 들어가도록 채워요. 붉은 표시는 중복 규칙만 알려주며 정답 자체를 미리 채점하지 않아요.', '고정 숫자 42·34·28개의 문제 각 6개, 총 18개 유일해를 검증했어요. N으로 후보를 메모하고 숫자를 넣으면 같은 집의 메모가 정리돼요. 되돌리기는 자유, 힌트만 연습 기록이에요.'], sudoku, 'low'),
    game('pipes', '파이프 연결', '퍼즐', 1, '#9ed6c4', '열린 끝 하나 없이 이어지는 회로.', ['클릭 / E 시계 회전', '우클릭 / Q 반시계 회전', '방향키 선택', 'Z 되돌리기 · H 한 수 힌트'], ['모든 파이프를 전원에 연결하고 붉게 표시된 열린 끝을 없애세요. 초록은 전원에 연결된 곳, ◆는 고정 파이프예요. 네 갈래 파이프는 돌려도 같아 고정이에요.', '4×4·5×5·6×6 총 12판의 유일한 회전 배치와 최소 회전을 검증했어요. 시계·반시계 모두 한 번에 90도 회전해요. 되돌리기는 자유, 힌트는 연습 기록이에요.'], pipes, 'low')

];
const choices = {
    laser: laserPuzzles.map((p,i) => [`stage-${i}`, `${i + 1} / ${laserPuzzles.length} · ${p.name}`]), pipes: pipePuzzles.map((p,i) => [`stage-${i}`, `${i + 1} / ${pipePuzzles.length} · ${p.name}`]), sudoku: sudokuPuzzles.map((p,i) => [`stage-${i}`, `${i + 1} / ${sudokuPuzzles.length} · ${p.name}`]), mancala: [['classic','칸마다 4개 · 48개'], ['quick','칸마다 3개 · 36개']],
    territory: [['classic', '75% 클래식'], ['calm', '70% 여유롭게']], bubbles: [['classic', '4색 클래식'], ['easy', '3색 입문'], ['hard', '5색 도전']], golf: [['solo', '혼자 · 9홀 기록'], ['duel', '둘이 · 번갈아 9홀']], 'switch-duo': duoLevels.map((puzzle, i) => [`stage-${i}`, `${i + 1} / ${duoLevels.length} · ${puzzle.name}`]),
    sokoban: sokobanLevels.map((puzzle, i) => [`stage-${i}`, `${i + 1} / ${sokobanLevels.length} · ${puzzle.name}`]), samegame: [['classic', '4색 클래식'], ['easy', '3색 넉넉하게'], ['hard', '5색 도전']], tanks: [['classic', '순환 엄폐'], ['pillars', '기둥 경기장'], ['open', '중앙 통로']],
    tetris: [['classic', '마라톤'], ['sprint', '40줄 스프린트']], snake: [['classic', '클래식'], ['wrap', '경계 통과'], ['rush', '고속 도전']],
    breakout: [['classic', '클래식'], ['precision', '정밀 도전']], flappy: [['classic', '클래식'], ['calm', '넓은 틈']],
    mines: [['easy', '초급 9×9'], ['medium', '중급 16×16'], ['hard', '고급 24×16']], nonogram: nonograms.map((_, i) => [`puzzle-${i}`, `퍼즐 ${i + 1} / ${nonograms.length} · 5×5 입문`]),
    sliding: [['classic', '4×4 클래식'], ['easy', '3×3 입문']], lights: [['classic', '5×5 클래식'], ['easy', '3×3 입문']], flood: [['classic', '25회 클래식'], ['easy', '30회 넉넉하게'], ['hard', '22회 도전']],
    memory: [['classic', '8쌍 클래식'], ['quick', '6쌍 빠르게'], ['challenge', '10쌍 도전']], simon: [['classic', '기회 1번'], ['safe', '기회 3번']], maze: [['classic', '15×15 탐험'], ['fog', '21×21 안개']],
    tictactoe: [['classic', '3개 연결 승리'], ['reverse', '3개 연결 패배']], hex: [['classic', '7×7'], ['large', '9×9']], pong: [['classic', '7점 승부'], ['long', '11점 승부']], cycles: [['classic', '먼저 3승'], ['sudden', '단판 승부']]
};
for (const game of games) {
    if (choices[game.id]) game.modes = choices[game.id].map(([id, name]) => ({ id, name }));
    game.progress = ['nonogram', 'sokoban', 'switch-duo', 'laser', 'pipes', 'sudoku'].includes(game.id);
    game.fresh = ['laser', 'mancala', 'sudoku', 'pipes'].includes(game.id);
    game.seeded = ['sliding', 'lights', 'flood', 'maze', 'samegame', 'territory', 'bubbles'].includes(game.id);
    game.coop = game.id === 'switch-duo';
    game.protectProgress = ['golf', 'switch-duo'].includes(game.id);
    if (game.id === 'golf') game.modes.forEach((mode) => { mode.players = mode.id === 'duel' ? 2 : 1; mode.record = mode.id === 'duel' ? 'duel' : 'low'; });
}
