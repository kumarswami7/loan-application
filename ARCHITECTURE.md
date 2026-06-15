# LendSwift Architecture Documentation

## Wizard Pattern

LendSwift uses Pattern 3: a wizard with a central step registry.

```text
App
  -> Wizard
      -> stepRegistry filters and orders visible steps
      -> FormDataContext stores accumulated and in-progress values
      -> Active Step uses React Hook Form + zodResolver
      -> Step exposes validateAndSubmit() through useImperativeHandle
      -> Wizard.goNext() validates, persists the step, then advances
      -> ProgressBar and StepNavigation reflect the visible-step list
```

The wizard owns navigation and application-level state. Steps own fields and local validation. This prevents product rules, browser history, persistence, and field rendering from collecting in one component.

## Component Hierarchy

```text
App
└── Wizard
    ├── ResumeDraftModal
    ├── ProgressBar
    ├── FormDataContext.Provider
    │   └── Active step
    │       ├── Step1LoanType
    │       ├── Step2PersonalInfo
    │       ├── Step3KYC
    │       ├── Step4Address
    │       ├── Step5Employment
    │       ├── Step6CoApplicant (conditional)
    │       ├── Step7Documents
    │       │   ├── FileUpload
    │       │   └── SignatureCanvas
    │       └── Step8Review
    │           └── SuccessModal
    └── StepNavigation

Shared controls
├── Input
├── Select
├── RadioGroup
├── Checkbox
├── CurrencyInput
├── MaskedInput
├── FileUpload
├── SignatureCanvas
└── ErrorMessage
```

## State Ownership

`Wizard` stores committed `formData`, unsaved `draftStepData`, the current step, and modal/toast state. `FormDataContext` exposes updates and review-page editing navigation. Each step creates an isolated React Hook Form instance and merges committed data with its saved in-progress draft when mounted.

This allows Previous and Edit navigation without losing partially completed fields while preventing an invalid step from becoming committed application data.

## Step Registry

`STEP_REGISTRY` is the single source of truth for step IDs, labels, order, and visibility. `getVisibleSteps(formData)` evaluates each predicate against current accumulated state. The co-applicant predicate is:

```text
Home loan                         -> visible
Personal loan amount > 500,000   -> visible
Business loan amount > 2,000,000 -> visible
otherwise                         -> hidden
```

All progress percentages and Previous/Next decisions use the filtered list, so conditional navigation does not require special index arithmetic.

## Schema Factory

```js
getSchemaForStep(stepId, formData)
```

The factory canonicalizes aliases such as `step1` to `loanType`, then returns either a static schema or a schema built from prior answers. `validateAllSteps()` filters through the same visible-step registry, validates in parallel, and returns errors grouped by step.

## Cross-Step Dependency Map

| # | Source | Target | Rule |
|---:|---|---|---|
| 1 | Step 1 loan type | Step 5 employment | Product policy controls allowed employment branches. |
| 2 | Step 1 loan type | Step 6 visibility | Home loans always require the co-applicant step. |
| 3 | Step 1 loan type | Step 7 documents | Loan type selects product-specific document requirements. |
| 4 | Step 1 loan amount | Step 6 visibility | Personal above INR 5 lakh and Business above INR 20 lakh show Step 6. |
| 5 | Step 1 loan amount | Step 8 affordability | Amount contributes to EMI and EMI-to-income ratio. |
| 6 | Step 1 tenure | Step 8 affordability | Tenure contributes to EMI and total borrowing cost. |
| 7 | Step 2 date of birth | Step 1 tenure | Applicant age limits the maximum permissible tenure. |
| 8 | Step 2 marital status | Step 6 relationship | Married applicants default the relationship to Spouse. |
| 9 | Step 3 PAN verification | Step 7 documents | A verified PAN makes PAN upload optional. |
| 10 | Step 4 residence type | Step 4 rent fields | Rented residence activates rent-related validation. |
| 11 | Step 5 employment type | Step 5 branch fields | Salaried, self-employed, and business-owner fields diverge. |
| 12 | Step 5 employment type | Step 7 documents | Employment type selects salary-slip, ITR, GST, and registration requirements. |
| 13 | Step 5 primary income | Step 8 affordability | Primary monthly income is part of the EMI ratio denominator. |
| 14 | Step 6 co-applicant income | Step 8 affordability | Co-applicant income is added when the conditional step is present. |

## Auto-Save Flow

```text
formData/current step changes
  -> reset 30-second timer
  -> timer fires
  -> serialize application state
  -> AES-256-GCM encrypt
  -> write encrypted payload to localStorage
  -> write small expiry/loan-type metadata record
  -> announce saved status
```

Resume performs the reverse flow:

```text
page load
  -> read metadata
  -> reject entries older than 72 hours
  -> show Resume/Start Fresh dialog
  -> Resume decrypts authenticated payload
  -> validate restored shape and current step
  -> restore state
  -> on failure, clear corrupt data and start fresh
```

The unencrypted metadata intentionally excludes application PII and exists only to decide whether a resumable draft is available before decryption.

## Verification and Lookup

PAN, Aadhaar, GST, and PIN code logic live outside step components in schemas, hooks, and utilities. Verification hooks expose loading, verified, and error states. This separation keeps asynchronous simulation and checksum logic independently testable.

## Documents and Signatures

`documentRequirements.js` derives required uploads from loan type, employment type, and verification state. `FileUpload` validates MIME type and size, compresses images, manages object URL cleanup, and announces upload state.

`SignatureCanvas` publishes PNG data URLs for pointer/touch users. A typed-name alternative publishes a `typed:` value for keyboard users. The review step renders either the signature image or accessible styled text.

## Testing Strategy

- Utility tests cover checksums, formatting, encryption, compression, and EMI math.
- Hook tests cover verification, lookup, persistence, and auto-save behavior.
- Component and step tests cover labels, errors, branch rendering, and imperative validation.
- Combination tests exercise cross-step schema dependencies.
- Cypress covers three product journeys plus validation, upload, signature, persistence, stress, keyboard, and axe accessibility behavior.

## Security Boundaries

Sensitive identifiers are masked after entry and are not logged. Drafts use authenticated encryption and expire after 72 hours. This is still a frontend-only demonstration: production lending requires authenticated server storage, access controls, audit trails, consent records, key rotation, malware-resistant session design, and integrations with regulated providers.
