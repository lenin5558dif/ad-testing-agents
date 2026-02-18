#!/usr/bin/env python3
"""Batch test script - run all offers through all personas"""

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ad_testing_agents.agents import test_offer
from ad_testing_agents.models import AdOffer
from ad_testing_agents.personas import load_all_personas


async def main():
    """Run batch test"""

    print("🧪 Ad Testing Agents — Batch Test\n")

    # Load personas
    print("1. Loading personas...")
    personas = load_all_personas()
    print(f"   ✅ Loaded {len(personas)} personas")

    # Load test offers
    print("\n2. Loading test offers...")
    offers_file = Path(__file__).parent.parent / "data" / "test_offers.json"
    with open(offers_file) as f:
        offers_data = json.load(f)

    offers = [
        AdOffer(
            test_id=offer["id"],
            headline=offer["headline"],
            body=offer["body"],
            call_to_action=offer["call_to_action"],
            price=offer.get("price"),
            discount=offer.get("discount"),
        )
        for offer in offers_data
    ]
    print(f"   ✅ Loaded {len(offers)} test offers")

    # Run tests
    print(f"\n3. Running tests ({len(offers)} offers × {len(personas)} personas = {len(offers) * len(personas)} tests)...")
    print("   This will take a few seconds with mock agent...\n")

    all_results = []

    for i, offer in enumerate(offers, 1):
        print(f"   [{i}/{len(offers)}] Testing: {offer.headline[:50]}...")

        try:
            responses = await test_offer(
                offer,
                personas,
                agent_type="mock",  # Use mock for fast testing
                parallel=True
            )

            for response in responses:
                all_results.append({
                    "offer_id": offer.test_id,
                    "offer_headline": offer.headline,
                    "persona_id": response.persona_id,
                    "persona_name": response.persona_name,
                    "primary_emotion": response.primary_emotion,
                    "emotion_intensity": response.emotion_intensity,
                    "decision": response.decision,
                    "confidence_score": response.confidence_score,
                    "perceived_value": response.perceived_value,
                    "first_impression": response.first_impression,
                    "detailed_reasoning": response.detailed_reasoning,
                    "pain_points_addressed": response.pain_points_addressed,
                    "objections": response.objections,
                    "what_would_convince": response.what_would_convince,
                    "timestamp": response.timestamp.isoformat(),
                })

            print(f"        ✅ Got {len(responses)} responses")

        except Exception as e:
            print(f"        ❌ Error: {e}")

    # Save results
    print("\n4. Saving results...")
    results_file = Path(__file__).parent.parent / "data" / "results" / f"batch_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    results_file.parent.mkdir(parents=True, exist_ok=True)

    with open(results_file, "w") as f:
        json.dump({
            "metadata": {
                "test_date": datetime.now().isoformat(),
                "num_offers": len(offers),
                "num_personas": len(personas),
                "num_results": len(all_results),
                "agent_type": "mock",
            },
            "results": all_results,
        }, f, indent=2, ensure_ascii=False)

    print(f"   ✅ Saved {len(all_results)} results to {results_file}")

    # Quick statistics
    print("\n5. Quick Statistics:")

    # Overall conversion rate
    positive_decisions = sum(1 for r in all_results if r["decision"] in ["strong_yes", "maybe_yes"])
    conversion_rate = positive_decisions / len(all_results) if all_results else 0
    print(f"   📊 Overall Conversion Rate: {conversion_rate:.1%}")

    # Average perceived value
    avg_value = sum(r["perceived_value"] for r in all_results) / len(all_results) if all_results else 0
    print(f"   💎 Average Perceived Value: {avg_value:.1f}/10")

    # Best offer
    offer_scores = {}
    for result in all_results:
        offer_id = result["offer_id"]
        if offer_id not in offer_scores:
            offer_scores[offer_id] = {"value": 0, "count": 0, "headline": result["offer_headline"]}

        offer_scores[offer_id]["value"] += result["perceived_value"]
        offer_scores[offer_id]["count"] += 1

    for offer_id in offer_scores:
        offer_scores[offer_id]["avg"] = offer_scores[offer_id]["value"] / offer_scores[offer_id]["count"]

    best_offer = max(offer_scores.items(), key=lambda x: x[1]["avg"])
    print(f"\n   🏆 Best Offer: {best_offer[0]}")
    print(f"      {best_offer[1]['headline'][:60]}")
    print(f"      Avg Value: {best_offer[1]['avg']:.1f}/10")

    print("\n✅ Batch test completed!")
    print(f"📁 Results saved to: {results_file}")
    print("\n💡 Next: View results in dashboard at http://localhost:8502")


if __name__ == "__main__":
    asyncio.run(main())
