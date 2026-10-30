# NBE Mobile: Cairo ICT 2026 booth experience

Interactive kiosk app for the robot's 1080 x 1920 portrait touchscreen.
It runs offline: every font, library and image is in this folder.

## Run it
Open `index.html` in Chrome or Edge in full-screen kiosk mode, for example:

    chrome --kiosk --autoplay-policy=no-user-gesture-required "file:///path/to/nbe-kiosk/index.html"

On any other screen size the stage scales to fit, so it can be previewed on a laptop.

## Change the settings
- Edit `config.js`: store links, idle times, volume.
- Or at the booth: press and hold the NBE logo for 3 seconds to open the settings panel.
  Saved values stay on that device.
- Or for a quick test, use the URL: `index.html?smart=https://example.org&sound=0`

## Arabic
Off for now. To bring it back, set `arabicEnabled: true` in `config.js`.
The right-to-left layout and translations in `js/i18n.js` have not been reviewed yet.

## Files
- `js/scene.js`: the 3D emblem, aurora, particles, confetti
- `js/flow.js`: the nine NBE Mobile screens and their demo data
- `js/app.js`: stage changes, idle reset, QR code, sound, settings panel
- `js/i18n.js`: all on-screen copy
