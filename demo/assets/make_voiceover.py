"""Generates one narration clip for each line in narration.json with ElevenLabs.
Needs ELEVENLABS_API_KEY in the environment. Each run uses account credits.
Usage: make_voiceover.py [line-id ...]   (no ids = all lines that have no clip yet)"""
import json, os, subprocess, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2"  # Alice, British English, female (premade voice)
MODEL = "eleven_multilingual_v2"
lines = json.load(open(f"{HERE}/narration.json"))
wanted = set(sys.argv[1:])

for index, line in enumerate(lines):
    out = f"{HERE}/voice/{line['id']}.mp3"
    if (wanted and line["id"] not in wanted) or (not wanted and os.path.exists(out)):
        continue
    body = {
        "text": line["text"],
        "model_id": MODEL,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.15, "use_speaker_boost": True},
        "previous_text": lines[index - 1]["text"] if index > 0 else None,
        "next_text": lines[index + 1]["text"] if index + 1 < len(lines) else None,
    }
    request = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128",
        data=json.dumps(body).encode(),
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        open(out, "wb").write(response.read())
    seconds = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], text=True
    ).strip()
    print(line["id"], f"{float(seconds):.2f}s", line["text"][:60])
