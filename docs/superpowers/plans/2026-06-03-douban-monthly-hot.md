# Douban Monthly Hot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a ForwardWidget module that shows current Douban hot movies and hot TV series as two homepage list sections.

**Architecture:** Create one widget file with two list modules, one for movies and one for TV. Both modules share a small Douban request helper and a mapper that converts Douban subject rows into Forward `VideoItem` objects with `type: "douban"` and no custom `link`.

**Tech Stack:** ForwardWidget JavaScript module, `Widget.http.get`, Node.js offline regression script with mocked `Widget`.

---

### Task 1: Offline Regression Test

**Files:**
- Create: `test-douban-monthly-hot.js`

- [ ] **Step 1: Write the failing test**

Create a Node script that mocks `global.Widget`, evaluates `widgets/douban-monthly-hot.js`, calls the two handlers, and asserts metadata, request parameters, and `VideoItem` field names.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-douban-monthly-hot.js`
Expected: FAIL because `widgets/douban-monthly-hot.js` does not exist yet.

### Task 2: Widget Module

**Files:**
- Create: `widgets/douban-monthly-hot.js`

- [ ] **Step 1: Write minimal implementation**

Define `WidgetMetadata` as the first statement. Add `loadMonthlyHotMovies(params)` and `loadMonthlyHotTV(params)` handlers. Use `Widget.http.get("https://movie.douban.com/j/search_subjects", { headers, params })` and map rows into `VideoItem[]`.

- [ ] **Step 2: Run regression test**

Run: `node test-douban-monthly-hot.js`
Expected: PASS.

### Task 3: Live Smoke Test

**Files:**
- Use: `widgets/douban-monthly-hot.js`

- [ ] **Step 1: Probe Douban endpoints**

Run two `curl` requests against the movie and TV Douban endpoints with browser-like headers.

- [ ] **Step 2: Confirm module fields**

Check that returned data includes usable `id`, `title`, `cover`, and rating fields. Confirm the module handles empty ratings as `0`.
