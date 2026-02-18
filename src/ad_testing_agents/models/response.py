"""Pydantic models for agent responses"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class EmotionType(str, Enum):
    """Emotional reactions to ads"""

    EXCITED = "excited"  # Воодушевление, хочу!
    INTERESTED = "interested"  # Интересно, расскажите больше
    NEUTRAL = "neutral"  # Спокойно, без эмоций
    SKEPTICAL = "skeptical"  # Сомневаюсь, не верю
    ANNOYED = "annoyed"  # Раздражает
    OFFENDED = "offended"  # Оскорбительно
    CURIOUS = "curious"  # Любопытно
    HOPEFUL = "hopeful"  # Надежда (на решение проблемы)


class Decision(str, Enum):
    """Decision about engaging with the offer"""

    STRONG_YES = "strong_yes"  # Точно запишусь/куплю
    MAYBE_YES = "maybe_yes"  # Интересно, нужна доп информация
    NEUTRAL = "neutral"  # Безразлично
    PROBABLY_NOT = "probably_not"  # Скорее нет
    STRONG_NO = "strong_no"  # Точно нет


class AgentResponse(BaseModel):
    """Structured agent response to an ad offer"""

    # Identity
    persona_id: str
    persona_name: str

    # Offer reference
    test_id: str
    offer_headline: str

    # Emotional response
    primary_emotion: EmotionType
    emotion_intensity: float = Field(
        ..., ge=0.0, le=1.0, description="Интенсивность эмоции (0=слабая, 1=сильная)"
    )
    emotional_reasoning: str = Field(
        ..., description="Почему такая эмоция? Что вызвало?"
    )

    # Cognitive response
    first_impression: str = Field(..., description="Первое впечатление (1-2 предложения)")
    detailed_reasoning: str = Field(
        ..., description="Детальный анализ оффера (3-5 предложений)"
    )
    perceived_value: float = Field(
        ..., ge=0.0, le=10.0, description="Воспринимаемая ценность (0=нет ценности, 10=супер)"
    )

    # Decision
    decision: Decision
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Уверенность в решении (0=неуверен, 1=точно)"
    )

    # Segmentation insights
    alignment_with_values: Dict[str, float] = Field(
        ...,
        description="Насколько оффер соответствует ценностям персоны (ценность: score 0-1)",
    )
    pain_points_addressed: List[str] = Field(
        default_factory=list, description="Какие боли решает этот оффер?"
    )
    objections: List[str] = Field(
        default_factory=list, description="Возражения и сомнения"
    )

    # Improvement suggestions
    what_would_convince: Optional[str] = Field(
        None, description="Что убедило бы персону сказать 'да'?"
    )

    # Metadata
    timestamp: datetime = Field(default_factory=datetime.now)
    model_used: str = Field(default="claude-sonnet-4-5")
    response_time_ms: Optional[int] = None

    class Config:
        json_schema_extra = {
            "example": {
                "persona_id": "anna-student",
                "persona_name": "Анна (Активная студентка)",
                "test_id": "test-001",
                "offer_headline": "Лазерная эпиляция — первая процедура 990₽",
                "primary_emotion": "excited",
                "emotion_intensity": 0.75,
                "emotional_reasoning": "Это именно то, что мне нужно! Давно хотела попробовать, но боялась цены. 990₽ — это доступно даже для меня!",
                "first_impression": "Вау, такая низкая цена! Наконец-то можно попробовать без больших трат.",
                "detailed_reasoning": "Оффер сразу цепляет ценой — 990₽ против обычных 3500₽. Это укладывается в мой бюджет. Меня привлекает обещание 'навсегда забыть о бритье' — это решило бы мою проблему с ежедневным бритьём. Смущает только то, что это первая процедура, а нужен курс. Но как тест-драйв — отлично!",
                "perceived_value": 8.0,
                "decision": "strong_yes",
                "confidence_score": 0.85,
                "alignment_with_values": {
                    "красота": 0.9,
                    "уверенность": 0.85,
                    "экономия времени": 0.95,
                },
                "pain_points_addressed": [
                    "Бритьё каждый день отнимает время",
                    "Раздражение кожи после бритья",
                ],
                "objections": [
                    "Нужен курс процедур — сколько всего будет стоить?",
                    "Где находится студия — далеко ли от универа?",
                    "Это действительно безболезненно?",
                ],
                "what_would_convince": "Увидеть полную стоимость курса с рассрочкой 0% и локацию студии рядом с метро Университет",
            }
        }
