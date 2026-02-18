"""Pydantic models for persona definitions"""

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class AgeGroup(str, Enum):
    """Age group categories"""

    TEEN = "18-23"
    YOUNG_ADULT = "24-29"
    ADULT = "30-39"
    MIDDLE_AGED = "40-54"
    SENIOR = "55+"


class IncomeLevel(str, Enum):
    """Income level categories (в рублях/месяц)"""

    LOW = "low"  # < 50k RUB
    MEDIUM = "medium"  # 50-150k RUB
    HIGH = "high"  # 150-300k RUB
    LUXURY = "luxury"  # 300k+ RUB


class PersonalityTrait(str, Enum):
    """Personality traits"""

    ANALYTICAL = "analytical"
    EMOTIONAL = "emotional"
    SKEPTICAL = "skeptical"
    IMPULSIVE = "impulsive"
    CAUTIOUS = "cautious"
    OPTIMISTIC = "optimistic"
    PRACTICAL = "practical"
    STATUS_SEEKING = "status_seeking"


class Persona(BaseModel):
    """Synthetic user persona for ad testing"""

    id: str = Field(..., description="Unique persona identifier (e.g., 'anna-student')")
    name: str = Field(..., description="Human-readable persona name (e.g., 'Анна')")
    description: str = Field(..., description="Brief description (e.g., 'Активная студентка')")

    # Demographics
    age_group: AgeGroup
    income_level: IncomeLevel
    occupation: str = Field(..., description="Occupation (e.g., 'Студентка МГУ')")
    location: str = Field(default="Москва", description="City/district")

    # Psychographics
    personality_traits: List[PersonalityTrait] = Field(
        min_length=1, max_length=3, description="Key personality traits"
    )
    values: List[str] = Field(
        ...,
        description="Core values (e.g., 'красота', 'экономия', 'уверенность')",
        min_length=2,
    )
    pain_points: List[str] = Field(
        ..., description="Problems/frustrations this persona experiences", min_length=2
    )
    goals: List[str] = Field(
        ..., description="What this persona wants to achieve", min_length=2
    )

    # Behavioral patterns
    triggers: Dict[str, str] = Field(
        ...,
        description="Emotional triggers (positive/negative keywords)",
        examples=[{"positive": "скидка, отзывы", "negative": "дорого, сложно"}],
    )
    decision_factors: List[str] = Field(
        ...,
        description="Key factors in purchase decisions (e.g., 'цена', 'локация', 'отзывы')",
        min_length=2,
    )

    # Context
    background_story: str = Field(
        ..., description="Brief narrative background for authentic responses (2-3 sentences)"
    )

    # Metadata
    created_at: Optional[str] = None
    custom: bool = Field(default=False, description="User-defined persona (vs default)")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "anna-student",
                "name": "Анна",
                "description": "Активная студентка",
                "age_group": "18-23",
                "income_level": "low",
                "occupation": "Студентка МГУ, 3 курс",
                "location": "Москва, метро Университет",
                "personality_traits": ["impulsive", "optimistic"],
                "values": ["красота", "уверенность", "экономия времени"],
                "pain_points": [
                    "Бритьё каждый день отнимает время",
                    "Раздражение кожи после бритья",
                    "Траты на бритвы и воск",
                ],
                "goals": [
                    "Выглядеть ухоженно без усилий",
                    "Сэкономить время на утренние сборы",
                    "Чувствовать уверенность в себе",
                ],
                "triggers": {
                    "positive": "скидки для студентов, рассрочка, первая процедура -50%, отзывы подруг",
                    "negative": "дорого, долго, больно, нужен кредит",
                },
                "decision_factors": [
                    "Цена (главное!)",
                    "Локация рядом с универом или домом",
                    "Безболезненность процедуры",
                    "Отзывы знакомых",
                ],
                "background_story": "Анна — студентка 3 курса МГУ, живёт в общежитии. Подрабатывает репетитором, денег в обрез. Видит рекламу лазерной эпиляции везде, подруги уже сделали. Хочет попробовать, но боится потратить деньги зря.",
                "custom": False,
            }
        }
