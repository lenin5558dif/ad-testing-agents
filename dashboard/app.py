"""Streamlit dashboard for ad testing"""

import asyncio
import sys
from pathlib import Path

import streamlit as st

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ad_testing_agents.agents import test_offer
from ad_testing_agents.models import AdOffer
from ad_testing_agents.personas import load_all_personas

# Page config
st.set_page_config(
    page_title="Ad Testing Agents",
    page_icon="🤖",
    layout="wide",
)

# Emotion emoji mapping
EMOTION_EMOJI = {
    "excited": "😊",
    "interested": "🤔",
    "neutral": "😐",
    "skeptical": "🤨",
    "annoyed": "😒",
    "offended": "😠",
    "curious": "🧐",
    "hopeful": "🙏",
}

# Decision emoji mapping
DECISION_EMOJI = {
    "strong_yes": "✅",
    "maybe_yes": "❓",
    "neutral": "➖",
    "probably_not": "❌",
    "strong_no": "🚫",
}


def main():
    """Main dashboard"""

    st.title("🤖 Ad Testing Agents")
    st.markdown(
        "Тестируйте рекламные офферы студий лазерной эпиляции на 8 AI-персонах"
    )

    # Load personas
    try:
        personas = load_all_personas()
        st.success(f"✅ Загружено {len(personas)} персон")
    except Exception as e:
        st.error(f"❌ Ошибка загрузки персон: {e}")
        return

    # Sidebar: Agent type selector
    st.sidebar.header("⚙️ Настройки")

    agent_type = st.sidebar.selectbox(
        "Тип агента",
        options=["mock", "api", "claude-code"],
        index=0,
        help="mock - быстрые тестовые ответы, api - настоящий Anthropic API, claude-code - через Claude Code CLI",
    )

    if agent_type == "api":
        st.sidebar.warning("⚠️ Требуется ANTHROPIC_API_KEY в .env")
    elif agent_type == "claude-code":
        st.sidebar.info("ℹ️ Требуется установленный Claude CLI")

    # Sidebar: Persona selector
    st.sidebar.header("👥 Выберите персоны")

    selected_persona_ids = []
    for persona in personas:
        if st.sidebar.checkbox(
            f"{persona.name} — {persona.description}",
            value=True,  # All selected by default
            key=f"persona_{persona.id}",
        ):
            selected_persona_ids.append(persona.id)

    if not selected_persona_ids:
        st.warning("⚠️ Выберите хотя бы одну персону")
        return

    selected_personas = [p for p in personas if p.id in selected_persona_ids]

    # Main area: Offer input
    st.header("📝 Введите рекламный оффер")

    col1, col2 = st.columns([2, 1])

    with col1:
        headline = st.text_input(
            "Заголовок *",
            placeholder="Лазерная эпиляция — первая процедура 990₽",
        )

        body = st.text_area(
            "Текст оффера *",
            placeholder="Забудьте о бритье навсегда. Безболезненно, быстро, гарантия результата.",
            height=100,
        )

    with col2:
        cta = st.text_input(
            "Call-to-action *",
            placeholder="Записаться на процедуру",
        )

        price = st.text_input("Цена (опционально)", placeholder="990₽")

        discount = st.text_input("Скидка (опционально)", placeholder="Обычная цена 3500₽")

    # Test button
    if st.button("🚀 Протестировать оффер", type="primary", use_container_width=True):
        if not headline or not body or not cta:
            st.error("❌ Заполните обязательные поля (заголовок, текст, CTA)")
            return

        # Create offer
        offer = AdOffer(
            headline=headline,
            body=body,
            call_to_action=cta,
            price=price if price else None,
            discount=discount if discount else None,
        )

        # Run test
        with st.spinner(f"🔄 Тестируем оффер на {len(selected_personas)} персонах (режим: {agent_type})..."):
            try:
                # Run async test
                responses = asyncio.run(
                    test_offer(offer, selected_personas, agent_type=agent_type)
                )

                if not responses:
                    st.error("❌ Не удалось получить ответы от агентов")
                    return

                # Show results
                st.success(f"✅ Получено {len(responses)} ответов")

                # Quick analytics
                st.header("📊 Быстрая аналитика")

                col1, col2, col3 = st.columns(3)

                with col1:
                    avg_value = sum(r.perceived_value for r in responses) / len(responses)
                    st.metric("Средняя ценность", f"{avg_value:.1f}/10")

                with col2:
                    conversion = sum(
                        1
                        for r in responses
                        if r.decision in ["strong_yes", "maybe_yes"]
                    ) / len(responses)
                    st.metric("Конверсия", f"{conversion:.0%}")

                with col3:
                    avg_confidence = sum(r.confidence_score for r in responses) / len(
                        responses
                    )
                    st.metric("Ср. уверенность", f"{avg_confidence:.0%}")

                # Agent responses
                st.header("💬 Ответы агентов")

                for response in responses:
                    with st.expander(
                        f"{response.persona_name} — {EMOTION_EMOJI.get(response.primary_emotion, '😐')} {response.primary_emotion.title()} | {DECISION_EMOJI.get(response.decision, '➖')} {response.decision.replace('_', ' ').title()}",
                        expanded=True,
                    ):
                        # Emotion
                        st.markdown(
                            f"**Эмоция:** {EMOTION_EMOJI.get(response.primary_emotion, '😐')} {response.primary_emotion.title()} (интенсивность: {response.emotion_intensity:.0%})"
                        )
                        st.markdown(f"*{response.emotional_reasoning}*")

                        # First impression
                        st.markdown(f"**Первое впечатление:** {response.first_impression}")

                        # Detailed reasoning
                        with st.container():
                            st.markdown("**Детальный анализ:**")
                            st.write(response.detailed_reasoning)

                        # Decision
                        col1, col2 = st.columns(2)
                        with col1:
                            st.metric(
                                "Решение",
                                response.decision.replace("_", " ").title(),
                                f"{response.confidence_score:.0%} уверенность",
                            )
                        with col2:
                            st.metric("Воспринимаемая ценность", f"{response.perceived_value}/10")

                        # Pain points & objections
                        if response.pain_points_addressed:
                            st.markdown("**✅ Решает боли:**")
                            for pp in response.pain_points_addressed:
                                st.markdown(f"- {pp}")

                        if response.objections:
                            st.markdown("**⚠️ Возражения:**")
                            for obj in response.objections:
                                st.markdown(f"- {obj}")

                        # What would convince
                        if response.what_would_convince:
                            st.info(f"💡 **Что убедит:** {response.what_would_convince}")

            except Exception as e:
                st.error(f"❌ Ошибка при тестировании: {e}")
                st.exception(e)


if __name__ == "__main__":
    main()
