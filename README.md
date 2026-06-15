# LendSwift Loan Application

## Project Description

LendSwift is a production-style, eight-step loan application built for the Zetheta Algorithms Front-End Developer assessment. It models an Indian digital lending journey for Personal, Home, and Business loans, including conditional eligibility rules, identity checks, secure draft storage, document upload, e-signatures, and an RBI-style Key Fact Statement.

The application is a client-side assessment project. It does not transmit applicant data to a backend or connect to UIDAI, NSDL, a credit bureau, or a lender.

## Key Features

- Eight-step wizard with a registry-driven conditional co-applicant step
- Three loan products with product-specific amounts, tenures, purposes, and employment rules
- React Hook Form forms resolved by composable Zod schemas
- Fourteen documented cross-step validation dependencies
- PAN format and entity-type validation
- Aadhaar validation with the Verhoeff checksum algorithm
- PIN code lookup and city/state auto-fill from a representative Indian dataset
- Client-side image compression with original and compressed size reporting
- Document requirements based on loan and employment type
- Canvas e-signatures plus a keyboard-accessible typed-signature alternative
- AES-256-GCM encrypted local drafts, 30-second auto-save, 72-hour expiry, and corruption detection
- EMI calculation, affordability warning, and pre-approval Key Fact Statement
- Responsive layouts and 44px minimum interactive targets from 320px upward
- WCAG 2.1 A/AA automated coverage with `cypress-axe`
- 202 Vitest tests across unit, component, hook, schema, and integration behavior
- Cypress happy-path, validation, persistence, upload, signature, stress, keyboard, and accessibility coverage

## Technology

- React 19 and Vite 8
- React Hook Form 7 and Zod 4
- Tailwind CSS 3
- Vitest and Testing Library
- Cypress 15 and axe-core
- Web Crypto API using AES-256-GCM

## Setup

```bash
git clone <your-repository-url>
cd loan-application
npm install
npm run dev
```

The development server is available at `http://localhost:5173` by default.

```bash
npm run build       # Production build
npm run preview     # Preview the production build
npm run lint        # ESLint
npm run test        # Vitest suite
npm run test:watch  # Vitest watch mode
npm run test:e2e    # Cypress suite; requires the dev server
```

To run only the accessibility journey:

```bash
npx cypress run --spec cypress/e2e/accessibility.cy.js
```

## Application Flow

1. Loan Details
2. Personal Information
3. Identity Verification
4. Address Information
5. Employment and Income
6. Co-Applicant and Guarantor, when required
7. Document Upload and E-Signature
8. Review, Consent, and Pre-Approval Summary

Step 6 is always shown for Home loans, for Personal loans above INR 5 lakh, and for Business loans above INR 20 lakh.

## Architecture Decisions

### Wizard Pattern

The wizard uses a central step registry rather than a single monolithic form or hard-coded conditional rendering. The registry owns order, labels, and visibility predicates. Each step owns its form and exposes `validateAndSubmit()` through a ref; the wizard advances only after the active step succeeds. This keeps conditional navigation and accumulated state separate from field implementation and scales cleanly as product rules diverge.

### React Hook Form over Formik

React Hook Form minimizes per-keystroke React updates by working primarily with uncontrolled native inputs. That matters for a long application with document controls, verification state, and more than 50 possible fields, especially on mid-range mobile devices.

### Zod over Yup

Zod provides composable schemas, precise issue paths, discriminated employment branches, and `superRefine()` for cross-field and policy checks. `schemaFactory.js` combines the active step with accumulated form data so validation can react to prior answers without coupling components together.

### Cross-Step Validation

`getSchemaForStep(stepId, formData)` supplies the current application state to schema builders. It enforces product-specific employment, document, tenure, identity, and affordability rules. The full dependency map is in [ARCHITECTURE.md](ARCHITECTURE.md).

### Secure Auto-Save

Form state changes reset a 30-second timer. When it fires, the application serializes the accumulated data, encrypts it with AES-256-GCM, and writes the ciphertext to local storage. Small unencrypted metadata supports a quick 72-hour expiry check. Resume decrypts and validates the saved shape; authentication or parsing failures clear the corrupt draft.

AES-GCM is used because the draft contains PII such as PAN, Aadhaar, income, and address. Authenticated encryption protects confidentiality and detects ciphertext modification. This remains a browser-only demonstration: a production system should derive keys from authenticated, server-managed user material rather than storing all key material client-side.

## Accessibility

- Native labels, fieldsets, legends, selects, radio buttons, and checkboxes
- Required and invalid state exposed to assistive technology
- Error messages announced with `role="alert"`
- Progress announced with `role="progressbar"` and value attributes
- Focus moves to the first interactive field after a step transition
- Visible high-contrast focus indicators
- Dialog semantics and initial focus for resume and success modals
- File dropzones exposed as named buttons
- Signature images use descriptive alternatives
- Typed-name fallback for applicants who cannot use the drawing canvas

## Responsive Support

The layout is constrained to a readable `max-w-3xl` column and supports 320px, 375px, 414px, 768px, 1024px, 1440px, and 1920px widths. Navigation stacks on small screens, progress dots are hidden below 640px, upload controls are full-width, and form controls meet the 44px touch-target requirement.

## Quality Snapshot

| Check | Result |
|---|---:|
| Vitest | 202 passing |
| ESLint | 0 errors |
| Production JS | 138.34 kB gzipped at final local build |
| Lighthouse Performance | Not captured in this non-interactive environment |
| Lighthouse Accessibility | Not captured in this non-interactive environment |
| Lighthouse Best Practices | Not captured in this non-interactive environment |
| Lighthouse SEO | Not captured in this non-interactive environment |

Lighthouse values should be recorded from Chrome DevTools against the deployed production build. They are intentionally not estimated here.

## Screenshots

Final screenshots should be captured from the production build at 1280px and 375px and stored in `screenshots/` using `step1-desktop.png`, `step1-mobile.png`, through `step8-desktop.png`, `step8-mobile.png`.

## Known Limitations

- PAN, Aadhaar, and credit checks are simulated; no government or bureau API is called.
- The PIN code database is representative rather than the complete India Post dataset.
- The keyboard e-signature alternative records a typed name rather than reproducing freehand drawing.
- Safari 14 does not support CSS `accent-color`; native radio and checkbox styling is used there.
- PDF generation for the submission summary is not implemented.
- The Terms and Conditions link is a placeholder until a published document exists.
- There is no backend; application data remains in the browser.
- Client-side draft encryption demonstrates authenticated encryption but cannot replace server-backed key management.

## Deployment

Deployment pending. The Vite build is compatible with Vercel or Netlify using `npm run build` and the `dist` output directory.
