"""Claude-based agent for persona simulation"""

import json
import time
from datetime import datetime
from typing import Any, Dict

from anthropic import Anthropic

from ..config import config
from ..models import AdOffer, AgentResponse, Persona
from ..prompts import generate_evaluation_prompt, generate_system_prompt


class ClaudeAgent:
    """Agent that simulates a persona using Claude API"""

    def __init__(
        self,
        persona: Persona,
        model: str | None = None,
        timeout: int | None = None,
    ):
        """
        Args:
            persona: Persona to simulate
            model: Claude model to use (default from config)
            timeout: Timeout in seconds (default from config)
        """
        self.persona = persona
        self.model = model or config.DEFAULT_MODEL
        self.timeout = timeout or config.AGENT_TIMEOUT_SECONDS

        # Validate API key
        if not config.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not set in environment")

        self.client = Anthropic(api_key=config.ANTHROPIC_API_KEY)

    async def evaluate_offer(self, offer: AdOffer) -> AgentResponse:
        """
        Evaluate an ad offer as this persona.

        Args:
            offer: Ad offer to evaluate

        Returns:
            Structured agent response
        """
        # Generate prompts
        system_prompt = generate_system_prompt(self.persona)
        evaluation_prompt = generate_evaluation_prompt(offer, self.persona)

        # Call Claude API
        start_time = time.time()

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                temperature=0.7,
                system=system_prompt,
                messages=[{"role": "user", "content": evaluation_prompt}],
            )

            response_time_ms = int((time.time() - start_time) * 1000)

            # Extract response text
            response_text = response.content[0].text

            # Parse JSON response
            agent_data = self._parse_response(response_text, offer)
            agent_data["response_time_ms"] = response_time_ms
            agent_data["model_used"] = self.model

            return AgentResponse(**agent_data)

        except Exception as e:
            raise RuntimeError(
                f"Failed to evaluate offer for persona {self.persona.id}: {e}"
            ) from e

    def _parse_response(self, response_text: str, offer: AdOffer) -> Dict[str, Any]:
        """
        Parse Claude's response into structured data.

        Args:
            response_text: Raw response from Claude
            offer: Original offer

        Returns:
            Dict compatible with AgentResponse model
        """
        # Extract JSON from response (might be wrapped in markdown code blocks)
        json_text = response_text.strip()

        # Remove markdown code blocks if present
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        elif json_text.startswith("```"):
            json_text = json_text[3:]

        if json_text.endswith("```"):
            json_text = json_text[:-3]

        json_text = json_text.strip()

        # Parse JSON
        try:
            data = json.loads(json_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON response: {e}\n\nResponse: {response_text}") from e

        # Add metadata
        data["persona_id"] = self.persona.id
        data["persona_name"] = f"{self.persona.name} ({self.persona.description})"
        data["test_id"] = offer.test_id or f"test-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        data["offer_headline"] = offer.headline
        data["timestamp"] = datetime.now()

        return data

    def __repr__(self) -> str:
        return f"ClaudeAgent(persona={self.persona.id}, model={self.model})"
