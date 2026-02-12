import SwiftUI

@MainActor
final class TodayViewModel: ObservableObject {
  @Published var today: TodayResponse?
  @Published var isLoading = false
  @Published var error: String?

  func load(app: AppState) async {
    isLoading = true
    defer { isLoading = false }
    do {
      if app.token == nil {
        await app.authDevBootstrap()
        if app.token == nil {
          error = app.lastError ?? "Auth failed"
          return
        }
      }
      today = try await app.api.today()
      error = nil
    } catch {
      self.error = error.localizedDescription
    }
  }
}

struct TodayView: View {
  @EnvironmentObject private var app: AppState
  @StateObject private var vm = TodayViewModel()

  var body: some View {
    List {
      Section {
        if let today = vm.today {
          LabeledContent("Level") { Text(today.current_level.rawValue) }
          LabeledContent("Current lesson") { Text(today.current_lesson_id) }
          LabeledContent("Micro goal") { Text(today.micro_goal_ru) }
          LabeledContent("SRS due") { Text("\(today.srs_due_count)") }
        } else if vm.isLoading {
          ProgressView()
        } else {
          Text("No data.")
        }
      } header: {
        Text("Today")
      }

      if let error = vm.error {
        Section("Error") { Text(error).foregroundStyle(.red) }
      }
    }
    .navigationTitle("AI Hebrew")
    .task { await vm.load(app: app) }
    .refreshable { await vm.load(app: app) }
  }
}
