import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    browserName: 'chromium',
    launchOptions: {
      args: ['--allow-file-access-from-files'],
    },
  },
});
