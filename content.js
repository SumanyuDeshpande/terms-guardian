// content.js — runs on every page, extracts relevant text

function extractPageText() {
  const body = document.body;
  if (!body) return { text: "", isTermsPage: false };

  // Keywords that suggest this is a ToS / Privacy page
  const termsKeywords = [
    "terms of service", "terms and conditions", "privacy policy",
    "terms of use", "user agreement", "legal agreement",
    "cookie policy", "data policy", "end user license"
  ];

  const titleText = (document.title || "").toLowerCase();
  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map(el => el.innerText.toLowerCase())
    .join(" ");

  const isTermsPage = termsKeywords.some(kw =>
    titleText.includes(kw) || headings.includes(kw)
  );

  // Extract main content, preferring <main> or <article> over entire body
  const mainEl =
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector(".terms") ||
    document.querySelector("#terms") ||
    document.querySelector(".privacy") ||
    document.querySelector("#privacy") ||
    body;

  // Walk text nodes, skip scripts/styles
  const walker = document.createTreeWalker(
    mainEl,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const tag = node.parentElement?.tagName?.toLowerCase();
        if (["script", "style", "noscript", "svg"].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.textContent.trim().length > 20
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      }
    }
  );

  const chunks = [];
  let node;
  while ((node = walker.nextNode())) {
    chunks.push(node.textContent.trim());
  }

  // Cap at ~12,000 chars to stay within API limits
  const rawText = chunks.join(" ").replace(/\s+/g, " ").trim();
  const text = rawText.slice(0, 12000);

  return { text, isTermsPage, pageTitle: document.title, url: location.href };
}

// Listen for message from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "EXTRACT_TEXT") {
    sendResponse(extractPageText());
  }
});
