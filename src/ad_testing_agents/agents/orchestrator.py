"""Agent orchestrator for batch testing"""

import asyncio
from typing import List, Literal

from ..config import config
from ..models import AdOffer, AgentResponse, Persona
from .claude_agent import ClaudeAgent
from .claude_code_agent import ClaudeCodeAgent
from .mock_agent import MockAgent


AgentType = Literal["api", "claude-code", "mock"]


class AgentOrchestrator:
    """Orchestrates batch testing across multiple personas"""

    def __init__(
        self,
        model: str | None = None,
        agent_type: AgentType = "mock",
    ):
        """
        Args:
            model: Claude model to use for all agents (default from config)
            agent_type: Type of agent to use ("api", "claude-code", or "mock")
        """
        self.model = model or config.DEFAULT_MODEL
        self.agent_type = agent_type

    async def test_offer_batch(
        self,
        offer: AdOffer,
        personas: List[Persona],
        parallel: bool | None = None,
    ) -> List[AgentResponse]:
        """
        Test offer against multiple personas.

        Args:
            offer: Ad offer to test
            personas: List of personas to simulate
            parallel: Run agents in parallel (default from config)

        Returns:
            List of agent responses
        """
        if parallel is None:
            parallel = config.BATCH_PARALLEL

        if parallel:
            # Parallel execution using asyncio.gather
            tasks = [self._simulate_agent(offer, persona) for persona in personas]
            responses = await asyncio.gather(*tasks, return_exceptions=True)

            # Filter out exceptions and return successful responses
            successful_responses = []
            for i, response in enumerate(responses):
                if isinstance(response, Exception):
                    print(f"Warning: Agent for {personas[i].id} failed: {response}")
                else:
                    successful_responses.append(response)

            return successful_responses
        else:
            # Sequential execution
            responses = []
            for persona in personas:
                try:
                    response = await self._simulate_agent(offer, persona)
                    responses.append(response)
                except Exception as e:
                    print(f"Warning: Agent for {persona.id} failed: {e}")

            return responses

    async def _simulate_agent(self, offer: AdOffer, persona: Persona) -> AgentResponse:
        """
        Simulate single agent response.

        Args:
            offer: Ad offer
            persona: Persona to simulate

        Returns:
            Agent response
        """
        # Select agent type
        if self.agent_type == "api":
            agent = ClaudeAgent(persona=persona, model=self.model)
        elif self.agent_type == "claude-code":
            agent = ClaudeCodeAgent(persona=persona)
        else:  # mock
            agent = MockAgent(persona=persona)

        response = await agent.evaluate_offer(offer)
        return response

    def __repr__(self) -> str:
        return f"AgentOrchestrator(model={self.model})"


# Convenience function for quick testing
async def test_offer(
    offer: AdOffer,
    personas: List[Persona],
    model: str | None = None,
    parallel: bool | None = None,
    agent_type: AgentType = "mock",
) -> List[AgentResponse]:
    """
    Convenience function to test an offer.

    Args:
        offer: Ad offer to test
        personas: List of personas
        model: Claude model to use
        parallel: Run in parallel
        agent_type: Type of agent ("api", "claude-code", or "mock")

    Returns:
        List of agent responses
    """
    orchestrator = AgentOrchestrator(model=model, agent_type=agent_type)
    return await orchestrator.test_offer_batch(offer, personas, parallel=parallel)
