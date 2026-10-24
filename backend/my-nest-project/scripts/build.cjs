/**
 * `npm run build`.
 *
 * Locally (and in Docker/Render): compile to dist/ with the Nest CLI.
 *
 * On Vercel: type-check only. Vercel's backend builder deploys a `dist/` folder
 * produced by the build script *as the whole function* — without node_modules
 * beside it ("Cannot find module '@nestjs/common'"). With no dist/, Vercel
 * bundles src/main.ts itself and traces dependencies correctly.
 */
const { spawnSync } = require('node:child_process');

const [cmd, args] = process.env.VERCEL
  ? ['tsc', ['-p', 'tsconfig.json', '--noEmit', '--incremental', 'false']]
  : ['nest', ['build']];

const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
