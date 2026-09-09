const BASELINES = [
    { value: "ours", label: "Ours", file: "ours.png" },
    { value: "animaker", label: "AniMaker", file: "animaker.png" },
    { value: "storydiffusion", label: "StoryDiffusion", file: "storydiffusion.png" },
    { value: "storyiter", label: "StoryIter", file: "storyiter.png" },
    { value: "anystory", label: "AnyStory", file: "anystory.png" },
];

const STORYBOARD_CASES = [
    "dualjustice1",
    "dualjustice2",
    "elf2",
    "elf3",
    "goblin",
    "kick",
    "lovehina",
    "mado",
];

const STORYBOARD_GROUPS = STORYBOARD_CASES.map((groupId, index) => {
    return {
        id: groupId,
        title: `Question ${index + 1}`,
        setNumber: index + 1,
        data: BASELINES.map(baseline => ({
            ...baseline,
            url: `data/part1/${groupId}/${baseline.file}`,
        })),
        answers: {},
    };
});

const ASPECTS = [
    {
        key: "character_identity",
        title: "Character Identity Preservation",
        description: "請判斷哪一張分鏡最能維持角色身份一致性。",
        criteria: [
            "同一角色在不同畫格中應保有穩定的臉部特徵、髮型、服裝與主要辨識特徵。",
            "若角色身份混淆、外觀突然變成另一個人，或重要配件消失，請降低評價。",
            "請優先比較角色是否可被持續辨認，而不是單張圖片是否最好看。",
        ],
    },
    {
        key: "manga_plot",
        title: "Manga Plot Consistency",
        description: "請判斷哪一張分鏡最符合故事情節與畫格之間的連續性。",
        criteria: [
            "分鏡內容應符合題目故事，角色行動、事件順序與場景轉換要合理。",
            "若出現劇情斷裂、動作不連續、關鍵事件缺漏或畫格彼此矛盾，請降低評價。",
            "請依整組分鏡的敘事完整度作答，而不是只看其中一格。",
        ],
    },
    {
        key: "visual_quality",
        title: "Visual Quality",
        description: "請判斷哪一張分鏡整體視覺品質最好。",
        criteria: [
            "請考量構圖、線條清晰度、畫面完成度、細節合理性與是否有明顯生成瑕疵。",
            "若有扭曲、破碎、文字雜訊、不自然肢體或難以理解的畫面，請降低評價。",
            "此面向著重圖像品質，不需要把劇情或角色一致性作為主要判斷。",
        ],
    },
    {
        key: "overall_performance",
        title: "Overall Performance",
        description: "請綜合所有面向，選出整體表現最好的分鏡。",
        criteria: [
            "請同時考量角色一致性、故事連續性、漫畫感、構圖與整體可讀性。",
            "若某方法在單一面向很好，但整體分鏡不穩定，請以整體使用感受作為最後判斷。",
            "請選出你認為最適合作為該組最終輸出的結果。",
        ],
    },
];

let now = 0;
let isSubmitting = false;
const data_list = {
    username: "",
    part1: STORYBOARD_GROUPS,
};

function getTotalPages() {
    return STORYBOARD_GROUPS.length + 1;
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
    if (now === 0) {
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

    if (now === 1) return true;

    const group = STORYBOARD_GROUPS[now - 2];
    let firstMissing = null;

    ASPECTS.forEach(aspect => {
        const selected = document.querySelector(`input[name="${aspect.key}"]:checked`);
        if (selected) {
            group.answers[aspect.key] = selected.value;
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
        user_id: data_list.username,
        timestamp: new Date().toISOString(),
    };

    STORYBOARD_GROUPS.forEach((group, index) => {
        const qName = `Part1_G${String(index + 1).padStart(2, "0")}`;
        payload[`${qName}_case`] = group.id;

        ASPECTS.forEach(aspect => {
            payload[`${qName}_${aspect.key}`] = group.answers[aspect.key] || "";
        });
    });

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

function setNextButtonState(enabled) {
    const nextButton = document.getElementById("next_button");
    if (!nextButton) return;
    nextButton.disabled = !enabled;
    nextButton.classList.toggle("is-disabled", !enabled);
}

function renderObjects(pageNumber) {
    document.body.className = pageNumber === 0 ? "username-page" : "study-page";

    if (pageNumber === 0) {
        renderUsernamePage();
    } else if (pageNumber === 1) {
        renderPart1IntroPage();
    } else {
        renderStoryboardPage(STORYBOARD_GROUPS[pageNumber - 2], pageNumber);
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

function renderPart1IntroPage() {
    document.getElementById("images").innerHTML = "";
    document.getElementById("questions").innerHTML = `
        <section class="intro-panel">
            <p class="eyebrow">Part 1</p>
            <h1>Storyboard Evaluation</h1>
            <p>
                接下來你會看到 8 個 storyboard 題組。每一個題組中會有 5 張分鏡結果，以 Option A 到 Option E 表示。
            </p>
            <p>
                請針對每一組 storyboard，分別依照四個面向作答：Character Identity Preservation、Manga Plot Consistency、Visual Quality、Overall Performance。
                每一個面向都請從看到的 5 張分鏡中，選出最符合該面向的一張。
            </p>
            <p>
                每題都是單選，請依照你第一眼與整體觀看後的判斷作答。
            </p>
        </section>
    `;
}

function renderStoryboardPage(group, pageNumber) {
    document.getElementById("images").innerHTML = `
        <header class="study-header">
            <div>
                <h1>${group.title}</h1>
            </div>
            <p class="header-note">Please select exactly one best result for each criterion.</p>
        </header>
        <section class="candidate-gallery" aria-label="${group.title} candidate images">
            ${group.data.map((candidate, index) => renderCandidateCard(candidate, index)).join("")}
        </section>
    `;

    document.getElementById("questions").innerHTML = `
        <div class="question-layout">
            <section class="question-stack">
                ${ASPECTS.map(aspect => renderAspectQuestion(group, aspect)).join("")}
            </section>
        </div>
    `;
}

function renderCandidateCard(candidate, index) {
    const label = `Option ${String.fromCharCode(65 + index)}`;
    return `
        <article class="candidate-card">
            <div class="candidate-meta">
                <strong>${label}</strong>
            </div>
            <div class="candidate-image-frame">
                <img
                    src="${candidate.url}"
                    alt="${label}"
                    onerror="this.closest('.candidate-image-frame').classList.add('image-missing'); this.remove();"
                >
                <span class="missing-image-text">Missing image</span>
            </div>
        </article>
    `;
}

function renderAspectQuestion(group, aspect) {
    return `
        <fieldset class="aspect-question" id="question-${aspect.key}">
            <legend>${aspect.title}</legend>
            <div class="question-instruction">
                <p>${aspect.description}</p>
                <ul>
                    ${aspect.criteria.map(item => `<li>${item}</li>`).join("")}
                </ul>
            </div>
            <div class="option-grid">
                ${group.data.map((candidate, index) => {
                    const optionLabel = `Option ${String.fromCharCode(65 + index)}`;
                    const checked = group.answers[aspect.key] === candidate.value ? "checked" : "";
                    return `
                        <label class="choice-card">
                            <input type="radio" name="${aspect.key}" value="${candidate.value}" ${checked}>
                            <span>${optionLabel}</span>
                        </label>
                    `;
                }).join("")}
            </div>
        </fieldset>
    `;
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
