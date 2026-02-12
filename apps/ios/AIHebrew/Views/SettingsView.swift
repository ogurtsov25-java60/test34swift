import SwiftUI

struct SettingsView: View {
  @EnvironmentObject private var app: AppState
  @State private var me: UserProfile?
  @State private var error: String?

  var body: some View {
    Form {
      Section("Backend") {
        TextField("Base URL", text: $app.baseURLString)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
        Button("Apply Base URL") { app.updateBaseURL() }
      }

      Section("Notifications") {
        NavigationLink("Notification Settings") { NotificationSettingsView() }
      }

      Section("Account") {
        if let me {
          LabeledContent("User") { Text(me.user_id) }
          LabeledContent("Level") { Text(me.current_level.rawValue) }
          LabeledContent("Lesson") { Text(me.current_lesson_id) }
        } else {
          Text("Not loaded")
        }

        Button("Reload /me") {
          Task {
            do {
              if app.token == nil {
                await app.authDevBootstrap()
              }
              me = try await app.api.me()
              error = nil
            } catch {
              self.error = error.localizedDescription
            }
          }
        }
      }

      if let error {
        Section("Error") { Text(error).foregroundStyle(.red) }
      }
    }
    .navigationTitle("Settings")
  }
}
