// Built by modifying https://github.com/gdelmas/typedoc-plugin-sourcefile-url

import * as path from 'path';
import * as fs from 'fs';
import { Component } from 'typedoc/dist/lib/utils/component';
import { ConverterComponent } from 'typedoc/dist/lib/converter/components';
import { Converter } from 'typedoc/dist/lib/converter/converter';
import { Context } from 'typedoc/dist/lib/converter/context';
import { SourceReference } from 'typedoc/dist/lib/models/sources/file';
import { Options } from 'typedoc/dist/lib/utils/options/options';
import { sync as pkgUp } from 'pkg-up';
import { URL } from 'url';
import { dirname, relative } from 'path';

@Component({ name: 'unpkg-plugin' })
export class UnpkgPlugin extends ConverterComponent {
  private pkgUpCache = new Map<string, string | null>();
  private pkgUp(cwd: string) {
    let cacheEntry = this.pkgUpCache.get(cwd);
    if (cacheEntry !== undefined) return cacheEntry;
    cacheEntry = pkgUp({ cwd });
    this.pkgUpCache.set(cwd, cacheEntry);
    return cacheEntry;
  }

  public initialize(): void {
    this.listenTo(this.owner, Converter.EVENT_BEGIN, this.onBegin);
  }

  private onBegin(): void {
    // register handler
    this.listenTo(this.owner, Converter.EVENT_RESOLVE_END, this.onEndResolve);
  }

  private onEndResolve(context: Context): void {
    const project = context.project;

    // process mappings
    for (const sourceFile of project.files) {
      const { fullFileName } = sourceFile;
      if (fullFileName) {
        const pkgPath = this.pkgUp(dirname(fullFileName));
        if (pkgPath) {
          const pkg = require(pkgPath);
          const url = new URL('https://unpkg.com/');
          url.pathname = `browse/${pkg.name}@${pkg.version}/${relative(
            dirname(pkgPath),
            fullFileName,
          )}`;
          sourceFile.url = url.toString();
          // TODO should we include version number in this path?
          // e.g. outdent@0.8.0/dist/index.d.ts instead of outdent/dist/index.d.ts?
          sourceFile.fileName = relative(dirname(dirname(pkgPath)), fullFileName);
          // TODO we are mutating the sourceFile.fileName solely so we can copy the value below.
          // Should we avoid mutating sourceFile.fileName, *only* modifying `source.fileName` below?
        }
      }
    }

    // add line anchors
    for (let key in project.reflections) {
      const reflection = project.reflections[key];

      if (reflection.sources) {
        reflection.sources.forEach((source: SourceReference) => {
          if (source.file && source.file.url) {
            source.url = source.file.url + '#L' + source.line;
            source.fileName = source.file.fileName;
          }
        });
      }
    }
  }
}
