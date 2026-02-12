# iOS app (SwiftUI)

This folder contains SwiftUI source code for the iOS client.

## Run backend first
1) In `ai-hebrew/services/api`:
- `npm run migrate`
- `npm run seed`
- `npm run dev`

Default base URL is `http://127.0.0.1:3000`.

## Create Xcode project
1) Open Xcode → **File → New → Project…** → **iOS → App** (SwiftUI)
2) Name: `AIHebrew`, Interface: SwiftUI, Language: Swift
3) Copy the contents of `apps/ios/AIHebrew/` into your Xcode project (same group structure is fine).
4) Ensure `AIHebrewApp.swift` is the app entry point.

## Allow HTTP during development
If you use `http://127.0.0.1:3000`, add an ATS exception in your app’s `Info.plist`:
- `NSAppTransportSecurity` → `NSAllowsArbitraryLoads` = `YES` (dev only), or a domain exception.

## Voice (ASR/TTS)
The app uses iOS Speech + AVFoundation:
- Record mic → Speech ASR → sends `user_text` (and includes `user_audio_b64` when available)
- Reply audio: plays `ai_audio_b64` if backend returns it, otherwise uses local TTS for `ai_text_he`

Add these keys to your `Info.plist`:
- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`

## App screens
- Today: calls `GET /today`, starts lesson via `POST /lesson/start`
- Lesson: chat via `POST /lesson/turn`, ends via `POST /lesson/end` and shows Summary
- Summary: renders `LessonReport`
- SRS Queue: calls `GET /srs/queue`, grades via `POST /srs/review`
- Notifications: local reminders via `UNUserNotificationCenter` (time + weekdays)

## Auth
The app bootstraps with dev auth (`POST /auth/dev`) and stores the returned Bearer token in `UserDefaults` under `authToken`.
