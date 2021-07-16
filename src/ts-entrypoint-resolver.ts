import ts from 'typescript';
import { join } from 'path';

// Ask the typescript compiler which file `import "module"` refers to
// Useful to ask the compiler, because we need the *types*, not the runtime .js.
// If we called `require.resolve` we would not get the types.
export function getPathToModuleEntrypoint(module: string, dir: string) {
  const result = ts.resolveModuleName(
    module,
    join(dir, 'foo.ts'),
    {
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
    {
      ...ts.sys,
    },
    undefined,
    undefined,
  );
  return result.resolvedModule?.resolvedFileName;
}
