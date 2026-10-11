# Demo video storyboard

Seven scenes. The times are the real cue times in the rendered file (2:18 in total).

| Time | Scene | On screen | Source |
| --- | --- | --- | --- |
| 0:00 | 1 The hook | Title card with the logo. | Title card (`assets/cards.html`) |
| 0:03 | 1 The hook | Title card. | Title card (`assets/cards.html`) |
| 0:06 | 1 The hook | The ProofPilot AI logo and the line "The credibility check before you hit publish." | Title card (`assets/cards.html`) |
| 0:12 | 2 The problem | The sample draft, shown as a quotation. | Title card (`assets/cards.html`) |
| 0:26 | 2 The problem | The draft fades back behind the question "Which of these facts would survive a check?" | Title card (`assets/cards.html`) |
| 0:32 | 3 The product | The real app. The draft is entered and **Check claims** is selected. | Recorded app session |
| 0:43 | 3 The product | The real check. Claims are highlighted as "Checking", then each one gets its verdict. | Recorded app session |
| 1:02 | 4 The reveal | The completed credibility report. | Recorded app session |
| 1:14 | 5 The evidence | The contradicted claim is selected. The evidence card opens. | Recorded app session |
| 1:27 | 5 The evidence | The pointer moves to the source link in the evidence card. | Recorded app session |
| 1:35 | 5 The evidence | The unverified claim is selected. | Recorded app session |
| 1:43 | 5 The evidence | A supported claim is selected. | Recorded app session |
| 1:50 | 6 Why it matters | Title card with the four audiences. | Title card (`assets/cards.html`) |
| 2:02 | 6 Why it matters | Title card with the core message. | Title card (`assets/cards.html`) |
| 2:08 | 7 Closing | The logo, both taglines, and the repository address. | Title card (`assets/cards.html`) |

## What is real in the video

- **Scenes 3, 4, and 5 are one continuous recording of the running app**, 78.1 seconds long, with no cuts and no speed change. The app called the real language model and the real search service during the recording.
- The check in the recording took 19.9 seconds from the click to the last verdict. That wait is in the video at its real length.
- The result of that run: 4 claims analysed, 2 supported, 1 contradicted, 1 unverified, with the status "Review before publishing". The recording script stops with an error if a take does not give the result that the narration describes. Two complete takes were recorded, and both gave this result. The second one is in the video because the page is centred in the frame. One earlier attempt stopped on a script error before a check started.
- The pointer is a marker that the recording script draws, because a headless browser has no visible pointer. The page scale is 135% so that the text is readable at 1080p. The dark caption bar is added during assembly. Nothing else is added to the app picture.
- The sample draft is text written for the demo. It contains one common myth and one statistic with no source, on purpose. It makes no claim about a real person or organisation that is not publicly documented.
- Recorded: 2026-10-11 14:08:16 UTC.

## How the video was made

| Step | Tool | File |
| --- | --- | --- |
| Title cards and caption bars | HTML rendered to PNG with Playwright | `assets/cards.html`, `assets/render_cards.py` |
| Narration | ElevenLabs text-to-speech | `assets/narration.json`, `assets/make_voiceover.py` |
| App recording | Playwright with the Chrome screencast, driven in real time | `assets/record_app.py` |
| Assembly, cross-fades, audio mix, subtitles | ffmpeg | `assets/build_video.py` |

### Why not VideoWright

The brief asked for [VideoWright](https://github.com/scosman/videowright) if it was compatible. Its README and export reference were read first. VideoWright renders HTML scenes frame by frame on a virtual clock, which makes its output deterministic. It does not record a live application, and its reference tells the user to use separate screen-capture software for that. More than half of this video is a live recording of an app that calls network services, so VideoWright could produce only the title cards, and a second tool would still record and join the app session. One pipeline (Playwright and ffmpeg) was used for all scenes for that reason.

## Rebuild

```bash
cd demo/assets
python3 render_cards.py        # needs Playwright for Python with Chromium
python3 make_voiceover.py      # needs ELEVENLABS_API_KEY; uses account credits; skips clips that exist
python3 record_app.py          # needs the app at http://localhost:3000 with real keys
python3 build_video.py         # needs ffmpeg; writes ../proofpilot-demo.mp4 and ../proofpilot-demo.srt
```

The recorded frames (`assets/footage/frames/`) and the intermediate clips (`assets/build/`) are not in the repository. `assets/footage/take.json` records the times and the result of the take in the video.
