import SwiftUI

struct LoginView: View {
  @EnvironmentObject private var app: AppState

  var body: some View {
    Form {
      Section("Backend") {
        TextField("Base URL", text: $app.baseURLString)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
        Button("Apply Base URL") { app.updateBaseURL() }
      }

      Section("Auth (mock)") {
        Button("Dev auth bootstrap") {
          Task { await app.authDevBootstrap() }
        }
      }

      if let err = app.lastError {
        Section("Error") { Text(err).foregroundStyle(.red) }
      }
    }
    .navigationTitle("AI Hebrew")
  }
}
