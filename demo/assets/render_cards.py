"""Renders the title cards and the caption bars to PNG. Usage: render_cards.py"""
import os, urllib.parse
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
DRAFT = open(f"{HERE}/demo-text.txt").read().strip()
CARDS = ["hook-1", "hook-2", "hook-3", "problem-1", "problem-2", "why-1", "why-2", "close"]
CAPTIONS = {
    "app": "This is the real app. The recording is not cut and not staged.",
    "checking": "Live: ProofPilot finds the factual claims, then checks each one against web sources.",
    "report": "<b class='g'>Green</b>: supported. <b class='r'>Red</b>: contradicted. <b class='a'>Amber</b>: unverified.",
    "contradicted": "<b class='r'>Contradicted.</b> The card shows why, with the exact passage and a link to the source.",
    "evidence": "Each excerpt was confirmed in the text of the retrieved page. Nothing is invented.",
    "unverified": "<b class='a'>Unverified.</b> No reputable source for this number, so ProofPilot does not guess.",
    "supported": "<b class='g'>Supported.</b> Transparent evidence, not blind trust.",
}

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    base = f"file://{HERE}/cards.html"
    for card in CARDS:
        page.goto(f"{base}?card={card}&draft={urllib.parse.quote(DRAFT)}")
        page.evaluate("document.fonts.ready")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"{HERE}/cards/{card}.png")
    for name, caption in CAPTIONS.items():
        page.goto(f"{base}?caption={urllib.parse.quote(caption)}")
        page.evaluate("document.fonts.ready")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"{HERE}/captions/{name}.png", omit_background=True)
    browser.close()
print("rendered", len(CARDS), "cards and", len(CAPTIONS), "captions")
