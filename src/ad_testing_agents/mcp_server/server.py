"""MCP Server for Ad Testing Agents"""

import asyncio
import json
from typing import Any

from mcp.server import Server
from mcp.types import Resource, Tool, TextContent

from ..models import AdOffer, Persona
from ..personas import load_all_personas


# Global state
_personas_cache: list[Persona] | None = None


def get_personas() -> list[Persona]:
    """Get cached personas"""
    global _personas_cache
    if _personas_cache is None:
        _personas_cache = load_all_personas()
    return _personas_cache


# Create MCP server
app = Server("ad-testing-agents")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available MCP tools"""
    return [
        Tool(
            name="list_personas",
            description="Получить список всех доступных персон для тестирования офферов",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        Tool(
            name="get_persona",
            description="Получить детальную информацию о конкретной персоне",
            inputSchema={
                "type": "object",
                "properties": {
                    "persona_id": {
                        "type": "string",
                        "description": "ID персоны (например: anna-student)",
                    }
                },
                "required": ["persona_id"],
            },
        ),
        Tool(
            name="evaluate_offer",
            description="Протестировать рекламный оффер от лица одной персоны. Возвращает эмоции, reasoning, decision score.",
            inputSchema={
                "type": "object",
                "properties": {
                    "persona_id": {
                        "type": "string",
                        "description": "ID персоны",
                    },
                    "headline": {
                        "type": "string",
                        "description": "Заголовок оффера",
                    },
                    "body": {
                        "type": "string",
                        "description": "Текст оффера",
                    },
                    "call_to_action": {
                        "type": "string",
                        "description": "Призыв к действию",
                    },
                    "price": {
                        "type": "string",
                        "description": "Цена (опционально)",
                    },
                    "discount": {
                        "type": "string",
                        "description": "Скидка (опционально)",
                    },
                },
                "required": ["persona_id", "headline", "body", "call_to_action"],
            },
        ),
        Tool(
            name="test_offer_batch",
            description="Протестировать оффер против нескольких персон одновременно",
            inputSchema={
                "type": "object",
                "properties": {
                    "persona_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Список ID персон",
                    },
                    "headline": {"type": "string"},
                    "body": {"type": "string"},
                    "call_to_action": {"type": "string"},
                    "price": {"type": "string"},
                    "discount": {"type": "string"},
                },
                "required": ["persona_ids", "headline", "body", "call_to_action"],
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle MCP tool calls"""

    if name == "list_personas":
        personas = get_personas()
        result = [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "age_group": p.age_group.value,
                "income_level": p.income_level.value,
            }
            for p in personas
        ]
        return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

    elif name == "get_persona":
        persona_id = arguments["persona_id"]
        personas = get_personas()
        persona = next((p for p in personas if p.id == persona_id), None)

        if not persona:
            return [TextContent(type="text", text=json.dumps({"error": f"Persona {persona_id} not found"}))]

        return [TextContent(type="text", text=persona.model_dump_json(indent=2))]

    elif name == "evaluate_offer":
        # This will be delegated to Claude Code (the AI assistant)
        # The AI will simulate the persona's response
        persona_id = arguments["persona_id"]
        personas = get_personas()
        persona = next((p for p in personas if p.id == persona_id), None)

        if not persona:
            return [TextContent(type="text", text=json.dumps({"error": f"Persona {persona_id} not found"}))]

        # Create offer
        offer = AdOffer(
            headline=arguments["headline"],
            body=arguments["body"],
            call_to_action=arguments["call_to_action"],
            price=arguments.get("price"),
            discount=arguments.get("discount"),
        )

        # Build prompt for Claude Code to simulate this persona
        prompt = f"""Ты — {persona.name}, {persona.description}.

# ТВОЯ ЛИЧНОСТЬ

Возраст: {persona.age_group.value} лет
Доход: {persona.income_level.value}
Профессия: {persona.occupation}
Локация: {persona.location}

## Твои черты характера
{', '.join(trait.value for trait in persona.personality_traits)}

## Твои ценности
{chr(10).join(f'- {v}' for v in persona.values)}

## Твои боли и проблемы
{chr(10).join(f'- {p}' for p in persona.pain_points)}

## Твои цели
{chr(10).join(f'- {g}' for g in persona.goals)}

## Триггеры
- Позитивные: {persona.triggers.get('positive', '')}
- Негативные: {persona.triggers.get('negative', '')}

## Факторы принятия решения
{chr(10).join(f'- {f}' for f in persona.decision_factors)}

## Твоя история
{persona.background_story}

---

# ЗАДАНИЕ

Тебе показывают рекламный оффер студии лазерной эпиляции. Оцени его как {persona.name}.

**Оффер:**
Заголовок: {offer.headline}
Текст: {offer.body}
Призыв к действию: {offer.call_to_action}
{f'Цена: {offer.price}' if offer.price else ''}
{f'Скидка: {offer.discount}' if offer.discount else ''}

---

# ФОРМАТ ОТВЕТА

Верни JSON со следующей структурой:

{{
  "primary_emotion": "excited|interested|skeptical|annoyed|indifferent|curious",
  "emotion_intensity": 0.8,
  "emotional_reasoning": "Почему ты чувствуешь эту эмоцию",
  "first_impression": "Первая мысль когда увидел оффер",
  "detailed_reasoning": "Подробный анализ оффера",
  "perceived_value": 7.5,
  "decision": "strong_yes|maybe_yes|neutral|probably_not|strong_no",
  "confidence_score": 0.85,
  "alignment_with_values": {{"ценность1": 0.9, "ценность2": 0.3}},
  "pain_points_addressed": ["боль1", "боль2"],
  "objections": ["возражение1", "возражение2"],
  "what_would_convince": "Что заставило бы тебя точно купить"
}}

ВАЖНО: Отвечай честно от первого лица ("я", "мне", "хочу"). Будь собой со всеми сомнениями.
"""

        # Return prompt for AI to process
        # The actual evaluation will be done by Claude Code
        return [TextContent(
            type="text",
            text=json.dumps({
                "action": "simulate_persona",
                "persona_id": persona_id,
                "persona_name": f"{persona.name} ({persona.description})",
                "prompt": prompt,
                "offer": offer.model_dump(),
            }, ensure_ascii=False, indent=2)
        )]

    elif name == "test_offer_batch":
        # Batch evaluation
        persona_ids = arguments["persona_ids"]
        personas = get_personas()
        selected_personas = [p for p in personas if p.id in persona_ids]

        offer = AdOffer(
            headline=arguments["headline"],
            body=arguments["body"],
            call_to_action=arguments["call_to_action"],
            price=arguments.get("price"),
            discount=arguments.get("discount"),
        )

        # Return batch request
        return [TextContent(
            type="text",
            text=json.dumps({
                "action": "simulate_personas_batch",
                "persona_count": len(selected_personas),
                "personas": [{"id": p.id, "name": p.name} for p in selected_personas],
                "offer": offer.model_dump(),
                "note": "Call evaluate_offer for each persona"
            }, ensure_ascii=False, indent=2)
        )]

    return [TextContent(type="text", text=json.dumps({"error": f"Unknown tool: {name}"}))]


@app.list_resources()
async def list_resources() -> list[Resource]:
    """List available resources"""
    personas = get_personas()
    return [
        Resource(
            uri=f"persona://{p.id}",
            name=f"{p.name} — {p.description}",
            mimeType="application/json",
            description=f"Персона: {p.name}, {p.age_group.value} лет, {p.income_level.value} доход",
        )
        for p in personas
    ]


@app.read_resource()
async def read_resource(uri: str) -> str:
    """Read resource content"""
    if uri.startswith("persona://"):
        persona_id = uri.replace("persona://", "")
        personas = get_personas()
        persona = next((p for p in personas if p.id == persona_id), None)

        if persona:
            return persona.model_dump_json(indent=2)

        return json.dumps({"error": f"Persona {persona_id} not found"})

    return json.dumps({"error": f"Unknown resource: {uri}"})


if __name__ == "__main__":
    import mcp.server.stdio

    async def main():
        async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
            await app.run(
                read_stream,
                write_stream,
                app.create_initialization_options(),
            )

    asyncio.run(main())
