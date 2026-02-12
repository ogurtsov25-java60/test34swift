import SwiftUI

struct RootView: View {
  @EnvironmentObject private var app: AppState

  var body: some View {
    NavigationStack {
      TodayView()
    }
  }
}
