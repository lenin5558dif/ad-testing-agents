#!/usr/bin/env python3
"""Basic test script to verify installation"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ad_testing_agents.agents import test_offer
from ad_testing_agents.config import config
from ad_testing_agents.models import AdOffer
from ad_testing_agents.personas import load_all_personas


async def main():
    """Run basic test"""

    print("🧪 Ad Testing Agents — Basic Test\n")

    # Check API key
    print("1. Checking configuration...")
    try:
        config.validate()
        print(f"   ✅ API key configured")
        print(f"   ✅ Model: {config.DEFAULT_MODEL}")
    except ValueError as e:
        print(f"   ❌ {e}")
        print("\n💡 Please set ANTHROPIC_API_KEY in .env file")
        return

    # Load personas
    print("\n2. Loading personas...")
    try:
        personas = load_all_personas()
        print(f"   ✅ Loaded {len(personas)} personas:")
        for p in personas:
            print(f"      - {p.name} ({p.description})")
    except Exception as e:
        print(f"   ❌ Failed to load personas: {e}")
        return

    # Create test offer
    print("\n3. Creating test offer...")
    offer = AdOffer(
        headline="Лазерная эпиляция — первая процедура 990₽",
        body="Забудьте о бритье навсегда. Безболезненно, быстро, гарантия результата.",
        call_to_action="Записаться на процедуру",
        price="990₽",
        discount="Обычная цена 3500₽",
    )
    print(f"   ✅ Offer: {offer.headline}")

    # Test with 2 personas (to save API calls)
    print("\n4. Testing with 2 personas (Anna & Olga)...")
    test_personas = [p for p in personas if p.id in ["anna-student", "olga-skeptic"]]

    try:
        responses = await test_offer(offer, test_personas)

        print(f"\n   ✅ Received {len(responses)} responses\n")

        for response in responses:
            print(f"   👤 {response.persona_name}")
            print(f"      Эмоция: {response.primary_emotion} ({response.emotion_intensity:.0%})")
            print(f"      Решение: {response.decision}")
            print(f"      Ценность: {response.perceived_value}/10")
            print(f"      First impression: {response.first_impression}")
            print()

    except Exception as e:
        print(f"   ❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        return

    print("✅ All tests passed!")
    print("\n💡 Next steps:")
    print("   - Run: ./scripts/start_dashboard.sh")
    print("   - Or: streamlit run dashboard/app.py")


if __name__ == "__main__":
    asyncio.run(main())
