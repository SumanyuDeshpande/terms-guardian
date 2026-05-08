// popup.js

// ── Config ──────────────────────────────────────────────────────────────────
// local testing ONLY.
const API_KEY   = "AIzaSyDIvA8e9_pN9w-8YcLUXC9n1kE8m0_jpgo";         
const MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";   

// ── DOM refs ────────────────────────────────────────────────────────────────
const stateIdle    = document.getElementById("stateIdle");
const stateLoading = document.getElementById("stateLoading");
const stateResult  = document.getElementById("stateResult");
const stateError   = document.getElementById("stateError");

const btnAnalyse   = document.getElementById("btnAnalyse");
const btnReset     = document.getElementById("btnReset");
const btnRetry     = document.getElementById("btnRetry");

const pageTypeBadge = document.getElementById("pageTypeBadge");
const ringFill      = document.getElementById("ringFill");
const ringScore     = document.getElementById("ringScore");
const verdictIcon   = document.getElementById("verdictIcon");
const verdictText   = document.getElementById("verdictText");
const verdictSub    = document.getElementById("verdictSub");
const flagsSection  = document.getElementById("flagsSection");
const summaryText   = document.getElementById("summaryText");
const recBox        = document.getElementById("recBox");
const recIcon       = document.getElementById("recIcon");
const recText       = document.getElementById("recText");
const errorMsg      = document.getElementById("errorMsg");

// ── State helpers ────────────────────────────────────────────────────────────
function showState(el) {
  [stateIdle, stateLoading, stateResult, stateError].forEach(s => s.classList.add("hidden"));
  el.classList.remove("hidden");
}

// ── Main flow ────────────────────────────────────────────────────────────────
btnAnalyse.addEventListener("click", runAnalysis);
btnRetry.addEventListener("click",   runAnalysis);
btnReset.addEventListener("click",   () => {
  pageTypeBadge.textContent = "—";
  pageTypeBadge.className   = "badge";
  showState(stateIdle);
});

async function runAnalysis() {
  showState(stateLoading);

  try {
    // 1. Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 2. Ask content script to extract text
    let extracted;
    try {
      extracted = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_TEXT" });
    } catch {
      // Content script not injected yet — inject it programmatically
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      extracted = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_TEXT" });
    }

    if (!extracted?.text || extracted.text.trim().length < 100) {
      throw new Error("This page doesn't seem to have enough readable text to analyse.");
    }

    // 3. Update badge
    if (extracted.isTermsPage) {
      pageTypeBadge.textContent = "Terms / Privacy";
      pageTypeBadge.className   = "badge terms";
    } else {
      pageTypeBadge.textContent = "General Page";
      pageTypeBadge.className   = "badge normal";
    }

    // 4. Call AI API
    const analysis = await callAI(extracted.text, extracted.isTermsPage, extracted.pageTitle);

    // 5. Render result
    renderResult(analysis);
    showState(stateResult);

  } catch (err) {
    errorMsg.textContent = err.message || "Something went wrong. Please try again.";
    showState(stateError);
  }
}

// ── AI call ─────────────────────────────────────────────────────────────────
async function callAI(text, isTermsPage, pageTitle) {
  const prompt = `
You are Terms Guardian — an expert at analysing Terms of Service, Privacy Policies, and any web page for user safety and fairness.

Analyse the following page content and return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:

{
  "score": <integer 1–10>,
  "verdict": "<short phrase, max 4 words>",
  "verdictSub": "<one sentence explanation>",
  "flags": [
    { "type": "good|warn|bad", "emoji": "<emoji>", "label": "<short label>" }
  ],
  "summary": "<2–4 sentence plain-English summary of what the user is agreeing to or what this page says>",
  "recommendation": "<one clear sentence: should the user sign up / proceed or not, and why>",
  "recLevel": "safe|caution|danger"
}

Scoring guide:
- 9–10: Excellent, user-friendly, transparent, no red flags
- 7–8: Good, minor issues worth noting
- 5–6: Mediocre, some concerning clauses
- 3–4: Problematic, significant data/rights concerns
- 1–2: Dangerous, predatory, or deceptive

Include 2–5 flags covering data collection, third-party sharing, deletion rights, ads, arbitration clauses, etc.

Page title: ${pageTitle || "Unknown"}
Is this a Terms/Privacy page: ${isTermsPage}
Page content (first 12,000 chars):
---
${text}
---
`;

  // ── Gemini API format (default) ──────────────────────────────────────────
  // If you switch to a different LLM, update the fetch body format below.
  const res = await fetch(`${MODEL_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}. Check your API key in .env.`);
  }

  const data = await res.json();

  // Extract text from Gemini response
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Strip possible markdown fences
  const clean = raw.replace(/```json|```/gi, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("AI returned an unexpected response. Try again.");
  }

  return parsed;
}

// ── Render result ────────────────────────────────────────────────────────────
function renderResult(data) {
  const score = Math.max(1, Math.min(10, Math.round(data.score || 5)));

  // Score ring
  const circumference = 314; // 2π × 50
  const offset = circumference - (score / 10) * circumference;
  ringFill.style.strokeDashoffset = offset;

  // Ring colour by score
  if (score >= 8)      ringFill.style.stroke = "var(--green)";
  else if (score >= 5) ringFill.style.stroke = "var(--yellow)";
  else                 ringFill.style.stroke = "var(--red)";

  ringScore.textContent = score;

  // Verdict
  const icons = { safe: "🛡️", caution: "⚡", danger: "🚨" };
  verdictIcon.textContent = icons[data.recLevel] || "🛡️";
  verdictText.textContent = data.verdict || "Analysis complete";
  verdictSub.textContent  = data.verdictSub || "";

  // Flags
  flagsSection.innerHTML = "";
  (data.flags || []).forEach(f => {
    const el = document.createElement("div");
    el.className = `flag ${f.type || "warn"}`;
    el.innerHTML = `<span>${f.emoji || "•"}</span><span>${f.label}</span>`;
    flagsSection.appendChild(el);
  });

  // Summary
  summaryText.textContent = data.summary || "No summary available.";

  // Recommendation
  recBox.className  = `rec-box ${data.recLevel || "caution"}`;
  recIcon.textContent = data.recLevel === "safe" ? "✅" : data.recLevel === "danger" ? "🚫" : "⚠️";
  recText.textContent = data.recommendation || "Proceed with caution.";
}
