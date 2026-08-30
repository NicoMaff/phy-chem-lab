import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        teacherCatalog: resolve(import.meta.dirname, 'enseignants/index.html'),
        activityCatalog: resolve(import.meta.dirname, 'activites/index.html'),
        rayConstruction: resolve(import.meta.dirname, 'enseignants/construction-rayons/index.html'),
      },
    },
  },
});
