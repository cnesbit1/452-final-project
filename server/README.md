# Job Tracker Server — Local Setup & API Guide

A single place for everything you need to run the local Node server, create the database schema on Timescale/Postgres, and call the API from your Chrome extension.

---

## Overview

This project uses:

* **Node.js + Express** for the API
* **pg** (connection pool) with **TLS verification**
* **Timescale/Postgres** as the database
* A simple **Jobs** data model with derived **Companies** and **User** stats

---

## Prerequisites

* Node.js **18+** installed
* A Timescale/Postgres connection URL (include `?sslmode=require`)

---

## Run Server

Run this:

```bash
npm start
```

---

## Folder Layout (server/)

```
server/
  ├─ server.js
  ├─ db.js
  ├─ schema.sql
  ├─ .env
  ├─ .env.example
  ├─ package.json
  └─ scripts/
      ├─ inspect.js
      └─ migrate.js
```

---

## Environment

Create a `.env` in `server/` (you can copy from `.env.example`).

```ini
# server/.env
DATABASE_URL=postgres://USER:PASS@HOST:PORT/DB?sslmode=require
PORT=8080
```

---

## Database Schema (`server/schema.sql`)

A rerunnable schema that creates the `app` schema, the `job_status` enum, and tables/views/indexes. It also seeds a dev user with `id=1` so API calls work immediately.

---

## Run the Schema Without `psql`

`server/scripts/migrate.js`

Run this:

```bash
npm run migrate
```
---

## Inspect Tables/Views Without `psql`

`server/scripts/inspect.js`

Run this:

```bash
npm run inspect
```