# 🛡️ Terms Guardian

> **Never blindly agree to Terms of Service again.**
> Terms Guardian is a Chrome extension that helps users understand Terms of Service and Privacy Policies without reading pages of legal jargon.
> It scans the current page, extracts the important points, generates a plain-English summary using an LLM, and gives the platform a trust rating based on potentially concerning clauses.
---

##  Features

-  **Auto-detects** Terms of Service and Privacy Policy pages
-  **AI-powered summary** — plain English, no legal jargon
-  **Trust score** out of 10 with a visual ring
-  **Flags** for key concerns: data sharing, ads, deletion rights, arbitration clauses, and more
-  **Clear recommendation** — Safe / Caution / Danger
-  Works on **any page** — not just ToS pages
-  **Bring your own API key** — works with Gemini, or swap in any LLM

---

## How it looks !!

> <img width="438" height="407" alt="image" src="https://github.com/user-attachments/assets/765763eb-94fd-4d7d-8825-b52ba15d5ded" />


---

##  Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/terms-guardian.git
cd terms-guardian
```

### 2. Get a free API key

Terms Guardian uses an AI model to analyse pages. You need to plug in an API key.

**Recommended: Google Gemini (free tier available)**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key

You can also use any other LLM that has a REST API (OpenAI, Claude, Mistral, etc.) — just update the `MODEL_URL` and adjust the request body format in `popup/popup.js`.

### 3. Configure your API key

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
API_KEY=your_actual_api_key_here
MODEL_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
```

Then open `popup/popup.js` and replace the placeholders at the top of the file:

```js
const API_KEY   = "YOUR_API_KEY_HERE";     // ← paste your key
const MODEL_URL = "YOUR_MODEL_API_URL_HERE"; // ← paste your model URL
```

> ⚠️ **Important:** Never commit your real `.env` file or API key to GitHub. The `.gitignore` already excludes `.env` for you.

### 4. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `terms-guardian` folder (the root, where `manifest.json` lives)
5. The Terms Guardian icon will appear in your extensions bar 🎉

---

##  Project Structure

```
terms-guardian/
├── manifest.json        # Chrome extension config
├── background.js        # Service worker
├── content.js           # Extracts text from the active page
├── popup/
│   ├── popup.html       # Extension popup UI
│   ├── popup.css        # Styles
│   └── popup.js        # Main logic + AI API call
├── icons/               # Extension icons (add your own)
├── .env.example         # Template — copy to .env and fill in
├── .env                 # YOUR secrets — never commit this!
├── .gitignore
└── README.md
```

---

##  Using a Different LLM

The AI call lives in `popup/popup.js` inside the `callAI()` function. To switch models:

1. Update `MODEL_URL` to your model's endpoint
2. Update the `fetch` body to match that API's request format
3. Update the response extraction to match that API's response format

For example, for **OpenAI**:
```js
body: JSON.stringify({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
  max_tokens: 800
})
// then extract: data.choices[0].message.content
```

---

## 🤝 Contributing 🤝

Pull requests are welcome! If you add support for a new LLM or improve the UI, feel free to open a PR.

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📋 Pushing to GitHub (for contributors)

When you push your fork:
- ✅ Push your code freely
- ❌ **Do NOT push your `.env` file** — it's already in `.gitignore` but double-check before `git add .`

```bash
git add .
git status          # verify .env is NOT listed
git commit -m "My changes"
git push
```

---

##  License

MIT — free to use, modify, and distribute.

---

## 🙏 Credits 🙏

Built  by Sumanyu Deshpande. Powered by [Google Gemini](https://ai.google.dev/) (or your chosen LLM).
