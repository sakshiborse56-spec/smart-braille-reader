# Smart Braille Reader

A client-side Mini Project prototype for accessible text-to-Braille simulation.

## Features
- Keyboard, paste, and browser speech-recognition input
- English Grade 1 letter patterns, basic punctuation, capitalization and number indicators
- Unicode Braille output
- Interactive six-dot visual simulator
- ASCII dot-pattern representation (`*` raised, `.` empty)
- Browser Text-to-Speech
- Accessibility settings (high contrast, large text, dark mode, speech rate)
- ESP32 payload preview (not a real hardware connection)

## Run locally
Open `index.html` in a browser. Speech recognition generally requires HTTPS or localhost and browser support. For a local server, run:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages
1. Create a public repository.
2. Upload `index.html`, `style.css`, and `script.js` to the repository root.
3. Go to Settings → Pages.
4. Choose Deploy from a branch, branch `main`, folder `/ (root)`.
5. Save and wait for the published URL.

## Project details
- Project: Smart Braille Reader – Voice-Based Accessible Text-to-Braille Simulator
- Type: Mini Project
- Department: Information Technology
- Guide: Mr. Shivaji Patil
- Members: Sakshi Borse, Charchit Moon, Madura Bhole

## Scope note
This is a software demonstration. It does not connect to an ESP32 or physical Braille display. Hardware integration is future work. Braille conversion is a simplified Grade 1 English implementation and is not a substitute for a certified Braille translator or assistive technology.
