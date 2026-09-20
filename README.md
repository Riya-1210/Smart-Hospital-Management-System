# Smart Hospital Management System

## Active database

The application now uses an independent SQLite database through the backend's existing `query`/`execute` data-access boundary.

- Type: SQLite
- Location: `backend/data/smart-hospital.db`
- Configuration: `backend/.env` with `DATABASE_URL=file:./data/smart-hospital.db`
- Driver: `sqlite3`
- Legacy database and MySQL migration files: preserved, not opened or modified by the SQLite runner

The database directory is created automatically. The SQLite migration is additive and idempotent: it creates the current users, roles, doctors, patients, appointments, beds, emergency, pharmacy, clinical, billing, and AI tables, plus reference data. It never drops or resets anything.

## Fresh-machine setup

From the repository root:

```powershell
npm install
npm run dev
```

The backend dev script runs `db:migrate` and the idempotent demo seed before starting Express. Vite runs on `http://localhost:5173` and proxies `/api` to the backend on `http://localhost:4000`.

Useful backend commands:

```powershell
npm run db:migrate --prefix backend
npm run db:seed --prefix backend
npm run db:validate --prefix backend
npm run build --prefix backend
npm run build
```

Demo password defaults to `demo123` and can be changed with `DEMO_PASSWORD` in `backend/.env`. The seeded accounts include administrator, doctor, nurse, and patient roles.

No XAMPP, Apache, MySQL, MariaDB, or phpMyAdmin service is required.# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
