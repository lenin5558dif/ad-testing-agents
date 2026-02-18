"""Comparison page - view batch test results"""

import json
import sys
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

st.set_page_config(page_title="Сравнение Офферов", page_icon="📊", layout="wide")

st.title("📊 Сравнение Офферов")
st.markdown("Результаты пакетного тестирования всех офферов на всех персонах")

# Load latest results
results_dir = Path(__file__).parent.parent.parent / "data" / "results"

if not results_dir.exists():
    st.warning("📁 Нет результатов тестирования. Запустите `python scripts/run_batch_test.py`")
    st.stop()

result_files = sorted(results_dir.glob("batch_test_*.json"), reverse=True)

if not result_files:
    st.warning("📁 Нет результатов тестирования. Запустите `python scripts/run_batch_test.py`")
    st.stop()

# File selector
selected_file = st.selectbox(
    "Выберите результаты теста",
    options=result_files,
    format_func=lambda x: f"{x.stem} ({x.stat().st_size // 1024} KB)"
)

# Load data
with open(selected_file) as f:
    data = json.load(f)

metadata = data["metadata"]
results = data["results"]

# Show metadata
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Дата теста", metadata["test_date"][:10])
with col2:
    st.metric("Офферов", metadata["num_offers"])
with col3:
    st.metric("Персон", metadata["num_personas"])
with col4:
    st.metric("Всего тестов", metadata["num_results"])

st.divider()

# Convert to DataFrame
df = pd.DataFrame(results)

# Overall statistics
st.header("📈 Общая статистика")

col1, col2, col3, col4 = st.columns(4)

with col1:
    conversion_rate = (
        df[df["decision"].isin(["strong_yes", "maybe_yes"])].shape[0] / len(df)
    )
    st.metric("Конверсия", f"{conversion_rate:.1%}")

with col2:
    avg_value = df["perceived_value"].mean()
    st.metric("Средняя ценность", f"{avg_value:.1f}/10")

with col3:
    avg_confidence = df["confidence_score"].mean()
    st.metric("Средняя уверенность", f"{avg_confidence:.0%}")

with col4:
    avg_emotion_intensity = df["emotion_intensity"].mean()
    st.metric("Интенсивность эмоций", f"{avg_emotion_intensity:.0%}")

st.divider()

# Offer comparison
st.header("🏆 Рейтинг офферов")

# Aggregate by offer
offer_stats = df.groupby("offer_headline").agg({
    "perceived_value": "mean",
    "confidence_score": "mean",
    "decision": lambda x: (x.isin(["strong_yes", "maybe_yes"])).sum() / len(x),
    "emotion_intensity": "mean"
}).round(2)

offer_stats.columns = ["Ср. ценность", "Ср. уверенность", "Конверсия", "Эмоции"]
offer_stats = offer_stats.sort_values("Ср. ценность", ascending=False)

# Display as table with ranking
offer_stats_display = offer_stats.copy()
offer_stats_display["🏅 Место"] = range(1, len(offer_stats_display) + 1)
offer_stats_display = offer_stats_display[["🏅 Место", "Ср. ценность", "Конверсия", "Ср. уверенность", "Эмоции"]]

st.dataframe(
    offer_stats_display,
    use_container_width=True,
    height=400
)

st.divider()

# Visualizations
st.header("📊 Визуализация")

tab1, tab2, tab3, tab4 = st.tabs(["Ценность по офферам", "Эмоции", "Решения", "Детали"])

with tab1:
    st.subheader("Средняя воспринимаемая ценность по офферам")

    fig = px.bar(
        offer_stats.reset_index(),
        x="offer_headline",
        y="Ср. ценность",
        color="Конверсия",
        color_continuous_scale="RdYlGn",
        labels={"offer_headline": "Оффер", "Ср. ценность": "Средняя ценность (0-10)"},
        height=500
    )
    fig.update_xaxes(tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)

with tab2:
    st.subheader("Распределение эмоций по офферам")

    emotion_by_offer = pd.crosstab(
        df["offer_headline"],
        df["primary_emotion"],
        normalize="index"
    ) * 100

    fig = px.imshow(
        emotion_by_offer.T,
        labels=dict(x="Оффер", y="Эмоция", color="Процент (%)"),
        color_continuous_scale="YlGnBu",
        aspect="auto",
        height=500
    )
    fig.update_xaxes(tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)

with tab3:
    st.subheader("Распределение решений")

    decision_counts = df.groupby(["offer_headline", "decision"]).size().reset_index(name="count")

    fig = px.bar(
        decision_counts,
        x="offer_headline",
        y="count",
        color="decision",
        labels={"offer_headline": "Оффер", "count": "Количество", "decision": "Решение"},
        height=500,
        color_discrete_map={
            "strong_yes": "#22c55e",
            "maybe_yes": "#84cc16",
            "neutral": "#94a3b8",
            "probably_not": "#f97316",
            "strong_no": "#ef4444"
        }
    )
    fig.update_xaxes(tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)

with tab4:
    st.subheader("Детальное сравнение")

    # Radar chart for top 3 offers
    top_3_offers = offer_stats.head(3).index.tolist()

    top_3_data = []
    for offer in top_3_offers:
        offer_data = df[df["offer_headline"] == offer]
        top_3_data.append({
            "Оффер": offer[:40] + "...",
            "Ценность": offer_data["perceived_value"].mean(),
            "Конверсия": (offer_data["decision"].isin(["strong_yes", "maybe_yes"])).sum() / len(offer_data) * 10,
            "Уверенность": offer_data["confidence_score"].mean() * 10,
            "Эмоции": offer_data["emotion_intensity"].mean() * 10
        })

    fig = go.Figure()

    for item in top_3_data:
        fig.add_trace(go.Scatterpolar(
            r=[item["Ценность"], item["Конверсия"], item["Уверенность"], item["Эмоции"]],
            theta=["Ценность", "Конверсия x10", "Уверенность x10", "Эмоции x10"],
            fill='toself',
            name=item["Оффер"]
        ))

    fig.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0, 10])),
        showlegend=True,
        height=500
    )

    st.plotly_chart(fig, use_container_width=True)

st.divider()

# Persona insights
st.header("👥 Анализ по персонам")

persona_stats = df.groupby("persona_name").agg({
    "perceived_value": "mean",
    "decision": lambda x: (x.isin(["strong_yes", "maybe_yes"])).sum() / len(x)
}).round(2)

persona_stats.columns = ["Ср. ценность", "Конверсия"]
persona_stats = persona_stats.sort_values("Конверсия", ascending=False)

col1, col2 = st.columns(2)

with col1:
    st.subheader("Средняя ценность по персонам")
    fig = px.bar(
        persona_stats.reset_index(),
        x="persona_name",
        y="Ср. ценность",
        color="Ср. ценность",
        color_continuous_scale="Blues",
        height=400
    )
    fig.update_xaxes(tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)

with col2:
    st.subheader("Конверсия по персонам")
    fig = px.bar(
        persona_stats.reset_index(),
        x="persona_name",
        y="Конверсия",
        color="Конверсия",
        color_continuous_scale="Greens",
        height=400
    )
    fig.update_xaxes(tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)

st.divider()

# Detailed results explorer
st.header("🔍 Детальные результаты")

selected_offer = st.selectbox(
    "Выберите оффер для детального просмотра",
    options=df["offer_headline"].unique()
)

offer_results = df[df["offer_headline"] == selected_offer]

for _, result in offer_results.iterrows():
    with st.expander(f"{result['persona_name']} — {result['primary_emotion'].title()} ({result['emotion_intensity']:.0%}) | {result['decision'].replace('_', ' ').title()}"):
        col1, col2 = st.columns([2, 1])

        with col1:
            st.markdown(f"**Первое впечатление:** {result['first_impression']}")
            st.markdown(f"**Reasoning:** {result['detailed_reasoning']}")

            if result['objections']:
                st.markdown("**⚠️ Возражения:**")
                for obj in result['objections']:
                    st.markdown(f"- {obj}")

        with col2:
            st.metric("Ценность", f"{result['perceived_value']}/10")
            st.metric("Решение", result['decision'].replace('_', ' ').title())
            st.metric("Уверенность", f"{result['confidence_score']:.0%}")

            if result['what_would_convince']:
                st.info(f"💡 **Что убедит:** {result['what_would_convince']}")

st.divider()

# Export
st.header("📥 Экспорт")

col1, col2 = st.columns(2)

with col1:
    if st.button("📥 Скачать CSV"):
        csv = df.to_csv(index=False)
        st.download_button(
            label="💾 Сохранить CSV",
            data=csv,
            file_name=f"results_{selected_file.stem}.csv",
            mime="text/csv"
        )

with col2:
    if st.button("📥 Скачать JSON"):
        json_str = json.dumps(results, ensure_ascii=False, indent=2)
        st.download_button(
            label="💾 Сохранить JSON",
            data=json_str,
            file_name=f"results_{selected_file.stem}.json",
            mime="application/json"
        )
