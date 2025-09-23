// js/app.js (Final Version with getRedirectResult for Maximum Compatibility)

document.addEventListener('DOMContentLoaded', () => {
    // --- FIREBASE CONFIGURATION ---
    const firebaseConfig = {
      apiKey: "AIzaSyB2RyJB4Ic3Yfro0IC_O_wyNlyNWkxMk90",
      authDomain: "lavender-lab.firebaseapp.com",
      projectId: "lavender-lab",
      storageBucket: "lavender-lab.firebasestorage.app",
      messagingSenderId: "948543864912",
      appId: "1:948543864912:web:45014ed50c0f1e2f15d155",
      measurementId: "G-D1H482BQ5M"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    // --- UI ELEMENTS ---
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const signInBtn = document.getElementById('google-signin-btn');
    const signOutBtn = document.getElementById('signout-btn');

    // --- THIS IS THE CRUCIAL FIX ---
    // This code runs as soon as the page loads. It checks if the user is
    // being redirected back from the Google sign-in page.
    auth.getRedirectResult()
      .then((result) => {
        if (result.user) {
          // User has just successfully signed in.
          // The onAuthStateChanged listener below will handle showing the app.
          console.log("Redirect sign-in successful:", result.user.displayName);
        }
      })
      .catch((error) => {
        // Handle Errors here.
        console.error("Redirect result error", error);
        alert(`Sign-in failed: ${error.message}`);
      });

    // --- AUTH STATE LISTENER (Primary UI controller) ---
    // This function runs after getRedirectResult and whenever the user's login state changes.
    auth.onAuthStateChanged(user => {
        if (user) {
            loginScreen.style.display = 'none';
            mainApp.style.display = 'block';
            setupRouter(); // Initialize the app only after login
        } else {
            loginScreen.style.display = 'flex';
            mainApp.style.display = 'none';
        }
    });

    // Event listener for the sign-in button
    signInBtn.addEventListener('click', () => {
        auth.signInWithRedirect(googleProvider);
    });

    // Event listener for the sign-out button
    signOutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    // Attach form submit listeners
    document.getElementById('yt-form').addEventListener('submit', (e) => { e.preventDefault(); getSuggestions('yt'); });
    document.getElementById('ig-form').addEventListener('submit', (e) => { e.preventDefault(); getSuggestions('ig'); });
    document.getElementById('li-form').addEventListener('submit', (e) => { e.preventDefault(); getSuggestions('li'); });
    document.getElementById('blog-form').addEventListener('submit', (e) => { e.preventDefault(); getSuggestions('blog'); });
    document.getElementById('clear-history').addEventListener('click', clearHistory);
    document.getElementById('year').textContent = new Date().getFullYear();
});

// (The rest of your code: setupRouter, getSuggestions, history functions, etc., remains exactly the same)
// ... all your other functions go here ...
function setupRouter() {
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange();
}

function handleRouteChange() {
    const hash = window.location.hash || '#home';
    const pageId = `page-${hash.substring(1)}`;
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        document.getElementById('page-home').classList.add('active');
    }
    document.querySelectorAll('.nav a').forEach(link => {
        const linkHash = link.classList.contains('brand') ? '#home' : link.getAttribute('href');
        if (linkHash === hash) {
            link.classList.add('active-link');
        } else {
            link.classList.remove('active-link');
        }
    });
    if (hash === '#history') {
        renderHistory();
    }
}

async function getSuggestions(type) {
    const user = firebase.auth().currentUser;
    if (!user) {
        showToast("Authentication error. Please sign in again.");
        return;
    }
    const token = await user.getIdToken();
    let topic = '', audience = '', tone = '', notes = '', goal = '', keywords = '', outputContainer, exportContainer, prompt;

    // Determine containers and build prompt
    if (type === 'yt') {
        topic = document.getElementById('yt-topic').value; audience = document.getElementById('yt-audience').value; tone = document.getElementById('yt-tone').value; outputContainer = document.getElementById('yt-output-container'); exportContainer = document.getElementById('yt-export-container');
        if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Please enter a topic first!</div>`; return; }
        prompt = `Generate 3 distinct YouTube video ideas for the topic: "${topic}". Audience: "${audience || 'general'}". Tone: "${tone}". For each idea, provide a title, description, and hashtags. Use "---" as a separator.`;
    } else if (type === 'ig') {
        topic = document.getElementById('ig-topic').value; goal = document.getElementById('ig-goal').value; tone = document.getElementById('ig-tone').value; outputContainer = document.getElementById('ig-output-container'); exportContainer = document.getElementById('ig-export-container');
        if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Please enter a topic first!</div>`; return; }
        prompt = `Generate 3 distinct Instagram post ideas for: "${topic}". Goal: "${goal || 'engagement'}". Tone: "${tone}". For each, provide a caption and hashtags. Use "---" as a separator.`;
    } else if (type === 'li') {
        topic = document.getElementById('li-topic').value; audience = document.getElementById('li-audience').value; tone = document.getElementById('li-tone').value; outputContainer = document.getElementById('li-output-container'); exportContainer = document.getElementById('li-export-container');
        if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Please enter a topic first!</div>`; return; }
        prompt = `Generate 2 distinct LinkedIn posts about: "${topic}". Audience: "${audience || 'professionals'}". Tone: "${tone}". For each, provide post body and hashtags. Use "---" as a separator.`;
    } else if (type === 'blog') {
        topic = document.getElementById('blog-topic').value; keywords = document.getElementById('blog-keywords').value; outputContainer = document.getElementById('blog-output-container'); exportContainer = document.getElementById('blog-export-container');
        if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Please enter a subject first!</div>`; return; }
        prompt = `Generate 3 distinct blog post ideas for: "${topic}". Keywords: "${keywords || 'not specified'}". For each, provide a title, a 3-point outline, and related keywords. Use "---" as a separator.`;
    }

    outputContainer.innerHTML = `<div class="spinner"></div>`;
    exportContainer.classList.remove('visible');
    exportContainer.innerHTML = '';

    try {
        const response = await fetch("https://lavender-lab1.onrender.com/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ prompt }),
        });
        
        outputContainer.innerHTML = '';
        if (!response.ok) { throw new Error(`Server error: ${response.statusText}`); }
        const data = await response.json();

        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const resultText = data.candidates[0].content.parts[0].text;
            const ideas = resultText.split('---').filter(idea => idea.trim() !== '');
            ideas.forEach(ideaText => renderIdeaCard(outputContainer, ideaText.trim()));
            if (ideas.length > 0) {
                const exportBtn = document.createElement('button');
                exportBtn.className = 'btn ghost';
                exportBtn.innerText = '📄 Export as .txt File';
                exportBtn.onclick = () => exportResults(type);
                exportContainer.appendChild(exportBtn);
                exportContainer.classList.add('visible');
            }
        } else {
            renderIdeaCard(outputContainer, "Sorry, I couldn't get a valid response from the AI. Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        renderIdeaCard(outputContainer, `⚠️ Error: ${error.message}. Make sure the backend server is running and accessible.`);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatIdeaText(text) {
    const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escapedText.replace(/#\w+/g, (match) => `<span class="hashtag">${match}</span>`);
}

function exportResults(type) {
    const outputContainer = document.getElementById(`${type}-output-container`);
    if (!outputContainer) return;
    const ideas = outputContainer.querySelectorAll('.idea-card > div:first-child');
    let fullText = `Lavender Lab - Generated Content\nPlatform: ${type.toUpperCase()}\nDate: ${new Date().toLocaleString()}\n\n`;
    ideas.forEach((idea, index) => {
        fullText += `--- IDEA ${index + 1} ---\n\n${idea.innerText}\n\n`;
    });
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lavender-lab-${type}-export.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Results exported!');
}

function renderIdeaCard(container, rawText, isFromHistory = false) {
    const card = document.createElement('div'); card.className = 'idea-card';
    const content = document.createElement('div'); content.innerHTML = formatIdeaText(rawText);
    const actions = document.createElement('div'); actions.className = 'idea-actions';
    const copyBtn = document.createElement('button'); copyBtn.className = 'btn small'; copyBtn.innerText = '📋 Copy';
    copyBtn.onclick = () => { navigator.clipboard.writeText(rawText); showToast('Copied to clipboard!'); };
    actions.appendChild(copyBtn);

    if (!isFromHistory) {
        const ideas = getHistory(); const isSaved = ideas.includes(rawText);
        const saveBtn = document.createElement('button'); saveBtn.className = isSaved ? 'btn small' : 'btn small primary';
        saveBtn.innerText = isSaved ? '👍 Saved' : '💾 Save'; saveBtn.disabled = isSaved;
        saveBtn.onclick = () => { saveIdeaToHistory(rawText); showToast('Idea saved to history!'); saveBtn.innerText = '👍 Saved!'; saveBtn.disabled = true; saveBtn.classList.remove('primary'); };
        actions.appendChild(saveBtn);
    } else {
        const removeBtn = document.createElement('button'); removeBtn.className = 'btn small ghost'; removeBtn.innerText = '🗑️ Remove';
        removeBtn.onclick = () => { removeIdeaFromHistory(rawText); showToast('Removed from history.'); renderHistory(); };
        actions.appendChild(removeBtn);
    }
    card.appendChild(content); card.appendChild(actions); container.appendChild(card);
}

function getHistory() { return JSON.parse(localStorage.getItem('lavenderLabHistory') || '[]'); }
function saveIdeaToHistory(ideaText) { const ideas = getHistory(); if (!ideas.includes(ideaText)) { ideas.unshift(ideaText); localStorage.setItem('lavenderLabHistory', JSON.stringify(ideas)); } }
function removeIdeaFromHistory(ideaText) { let ideas = getHistory(); ideas = ideas.filter(idea => idea !== ideaText); localStorage.setItem('lavenderLabHistory', JSON.stringify(ideas)); }
function renderHistory() { const historyContainer = document.getElementById('history-output-container'); historyContainer.innerHTML = ''; const ideas = getHistory(); if (ideas.length === 0) { historyContainer.innerHTML = `<div class="idea-card">You have no saved ideas yet.</div>`; } else { ideas.forEach(idea => renderIdeaCard(historyContainer, idea, true)); } }
function clearHistory() { if (getHistory().length === 0) { showToast("History is already empty."); return; } if (confirm('Are you sure you want to delete all your saved history?')) { localStorage.removeItem('lavenderLabHistory'); renderHistory(); showToast('All history has been cleared.'); } }