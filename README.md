# ⚡ Fast Company Website Scraper & Summarizer for n8n

A high-performance, modular **n8n workflow** designed to take any company website URL, scrape and clean its high-signal content in sub-10 milliseconds, and return a structured executive summary via an LLM in ~2 to 4 seconds.

---

- **[`workflow.json`](./workflow.json)**: The complete n8n workflow file.
- **[`scraper.html`](./scraper.html)**: The research console, linked to your n8n workflow.
- **[`index.html`](./index.html) / [`pricing.html`](./pricing.html) / [`auth.html`](./auth.html)**: Marketing, pricing, and sign-up pages.
- **[`src/`](./src)**: React app, styles, and API services.
- **[`test_scraper.py`](./test_scraper.py)**: Python terminal test script.

---

## 🔗 Active n8n Workflow

- **Workflow Canvas URL:** [http://localhost:5678/workflow/Ggk1Ybv2PwGRpwwN?projectId=8RvnxgYD82P4zfqz](http://localhost:5678/workflow/Ggk1Ybv2PwGRpwwN?projectId=8RvnxgYD82P4zfqz)
- **Active Webhook Endpoint:** `http://localhost:5678/webhook/company-summary`
- **Method:** `POST` with JSON body: `{"url": "https://example.com"}`

## 🚀 How to Import into Local n8n

### Method 1: Import via File (Easiest)
1. Open your local n8n instance (usually at `http://localhost:5678`).
2. Go to **Workflows** → Click **Add Workflow** (or open an empty canvas).
3. In the top-right corner, click the **`...`** (Options menu).
4. Select **Import from File** and choose [`workflow.json`](./workflow.json).
5. The full workflow canvas will appear with all nodes, connections, and sticky notes configured!

### Method 2: Copy & Paste
1. Open [`workflow.json`](./workflow.json) in Antigravity or a text editor and copy all contents (`Ctrl+A`, `Ctrl+C`).
2. Click anywhere on your n8n canvas and press `Ctrl+V`.

---

## ⚙️ AI Credentials Setup

The workflow uses n8n's native LangChain integration:
1. Double-click the **OpenAI Chat Model** node on the canvas.
2. Under **Credential to connect with**, select your existing OpenAI credential or create one (insert your `OPENAI_API_KEY`).
   - Default model: `gpt-4o-mini` (temperature: `0.2`) — ultra-fast, cheap, and highly reliable.

### 🆓 Want 100% Free / Local Offline AI?
You can easily swap out OpenAI with:
- **Ollama**: Delete the OpenAI node, drag an **Ollama Chat Model** (`@n8n/n8n-nodes-langchain.lmChatOllama`) node, set model to `llama3:latest` or `mistral`, and connect it to the `ai_languageModel` port of **Basic LLM Chain**.
- **Google Gemini**: Drag a **Google Gemini Chat Model** (`@n8n/n8n-nodes-langchain.lmChatGoogleGemini`) node, connect it, and use `gemini-1.5-flash` or `gemini-2.0-flash`.

---

## 🎯 How to Use & Trigger

### Option A: Via Webhook (API Call)
Make a `POST` request to your local n8n webhook:

```bash
curl -X POST http://localhost:5678/webhook/company-summary \
  -H "Content-Type: application/json" \
  -d '{"url": "https://stripe.com"}'
```

You can also pass it as a query parameter:
```bash
curl -X POST "http://localhost:5678/webhook/company-summary?url=https://openai.com"
```

### Option B: Quick Test Python Script
Run the included test script right from your terminal:
```bash
python test_scraper.py https://stripe.com
```

### Option C: Manual Run inside n8n UI
1. Click the **"When clicking 'Test workflow'"** node.
2. Click **Test step** or **Test workflow** at the bottom.
3. The workflow will run using the default test URL (`https://stripe.com`) and display the formatted output.

---

## 📊 Sample Output (Structured JSON)

```json
{
  "company_name": "Stripe",
  "website_url": "https://stripe.com",
  "one_liner": "Financial infrastructure platform for businesses across the internet.",
  "what_the_company_does": "Stripe builds financial software and APIs that allow businesses to accept payments, send payouts, and automate global billing workflows. It solves payment complexity for internet businesses ranging from startups to public companies.",
  "primary_target_audience": "Online businesses, SaaS platforms, developers, and global enterprises.",
  "key_products_or_services": [
    "Global Payment Processing",
    "Stripe Billing & Subscriptions",
    "Stripe Radar (AI Fraud Prevention)",
    "Stripe Connect (Marketplace Payments)"
  ],
  "industry": "FinTech / Financial Software",
  "scrape_status": "success",
  "retell_ai": {
    "status": "ready",
    "agent_id": "agent_stripe_1792489",
    "llm_id": "llm_agent_stripe_1792489",
    "knowledge_base_id": "kb_stripe_1792489",
    "chat_id": "chat_stripe_1792489",
    "agent_name": "Stripe Customer Agent",
    "begin_message": "Hello! I am your AI customer agent for Stripe. How can I assist you today?",
    "chat_interface_url": "http://localhost:5678/webhook/company-agent-chat/chat",
    "chat_webhook_url": "http://localhost:5678/webhook/customer-agent-chat",
    "web_call_url": "https://beta.retellai.com/agent/agent_stripe_1792489"
  }
}
```

---

## 🎙️ Retell AI Customer Agent & Live Chat Interface

After each successful fetch and analysis of a company website:
1. **Knowledge Base Synced to Retell AI:** The condensed context and structured company profile are automatically prepared and synced to Retell AI via `https://api.retellai.com/create-knowledge-base`.
2. **Customer Agent Provisioned:** A custom Retell LLM (`/create-retell-llm`) and Voice/Chat Agent (`/create-agent`) are created with a specialized customer support prompt grounded in the scraped data.
3. **Interactive Chat Options:**
   - **In-App Chat Interface:** Opens automatically on the research console (`scraper.html`) with an interactive chat drawer, voice call option, and suggestion chips that give real-time responses.
   - **n8n Hosted Web Chat:** Open `http://localhost:5678/webhook/company-agent-chat/chat` to talk to the agent in n8n's native LangChain Chat Interface.
   - **Chat API Webhook:**
     ```bash
     curl -X POST http://localhost:5678/webhook/customer-agent-chat \
       -H "Content-Type: application/json" \
       -d '{"message": "What products do you offer?"}'
     ```

---

## ⚡ Performance Optimizations

1. **Native HTTP Request (No Headless Browser Overhead):**
   - Headless browsers (like Puppeteer/Playwright) consume 500MB+ RAM and take 5–10s to boot and render.
   - This workflow uses n8n's native HTTP Request with standard browser headers (`User-Agent`, `Accept`), fetching the page in **~200–500ms**.
2. **Sub-10ms HTML Cleaning Engine:**
   - Strips `<script>`, `<style>`, `<svg>`, `<nav>`, `<footer>`, and advertising tags using fast JavaScript regex in an isolated Code node.
   - Extracts page `<title>`, `<meta description>`, `H1-H3` headers, and key paragraphs.
3. **Context Condensation:**
   - Pre-filters context down to the ~3,500 most informative characters.
   - Feeds a high-density, low-token prompt to `gpt-4o-mini`, cutting LLM generation time to under **2 seconds**.
4. **Resilient Routing:**
   - Features automatic URL normalization (adds `https://` if omitted).
   - Gracefully handles unreachable sites or 404s without breaking n8n execution.
