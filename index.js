const CASE_FOLDERS = [
    "dualjustice1",
    "dualjustice2",
    "elf2",
    "elf3",
    "goblin",
    "kick",
    "lovehina",
    "mado",
];

const MANGA_PAGE_FILES = ["page1.jpg", "page2.jpg", "page3.jpg"];
const MANGA_FOLDER_NAMES = {
    dualjustice2: "DualJustice2",
};

const PART1_BASELINES = [
    { value: "ours", label: "Ours", file: "ours.png" },
    { value: "animaker", label: "AniMaker", file: "animaker.png" },
    { value: "storydiffusion", label: "StoryDiffusion", file: "storydiffusion.png" },
    { value: "storyiter", label: "StoryIter", file: "storyiter.png" },
    { value: "anystory", label: "AnyStory", file: "anystory.png" },
];

const PART2_BASELINES = [
    { value: "ours", label: "Ours", file: "ours.mp4" },
    { value: "animaker", label: "AniMaker", file: "animaker.mp4" },
    { value: "vimax", label: "Vimax", file: "vimax.mp4" },
    { value: "storymem", label: "StoryMem", file: "storymem.mp4" },
];

const PART1_ASPECTS = [
    {
        key: "character_identity",
        title: "Character Identity Preservation",
        description: "評估分鏡中的角色是否能維持原始漫畫或角色參考圖中的外觀特徵，例如髮型、臉部特徵、服裝、體型與整體角色辨識度。若角色在分鏡中仍然容易被辨認為同一位角色，則代表此項表現較佳。",
        question: "請問哪一個分鏡符合 Character Identity Preservation?",
    },
    {
        key: "manga_plot",
        title: "Manga Plot Consistency",
        description: "評估分鏡是否忠實呈現原始漫畫分鏡中的劇情流程與場景關係，包括角色互動、動作順序、情緒表現與事件發展。若分鏡能讓觀眾清楚理解原漫畫想表達的情節，則代表此項表現較佳。",
        question: "請問哪一個分鏡符合 Manga Plot Consistency?",
    },
    {
        key: "absence_ai_hallucination",
        title: "Absence of AI Hallucination",
        description: "評估分鏡中是否出現不合理或與原始漫畫無關的內容，例如多餘的角色、錯誤的物件、場景突然改變、角色外觀異常、肢體扭曲或不符合劇情的動作。若分鏡較少出現這類 AI 生成錯誤，則代表此項表現較佳。",
        question: "請問哪一個分鏡符合 Absence of AI Hallucination?",
    },
    {
        key: "overall_performance",
        title: "Overall Performance",
        description: "綜合評估分鏡的整體品質，包括角色一致性、劇情連貫性、畫面自然度與觀看體驗。請根據您的整體感受，選出您認為品質較好的分鏡。",
        question: "請問哪一個分鏡符合 Overall Performance?",
    },
];

const PART2_ASPECTS = [
    {
        key: "character_identity",
        title: "Character Identity Preservation",
        description: "評估影片中的角色是否能維持原始漫畫或角色參考圖中的外觀特徵，例如髮型、臉部特徵、服裝、體型與整體角色辨識度。若角色在動畫中仍然容易被辨認為同一位角色，則代表此項表現較佳。",
        question: "請問哪一個影片符合 Character Identity Preservation?",
    },
    {
        key: "manga_plot",
        title: "Manga Plot Consistency",
        description: "評估影片是否忠實呈現原始漫畫分鏡中的劇情流程與場景關係，包括角色互動、動作順序、情緒表現與事件發展。若影片能讓觀眾清楚理解原漫畫想表達的情節，則代表此項表現較佳。",
        question: "請問哪一個影片符合 Manga Plot Consistency?",
    },
    {
        key: "absence_ai_hallucination",
        title: "Absence of AI Hallucination",
        description: "評估影片中是否出現不合理或與原始漫畫無關的內容，例如多餘的角色、錯誤的物件、場景突然改變、角色外觀異常、肢體扭曲或不符合劇情的動作。若影片較少出現這類 AI 生成錯誤，則代表此項表現較佳。",
        question: "請問哪一個影片符合 Absence of AI Hallucination?",
    },
    {
        key: "visual_comfort_consistency",
        title: "Visual Comfort & Consistency",
        description: "評估影片播放是否流暢，動作自然、無明顯閃爍或跳動，且畫面風格與角色外觀從頭到尾一致，沒有突兀的轉變。",
        question: "哪一個影片在流暢度與風格一致性上表現最佳?",
    },
    {
        key: "overall_performance",
        title: "Overall Performance",
        description: "綜合評估影片的整體品質，包括角色一致性、劇情連貫性、畫面自然度、動畫流暢度、聲音帶給您的感受與觀看體驗。請根據您的整體感受，選出您認為品質較好的影片。",
        question: "請問哪一個影片符合 Overall Performance?",
    },
];

const PARTS = [
    {
        key: "part1",
        label: "Part 1",
        kind: "image",
        introTitle: "Storyboard Evaluation",
        introBody: [
            "接下來你會看到 8 個 storyboard 題組。每一個題組中會有 5 張分鏡結果，以 Option A 到 Option E 表示。",
            "請針對每一組 storyboard，分別依照四個面向作答：Character Identity Preservation、Manga Plot Consistency、Absence of AI Hallucination、Overall Performance。每一個面向都請從看到的 5 張分鏡中，選出最符合該面向的一張。",
            "每題都是單選，請依照你第一眼與整體觀看後的判斷作答。",
        ],
        options: PART1_BASELINES,
        aspects: PART1_ASPECTS,
    },
    {
        key: "part2",
        label: "Part 2",
        kind: "video",
        introTitle: "Video Evaluation",
        introBody: [
            "接下來你會看到 8 個影片題組。每一個題組中會有 4 支影片，以 Option A 到 Option D 表示。",
            "請針對每一組影片，分別依照五個面向作答：Character Identity Preservation、Manga Plot Consistency、Absence of AI Hallucination、Visual Comfort & Consistency、Overall Performance。",
            "進入題目後，四支影片會嘗試自動同時播放一次。影片播完後會停在結尾；若想再看一次，請點選 Replay all videos，四支影片會一起從頭播放。",
        ],
        options: PART2_BASELINES,
        aspects: PART2_ASPECTS,
    },
];

function shuffleOptions(options) {
    const shuffled = [...options];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
}

PARTS.forEach(part => {
    part.groups = CASE_FOLDERS.map((folder, index) => ({
        id: folder,
        title: `Question ${index + 1}`,
        setNumber: index + 1,
        data: shuffleOptions(part.options.map(option => ({
            ...option,
            url: `data/${part.key}/${folder}/${option.file}`,
        }))),
        answers: {},
    }));
});

let now = 0;
let isSubmitting = false;
const data_list = {
    username: "",
    part1: PARTS[0].groups,
    part2: PARTS[1].groups,
};

function getTotalPages() {
    return PARTS.reduce((total, part) => total + 1 + part.groups.length, 0);
}

function getPageInfo(pageNumber) {
    if (pageNumber === 0) return { type: "username" };

    let cursor = 1;
    for (const part of PARTS) {
        if (pageNumber === cursor) return { type: "intro", part };
        cursor += 1;

        const groupIndex = pageNumber - cursor;
        if (groupIndex >= 0 && groupIndex < part.groups.length) {
            return { type: "question", part, group: part.groups[groupIndex], groupIndex };
        }
        cursor += part.groups.length;
    }

    return null;
}

function prevPage() {
    savePageData({ requireComplete: false });
    now = Math.max(0, now - 1);
    renderObjects(now);
}

function nextPage() {
    if (isSubmitting) return;
    if (!savePageData({ requireComplete: true })) return;

    if (now === getTotalPages()) {
        submitData();
        return;
    }

    now += 1;
    renderObjects(now);
}

function savePageData({ requireComplete }) {
    const pageInfo = getPageInfo(now);
    if (!pageInfo) return false;

    if (pageInfo.type === "username") {
        const username = document.getElementById("username");
        const value = username?.value.trim() || "";
        if (requireComplete && value === "") {
            alert("Please enter a username.");
            username?.focus();
            return false;
        }
        data_list.username = value;
        return true;
    }

    if (pageInfo.type === "intro") return true;

    let firstMissing = null;
    pageInfo.part.aspects.forEach(aspect => {
        const selected = document.querySelector(`input[name="${pageInfo.part.key}_${aspect.key}"]:checked`);
        if (selected) {
            pageInfo.group.answers[aspect.key] = selected.value;
        } else if (!firstMissing) {
            firstMissing = aspect;
        }
    });

    if (requireComplete && firstMissing) {
        alert(`Please answer: ${firstMissing.title}.`);
        document.getElementById(`question-${firstMissing.key}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
        return false;
    }

    return true;
}

function submitData() {
    isSubmitting = true;
    setNextButtonState(false);

    const payload = {
        username: data_list.username,
        timestamp: new Date().toISOString(),
        part1: buildPartRows(PARTS[0]),
        part2: buildPartRows(PARTS[1]),
    };

    if (!GAS_API_URL || GAS_API_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
        console.log("Mock Submit Payload:", payload);
        renderSuccessPage();
        return;
    }

    fetch(GAS_API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        },
    }).then(() => {
        renderSuccessPage();
    }).catch(err => {
        isSubmitting = false;
        setNextButtonState(true);
        alert("Error submitting. Please try again.");
        console.error(err);
    });
}

function buildPartRows(part) {
    return part.groups.map(group => {
        const row = {
            username: data_list.username,
            anime: group.id,
        };

        part.aspects.forEach(aspect => {
            row[aspect.key] = group.answers[aspect.key] || "";
        });

        return row;
    });
}

function setNextButtonState(enabled) {
    const nextButton = document.getElementById("next_button");
    if (!nextButton) return;
    nextButton.disabled = !enabled;
    nextButton.classList.toggle("is-disabled", !enabled);
}

function renderObjects(pageNumber) {
    const pageInfo = getPageInfo(pageNumber);
    document.body.className = pageInfo?.type === "username" ? "username-page" : "study-page";

    if (pageInfo?.type === "username") {
        renderUsernamePage();
    } else if (pageInfo?.type === "intro") {
        renderIntroPage(pageInfo.part);
    } else if (pageInfo?.type === "question") {
        renderQuestionPage(pageInfo.part, pageInfo.group);
    }

    renderNavigation(pageNumber);
}

function renderUsernamePage() {
    document.getElementById("images").innerHTML = "";
    document.getElementById("questions").innerHTML = `
        <section class="username-panel">
            <h1>User Study</h1>
            <label class="field-label" for="username">Username</label>
            <input
                type="text"
                id="username"
                value="${escapeHtml(data_list.username)}"
                autocomplete="name"
                autofocus
            >
        </section>
    `;

    document.getElementById("username")?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            nextPage();
        }
    });
}

function renderIntroPage(part) {
    document.getElementById("images").innerHTML = "";
    document.getElementById("questions").innerHTML = `
        <section class="intro-panel">
            <p class="eyebrow">${part.label}</p>
            <h1>${part.introTitle}</h1>
            ${part.introBody.map(text => `<p>${text}</p>`).join("")}
        </section>
    `;
}

function renderQuestionPage(part, group) {
    document.getElementById("images").innerHTML = `
        <header class="study-header">
            <div>
                <p class="eyebrow">${part.label}</p>
                <h1>${group.title}</h1>
            </div>
            <p class="header-note">Please select exactly one best result for each criterion.</p>
        </header>
        ${renderMangaSource(group)}
        ${part.kind === "video" ? `
            <div class="media-actions">
                <p class="video-wait-note">Please wait until all videos have loaded, then click 'Replay all videos' to watch.</p>
                <button type="button" class="replay-button" onclick="replayPart2Videos()">Replay all videos</button>
            </div>
        ` : ""}
        <section class="candidate-gallery ${part.kind === "video" ? "video-gallery" : ""}" aria-label="${group.title} candidate ${part.kind}s">
            ${group.data.map((candidate, index) => renderCandidateCard(candidate, index, part.kind)).join("")}
        </section>
    `;

    document.getElementById("questions").innerHTML = `
        <div class="question-layout">
            <section class="question-stack">
                ${part.aspects.map(aspect => renderAspectQuestion(part, group, aspect)).join("")}
            </section>
        </div>
    `;

    if (part.kind === "video") {
        window.setTimeout(playCurrentVideos, 100);
    }
}

function renderMangaSource(group) {
    const mangaFolder = MANGA_FOLDER_NAMES[group.id] || group.id;
    const pages = MANGA_PAGE_FILES.map((file, index) => `
        <figure class="manga-page">
            <img
                src="data/manga/${mangaFolder}/${file}"
                alt="${group.title} Manga Source Page ${index + 1}"
                onload="this.closest('.manga-source').classList.add('has-page')"
                onerror="const section = this.closest('.manga-source'); this.closest('.manga-page').remove(); updateMangaSourceVisibility(section)"
            >
            <figcaption>Page ${index + 1}</figcaption>
        </figure>
    `).join("");

    return `
        <section class="manga-source" aria-label="${group.title} Manga Source">
            <h2>Manga Source</h2>
            <div class="manga-pages">${pages}</div>
        </section>
    `;
}

function updateMangaSourceVisibility(section) {
    if (section && !section.querySelector(".manga-page")) {
        section.remove();
    }
}

function renderCandidateCard(candidate, index, kind) {
    const label = `Option ${String.fromCharCode(65 + index)}`;
    return `
        <article class="candidate-card">
            <div class="candidate-meta">
                <strong>${label}</strong>
            </div>
            <div class="candidate-image-frame ${kind === "video" ? "candidate-video-frame" : ""}">
                ${kind === "video" ? `
                    <video
                        class="part2-video"
                        src="${candidate.url}"
                        preload="auto"
                        muted
                        playsinline
                        onerror="const frame = this.closest('.candidate-image-frame'); frame.classList.add('image-missing'); this.remove(); frame.querySelector('.video-audio-button')?.remove();"
                    ></video>
                    <button
                        type="button"
                        class="video-audio-button"
                        aria-label="Turn sound on for ${label}"
                        aria-pressed="false"
                        title="Turn sound on"
                        onclick="toggleCandidateAudio(this)"
                    >🔇</button>
                ` : `
                    <img
                        src="${candidate.url}"
                        alt="${label}"
                        onerror="this.closest('.candidate-image-frame').classList.add('image-missing'); this.remove();"
                    >
                `}
                <span class="missing-image-text">Missing ${kind}</span>
            </div>
        </article>
    `;
}

function renderAspectQuestion(part, group, aspect) {
    return `
        <fieldset class="aspect-question" id="question-${aspect.key}">
            <legend>${aspect.title}</legend>
            <div class="question-instruction">
                <p>${aspect.description}</p>
                ${aspect.question ? `<p class="question-prompt">${aspect.question}</p>` : ""}
                ${aspect.criteria ? `
                    <ul>
                        ${aspect.criteria.map(item => `<li>${item}</li>`).join("")}
                    </ul>
                ` : ""}
            </div>
            <div class="option-grid ${part.kind === "video" ? "video-option-grid" : ""}">
                ${group.data.map((candidate, index) => {
                    const optionLabel = `Option ${String.fromCharCode(65 + index)}`;
                    const checked = group.answers[aspect.key] === candidate.value ? "checked" : "";
                    return `
                        <label class="choice-card">
                            <input type="radio" name="${part.key}_${aspect.key}" value="${candidate.value}" ${checked}>
                            <span>${optionLabel}</span>
                        </label>
                    `;
                }).join("")}
            </div>
        </fieldset>
    `;
}

function playCurrentVideos() {
    document.querySelectorAll(".part2-video").forEach(video => {
        video.currentTime = 0;
        if (video.dataset.audioEnabled !== "true") {
            video.muted = true;
        }
        const playPromise = video.play();
        if (playPromise) {
            playPromise.catch(() => {
                video.muted = true;
                video.play().catch(() => {});
            });
        }
    });
}

function replayPart2Videos() {
    document.querySelectorAll(".part2-video").forEach(video => {
        video.pause();
        video.currentTime = 0;
    });
    playCurrentVideos();
}

function toggleCandidateAudio(button) {
    const video = button.closest(".candidate-video-frame")?.querySelector(".part2-video");
    if (!video) return;

    video.muted = !video.muted;
    video.dataset.audioEnabled = String(!video.muted);
    button.textContent = video.muted ? "🔇" : "🔊";
    button.setAttribute("aria-pressed", String(!video.muted));
    button.setAttribute("title", video.muted ? "Turn sound on" : "Turn sound off");
    button.setAttribute(
        "aria-label",
        `${video.muted ? "Turn sound on" : "Turn sound off"} for this video`
    );
}

function renderNavigation(pageNumber) {
    const prevButton = document.getElementById("prev_button");
    const nextButton = document.getElementById("next_button");
    const pageLabel = document.getElementById("num_page");

    prevButton.style.visibility = pageNumber === 0 ? "hidden" : "visible";
    nextButton.textContent = pageNumber === getTotalPages() ? "SUBMIT" : "NEXT";
    pageLabel.textContent = `${pageNumber}/${getTotalPages()}`;
}

function renderSuccessPage() {
    document.body.className = "success-page";
    document.body.innerHTML = `
        <main class="success-panel">
            <h1>Submitted Successfully</h1>
            <p>Thank you for participating in this user study.</p>
        </main>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
