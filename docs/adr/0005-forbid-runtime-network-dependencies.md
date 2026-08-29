# Forbid runtime network dependencies

The global distribution and every standalone student activity must operate without making any network request, whether or not a connection is available. Fonts, MathJax, scripts, styles, and other required assets are bundled locally or inlined during the build; CDN fallbacks, telemetry, and remote services are excluded so a copy distributed on removable storage behaves identically on every supported device.
