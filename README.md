# SevaConnect

SevaConnect is a benefits navigator prototype that helps people browse public schemes, read scheme information, follow official links, and ask an AI assistant questions. This README is the single project guide for setup, user and admin workflows, and the backend.

> SevaConnect is not an official government service. Scheme matches are informational; final eligibility and approval belong to the relevant government authority.

## Contents

- [Project at a glance](#project-at-a-glance)
- [Running locally](#running-locally)
- [Visitor workflows](#visitor-workflows)
- [Admin workflow](#admin-workflow)
- [Backend request path](#backend-request-path)
- [MongoDB collections](#mongodb-collections)
- [API reference](#api-reference)
- [Authentication and roles](#authentication-and-roles)
- [Main source files](#main-source-files)
- [Evaluator demo flow](#evaluator-demo-flow)

## Project at a glance

SevaConnect is an informational government-benefits navigator prototype. Visitors can browse scheme summaries, open official links, save a profile in their browser, and ask an AI assistant questions. It does not submit government applications or make final eligibility decisions.

The application has three parts:

1. **Client:** React and Vite, served during development at http://localhost:5173.
2. **API:** Node.js and Express, served at http://localhost:5000.
3. **Database:** MongoDB accessed from the server through Mongoose.

In development, Vite forwards browser requests beginning with /api to Express. The browser never connects directly to MongoDB. The server reads secrets and configuration from the root .env file.

## Running locally

From the repository root:

    npm install
    npm run dev

The health endpoint is http://localhost:5000/api/health. The server reads settings from a root .env file. This repository does not include an .env.example. Create the file in the repository root and set at least:

    MONGODB_URI=your-mongodb-connection-string
    JWT_SECRET=replace-with-a-private-random-secret

For Ollama Cloud, configure:

    AI_PROVIDER=auto
    OLLAMA_ENABLED=true
    OLLAMA_API_KEY=your-ollama-api-key

Other optional settings include PORT, CLIENT_URL, OLLAMA_BASE_URL, OLLAMA_MODEL, GROQ_API_KEY, GEMINI_API_KEY, and OPENAI_API_KEY. The Ollama default model is explained below. Keep credentials out of client code and do not commit .env.

Load or refresh the curated scheme records with:

    npm run seed --workspace server

This command upserts the curated seed records; it does not clear the schemes collection. Public catalogue browsing can fall back to in-memory seed data if MongoDB is unavailable. Admin writes require a live database.

## Visitor workflows

### Browse schemes

The client requests GET /api/v1/schemes?limit=100 when the page loads. The backend reads active catalogue entries from MongoDB and sorts them by display order. The client renders cards, then performs text search, category filtering, and pagination in the browser. If the API request fails or returns no schemes, the client uses bundled fallback cards.

The seed catalogue contains 20 cards. Detailed eligibility rules and required documents are supplied only where the project has those details; the remaining cards do not get inferred rules. Scheme links direct users to official sources; SevaConnect itself does not submit applications.

### Profile and saved cards

The public profile form collects state, age, gender, residence type, annual family income, and occupation. It is saved in browser localStorage under sevaconnect.profile.v1. It survives a refresh in the same browser but is not attached to a user account or shared across browsers. Clearing this browser's site data removes it.

When a user asks the AI a question, the profile is sent with that chat request. The public page does not save the profile to the users collection. The card bookmark controls keep saved IDs in React state for the current page session; they do not persist across refreshes. Account-based profile and saved-scheme APIs exist but are not wired into the public page.

### AI chat and Ollama

The client sends the question, selected language, optional profile, and current conversation ID to POST /api/v1/ai/chat. The backend loads the catalogue, applies deterministic eligibility rules if a profile was sent, selects relevant scheme facts, and builds a grounded prompt containing those facts, the match information, a language instruction, and the user's question.

The rules engine computes the match. The language model produces an explanation and is instructed not to make official eligibility decisions.

Default Ollama configuration in server/src/config/env.js:

| Setting | Default |
| --- | --- |
| OLLAMA_BASE_URL | https://ollama.com/api |
| OLLAMA_MODEL | gpt-oss:20b-cloud |

The server sends the grounded prompt to the configured Ollama chat endpoint. Ollama is the provider/runtime; gpt-oss:20b-cloud is the configured model served through it. This is distinct from calling OpenAI directly, which uses OPENAI_API_KEY. AI credentials remain on the server and are not sent to the browser.

In AI_PROVIDER=auto mode, Ollama is attempted first only when OLLAMA_ENABLED=true or OLLAMA_API_KEY is set. If that call fails, the backend attempts configured providers in this order: Groq, Gemini, OpenAI, then SevaConnect's built-in response engine. AI_PROVIDER can also select a specific provider or builtin. GET /api/v1/ai/status reports the configured provider information shown in the assistant panel; it does not verify that an external service is reachable.

The server writes user and assistant messages to the conversations collection when MongoDB is connected. The browser stores the conversation ID only in page memory, so refreshing starts a new visible chat. The public site has no saved-history screen. Guests can chat, so some conversation records have no user account association. The profile and question are sent to the server, and may be included in a request to the configured external provider; avoid sharing highly sensitive information in this prototype.

### Eligibility guidance

The deterministic eligibility engine compares profile fields to structured scheme rules. It supports operators such as equals, not-equals, greater/less-than, membership in a list, between, and exists. It returns POTENTIALLY_RELEVANT, NEEDS_VERIFICATION, or NOT_CURRENTLY_MATCHED with matched, failed, and unverifiable criteria. These are informational matches, not official decisions.

## Admin workflow

The admin page is http://localhost:5173/admin and is linked from the site footer. It contains a sign-in form and catalogue manager, but there is no public admin signup form. The registration API always creates CITIZEN accounts; users cannot choose their own role.

From the repository root, run:

    npm run admin:create --workspace server

This terminal command uses the MongoDB URI in the root .env. It asks for a name and email. If the email is new, it asks for a password without showing the typed characters and creates an ADMIN account. If that email already exists, it promotes the account to ADMIN and leaves its password unchanged. Check the database name in MONGODB_URI before running it.

Sign in at /admin with that email and password. The page keeps the access token in memory and requests the admin catalogue. The API allows only ADMIN and CONTENT_MANAGER roles to manage schemes. Knowing the /admin URL or seeing its footer link does not grant access.

The manager can add and edit scheme names, card descriptions, categories, audience, official links, source status, eligibility rules, and required documents. It can deactivate a scheme so the public catalogue hides it. The server validates each payload, writes it to MongoDB, and assigns a display order to new entries. Reload the public page to fetch changes.

Admin endpoints:

- GET /api/v1/schemes/manage — list catalogue records for the manager.
- POST /api/v1/schemes — create a record.
- PUT /api/v1/schemes/:schemeId — update a record.

## Backend request path

The server entry point is server/src/server.js. It applies security headers, CORS, global/auth/AI rate limits, request IDs, JSON parsing, and request logging before routing requests.

The code is arranged in layers:

1. **Routes** map URLs and HTTP methods and choose required middleware.
2. **Middleware** verifies tokens, checks roles, validates input, and formats errors.
3. **Controllers** coordinate a request and form the response.
4. **Services** implement scheme access, eligibility evaluation, and AI generation.
5. **Mongoose models** define record fields, validation, and indexes.

Successful responses contain success, data, and meta.requestId. Errors contain success=false, an error code and message, and a request ID. Scheme browsing falls back to in-memory seed data; admin CRUD returns an error if the database is offline.

## MongoDB collections

The database name is the final path component of MONGODB_URI; the project has been configured to use test.

| Collection | What it stores | Use in the current app |
| --- | --- | --- |
| schemes | Catalogue details, official links, rules, documents, active flag, and display order. | Core end-to-end feature: public browsing and admin management use it. |
| users | Account email, hashed password, role, profile, saved IDs, refresh token. | Auth/account APIs exist. The public site has no signup/login screen and stores its profile locally instead. |
| conversations | User and assistant messages, language, timestamps, optional account reference. | The chat writes messages when MongoDB is connected. There is no public history screen. |
| eligibilityresults | Per-user/scheme status, score, matched/failed criteria, and verification needs. | Written by authenticated eligibility APIs. The public client does not call those endpoints; AI chat calculates guidance separately. |
| applications | User, scheme, progress status, notes, and status events. | Backend model and endpoints exist, but the public site has no application tracker and does not call them. |

Atlas may also show MongoDB system databases such as admin, local, and config. These are not SevaConnect collections.

## API reference

All routes below use /api/v1 unless stated otherwise.

| Method and path | Access | Purpose |
| --- | --- | --- |
| GET /api/health | Public | API process health. |
| POST /api/v1/auth/register | Public | Create a CITIZEN; no signup page is connected. |
| POST /api/v1/auth/login | Public | Check credentials and issue JWTs. |
| POST /api/v1/auth/refresh | Refresh token | Issue replacement tokens. |
| POST /api/v1/auth/logout | Signed in | Revoke the stored refresh token. |
| GET /api/v1/auth/me | Signed in | Return current account. |
| GET /api/v1/schemes | Public | List/filter; supports q, category, state, page, limit. |
| GET /api/v1/schemes/:schemeId | Public | Read a scheme. |
| GET /api/v1/schemes/:schemeId/documents | Public | Read required documents. |
| GET /api/v1/schemes/manage | Admin/content manager | List manageable catalogue. |
| POST /api/v1/schemes | Admin/content manager | Add a scheme. |
| PUT /api/v1/schemes/:schemeId | Admin/content manager | Edit a scheme. |
| GET /api/v1/schemes/:schemeId/eligibility | Signed in | Evaluate one scheme and save the result. |
| POST /api/v1/recommendations/run | Signed in | Evaluate active schemes and save results. |
| POST or DELETE /api/v1/schemes/:schemeId/save | Signed in | Save or unsave a scheme. |
| GET /api/v1/users/me/saved-schemes | Signed in | List account-saved schemes. |
| GET /api/v1/users/me/profile; PUT /api/v1/users/me/profile | Signed in | Read or update account profile. |
| PATCH /api/v1/users/me | Signed in | Update account name. |
| GET or POST /api/v1/users/me/applications | Signed in | List or start application tracking. |
| GET or PATCH /api/v1/users/me/applications/:applicationId | Signed in | Read or advance an owned application. |
| GET /api/v1/ai/status | Public | Report AI configuration. |
| POST /api/v1/ai/chat | Guest or signed in | Chat with optional profile, language, and conversation ID. |
| POST /api/v1/ai/explain-scheme | Guest or signed in | Request a scheme explanation. |
| POST /api/v1/ai/explain-eligibility | Guest or signed in | Request eligibility explanation. |
| POST /api/v1/ai/explain-document | Guest or signed in | Request document explanation. |
| GET, GET by ID, or DELETE /api/v1/ai/conversations | Signed in | List, read, or delete conversations owned by the account. |

The eligibility, application, and account-based saved-scheme APIs are backend capabilities; they do not currently have public user screens connected. Guest conversation records have no user ID and are not returned from authenticated conversation-history endpoints.

## Authentication and roles

There is no citizen login or signup screen in the current public client. The backend registration endpoint accepts name, email, and password, but no role; new accounts default to CITIZEN. Passwords are hashed before they are saved. Login issues access and refresh JWTs. Protected routes read the access token from the Authorization: Bearer header, look up the user, then authorize based on the user's database role.

The admin page checks for ADMIN or CONTENT_MANAGER. Admin creation is performed locally by the terminal command above, not through a public role selector.

## Main source files

| Area | Files |
| --- | --- |
| Route selection | client/src/main.jsx |
| Public page and local workflows | client/src/App.jsx |
| Site header/footer | client/src/components/SiteChrome.jsx |
| Admin screen | client/src/AdminPage.jsx |
| Vite API proxy | client/vite.config.js |
| API setup | server/src/server.js |
| API routes and controllers | server/src/routes/, server/src/controllers/ |
| Scheme lookup | server/src/services/schemes/schemeService.js |
| Eligibility rules | server/src/services/eligibility/eligibilityEngine.js |
| AI provider and chat | server/src/services/ai/aiService.js |
| Database models | server/src/models/ |
| Seed catalogue | server/src/seed/schemes.js |
| Admin creation command | server/src/scripts/createAdmin.js |

## Evaluator demo flow

1. Browse and search the scheme catalogue.
2. Save a profile, refresh the browser, and show it persisted locally.
3. Ask the AI a question about a scheme and follow the official source link.
4. Open /admin, sign in, then add or edit a catalogue entry.
5. Explain that the eligibility result is guidance, while application tracking and saved eligibility results are backend APIs not yet connected to public screens.
