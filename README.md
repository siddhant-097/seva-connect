# SevaConnect 🇮🇳

> **Don't just find a scheme. Get ready to claim it.**

## Local Development

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
copy .env.example .env
npm run dev
```

The Vite client runs at `http://localhost:5173` and the Express API runs at
`http://localhost:5000`. The API health check is available at
`http://localhost:5000/api/health`.

Available checks:

```bash
npm run build
npm run lint
```

SevaConnect is a citizen-centric **Government Benefits Navigator** designed to help people discover potentially relevant government welfare schemes, understand why they may match, identify missing documents, prepare applications, and track their progress from discovery to application.

The project is being developed for **HackNTech 11.0** under:

- **Theme #1 — FinTech for Financial Inclusion**
- **Problem Area — Government-benefit accessibility**

> **Important:** SevaConnect is a hackathon prototype and is not an official government service. Eligibility shown by the platform is an informational match based on available profile data and should not be treated as a final government eligibility decision.

---

## 🚀 The Problem

Government schemes can provide important benefits related to housing, healthcare, education, employment, skills, agriculture, and financial inclusion. However, citizens may find it difficult to:

- Discover schemes relevant to their situation
- Understand complicated eligibility conditions
- Know why a scheme is recommended
- Identify documents they need
- Understand the application process
- Keep track of applications and next steps

SevaConnect addresses this gap with a single, personalized workflow.

---

## 💡 Our Solution

SevaConnect transforms a citizen's profile into a guided journey:

```text
Citizen Profile
      ↓
Scheme Discovery
      ↓
Eligibility Matching
      ↓
"Why You Matched"
      ↓
Document Readiness
      ↓
Application Checklist
      ↓
Application Tracking
```

The platform combines a **rule-based eligibility engine** with an **AI assistance layer**.

### Why rule-based eligibility?

The eligibility engine uses structured scheme rules for matching. AI is used for explanation and assistance, not as the authority that determines eligibility.

```text
Structured Government Scheme Rules
              ↓
       Eligibility Engine
              ↓
   Potentially Relevant /
   Needs Verification /
   Not Currently Matched
              ↓
       AI Explanation
```

This makes the system more transparent and easier to audit.

---

# ✨ Key Features

## 1. 👤 Citizen Profile

Users create a profile containing relevant information such as:

- Age
- Gender
- State
- District
- Urban/Rural residence
- Occupation
- Annual family income
- Social category
- Disability status
- Marital status
- Student/farmer status

The profile is used to personalize scheme discovery.

---

## 2. 🎯 Personalized Scheme Discovery

SevaConnect evaluates the user's profile against structured scheme criteria and presents potentially relevant schemes.

Instead of making users search through large lists, the dashboard prioritizes schemes relevant to their profile.

---

## 3. ⚖️ Eligibility Matching Engine

The platform evaluates scheme rules using deterministic logic.

Possible results:

### 🟢 Potentially Eligible

Known profile information matches the configured criteria.

### 🟡 Needs Verification

Some information or official documentation is still required.

### ⚪ Not Currently Matched

One or more known criteria do not match the configured scheme requirements.

SevaConnect avoids presenting a prototype result as a guaranteed legal or administrative eligibility decision.

---

## 4. 🔍 Why You Matched

For every recommendation, the user can see the factors that contributed to the match.

Example:

```text
Why SevaConnect matched this scheme

✓ Age requirement matched
✓ Income requirement matched
✓ State requirement matched

⚠ Income certificate needs verification
```

This improves transparency and user trust.

---

## 5. 📄 Document Readiness

Each scheme can define its required documents.

The platform can show:

```text
Application Readiness

4 / 6 documents ready

✓ Aadhaar
✓ Address Proof
✓ Photograph
✓ Bank Account

⚠ Income Certificate
⚠ Category Certificate
```

---

## 6. 📝 Application Checklist

Users can follow a structured application process:

```text
1. Review eligibility
2. Prepare required documents
3. Open the official application source
4. Submit the application
5. Track progress
```

Official application links and source information are displayed where available.

---

## 7. 📊 Application Tracker

Users can save schemes and track their progress.

Example:

```text
Housing Scheme

✓ Discovered
✓ Eligibility Checked
✓ Documents Prepared
→ Application Submitted
○ Awaiting Response
```

---

## 8. 👨‍👩‍👧 Family Benefits

A future-facing feature of SevaConnect is household-level benefit discovery.

Instead of asking only:

> "What schemes can I get?"

the platform can help answer:

> "What government benefits may be relevant to my household?"

---

## 9. 🤖 AI Assistant

The AI layer is designed to make government information easier to understand.

Potential capabilities include:

- Explain a scheme in simple language
- Explain eligibility criteria
- Explain required documents
- Answer natural-language questions
- Provide Hindi/Hinglish assistance
- Translate scheme information

### Example

**User:**

> Why am I seeing this scheme?

**Assistant:**

> Your profile matches the listed income and location criteria. You may still need to verify your income certificate before applying.

---

# 🏗️ System Architecture

```text
                         SEVACONNECT
                              │
             ┌────────────────┴────────────────┐
             │                                 │
       Citizen Profile                    Scheme Data
             │                                 │
             └────────────────┬────────────────┘
                              ↓
                    Eligibility Engine
                              ↓
                 Personalized Matching
                              ↓
          ┌───────────────────┼──────────────────┐
          ↓                   ↓                  ↓
     Explanation        Document Readiness    AI Assistant
          │                   │                  │
          └───────────────────┼──────────────────┘
                              ↓
                    Application Tracker
                              ↓
                       Citizen Action
```

---

# 🛠️ Technology Stack

## Frontend

- React
- React Router
- Tailwind CSS
- Axios
- Recharts

## Backend

- Node.js
- Express.js
- REST APIs
- JWT Authentication

## Database

- MongoDB
- Mongoose

## AI

- LLM API
- AI-powered explanation
- Natural-language assistance
- Translation support

---

# 📁 Project Structure

```text
seva-connect/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Scheme.js
│   │   ├── EligibilityResult.js
│   │   └── Application.js
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   │   ├── eligibilityEngine.js
│   │   └── recommendationEngine.js
│   ├── middleware/
│   ├── seed/
│   │   └── schemes.js
│   └── server.js
│
├── .env
├── .gitignore
└── README.md
```

---

# 🗄️ Core Data Models

## User

```js
{
  name,
  email,
  password,
  profile: {
    age,
    gender,
    state,
    district,
    residenceType,
    occupation,
    annualIncome,
    category,
    disability,
    maritalStatus,
    student,
    farmer
  }
}
```

## Scheme

```js
{
  name,
  slug,
  category,
  description,
  benefits,
  eligibility: {
    minAge,
    maxAge,
    genders,
    minIncome,
    maxIncome,
    categories,
    states,
    occupations,
    residenceTypes,
    student,
    farmer
  },
  documents,
  applicationSteps,
  officialUrl,
  sourceUrl,
  lastVerified,
  active
}
```

## Eligibility Result

```js
{
  (userId,
    schemeId,
    status,
    matchedCriteria,
    unmetCriteria,
    needsVerification,
    missingDocuments,
    evaluatedAt);
}
```

## Application

```js
{
  (userId, schemeId, status, documents, notes, updatedAt);
}
```

---

# 🔌 API Overview

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Profile

```text
GET /api/profile
PUT /api/profile
```

## Schemes

```text
GET /api/schemes
GET /api/schemes/:id
GET /api/schemes/search?q=
```

## Eligibility

```text
POST /api/eligibility/check
GET  /api/eligibility/results
```

## Applications

```text
POST /api/applications
GET  /api/applications
PUT  /api/applications/:id
```

## AI

```text
POST /api/ai/explain-scheme
POST /api/ai/ask
POST /api/ai/explain-document
POST /api/ai/translate
```

---

# 🔐 Privacy & Security Principles

SevaConnect should follow privacy-first development practices.

- Never store real Aadhaar numbers in the hackathon demo.
- Use dummy/demo citizen information.
- Keep sensitive profile fields to the minimum required.
- Hash passwords before storage.
- Protect authenticated API routes.
- Validate and sanitize user input.
- Never expose database credentials in the frontend.
- Store secrets in environment variables.
- Use official sources for scheme information.
- Clearly distinguish informational matching from final government eligibility.

---

# 📚 Scheme Data Strategy

The initial MVP should use a **small, curated set of verified schemes** rather than attempting to reproduce every government scheme.

Each scheme record should include:

```text
Scheme Name
Department
Category
Description
Benefits
Eligibility Rules
Required Documents
Application Steps
Official Application URL
Source URL
Last Verified Date
```

The source of truth for scheme information should be official government portals wherever possible.

For the hackathon MVP, the focus is on approximately **10–15 well-structured schemes** covering multiple benefit categories.

---

# 🎬 Hackathon Demo Flow

The recommended 2–3 minute demo:

### 1. Introduce the citizen

> Meet Rahul. He knows government schemes exist but doesn't know which ones apply to his situation.

### 2. Create profile

Enter:

```text
Age
State
Income
Occupation
Category
Residence
```

### 3. Discover schemes

SevaConnect displays personalized recommendations.

### 4. Open a recommendation

Show:

> **Potentially Relevant**

### 5. Show "Why You Matched"

Display the exact criteria that matched.

### 6. Show document readiness

Display documents that are available and missing.

### 7. Add to application tracker

Show the citizen's progress.

### 8. Ask the AI assistant

Example:

> "Explain this scheme in simple Hindi."

### 9. Finish with the core message

> **Discover → Understand → Prepare → Apply → Track**

---

# 🏆 Our USP

## Don't just find a scheme. Get ready to claim it.

SevaConnect focuses on the journey **after scheme discovery**:

```text
Discover
   ↓
Understand
   ↓
Verify
   ↓
Prepare
   ↓
Apply
   ↓
Track
```

The goal is to reduce the gap between **knowing a benefit exists** and **being prepared to apply for it**.

---

# 🎯 MVP Scope

## Must Have

- [x] Citizen profile
- [x] Scheme database
- [x] Rule-based eligibility engine
- [x] Personalized scheme results
- [x] Match explanation
- [x] Scheme details
- [x] Required documents
- [x] Official source/application link
- [x] Application tracker

## Should Have

- [ ] AI assistant
- [ ] Hindi/Hinglish assistance
- [ ] Document readiness
- [ ] Family benefit discovery

## Future Enhancements

- [ ] Voice assistant
- [ ] OCR/document assistance
- [ ] Notifications
- [ ] Government API integrations
- [ ] Advanced analytics
- [ ] More languages
- [ ] State-specific scheme expansion

---

# 🚧 Development Roadmap

### Phase 1 — Foundation

- [ ] Initialize frontend
- [ ] Initialize backend
- [ ] Connect MongoDB
- [ ] Configure environment variables
- [ ] Create database models

### Phase 2 — Eligibility Engine

- [ ] Create scheme seed data
- [ ] Implement rule evaluation
- [ ] Implement match results
- [ ] Implement recommendation ranking
- [ ] Create eligibility API

### Phase 3 — Frontend

- [ ] Landing page
- [ ] Authentication
- [ ] Citizen profile
- [ ] Dashboard
- [ ] Scheme listing
- [ ] Scheme details
- [ ] Eligibility results

### Phase 4 — Application Workflow

- [ ] Document checklist
- [ ] Save schemes
- [ ] Application tracker
- [ ] Progress states

### Phase 5 — AI

- [ ] Scheme explanation
- [ ] Natural-language assistant
- [ ] Document explanation
- [ ] Hindi/Hinglish support

### Phase 6 — Hackathon Polish

- [ ] Responsive UI
- [ ] Loading states
- [ ] Error handling
- [ ] Demo data
- [ ] Testing
- [ ] Presentation
- [ ] Final demo

---

# ⚠️ Disclaimer

SevaConnect is an educational/hackathon prototype.

It does **not** represent the Government of India or any state government and does not guarantee eligibility, approval, financial assistance, or application acceptance.

Users should verify scheme requirements and apply through the relevant official government channel.

---

# 👥 Team

**Project:** SevaConnect  
**Hackathon:** HackNTech 11.0  
**Theme:** FinTech for Financial Inclusion  
**Problem Area:** Government-benefit accessibility

---

## 📌 Project Vision

> **Make government benefits easier to discover, understand, prepare for, and access.**

**SevaConnect — From discovery to application readiness.**
