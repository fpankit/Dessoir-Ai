"""
Test client for locally hosted n8n Company Scraper & Summarizer workflow.
Works with Python standard library (no pip packages needed).

Linked Workflow:
    http://localhost:5678/workflow/Ggk1Ybv2PwGRpwwN?projectId=8RvnxgYD82P4zfqz

Usage:
    python test_scraper.py https://stripe.com
    python test_scraper.py https://anthropic.com
    python test_scraper.py https://github.com
"""

import os
import sys
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# n8n default webhook endpoints (local instance)
N8N_BASE_URL = os.environ.get("N8N_BASE_URL", "http://localhost:5678").rstrip("/")
TEST_WEBHOOK_URL = f"{N8N_BASE_URL}/webhook-test/company-summary"
PROD_WEBHOOK_URL = f"{N8N_BASE_URL}/webhook/company-summary"
WORKFLOW_UI_URL = f"{N8N_BASE_URL}/workflow/Ggk1Ybv2PwGRpwwN?projectId=8RvnxgYD82P4zfqz"

def test_company_scraper(target_url: str):
    print("\n" + "=" * 60)
    print("[*] Testing Company Scraper & Summarizer")
    print(f"[*] Target Website: {target_url}")
    print(f"[*] Linked n8n Workflow: {WORKFLOW_UI_URL}")
    print("=" * 60 + "\n")

    shared_secret = os.environ.get("N8N_SHARED_SECRET", "").strip()
    if not shared_secret:
        print("[-] N8N_SHARED_SECRET is not set. Export the same value configured in n8n, then retry.")
        return False

    payload = json.dumps({"url": target_url}).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "x-shared-secret": shared_secret
    }

    endpoints = [
        ("Production Webhook", PROD_WEBHOOK_URL),
        ("Test Webhook", TEST_WEBHOOK_URL)
    ]

    last_error = None
    for label, url in endpoints:
        print(f"-> Sending request to {label} ({url})...")
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                status_code = resp.getcode()
                response_text = resp.read().decode("utf-8")
                
                print(f"[+] Success! (HTTP {status_code})\n")
                try:
                    data = json.loads(response_text)
                    print(json.dumps(data, indent=2))
                    
                    if "company_name" in data:
                        print("\n" + "-" * 30 + " Quick Summary " + "-" * 30)
                        print(f"Company:  {data.get('company_name')}")
                        print(f"One-Liner:{data.get('one_liner')}")
                        print(f"Summary:  {data.get('what_the_company_does')}")
                        print(f"Audience: {data.get('primary_target_audience')}")
                        print(f"Industry: {data.get('industry')}")
                        retell = data.get("retell_ai", {})
                        if retell:
                            print("\n" + "-" * 26 + " Retell AI Customer Agent " + "-" * 26)
                            print(f"Status:         {retell.get('status')}")
                            print(f"Agent ID:       {retell.get('agent_id')}")
                            print(f"Knowledge Base: {retell.get('knowledge_base_id')}")
                            print(f"Chat Web UI:    {retell.get('chat_interface_url')}")
                            print(f"Chat Webhook:   {retell.get('chat_webhook_url')}")
                        print("-" * 75 + "\n")
                except json.JSONDecodeError:
                    print(response_text)
                return
        except urllib.error.HTTPError as e:
            body = ""
            try:
                body = e.read().decode("utf-8")
            except Exception:
                pass
            last_error = f"HTTP Error {e.code}: {e.reason}"
            if e.code == 404:
                print(f"[!] {label} not listening on this endpoint. Trying alternative...\n")
            elif e.code == 500:
                print(f"[!] {label} returned HTTP 500: {body}")
                print("\n[i] Diagnosis:")
                print("    The n8n workflow reached the AI model, but the AI provider (e.g. OpenAI) returned an error.")
                print(f"    Open your workflow in n8n to inspect credentials: {WORKFLOW_UI_URL}")
                print("    (Note: If OpenAI has no credits remaining, you can switch to OpenRouter or local Ollama)\n")
                return
            else:
                print(f"[-] {label} error: {last_error}\n")
        except urllib.error.URLError as e:
            last_error = f"Connection failed: {e.reason}"
            print(f"[-] Could not connect to {label}. Is n8n running on http://localhost:5678? ({last_error})\n")

    print("\n[!] Could not complete request to n8n webhook.")
    print("Quick checklist:")
    print(" 1. Ensure n8n is running locally (http://localhost:5678)")
    print(f" 2. Open workflow: {WORKFLOW_UI_URL}")
    print(" 3. Verify workflow is switched to 'Active' (top-right toggle)")

if __name__ == "__main__":
    url_to_test = sys.argv[1] if len(sys.argv) > 1 else "https://stripe.com"
    test_company_scraper(url_to_test)
