## Metadata Store — Knowledge Transfer (KT) Guide

### Purpose
This frontend lets anyone create, update, and retrieve digital asset metadata. It talks to a REST API and optionally asks the backend to persist data on‑chain.

### Audience
- Developers integrating or extending the UI
- QA validating flows
- Support/Ops using the tool for day‑to‑day submissions

---

## 1) Run locally

### Prerequisites
- Node 18+ (LTS recommended)
- pnpm (preferred) or npm/yarn

### Install & start
1. Create `.env.local` in the project root with the API base URL. If omitted, the app defaults to the public backend.

```
NEXT_PUBLIC_API_BASE_URL=https://comfortage-metadata-backend.onrender.com
```

2. Install deps and run the dev server:

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

Code entrypoint: `app/page.tsx`.

---

## 2) UI walkthrough

The page is split into three areas: Retrieve, Create/Update, and Preview/Response.

### A) Retrieve Metadata
1. Enter an existing metadata `ID` or a `name` in the search field.
2. Click “Search”.
3. The raw server result appears in the grey box.
4. If you want to edit the found record, click “Load to Form” to populate the Create/Update form.

What happens in code
- GET `${NEXT_PUBLIC_API_BASE_URL}/metadata/{idOrName}`

### B) Create / Update Metadata

- **Optional ID**: bytes32 or plain string. Leave blank to auto‑generate/hash on the server.
- **Name**: required unless you provide full JSON in Attributes.
- **Image URL**: any valid URL.
- **Attributes (Custom JSON)**: When present and valid JSON, this overrides the Name/Image fields and is sent as `data`.

Storage options
- **Store on‑chain**: Ask backend to record the metadata hash on chain.
- **Also store locally**: Ask backend to additionally persist to its local store.

Actions
- Click “Submit Metadata”.
- The right panel shows the formatted server response; toast notifications confirm success/failure.

Live feedback
- “Live Preview” mirrors what will be sent (either field‑level payload or your custom JSON).

What happens in code
- If Attributes parses to an object, payload is `{ id?, data, storeOnChain, storeLocal }`.
- Otherwise payload is `{ id?, name, image, attributes, storeOnChain, storeLocal }`.
- POST to `${NEXT_PUBLIC_API_BASE_URL}/metadata`.

---

## 3) Data shapes and examples

### Option 1 — Provide full JSON (recommended when you already have a schema)
Paste into Attributes:

```json
{
  "name": "Golden Ticket #1",
  "image": "https://example.com/ticket.png",
  "attributes": [
    { "trait_type": "Tier", "value": "Gold" },
    { "trait_type": "Admit", "value": 1 }
  ]
}
```

Request body that is sent:

```json
{
  "id": "optional-id-or-blank",
  "data": {
    "name": "Golden Ticket #1",
    "image": "https://example.com/ticket.png",
    "attributes": [ {"trait_type":"Tier","value":"Gold"}, {"trait_type":"Admit","value":1} ]
  },
  "storeOnChain": true,
  "storeLocal": false
}
```

### Option 2 — Use fields + lightweight attributes
Leave Attributes empty or invalid JSON, then fill Name/Image and (optionally) Attributes as a simple object/array.

```json
{
  "id": "optional-id-or-blank",
  "name": "Golden Ticket #1",
  "image": "https://example.com/ticket.png",
  "attributes": [
    { "trait_type": "Tier", "value": "Gold" }
  ],
  "storeOnChain": true,
  "storeLocal": false
}
```

### Retrieve example (curl)

```bash
curl -s "${NEXT_PUBLIC_API_BASE_URL}/metadata/<id-or-name>"
```

### Health check

```bash
curl -s "${NEXT_PUBLIC_API_BASE_URL}/health"
```

---

## 4) Operational tips

- If the header shows “API offline”, verify `NEXT_PUBLIC_API_BASE_URL` and server health.
- If submission fails, inspect the right‑side “API Response” box for errors.
- Ensure the Attributes textarea contains valid JSON when you intend to override fields.
- Use “Load to Form” to quickly update existing records.

---

## 5) Troubleshooting

- JSON parse errors: Validate with a formatter; the UI will still send raw text if invalid, so prefer valid JSON.
- CORS/network errors: Confirm backend allows your origin and is reachable.
- On‑chain disabled: The backend decides chain/RPC; check server config if writes are rejected.

---

## 6) Code pointers

- `app/page.tsx`
  - `handleSubmit` — builds payload and POSTs to `/metadata`
  - `handleRetrieve` — GETs `/metadata/{idOrName}`
  - `handleLoadToForm` — hydrates the form from retrieve result
  - `updateJsonPreview` — updates the live preview JSON
  - `checkApi` — GETs `/health` for status badge

---

## 7) Change log (doc)
- v1: Initial KT guide with local setup, flows, and API notes (Sep 2025)


