// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    setupRouter();
    document.getElementById('year').textContent = new Date().getFullYear();

    // Attach form submit listeners
    document.getElementById('yt-form').addEventListener('submit', (e) => { e.preventDefault(); getSuggestions('yt'); });
    document.getElementById('ig-form').addEventListener('submit', (e) => { e.preventDefault(); getSuggestions('ig'); });
    document.getElementById('li-form').addEventListener('submit', (e) => { e.preventDefault(); getSuggestions('li'); }); // NEW
    document.getElementById('blog-form').addEventListener('submit', (e) => { e.preventDefault(); getSuggestions('blog'); }); // NEW

    // Attach clear history button listener
    document.getElementById('clear-history').addEventListener('click', clearHistory);
});

// --- ROUTER LOGIC ---
function setupRouter() {
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange();
}

function handleRouteChange() {
    const hash = window.location.hash || '#home';
    const pageId = `page-${hash.substring(1)}`;

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    else document.getElementById('page-home').classList.add('active');

    document.querySelectorAll('.nav a').forEach(link => {
        const linkHash = link.classList.contains('brand') ? '#home' : link.getAttribute('href');
        if (linkHash === hash) link.classList.add('active-link');
        else link.classList.remove('active-link');
    });
    
    if (hash === '#history') {
        renderHistory();
    }
}

// --- API CALL LOGIC ---
async function getSuggestions(type) {
    let topic, audience, tone, notes, goal, keywords, outputContainer, prompt;

    // Determine the type and get the correct inputs and output container
    if (type === 'yt') {
        topic = document.getElementById('yt-topic').value;
        audience = document.getElementById('yt-audience').value;
        tone = document.getElementById('yt-tone').value;
        notes = document.getElementById('yt-notes').value;
        outputContainer = document.getElementById('yt-output-container');
        if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Please enter a topic first!</div>`; return; }
        prompt = `Generate 3 distinct YouTube video ideas for the topic: "${topic}". The target audience is: "${audience || 'a general audience'}". The tone is: "${tone}". Additional constraints: "${notes || 'None'}". For each idea, provide a catchy title, a short description, and 5 hashtags. Use "---" as a separator between each distinct idea.`;
    
    } else if (type === 'ig') {
        topic = document.getElementById('ig-topic').value;
        goal = document.getElementById('ig-goal').value;
        tone = document.getElementById('ig-tone').value;
        notes = document.getElementById('ig-notes').value;
        outputContainer = document.getElementById('ig-output-container');
        if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Please enter a topic first!</div>`; return; }
        prompt = `Generate 3 distinct Instagram post ideas for the theme: "${topic}". The main goal is: "${goal || 'engagement'}". The tone is: "${tone}". Additional constraints: "${notes || 'None'}". For each idea, provide a creative caption and 5 hashtags. Use "---" as a separator between each distinct idea.`;
    
    } else if (type === 'li') { // NEW: LinkedIn Logic
        topic = document.getElementById('li-topic').value;
        audience = document.getElementById('li-audience').value;
        tone = document.getElementById('li-tone').value;
        outputContainer = document.getElementById('li-output-container');
        if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Please enter a topic first!</div>`; return; }
        prompt = `Generate 2 distinct LinkedIn post ideas about: "${topic}". The target audience is: "${audience || 'professionals in the industry'}". The tone should be: "${tone}". For each idea, provide a compelling post body that encourages discussion and includes 3-4 relevant business hashtags. Use "---" as a separator between each distinct idea.`;

    } else if (type === 'blog') { // NEW: Blog Post Logic
        topic = document.getElementById('blog-topic').value;
        keywords = document.getElementById('blog-keywords').value;
        outputContainer = document.getElementById('blog-output-container');
        if (!topic) { outputContainer.innerHTML = `<div class="idea-card">⚠️ Please enter a core subject first!</div>`; return; }
        prompt = `Generate 3 distinct blog post ideas based on the subject: "${topic}". The target SEO keywords are: "${keywords || 'not specified'}". For each idea, provide a catchy, SEO-friendly title, a 3-point outline for the blog post, and a list of 5 related SEO keywords. Use "---" as a separator between each distinct idea.`;
    }

    // Show loading spinner
    outputContainer.innerHTML = `<div class="spinner"></div>`;

    try {
        const response = await fetch("https://lavender-lab1.onrender.com/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
        });
        const data = await response.json();
        
        outputContainer.innerHTML = ''; // Clear spinner

        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const resultText = data.candidates[0].content.parts[0].text;
            const ideas = resultText.split('---').filter(idea => idea.trim() !== '');
            ideas.forEach(ideaText => {
                renderIdeaCard(outputContainer, ideaText.trim());
            });
        } else {
            let errorMessage = "Sorry, I couldn't get a response. Please try again.";
            if (data.error) errorMessage = `Error from API: ${data.error.message || data.error}`;
            renderIdeaCard(outputContainer, errorMessage);
        }
    } catch (error) {
        console.error("Error:", error);
        renderIdeaCard(outputContainer, "⚠️ Failed to fetch suggestions. Make sure your backend server is running!");
    }
}

// --- RENDER, HISTORY, AND UTILITY FUNCTIONS ---
function renderIdeaCard(container, text, isFromHistory = false) {
    const card = document.createElement('div');
    card.className = 'idea-card';
    
    const content = document.createElement('div');
    content.innerText = text;

    const actions = document.createElement('div');
    actions.className = 'idea-actions';

    // Copy Button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn small';
    copyBtn.innerText = '📋 Copy';
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(text);
        copyBtn.innerText = '✅ Copied!';
        setTimeout(() => { copyBtn.innerText = '📋 Copy'; }, 2000);
    };
    actions.appendChild(copyBtn);

    // Save/Unsave Button Logic
    const ideas = getHistory();
    const isSaved = ideas.includes(text);

    if (!isFromHistory) {
        const saveBtn = document.createElement('button');
        saveBtn.className = isSaved ? 'btn small' : 'btn small primary';
        saveBtn.innerText = isSaved ? '👍 Saved' : '💾 Save';
        saveBtn.disabled = isSaved;
        saveBtn.onclick = () => {
            saveIdeaToHistory(text);
            saveBtn.innerText = '👍 Saved!';
            saveBtn.disabled = true;
            saveBtn.classList.remove('primary');
        };
        actions.appendChild(saveBtn);
    } else {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn small ghost';
        removeBtn.innerText = '🗑️ Remove';
        removeBtn.onclick = () => {
            removeIdeaFromHistory(text);
            renderHistory();
        };
        actions.appendChild(removeBtn);
    }
    
    card.appendChild(content);
    card.appendChild(actions);
    container.appendChild(card);
}

function renderHistory() {
    const historyContainer = document.getElementById('history-output-container');
    historyContainer.innerHTML = '';
    const ideas = getHistory();
    if (ideas.length === 0) {
        historyContainer.innerHTML = `<div class="idea-card">You have no saved ideas yet. Save ideas from the generators.</div>`;
    } else {
        ideas.forEach(idea => renderIdeaCard(historyContainer, idea, true));
    }
}

function getHistory() {
    return JSON.parse(localStorage.getItem('lavenderLabHistory') || '[]');
}

function saveIdeaToHistory(ideaText) {
    const ideas = getHistory();
    if (!ideas.includes(ideaText)) {
        ideas.unshift(ideaText);
        localStorage.setItem('lavenderLabHistory', JSON.stringify(ideas));
    }
}

function removeIdeaFromHistory(ideaText) {
    let ideas = getHistory();
    ideas = ideas.filter(idea => idea !== ideaText);
    localStorage.setItem('lavenderLabHistory', JSON.stringify(ideas));
}

function clearHistory() {
    if (confirm('Are you sure you want to delete all your saved history? This cannot be undone.')) {
        localStorage.removeItem('lavenderLabHistory');
        renderHistory();
    }
}