"""Claude Code Agent - uses Claude Code (CLI) instead of direct API"""

import json
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from ..models import AdOffer, AgentResponse, Persona
from ..prompts import generate_evaluation_prompt, generate_system_prompt


class ClaudeCodeAgent:
    """Agent that simulates persona using Claude Code CLI"""

    def __init__(self, persona: Persona):
        self.persona = persona

    async def evaluate_offer(self, offer: AdOffer) -> AgentResponse:
        """
        Evaluate ad offer as this persona using Claude Code.

        This method generates a prompt and sends it to Claude Code CLI,
        then parses the structured JSON response.
        """
        # Generate prompts
        system_prompt = generate_system_prompt(self.persona)
        evaluation_prompt = generate_evaluation_prompt(offer, self.persona)

        # Combine into full prompt
        full_prompt = f"""{system_prompt}

---

{evaluation_prompt}

ВАЖНО: Верни ТОЛЬКО валидный JSON без дополнительного текста. Используй формат:
```json
{{
  "primary_emotion": "...",
  "emotion_intensity": 0.0-1.0,
  ...
}}
```
"""

        # Create temp file for prompt
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(full_prompt)
            prompt_file = f.name

        try:
            # Call Claude Code CLI
            # Note: This assumes claude CLI is available in PATH
            result = subprocess.run(
                ['claude', '--message-file', prompt_file, '--format', 'json'],
                capture_output=True,
                text=True,
                timeout=60,
            )

            if result.returncode != 0:
                raise RuntimeError(f"Claude Code failed: {result.stderr}")

            response_text = result.stdout

            # Parse response
            agent_data = self._parse_response(response_text, offer)

            return AgentResponse(**agent_data)

        finally:
            # Cleanup temp file
            Path(prompt_file).unlink(missing_ok=True)

    def _parse_response(self, response_text: str, offer: AdOffer) -> Dict[str, Any]:
        """Parse Claude Code response into structured data"""

        # Extract JSON from response
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
            raise ValueError(
                f"Failed to parse JSON response: {e}\n\nResponse: {response_text}"
            ) from e

        # Add metadata
        data["persona_id"] = self.persona.id
        data["persona_name"] = f"{self.persona.name} ({self.persona.description})"
        data["test_id"] = offer.test_id or f"test-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        data["offer_headline"] = offer.headline
        data["timestamp"] = datetime.now()
        data["model_used"] = "claude-code"
        data["response_time_ms"] = 0  # Not tracking for now

        return data

    def __repr__(self) -> str:
        return f"ClaudeCodeAgent(persona={self.persona.id})"
