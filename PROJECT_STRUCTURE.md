# Project Structure

## Overview

Ad Testing Agents — система для тестирования рекламных офферов через симуляцию 8 AI-персон.

## File Tree

```
experiments/ad-testing-agents/
├── README.md                    # Полная документация
├── QUICKSTART.md                # Быстрый старт за 3 минуты
├── PROJECT_STRUCTURE.md         # Этот файл
├── pyproject.toml               # Python dependencies (uv/pip)
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
│
├── src/ad_testing_agents/       # Main package
│   ├── __init__.py
│   ├── config.py                # Configuration management (.env loader)
│   │
│   ├── models/                  # Pydantic data models
│   │   ├── __init__.py
│   │   ├── persona.py           # Persona schema (demographics, psychographics)
│   │   ├── offer.py             # Ad offer schema
│   │   └── response.py          # Agent response schema (emotions, reasoning, decision)
│   │
│   ├── personas/                # Persona management
│   │   ├── __init__.py
│   │   ├── loader.py            # JSON loader with caching
│   │   └── defaults/            # 8 default personas (laser hair removal)
│   │       ├── anna_student.json
│   │       ├── maria_mom.json
│   │       ├── ekaterina_business.json
│   │       ├── alexey_athlete.json
│   │       ├── darya_influencer.json
│   │       ├── olga_skeptic.json
│   │       ├── natalya_mature.json
│   │       └── irina_impulsive.json
│   │
│   ├── prompts/                 # Prompt engineering
│   │   ├── __init__.py
│   │   ├── system_prompts.py    # Persona system prompts (Russian)
│   │   └── evaluation_prompts.py # Offer evaluation prompts
│   │
│   ├── agents/                  # Agent simulation
│   │   ├── __init__.py
│   │   ├── claude_agent.py      # Claude API wrapper
│   │   └── orchestrator.py      # Batch parallel execution
│   │
│   ├── analytics/               # Analytics & metrics (placeholder)
│   │   └── __init__.py
│   │
│   └── mcp_server/              # MCP server (placeholder, future)
│       └── __init__.py
│
├── dashboard/                   # Streamlit UI
│   ├── __init__.py
│   ├── app.py                   # Main dashboard app
│   ├── components/              # Reusable UI components (placeholder)
│   │   └── __init__.py
│   └── pages/                   # Multi-page support (future)
│
├── scripts/                     # Utility scripts
│   ├── start_dashboard.sh       # Launch Streamlit
│   └── test_basic.py            # Basic installation test
│
├── tests/                       # Unit tests (placeholder)
│   └── __init__.py
│
└── data/                        # Runtime data (gitignored)
    ├── results/                 # Test results (future)
    └── custom_personas/         # User-defined personas (future)
```

## Key Components

### 1. Models (`src/ad_testing_agents/models/`)

**Persona** - Synthetic user persona
- Demographics: age, income, occupation, location
- Psychographics: values, pain points, goals, triggers
- Behavioral: decision factors, personality traits

**AdOffer** - Advertisement to test
- headline, body, call_to_action
- Optional: price, discount, image_description

**AgentResponse** - Structured agent output
- Emotions: primary_emotion, intensity, reasoning
- Cognition: first_impression, detailed_reasoning, perceived_value
- Decision: decision type, confidence_score
- Segmentation: alignment_with_values, pain_points_addressed, objections

### 2. Personas (`src/ad_testing_agents/personas/`)

8 default personas for laser hair removal studios in Moscow:
1. **Anna** (student, 19-23, low income) - price-sensitive
2. **Maria** (young mom, 28-35, medium income) - time-efficient
3. **Ekaterina** (business woman, 30-40, high income) - premium
4. **Alexey** (athlete, 25-35, medium income) - male, hygiene-focused
5. **Darya** (influencer, 22-28, medium income) - Instagram-friendly
6. **Olga** (skeptic, 35-45, medium income) - trust issues
7. **Natalya** (mature woman, 45-60, medium income) - anti-age
8. **Irina** (impulsive buyer, 25-32, medium income) - FOMO-driven

### 3. Prompts (`src/ad_testing_agents/prompts/`)

**System Prompts**
- Generate persona-specific system prompts (Russian)
- Include full persona context: demographics, values, pains, triggers
- Instruct Claude to respond authentically as that persona

**Evaluation Prompts**
- Show ad offer to persona
- Request step-by-step thinking (emotion → analysis → decision)
- Return structured JSON response (validated by Pydantic)

### 4. Agents (`src/ad_testing_agents/agents/`)

**ClaudeAgent**
- Wraps Anthropic API
- Generates prompts for specific persona
- Parses structured JSON response
- Returns AgentResponse object

**AgentOrchestrator**
- Batch testing across multiple personas
- Parallel execution using asyncio.gather (8x faster)
- Error handling for individual agent failures

### 5. Dashboard (`dashboard/app.py`)

Streamlit UI:
- Persona selector (sidebar)
- Offer input form (headline, body, CTA, price, discount)
- Test button → triggers agent orchestration
- Results display:
  - Quick analytics (avg value, conversion rate, confidence)
  - Agent response cards (emotion, reasoning, decision, objections)

## Data Flow

```
1. User inputs ad offer via Streamlit UI
2. User selects personas to test
3. AgentOrchestrator creates ClaudeAgent for each persona
4. Parallel execution:
   a. Generate system prompt from persona
   b. Generate evaluation prompt with offer
   c. Call Claude API
   d. Parse JSON response
   e. Validate with Pydantic
5. Return list of AgentResponse objects
6. Dashboard displays results with analytics
```

## Configuration

Environment variables (`.env`):
- `ANTHROPIC_API_KEY` - Required
- `DEFAULT_MODEL` - Claude model (default: claude-sonnet-4-5-20250929)
- `AGENT_TIMEOUT_SECONDS` - API timeout (default: 30)
- `BATCH_PARALLEL` - Enable parallel execution (default: true)

## Performance

- **Parallel mode**: 8 personas in ~5-10 seconds
- **Sequential mode**: 8 personas in ~40-80 seconds
- **Cost**: ~$0.10-0.15 per test (8 personas × Sonnet 4.5)

## Future Extensions

- [ ] MCP Server implementation (for Claude Desktop integration)
- [ ] Export results to CSV/JSON
- [ ] A/B testing (compare multiple offers)
- [ ] Persona editor UI
- [ ] Historical tracking (SQLite)
- [ ] Advanced analytics (charts, heatmaps)
- [ ] Custom persona upload
- [ ] Multi-language support

## Development

### Setup
```bash
pip install -e .           # Install in editable mode
pip install -e ".[dev]"    # Install with dev dependencies
```

### Testing
```bash
python scripts/test_basic.py    # Basic functionality test
pytest tests/                   # Unit tests (when added)
```

### Code Quality
```bash
ruff check .                    # Linting
mypy src/                       # Type checking
```

## License

MIT
