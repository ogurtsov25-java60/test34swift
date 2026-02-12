export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type VocabSeed = Readonly<{
  he: string;
  ru: string;
}>;

export type UnitTemplate = Readonly<{
  topic_ru: string;
  goals_ru: string;
  grammar_focus: readonly string[];
  conversation_style: string;
  core_vocab_packs: readonly (readonly VocabSeed[])[];
}>;

function packFromTopic(topicKey: string, packIndex: number): readonly VocabSeed[] {
  const base = `${topicKey}_${packIndex}`;
  return [
    { he: `${base}_w1`, ru: `${base}_слово1` },
    { he: `${base}_w2`, ru: `${base}_слово2` },
    { he: `${base}_w3`, ru: `${base}_слово3` },
    { he: `${base}_w4`, ru: `${base}_слово4` },
    { he: `${base}_w5`, ru: `${base}_слово5` },
  ] as const;
}

function unit(
  topicKey: string,
  topic_ru: string,
  goals_ru: string,
  grammar_focus: readonly string[],
  conversation_style: string
): UnitTemplate {
  return {
    topic_ru,
    goals_ru,
    grammar_focus,
    conversation_style,
    core_vocab_packs: [packFromTopic(topicKey, 1), packFromTopic(topicKey, 2)],
  } as const;
}

export const UNIT_TEMPLATES: Readonly<Record<CefrLevel, readonly UnitTemplate[]>> =
  {
    A1: [
      unit("a1_greetings", "Приветствия", "Научиться приветствовать и прощаться.", ["greetings"], "friendly"),
      unit("a1_family", "Семья", "Говорить о семье и отношениях.", ["pronouns", "possessives"], "friendly"),
      unit("a1_numbers_time", "Числа и время", "Считать и говорить о времени.", ["numbers", "time"], "neutral"),
      unit("a1_shopping", "Покупки", "Диалог в магазине и на рынке.", ["questions", "politeness"], "practical"),
      unit("a1_food", "Еда", "Заказывать еду и говорить о предпочтениях.", ["likes_dislikes"], "practical"),
      unit("a1_home", "Дом", "Описывать дом и предметы.", ["prepositions_basic"], "neutral"),
      unit("a1_directions", "Ориентация", "Спрашивать дорогу и понимать направления.", ["prepositions_basic"], "practical"),
      unit("a1_doctor", "Доктор", "Объяснять базовые симптомы.", ["present_tense_basic"], "practical"),
      unit("a1_daily_routine", "Рутина", "Описывать день и привычки.", ["present_tense_basic"], "neutral"),
      unit("a1_weather", "Погода", "Говорить о погоде и планах.", ["adjectives_basic"], "friendly"),
      unit("a1_transport", "Транспорт", "Покупать билет и спрашивать расписание.", ["questions"], "practical"),
      unit("a1_review", "Повторение", "Закрепить материал уровня A1.", ["review"], "coach"),
    ],
    A2: [
      unit("a2_past", "Прошедшее время", "Рассказывать о прошлом.", ["past_tense"], "neutral"),
      unit("a2_daily", "Повседневные дела", "Обсуждать распорядок и обязанности.", ["aspects"], "practical"),
      unit("a2_stories", "Истории", "Рассказывать короткие истории.", ["sequencers"], "friendly"),
      unit("a2_travel", "Путешествия", "Бронировать и обсуждать поездки.", ["modals"], "practical"),
      unit("a2_work", "Работа", "Говорить о работе и задачах.", ["formal_politeness"], "neutral"),
      unit("a2_health", "Здоровье", "Диалоги о здоровье и привычках.", ["adverbs_frequency"], "practical"),
      unit("a2_plans", "Планы", "Обсуждать планы и договоренности.", ["future_basic"], "friendly"),
      unit("a2_opinions", "Мнения", "Выражать мнение и согласие/несогласие.", ["opinions"], "neutral"),
      unit("a2_services", "Сервисы", "Звонки, записи, услуги.", ["requests"], "practical"),
      unit("a2_hobbies", "Хобби", "Обсуждать интересы.", ["comparatives"], "friendly"),
      unit("a2_media", "Медиа", "Фильмы/музыка/книги.", ["past_tense"], "friendly"),
      unit("a2_review", "Повторение", "Закрепить материал уровня A2.", ["review"], "coach"),
    ],
    B1: [
      unit("b1_future", "Будущее", "Говорить о целях и будущем.", ["future_tense"], "neutral"),
      unit("b1_opinions", "Аргументы", "Обосновывать мнение.", ["connectors"], "neutral"),
      unit("b1_workplace", "Рабочие ситуации", "Переговоры и задачи.", ["formal_register"], "practical"),
      unit("b1_services", "Документы и услуги", "Формальные обращения.", ["formal_register"], "practical"),
      unit("b1_education", "Учеба", "Планы обучения и навыки.", ["modals"], "neutral"),
      unit("b1_news", "Новости", "Обсуждать новости и события.", ["reported_speech_basic"], "neutral"),
      unit("b1_society", "Общество", "Теми общества и культуры.", ["connectors"], "neutral"),
      unit("b1_conflicts", "Конфликты", "Обсуждать проблемы и решения.", ["conditionals_basic"], "neutral"),
      unit("b1_travel", "Путешествия+", "Сложные сценарии поездок.", ["conditionals_basic"], "practical"),
      unit("b1_health", "Здоровье+", "Советы и объяснения.", ["modals"], "practical"),
      unit("b1_projects", "Проекты", "Планирование и отчет.", ["sequencers"], "neutral"),
      unit("b1_review", "Повторение", "Закрепить материал уровня B1.", ["review"], "coach"),
    ],
    B2: [
      unit("b2_argumentation", "Аргументация", "Строить сложные аргументы.", ["argumentation"], "neutral"),
      unit("b2_formal", "Формальный стиль", "Письма и официальные разговоры.", ["formal_register"], "formal"),
      unit("b2_debate", "Дебаты", "Дискуссии и контраргументы.", ["connectors_advanced"], "neutral"),
      unit("b2_persuasion", "Убеждение", "Просить, убеждать, влиять.", ["rhetoric"], "neutral"),
      unit("b2_negotiation", "Переговоры", "Торг и переговоры.", ["conditionals_advanced"], "formal"),
      unit("b2_reports", "Отчеты", "Суммировать и анализировать.", ["summarization"], "formal"),
      unit("b2_culture", "Культура", "Обсуждать культурные темы.", ["nuance"], "friendly"),
      unit("b2_science", "Наука", "Пояснять сложные идеи.", ["explanations"], "neutral"),
      unit("b2_work", "Карьера", "Стратегии и развитие.", ["formal_register"], "formal"),
      unit("b2_media", "Медиа+", "Критика и обзоры.", ["nuance"], "neutral"),
      unit("b2_society", "Социальные темы", "Точки зрения и тон.", ["nuance"], "neutral"),
      unit("b2_review", "Повторение", "Закрепить материал уровня B2.", ["review"], "coach"),
    ],
    C1: [
      unit("c1_idioms", "Идиомы", "Понимать и использовать идиомы.", ["idioms"], "friendly"),
      unit("c1_nuance", "Нюанс", "Оттенки смысла и интонации.", ["nuance"], "neutral"),
      unit("c1_register", "Регистр", "Коллоквиальный vs формальный.", ["register"], "neutral"),
      unit("c1_humor", "Юмор", "Понимать юмор и сарказм.", ["pragmatics"], "friendly"),
      unit("c1_persuasion", "Риторика", "Убедительная речь.", ["rhetoric"], "formal"),
      unit("c1_interviews", "Интервью", "Сложные вопросы/ответы.", ["pragmatics"], "neutral"),
      unit("c1_writing", "Письмо", "Стиль и структура текста.", ["writing"], "formal"),
      unit("c1_discourse", "Дискурс", "Длинные дискуссии и дебаты.", ["connectors_advanced"], "neutral"),
      unit("c1_culture", "Культура+", "Подтексты и контекст.", ["nuance"], "friendly"),
      unit("c1_work", "Проф. общение", "Высокий уровень формальности.", ["formal_register"], "formal"),
      unit("c1_society", "Общество+", "Сложные темы и тональность.", ["nuance"], "neutral"),
      unit("c1_review", "Повторение", "Закрепить материал уровня C1.", ["review"], "coach"),
    ],
  };

