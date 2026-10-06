import { execFileSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const projectRoot = resolve(import.meta.dirname, '..');
const colorPage = pathToFileURL(resolve(projectRoot, 'dist/enseignants/couleurs/index.html')).href;

test.beforeAll(() => execFileSync('yarn', ['build'], { cwd: projectRoot, stdio: 'pipe' }));

test('reaches the colors module from the offline teacher catalog without network access', async ({ page }) => {
  const requests = [];
  const errors = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(projectRoot, 'dist/enseignants/index.html')).href);
  await page.getByRole('link', { name: 'Lumières et objets colorés' }).click();
  await expect(page.getByRole('heading', { name: 'Lumières et objets colorés' })).toBeVisible();
  expect(page.url()).toBe(colorPage);
  await expect(page.locator('[data-region="7"]')).toHaveAttribute('data-color', 'rgb(255, 255, 255)');
  expect(requests.filter((url) => !url.startsWith('file:'))).toEqual([]);
  expect(errors).toEqual([]);
});

test('changes apparent object colors and explains the received, diffused and absorbed components', async ({ page }) => {
  await page.goto(colorPage);
  await page.getByRole('tab', { name: 'Éclairer des objets' }).click();
  await page.getByLabel('Éclairage rapide').selectOption('red');
  await expect(page.locator('[data-observed-color="yellow"]')).toHaveAttribute('fill', 'rgb(255, 0, 0)');
  await expect(page.getByRole('heading', { name: 'Objet jaune : rouge sous cet éclairage' })).toBeVisible();
  await page.getByLabel('Éclairage rapide').selectOption('blue');
  await expect(page.locator('[data-observed-color="yellow"]')).toHaveAttribute('fill', 'rgb(0, 0, 0)');
  await expect(page.getByRole('row', { name: 'Bleu 100 % 0 % 100 %' })).toBeVisible();
  await page.getByRole('button', { name: 'Examiner l’objet blanc' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Objet blanc : bleu sous cet éclairage' })).toBeVisible();
  await page.getByLabel('Afficher les explications').uncheck();
  await expect(page.locator('#observation')).toBeHidden();
});

test('moves sources with pointer and keyboard and restores settings on reload', async ({ page }) => {
  await page.goto(colorPage);
  const red = page.getByRole('button', { name: 'Déplacer la zone rouge' });
  const redGeometry = page.locator('#spot-0 circle');
  const original = await redGeometry.getAttribute('cx');
  await expect(page.locator('[data-source] text')).toHaveCount(0);
  await red.focus(); await page.keyboard.press('ArrowLeft');
  await expect(redGeometry).not.toHaveAttribute('cx', original);
  const afterKeyboard = await redGeometry.getAttribute('cx');
  const bounds = await red.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down(); await page.mouse.move(bounds.x + 70, bounds.y + 50); await page.mouse.up();
  await expect(redGeometry).not.toHaveAttribute('cx', afterKeyboard);
  const afterDrag = await redGeometry.getAttribute('cx');
  await page.getByLabel('Éclairage rapide').selectOption('cyan');
  await page.reload();
  await expect(redGeometry).toHaveAttribute('cx', afterDrag);
  await expect(page.getByLabel('Éclairage rapide')).toHaveValue('cyan');
  await page.getByRole('button', { name: 'Aligner les centres' }).click();
  const sources = await page.locator('clipPath circle').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('cx')));
  expect(new Set(sources)).toEqual(new Set(['500']));
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page.getByLabel('Éclairage rapide')).toHaveValue('white');
  await expect(redGeometry).toHaveAttribute('cx', original);
  await red.focus();
  for (let step = 0; step < 14; step++) await page.keyboard.press('ArrowRight');
  await expect(redGeometry).toHaveAttribute('cx', '570');
  await page.getByRole('button', { name: 'Déplacer la zone verte' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#spot-1 circle')).toHaveAttribute('cx', '580');
  await expect(redGeometry).toHaveAttribute('cx', '570');
});

test('drags a colored area directly and cycles coincident sources without visible handles', async ({ page }) => {
  await page.goto(colorPage);
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await page.getByRole('button', { name: 'Aligner les centres' }).click();
  const area = page.getByRole('button', { name: 'Déplacer la zone rouge' });
  const bounds = await area.boundingBox();
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.click(x, y);
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 60, y, { steps: 3 }); await page.mouse.up();
  await expect(page.locator('#spot-0 circle')).toHaveAttribute('cx', '500');
  await expect(page.locator('#spot-1 circle')).not.toHaveAttribute('cx', '500');
  await expect(page.locator('#spot-2 circle')).toHaveAttribute('cx', '500');
  await page.getByLabel('Éclairage rapide').selectOption('off');
  await expect(page.locator('[data-source]')).toHaveCount(0);
});

test('exports a self-contained SVG and a PNG of the scientific scene', async ({ page }) => {
  await page.goto(colorPage);
  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'SVG', exact: true }).click();
  const svg = await svgDownload;
  const markup = await readFile(await svg.path(), 'utf8');
  expect(markup).toContain('width="1000"');
  expect(markup).toContain('rgb(255, 255, 255)');
  expect(markup).not.toContain('data-export-omit');
  expect(markup).not.toContain('tabindex');
  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const png = await pngDownload;
  const image = await readFile(await png.path());
  expect(image.subarray(1, 4).toString()).toBe('PNG');
  expect(image.readUInt32BE(16)).toBe(2000);
  expect(image.readUInt32BE(20)).toBe(1200);
});

test('keeps quick lighting available in fullscreen and synchronizes it with normal controls', async ({ page }) => {
  await mkdir(resolve(projectRoot, '.impeccable/review'), { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(colorPage);
    await page.getByRole('button', { name: 'Réinitialiser' }).click();
    for (const mode of ['mixing', 'objects']) {
      if (mode === 'objects') await page.getByRole('tab', { name: 'Éclairer des objets' }).click();
      const quickLighting = page.locator('#fullscreen-light-preset');
      await expect(quickLighting).toBeHidden();
      await page.getByRole('button', { name: 'Plein écran', exact: true }).click();
      await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('scene-shell');
      await expect(quickLighting).toBeVisible();
      await quickLighting.selectOption('blue');
      if (mode === 'mixing') await expect(page.locator('[data-region="4"]')).toHaveAttribute('data-color', 'rgb(0, 0, 255)');
      else await expect(page.locator('[data-observed-color="yellow"]')).toHaveAttribute('fill', 'rgb(0, 0, 0)');
      const menuBounds = await page.locator('.color-fullscreen-controls').boundingBox();
      const sceneBounds = await page.locator('#color-scene').boundingBox();
      if (width === 1440) expect(menuBounds.x).toBeGreaterThan(sceneBounds.x + sceneBounds.width);
      await page.screenshot({ path: resolve(projectRoot, `.impeccable/review/fullscreen-${width === 1440 ? 'desktop' : 'mobile'}-${mode}.png`) });
      await page.getByRole('button', { name: 'Quitter le plein écran' }).click();
      await expect(quickLighting).toBeHidden();
      await expect(page.locator('#light-preset')).toHaveValue('blue');
      await expect(page.locator('#intensity-2')).toHaveValue('100');
    }
  }
});

test('fits desktop and mobile layouts and captures both experiments', async ({ page }) => {
  await mkdir(resolve(projectRoot, '.impeccable/review'), { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(colorPage);
    for (const mode of ['mixing', 'objects']) {
      if (mode === 'objects') await page.getByRole('tab', { name: 'Éclairer des objets' }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.getByLabel('Intensité rouge')).toBeVisible();
      await page.screenshot({ path: resolve(projectRoot, `.impeccable/review/${width === 1440 ? 'desktop' : 'mobile'}-${mode}.png`), fullPage: true });
    }
    await page.getByRole('button', { name: 'Réinitialiser' }).click();
  }
});
