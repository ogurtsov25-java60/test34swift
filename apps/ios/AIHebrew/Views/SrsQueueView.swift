import SwiftUI

@MainActor
final class SrsQueueViewModel: ObservableObject {
  @Published var cards: [FlashcardDTO] = []
  @Published var isLoading = false
  @Published var error: String?

  func load(app: AppState) async {
    isLoading = true
    defer { isLoading = false }
    do {
      if app.token == nil {
        await app.authDevBootstrap()
      }
      let resp = try await app.api.srsQueue()
      cards = resp.due
      error = nil
    } catch {
      self.error = error.localizedDescription
    }
  }

  func grade(app: AppState, cardId: String, grade: SrsReviewRequest.Grade) async {
    do {
      if app.token == nil {
        await app.authDevBootstrap()
      }
      _ = try await app.api.srsReview(cardId: cardId, grade: grade)
      cards.removeAll { $0.id == cardId }
    } catch {
      self.error = error.localizedDescription
    }
  }
}

struct SrsQueueView: View {
  @EnvironmentObject private var app: AppState
  @StateObject private var vm = SrsQueueViewModel()

  var body: some View {
    List {
      if vm.isLoading {
        ProgressView()
      }

      if let error = vm.error {
        Section("Error") { Text(error).foregroundStyle(.red) }
      }

      Section("Due") {
        if vm.cards.isEmpty && !vm.isLoading {
          Text("No cards due.")
        }

        ForEach(vm.cards) { card in
          VStack(alignment: .leading, spacing: 6) {
            Text(card.he).font(.title3).fontWeight(.semibold)
            Text(card.ru).foregroundStyle(.secondary)
            Divider()
            Text(card.example_he).font(.footnote)
            Text(card.example_ru).font(.footnote).foregroundStyle(.secondary)
            HStack {
              Button("Hard") { Task { await vm.grade(app: app, cardId: card.id, grade: .hard) } }
                .buttonStyle(.bordered)
              Button("OK") { Task { await vm.grade(app: app, cardId: card.id, grade: .ok) } }
                .buttonStyle(.bordered)
              Button("Easy") { Task { await vm.grade(app: app, cardId: card.id, grade: .easy) } }
                .buttonStyle(.borderedProminent)
            }
          }
          .padding(.vertical, 6)
        }
      }
    }
    .navigationTitle("SRS Queue")
    .task { await vm.load(app: app) }
    .refreshable { await vm.load(app: app) }
  }
}
