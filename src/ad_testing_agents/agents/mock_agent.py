"""Mock agent for testing without API calls"""

import random
from datetime import datetime

from ..models import AdOffer, AgentResponse, Decision, EmotionType, Persona


class MockAgent:
    """Mock agent that generates realistic fake responses for testing"""

    def __init__(self, persona: Persona):
        self.persona = persona

    async def evaluate_offer(self, offer: AdOffer) -> AgentResponse:
        """Generate mock response based on persona characteristics"""

        # Determine emotion based on persona traits and offer
        emotion = self._determine_emotion(offer)
        intensity = random.uniform(0.6, 0.95)

        # Determine decision based on persona
        decision = self._determine_decision(offer)
        confidence = random.uniform(0.7, 0.9)

        # Generate reasoning
        first_impression = self._generate_first_impression(offer)
        detailed_reasoning = self._generate_reasoning(offer)

        # Perceived value (0-10)
        perceived_value = self._calculate_perceived_value(offer)

        # Alignment with values
        alignment = {
            value: random.uniform(0.3, 0.9) for value in self.persona.values[:3]
        }

        # Pain points addressed
        pain_points_addressed = random.sample(
            self.persona.pain_points,
            min(2, len(self.persona.pain_points))
        )

        # Objections
        objections = self._generate_objections(offer)

        # What would convince
        what_would_convince = self._generate_what_would_convince()

        return AgentResponse(
            persona_id=self.persona.id,
            persona_name=f"{self.persona.name} ({self.persona.description})",
            test_id=offer.test_id or f"test-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            offer_headline=offer.headline,
            primary_emotion=emotion,
            emotion_intensity=intensity,
            emotional_reasoning=f"Как {self.persona.name}, я чувствую {emotion.value} потому что {self._emotion_reason(offer)}",
            first_impression=first_impression,
            detailed_reasoning=detailed_reasoning,
            perceived_value=perceived_value,
            decision=decision,
            confidence_score=confidence,
            alignment_with_values=alignment,
            pain_points_addressed=pain_points_addressed,
            objections=objections,
            what_would_convince=what_would_convince,
            timestamp=datetime.now(),
            model_used="mock",
            response_time_ms=random.randint(100, 300),
        )

    def _determine_emotion(self, offer: AdOffer) -> EmotionType:
        """Determine emotion based on persona and offer"""
        # Price-sensitive personas (students) get excited by discounts
        if "student" in self.persona.id or "low" in str(self.persona.income_level):
            if offer.discount or (offer.price and "990" in offer.price):
                return EmotionType.EXCITED
            else:
                return EmotionType.SKEPTICAL

        # Skeptics are always skeptical
        if "skeptic" in self.persona.id:
            return EmotionType.SKEPTICAL

        # Business women are interested but analytical
        if "business" in self.persona.id or "high" in str(self.persona.income_level):
            return EmotionType.INTERESTED

        # Default: curious
        return EmotionType.CURIOUS

    def _determine_decision(self, offer: AdOffer) -> Decision:
        """Determine decision based on persona"""
        if "skeptic" in self.persona.id:
            return Decision.PROBABLY_NOT

        if "impulsive" in self.persona.id:
            return Decision.STRONG_YES

        if offer.discount:
            return Decision.MAYBE_YES

        return Decision.NEUTRAL

    def _calculate_perceived_value(self, offer: AdOffer) -> float:
        """Calculate perceived value score"""
        base_value = 5.0

        if offer.discount:
            base_value += 2.0

        if offer.price and any(x in offer.price.lower() for x in ["990", "1000", "1500"]):
            base_value += 1.5

        if "skeptic" in self.persona.id:
            base_value -= 2.0

        return min(10.0, max(0.0, base_value + random.uniform(-1, 1)))

    def _generate_first_impression(self, offer: AdOffer) -> str:
        """Generate first impression"""
        impressions = [
            f"Интересно, но {random.choice(['нужно подумать', 'есть сомнения', 'хочу узнать больше'])}",
            f"Звучит {random.choice(['заманчиво', 'неплохо', 'привлекательно'])}",
            f"Хм, {random.choice(['не уверена', 'надо проверить отзывы', 'слишком дешево?'])}",
        ]
        return random.choice(impressions)

    def _generate_reasoning(self, offer: AdOffer) -> str:
        """Generate detailed reasoning"""
        return f"""Анализирую оффер как {self.persona.name}:

1. **Цена**: {offer.price or 'Не указана'} - {'доступно для меня' if 'low' in str(self.persona.income_level) else 'приемлемо'}
2. **Скидка**: {offer.discount or 'Нет'} - {'мотивирует попробовать' if offer.discount else 'хотелось бы увидеть акцию'}
3. **Ценность**: Соответствует моим потребностям на {random.randint(60, 85)}%
4. **Триггеры**: {'Попадает в мои позитивные триггеры' if offer.discount else 'Не все триггеры задействованы'}
"""

    def _emotion_reason(self, offer: AdOffer) -> str:
        """Generate emotion reasoning"""
        reasons = [
            "это соответствует моим ожиданиям по цене",
            "я искала что-то подобное",
            "нужно больше информации",
            "слишком хорошо чтобы быть правдой",
        ]
        return random.choice(reasons)

    def _generate_objections(self, offer: AdOffer) -> list[str]:
        """Generate objections"""
        all_objections = [
            "Не понятно какое оборудование используется",
            "Нет информации о квалификации мастеров",
            "Слишком низкая цена - возможно низкое качество",
            "Нет отзывов клиентов",
            "Не указан адрес студии",
            "Непонятно сколько процедур потребуется",
        ]
        return random.sample(all_objections, random.randint(1, 3))

    def _generate_what_would_convince(self) -> str:
        """Generate what would convince"""
        options = [
            "Отзывы реальных клиентов с фото до/после",
            "Информация о сертификации и опыте мастеров",
            "Гарантия возврата денег если не понравится",
            "Подробная консультация перед процедурой",
            "Прозрачная информация о количестве необходимых сеансов",
        ]
        return random.choice(options)

    def __repr__(self) -> str:
        return f"MockAgent(persona={self.persona.id})"
