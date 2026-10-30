/*
 * Booth settings. Edit here, or on the kiosk itself:
 * press and hold the NBE logo for 3 seconds to open the settings panel.
 * Values saved in the panel are stored on that device and override this file.
 * URL overrides also work: index.html?qr=https://...&lang=ar&sound=0
 */
window.NBE_CONFIG = {
  // What the QR code on the Completion stage opens. get-app.html sends Android
  // phones to Google Play and iPhones to the App Store. The store links are in that file.
  qrUrl: "https://middl-men.github.io/NBE-ICT/get-app.html",

  // Seconds without a touch before "Still there?" appears on Welcome and Onboarding.
  idleSeconds: 45,

  // Seconds the "Still there?" countdown runs before returning to Attract Mode.
  idleCountdownSeconds: 10,

  // Seconds the Completion stage stays up (time to scan) before returning to Attract Mode.
  completionSeconds: 40,

  // Seconds between English and Arabic on Attract Mode.
  attractSwapSeconds: 6,

  // Interface sounds. 0 is silent, 1 is full volume.
  soundVolume: 0.35,

  // Arabic (RTL) is switched off for now. The translations are in js/i18n.js and
  // still need checking on the kiosk before this is set to true.
  arabicEnabled: false,

  // Starting language: "en" or "ar". Only used when arabicEnabled is true.
  defaultLang: "en"
};
