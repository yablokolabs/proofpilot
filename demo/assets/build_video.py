"""Assembles demo/proofpilot-demo.mp4 from the title cards, the recorded app session, and the narration.
Run render_cards.py, make_voiceover.py, and record_app.py first. Fails if the result is 180 s or longer.
Usage: build_video.py"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = f"{HERE}/build"; os.makedirs(BUILD, exist_ok=True)
OUT = os.path.normpath(f"{HERE}/../proofpilot-demo.mp4")
FPS, FADE, LEAD, TAIL = 30, 0.4, 0.5, 0.7
lines = json.load(open(f"{HERE}/narration.json"))
take = json.load(open(f"{HERE}/footage/take.json"))
marks = take["marks"]

def run(args):
    result = subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args], capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(result.stderr[-2000:])

def seconds(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], text=True))

VOICE = {line["id"]: seconds(f"{HERE}/voice/{line['id']}.mp3") for line in lines}
ENCODE = ["-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p"]

# 1. The app session: real frames at their real times, with the caption bars.
frames = take["frames"]
with open(f"{BUILD}/frames.txt", "w") as listing:
    for index, (at, name) in enumerate(frames):
        until = frames[index + 1][0] if index + 1 < len(frames) else marks["end"]
        listing.write(f"file '{HERE}/footage/frames/{name}'\nduration {max(until - at, 0.001):.3f}\n")
    listing.write(f"file '{HERE}/footage/frames/{frames[-1][1]}'\n")
caption_order = [line for line in lines if line["scene"] in ("app", "checking", "report", "contradicted", "evidence", "unverified", "supported")]
inputs, chain, last = ["-f", "concat", "-safe", "0", "-i", f"{BUILD}/frames.txt"], [f"[0:v]fps={FPS},scale=1920:1080,format=yuv420p[v0]"], "v0"
for index, line in enumerate(caption_order):
    # In these scenes the narration starts a moment before the click, so the bar waits for the click.
    lag = lambda l: 1.7 if l["scene"] in ("contradicted", "unverified", "supported") else 0.0
    start = marks[line["id"]] + lag(line)
    following = caption_order[index + 1] if index + 1 < len(caption_order) else None
    end = marks[following["id"]] + lag(following) if following else marks["end"]
    inputs += ["-i", f"{HERE}/captions/{line['scene']}.png"]
    chain.append(f"[{last}][{index + 1}:v]overlay=0:0:enable='between(t,{start:.2f},{end:.2f})'[v{index + 1}]"); last = f"v{index + 1}"
run([*inputs, "-filter_complex", ";".join(chain), "-map", f"[{last}]", "-t", f"{marks['end']:.2f}", *ENCODE, f"{BUILD}/app.mp4"])

# 2. The segments in order: title cards, the app session, title cards.
segments, cues, cursor = [], [], 0.0   # cues: (line, absolute start in the final video)
def add(path, duration, voice):
    global cursor
    start = cursor - (FADE if segments else 0)
    segments.append((path, duration))
    for line_id, offset in voice: cues.append((line_id, start + offset))
    cursor = start + duration

for line in lines:
    if line["scene"] == "app":
        add(f"{BUILD}/app.mp4", marks["end"], [(l["id"], marks[l["id"]]) for l in caption_order])
    elif line["scene"] in [l["scene"] for l in caption_order]:
        continue
    else:
        duration = LEAD + VOICE[line["id"]] + TAIL + (2.5 if line["scene"] == "close" else 0)
        clip = f"{BUILD}/{line['scene']}.mp4"
        run(["-loop", "1", "-t", f"{duration:.2f}", "-i", f"{HERE}/cards/{line['scene']}.png", "-vf", f"fps={FPS},format=yuv420p", *ENCODE, clip])
        add(clip, duration, [(line["id"], LEAD)])

# 3. Cross-fades between segments, and the narration at its cue times.
inputs, chain, last, offset = [], [], "0:v", 0.0
for index, (path, duration) in enumerate(segments):
    inputs += ["-i", path]
    if index:
        offset += segments[index - 1][1] - FADE
        chain.append(f"[{last}][{index}:v]xfade=transition=fade:duration={FADE}:offset={offset:.3f}[x{index}]"); last = f"x{index}"
base = len(segments)
for index, (line_id, start) in enumerate(cues):
    inputs += ["-i", f"{HERE}/voice/{line_id}.mp3"]
    chain.append(f"[{base + index}:a]adelay={int(start * 1000)}:all=1[a{index}]")
chain.append("".join(f"[a{i}]" for i in range(len(cues))) + f"amix=inputs={len(cues)}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,apad[aout]")
chain.append(f"[{last}]fade=t=in:st=0:d=0.4,fade=t=out:st={cursor - 0.6:.2f}:d=0.6[vout]")
run([*inputs, "-filter_complex", ";".join(chain), "-map", "[vout]", "-map", "[aout]", "-t", f"{cursor:.2f}",
     *ENCODE, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", OUT])

# 4. Subtitles from the same cue times.
def stamp(t): return "%02d:%02d:%02d,%03d" % (t // 3600, t % 3600 // 60, t % 60, round(t % 1 * 1000) % 1000)
text = {line["id"]: line["text"] for line in lines}
with open(OUT[:-4] + ".srt", "w") as srt:
    for index, (line_id, start) in enumerate(sorted(cues, key=lambda c: c[1])):
        srt.write(f"{index + 1}\n{stamp(start)} --> {stamp(start + VOICE[line_id])}\n{text[line_id]}\n\n")
json.dump({"cues": [[line_id, round(start, 2)] for line_id, start in cues], "segments": [[os.path.basename(p), round(d, 2)] for p, d in segments]},
          open(f"{HERE}/timeline.json", "w"), indent=1)

length = seconds(OUT)
print(f"{OUT}: {length:.1f} s")
if length >= 180: sys.exit("The video is 180 s or longer.")
