import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const projectRoot = resolve(import.meta.dirname, '..');
const entryPagePath = resolve(projectRoot, 'dist/index.html');

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
