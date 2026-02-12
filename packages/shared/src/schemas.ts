import { z } from "zod";

export const CefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1"]);
export type CefrLevelT = z.infer<typeof CefrLevel>;

export const LessonId = z.string().min(3);
export type LessonIdT = z.infer<typeof LessonId>;

export const UserProfile = z.object({
  user_id: z.string().min(1),
  current_level: CefrLevel,
  current_lesson_id: LessonId,
});
export type UserProfileT = z.infer<typeof UserProfile>;

export const LessonDTO = z.object({
  lesson_id: LessonId,
  level: CefrLevel,
  title_ru: z.string().min(1),
  micro_goal_ru: z.string().min(1),
  grammar_focus: z.array(z.string()).default([]),
});
export type LessonDTOT = z.infer<typeof LessonDTO>;

export const TranscriptTurn = z.object({
  role: z.enum(["ai", "user"]),
  he: z.string().min(1),
  ru: z.string().optional(),
});
export type TranscriptTurnT = z.infer<typeof TranscriptTurn>;

export const Correction = z.object({
  user_he: z.string().min(1),
  fixed_he: z.string().min(1),
  explain_ru: z.string().min(1),
  type: z.enum(["grammar", "vocab", "pronunciation"]),
});
export type CorrectionT = z.infer<typeof Correction>;

export const VocabItem = z.object({
  he: z.string().min(1),
  ru: z.string().min(1),
  example_he: z.string().min(1),
  example_ru: z.string().min(1),
  tags: z.array(z.string()).default([]),
  priority: z.number().int().min(1).max(3).default(2),
});
export type VocabItemT = z.infer<typeof VocabItem>;

export const LessonReport = z.object({
  lesson_id: LessonId,
  summary_ru: z.string().min(1),
  transcript: z.array(TranscriptTurn).min(2),
  corrections: z.array(Correction).default([]),
  vocab_to_learn: z.array(VocabItem).min(1),
  skill_scores: z.object({
    fluency: z.number().min(0).max(1),
    accuracy: z.number().min(0).max(1),
    comprehension: z.number().min(0).max(1),
  }),
  next_steps_ru: z.array(z.string()).min(1),
});
export type LessonReportT = z.infer<typeof LessonReport>;

export const FlashcardDTO = z.object({
  id: z.string(),
  he: z.string().min(1),
  ru: z.string().min(1),
  example_he: z.string().min(1),
  example_ru: z.string().min(1),
  tags: z.array(z.string()).default([]),
  audio_tts_url: z.string().url().optional(),
});
export type FlashcardDTOT = z.infer<typeof FlashcardDTO>;

export const TodayResponse = z.object({
  current_level: CefrLevel,
  current_lesson_id: LessonId,
  micro_goal_ru: z.string(),
  srs_due_count: z.number().int().min(0),
});
export type TodayResponseT = z.infer<typeof TodayResponse>;

export const LevelStatusResponse = z.object({
  current_level: CefrLevel,
  completion: z.number().min(0).max(1),
  accuracy: z.number().min(0).max(1),
  fluency: z.number().min(0).max(1),
  eligible_for_upgrade: z.boolean(),
});
export type LevelStatusResponseT = z.infer<typeof LevelStatusResponse>;

export const SrsReviewRequest = z.object({
  card_id: z.string(),
  grade: z.enum(["easy", "ok", "hard"]),
});
export type SrsReviewRequestT = z.infer<typeof SrsReviewRequest>;

export const SrsReviewResponse = z.object({
  card_id: z.string(),
  due_at: z.string(),
  interval_days: z.number().int().min(1),
  ease: z.number().min(1.3),
  repetitions: z.number().int().min(0),
});
export type SrsReviewResponseT = z.infer<typeof SrsReviewResponse>;

export const AuthAppleRequest = z.object({
  id_token: z.string().min(1),
});
export type AuthAppleRequestT = z.infer<typeof AuthAppleRequest>;

export const AuthAppleResponse = z.object({
  token: z.string().min(1),
});
export type AuthAppleResponseT = z.infer<typeof AuthAppleResponse>;

export const LessonStartRequest = z.object({
  lesson_id: LessonId.optional(),
});
export type LessonStartRequestT = z.infer<typeof LessonStartRequest>;

export const LessonStartResponse = z.object({
  session_id: z.string().min(1),
  lesson: LessonDTO,
});
export type LessonStartResponseT = z.infer<typeof LessonStartResponse>;

export const LessonTurnRequest = z.object({
  session_id: z.string().min(1),
  user_text: z.string().min(1),
  user_audio_b64: z.string().min(1).optional(),
});
export type LessonTurnRequestT = z.infer<typeof LessonTurnRequest>;

export const LessonTurnResponse = z.object({
  ai_text_he: z.string().min(1),
  ai_text_ru: z.string().min(1).optional(),
  ai_audio_b64: z.string().min(1).optional(),
});
export type LessonTurnResponseT = z.infer<typeof LessonTurnResponse>;

export const LessonEndRequest = z.object({
  session_id: z.string().min(1),
});
export type LessonEndRequestT = z.infer<typeof LessonEndRequest>;

export const SrsQueueResponse = z.object({
  due: z.array(FlashcardDTO),
});
export type SrsQueueResponseT = z.infer<typeof SrsQueueResponse>;
