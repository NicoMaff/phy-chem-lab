# Render scientific scenes as SVG

Scientific scenes use interactive SVG as their primary rendering model so the same scene can be exported as genuine vector SVG or rasterized to PNG without maintaining two drawing engines. Canvas remains an exception for future simulations whose volume or animation rate makes SVG unsuitable, but the current optics prototype will not establish canvas as the default architecture.
