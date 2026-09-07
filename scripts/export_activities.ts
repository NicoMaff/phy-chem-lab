import { build } from 'vite';
import { createInterface } from 'node:readline/promises';
import { createRequire } from 'node:module';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { ResourceMetadata, StandaloneExport } from '../src/resource_metadata.ts';

type ActivityResource = ResourceMetadata & { readonly kind: 'student-activity' };

interface ActivityDefinition {
  readonly resource: ActivityResource;
  readonly resourcePath: string;
}

interface CliOptions {
  readonly activitiesRoot: string;
  readonly interactive: boolean;
  readonly outputDirectory: string;
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function toFileName(resourceId: string): string {
  return `${resourceId}.html`;
}

async function findResourcePaths(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const childPaths = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);

      if (entry.isDirectory()) {
        return findResourcePaths(entryPath);
      }

      return entry.name === 'resource.ts' ? [entryPath] : [];
    }),
  );

  return childPaths.flat();
}

async function discoverActivities(activitiesRoot: string): Promise<ActivityDefinition[]> {
  try {
    const resourcePaths = await findResourcePaths(activitiesRoot);
    const definitions = await Promise.all(
      resourcePaths.map(async (resourcePath) => {
        const module = (await import(pathToFileURL(resourcePath).href)) as { resource: ActivityResource };

        return { resource: module.resource, resourcePath };
      }),
    );

    return definitions.filter(
      ({ resource }) => resource.kind === 'student-activity' && resource.standaloneExport !== undefined,
    );
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

function parseCliOptions(cliArguments: string[]): CliOptions {
  let activitiesRoot = resolve(projectRoot, 'src/resources/students');
  let interactive = false;
  let outputDirectory = resolve(projectRoot, 'dist/activites/exports');

  for (let index = 0; index < cliArguments.length; index += 1) {
    const argument = cliArguments[index];

    if (argument === '-i' || argument === '--interactive') {
      interactive = true;
      continue;
    }

    if (argument === '--activities-root' || argument === '--output-directory') {
      const value = cliArguments[index + 1];
      if (value === undefined) {
        throw new Error(`Une valeur est requise après ${argument}.`);
      }

      if (argument === '--activities-root') {
        activitiesRoot = resolve(projectRoot, value);
      } else {
        outputDirectory = resolve(projectRoot, value);
      }
      index += 1;
      continue;
    }

    throw new Error(`Option inconnue : ${argument}`);
  }

  return { activitiesRoot, interactive, outputDirectory };
}

async function selectActivities(activities: ActivityDefinition[]): Promise<ActivityDefinition[]> {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });

  try {
    process.stdout.write('\nActivités élève disponibles :\n');
    activities.forEach(({ resource }, index) => process.stdout.write(`  ${index + 1}. ${resource.title}\n`));
    const selection = await terminal.question('Sélectionnez une ou plusieurs activités (numéros séparés par des virgules, * pour toutes) : ');

    if (selection.trim() === '*') {
      return activities;
    }

    const selectedIndexes = selection
      .split(',')
      .map((value) => Number.parseInt(value.trim(), 10) - 1)
      .filter((index) => Number.isInteger(index) && index >= 0 && index < activities.length);
    const selectedActivities = [...new Set(selectedIndexes)].map((index) => activities[index]);

    if (selectedActivities.length === 0) {
      throw new Error('Aucune activité valide n’a été sélectionnée.');
    }

    return selectedActivities;
  } finally {
    terminal.close();
  }
}

async function buildActivity(activity: ActivityDefinition, outputDirectory: string): Promise<{ fileName: string; size: number }> {
  const standaloneExport = activity.resource.standaloneExport;
  if (standaloneExport === undefined) {
    throw new Error(`L’activité ${activity.resource.id} ne déclare pas son export autonome.`);
  }

  const sourcePath = resolve(dirname(activity.resourcePath), standaloneExport.source);
  const temporaryDirectory = resolve(tmpdir(), `phy-chem-lab-export-${randomUUID()}`);

  await build({
    base: './',
    configFile: false,
    publicDir: false,
    root: projectRoot,
    build: {
      assetsInlineLimit: Number.POSITIVE_INFINITY,
      cssCodeSplit: false,
      emptyOutDir: true,
      outDir: temporaryDirectory,
      rollupOptions: {
        input: sourcePath,
        output: { inlineDynamicImports: true },
      },
    },
  });

  try {
    const builtHtmlPath = resolve(temporaryDirectory, relative(projectRoot, sourcePath));
    const builtHtml = await readFile(builtHtmlPath, 'utf8');
    const assetTagPattern = /<link rel="stylesheet"(?: crossorigin)? href="([^"]+)">|<script type="module"(?: crossorigin)? src="([^"]+)"><\/script>/g;
    let outputHtml = builtHtml;

    for (const match of builtHtml.matchAll(assetTagPattern)) {
      const [tag, stylePath, scriptPath] = match;
      const assetContents = await readFile(resolve(dirname(builtHtmlPath), stylePath ?? scriptPath), 'utf8');
      const replacement = stylePath === undefined
        ? `<script type="module">${assetContents}</script>`
        : `<style>${assetContents}</style>`;

      outputHtml = outputHtml.replace(tag, replacement);
    }
    if (standaloneExport.requiresMathJax) {
      const mathJaxPath = require.resolve('mathjax-full/es5/tex-mml-svg.js');
      const mathJaxScript = await readFile(mathJaxPath, 'utf8');

      outputHtml = outputHtml.replace('</head>', `<script>${mathJaxScript}</script>\n  </head>`);
    }

    const fileName = toFileName(activity.resource.id);
    const destinationPath = resolve(outputDirectory, fileName);

    await writeFile(destinationPath, outputHtml);

    return { fileName, size: Buffer.byteLength(outputHtml) };
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const activities = await discoverActivities(options.activitiesRoot);

  if (activities.length === 0) {
    await rm(options.outputDirectory, { force: true, recursive: true });
    process.stdout.write('Aucune activité élève déclarée à exporter.\n');
    return;
  }

  const selectedActivities = options.interactive ? await selectActivities(activities) : activities;
  if (!options.interactive) {
    await rm(options.outputDirectory, { force: true, recursive: true });
  }
  await mkdir(options.outputDirectory, { recursive: true });

  for (const activity of selectedActivities) {
    const { fileName, size } = await buildActivity(activity, options.outputDirectory);
    process.stdout.write(`${relative(projectRoot, resolve(options.outputDirectory, fileName))} — ${size} octets\n`);
  }
}

await main();
