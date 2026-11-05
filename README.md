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
- Web Bluetooth BLE connection and JSON/UTF-8 payload transmission to an ESP32 BLE UART receiver (requires matching firmware)
- Voice command shortcuts (convert, read aloud, stop, clear, navigate, explore cells)
- Speech voice selection, pitch and speed controls
- Optional configurable HTTP Braille API call with local converter fallback

## Bluetooth / ESP32 demonstration
1. Open `esp32_braille_ble.ino` in Arduino IDE and select your ESP32 board.
2. Upload it, then open Serial Monitor at 115200 baud. The board advertises as `SmartBraille-ESP32`.
3. Deploy this website on HTTPS (GitHub Pages) or run it on localhost in Chrome/Edge.
4. Open **ESP32 integration → Connect ESP32 Bluetooth**, select the device, then **Send Braille data**.
5. The firmware prints the received UTF-8 JSON packet to Serial Monitor. It is a receiver demo only; it does not drive tactile pins.

**BLE details:** Nordic UART-style custom GATT service UUID `6e400001-b5a3-f393-e0a9-e50e24dcca9e`; website writes to characteristic `...0003`. Packets are JSON terminated with newline. Browser Web Bluetooth is not supported on every browser/device.

## Optional API integration
In ESP32 integration, enter your own HTTP endpoint that accepts `POST` JSON `{ "text": "...", "format": "braille", "language": "en" }`. The endpoint should return JSON with a Braille string in `braille`, `output`, `translated`, or `contents.translated`. Add an API key only if your endpoint requires it. API use is optional; local Braille conversion works without network. Do not put private production keys in a public GitHub repository.

## Voice controls
- **Dictate text:** microphone button appends recognized speech to the text box.
- **Voice command:** say “convert”, “read aloud”, “stop”, “clear text”, “open simulator”, “open ESP32”, “next cell”, or “previous cell”. Unknown phrases are added as dictated text.
- Choose a browser/device voice, rate, pitch, and recognition language in settings/reader.

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
This is a software demonstration. BLE transmission can be tested with the included ESP32 receiver firmware. A physical Braille display and safe actuator/driver integration are still future work. Braille conversion is a simplified Grade 1 English implementation and is not a substitute for a certified Braille translator or assistive technology.


## Share SMS text into the reader (Android browser support)

This prototype now includes a Web Share Target entry. Publish the site over HTTPS (GitHub Pages provides HTTPS), then on a compatible Android browser open the site menu and choose **Install app** or **Add to Home screen**. From a messaging app, select/share a message's text and choose **Smart Braille Reader** in the share sheet. The service worker stores the explicitly shared text briefly in local IndexedDB; the reader imports it, converts it, and announces the result. Tap **Read aloud** to start speech.

Support depends on the Android browser and SMS app. This feature does not read the SMS inbox or monitor messages in the background. A share may include the message text, title, or link based on what the source app sends. Shared text is kept locally in IndexedDB until the reader consumes it.
