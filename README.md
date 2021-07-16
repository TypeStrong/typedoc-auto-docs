# typedoc-auto-docs

An idea from TS Discord to automatically render docs for the ecosystem, similar to docs.rs and doc.deno.land

## Motivation

- docs are rendered without requiring any intervention from library authors
- cross-linking: if libA depends on libB, types in libA docs link to types in libB docs
- consistency: same as rust and deno, by making docs automatic, encourage the ecosystem to embrace them
- both DefinitelyTyped and bundled declarations: libraries typed on both of these styles should be documented in the same style

## MVP non-goals

- Extreme scale:
  - we know an MVP will do things that are not scaleable. We will implement the MVP with an eye towards eventual scale, but we'll make pragmatic choices in the short-term.
- Supporting every possible library
  - in the JS ecosystem, libraries often do non-standard things. The MVP will simply not support these libraries.
  - They may eventually be supported if the value is high enough.
  - However, it may be more pragmatic to encourage those libraries to adjust and be more standard.
