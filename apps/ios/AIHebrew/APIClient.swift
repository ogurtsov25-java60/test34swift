import Foundation

enum APIError: Error, LocalizedError {
  case invalidURL
  case httpStatus(Int, Data?)
  case decoding(Error)
  case encoding(Error)
  case missingToken

  var errorDescription: String? {
    switch self {
    case .invalidURL: return "Invalid server URL"
    case .httpStatus(let code, _): return "Server error (\(code))"
    case .decoding: return "Failed to decode server response"
    case .encoding: return "Failed to encode request"
    case .missingToken: return "Not authenticated"
    }
  }
}

final class APIClient {
  static let defaultBaseURL = URL(string: "http://127.0.0.1:3000")!
  static let tokenDefaultsKey = "authToken"

  private let baseURL: URL
  private let session: URLSession

  var token: String? {
    get { UserDefaults.standard.string(forKey: Self.tokenDefaultsKey) }
    set { UserDefaults.standard.set(newValue, forKey: Self.tokenDefaultsKey) }
  }

  init(baseURL: URL = APIClient.defaultBaseURL, session: URLSession = .shared) {
    self.baseURL = baseURL
    self.session = session
  }

  func setBaseURL(_ url: URL) -> APIClient {
    APIClient(baseURL: url, session: session)
  }

  func authDev() async throws -> AuthAppleResponse {
    let resp: AuthAppleResponse = try await request(path: "/auth/dev", method: "POST")
    token = resp.token
    return resp
  }

  func authApple(idToken: String) async throws -> AuthAppleResponse {
    let body = AuthAppleRequest(id_token: idToken)
    return try await request(path: "/auth/apple", method: "POST", body: body)
  }

  func me() async throws -> UserProfile {
    try await request(path: "/me")
  }

  func today() async throws -> TodayResponse {
    try await request(path: "/today")
  }

  func levelStatus() async throws -> LevelStatusResponse {
    try await request(path: "/level-status")
  }

  func lessonStart(lessonId: String?) async throws -> LessonStartResponse {
    let body = LessonStartRequest(lesson_id: lessonId)
    return try await request(path: "/lesson/start", method: "POST", body: body)
  }

  func lessonTurn(sessionId: String, userText: String, userAudioB64: String?) async throws -> LessonTurnResponse {
    let body = LessonTurnRequest(session_id: sessionId, user_text: userText, user_audio_b64: userAudioB64)
    return try await request(path: "/lesson/turn", method: "POST", body: body)
  }

  func lessonEnd(sessionId: String) async throws -> LessonReport {
    let body = LessonEndRequest(session_id: sessionId)
    return try await request(path: "/lesson/end", method: "POST", body: body)
  }

  func srsQueue() async throws -> SrsQueueResponse {
    try await request(path: "/srs/queue")
  }

  func srsReview(cardId: String, grade: SrsReviewRequest.Grade) async throws -> SrsReviewResponse {
    let body = SrsReviewRequest(card_id: cardId, grade: grade)
    return try await request(path: "/srs/review", method: "POST", body: body)
  }

  func request<TResponse: Decodable>(
    path: String,
    method: String = "GET"
  ) async throws -> TResponse {
    try await request(path: path, method: method, body: Optional<EmptyBody>.none)
  }

  private struct EmptyBody: Encodable {}

  func request<TBody: Encodable, TResponse: Decodable>(
    path: String,
    method: String,
    body: TBody?,
  ) async throws -> TResponse {
    guard let url = URL(string: path, relativeTo: baseURL) else {
      throw APIError.invalidURL
    }

    var req = URLRequest(url: url)
    req.httpMethod = method
    req.setValue("application/json", forHTTPHeaderField: "Accept")

    if let token = self.token {
      req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }

    if let body {
      req.setValue("application/json", forHTTPHeaderField: "Content-Type")
      do {
        req.httpBody = try JSONEncoder().encode(body)
      } catch {
        throw APIError.encoding(error)
      }
    }

    let (data, resp) = try await session.data(for: req)
    let http = resp as? HTTPURLResponse
    let status = http?.statusCode ?? -1
    guard (200..<300).contains(status) else {
      throw APIError.httpStatus(status, data)
    }

    do {
      return try JSONDecoder().decode(TResponse.self, from: data)
    } catch {
      throw APIError.decoding(error)
    }
  }
}
