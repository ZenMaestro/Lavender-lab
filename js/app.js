document.addEventListener("DOMContentLoaded", async () => {
  // Wait for Clerk to load
  await Clerk.load();

  const mainApp = document.getElementById("main-app");
  const authSection = document.getElementById("auth-section");
  const signOutBtn = document.getElementById("signout-btn");

  // Initial state: check if logged in
  if (Clerk.user) {
    showMainApp();
  } else {
    Clerk.mountSignIn(authSection, { fallbackRedirectUrl: "/" });
  }

  // React to login/logout
  Clerk.addListener(({ user }) => {
    if (user) {
      showMainApp();
    } else {
      mainApp.style.display = "none";
      authSection.innerHTML = "";
      Clerk.mountSignIn(authSection, { fallbackRedirectUrl: "/" });
    }
  });

  function showMainApp() {
    authSection.innerHTML = `
      <div class="user-bar">
        Welcome, ${Clerk.user.firstName || "User"} 👋
        <button id="signout-btn" class="btn small ghost">Sign Out</button>
      </div>
    `;
    document.getElementById("signout-btn").onclick = () => Clerk.signOut();
    mainApp.style.display = "block";
    setupRouter();
  }

  // Attach form listeners
  document.getElementById("yt-form").addEventListener("submit", (e) => { e.preventDefault(); getSuggestions("yt"); });
  document.getElementById("ig-form").addEventListener("submit", (e) => { e.preventDefault(); getSuggestions("ig"); });
  document.getElementById("li-form").addEventListener("submit", (e) => { e.preventDefault(); getSuggestions("li"); });
  document.getElementById("blog-form").addEventListener("submit", (e) => { e.preventDefault(); getSuggestions("blog"); });
  document.getElementById("clear-history").addEventListener("click", clearHistory);
  document.getElementById("year").textContent = new Date().getFullYear();
});

// --- Router ---
function setupRouter() {
  window.addEventListener("hashchange", handleRouteChange);
  handleRouteChange();
}

function handleRouteChange() {
  const hash = window.location.hash || "#home";
  const pageId = `page-${hash.substring(1)}`;
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add("active");
  else document.getElementById("page-home").classList.add("active");

  if (hash === "#history") {
    renderHistory();
  }
}

// --- Generate Suggestions ---
async function getSuggestions(type) {
  const token = await Clerk.session.getToken(); // ✅ Clerk JWT
  if (!token) {
    showToast("Authentication error. Please sign in again.");
    return;
  }

  let topic = "", audience = "", tone = "", goal = "", keywords = "",
      outputContainer, exportContainer, prompt;

  if (type === "yt") {
    topic = document.getElementById("yt-topic").value;
    audience = document.getElementById("yt-audience").value;
    tone = document.getElementById("yt-tone").value;
    outputContainer = document.getElementById("yt-output-container");
    exportContainer = document.getElementById("yt-export-container");
    if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Enter a topic first!</div>`; return; }
    prompt = `Generate 3 YouTube ideas for "${topic}". Audience: "${audience || "general"}". Tone: "${tone}". Provide title, description, hashtags. Use "---" as a separator.`;
  } else if (type === "ig") {
    topic = document.getElementById("ig-topic").value;
    goal = document.getElementById("ig-goal").value;
    tone = document.getElementById("ig-tone").value;
    outputContainer = document.getElementById("ig-output-container");
    exportContainer = document.getElementById("ig-export-container");
    if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Enter a theme first!</div>`; return; }
    prompt = `Generate 3 Instagram post ideas for "${topic}". Goal: "${goal || "engagement"}". Tone: "${tone}". Provide caption and hashtags. Use "---" as a separator.`;
  } else if (type === "li") {
    topic = document.getElementById("li-topic").value;
    audience = document.getElementById("li-audience").value;
    tone = document.getElementById("li-tone").value;
    outputContainer = document.getElementById("li-output-container");
    exportContainer = document.getElementById("li-export-container");
    if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Enter a topic first!</div>`; return; }
    prompt = `Generate 2 LinkedIn posts about "${topic}". Audience: "${audience || "professionals"}". Tone: "${tone}". Provide post text and hashtags. Use "---" as a separator.`;
  } else if (type === "blog") {
    topic = document.getElementById("blog-topic").value;
    keywords = document.getElementById("blog-keywords").value;
    outputContainer = document.getElementById("blog-output-container");
    exportContainer = document.getElementById("blog-export-container");
    if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Enter a subject first!</div>`; return; }
    prompt = `Generate 3 blog post ideas about "${topic}". Keywords: "${keywords || "none"}". Provide title, short outline, and SEO keywords. Use "---" as a separator.`;
  }

  outputContainer.innerHTML = `<div class="spinner"></div>`;
  exportContainer.classList.remove("visible");
  exportContainer.innerHTML = "";

  try {
    const response = await fetch("https://lavender-lab1.onrender.com/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ prompt }),
    });

    outputContainer.innerHTML = "";
    if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
    const data = await response.json();

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const resultText = data.candidates[0].content.parts[0].text;
      const ideas = resultText.split("---").filter(idea => idea.trim() !== "");
      ideas.forEach(ideaText => renderIdeaCard(outputContainer, ideaText.trim()));

      if (ideas.length > 0) {
        const exportBtn = document.createElement("button");
        exportBtn.className = "btn ghost";
        exportBtn.innerText = "📄 Export";
        exportBtn.onclick = () => exportResults(type);
        exportContainer.appendChild(exportBtn);
        exportContainer.classList.add("visible");
      }
    } else {
      renderIdeaCard(outputContainer, "⚠️ No valid response from AI.");
    }
  } catch (error) {
    console.error("Error:", error);
    renderIdeaCard(outputContainer, `⚠️ Error: ${error.message}`);
  }
}

// --- Helpers ---
function showToast(message) {
  const toast = document.getElementById("toast-notification");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function renderIdeaCard(container, rawText, isFromHistory = false) {
  const card = document.createElement("div"); card.className = "idea-card";
  const content = document.createElement("div"); content.innerText = rawText;
  const actions = document.createElement("div"); actions.className = "idea-actions";
  const copyBtn = document.createElement("button"); copyBtn.className = "btn small"; copyBtn.innerText = "📋 Copy";
  copyBtn.onclick = () => { navigator.clipboard.writeText(rawText); showToast("Copied!"); };
  actions.appendChild(copyBtn);

  if (!isFromHistory) {
    const ideas = getHistory(); const isSaved = ideas.includes(rawText);
    const saveBtn = document.createElement("button"); saveBtn.className = isSaved ? "btn small" : "btn small primary";
    saveBtn.innerText = isSaved ? "👍 Saved" : "💾 Save"; saveBtn.disabled = isSaved;
    saveBtn.onclick = () => { saveIdeaToHistory(rawText); showToast("Saved!"); saveBtn.innerText = "👍 Saved"; saveBtn.disabled = true; saveBtn.classList.remove("primary"); };
    actions.appendChild(saveBtn);
  } else {
    const removeBtn = document.createElement("button"); removeBtn.className = "btn small ghost"; removeBtn.innerText = "🗑️ Remove";
    removeBtn.onclick = () => { removeIdeaFromHistory(rawText); showToast("Removed"); renderHistory(); };
    actions.appendChild(removeBtn);
  }
  card.appendChild(content); card.appendChild(actions); container.appendChild(card);
}

function getHistory() { return JSON.parse(localStorage.getItem("lavenderLabHistory") || "[]"); }
function saveIdeaToHistory(ideaText) { const ideas = getHistory(); if (!ideas.includes(ideaText)) { ideas.unshift(ideaText); localStorage.setItem("lavenderLabHistory", JSON.stringify(ideas)); } }
function removeIdeaFromHistory(ideaText) { let ideas = getHistory(); ideas = ideas.filter(idea => idea !== ideaText); localStorage.setItem("lavenderLabHistory", JSON.stringify(ideas)); }
function renderHistory() { const container = document.getElementById("history-output-container"); container.innerHTML = ""; const ideas = getHistory(); if (ideas.length === 0) { container.innerHTML = `<div class="idea-card">You have no saved ideas yet.</div>`; } else { ideas.forEach(idea => renderIdeaCard(container, idea, true)); } }
function clearHistory() { if (getHistory().length === 0) { showToast("History is already empty."); return; } if (confirm("Delete all history?")) { localStorage.removeItem("lavenderLabHistory"); renderHistory(); showToast("All history cleared."); } }
