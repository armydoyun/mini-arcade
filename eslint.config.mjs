// ESLint 설정 (flat config)
// 원칙: 실제 버그로 이어지는 규칙만 오류(error)로 두고, 모양·정리 성격의 규칙은 경고(warn)로 둔다.
// `npm run lint`는 경고도 실패로 친다(--max-warnings=0).
import js from "@eslint/js";
import globals from "globals";

const softened = {
    "no-unused-vars": ["warn", { args: "after-used", argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
    "no-empty": ["warn", { allowEmptyCatch: true }],
    "no-useless-escape": "warn",
    "no-case-declarations": "warn",
    "no-fallthrough": "warn",
    "no-cond-assign": ["warn", "except-parens"],
    "no-constant-condition": ["warn", { checkLoops: false }],
    "no-useless-assignment": "off",
    "preserve-caught-error": "off",
};

const bugs = {
    "no-undef": "error",
    "no-dupe-keys": "error",
    "no-duplicate-case": "error",
    "no-unreachable": "error",
    "no-const-assign": "error",
    "no-func-assign": "error",
    "no-import-assign": "error",
    "no-redeclare": "error",
    "no-self-assign": "error",
    "no-self-compare": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-negation": "error",
    "no-unsafe-optional-chaining": "error",
    "no-loss-of-precision": "error",
    "use-isnan": "error",
    "valid-typeof": "error",
};

export default [
    { ignores: ["deploy/**", "node_modules/**", "test-results/**"] },
    { linterOptions: { reportUnusedDisableDirectives: "warn" } },
    js.configs.recommended,
    // 게임: 브라우저에서 도는 ES 모듈
    {
        files: ["js/**/*.js"],
        languageOptions: { ecmaVersion: 2024, sourceType: "module", globals: { ...globals.browser } },
        rules: { ...softened, ...bugs },
    },
    // 빌드 도구·테스트: Node ES 모듈. 브라우저 테스트는 page.evaluate 안에서 브라우저 전역을 쓴다.
    {
        files: ["**/*.mjs"],
        languageOptions: { ecmaVersion: 2024, sourceType: "module", globals: { ...globals.node, ...globals.browser } },
        rules: { ...softened, ...bugs },
    },
];
