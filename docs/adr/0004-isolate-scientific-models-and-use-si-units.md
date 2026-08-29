# Isolate scientific models and use SI units

Each resource keeps its scientific and mathematical model independent from interface state, SVG rendering, and user interactions so fundamental laws can be tested without a browser. Calculations use coherent SI units and retain full numerical precision; resources convert to context-appropriate pedagogical units and round values only when displaying them, while invalid, singular, infinite, and out-of-domain results remain explicit model states.
