import { test, expect } from '@playwright/test';

test.describe('Assessment Tools', () => {
  test('should load admin page', async ({ page }) => {
    await page.goto('http://localhost:8099/assessment-tools/admin');
    
    // Проверяем, что страница загрузилась
    await expect(page.locator('text=Команды')).toBeVisible();
    await expect(page.locator('text=Эксперты')).toBeVisible();
    await expect(page.locator('text=Критерии')).toBeVisible();
  });

  test('should create a team', async ({ page }) => {
    await page.goto('http://localhost:8099/assessment-tools/admin');
    
    // Переходим на таб команд
    await page.click('text=Команды');
    
    // Заполняем форму
    await page.fill('input[placeholder*="Название команды"]', 'Test Team');
    await page.fill('input[placeholder*="Название проекта"]', 'Test Project');
    
    // Отправляем форму
    await page.click('button:has-text("Добавить")');
    
    // Проверяем, что команда появилась
    await expect(page.locator('text=Test Team')).toBeVisible();
  });

  test('should create an expert', async ({ page }) => {
    await page.goto('http://localhost:8099/assessment-tools/admin');
    
    // Переходим на таб экспертов
    await page.click('text=Эксперты');
    
    // Заполняем форму
    await page.fill('input[placeholder*="ФИО эксперта"]', 'Test Expert');
    
    // Отправляем форму
    await page.click('button:has-text("Добавить и сгенерировать QR-код")');
    
    // Проверяем, что эксперт появился
    await expect(page.locator('text=Test Expert')).toBeVisible();
  });

  test('should load default criteria', async ({ page }) => {
    await page.goto('http://localhost:8099/assessment-tools/admin');
    
    // Переходим на таб критериев
    await page.click('text=Критерии');
    
    // Загружаем критерии по умолчанию
    await page.click('button:has-text("Загрузить критерии по умолчанию")');
    
    // Подтверждаем в alert
    page.on('dialog', dialog => dialog.accept());
    
    // Проверяем, что критерии появились
    await expect(page.locator('text=Оценка проекта')).toBeVisible();
  });
});

