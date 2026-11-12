// User study: pairwise video comparison (2AFC).
// Each participant gets TRIALS_PER_USER trials. A trial is one manga case plus two methods' videos,
// shown as Video A / Video B in random order. For every criterion the participant picks the better one.
// Trials are assigned by the Apps Script backend so that the (case, method pair) cells with the
// fewest answers so far are filled first; without a backend the same sampler runs locally.

/* ------------------------------------------------------------------ config */

const STUDY_VERSION = "pairwise_v1";
const TRIALS_PER_USER = clampInt(new URLSearchParams(location.search).get("n"), 20, 1, 20);
const ASSIGN_TIMEOUT_MS = 10000;

// Method codes are what gets stored; participants only ever see "Video A / Video B".
const METHODS = ["ours", "animaker", "vimax", "storymem", "mangadirect"];

// data/videos/<id>/<method>.mp4 and data/manga/<id>/page_manga_<n>.jpg
const CASES = [
    { id: "elf2", pages: 1 },
    { id: "elf3", pages: 1 },
    { id: "goblin", pages: 2 },
    { id: "mado", pages: 2 },
    { id: "dualjustice1", pages: 2 },
    { id: "lovehina", pages: 1 },
    { id: "kick", pages: 1 },
    { id: "dualjustice2", pages: 1 },
    { id: "burari", pages: 2 },
    { id: "lovehina_vol01", pages: 2 },
    { id: "paradon", pages: 1 },
    { id: "rent_a_girlfriend", pages: 1 },
    { id: "baseball", pages: 1 },
    { id: "tadaima", pages: 1 },
    { id: "slap_shot_girls", pages: 2 },
    { id: "lovehina_vol14", pages: 2 },
    { id: "hisoka_returns", pages: 2 },
    { id: "hakura_refrain", pages: 2 },
    { id: "aoni_rakurai", pages: 1 },
    { id: "iseoji", pages: 1 },
];

const CRITERIA = ["fidelity", "story", "coherence", "aesthetics", "overall"];

/* ------------------------------------------------------------------ i18n */

const I18N = {
    zh: {
        langButton: "EN",
        prev: "上一頁",
        next: "下一頁",
        submit: "送出",
        devBanner: "測試模式：尚未設定後端網址，題目在本機抽樣，作答不會被儲存。",
        welcomeTitle: "User study",
        welcomeBody: [
            "謝謝你參與本次user study!",
            "接下來你會看到 {n} 題。每一題會先給你一段漫畫，再給你兩支由不同方法根據這段漫畫生成的影片（影片 A、影片 B）。請依照五個面向，分別選出你覺得比較好的那一支。",
            "請使用電腦或手機並在網路穩定的環境作答。中途關閉頁面，再次開啟時會從上次的位置繼續。",
        ],
        langHint: "To answer in English, click the button at the top right to switch the language.",
        nameLabel: "暱稱或代號",
        namePlaceholder: "例如：小明",
        nameRequired: "請輸入暱稱或代號。",
        introEyebrow: "作答說明",
        introTitle: "開始之前",
        introBody: [
            "每題請先看漫畫，再看兩支影片。兩支影片會同時自動播放，可以隨時按「兩支一起重播」，也可以自己拖曳進度。",
            "影片聲音預設關閉，可以按影片右上角的喇叭圖示開啟。影片長度可能不同，這不代表好壞。",
            "每個面向都一定要選 A 或 B。如果覺得兩支差不多，請選稍微好一點的那支。",
        ],
        loadingAssign: "正在準備題目…",
        trialEyebrow: "第 {i} / {n} 題",
        trialTitle: "哪一支影片比較好？",
        mangaHeading: "漫畫原作（由右至左閱讀，點圖可放大）",
        videoA: "影片 A",
        videoB: "影片 B",
        replay: "兩支一起重播",
        soundOn: "開啟聲音",
        soundOff: "關閉聲音",
        videoMissing: "影片載入失敗",
        answerNote: "請針對每個面向選出比較好的影片。",
        pickA: "比較好",
        pickB: "比較好",
        missingAnswer: "請回答：{c}",
        submitting: "送出中…",
        submitError: "送出失敗，請確認網路後再按一次送出。",
        doneTitle: "已完成，謝謝你的參與！",
        doneBody: "你的回答已經送出，可以關閉這個頁面了。",
        doneProlific: "你的回答已經送出，馬上會帶你回到 Prolific。完成碼：{code}",
        doneProlificLink: "沒有自動跳轉的話，請點這裡回到 Prolific",
        crit: {
            fidelity: {
                title: "1. 漫畫畫面還原度",
                q: "哪一部影片裡的角色（髮型、臉、服裝、體型）和場景背景，和漫畫比較接近？",
            },
            story: {
                title: "2. 劇情忠實度",
                q: "哪一支影片比較忠實地演出漫畫的劇情（動作與情緒）？",
            },
            coherence: {
                title: "3. 影片連貫性",
                q: "哪一支影片的轉場、動作比較連貫、流暢，沒有閃爍或是東西憑空出現？",
            },
            aesthetics: {
                title: "4. 影片美感",
                q: "哪一支影片的畫面比較好看，包含構圖、色彩、光影與動畫質感？",
            },
            overall: {
                title: "5. 整體偏好",
                q: "綜合以上所有面向，如果要把這段漫畫做成動畫，你比較喜歡哪一支？",
            },
        },
    },
    en: {
        langButton: "中文",
        prev: "PREV",
        next: "NEXT",
        submit: "SUBMIT",
        devBanner: "Dry run: no backend URL is set. Trials are sampled locally and answers are not saved.",
        welcomeTitle: "User study",
        welcomeBody: [
            "Thank you for participating in this user study!",
            "You will see {n} questions. Each one shows a short manga excerpt and two videos generated from it by different methods (Video A and Video B). For each of five criteria, pick the video you think is better.",
            "Please use a computer or phone with a stable connection. If you close the page, you will continue where you left off when you reopen it.",
        ],
        langHint: "如果想要用中文作答，可以按右上角的按鈕切換語言。",
        nameLabel: "Nickname or ID",
        namePlaceholder: "e.g. Alex",
        nameRequired: "Please enter a nickname or ID.",
        introEyebrow: "Instructions",
        introTitle: "Before you start",
        introBody: [
            "For each question, read the manga first, then watch the two videos. They autoplay together; press \"Replay both\" at any time, or scrub through them yourself.",
            "Sound is off by default; use the speaker button at the top right of a video to turn it on. The videos may differ in length; length alone is not a sign of quality.",
            "Every criterion needs an answer, A or B. If the two look about the same, pick the one that is slightly better.",
        ],
        loadingAssign: "Preparing your questions…",
        trialEyebrow: "Question {i} / {n}",
        trialTitle: "Which video is better?",
        mangaHeading: "Source manga (read right to left; click to enlarge)",
        videoA: "Video A",
        videoB: "Video B",
        replay: "Replay both",
        soundOn: "Turn sound on",
        soundOff: "Turn sound off",
        videoMissing: "Video failed to load",
        answerNote: "For each criterion, pick the better video.",
        pickA: "is better",
        pickB: "is better",
        missingAnswer: "Please answer: {c}",
        submitting: "Submitting…",
        submitError: "Submission failed. Please check your connection and press SUBMIT again.",
        doneTitle: "All done. Thank you!",
        doneBody: "Your answers have been submitted. You can close this page now.",
        doneProlific: "Your answers have been submitted. Taking you back to Prolific now. Completion code: {code}",
        doneProlificLink: "If nothing happens, click here to return to Prolific",
        crit: {
            fidelity: {
                title: "1. Visual fidelity to the manga",
                q: "In which video are the characters (hair, face, outfit, body) and the backgrounds closer to the manga?",
            },
            story: {
                title: "2. Story faithfulness",
                q: "Which video follows the manga's story (actions and emotions) more faithfully?",
            },
            coherence: {
                title: "3. Video coherence",
                q: "Which video has smoother, more coherent transitions and motion, without flicker or objects popping in and out?",
            },
            aesthetics: {
                title: "4. Visual aesthetics",
                q: "Which video looks better, including composition, color, lighting, and animation quality?",
            },
            overall: {
                title: "5. Overall preference",
                q: "Taking everything above into account, which video would you prefer as the animated version of this manga?",
            },
        },
    },
};

/* ------------------------------------------------------------------ state */

const DRAFT_STORAGE_KEY = "video_study_" + STUDY_VERSION;

// Prolific: the study URL carries ?PROLIFIC_PID=...; that ID becomes the username and the
// participant is sent back to Prolific with the completion code after submitting.
const PROLIFIC_PID = (new URLSearchParams(window.location.search).get("PROLIFIC_PID") || "").trim();
const PROLIFIC_COMPLETION_CODE = "C9UO8HGR";
const PROLIFIC_COMPLETION_URL = "https://app.prolific.com/submissions/complete?cc=" + PROLIFIC_COMPLETION_CODE;

const state = {
    page: 0,
    lang: defaultLanguage(),
    participantId: makeId(),
    username: "",
    assignmentId: "",
    assignmentSource: "",
    trials: [],          // [{ case, a, b, answers: {}, seconds: 0 }]
    sentTrials: {},      // trial index -> JSON of the last version sent
    finished: false,
};

let isBusy = false;
let trialStartedAt = null;

loadDraft();
applyProlificId();

/* ------------------------------------------------------------------ utils */

function clampInt(value, fallback, min, max) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

function makeId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function defaultLanguage() {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (fromUrl === "en" || fromUrl === "zh") return fromUrl;
    return (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
}

function t(key, vars = {}) {
    const value = key.split(".").reduce((obj, part) => obj?.[part], I18N[state.lang]);
    if (typeof value !== "string") return value;
    return value.replace(/\{(\w+)\}/g, (_, name) => (name in vars ? vars[name] : `{${name}}`));
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function shuffle(list) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function backendEnabled() {
    return typeof GAS_API_URL === "string" && /^https:\/\//.test(GAS_API_URL);
}

/* ------------------------------------------------------------------ sampler */

// ---- shared sampler (ES5; identical copy in index.js and google_apps_script.gs) ----
// counts: { "<case>|<m1>|<m2>": n } with m1 < m2 (answered + pending). Returns n trials {case, a, b}.
// Each method pair is used floor(n/P) or ceil(n/P) times (extra uses go to the least-filled pairs),
// no case repeats (n <= number of cases), and the case <-> pair-slot matching minimises the summed
// counts exactly (Hungarian algorithm), so the least-filled cells are always served first.
function sampleAssignment(n, counts, cases, methods) {
  var sorted = methods.slice().sort(), pairs = [], i, j;
  for (i = 0; i < sorted.length; i++) for (j = i + 1; j < sorted.length; j++) pairs.push([sorted[i], sorted[j]]);
  n = Math.max(1, Math.min(n, cases.length));
  function cnt(c, p) { return counts[c + "|" + p[0] + "|" + p[1]] || 0; }
  var pairOrder = pairs.map(function (p) {
    var s = 0; cases.forEach(function (c) { s += cnt(c, p); }); return { p: p, s: s + Math.random() * 1e-3 };
  }).sort(function (x, y) { return x.s - y.s; });
  var slots = [];
  for (i = 0; i < n; i++) slots.push(pairOrder[i % pairs.length].p);
  // square cost matrix: rows = cases, columns = pair slots + zero-cost dummies for unused cases
  var size = cases.length, cost = [];
  for (i = 0; i < size; i++) {
    cost.push([]);
    for (j = 0; j < size; j++) cost[i].push(j < n ? cnt(cases[i], slots[j]) + Math.random() * 1e-3 : 0);
  }
  var match = hungarian(cost), picked = [];
  for (i = 0; i < size; i++) {
    if (match[i] >= n) continue;
    var p = slots[match[i]], flip = Math.random() < 0.5;
    picked.push({ "case": cases[i], a: flip ? p[1] : p[0], b: flip ? p[0] : p[1] });
  }
  for (i = picked.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    var tmp = picked[i]; picked[i] = picked[j]; picked[j] = tmp;
  }
  return picked;
}

// Min-cost perfect matching on a square matrix; returns column index per row.
function hungarian(a) {
  var n = a.length, INF = 1e18, u = [], v = [], p = [], way = [], i, j;
  for (i = 0; i <= n; i++) { u.push(0); v.push(0); p.push(0); way.push(0); }
  for (i = 1; i <= n; i++) {
    p[0] = i;
    var j0 = 0, minv = [], used = [];
    for (j = 0; j <= n; j++) { minv.push(INF); used.push(false); }
    do {
      used[j0] = true;
      var i0 = p[j0], delta = INF, j1 = 0;
      for (j = 1; j <= n; j++) {
        if (used[j]) continue;
        var cur = a[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else { minv[j] -= delta; }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { var jw = way[j0]; p[j0] = p[jw]; j0 = jw; } while (j0);
  }
  var rowToCol = [];
  for (j = 1; j <= n; j++) rowToCol[p[j] - 1] = j - 1;
  return rowToCol;
}
// ---- end shared sampler ----

function sampleTrials(n, counts) {
    return sampleAssignment(n, counts, CASES.map(c => c.id), METHODS);
}

/* ------------------------------------------------------------------ backend */

async function requestAssignment() {
    if (backendEnabled()) {
        try {
            const url = `${GAS_API_URL}?action=assign&n=${TRIALS_PER_USER}`
                + `&pid=${encodeURIComponent(state.participantId)}`
                + `&version=${encodeURIComponent(STUDY_VERSION)}`;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), ASSIGN_TIMEOUT_MS);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            const data = await response.json();
            const valid = Array.isArray(data.trials) && data.trials.length > 0 && data.trials.every(tr =>
                CASES.some(c => c.id === tr.case) && METHODS.includes(tr.a) && METHODS.includes(tr.b) && tr.a !== tr.b);
            if (valid) {
                return { id: data.assignment_id, source: "server", trials: data.trials };
            }
            console.warn("Bad assignment response, sampling locally.", data);
        } catch (err) {
            console.warn("Assignment request failed, sampling locally.", err);
        }
    }
    return { id: "local-" + makeId(), source: "local", trials: sampleTrials(TRIALS_PER_USER, {}) };
}

function trialRow(index) {
    const trial = state.trials[index];
    const row = {
        participant_id: state.participantId,
        username: state.username,
        lang: state.lang,
        study_version: STUDY_VERSION,
        assignment_id: state.assignmentId,
        assignment_source: state.assignmentSource,
        trial_index: index + 1,
        num_trials: state.trials.length,
        case: trial.case,
        video_a: trial.a,
        video_b: trial.b,
        seconds_on_trial: Math.round(trial.seconds || 0),
    };
    CRITERIA.forEach(c => {
        const side = trial.answers[c];
        row[c] = side === "A" ? trial.a : side === "B" ? trial.b : "";
    });
    return row;
}

function postToBackend(payload) {
    if (!backendEnabled()) {
        console.log("Dry-run payload:", payload);
        return Promise.resolve();
    }
    return fetch(GAS_API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
    });
}

// Each finished trial is sent as soon as the participant moves on, so partial sessions still
// count toward coverage. The backend upserts on (participant_id, trial_index).
function sendTrial(index) {
    const row = trialRow(index);
    const fingerprint = JSON.stringify({ ...row, seconds_on_trial: 0, lang: "" });
    if (state.sentTrials[index] === fingerprint) return Promise.resolve();
    return postToBackend({ type: "trial", rows: [row] }).then(() => {
        state.sentTrials[index] = fingerprint;
        persistDraft();
    }).catch(err => console.warn("Trial upload failed; it will be resent on submit.", err));
}

/* ------------------------------------------------------------------ drafts */

function loadDraft() {
    try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (!draft || draft.finished) return;
        Object.assign(state, {
            page: Number(draft.page) || 0,
            lang: draft.lang === "en" || draft.lang === "zh" ? draft.lang : state.lang,
            participantId: draft.participantId || state.participantId,
            username: draft.username || "",
            assignmentId: draft.assignmentId || "",
            assignmentSource: draft.assignmentSource || "",
            trials: Array.isArray(draft.trials) ? draft.trials : [],
            sentTrials: draft.sentTrials || {},
        });
        if (!state.trials.length) state.page = Math.min(state.page, 1);
        state.page = Math.min(Math.max(state.page, 0), totalPages() - 1);
    } catch (err) {
        console.warn("Unable to read saved draft.", err);
    }
}

function applyProlificId() {
    if (!PROLIFIC_PID) return;
    // A saved draft from a different Prolific participant on this browser is not theirs to resume.
    if (state.username && state.username !== PROLIFIC_PID) {
        clearDraft();
        Object.assign(state, {
            page: 0, participantId: makeId(), assignmentId: "", assignmentSource: "",
            trials: [], sentTrials: {}, finished: false,
        });
    }
    state.username = PROLIFIC_PID;
}

function persistDraft() {
    try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
            ...state,
            updatedAt: new Date().toISOString(),
        }));
    } catch (err) {
        console.warn("Unable to save draft.", err);
    }
}

function clearDraft() {
    try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (err) {
        console.warn("Unable to clear draft.", err);
    }
}

/* ------------------------------------------------------------------ pages */
// 0 = welcome + name, 1 = instructions, 2.. = trials.

function totalPages() {
    return 2 + (state.trials.length || TRIALS_PER_USER);
}

function trialIndexOf(page) {
    return page >= 2 ? page - 2 : -1;
}

function render() {
    document.documentElement.lang = state.lang === "zh" ? "zh-Hant" : "en";
    document.getElementById("lang_toggle").textContent = t("langButton");
    const banner = document.getElementById("dev_banner");
    banner.hidden = backendEnabled();
    banner.textContent = t("devBanner");

    const page = state.page;
    document.body.className = page === 0 ? "welcome-page" : "study-page";
    if (page === 0) renderWelcome();
    else if (page === 1) renderIntro();
    else renderTrial(trialIndexOf(page));
    renderNavigation();
}

function renderWelcome() {
    document.getElementById("content").innerHTML = `
        <section class="panel welcome-panel">
            <h1>${t("welcomeTitle")}</h1>
            ${t("welcomeBody").map(p => `<p>${escapeHtml(p.replace("{n}", TRIALS_PER_USER))}</p>`).join("")}
            <p class="lang-hint">${t("langHint")}</p>
            ${PROLIFIC_PID ? "" : `
            <label class="field-label" for="username">${t("nameLabel")}</label>
            <input type="text" id="username" value="${escapeHtml(state.username)}"
                placeholder="${escapeHtml(t("namePlaceholder"))}" autocomplete="nickname" autofocus>`}
        </section>
    `;
    document.getElementById("username")?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            nextPage();
        }
    });
}

function renderIntro() {
    document.getElementById("content").innerHTML = `
        <section class="panel intro-panel">
            <h1>${t("introTitle")}</h1>
            ${t("introBody").map(p => `<p>${escapeHtml(p)}</p>`).join("")}
        </section>
    `;
}

function renderTrial(index) {
    const trial = state.trials[index];
    if (!trial) {
        document.getElementById("content").innerHTML = `<section class="panel"><p>${t("loadingAssign")}</p></section>`;
        return;
    }
    const caseInfo = CASES.find(c => c.id === trial.case);
    const pages = Array.from({ length: caseInfo.pages }, (_, k) => `data/manga/${trial.case}/page_manga_${k + 1}_num.jpg`);
    // Japanese reading order: page 1 on the right.
    const pageHtml = pages.map((src, k) => `
        <figure class="manga-page">
            <img src="${src}" alt="manga page ${k + 1}" onclick="openLightbox('${src}')">
        </figure>
    `).reverse().join("");

    document.getElementById("content").innerHTML = `
        <div class="trial-grid">
            <section class="manga-source">
                <h2>${t("mangaHeading")}</h2>
                <div class="manga-pages">${pageHtml}</div>
            </section>
            <section class="video-pair">
                ${["A", "B"].map(side => renderVideo(trial, side)).join("")}
                <div class="video-actions">
                    <button type="button" class="replay-button" onclick="replayVideos()">${t("replay")}</button>
                </div>
            </section>
        </div>

        <section class="question-stack" id="question_stack">
            ${CRITERIA.map(c => renderCriterion(trial, c)).join("")}
        </section>
    `;

    trialStartedAt = Date.now();
    setupVideos();
}

function renderVideo(trial, side) {
    const method = side === "A" ? trial.a : trial.b;
    return `
        <article class="video-card">
            <div class="video-label">${t(side === "A" ? "videoA" : "videoB")}</div>
            <div class="video-frame">
                <video class="study-video" data-side="${side}" src="data/videos/${trial.case}/${method}.mp4"
                    preload="auto" muted playsinline controls controlslist="nodownload noplaybackrate"
                    disablepictureinpicture></video>
                <button type="button" class="audio-button" aria-pressed="false"
                    title="${escapeHtml(t("soundOn"))}" onclick="toggleAudio(this)">🔇</button>
                <span class="video-missing">${t("videoMissing")}</span>
            </div>
        </article>
    `;
}

function renderCriterion(trial, c) {
    const choice = trial.answers[c] || "";
    return `
        <div class="criterion" id="criterion_${c}" role="radiogroup" aria-labelledby="criterion_${c}_title">
            <div class="criterion-text">
                <h3 class="criterion-title" id="criterion_${c}_title">${t(`crit.${c}.title`)}</h3>
                <p class="criterion-q">${t(`crit.${c}.q`)}</p>
            </div>
            <div class="ab-choice">
                ${["A", "B"].map(side => `
                    <label class="choice-card">
                        <input type="radio" name="crit_${c}" value="${side}" ${choice === side ? "checked" : ""}>
                        <span class="choice-letter">${side}</span>
                        <span class="choice-text">${t(side === "A" ? "pickA" : "pickB")}</span>
                    </label>
                `).join("")}
            </div>
        </div>
    `;
}

function renderProgress() {
    const box = document.getElementById("progress");
    const index = trialIndexOf(state.page);
    if (index < 0 || !state.trials.length) {
        box.innerHTML = "";
        return;
    }
    const cells = state.trials.map((trial, i) => {
        const done = CRITERIA.every(c => trial.answers[c]);
        return `<span class="progress-cell${done ? " is-done" : ""}${i === index ? " is-current" : ""}"></span>`;
    }).join("");
    box.innerHTML = `<span class="progress-cells">${cells}</span><span class="progress-count">${index + 1} / ${state.trials.length}</span>`;
}

function renderNavigation() {
    renderProgress();
    const prev = document.getElementById("prev_button");
    const next = document.getElementById("next_button");
    prev.textContent = t("prev");
    prev.style.visibility = state.page === 0 ? "hidden" : "visible";
    const last = state.trials.length > 0 && state.page === totalPages() - 1;
    next.textContent = isBusy ? t("submitting") : last ? t("submit") : t("next");
}

/* ------------------------------------------------------------------ video */

function setupVideos() {
    const videos = [...document.querySelectorAll(".study-video")];
    videos.forEach(video => {
        video.addEventListener("error", () => video.closest(".video-frame").classList.add("is-missing"));
    });
    window.setTimeout(() => playAll(videos), 150);
}

function playAll(videos) {
    videos.forEach(video => {
        video.currentTime = 0;
        const promise = video.play();
        if (promise) {
            promise.catch(() => {
                video.muted = true;
                video.play().catch(() => {});
            });
        }
    });
}

function replayVideos() {
    const videos = [...document.querySelectorAll(".study-video")];
    videos.forEach(video => video.pause());
    playAll(videos);
}

function toggleAudio(button) {
    const video = button.closest(".video-frame").querySelector("video");
    video.muted = !video.muted;
    button.textContent = video.muted ? "🔇" : "🔊";
    button.setAttribute("aria-pressed", String(!video.muted));
    button.title = video.muted ? t("soundOn") : t("soundOff");
}

/* ------------------------------------------------------------------ lightbox */

function openLightbox(src) {
    document.getElementById("lightbox_img").src = src;
    document.getElementById("lightbox").hidden = false;
}

function closeLightbox() {
    document.getElementById("lightbox").hidden = true;
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeLightbox();
});

/* ------------------------------------------------------------------ navigation */

function collectTrialTime() {
    const index = trialIndexOf(state.page);
    if (index < 0 || !state.trials[index] || trialStartedAt === null) return;
    state.trials[index].seconds = (state.trials[index].seconds || 0) + (Date.now() - trialStartedAt) / 1000;
    trialStartedAt = Date.now();
}

function validateCurrentPage() {
    if (state.page === 0) {
        if (PROLIFIC_PID) return true;
        const input = document.getElementById("username");
        state.username = input.value.trim();
        if (!state.username) {
            alert(t("nameRequired"));
            input.focus();
            return false;
        }
        return true;
    }
    const index = trialIndexOf(state.page);
    if (index < 0) return true;
    const trial = state.trials[index];
    if (!trial) return false;
    const missing = CRITERIA.find(c => !trial.answers[c]);
    if (missing) {
        alert(t("missingAnswer", { c: t(`crit.${missing}.title`) }));
        document.getElementById(`criterion_${missing}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
    }
    return true;
}

function goTo(page) {
    state.page = page;
    persistDraft();
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function prevPage() {
    if (isBusy) return;
    collectTrialTime();
    goTo(Math.max(0, state.page - 1));
}

async function nextPage() {
    if (isBusy) return;
    if (!validateCurrentPage()) return;
    collectTrialTime();

    if (state.page === 1 && !state.trials.length) {
        setBusy(true, t("loadingAssign"));
        const assignment = await requestAssignment();
        state.assignmentId = assignment.id;
        state.assignmentSource = assignment.source;
        state.trials = assignment.trials.map(tr => ({ case: tr.case, a: tr.a, b: tr.b, answers: {}, seconds: 0 }));
        setBusy(false);
    }

    const index = trialIndexOf(state.page);
    if (index >= 0) {
        if (state.page === totalPages() - 1) {
            await submitAll();
            return;
        }
        sendTrial(index);
    }
    goTo(state.page + 1);
}

function setBusy(busy, label) {
    isBusy = busy;
    const next = document.getElementById("next_button");
    next.disabled = busy;
    next.classList.toggle("is-disabled", busy);
    if (busy && label) next.textContent = label;
    if (!busy) renderNavigation();
}

async function submitAll() {
    setBusy(true, t("submitting"));
    try {
        const rows = state.trials.map((_, i) => trialRow(i));
        await postToBackend({ type: "final", rows });
        state.finished = true;
        clearDraft();
        renderDone();
    } catch (err) {
        console.error(err);
        setBusy(false);
        alert(t("submitError"));
    }
}

function renderDone() {
    document.body.className = "done-page";
    document.querySelector(".navigation-container").remove();
    document.getElementById("content").innerHTML = `
        <section class="panel done-panel">
            <h1>${t("doneTitle")}</h1>
            <p>${PROLIFIC_PID ? t("doneProlific").replace("{code}", PROLIFIC_COMPLETION_CODE) : t("doneBody")}</p>
            ${PROLIFIC_PID ? `<p><a href="${PROLIFIC_COMPLETION_URL}">${t("doneProlificLink")}</a></p>` : ""}
        </section>
    `;
    if (PROLIFIC_PID && !renderDone.redirected) {
        renderDone.redirected = true;
        setTimeout(() => { window.location.href = PROLIFIC_COMPLETION_URL; }, 2500);
    }
}

/* ------------------------------------------------------------------ events */

function toggleLanguage() {
    if (state.finished) {
        state.lang = state.lang === "zh" ? "en" : "zh";
        document.getElementById("lang_toggle").textContent = t("langButton");
        renderDone();
        return;
    }
    if (state.page === 0) {
        const input = document.getElementById("username");
        if (input) state.username = input.value.trim();
    }
    state.lang = state.lang === "zh" ? "en" : "zh";
    persistDraft();
    if (trialIndexOf(state.page) >= 0) {
        retranslateTrial();
    } else {
        render();
    }
}

// Switching language on a trial page must not restart the videos, so only the text is replaced.
function retranslateTrial() {
    const index = trialIndexOf(state.page);
    const trial = state.trials[index];
    document.documentElement.lang = state.lang === "zh" ? "zh-Hant" : "en";
    document.getElementById("lang_toggle").textContent = t("langButton");
    document.getElementById("dev_banner").textContent = t("devBanner");
    renderNavigation();
    if (!trial) return;
    const set = (selector, text) => { const el = document.querySelector(selector); if (el) el.textContent = text; };
    set(".video-actions .replay-button", t("replay"));
    set(".manga-source h2", t("mangaHeading"));
    document.querySelectorAll(".video-card").forEach((card, k) => {
        card.querySelector(".video-label").textContent = t(k === 0 ? "videoA" : "videoB");
        card.querySelector(".video-missing").textContent = t("videoMissing");
        const video = card.querySelector("video");
        card.querySelector(".audio-button").title = video.muted ? t("soundOn") : t("soundOff");
    });
    set("#answer_note", t("answerNote"));
    CRITERIA.forEach(c => {
        const box = document.getElementById(`criterion_${c}`);
        box.querySelector(".criterion-title").textContent = t(`crit.${c}.title`);
        box.querySelector(".criterion-q").textContent = t(`crit.${c}.q`);
        box.querySelectorAll(".choice-card .choice-text").forEach((span, k) => {
            span.textContent = t(k === 0 ? "pickA" : "pickB");
        });
    });
}

document.addEventListener("change", event => {
    const input = event.target;
    if (!input?.matches('input[type="radio"][name^="crit_"]')) return;
    const trial = state.trials[trialIndexOf(state.page)];
    if (!trial) return;
    trial.answers[input.name.replace("crit_", "")] = input.value;
    persistDraft();
    renderProgress();
});

document.addEventListener("input", event => {
    if (event.target?.id === "username") {
        state.username = event.target.value.trim();
        persistDraft();
    }
});

window.addEventListener("beforeunload", () => {
    collectTrialTime();
    persistDraft();
});

render();
