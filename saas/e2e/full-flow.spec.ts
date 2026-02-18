import { test, expect } from '@playwright/test'

const TEST_EMAIL = `e2e-${Date.now()}@test.com`
const TEST_PASSWORD = 'testpass123'
const TEST_NAME = 'E2E Tester'

test.describe('Full flow', () => {
  test('register → demo project → create project → personas → offers → test → report', async ({ page }) => {
    // 1. Register (auto-login after registration)
    await page.goto('/register')
    await page.fill('#name', TEST_NAME)
    await page.fill('#email', TEST_EMAIL)
    await page.fill('#password', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 15000 })

    // 2. See demo project
    await expect(page.locator('text=демо')).toBeVisible({ timeout: 10000 })

    // 3. Create project
    await page.click('text=Новый проект')
    await page.waitForURL(/\/projects\/new/)
    await page.fill('#name', 'E2E Test Project')
    await page.fill('#niche', 'Тестовая ниша для E2E')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/projects\/[a-z0-9]+$/, { timeout: 10000 })

    // 4. Navigate to personas management
    await page.click('text=Управление')
    await page.waitForURL(/\/personas/)

    // 5. Add persona manually
    await page.click('text=Добавить персону')
    await page.fill('input[placeholder="Имя"]', 'Тестовая Персона')
    await page.fill('input[placeholder="Описание"]', 'Описание для E2E')
    await page.fill('input[placeholder="Профессия"]', 'Тестировщик')
    await page.fill('input[placeholder*="характера"]', 'analytical')
    await page.fill('input[placeholder*="Ценности"]', 'качество')
    await page.fill('input[placeholder*="Боли"]', 'баги')
    await page.fill('input[placeholder*="Цели"]', 'стабильность')
    await page.fill('textarea[placeholder*="Позитивные"]', 'Автоматизация')
    await page.fill('textarea[placeholder*="Негативные"]', 'Ручное тестирование')
    await page.fill('input[placeholder*="Факторы"]', 'надёжность')
    await page.fill('textarea[placeholder*="Предыстория"]', 'QA инженер с опытом')
    await page.click('button:has-text("Сохранить")')
    await expect(page.locator('text=Тестовая Персона')).toBeVisible({ timeout: 10000 })

    // 6. Go back and navigate to offers
    await page.goBack()
    await page.waitForURL(/\/projects\/[a-z0-9]+$/)
    await page.click('text=Офферы')
    await page.click('text=Управление')
    await page.waitForURL(/\/offers/)

    // 7. Add offer
    await page.click('text=Добавить оффер')
    await page.fill('input[placeholder="Заголовок"]', 'Тестовый оффер')
    await page.fill('textarea[placeholder*="Текст"]', 'Описание оффера для E2E')
    await page.fill('input[placeholder*="Призыв"]', 'Купить')
    await page.fill('input[placeholder="Цена"]', '999 руб')
    await page.click('button:has-text("Сохранить")')
    await expect(page.locator('text=Тестовый оффер')).toBeVisible({ timeout: 10000 })

    // 8. Go back to project and start test
    await page.goBack()
    await page.waitForURL(/\/projects\/[a-z0-9]+$/)
    await page.click('text=Запустить тест')

    // 9. View report
    await page.waitForURL(/\/test-runs\//, { timeout: 15000 })
    await expect(page.locator('text=Отчёт по тесту')).toBeVisible({ timeout: 10000 })
  })
})
