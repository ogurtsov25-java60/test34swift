import Foundation
import UserNotifications

struct NotificationPreferences: Codable, Equatable {
  var enabled: Bool
  var minutesFromMidnight: Int
  var weekdays: [Int] // 1=Sun ... 7=Sat (Calendar weekday)

  static let `default` = NotificationPreferences(
    enabled: false,
    minutesFromMidnight: 19 * 60,
    weekdays: [2, 3, 4, 5, 6] // Mon-Fri
  )

  var hour: Int { max(0, min(23, minutesFromMidnight / 60)) }
  var minute: Int { max(0, min(59, minutesFromMidnight % 60)) }
}

enum NotificationManager {
  private static let prefsKey = "notificationPreferences"
  private static let idPrefix = "aihebrew-reminder-"

  static func loadPreferences() -> NotificationPreferences {
    guard let data = UserDefaults.standard.data(forKey: prefsKey) else {
      return .default
    }
    return (try? JSONDecoder().decode(NotificationPreferences.self, from: data)) ?? .default
  }

  static func savePreferences(_ prefs: NotificationPreferences) {
    if let data = try? JSONEncoder().encode(prefs) {
      UserDefaults.standard.set(data, forKey: prefsKey)
    }
  }

  static func authorizationStatus() async -> UNAuthorizationStatus {
    await withCheckedContinuation { cont in
      UNUserNotificationCenter.current().getNotificationSettings { settings in
        cont.resume(returning: settings.authorizationStatus)
      }
    }
  }

  static func requestAuthorization() async -> Bool {
    do {
      return try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
    } catch {
      return false
    }
  }

  static func reschedule(_ prefs: NotificationPreferences) async throws {
    await cancelAllScheduled()
    guard prefs.enabled else { return }
    guard !prefs.weekdays.isEmpty else { return }

    let status = await authorizationStatus()
    guard status == .authorized || status == .provisional else { return }

    let center = UNUserNotificationCenter.current()
    for weekday in prefs.weekdays.sorted() {
      let content = UNMutableNotificationContent()
      content.title = "AI Hebrew"
      content.body = "Пора на короткий урок и SRS."
      content.sound = .default

      var comps = DateComponents()
      comps.calendar = Calendar.current
      comps.timeZone = .current
      comps.weekday = weekday
      comps.hour = prefs.hour
      comps.minute = prefs.minute

      let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
      let req = UNNotificationRequest(identifier: idPrefix + String(weekday), content: content, trigger: trigger)
      try await center.add(req)
    }
  }

  static func cancelAllScheduled() async {
    let ids = (1...7).map { idPrefix + String($0) }
    let center = UNUserNotificationCenter.current()
    center.removePendingNotificationRequests(withIdentifiers: ids)
    center.removeDeliveredNotifications(withIdentifiers: ids)
  }
}

