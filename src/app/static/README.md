# HINT front end

A Vue 3 app with Vuex, built with [Vite](https://vite.dev). The source and the tests are in `./src`.
The build writes to `./public`, and Kotlin serves that folder at `/public/`.

## Editor

[VS Code](https://code.visualstudio.com/) with the [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
extension (it was called Volar), or IntelliJ. The repository has IntelliJ style files: <kbd>ctrl + alt + l</kbd> (Linux)
formats a file to the lint rules. `.editorconfig` gives the basic style (for example, indent with 4 spaces) to the
editors that read it.

## Install

Use the Node version in `.nvmrc`.

```sh
npm install
```

## Dev server with hot reload

Start Kotlin without a front-end build, then start the Vite dev server. See the [main README](../../../README.md).

```sh
# from the root of the repository
src/gradlew -PhotReload=true -p src app:bootRun
# from this folder, in another terminal
npm run dev
```

Open http://localhost:5173, not port 8080. The dev server gets each page from Kotlin (with your cookies) and adds the
code from `./src`. It sends all other requests to Kotlin. If Kotlin is not at http://localhost:8080, set
`HINT_BACKEND_URL`, for example `HINT_BACKEND_URL=http://localhost:8081 npm run dev`.

The dev server also adds the [Vue DevTools](https://devtools.vuejs.org/) to the page. Press <kbd>alt + shift + d</kbd>
to open them. The production build does not include them.

## Production build

```sh
npm run build       # type check and build into ./public (at the same time)
npm run build-only  # build only
npm run type-check  # type check only (CI runs this too)
```

To see the production build in a browser, run `npm run build`, start Kotlin without `-PhotReload=true`, and open
http://localhost:8080.

The build writes:

- `./public/assets/`: the JavaScript and CSS files. Each name contains a hash of the content, so a browser never uses an
  old file after a deploy. The `.map` files are the source maps.
- `./public/vite-assets.ftl`: the `<script>` and `<link>` tags for the current build. `index.ftl` includes it.
- `./public/css/app.css`: a copy of the CSS with a fixed name, for `login.ftl` and `404.ftl`.

`npm run copy` copies the templates and the images to `./public`. Gradle runs it after the build.

The type check is `vue-tsc --build`. It checks the projects in `tsconfig.json`, as in a new
[create-vue](https://github.com/vuejs/create-vue) app:

| Config | Files |
| --- | --- |
| `tsconfig.app.json` | the app (`src/app`) |
| `tsconfig.vitest.json` | the unit and integration tests (`src/tests`) |
| `tsconfig.node.json` | the config files for Vite, Vitest, ESLint and Playwright |
| `src/tests/e2e/tsconfig.json` | the Playwright tests |

The type check does not check the `<template>` blocks or the `.d.ts` files of the packages.

## Tests

| What | Command | Files | Config |
| --- | --- | --- | --- |
| Unit tests ([Vitest](https://vitest.dev/)) | `npm run test:unit` | `src/tests/**/*.test.ts` | `vitest.config.ts` |
| Integration tests | `npm run test:integration` | `src/tests/**/*.itest.ts` | `test-integration-configs/integration.ts` |
| ADR integration tests | `npm run test:adr-integration` | `adr-dataset.itest.ts` | `test-integration-configs/adr-integration.ts` |
| Browser tests ([Playwright](https://playwright.dev)) | `npm run test:e2e` | `src/tests/e2e/*.spec.ts` | `playwright.config.ts` |

- `npm run test:unit` watches the files and runs the tests again when you change a file. To run the tests one time,
  use `npm run test:unit -- --run`. Add `--coverage` to get the coverage (CI does this).

- The integration tests need the app and its dependencies. Start them with
  `./scripts/run-dev-dependencies-for-integration-tests.sh` from this folder.
- The browser tests need a running app at http://localhost:8080 (set `baseURL` to use another address). The first time,
  install the browsers with `npx playwright install`.
- Some useful Playwright options: `npm run test:e2e -- smoke.spec.ts` runs one file, and `-- --debug` opens the
  inspector.

## Lint

```sh
npm run lint        # fixes what ESLint can fix, and lists the other errors
npm run lint:check  # only lists the errors, as CI does
```

CI runs `lint:check` and fails if there are lint errors. The config is `eslint.config.ts`. We use the basic ESLint, TypeScript and Vue
recommendations. ESLint checks the app and the config files; it does not check the tests. Our only custom rule: you can import
`rawDeepClone` only in Vuex actions and mutations, because Vue does not track its reads, so a `computed` or `watch`
that uses it does not update. ESLint does not check the indentation. The IntelliJ style files indent the content of the
`<template>` and `<script>` blocks of a Vue component by 4 spaces.

## Types from hintr

`src/app/generated.d.ts` is made from the [hintr API schema](https://github.com/hivtools/hintr/tree/main/inst/schema).
To make it again, run this from this folder:

```sh
./scripts/generate-types.sh <HINTR_BRANCH>
```

## Supported browsers

The `browserslist` field in `package.json` gives the browsers that we support. The build uses this list to select the
JavaScript and CSS syntax. It does not add polyfills. To see the browsers in the list, run `npx browserslist`.
