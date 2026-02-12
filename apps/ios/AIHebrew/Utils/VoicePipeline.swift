import AVFoundation
import Foundation
import Speech

@MainActor
final class VoicePipeline: NSObject, ObservableObject {
  @Published var isRecording = false
  @Published var isTranscribing = false
  @Published var lastTranscript: String = ""
  @Published var lastAudioB64: String?
  @Published var error: String?

  @Published var speechAuth: SFSpeechRecognizerAuthorizationStatus = .notDetermined
  @Published var micPermission: AVAudioSession.RecordPermission = .undetermined

  private let speechRecognizer: SFSpeechRecognizer
  private var recorder: AVAudioRecorder?
  private var recordURL: URL?

  private let synthesizer = AVSpeechSynthesizer()
  private var audioPlayer: AVAudioPlayer?

  init(locale: Locale = Locale(identifier: "he-IL")) {
    if let r = SFSpeechRecognizer(locale: locale) {
      self.speechRecognizer = r
    } else if let r = SFSpeechRecognizer(locale: Locale.current) {
      self.speechRecognizer = r
    } else if let r = SFSpeechRecognizer(locale: Locale(identifier: "en-US")) {
      self.speechRecognizer = r
    } else {
      fatalError("Unable to initialize SFSpeechRecognizer")
    }
    super.init()
  }

  func refreshPermissions() {
    speechAuth = SFSpeechRecognizer.authorizationStatus()
    micPermission = AVAudioSession.sharedInstance().recordPermission
  }

  func ensurePermissions() async -> Bool {
    refreshPermissions()

    if speechAuth == .notDetermined {
      speechAuth = await requestSpeechAuth()
    }
    if micPermission == .undetermined {
      let granted = await requestMicPermission()
      micPermission = granted ? .granted : .denied
    }

    return speechAuth == .authorized && micPermission == .granted
  }

  func startRecording() async {
    error = nil
    lastTranscript = ""
    lastAudioB64 = nil

    let ok = await ensurePermissions()
    guard ok else {
      error = "Нет разрешений на микрофон/распознавание речи."
      return
    }

    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.record, mode: .measurement, options: [.duckOthers, .allowBluetooth])
      try session.setActive(true, options: .notifyOthersOnDeactivation)

      let url = FileManager.default.temporaryDirectory
        .appendingPathComponent("lesson-\(UUID().uuidString)")
        .appendingPathExtension("m4a")
      recordURL = url

      let settings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
        AVSampleRateKey: 44_100,
        AVNumberOfChannelsKey: 1,
        AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
      ]

      let r = try AVAudioRecorder(url: url, settings: settings)
      r.prepareToRecord()
      r.record()
      recorder = r
      isRecording = true
    } catch {
      self.error = error.localizedDescription
      isRecording = false
    }
  }

  func stopRecordingAndTranscribe() async -> String {
    error = nil
    isRecording = false
    recorder?.stop()
    recorder = nil

    guard let url = recordURL else { return "" }
    recordURL = nil

    do {
      let data = try Data(contentsOf: url)
      lastAudioB64 = data.base64EncodedString()
    } catch {
      lastAudioB64 = nil
    }

    isTranscribing = true
    defer {
      isTranscribing = false
      try? FileManager.default.removeItem(at: url)
    }

    do {
      let transcript = try await transcribe(url: url)
      lastTranscript = transcript
      return transcript
    } catch {
      self.error = error.localizedDescription
      return ""
    }
  }

  func playAIResponse(textHe: String, audioB64: String?) async {
    error = nil
    stopPlayback()

    if let audioB64, let data = Data(base64Encoded: audioB64) {
      do {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default, options: [.duckOthers])
        try session.setActive(true, options: .notifyOthersOnDeactivation)

        let player = try AVAudioPlayer(data: data)
        player.prepareToPlay()
        player.play()
        audioPlayer = player
        return
      } catch {
        // fall through to local TTS
      }
    }

    await speakHebrew(textHe)
  }

  func stopPlayback() {
    audioPlayer?.stop()
    audioPlayer = nil
    if synthesizer.isSpeaking {
      synthesizer.stopSpeaking(at: .immediate)
    }
  }

  private func speakHebrew(_ text: String) async {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
      try session.setActive(true, options: .notifyOthersOnDeactivation)

      let u = AVSpeechUtterance(string: text)
      u.voice = AVSpeechSynthesisVoice(language: "he-IL") ?? AVSpeechSynthesisVoice(language: "he")
      u.rate = AVSpeechUtteranceDefaultSpeechRate
      synthesizer.speak(u)
    } catch {
      self.error = "TTS failed; showing text only."
    }
  }

  private func transcribe(url: URL) async throws -> String {
    guard speechRecognizer.isAvailable else {
      throw NSError(
        domain: "VoicePipeline",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "Speech recognizer unavailable"]
      )
    }

    let request = SFSpeechURLRecognitionRequest(url: url)
    request.shouldReportPartialResults = false

    return try await withCheckedThrowingContinuation { cont in
      var didResume = false
      speechRecognizer.recognitionTask(with: request) { result, err in
        if didResume { return }
        if let err {
          didResume = true
          cont.resume(throwing: err)
          return
        }
        guard let result, result.isFinal else { return }
        didResume = true
        let text = result.bestTranscription.formattedString.trimmingCharacters(in: .whitespacesAndNewlines)
        cont.resume(returning: text)
      }
    }
  }

  private func requestSpeechAuth() async -> SFSpeechRecognizerAuthorizationStatus {
    await withCheckedContinuation { cont in
      SFSpeechRecognizer.requestAuthorization { status in
        cont.resume(returning: status)
      }
    }
  }

  private func requestMicPermission() async -> Bool {
    await withCheckedContinuation { cont in
      AVAudioSession.sharedInstance().requestRecordPermission { granted in
        cont.resume(returning: granted)
      }
    }
  }
}

