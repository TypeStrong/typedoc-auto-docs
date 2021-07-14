#!/usr/bin/env env2rc
// env2rc is driven by the .env2rc file

/*
 * So far this script will:
 * Install each library in targets.jsonc
 * Naively attempt to render docs from the npm package.  Very simple implementation.
 * - all docs output into a temp directory
 * 
 * It will *not*:
 * push the docs to gh pages
 * work on windows (probably)
 */

import fsExtra from 'fs-extra';
const { mkdirpSync, mkdtempSync, readFileSync, writeFileSync } = fsExtra;
import { join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import {ParseError as JsoncParseError} from 'jsonc-parser';
import jsoncParser from 'jsonc-parser';
const {parse: parseJsonc} = jsoncParser;
import { $ } from 'zx';
import { getPathToModuleEntrypoint } from './ts-entrypoint-resolver.js';
import assert from 'assert';

// Running as native ESM so we don't get __dirname
const __root = resolve(fileURLToPath(import.meta.url), '../..');

// Parse list of libs to render as .jsonc
const errors: JsoncParseError[] = [];
const libsToBuild = parseJsonc(readFileSync(join(__root, 'targets.jsonc'), 'utf8'), errors, {
    allowTrailingComma: true,
});
if(errors.length) throw errors;

// Create a temp directory to work in
const tempDir = mkdtempSync(join(__root, 'tmp'));
const docsOutputRoot = join(tempDir, 'docs');

// For each lib, render it
for(const lib of libsToBuild) {
    const libSanitizedDir = lib.replace(/[@\/]/g, '_');
    const workdir = join(tempDir, libSanitizedDir);

    mkdirpSync(workdir);
    cd(workdir);

    // Create empty package.json, then ask yarn to install the lib as a dependency.
    // This creates a node_modules directory
    writeFileSync(join(workdir, 'package.json'), '{}');
    await $`yarn add --ignore-scripts ${lib}`;

    // Figure out the lib's typings entrypoint (.d.ts not .js)
    const entrypointPath = getPathToModuleEntrypoint(lib, workdir)!;
    assert(entrypointPath);

    // cd(join(workdir, `node_modules/${lib}`));

    // typedoc needs a tsconfig file.  Create one
    const tsconfigPath = join(workdir, `tsconfig.json`);
    writeFileSync(tsconfigPath, JSON.stringify({
        files: [relative(workdir, entrypointPath)],
        compilerOptions: {
            target: 'esnext',
            module: 'esnext',
            moduleResolution: 'node'
        }
    }));
    // output docs to this directory
    const outDir = join(docsOutputRoot, libSanitizedDir);
    
    // NOTE not catching errors.  If non-zero exit code, will continue to the next lib
    await $`typedoc --tsconfig ${tsconfigPath} --entryPoints ${entrypointPath} --out ${outDir}`;
}