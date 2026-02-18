// Mock Prisma для unit-тестов (без реальной БД)
// Integration-тесты используют test DB: adtesting_test
import { beforeAll, afterAll } from 'vitest'

// Для integration-тестов: отдельная тестовая БД
// DATABASE_URL в тестах: postgresql://postgres:postgres@localhost:5432/adtesting_test
