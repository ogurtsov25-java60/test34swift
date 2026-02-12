import SwiftUI

@MainActor
final class LessonViewModel: ObservableObject {
  @Published var turns: [TranscriptTurn] = []
  @Published var userText: String = ""
  @Published var isSending = false
  @Published var error: String?

  func bootstrap(with started: LessonStartResponse) {
    if turns.isEmpty {
      turns = [
        TranscriptTurn(
          role: .ai,
          he: "Начнем урок: \(started.lesson.lesson_id)",
          ru: started.lesson.micro_goal_ru
        ),
      ]
    }
  }

  func send(app: AppState, sessionId: String, userAudioB64: String?) async -> LessonTurnResponse? {
    if app.token == nil {
      await app.authDevBootstrap()
    }
    let text = userText.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !text.isEmpty else { return nil }

    isSending = true
    defer { isSending = false }
    error = nil

    userText = ""
    turns.append(TranscriptTurn(role: .user, he: text, ru: nil))

    do {
      let resp = try await app.api.lessonTurn(
        sessionId: sessionId,
        userText: text,
        userAudioB64: userAudioB64
      )
      turns.append(TranscriptTurn(role: .ai, he: resp.ai_text_he, ru: resp.ai_text_ru))
      return resp
    } catch {
      self.error = error.localizedDescription
      return nil
    }
  }

  func end(app: AppState, sessionId: String) async throws -> LessonReport {
    if app.token == nil {
      await app.authDevBootstrap()
    }
    return try await app.api.lessonEnd(sessionId: sessionId)
  }
}

struct LessonView: View {
  @EnvironmentObject private var app: AppState
  @StateObject private var vm = LessonViewModel()
  @StateObject private var voice = VoicePipeline()

  let started: LessonStartResponse

  @State private var report: LessonReport?
  @State private var isEnding = false
  @State private var lastUserAudioB64: String?

  var body: some View {
    VStack(spacing: 0) {
      List {
        Section {
          LabeledContent("Lesson") { Text(started.lesson.lesson_id) }
          LabeledContent("Level") { Text(started.lesson.level.rawValue) }
          LabeledContent("Goal") { Text(started.lesson.micro_goal_ru) }
        }

        Section("Chat") {
          ForEach(vm.turns, id: \.self) { t in
            ChatBubble(
              side: t.role == .user ? .right : .left,
              title: t.role == .user ? "You" : "AI",
              text: t.he,
              subtitle: t.ru
            )
            .listRowSeparator(.hidden)
          }
        }

        if let err = vm.error {
          Section("Error") { Text(err).foregroundStyle(.red) }
        }

        if let err = voice.error {
          Section("Voice") { Text(err).foregroundStyle(.red) }
        } else if voice.isRecording {
          Section("Voice") { Text("Recording…") }
        } else if voice.isTranscribing {
          Section("Voice") { Text("Transcribing…") }
        }
      }
      .listStyle(.plain)

      Divider()

      HStack(spacing: 10) {
        Button {
          Task {
            if voice.isRecording {
              let t = await voice.stopRecordingAndTranscribe()
              if !t.isEmpty {
                vm.userText = t
                lastUserAudioB64 = voice.lastAudioB64
              }
            } else {
              lastUserAudioB64 = nil
              await voice.startRecording()
            }
          }
        } label: {
          Image(systemName: voice.isRecording ? "stop.circle.fill" : "mic.circle.fill")
            .font(.title2)
        }
        .buttonStyle(.plain)
        .disabled(voice.isTranscribing || vm.isSending)

        TextField("Type in Hebrew…", text: $vm.userText, axis: .vertical)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
          .lineLimit(1...4)

        Button("Send") {
          Task {
            let resp = await vm.send(app: app, sessionId: started.session_id, userAudioB64: lastUserAudioB64)
            lastUserAudioB64 = nil
            if let resp {
              await voice.playAIResponse(textHe: resp.ai_text_he, audioB64: resp.ai_audio_b64)
            }
          }
        }
        .disabled(vm.isSending)
        .buttonStyle(.borderedProminent)
      }
      .padding(12)
    }
    .navigationTitle("Lesson")
    .navigationBarTitleDisplayMode(.inline)
    .toolbar {
      ToolbarItem(placement: .topBarLeading) {
        Button { voice.stopPlayback() } label: { Image(systemName: "speaker.slash") }
      }
      ToolbarItem(placement: .topBarTrailing) {
        Button {
          Task {
            isEnding = true
            defer { isEnding = false }
            do {
              report = try await vm.end(app: app, sessionId: started.session_id)
            } catch {
              vm.error = error.localizedDescription
            }
          }
        } label: {
          if isEnding { ProgressView() } else { Text("End") }
        }
      }
    }
    .onAppear {
      vm.bootstrap(with: started)
      voice.refreshPermissions()
    }
    .navigationDestination(item: $report) { r in
      SummaryView(report: r)
    }
  }
}

private extension LessonReport: Identifiable {
  var id: String { lesson_id }
}
