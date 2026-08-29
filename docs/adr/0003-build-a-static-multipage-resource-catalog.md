# Build a static multipage resource catalog

The global PhyChem Lab distribution is a hierarchy of real HTML pages linked through relative paths, rather than a single-page application with client-side routing. Vite discovers typed resource metadata automatically at build time and generates the catalog, while the resulting hierarchy remains navigable directly from `dist/index.html` over `file://`; student activities may additionally be compiled into independent self-contained HTML exports.
