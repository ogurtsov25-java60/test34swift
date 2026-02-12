import Foundation
import SwiftUI

@MainActor
final class AppState: ObservableObject {
  private static let tokenKey = APIClient.tokenDefaultsKey

  @Published var baseURLString: String {
    didSet { UserDefaults.standard.set(baseURLString, forKey: "baseURL") }
  }

  @Published var token: String? {
    didSet { UserDefaults.standard.set(token, forKey: Self.tokenKey) }
  }

  @Published var lastError: String?

  private(set) var api: APIClient

  init() {
    let storedBase = UserDefaults.standard.string(forKey: "baseURL") ?? "http://127.0.0.1:3000"
    let storedToken = UserDefaults.standard.string(forKey: Self.tokenKey)

    baseURLString = storedBase
    token = storedToken
    api = APIClient(baseURL: URL(string: storedBase)!)

    // One-time migration from older key.
    if token == nil, let old = UserDefaults.standard.string(forKey: "token") {
      token = old
      UserDefaults.standard.removeObject(forKey: "token")
    }
  }

  func updateBaseURL() {
    guard let url = URL(string: baseURLString) else {
      lastError = "Invalid Base URL"
      return
    }
    api = api.setBaseURL(url)
  }

  func logout() {
    token = nil
  }

  func authDevBootstrap() async {
    updateBaseURL()
    do {
      let resp = try await api.authDev()
      token = resp.token
      lastError = nil
    } catch {
      lastError = error.localizedDescription
    }
  }
}
