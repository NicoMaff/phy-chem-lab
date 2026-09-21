import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';

const projectRoot = resolve(import.meta.dirname, '..');

function exportFixtureActivities(arguments_, options = {}) {
  return execFileSync(
    'node',
    [
      '--experimental-strip-types',
      'scripts/export_activities.ts',
      '--activities-root',
      'tests/fixtures/interactive_student_activities',
      ...arguments_,
    ],
    { cwd: projectRoot, encoding: 'utf8', ...options },
  );
}

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
    expect(exportedHtml).toContain('data:font/ttf;base64,');
    expect(exportedHtml).toContain('data:image/svg+xml,');
    expect(requests.filter((requestUrl) => !requestUrl.startsWith('file:'))).toEqual([]);
  } finally {
    rmSync(outputDirectory, { force: true, recursive: true });
  }
});

test('regenerates every declared activity, replaces stale artifacts, and reports output sizes', () => {
  const outputDirectory = mkdtempSync(resolve(tmpdir(), 'phy-chem-lab-full-export-'));

  try {
    writeFileSync(resolve(outputDirectory, 'obsolete.html'), 'ancien artefact');
    const result = exportFixtureActivities(['--output-directory', outputDirectory]);

    expect(result).toMatch(/first-test-activity\.html — \d+ octets/);
    expect(result).toMatch(/second-test-activity\.html — \d+ octets/);
    expect(existsSync(resolve(outputDirectory, 'first-test-activity.html'))).toBe(true);
    expect(existsSync(resolve(outputDirectory, 'second-test-activity.html'))).toBe(true);
    expect(existsSync(resolve(outputDirectory, 'obsolete.html'))).toBe(false);
  } finally {
    rmSync(outputDirectory, { force: true, recursive: true });
  }
});

test('lets the interactive exporter select one, multiple, or all activities', () => {
  const outputDirectory = mkdtempSync(resolve(tmpdir(), 'phy-chem-lab-interactive-export-'));

  try {
    exportFixtureActivities(['-i', '--output-directory', outputDirectory], { input: '1\n' });
    expect(existsSync(resolve(outputDirectory, 'first-test-activity.html'))).toBe(true);
    expect(existsSync(resolve(outputDirectory, 'second-test-activity.html'))).toBe(false);

    rmSync(outputDirectory, { force: true, recursive: true });
    exportFixtureActivities(['-i', '--output-directory', outputDirectory], { input: '1, 2\n' });
    expect(existsSync(resolve(outputDirectory, 'first-test-activity.html'))).toBe(true);
    expect(existsSync(resolve(outputDirectory, 'second-test-activity.html'))).toBe(true);

    rmSync(outputDirectory, { force: true, recursive: true });
    exportFixtureActivities(['-i', '--output-directory', outputDirectory], { input: '*\n' });
    expect(existsSync(resolve(outputDirectory, 'first-test-activity.html'))).toBe(true);
    expect(existsSync(resolve(outputDirectory, 'second-test-activity.html'))).toBe(true);

    expect(() => exportFixtureActivities(['-i', '--output-directory', outputDirectory], { input: '1foo\n' }))
      .toThrow(/numéros d’activité valides/);
  } finally {
    rmSync(outputDirectory, { force: true, recursive: true });
  }
});

test('rejects external dependencies instead of exporting a non-autonomous activity', () => {
  const outputDirectory = mkdtempSync(resolve(tmpdir(), 'phy-chem-lab-external-export-'));

  try {
    expect(() => execFileSync(
      'node',
      [
        '--experimental-strip-types',
        'scripts/export_activities.ts',
        '--activities-root',
        'tests/fixtures/external_student_activities',
        '--output-directory',
        outputDirectory,
      ],
      { cwd: projectRoot, stdio: 'pipe' },
    )).toThrow(/dépendance externe/);
  } finally {
    rmSync(outputDirectory, { force: true, recursive: true });
  }
});

test('rejects external dependencies from inline styles and SVG images', () => {
  const outputDirectory = mkdtempSync(resolve(tmpdir(), 'phy-chem-lab-external-asset-export-'));

  try {
    for (const activitiesRoot of [
      'tests/fixtures/external_style_student_activities',
      'tests/fixtures/external_svg_student_activities',
    ]) {
      expect(() => execFileSync(
        'node',
        [
          '--experimental-strip-types',
          'scripts/export_activities.ts',
          '--activities-root',
          activitiesRoot,
          '--output-directory',
          outputDirectory,
        ],
        { cwd: projectRoot, stdio: 'pipe' },
      )).toThrow(/dépendance (?:CSS )?externe/);
    }
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
