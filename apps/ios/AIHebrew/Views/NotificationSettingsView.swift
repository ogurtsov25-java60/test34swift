import SwiftUI
import UserNotifications
import UIKit

@MainActor
final class NotificationSettingsViewModel: ObservableObject {
  @Published var prefs: NotificationPreferences = NotificationManager.loadPreferences()
  @Published var authStatus: UNAuthorizationStatus = .notDetermined
  @Published var error: String?

  func refreshStatus() async {
    authStatus = await NotificationManager.authorizationStatus()
  }

  func setEnabled(_ enabled: Bool) async {
    prefs.enabled = enabled
    NotificationManager.savePreferences(prefs)

    if enabled {
      let status = await NotificationManager.authorizationStatus()
      authStatus = status
      if status == .notDetermined {
        let granted = await NotificationManager.requestAuthorization()
        authStatus = await NotificationManager.authorizationStatus()
        if !granted {
          prefs.enabled = false
          NotificationManager.savePreferences(prefs)
          error = "Разрешение на уведомления не выдано."
          return
        }
      }
    }

    do {
      try await NotificationManager.reschedule(prefs)
      error = nil
    } catch {
      self.error = error.localizedDescription
    }
  }

  func updateTime(_ date: Date) async {
    let comps = Calendar.current.dateComponents([.hour, .minute], from: date)
    let hour = comps.hour ?? 19
    let minute = comps.minute ?? 0
    prefs.minutesFromMidnight = hour * 60 + minute
    NotificationManager.savePreferences(prefs)
    await rescheduleIfEnabled()
  }

  func toggleWeekday(_ weekday: Int) async {
    if prefs.weekdays.contains(weekday) {
      prefs.weekdays.removeAll { $0 == weekday }
    } else {
      prefs.weekdays.append(weekday)
    }
    prefs.weekdays = Array(Set(prefs.weekdays)).sorted()
    NotificationManager.savePreferences(prefs)
    await rescheduleIfEnabled()
  }

  func openSystemSettings() {
    guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
    UIApplication.shared.open(url)
  }

  private func rescheduleIfEnabled() async {
    guard prefs.enabled else { return }
    do {
      try await NotificationManager.reschedule(prefs)
      error = nil
    } catch {
      self.error = error.localizedDescription
    }
  }
}

struct NotificationSettingsView: View {
  @Environment(\.scenePhase) private var scenePhase
  @StateObject private var vm = NotificationSettingsViewModel()

  private var timeBinding: Binding<Date> {
    Binding(
      get: {
        var comps = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        comps.hour = vm.prefs.hour
        comps.minute = vm.prefs.minute
        return Calendar.current.date(from: comps) ?? Date()
      },
      set: { newValue in
        Task { await vm.updateTime(newValue) }
      }
    )
  }

  var body: some View {
    Form {
      Section("Enable") {
        Toggle("Reminders", isOn: Binding(get: { vm.prefs.enabled }, set: { newValue in Task { await vm.setEnabled(newValue) } }))

        HStack {
          Text("Permission")
          Spacer()
          Text(statusLabel(vm.authStatus))
            .foregroundStyle(vm.authStatus == .denied ? .red : .secondary)
        }

        if vm.authStatus == .denied {
          Button("Open iOS Settings") { vm.openSystemSettings() }
        }
      }

      Section("Schedule") {
        DatePicker("Time", selection: timeBinding, displayedComponents: .hourAndMinute)
          .disabled(!vm.prefs.enabled)

        VStack(alignment: .leading, spacing: 10) {
          Text("Weekdays").foregroundStyle(.secondary)
          WeekdayPicker(selected: Set(vm.prefs.weekdays)) { weekday in
            Task { await vm.toggleWeekday(weekday) }
          }
          .disabled(!vm.prefs.enabled)

          if vm.prefs.enabled && vm.prefs.weekdays.isEmpty {
            Text("Select at least one weekday.")
              .font(.footnote)
              .foregroundStyle(.orange)
          }
        }
      }

      if let err = vm.error {
        Section("Error") { Text(err).foregroundStyle(.red) }
      }
    }
    .navigationTitle("Notifications")
    .task { await vm.refreshStatus() }
    .onChange(of: scenePhase) { _, newValue in
      if newValue == .active {
        Task { await vm.refreshStatus() }
      }
    }
  }

  private func statusLabel(_ status: UNAuthorizationStatus) -> String {
    switch status {
    case .notDetermined: return "Not determined"
    case .denied: return "Denied"
    case .authorized: return "Authorized"
    case .provisional: return "Provisional"
    case .ephemeral: return "Ephemeral"
    @unknown default: return "Unknown"
    }
  }
}

private struct WeekdayPicker: View {
  let selected: Set<Int>
  let toggle: (Int) -> Void

  // Keep stable order Mon..Sun (2..7,1)
  private let order: [Int] = [2, 3, 4, 5, 6, 7, 1]

  var body: some View {
    let symbols = Calendar.current.shortWeekdaySymbols // Sun..Sat
    HStack(spacing: 8) {
      ForEach(order, id: \.self) { weekday in
        let idx = weekday - 1
        let title = symbols.indices.contains(idx) ? symbols[idx] : String(weekday)
        Button {
          toggle(weekday)
        } label: {
          Text(title)
            .font(.footnote)
            .frame(minWidth: 32)
            .padding(.vertical, 8)
            .background(selected.contains(weekday) ? Color.accentColor.opacity(0.2) : Color.gray.opacity(0.15))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
      }
    }
  }
}
