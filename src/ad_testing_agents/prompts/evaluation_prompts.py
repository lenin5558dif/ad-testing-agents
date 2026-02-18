"""Evaluation prompts для оценки рекламных офферов"""

from ..models import AdOffer, Persona


def generate_evaluation_prompt(offer: AdOffer, persona: Persona) -> str:
    """
    Генерирует prompt для оценки оффера персоной.

    Args:
        offer: Рекламный оффер
        persona: Персона которая оценивает

    Returns:
        Evaluation prompt
    """

    # Форматируем оффер для показа
    offer_text = offer.to_display_text()

    # Извлекаем ценности для проверки alignment
    values_list = ", ".join([f'"{v}"' for v in persona.values])

    evaluation_prompt = f"""Ты только что увидел(а) это рекламное объявление:

---
{offer_text}
---

Ответь на это объявление как {persona.name}, ИСКРЕННЕ и ЧЕСТНО.

Подумай пошагово:

1. **Первая эмоциональная реакция**
   - Что ты чувствуешь когда видишь это? (воодушевление, скепсис, раздражение, любопытство?)
   - Насколько сильна эта эмоция? (слабая, средняя, сильная)
   - Почему именно так отреагировал(а)?

2. **Анализ оффера**
   - Что цепляет? Что отталкивает?
   - Решает ли это твои боли: {', '.join(persona.pain_points[:2])}?
   - Соответствует ли твоим ценностям: {', '.join(persona.values[:3])}?
   - Какие есть сомнения и возражения?

3. **Решение**
   - Запишешься ли ты? (точно да / скорее да / может быть / скорее нет / точно нет)
   - Насколько уверен(а) в своём решении?
   - Что могло бы убедить тебя сказать "да"?

Верни ответ в формате JSON:

{{
  "primary_emotion": "excited|interested|neutral|skeptical|annoyed|offended|curious|hopeful",
  "emotion_intensity": 0.0-1.0,
  "emotional_reasoning": "Почему такая эмоция? 2-3 предложения от первого лица",

  "first_impression": "Первое впечатление, 1-2 предложения",
  "detailed_reasoning": "Детальный анализ оффера, 3-5 предложений. Что работает, что нет, почему",
  "perceived_value": 0.0-10.0,

  "decision": "strong_yes|maybe_yes|neutral|probably_not|strong_no",
  "confidence_score": 0.0-1.0,

  "alignment_with_values": {{
{chr(10).join([f'    "{v}": 0.0-1.0,' for v in persona.values])}
  }},
  "pain_points_addressed": ["список болей которые решает оффер"],
  "objections": ["список возражений и сомнений"],

  "what_would_convince": "Что убедило бы тебя? Опционально, можно null"
}}

ВАЖНО:
- Говори от первого лица ("я", "мне", "хочу")
- Будь честным — если не нравится, скажи почему
- Ссылайся на свою ситуацию и опыт из твоей истории
- JSON должен быть валидным (без trailing commas)
"""

    return evaluation_prompt
