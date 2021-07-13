# typedoc-auto-docs
An idea from TS Discord to automatically render docs for the ecosystem, similar to docs.rs and doc.deno.land

## Motivation

- docs are rendered without requiring any intervention from library authors
- cross-linking: if libA depends on libB, types in libA docs link to types in libB docs
- consistency: same as rust and deno, by making docs automatic, encourage the ecosystem to embrace them
- both DefinitelyTyped and bundled declarations: libraries typed on both of these styles should be documented in the same style
