# agents.md

This document defines the rules an agent must follow when working in this monorepo (NestJS, MongoDB, Redis, Hive parsing). All changes must be production-ready.

## 1. General principles

- Prefer simplicity over cleverness.
- Avoid premature abstraction.
- Keep modules loosely coupled.
- Prefer explicit over implicit behavior.

## 2. Architecture

### 2.1 Layering

- Repository pattern is mandatory (base: `MongoRepository<TDocument>` in `@waivio-core/clients`).
- App-specific repositories:
  - Location: `apps/<app>/src/repositories/`
  - Must extend the base repository where appropriate.
- Domain logic (parsers, handlers):
  - Location: `apps/<app>/src/domain/`
- Configuration:
  - Location: `apps/<app>/src/config/`
- Constants:
  - Location: `apps/<app>/src/constants/`
- Controllers must not contain business logic.
- Repositories must not contain business logic (data access only).

### 2.2 Module boundaries

- Apps (`apps/*`) must not depend on other apps.
- Shared logic must live in `libs/`.
- Libs must not import from apps.
- Avoid circular dependencies.
- Each lib must have a clear responsibility:
  - `@waivio-core-services/clients` - database, cache, and blockchain clients (Mongo, Redis, Hive)
  - `@waivio-core-services/common` - shared utilities
  - `@waivio-core-services/processors` - blockchain processing logic

### 2.3 App structure

Inside `apps/<app>/src/`:

- `config/` - env validation (Zod), config factories
- `constants/` - app-specific constants
- `domain/` - business logic, parsers, handlers, schemas
- `repositories/` - app-specific repository implementations

## 3. Repository vs Service layer

### 3.1 Repository rules (data access only)

Repository code:

- Builds MongoDB queries and aggregation pipelines:
  - `$match`, `$lookup`, `$set`, `$push`, filters, projections, lookups, etc.
- Knows collection names, document structure, indexes.
- Returns typed data and hides Mongoose/MongoDB internals.
- Contains no business decisions and no orchestration.

### 3.2 Service rules (business logic only)

Service/domain code:

- Contains formulas, calculations, decisions, orchestration.
- Calls repository methods and never builds pipelines or raw Mongo filters.
- Coordinates multiple repositories when needed.

### 3.3 Red flags (must fix)

Move to repository:

- Service contains `$match`, `$lookup`, `$set`, `$push`.
- Service references collection names (example: `'waiv-stakes'`).

Move to service/domain:

- Repository contains `if/else` business decisions.
- Repository calls other repositories (orchestration belongs in service/domain).

## 4. Monorepo structure

- Nx monorepo (configured in `nx.json`).
- `apps/` - runnable NestJS applications (example: hive-parser, api-service, objects-bot)
- `libs/` - reusable NestJS libraries (clients, common, processors)

Rules:

- Apps can import from libs only via `@waivio-core-services/*`.
- Libs can import from other libs only via barrel exports (`index.ts`).
- Never import deep internal files from another lib.
- Each project has a `project.json` defining targets (build, serve, test, lint).

Correct:

- `import { MongoRepository, MongoClientFactory } from '@waivio-core-services/clients';`
- `import { JsonHelper } from '@waivio-core-services/common';`
- `import { HiveProcessorModule } from '@waivio-core-services/processors';`

Wrong:

- `import { MongoRepository } from '@waivio-core-services/clients/mongo-client/mongo.repository';`

Indexing rules:

- Every lib must have a barrel `index.ts` at `libs/<lib>/src/index.ts`.
- Every sub-module within a lib should have its own `index.ts`.

## 5. Package management

- Single root `package.json` (Nx monorepo).
- Use `npm install` / `npm update`.
- Never manually write versions into `package.json`.
- All dependencies managed at root level.
- Keep dependency graph minimal.

Key runtime deps:

- `@nestjs/*`, `mongoose`, `ioredis`, `@hiveio/dhive`, `zod`, `rxjs`

## 6. Type safety and validation

- TypeScript strict null checks enabled (`strictNullChecks: true`).
- `noImplicitAny` is currently false:
  - Prefer explicit types for new code.
  - Avoid widening `any` usage.
- `@typescript-eslint/no-explicit-any` is off:
  - Use `any` only when truly necessary (example: Mongoose internals).
  - Prefer `unknown` for new code.

Use Zod for runtime validation of:

- Environment variables (see `apps/<app>/src/config/env.validation.ts`).
- Blockchain payloads (custom JSON operations).
- HTTP request bodies.

Never trust external input:

- Blockchain data, API requests, env vars.

Validate environment at startup:

- Use `ConfigModule.forRoot({ validate })` pattern.

## 7. Configuration

- No hardcoded secrets.
- All configuration via environment variables.
- Each app must have:
  - `config/env.validation.ts` - Zod schema + validate function
  - `config/<app>.config.ts` - config factory (default export function)
- Use `@nestjs/config` with:
  - `ConfigModule.forRoot({ isGlobal: true, validate, load })`
- Fail fast on invalid configuration (Zod throws on parse failure).
- `.env` files are gitignored.

## 8. Logging and observability

- Use NestJS `Logger` from `@nestjs/common`.
- Create logger per class: `new Logger(ClassName.name)`.
- No `console.log` in production code.
- Do not log secrets or connection strings.
- Log errors with context (at minimum): `this.logger.error(error.message)`.

## 9. Error handling

- Repository base class catches and logs errors and returns `null` / empty arrays (established pattern).
- Domain/service layer must check for `null` returns from repositories and handle appropriately.
- Use typed error classes for domain errors when needed.
- Map domain errors to HTTP responses in controllers.
- Do not expose stack traces to clients.
- Fail fast for unrecoverable errors (invalid config, missing connections).

## 10. Testing

- Jest with `ts-jest`.
- Unit tests: `*.spec.ts` (co-located with source).
- E2E tests: `*.e2e-spec.ts` (in `apps/<app>/test/`).
- Domain/business logic must be unit-testable without NestJS container.
- Mock infrastructure (repositories, clients).
- Test behavior, not implementation.

Commands:

- `nx test <project>` - run tests for a project
- `nx test <project> --watch` - watch mode
- `nx test <project> --coverage` - with coverage

## 11. Performance

- Blockchain processing is the hot path:
  - Avoid blocking operations in parsers.
- MongoDB pool is pre-configured (example: `maxPoolSize 20`, `minPoolSize 2`).
- Redis URL rotation is handled by `UrlRotationService` in `@waivio-core-services/clients`.
- Be mindful of memory when processing blocks sequentially.
- Avoid unnecessary allocations in block/transaction loops.

## 12. Security

- Validate and sanitize all input (blockchain JSON, API requests).
- Protect against injection in MongoDB queries.
- Avoid mass assignment: use explicit field mapping.
- Prevent prototype pollution when parsing custom JSON from blockchain.
- Connection strings and secrets only via env vars, never committed.

## 13. Documentation

- Prefer latest official docs:
  - NestJS v11: https://docs.nestjs.com
  - Mongoose v9: https://mongoosejs.com/docs
  - Zod: https://zod.dev
  - `@hiveio/dhive`: https://github.com/openhive-network/dhive
- Use context7 MCP when available.
- Do not rely on outdated blog posts.

## 14. Code style

- ESLint flat config (`eslint.config.mjs`) with typescript-eslint + Prettier.
- Prettier: single quotes, trailing commas (all), auto endOfLine.
- Unused vars must be prefixed with `_`.
- Floating promises: warn.
- Prefer small focused functions.
- Prefer composition over inheritance (except `MongoRepository` base class).
- Use descriptive names.
- Avoid deep nesting (prefer early returns).
- Avoid magic numbers (use constants).
- No dead or commented-out code.
- Comments in English only.

## 15. Build and run

- Build: `nx build <project>` (uses webpack via `@nx/webpack`)
- Dev: `nx serve <project>` (continuous mode with watch)
- Prod: `node dist/apps/<app>/main`
- Each app has its own `tsconfig.app.json` extending root `tsconfig.base.json`.
- Each lib has its own `tsconfig.lib.json`.
- Project configuration in `project.json` (targets: build, serve, test, lint).
- Use `nx run <project>:<target>` for explicit target execution.

## 16. Git and changes

- Do not introduce breaking changes silently.
- Keep commits focused.
- Update types when modifying contracts.
- Refactor safely.
- Do not commit `.env` files or secrets.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
