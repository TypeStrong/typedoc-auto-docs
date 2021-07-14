#!/usr/bin/env env2rc
// env2rc is driven by the .env2rc file

/*
 * This script does not do anything useful right now.
 * 
 * However, I wanted to start writing down ideas for querying the npm API.
 * 
 * Feel free to adapt or modify this script in any way.
 */

import fsExtra from 'fs-extra';
const { mkdirpSync, mkdtempSync, readFileSync, writeFileSync } = fsExtra;
import { join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import {ParseError as JsoncParseError} from 'jsonc-parser';
import jsoncParser from 'jsonc-parser';
const {parse: parseJsonc} = jsoncParser;
import { $, nothrow } from 'zx';
import { getPathToModuleEntrypoint } from './ts-entrypoint-resolver.js';
import assert from 'assert';
import got from 'got';
import PQueue from 'p-queue';

// Running as native ESM so we don't get __dirname
const __root = resolve(fileURLToPath(import.meta.url), '../..');

// Parse list of libs to render as .jsonc
const errors: JsoncParseError[] = [];
const libsToBuild = parseJsonc(readFileSync(join(__root, 'targets.jsonc'), 'utf8'), errors, {
    allowTrailingComma: true,
});
if(errors.length) throw errors;

const queue = new PQueue({
    autoStart: true,
    concurrency: 50,
});
const results: Promise<{name: string, version: string}>[] = [];
// For each lib, render it
for(const lib of libsToBuild) {
    results.push(queue.add(async () => {
        const response = await got(`https://registry.npmjs.org/${lib}`).json() as any;
        return {
            name: response.name,
            version: response['dist-tags'].latest
        };
    }));
    // TODO query the database
    // If this version of this library has not been rendered, add it to the work queue.
}

for(const promise of results) {
    const result = await promise;
    console.dir(result);
}
