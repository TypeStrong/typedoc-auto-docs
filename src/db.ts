import fsExtra from 'fs-extra';
const { mkdtempSync, readFileSync, writeFileSync } = fsExtra;
import { join } from 'path';
import { $ } from 'zx';
import initSqlJs from 'sql.js';

/*
 * Does it make any kind of sense to store state in a proper sqlite database?
 * I don't know, but I threw this module together to find out.
 *
 * Theoretically, if this DB is published to GH pages, we can even read it on the
 * frontend.  No idea if that will be useful or not.
 *
 * IS UNTESTED!
 */

const SQLPromise = initSqlJs({});

const dbFilename = 'db.sqlite';

/**
 * A sqlite database persisted as a file in its own git ref.
 *
 * The git ref can be a branch, or it can be a non-branch ref.
 *
 * Assumes that you're already in a directory with a git clone where we can create worktrees
 *
 * NOTE:
 * For better or worse, this has been hacked together under the assumption
 * that this database file is the *only* file in the ref.
 * So you need to give the database its own ref to live in.
 */
export async function createDatabaseFromGit(opts: { gitRef?: string; workdir?: string }) {
  const { workdir = process.cwd(), gitRef = 'refs/heads/db' } = opts;

  await $`git fetch ${gitRef}`;
  const tempDir = mkdtempSync(join(workdir, 'tmp'));
  await $`git worktree add ${tempDir} FETCH_HEAD`;
  const db = readFileSync(join(tempDir, dbFilename));
  const database = new (await SQLPromise).Database(db);

  async function pushDatabaseToGit() {
    const buffer = database.export();
    writeFileSync(join(tempDir, dbFilename), buffer);
    await $`git -C ${tempDir} add ${dbFilename}`;
    await $`git -C ${tempDir} commit -m "update database"`;
    await $`git -C ${tempDir} push HEAD:${gitRef}`;
  }
  async function discardWorktree() {
    await $`git worktree remove ${tempDir}`;
  }

  return {
    tempDir,
    database,
    pushDatabaseToGit,
    discardWorktree,
  };
}
