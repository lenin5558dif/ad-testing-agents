"""Pydantic models for ad offers"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AdOffer(BaseModel):
    """Advertisement offer to test with personas"""

    headline: str = Field(..., min_length=5, max_length=150, description="Главный заголовок оффера")
    body: str = Field(..., min_length=10, max_length=500, description="Текст оффера/описание")
    call_to_action: str = Field(
        ..., examples=["Записаться", "Получить скидку", "Узнать подробнее"]
    )

    # Optional elements
    image_description: Optional[str] = Field(
        None, description="Описание визуальных элементов (для симуляции)"
    )
    price: Optional[str] = Field(None, description="Цена (e.g., '990₽', 'от 5000₽')")
    discount: Optional[str] = Field(None, description="Скидка (e.g., '50%', '-3000₽')")

    # Metadata
    product_category: str = Field(
        default="laser_hair_removal", description="Категория продукта"
    )
    target_audience: Optional[str] = Field(
        None, description="Целевая аудитория (опционально)"
    )

    # Testing metadata
    test_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    def to_display_text(self) -> str:
        """Формат оффера для показа агентам"""
        parts = [f"**{self.headline}**", f"\n{self.body}"]

        if self.price:
            parts.append(f"\nЦена: {self.price}")
        if self.discount:
            parts.append(f"\nСкидка: {self.discount}")
        if self.image_description:
            parts.append(f"\nВизуал: {self.image_description}")

        parts.append(f"\n\n[{self.call_to_action}]")

        return "\n".join(parts)

    class Config:
        json_schema_extra = {
            "example": {
                "headline": "Лазерная эпиляция — первая процедура 990₽",
                "body": "Забудьте о бритье навсегда. Безболезненно, быстро, гарантия результата. Современное оборудование, опытные мастера.",
                "call_to_action": "Записаться на процедуру",
                "price": "990₽ (первая процедура)",
                "discount": "Обычная цена 3500₽",
                "image_description": "Фото довольной девушки с гладкой кожей, светлая студия",
                "product_category": "laser_hair_removal",
                "target_audience": "Женщины 18-45, Москва",
            }
        }
