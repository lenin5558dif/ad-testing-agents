# Ad Testing Agents

**Test ad offers on AI personas before spending money on ads.**

Instead of running expensive campaigns to find what converts — simulate psychologically rich personas and get conversion rates, perceived value scores, objections, and "what would convince me" in seconds.

---

## Screenshots

**Main interface — enter your ad offer, select personas:**

![Main](docs/screenshot-main.png)

**Results — instant analytics across all personas:**

![Results](docs/screenshot-results.png)

**Batch comparison — 10 offers × 7 personas = 70 tests, ranked by performance:**

![Comparison](docs/screenshot-comparison.png)

---

## How it works

1. Describe your offer (headline, body, CTA, price)
2. Select personas to test against (or use all 7 defaults)
3. Each persona evaluates the offer through a 5-step analysis:
   - First impression
   - Emotional triggers
   - Pain points addressed
   - Decision criteria checklist
   - Personal experience filter
4. Get metrics per persona: emotion, decision, perceived value, objections, what would convince
5. Batch mode: compare 10+ offers simultaneously, get ranked leaderboard

---

## Personas (default set)

| Persona | Profile |
|---------|---------|
| Ekaterina | Business woman, 35, time-poor, values quality |
| Anna | Active student, 22, price-sensitive, social-driven |
| Irina | Impulsive buyer, 28, FOMO-driven, acts fast |
| Alexei | Fitness enthusiast, 30, analytical, needs proof |
| Olga | Skeptic with bad experience, 40, high objections |
| Maria | Young mom post-partum, 32, cautious, trust-focused |
| Natalya | Woman 45+, wants to look younger, quality-conscious |

Each persona has: Big Five personality model, cognitive biases, income bracket, life story, pain points, positive/negative triggers, decision factors.

---

## Stack

**Python prototype** (fully working, batteries included):
- Streamlit dashboard
- Anthropic Claude API (evaluation)
- 8 JSON persona profiles
- Batch testing with results export

**Next.js SaaS** (production-grade scaffold):
- Next.js 15 (App Router)
- PostgreSQL + Prisma ORM
- Redis + BullMQ (job queue, 5 concurrent workers)
- OpenRouter API (Gemini Flash)
- NextAuth v4 (Credentials + JWT)
- Vitest (94 unit tests) + Playwright (E2E)
- Docker Compose deployment
- Sentry error tracking
- Rate limiting (30 req/min)

---

## Quick Start (Python version)

```bash
# 1. Clone and install
git clone https://github.com/lenin5558dif/ad-testing-agents.git
cd ad-testing-agents
python3 -m venv .venv && source .venv/bin/activate
pip install -e .

# 2. Add API key
cp .env.example .env
# Edit .env: ANTHROPIC_API_KEY=sk-ant-...

# 3. Run dashboard
streamlit run dashboard/app.py
# Opens at http://localhost:8501
```

---

## Prompt quality

Prompts went through multiple evaluation iterations:

| Component | Score | What it does |
|-----------|-------|--------------|
| Persona generation | 8.3/10 | Big Five, cognitive biases, media habits, life stories |
| Offer generation | 8.8/10 | 6 copywriting frameworks (PAS, AIDA, BAB, Social Proof, Urgency, Contrarian) |
| System prompt | 9.2/10 | Behavioral framework by income/age, trait→pattern mapping |
| Evaluation prompt | 9.4/10 | 5-step CoT, calibrated scales, anti-positivity bias |

Example: generic "30% coffee discount" scores 3.5/10 (probably_not). Targeted offer hitting persona's pain points and triggers — 9.2/10 (strong_yes).

---

## Cost

- Claude Sonnet via Anthropic: ~$0.01–0.02 per evaluation
- 4 personas × 4 offers = 16 evaluations ≈ $0.15–0.30
- Gemini Flash via OpenRouter: ~$0.005 per evaluation (SaaS version)

---

## Project structure

```
ad-testing-agents/
├── src/                    # Python package
│   └── ad_testing_agents/
│       ├── agents/         # Claude, mock, orchestrator
│       ├── models/         # Offer, Persona, Response
│       ├── personas/       # 8 JSON persona profiles
│       └── prompts/        # Evaluation & system prompts
├── dashboard/              # Streamlit UI
├── data/
│   ├── test_offers.json    # 10 sample offers
│   └── results/            # Test results (gitignored)
├── docs/                   # Screenshots
└── saas/                   # Next.js SaaS
    ├── app/                # App Router pages
    ├── components/         # UI components (heatmap, report, etc.)
    ├── lib/                # AI, auth, queue, prompts
    ├── workers/            # BullMQ evaluation worker
    ├── prisma/             # DB schema + migrations
    └── __tests__/          # 94 unit tests
```

---

## Built by

**Dmitry Firsov** — serial entrepreneur, AI builder.
230M₽ revenue from zero · 90 projects launched · 500+ hours vibe-coding

Telegram: [@empire_on_ai](https://t.me/empire_on_ai)
