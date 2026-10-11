"""Records one real, uncut session of the running app (http://localhost:3000) as a frame sequence.
The pauses follow the lengths of the narration clips. The app talks to the real services.
Exit code 2 means that this take did not give the result that the narration describes.
Usage: record_app.py"""
import asyncio, base64, json, os, shutil, subprocess, sys, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = f"{HERE}/footage"
TEXT = open(f"{HERE}/demo-text.txt").read().strip()
EXPECTED = ["supported", "supported", "contradicted", "unverified"]

def clip_seconds(line_id):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{HERE}/voice/{line_id}.mp3"], text=True)
    return float(out)

CURSOR = """
(() => {
  const dot = document.createElement('div');
  dot.style.cssText = 'position:fixed;z-index:99999;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
    'background:rgba(36,120,182,.35);border:2px solid #10223d;pointer-events:none;left:-50px;top:-50px;transition:transform .12s';
  addEventListener('DOMContentLoaded', () => document.body.appendChild(dot));
  addEventListener('mousemove', (e) => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }, true);
  addEventListener('mousedown', () => { dot.style.transform = 'scale(.6)'; }, true);
  addEventListener('mouseup', () => { dot.style.transform = 'scale(1)'; }, true);
})();
"""

async def main():
    shutil.rmtree(OUT, ignore_errors=True); os.makedirs(f"{OUT}/frames")
    frames, marks = [], {}
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        await context.add_init_script(CURSOR)
        page = await context.new_page()
        await page.goto("http://localhost:3000"); await page.wait_for_load_state("networkidle")
        # A larger scale for a readable 1080p frame. The app itself is not changed.
        await page.add_style_tag(content="body { zoom: 1.35; }")
        cdp = await context.new_cdp_session(page)
        start = None

        async def on_frame(event):
            nonlocal start
            now = time.monotonic()
            if start is None: start = now
            path = f"{OUT}/frames/{len(frames):05d}.jpg"
            open(path, "wb").write(base64.b64decode(event["data"]))
            frames.append((now - start, path))
            await cdp.send("Page.screencastFrameAck", {"sessionId": event["sessionId"]})

        cdp.on("Page.screencastFrame", lambda e: asyncio.ensure_future(on_frame(e)))
        await cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 92, "everyNthFrame": 1})
        await page.mouse.move(960, 400, steps=4)
        while start is None: await asyncio.sleep(0.05)
        now = lambda: time.monotonic() - start
        async def until(t):
            while now() < t:
                await asyncio.sleep(0.05)
        async def glide(x, y): await page.mouse.move(x, y, steps=28)
        async def first_line_point(locator):
            return await locator.locator("mark").evaluate("e => { const r = e.getClientRects()[0]; return [r.left + 60, r.top + r.height / 2]; }")
        async def select(locator):
            await locator.scroll_into_view_if_needed()
            x, y = await first_line_point(locator)
            await glide(x, y); await asyncio.sleep(0.25); await page.mouse.click(x, y)
            assert await locator.get_attribute("aria-pressed") == "true", "the claim was not selected"
            await page.mouse.move(x + 14, y + 30, steps=6)

        # n06: the landing page, paste the draft, select Check claims.
        marks["n06"] = now() + 0.5
        click_at = marks["n06"] + clip_seconds("n06") - 0.4
        await asyncio.sleep(2.2)
        box = await page.get_by_label("Your AI-generated text").bounding_box()
        await glide(box["x"] + 300, box["y"] + 80); await page.mouse.click(box["x"] + 300, box["y"] + 80)
        for i in range(0, len(TEXT), 9):
            await page.keyboard.insert_text(TEXT[i:i + 9]); await asyncio.sleep(0.055)
        button = page.get_by_role("button", name="Check claims")
        await button.scroll_into_view_if_needed()
        b = await button.bounding_box()
        await asyncio.sleep(0.6); await glide(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
        await until(click_at); await page.mouse.click(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)

        # n07: the real check. Nothing is skipped: the wait is the real response time.
        marks["n07"] = now() + 0.3
        await page.mouse.move(1700, 300, steps=20)
        await page.wait_for_function("(() => { const e = document.querySelector('[data-testid=readiness-status]'); return e && e.innerText.toLowerCase() !== 'checking claims'; })()", timeout=120000)
        marks["done"] = now()
        statuses = [await e.get_attribute("data-status") for e in await page.locator("[data-claim]").all()]
        await until(marks["n07"] + clip_seconds("n07") + 0.5)

        # n08: the completed report.
        marks["n08"] = now()
        await until(marks["n08"] + clip_seconds("n08") + 0.5)

        # n09: the contradicted claim and its evidence.
        marks["n09"] = now()
        await asyncio.sleep(0.9)
        await select(page.locator("[data-status=contradicted]").first)
        await until(marks["n09"] + 6.0)
        card = page.locator("[data-testid=evidence-card]")
        c = await card.bounding_box()
        await glide(c["x"] + c["width"] / 2, min(c["y"] + 420, 960))
        for _ in range(8):
            await page.mouse.wheel(0, 30); await asyncio.sleep(0.08)
        await until(marks["n09"] + clip_seconds("n09") + 0.4)

        # n10: the source link.
        marks["n10"] = now()
        link = card.locator("a").first
        if await link.count():
            l = await link.bounding_box()
            await glide(l["x"] + 80, l["y"] + l["height"] / 2)
        await until(marks["n10"] + clip_seconds("n10") + 0.4)

        # n11: the unverified claim.
        marks["n11"] = now()
        await page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })"); await asyncio.sleep(0.9)
        await select(page.locator("[data-status=unverified]").first)
        await until(marks["n11"] + clip_seconds("n11") + 0.4)

        # n12: a supported claim.
        marks["n12"] = now()
        await asyncio.sleep(0.5)
        await select(page.locator("[data-status=supported]").first)
        await until(marks["n12"] + clip_seconds("n12") + 0.9)
        marks["end"] = now()
        await cdp.send("Page.stopScreencast"); await asyncio.sleep(0.3)
        summary = (await page.locator("section[aria-label='Publication readiness']").inner_text()).replace("\n", " ")
        await browser.close()

    json.dump({"marks": marks, "statuses": statuses, "summary": summary, "recorded": time.strftime("%Y-%m-%d %H:%M:%S %Z"),
               "frames": [[round(t, 3), os.path.basename(path)] for t, path in frames]}, open(f"{OUT}/take.json", "w"), indent=1)
    print("frames:", len(frames), "| length: %.1fs" % marks["end"], "| check took: %.1fs" % (marks["done"] - marks["n07"] + 0.3))
    print("statuses:", statuses, "|", summary[:120])
    if statuses != EXPECTED:
        print("This take does not match the narration. Record another take."); sys.exit(2)

asyncio.run(main())
