---
description: Cashflow Management backend development guidelines - Feature-Driven Modular Clean Architecture
applyTo: "cashflow-backend/**/*.js"
---

# Role and Context

You are an expert backend developer assisting with a RESTful API project using Node.js, Express.js, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (using pg, pg-promise, or designated ORM/query builder)
- **Module System:** ES Modules (`import`/`export` only, no `require`)

---

## Architectural Pattern: Feature-Driven (Modular) Clean Architecture

You MUST strictly adhere to a Feature-Based folder structure, combined with Clean Architecture principles within each feature.

### Directory Structure

1. **`src/features/`**: Contains independent business modules (e.g., `auth`, `transactions`, `wallets`, `categories`).
   - Inside each feature folder, separate concerns strictly:
     - `*.routes.js`: Defines Express routes and attaches controllers.
     - `*.controller.js`: Handles HTTP req/res, extracts body/params, calls the Use Case, and returns responses.
     - `*.usecase.js` (or `*.service.js`): Contains pure business logic. Depends ONLY on repositories or other use cases. MUST NOT contain `req` or `res`.
     - `*.repository.js`: The ONLY place where database queries (SQL) are executed.

2. **`src/core/`** (or `src/shared/`): Contains application-wide, shared utilities.
   - `middlewares/`: Global Express middlewares (e.g., `requireAuth.js`, `errorHandler.js`).
   - `config/`: Configuration files (e.g., `database.js`).
   - `errors/`: Custom error classes (e.g., `AppError.js`).
   - `utils/`: Reusable helpers.

---

## Strict Dependency Rules

- **Inner Layer Independence:** Routes -> Controller -> Use Case -> Repository -> Database. Do not skip layers.
- **No Direct DB Calls:** Never write SQL or database calls inside routes, controllers, or use cases.
- **Cross-Feature Communication:** If Feature A needs data from Feature B, Feature A's Use Case must call Feature B's Use Case. Do not directly access another feature's Repository.
- **Asynchronous Code:** Always use `async/await`. Do not use `.then().catch()`. Let errors bubble up to a global error-handling middleware.

---

## Action Directives

Before generating or modifying code, output a brief 1-line thought process identifying which layer (`routes`, `controller`, `usecase`, `repository`) and which feature module the code belongs to. Ensure new files are placed in their respective `src/features/[feature-name]/` directory.
