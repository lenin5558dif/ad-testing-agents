"""Persona loader - загружает персоны из JSON файлов"""

import json
from pathlib import Path
from typing import Dict, List

from ..models import Persona


class PersonaLoader:
    """Загружает и управляет персонами"""

    def __init__(self, personas_dir: Path | None = None):
        """
        Args:
            personas_dir: Директория с JSON файлами персон.
                         По умолчанию - defaults/ в текущей директории.
        """
        if personas_dir is None:
            # По умолчанию используем defaults/
            personas_dir = Path(__file__).parent / "defaults"

        self.personas_dir = Path(personas_dir)

        if not self.personas_dir.exists():
            raise FileNotFoundError(f"Personas directory not found: {self.personas_dir}")

        self._personas: Dict[str, Persona] = {}
        self._load_all()

    def _load_all(self) -> None:
        """Загружает все JSON файлы из директории"""
        json_files = list(self.personas_dir.glob("*.json"))

        if not json_files:
            raise ValueError(f"No JSON files found in {self.personas_dir}")

        for json_file in json_files:
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                persona = Persona(**data)
                self._personas[persona.id] = persona

            except Exception as e:
                print(f"Warning: Failed to load {json_file.name}: {e}")

    def get_persona(self, persona_id: str) -> Persona:
        """Получить персону по ID"""
        if persona_id not in self._personas:
            available = ", ".join(self._personas.keys())
            raise KeyError(
                f"Persona '{persona_id}' not found. Available: {available}"
            )

        return self._personas[persona_id]

    def get_all_personas(self) -> List[Persona]:
        """Получить все загруженные персоны"""
        return list(self._personas.values())

    def get_personas_by_ids(self, persona_ids: List[str]) -> List[Persona]:
        """Получить список персон по их ID"""
        return [self.get_persona(pid) for pid in persona_ids]

    def list_persona_ids(self) -> List[str]:
        """Получить список всех ID персон"""
        return list(self._personas.keys())

    def count(self) -> int:
        """Количество загруженных персон"""
        return len(self._personas)

    def __repr__(self) -> str:
        return f"PersonaLoader({self.count()} personas loaded)"


# Singleton instance для удобства
_default_loader: PersonaLoader | None = None


def get_default_loader() -> PersonaLoader:
    """Получить default loader (singleton)"""
    global _default_loader

    if _default_loader is None:
        _default_loader = PersonaLoader()

    return _default_loader


# Удобные функции для быстрого доступа
def load_all_personas() -> List[Persona]:
    """Загрузить все default персоны"""
    return get_default_loader().get_all_personas()


def load_persona(persona_id: str) -> Persona:
    """Загрузить персону по ID"""
    return get_default_loader().get_persona(persona_id)


def load_personas(persona_ids: List[str]) -> List[Persona]:
    """Загрузить несколько персон по ID"""
    return get_default_loader().get_personas_by_ids(persona_ids)
