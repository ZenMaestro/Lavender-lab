// js/app.js

document.addEventListener('DOMContentLoaded', () => {
  setupRouter();
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('yt-form').addEventListener('submit', (e) => { e.preventDefault(); getSuggestions('yt'); });
  document.getElementById('ig-form').addEventListener('submit', (e) => { e.preventDefault(); getSuggestions('ig'); });
  document.getElementById('yt-clear').addEventListener('click', () => { document.getElementById('yt-form').reset(); document.getElementById('yt-output').innerText = ''; });
  document.getElementById('ig-clear').addEventListener('click', () => { document.getElementById('ig-form').reset(); document.getElementById('ig-output').innerText = ''; });
});

// --- UPDATED ROUTER LOGIC ---
function setupRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange(); // Handle initial load
}

function handleRouteChange() {
  // Default to #home if hash is empty
  const hash = window.location.hash || '#home';
  const pageId = `page-${hash.substring(1)}`;

  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show the target page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  } else {
    // Fallback to home page if hash is invalid
    document.getElementById('page-home').classList.add('active');
  }

  // Update active state on navigation links
  document.querySelectorAll('.nav a').forEach(link => {
    // Handle the special case for the brand link to #home
    const linkHash = link.classList.contains('brand') ? '#home' : link.getAttribute('href');
    if (linkHash === hash) {
      link.classList.add('active-link');
    } else {
      link.classList.remove('active-link');
    }
  });
}

// --- API CALL LOGIC (no changes needed) ---
async function getSuggestions(type) {
  let topic, audience, tone, notes, goal, outputBox, prompt;

  if (type === 'yt') {
    topic = document.getElementById('yt-topic').value;
    audience = document.getElementById('yt-audience').value;
    tone = document.getElementById('yt-tone').value;
    notes = document.getElementById('yt-notes').value;
    outputBox = document.getElementById('yt-output');

    if (!topic) {
      outputBox.innerText = "⚠️ Please enter a topic first!";
      return;
    }
    
    prompt = `Generate 3 YouTube video ideas for the topic: "${topic}".
    - The target audience is: "${audience || 'a general audience'}".
    - The desired tone is: "${tone}".
    - Additional constraints: "${notes || 'None'}".
    For each idea, provide a catchy title, a short, compelling description, and 5 relevant hashtags. Format it clearly.`;

  } else if (type === 'ig') {
    topic = document.getElementById('ig-topic').value;
    goal = document.getElementById('ig-goal').value;
    tone = document.getElementById('ig-tone').value;
    notes = document.getElementById('ig-notes').value;
    outputBox = document.getElementById('ig-output');

    if (!topic) {
      outputBox.innerText = "⚠️ Please enter a topic first!";
      return;
    }

    prompt = `Generate 3 Instagram post ideas for the theme: "${topic}".
    - The main goal of the post is: "${goal || 'engagement'}".
    - The desired tone is: "${tone}".
    - Additional constraints: "${notes || 'None'}".
    For each idea, provide a creative caption, a call-to-action, and 5 relevant hashtags. Format it clearly.`;
  }

  outputBox.innerText = "🧠 Generating ideas...";

  try {
    // ==========================================================
    // THIS IS THE IMPORTANT CHANGE
    // ==========================================================
    const response = await fetch("https://lavender-lab-backend.onrender.com/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      outputBox.innerText = data.candidates[0].content.parts[0].text;
    } else {
      let errorMessage = "Sorry, I couldn't get a response. Please try again.";
      if (data.error) {
        errorMessage = `Error from API: ${data.error.message || data.error}`;
      }
      outputBox.innerText = errorMessage;
    }

  } catch (error) {
    console.error("Error:", error);
    outputBox.innerText = "⚠️ Failed to fetch suggestions. Make sure your backend server is running!";
  }
}