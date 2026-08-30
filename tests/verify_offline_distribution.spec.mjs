import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const projectRoot = resolve(import.meta.dirname, '..');
const entryPagePath = resolve(projectRoot, 'dist/index.html');
const teacherCatalogPath = resolve(projectRoot, 'dist/enseignants/index.html');
const activityCatalogPath = resolve(projectRoot, 'dist/activites/index.html');
const rayConstructionPath = resolve(projectRoot, 'dist/enseignants/construction-rayons/index.html');

test.beforeAll(() => {
  execFileSync('yarn', ['build'], {
    cwd: projectRoot,
    stdio: 'pipe',
  });
});

test('opens the distribution from the local file system without network requests', async ({ page }) => {
  const requests = [];

  page.on('request', (request) => requests.push(request.url()));

  await page.goto(pathToFileURL(entryPagePath).href);

  await expect(page.getByRole('heading', { name: 'PhyChem Lab' })).toBeVisible();
  expect(requests.filter((requestUrl) => !requestUrl.startsWith('file:'))).toEqual([]);
});

test('lets a visitor reach both resource catalogs from the offline home page', async ({ page }) => {
  await page.goto(pathToFileURL(entryPagePath).href);

  await page.getByRole('link', { name: 'Espace enseignant' }).click();
  await expect(page.getByRole('heading', { name: 'Espace enseignant' })).toBeVisible();
  expect(page.url()).toBe(pathToFileURL(teacherCatalogPath).href);

  await page.goto(pathToFileURL(entryPagePath).href);
  await page.getByRole('link', { name: 'Activités' }).click();
  await expect(page.getByRole('heading', { name: 'Activités' })).toBeVisible();
  expect(page.url()).toBe(pathToFileURL(activityCatalogPath).href);
});

test('shows a discovered teaching module and an empty activity catalog', async ({ page }) => {
  await page.goto(pathToFileURL(teacherCatalogPath).href);
  await page.getByRole('link', { name: 'Construction des rayons lumineux' }).click();
  await expect(page.getByRole('heading', { name: 'Construction des rayons lumineux' })).toBeVisible();
  expect(page.url()).toBe(pathToFileURL(rayConstructionPath).href);

  await page.goto(pathToFileURL(activityCatalogPath).href);
  await expect(page.getByText('Aucune activité élève n’est encore disponible.')).toBeVisible();
});
