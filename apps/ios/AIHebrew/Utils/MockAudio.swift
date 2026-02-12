import Foundation

enum MockAudio {
  static func fakeUserAudioB64() -> String {
    // Not real audio — placeholder base64 to exercise the API field.
    Data("mock-audio".utf8).base64EncodedString()
  }
}

