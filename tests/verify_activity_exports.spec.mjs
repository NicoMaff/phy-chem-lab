import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';

const projectRoot = resolve(import.meta.dirname, '..');

test('reports an empty activity catalog without producing distributed content', () => {
  const result = execFileSync('yarn', ['export'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  const interactiveResult = execFileSync('yarn', ['export', '-i'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });

  expect(result).toContain('Aucune activité élève déclarée à exporter.');
  expect(interactiveResult).toContain('Aucune activité élève déclarée à exporter.');
  expect(existsSync(resolve(projectRoot, 'dist/activites/exports'))).toBe(false);
});

test('creates a self-contained test activity that opens locally without network requests', async ({ page }) => {
  const outputDirectory = mkdtempSync(resolve(tmpdir(), 'phy-chem-lab-export-'));

  try {
    execFileSync(
      'node',
      [
        '--experimental-strip-types',
        'scripts/export_activities.ts',
        '--activities-root',
        'tests/fixtures/student_activities',
        '--output-directory',
        outputDirectory,
      ],
      { cwd: projectRoot, stdio: 'pipe' },
    );

    const activityPath = resolve(outputDirectory, 'standalone-test-activity.html');
    const exportedHtml = readFileSync(activityPath, 'utf8');
    const requests = [];

    page.on('request', (request) => requests.push(request.url()));
    await page.goto(pathToFileURL(activityPath).href);

    await expect(page.getByRole('heading', { name: 'Activité de test autonome' })).toBeVisible();
    await page.getByRole('button', { name: 'Incrémenter' }).click();
    await expect(page.getByText('Compteur : 1')).toBeVisible();
    expect(exportedHtml).not.toMatch(/<(?:script|link)\b[^>]+(?:src|href)=/i);
    expect(exportedHtml).not.toContain('MathJax');
    expect(requests.filter((requestUrl) => !requestUrl.startsWith('file:'))).toEqual([]);
  } finally {
    rmSync(outputDirectory, { force: true, recursive: true });
  }
});

test('bundles MathJax only for an activity that declares it', async ({ page }) => {
  const outputDirectory = mkdtempSync(resolve(tmpdir(), 'phy-chem-lab-mathjax-export-'));

  try {
    execFileSync(
      'node',
      [
        '--experimental-strip-types',
        'scripts/export_activities.ts',
        '--activities-root',
        'tests/fixtures/mathjax_student_activities',
        '--output-directory',
        outputDirectory,
      ],
      { cwd: projectRoot, stdio: 'pipe' },
    );

    const activityPath = resolve(outputDirectory, 'mathjax-test-activity.html');
    const exportedHtml = readFileSync(activityPath, 'utf8');
    const requests = [];

    page.on('request', (request) => requests.push(request.url()));
    await page.goto(pathToFileURL(activityPath).href);

    await expect(page.locator('mjx-container')).toHaveCount(1);
    expect(exportedHtml).not.toMatch(/<(?:script|link)\b[^>]+(?:src|href)=/i);
    expect(requests.filter((requestUrl) => !requestUrl.startsWith('file:'))).toEqual([]);
  } finally {
    rmSync(outputDirectory, { force: true, recursive: true });
  }
});
