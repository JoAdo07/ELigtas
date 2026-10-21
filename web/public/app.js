const STORAGE_KEY = "eligtas.library.v1";
const DEFAULT_NOTE = "Public links only. Instagram may ask for a caption.";
const STORAGE_VERSION = 1;
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

const CATEGORY_META = Object.freeze({
  Cooking: { emoji: "🍳", accent: "#e8733b" },
  "Tech Tips": { emoji: "💻", accent: "#3b82f6" },
  Travel: { emoji: "✈️", accent: "#0e9aa7" },
  Fitness: { emoji: "🏋️", accent: "#e05252" },
  Beauty: { emoji: "💄", accent: "#d65a8a" },
  DIY: { emoji: "🛠️", accent: "#c9882b" },
  Education: { emoji: "🎓", accent: "#7c6bd6" },
  Entertainment: { emoji: "🎬", accent: "#b95ac9" },
  Gaming: { emoji: "🎮", accent: "#5865c9" },
  Music: { emoji: "🎵", accent: "#1f9d8b" },
  Sports: { emoji: "⚽", accent: "#2f9e57" },
  "News & Politics": { emoji: "📰", accent: "#5d6b78" },
  "Science & Nature": { emoji: "🔬", accent: "#2f8fc4" },
  "Finance & Business": { emoji: "📈", accent: "#2f8a4c" },
  "Art & Design": { emoji: "🎨", accent: "#9b5ec7" },
  "Home & Garden": { emoji: "🪴", accent: "#6c9a3f" },
  "Pets & Animals": { emoji: "🐾", accent: "#d18a2f" },
  "Parenting & Family": { emoji: "👨‍👩‍👧", accent: "#d96a76" },
  Motivation: { emoji: "🚀", accent: "#e07a2f" },
  "Health & Wellness": { emoji: "🫀", accent: "#1f9e74" },
  "ASMR & Relaxation": { emoji: "🌙", accent: "#7a7fd0" },
  "Pranks & Challenges": { emoji: "😱", accent: "#c9a227" },
  "Cars & Vehicles": { emoji: "🚗", accent: "#c94b3f" },
  "Movies & TV": { emoji: "🍿", accent: "#d24b64" },
  "Vlogs & People": { emoji: "📹", accent: "#8a63c9" },
  Other: { emoji: "📌", accent: "#8a938c" },
});

const PLATFORM_META = Object.freeze({
  youtube: { label: "YouTube" },
  tiktok: { label: "TikTok" },
  instagram: { label: "Instagram" },
});

const SOURCE_LABELS = Object.freeze({
  ai: "AI",
  local: "Offline",
  manual: "Yours",
});

const ICONS = Object.freeze({
  external: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 14v4.25A1.75 1.75 0 0 1 16.25 20H5.75A1.75 1.75 0 0 1 4 18.25V7.75A1.75 1.75 0 0 1 5.75 6H10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 7.5h15M9.5 4.5h5M7 7.5l.7 11.1a1.7 1.7 0 0 0 1.7 1.6h5.2a1.7 1.7 0 0 0 1.7-1.6l.7-11.1" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v4.5M14 11v4.5" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V21l-5-3.4L7 21V4.75Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.25 8.25h5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
});

let needsSeedSave = false;

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(1, Math.max(0, Math.round(number * 100) / 100));
}

function safeUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim()) ? value.trim() : "";
}

function textValue(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeItem(raw) {
  const item = raw && typeof raw === "object" ? raw : {};
  const platform = textValue(item.platform, 30).toLowerCase();
  return {
    id: textValue(item.id, 100) || createId(),
    title: textValue(item.title, 500),
    description: textValue(item.description, 4000),
    author: textValue(item.author, 200),
    platform: platform || "video",
    videoId: textValue(item.videoId, 200),
    canonicalUrl: safeUrl(item.canonicalUrl),
    thumbnailUrl: safeUrl(item.thumbnailUrl),
    category: textValue(item.category, 80) || "Other",
    confidence: clampConfidence(item.confidence),
    source: ["ai", "local", "manual"].includes(item.source) ? item.source : "local",
    addedAt: Number.isFinite(Number(item.addedAt)) ? Number(item.addedAt) : Date.now(),
    demo: Boolean(item.demo),
  };
}

function isValidItem(item) {
  return Boolean(item && typeof item === "object" && typeof item.title === "string" && item.title.trim());
}

function seedDemo() {
  const now = Date.now();
  const samples = [
    {
      title: "15-minute garlic butter pasta",
      description: "Quick weeknight dinner recipe from a favorite chef. Boil pasta, make a garlic butter sauce, and finish with parmesan.",
      author: "Weeknight Kitchen",
      platform: "youtube",
      category: "Cooking",
      confidence: 0.92,
    },
    {
      title: "Full-body dumbbell workout (no gym)",
      description: "A 25-minute strength workout with dumbbells: squats, rows, presses, and a short cardio finisher.",
      author: "Maya Moves",
      platform: "tiktok",
      category: "Fitness",
      confidence: 0.88,
    },
    {
      title: "Kyoto in 4 days — the perfect itinerary",
      description: "A slow travel itinerary with temples, coffee shops, a day trip, and where to stay in Kyoto.",
      author: "Slow Travel Club",
      platform: "youtube",
      category: "Travel",
      confidence: 0.95,
    },
    {
      title: "React hooks explained in 10 minutes",
      description: "A beginner-friendly coding tutorial covering useState, useEffect, and custom hooks.",
      author: "Dev Pocket",
      platform: "youtube",
      category: "Tech Tips",
      confidence: 0.9,
    },
    {
      title: "DIY floating bookshelf",
      description: "Build a minimal floating shelf with a hidden bracket, wood stain, and basic tools.",
      author: "Make It Monday",
      platform: "tiktok",
      category: "DIY",
      confidence: 0.86,
    },
    {
      title: "Morning skincare routine for dry skin",
      description: "A simple beauty routine with cleanser, serum, moisturizer, and sunscreen for dry skin.",
      author: "Glow Notes",
      platform: "instagram",
      category: "Beauty",
      confidence: 0.84,
    },
    {
      title: "Lo-fi beats to study to",
      description: "A calming music mix for focus, studying, and late-night work sessions.",
      author: "Quiet Hours",
      platform: "youtube",
      category: "Music",
      confidence: 0.93,
    },
    {
      title: "Puppy's first day home",
      description: "A tiny rescue puppy meets the family, explores the garden, and takes a very important nap.",
      author: "The Little Rescue",
      platform: "instagram",
      category: "Pets & Animals",
      confidence: 0.89,
    },
    {
      title: "How index funds actually work",
      description: "A plain-language finance explainer about index funds, fees, diversification, and long-term investing.",
      author: "Plain Money",
      platform: "youtube",
      category: "Finance & Business",
      confidence: 0.91,
    },
  ];

  return samples.map((sample, index) => ({
    id: `sample-${index + 1}`,
    ...sample,
    videoId: `sample-${index + 1}`,
    canonicalUrl: "",
    thumbnailUrl: "",
    source: "local",
    addedAt: now - (samples.length - index) * 60 * 60 * 1000,
    demo: true,
  }));
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      needsSeedSave = true;
      return seedDemo();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidItem).map(normalizeItem);
  } catch (error) {
    console.warn("[eligtas] could not read the saved library:", error);
    return [];
  }
}

function mergeCategories(source) {
  const seen = new Set();
  const merged = [];
  for (const value of [...source, ...state.items.map((item) => item.category)]) {
    if (typeof value !== "string") continue;
    const category = value.trim();
    if (!category || category === "Other" || seen.has(category)) continue;
    seen.add(category);
    merged.push(category);
  }
  merged.push("Other");
  return merged;
}

const state = {
  items: loadItems(),
  categories: ["Other"],
  filter: {
    query: "",
    category: "all",
    source: "all",
    sort: "newest",
  },
  pending: null,
  adding: false,
  status: null,
};

const els = {
  form: document.getElementById("add-form"),
  input: document.getElementById("url-input"),
  addButton: document.getElementById("add-button"),
  formNote: document.getElementById("form-note"),
  search: document.getElementById("search-input"),
  source: document.getElementById("source-filter"),
  sort: document.getElementById("sort-select"),
  grid: document.getElementById("grid"),
  empty: document.getElementById("empty"),
  categoryNav: document.getElementById("category-nav"),
  resetFilters: document.getElementById("reset-filters"),
  statTotal: document.getElementById("stat-total"),
  statCategories: document.getElementById("stat-categories"),
  statAi: document.getElementById("stat-ai"),
  statLocal: document.getElementById("stat-local"),
  demoBanner: document.getElementById("demo-banner"),
  clearDemo: document.getElementById("clear-demo"),
  clearAll: document.getElementById("clear-all"),
  exportButton: document.getElementById("export-button"),
  status: document.getElementById("ai-status"),
  statusText: document.getElementById("ai-status-text"),
  modal: document.getElementById("title-modal"),
  modalTitle: document.getElementById("modal-title"),
  modalCopy: document.getElementById("modal-copy"),
  modalVideo: document.getElementById("modal-video"),
  modalClose: document.getElementById("modal-close"),
  modalCancel: document.getElementById("modal-cancel"),
  modalSubmit: document.getElementById("modal-submit"),
  titleForm: document.getElementById("title-form"),
  manualTitle: document.getElementById("manual-title"),
  manualDescription: document.getElementById("manual-description"),
  toast: document.getElementById("toast"),
};

let toastTimer = null;
let searchTimer = null;

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "on" && value && typeof value === "object") {
      for (const [event, handler] of Object.entries(value)) {
        if (typeof handler === "function") node.addEventListener(event, handler);
      }
    } else if (key === "html") node.innerHTML = value;
    else if (value === true) node.setAttribute(key, "");
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child === undefined || child === null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function icon(name) {
  const template = document.createElement("template");
  template.innerHTML = ICONS[name] || "";
  return template.content.firstElementChild;
}

function categoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.Other;
}

function platformMeta(platform) {
  return PLATFORM_META[platform] || { label: "Video" };
}

function categoryLabel(category) {
  return category === "Other" ? "Other / uncategorized" : category;
}

function ensureCategory(category) {
  if (typeof category !== "string") return;
  const value = category.trim();
  if (!value || value === "Other" || state.categories.includes(value)) return;
  const otherIndex = state.categories.indexOf("Other");
  if (otherIndex >= 0) state.categories.splice(otherIndex, 0, value);
  else state.categories.push(value);
}

function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  } catch (error) {
    console.warn("[eligtas] could not save the library:", error);
    showToast("Couldn't save to this browser. Export your library to keep a copy.", {
      error: true,
      duration: 6000,
    });
  }
}

function setFormNote(message, isError = false) {
  els.formNote.textContent = message;
  els.formNote.classList.toggle("is-error", Boolean(isError));
}

function setAddLoading(loading) {
  state.adding = loading;
  els.addButton.disabled = loading;
  els.addButton.classList.toggle("is-loading", loading);
  els.addButton.setAttribute("aria-busy", String(loading));
}

function setModalLoading(loading) {
  els.modalSubmit.disabled = loading;
  els.modalSubmit.textContent = loading ? "Sorting…" : "Sort this video";
}

function showToast(message, { error = false, actionLabel, onAction, duration = 4200 } = {}) {
  clearTimeout(toastTimer);
  els.toast.replaceChildren(h("span", { class: "toast-message" }, message));
  if (actionLabel && typeof onAction === "function") {
    els.toast.append(
      h("button", {
        class: "toast-action",
        type: "button",
        on: {
          click: () => {
            hideToast();
            onAction();
          },
        },
      }, actionLabel),
    );
  }
  els.toast.classList.toggle("is-error", Boolean(error));
  els.toast.classList.add("is-visible");
  toastTimer = setTimeout(hideToast, duration);
}

function hideToast() {
  els.toast.classList.remove("is-visible");
}

function truncate(text, maxLength) {
  const value = String(text);
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

async function postImport(payload) {
  const response = await fetch("/api/import", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    // Keep the HTTP status as the useful part of the error.
  }
  if (!response.ok) {
    const error = new Error(data.error || `Could not import that link (HTTP ${response.status}).`);
    error.code = data.code;
    error.data = data;
    throw error;
  }
  return data;
}

function addItem(data) {
  const item = normalizeItem({ ...data, id: createId(), addedAt: Date.now(), demo: false });
  ensureCategory(item.category);
  state.items.unshift(item);
  saveItems();
  return item;
}

function findDuplicate(canonicalUrl) {
  if (!canonicalUrl) return null;
  return state.items.find((item) => item.canonicalUrl === canonicalUrl) || null;
}

function filteredItems() {
  const query = state.filter.query.trim().toLowerCase();
  const items = state.items.filter((item) => {
    if (state.filter.category !== "all" && item.category !== state.filter.category) return false;
    if (state.filter.source !== "all" && item.source !== state.filter.source) return false;
    if (!query) return true;
    const haystack = [
      item.title,
      item.author,
      item.category,
      item.description,
      platformMeta(item.platform).label,
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  return items.sort((a, b) => {
    if (state.filter.sort === "oldest") return a.addedAt - b.addedAt;
    if (state.filter.sort === "category") {
      return a.category.localeCompare(b.category) || b.addedAt - a.addedAt;
    }
    if (state.filter.sort === "confidence") {
      return b.confidence - a.confidence || b.addedAt - a.addedAt;
    }
    return b.addedAt - a.addedAt;
  });
}

function renderStats() {
  els.statTotal.textContent = String(state.items.length);
  els.statCategories.textContent = String(new Set(state.items.map((item) => item.category)).size);
  els.statAi.textContent = String(state.items.filter((item) => item.source === "ai").length);
  els.statLocal.textContent = String(state.items.filter((item) => item.source === "local").length);
}

function renderCategoryNav() {
  const counts = new Map();
  for (const item of state.items) counts.set(item.category, (counts.get(item.category) || 0) + 1);
  const categories = state.categories.length > 1 ? state.categories : mergeCategories([]);
  const scrollTop = els.categoryNav.scrollTop;
  const scrollLeft = els.categoryNav.scrollLeft;
  const fragment = document.createDocumentFragment();

  fragment.append(
    makeCategoryButton({
      category: "all",
      emoji: "✦",
      name: "All videos",
      count: state.items.length,
      active: state.filter.category === "all",
    }),
  );

  for (const category of categories) {
    fragment.append(
      makeCategoryButton({
        category,
        emoji: categoryMeta(category).emoji,
        name: categoryLabel(category),
        count: counts.get(category) || 0,
        active: state.filter.category === category,
      }),
    );
  }

  els.categoryNav.replaceChildren(fragment);
  els.categoryNav.scrollTop = scrollTop;
  els.categoryNav.scrollLeft = scrollLeft;
}

function makeCategoryButton({ category, emoji, name, count, active }) {
  return h(
    "button",
    {
      class: `category-button${active ? " is-active" : ""}${count === 0 ? " is-empty" : ""}`,
      type: "button",
      "data-category": category,
      "aria-pressed": active ? "true" : "false",
      title: count === 0 ? `No videos in ${name} yet` : `${count} video${count === 1 ? "" : "s"} in ${name}`,
    },
    h("span", { class: "cat-emoji", "aria-hidden": "true" }, emoji),
    h("span", { class: "cat-name" }, name),
    h("span", { class: "cat-count" }, String(count)),
  );
}

function renderDemoBanner() {
  els.demoBanner.hidden = !state.items.some((item) => item.demo);
}

function createCard(item, index) {
  const meta = categoryMeta(item.category);
  const platform = platformMeta(item.platform);
  const card = h("article", { class: "video-card", "data-id": item.id });
  card.style.setProperty("--accent", meta.accent);
  card.style.animationDelay = `${Math.min(index * 28, 260)}ms`;

  const media = h("div", { class: "card-media" });
  const emoji = h("span", { class: "card-emoji", "aria-hidden": "true" }, meta.emoji);
  if (item.thumbnailUrl) {
    const image = h("img", {
      src: item.thumbnailUrl,
      alt: "",
      loading: "lazy",
      decoding: "async",
      referrerpolicy: "no-referrer",
    });
    image.addEventListener("error", () => image.replaceWith(emoji), { once: true });
    media.append(image);
  } else {
    media.append(emoji);
  }

  media.append(
    h(
      "div",
      { class: "card-badge-row" },
      h(
        "span",
        { class: "card-category" },
        h("span", { class: "cat-emoji", "aria-hidden": "true" }, meta.emoji),
        item.category === "Other" ? "Uncategorized" : item.category,
      ),
      h("span", { class: "card-platform" }, platform.label),
    ),
  );

  if (item.demo) media.append(h("span", { class: "card-demo-flag" }, "Sample"));

  const titleContent = item.canonicalUrl
    ? h(
      "a",
      { href: item.canonicalUrl, target: "_blank", rel: "noreferrer" },
      item.title,
    )
    : item.title;

  const confidence = Math.round(item.confidence * 100);
  const isManual = item.source === "manual";
  const needsSort = !isManual && item.category === "Other" && confidence === 0;
  const matchLabel = isManual ? "Sorted by you" : needsSort ? "Needs a category" : `${confidence}% match`;
  const matchWidth = isManual ? 100 : confidence;

  const select = h("select", {
    class: "category-select",
    "aria-label": `Category for ${item.title}`,
    "data-action": "category",
    "data-id": item.id,
  });
  for (const category of state.categories) {
    select.append(h("option", { value: category }, categoryLabel(category)));
  }
  select.value = item.category;

  const actions = h("div", { class: "card-actions" }, select);
  if (item.canonicalUrl) {
    actions.append(
      h(
        "a",
        {
          class: "icon-button",
          href: item.canonicalUrl,
          target: "_blank",
          rel: "noreferrer",
          title: "Open original video",
          "aria-label": `Open ${item.title} on ${platform.label}`,
        },
        icon("external"),
      ),
    );
  }
  actions.append(
    h(
      "button",
      {
        class: "icon-button is-delete",
        type: "button",
        "data-action": "delete",
        "data-id": item.id,
        title: "Remove from library",
        "aria-label": `Remove ${item.title} from library`,
      },
      icon("trash"),
    ),
  );

  card.append(
    media,
    h(
      "div",
      { class: "card-body" },
      h("h3", { class: "card-title" }, titleContent),
      h(
        "div",
        { class: "card-meta" },
        h("span", { class: "meta-creator", title: item.author || platform.label }, item.author || "Saved link"),
        h("span", { class: "meta-sep", "aria-hidden": "true" }, "·"),
        h("span", {}, platform.label),
        h(
          "span",
          { class: `source-pill${item.source === "ai" ? " source-ai" : item.source === "manual" ? " source-manual" : ""}` },
          SOURCE_LABELS[item.source] || "Local",
        ),
      ),
      h(
        "div",
        { class: `match-row${needsSort ? " needs-sort" : ""}` },
        h("span", { class: "match-track", "aria-hidden": "true" }, h("span", { style: `width:${matchWidth}%` })),
        h("span", { class: "match-label" }, matchLabel),
      ),
      actions,
    ),
  );

  return card;
}

function renderGrid() {
  const items = filteredItems();
  els.grid.replaceChildren();
  if (items.length === 0) {
    els.grid.hidden = true;
    els.empty.hidden = false;
    renderEmptyState();
    return;
  }
  els.empty.hidden = true;
  els.grid.hidden = false;
  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => fragment.append(createCard(item, index)));
  els.grid.append(fragment);
}

function renderEmptyState() {
  if (state.items.length === 0) {
    els.empty.replaceChildren(
      h(
        "div",
        { class: "empty-inner" },
        h("span", { class: "empty-icon" }, icon("bookmark")),
        h("h3", {}, "Your library is empty."),
        h("p", {}, "Paste a link above to sort your first video, or load the sample library to see how it works."),
        h(
          "div",
          { class: "empty-actions" },
          h("button", { class: "btn btn-primary", type: "button", on: { click: loadSamples } }, "Load sample library"),
          h("a", { class: "btn btn-quiet", href: "#how" }, "How it works"),
        ),
      ),
    );
    return;
  }

  els.empty.replaceChildren(
    h(
      "div",
      { class: "empty-inner" },
      h("span", { class: "empty-icon" }, icon("bookmark")),
      h("h3", {}, "No videos match those filters."),
      h("p", {}, "Try a different search, category, or source."),
      h(
        "div",
        { class: "empty-actions" },
        h("button", { class: "btn btn-primary", type: "button", on: { click: () => resetFilters() } }, "Clear filters"),
      ),
    ),
  );
}

function renderAll() {
  for (const item of state.items) ensureCategory(item.category);
  renderStats();
  renderCategoryNav();
  renderDemoBanner();
  renderGrid();
}

function resetFilters(shouldRender = true) {
  state.filter = { query: "", category: "all", source: "all", sort: "newest" };
  els.search.value = "";
  els.source.value = "all";
  els.sort.value = "newest";
  if (shouldRender) renderAll();
}

function revealItem(itemId) {
  resetFilters(false);
  renderAll();
  requestAnimationFrame(() => {
    const card = els.grid.querySelector(`[data-id="${CSS.escape(itemId)}"]`);
    if (!card) return;
    card.scrollIntoView({
      behavior: REDUCED_MOTION.matches ? "auto" : "smooth",
      block: "center",
    });
    card.classList.add("is-highlight");
    setTimeout(() => card.classList.remove("is-highlight"), 1800);
  });
}

function loadSamples() {
  if (state.items.length > 0) {
    resetFilters();
    return;
  }
  state.items = seedDemo();
  for (const item of state.items) ensureCategory(item.category);
  saveItems();
  renderAll();
  showToast("Sample library loaded. Add a link to make it yours.");
}

function deleteItem(itemId) {
  const index = state.items.findIndex((item) => item.id === itemId);
  if (index < 0) return;
  const [removed] = state.items.splice(index, 1);
  saveItems();
  renderAll();
  showToast(`Removed “${truncate(removed.title, 46)}”.`, {
    actionLabel: "Undo",
    duration: 6500,
    onAction: () => {
      state.items.splice(Math.min(index, state.items.length), 0, removed);
      saveItems();
      renderAll();
      showToast("Video restored.");
    },
  });
}

function updateCategory(itemId, category) {
  const item = state.items.find((entry) => entry.id === itemId);
  if (!item || item.category === category) return;
  item.category = category;
  item.source = "manual";
  item.confidence = 1;
  ensureCategory(category);
  saveItems();
  renderAll();
  showToast(`Moved to ${categoryLabel(category)}.`);
}

function exportLibrary() {
  if (state.items.length === 0) {
    showToast("Nothing to export yet. Add a link first.", { error: true });
    return;
  }
  const payload = {
    app: "ELigtas",
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    items: state.items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `eligtas-library-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`Exported ${state.items.length} video${state.items.length === 1 ? "" : "s"}.`);
}

function clearDemo() {
  const count = state.items.filter((item) => item.demo).length;
  if (count === 0) return;
  state.items = state.items.filter((item) => !item.demo);
  saveItems();
  renderAll();
  showToast(`Cleared ${count} sample video${count === 1 ? "" : "s"}.`);
}

function clearAll() {
  if (state.items.length === 0) return;
  const confirmed = window.confirm(
    `Remove all ${state.items.length} videos from this browser? This can't be undone.`,
  );
  if (!confirmed) return;
  state.items = [];
  saveItems();
  renderAll();
  showToast("Library cleared.");
}

function openTitleModal(video, message) {
  state.pending = video;
  const platform = platformMeta(video.platform).label;
  els.modalTitle.textContent = video.platform === "instagram" ? "Instagram needs a caption." : "Add a title for this link.";
  els.modalCopy.textContent = message || "We couldn't read this link's title automatically. A title or caption gives the classifier something to work with.";
  els.modalVideo.replaceChildren(
    h("span", { class: "mini-platform" }, platform),
    h("span", {}, video.canonicalUrl || "This link"),
  );
  els.manualTitle.value = "";
  els.manualDescription.value = "";
  els.modal.hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => els.manualTitle.focus(), 40);
}

function closeModal() {
  if (els.modal.hidden) return;
  els.modal.hidden = true;
  document.body.classList.remove("modal-open");
  state.pending = null;
  els.input.focus();
}

async function handleAdd(event) {
  event.preventDefault();
  if (state.adding) return;
  const url = els.input.value.trim();
  if (!url) {
    setFormNote("Paste a video link first.", true);
    els.input.focus();
    return;
  }

  setAddLoading(true);
  setFormNote("Reading the link and choosing a category…");
  try {
    const data = await postImport({ url });
    const duplicate = findDuplicate(data.canonicalUrl);
    if (duplicate) {
      els.input.value = "";
      setFormNote(DEFAULT_NOTE);
      showToast("That link is already in your library.");
      revealItem(duplicate.id);
      return;
    }
    const item = addItem(data);
    els.input.value = "";
    setFormNote(DEFAULT_NOTE);
    revealItem(item.id);
    showToast(`Saved to ${categoryLabel(item.category)}.`);
  } catch (error) {
    if (error.code === "NEEDS_TITLE" && error.data?.video) {
      setFormNote("Add a caption to finish this one.", true);
      openTitleModal(error.data.video, error.message);
      return;
    }
    setFormNote(error.message, true);
    showToast(error.message, { error: true });
  } finally {
    setAddLoading(false);
  }
}

async function handleTitleSubmit(event) {
  event.preventDefault();
  if (!state.pending || !els.manualTitle.reportValidity()) return;
  const pending = state.pending;
  const title = els.manualTitle.value.trim();
  if (!title) {
    els.manualTitle.focus();
    return;
  }
  setModalLoading(true);
  try {
    const data = await postImport({
      url: pending.canonicalUrl,
      title,
      description: els.manualDescription.value.trim(),
    });
    const duplicate = findDuplicate(data.canonicalUrl);
    closeModal();
    if (duplicate) {
      showToast("That link is already in your library.");
      revealItem(duplicate.id);
      return;
    }
    const item = addItem(data);
    revealItem(item.id);
    showToast(`Saved to ${categoryLabel(item.category)}.`);
  } catch (error) {
    showToast(error.message, { error: true });
  } finally {
    setModalLoading(false);
  }
}

function bindEvents() {
  els.form.addEventListener("submit", handleAdd);
  els.input.addEventListener("input", () => {
    if (els.formNote.classList.contains("is-error")) setFormNote(DEFAULT_NOTE);
  });

  els.search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filter.query = els.search.value;
      renderGrid();
    }, 120);
  });

  els.source.addEventListener("change", () => {
    state.filter.source = els.source.value;
    renderGrid();
  });

  els.sort.addEventListener("change", () => {
    state.filter.sort = els.sort.value;
    renderGrid();
  });

  els.categoryNav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    state.filter.category = button.dataset.category;
    renderCategoryNav();
    renderGrid();
    const active = els.categoryNav.querySelector("button.is-active");
    if (active && window.innerWidth <= 920) {
      active.scrollIntoView({ behavior: REDUCED_MOTION.matches ? "auto" : "smooth", block: "nearest", inline: "center" });
    }
  });

  els.grid.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("button[data-action='delete']");
    if (!deleteButton) return;
    deleteItem(deleteButton.dataset.id);
  });

  els.grid.addEventListener("change", (event) => {
    const select = event.target.closest("select[data-action='category']");
    if (!select) return;
    updateCategory(select.dataset.id, select.value);
  });

  els.resetFilters.addEventListener("click", () => resetFilters());
  els.exportButton.addEventListener("click", exportLibrary);
  els.clearDemo.addEventListener("click", clearDemo);
  els.clearAll.addEventListener("click", clearAll);

  els.modalClose.addEventListener("click", closeModal);
  els.modalCancel.addEventListener("click", closeModal);
  els.modal.querySelector("[data-close-modal]").addEventListener("click", closeModal);
  els.titleForm.addEventListener("submit", handleTitleSubmit);

  els.modal.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...els.modal.querySelectorAll("button, input, textarea, select, a[href]")]
      .filter((element) => !element.disabled && element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.modal.hidden) {
      closeModal();
      return;
    }
    const target = event.target;
    const isTyping = target instanceof HTMLElement
      && (target.matches("input, textarea, select") || target.isContentEditable);
    if (!isTyping && (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k"))) {
      event.preventDefault();
      els.search.focus();
    }
  });

  document.querySelectorAll('a[href="#add-form"]').forEach((link) => {
    link.addEventListener("click", () => {
      setTimeout(() => els.input.focus(), 280);
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    if (event.newValue === null) {
      state.items = [];
    } else {
      try {
        const parsed = JSON.parse(event.newValue);
        state.items = Array.isArray(parsed) ? parsed.filter(isValidItem).map(normalizeItem) : [];
      } catch {
        return;
      }
    }
    for (const item of state.items) ensureCategory(item.category);
    renderAll();
    showToast("Library updated in another tab.");
  });
}

async function loadCategories() {
  try {
    const response = await fetch("/api/categories", { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data.categories)) return;
    state.categories = mergeCategories(data.categories);
    renderAll();
  } catch {
    // Keep the categories inferred from the current library.
  }
}

async function loadStatus() {
  try {
    const response = await fetch("/api/status", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("status request failed");
    const data = await response.json();
    state.status = data;
    const ai = Boolean(data.ai);
    els.status.classList.toggle("is-ai", ai);
    els.status.classList.toggle("is-offline", !ai);
    els.statusText.textContent = ai ? "AI ready" : "Offline sort";
    els.status.title = ai
      ? `AI classification is on (${data.model || "OpenAI-compatible"}). Falls back to offline scoring.`
      : "No API key is configured, so ELigtas uses the deterministic offline classifier.";
  } catch {
    els.status.classList.add("is-offline");
    els.statusText.textContent = "Offline sort";
    els.status.title = "Could not reach the server status endpoint. Offline scoring is the safe fallback.";
  }
}

function init() {
  for (const item of state.items) ensureCategory(item.category);
  bindEvents();
  renderAll();
  if (needsSeedSave) saveItems();
  loadCategories();
  loadStatus();
}

init();
