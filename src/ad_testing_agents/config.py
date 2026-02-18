"""Configuration management"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env file from project root
project_root = Path(__file__).parent.parent.parent
env_file = project_root / ".env"

if env_file.exists():
    load_dotenv(env_file)


class Config:
    """Application configuration"""

    # Anthropic API
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "claude-sonnet-4-5-20250929")
    AGENT_TIMEOUT_SECONDS: int = int(os.getenv("AGENT_TIMEOUT_SECONDS", "30"))
    BATCH_PARALLEL: bool = os.getenv("BATCH_PARALLEL", "true").lower() == "true"

    # Streamlit
    STREAMLIT_THEME: str = os.getenv("STREAMLIT_THEME", "light")
    DASHBOARD_PORT: int = int(os.getenv("DASHBOARD_PORT", "8501"))

    # Data directories
    RESULTS_DIR: Path = Path(os.getenv("RESULTS_DIR", "./data/results"))
    CUSTOM_PERSONAS_DIR: Path = Path(os.getenv("CUSTOM_PERSONAS_DIR", "./data/custom_personas"))

    @classmethod
    def validate(cls) -> None:
        """Validate critical configuration"""
        if not cls.ANTHROPIC_API_KEY:
            raise ValueError(
                "ANTHROPIC_API_KEY not set. Please set it in .env file or environment."
            )

    @classmethod
    def ensure_dirs(cls) -> None:
        """Ensure data directories exist"""
        cls.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        cls.CUSTOM_PERSONAS_DIR.mkdir(parents=True, exist_ok=True)


# Singleton instance
config = Config()
