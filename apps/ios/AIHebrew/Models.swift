import Foundation

// MARK: - Auth

struct AuthAppleRequest: Codable {
  let id_token: String
}

struct AuthAppleResponse: Codable {
  let token: String
}

// MARK: - Core

enum CefrLevel: String, Codable, CaseIterable {
  case A1, A2, B1, B2, C1
}

struct UserProfile: Codable {
  let user_id: String
  let current_level: CefrLevel
  let current_lesson_id: String
}

// MARK: - Today / Level status

struct TodayResponse: Codable {
  let current_level: CefrLevel
  let current_lesson_id: String
  let micro_goal_ru: String
  let srs_due_count: Int
}

struct LevelStatusResponse: Codable {
  let current_level: CefrLevel
  let completion: Double
  let accuracy: Double
  let fluency: Double
  let eligible_for_upgrade: Bool
}

// MARK: - Lessons

struct LessonDTO: Codable, Hashable {
  let lesson_id: String
  let level: CefrLevel
  let title_ru: String
  let micro_goal_ru: String
  let grammar_focus: [String]
}

struct LessonStartRequest: Codable {
  let lesson_id: String?
}

struct LessonStartResponse: Codable {
  let session_id: String
  let lesson: LessonDTO
}

struct LessonTurnRequest: Codable {
  let session_id: String
  let user_text: String
  let user_audio_b64: String?
}

struct LessonTurnResponse: Codable {
  let ai_text_he: String
  let ai_text_ru: String?
  let ai_audio_b64: String?
}

struct LessonEndRequest: Codable {
  let session_id: String
}

struct TranscriptTurn: Codable, Hashable {
  enum Role: String, Codable {
    case ai
    case user
  }

  let role: Role
  let he: String
  let ru: String?
}

struct Correction: Codable, Hashable {
  enum Kind: String, Codable {
    case grammar
    case vocab
    case pronunciation
  }

  let user_he: String
  let fixed_he: String
  let explain_ru: String
  let type: Kind
}

struct VocabItem: Codable, Hashable {
  let he: String
  let ru: String
  let example_he: String
  let example_ru: String
  let tags: [String]?
  let priority: Int?
}

struct LessonReport: Codable, Hashable {
  let lesson_id: String
  let summary_ru: String
  let transcript: [TranscriptTurn]
  let corrections: [Correction]?
  let vocab_to_learn: [VocabItem]
  let skill_scores: SkillScores
  let next_steps_ru: [String]
}

struct SkillScores: Codable, Hashable {
  let fluency: Double
  let accuracy: Double
  let comprehension: Double
}

// MARK: - SRS

struct FlashcardDTO: Codable, Hashable, Identifiable {
  let id: String
  let he: String
  let ru: String
  let example_he: String
  let example_ru: String
  let tags: [String]?
  let audio_tts_url: String?
}

struct SrsQueueResponse: Codable {
  let due: [FlashcardDTO]
}

struct SrsReviewRequest: Codable {
  enum Grade: String, Codable {
    case easy
    case ok
    case hard
  }

  let card_id: String
  let grade: Grade
}

struct SrsReviewResponse: Codable, Hashable {
  let card_id: String
  let due_at: String
  let interval_days: Int
  let ease: Double
  let repetitions: Int
}

