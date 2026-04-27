# Personalized Bioinformatics Proposal Platform Design

Date: 2026-04-27
Status: Draft for user review

## Summary

Build an internal proposal workspace for personalized bioinformatics analysis requests. The MVP helps project managers and analysts move from scattered customer messages to an AI-assisted, analyst-approved proposal with version history and customer feedback loops.

The first version is internal only. Customers do not log in. PMs still send proposals to customers through existing channels, but every request, AI draft, analyst-confirmed version, customer feedback, and final outcome is recorded in the platform.

## Problem

The current workflow depends on repeated copying and forwarding:

1. A customer sends a personalized analysis request through chat or email.
2. The PM copies the request and sends it to an analyst.
3. The analyst copies the request into an external AI tool, generates a proposal, edits it, and sends it back to the PM.
4. The PM sends the proposal to the customer.
5. If the customer has feedback, the feedback is copied back through the same chain and the proposal is revised again.

This creates version confusion, repeated manual transfer, lost context, and weak reuse of similar historical requests.

## MVP Goals

1. Give PMs one place to create, track, send, and update proposal cases.
2. Give analysts one place to review AI drafts, compare similar historical cases, edit proposals, and confirm versions.
3. Preserve every customer request, customer feedback round, AI draft, analyst-confirmed proposal, and final outcome.
4. Make previously accepted proposals searchable as reference cases.
5. Keep AI as a drafting assistant. Analysts remain responsible for the confirmed proposal.

## Non-Goals

The MVP does not include:

1. Customer login or customer-facing approval pages.
2. Full project management, scheduling, contracts, pricing, delivery tracking, or billing.
3. Automatic insertion of historical proposal content into new AI-generated proposals.
4. AI-only final approval without analyst review.
5. Complex structured intake forms as the primary input. The first input mode is pasted customer text.
6. Multiple AI models generating competing proposal versions in parallel.

## Users

### Project Manager

The PM creates proposal cases, pastes the customer's original request, tracks status, sends confirmed proposals to customers, records customer feedback, and marks the final outcome as accepted or canceled.

### Analyst

The analyst reviews AI-generated drafts, checks similar historical cases, edits the proposal, confirms each round's version, or sends the case back to the PM if more customer information is needed.

### AI Assistant

The AI assistant turns unstructured customer text into a requirement summary, missing-information checklist, proposal draft, and revised draft after customer feedback.

### Historical Case Library

The library stores accepted final proposals and makes them searchable as reference cases for future work.

## Core Workflow

### First Proposal Round

1. PM creates a proposal case.
2. PM pastes the customer's original chat or email text.
3. AI generates:
  - requirement summary
  - missing-information checklist
  - proposal draft
4. The platform searches for similar accepted historical cases and displays them as references.
5. Analyst reviews the customer text, AI summary, AI draft, and similar cases.
6. Analyst edits and confirms the proposal for the current round.
7. PM sees the confirmed proposal and sends it to the customer through existing channels.
8. The proposal case enters customer feedback waiting state.

### Customer Feedback Round

1. Customer responds outside the platform.
2. PM records one of three outcomes:
  - customer accepted
  - customer canceled
  - customer requested changes
3. If the customer requested changes, PM pastes the feedback into the platform.
4. AI generates a revised draft using:
  - original customer request
  - previous analyst-confirmed proposal
  - latest customer feedback
5. Analyst reviews, edits, and confirms the revised proposal.
6. PM sends the revised proposal to the customer.
7. The loop repeats until the customer accepts or cancels.

## Proposal Statuses

1. `drafting`: PM has created the case and AI generation is pending or in progress.
2. `analyst_review`: AI draft is ready and analyst action is required.
3. `ready_to_send`: analyst confirmed the current proposal version and PM needs to send it.
4. `waiting_customer_feedback`: PM sent the proposal and is waiting for the customer.
5. `revision_needed`: PM has entered customer feedback and a new revision round must be generated or reviewed.
6. `accepted`: customer accepted the proposal. The final version becomes eligible for the high-quality historical case library.
7. `canceled`: customer canceled or stopped the request. The case remains archived but is not treated as a high-quality reference by default.

If the customer has replied but PM has not entered the feedback yet, the case remains `waiting_customer_feedback`; the PM's next action is to record accepted, canceled, or requested changes.

Analyst rejection for missing customer information should return the case to the PM with a clear request for clarification. In the MVP this should use `revision_needed` with an internal feedback type, so the state model stays small.

## Page Structure

### PM Workspace

The PM workspace lists proposal cases with project name, requirement summary, current status, assigned analyst, last update time, and next action.

Primary filters:

1. All cases
2. Ready to send
3. Waiting for customer feedback
4. Needs feedback entry
5. Accepted
6. Canceled

Primary actions:

1. Create proposal case
2. Open case detail
3. Copy or export confirmed proposal
4. Enter customer feedback
5. Mark customer accepted
6. Mark customer canceled

### New Proposal Case

The PM enters:

1. Project name or customer short name
2. Original customer request text
3. Optional assigned analyst

The main action is "Generate requirement summary and proposal draft".

### Proposal Detail and Analyst Review

The analyst review page uses a three-column layout:

1. Customer context:
  - original request text
  - AI requirement summary
  - missing-information checklist
  - customer feedback for the current revision, if any
2. Editable proposal:
  - AI draft
  - analyst edits
  - confirmed version for the current round
3. Similar historical cases:
  - accepted historical requirement summary
  - final proposal excerpt
  - match reason
  - link to full historical case

Primary analyst actions:

1. Confirm current proposal version
2. Request PM/customer clarification
3. Save draft edits

### Customer Feedback Entry

The PM sees the previous sent proposal and enters the customer's latest response.

Primary actions:

1. Generate revised draft
2. Mark customer accepted
3. Mark customer canceled

## Recommended Technical Stack

The recommended MVP stack is Next.js with shadcn/ui. This fits the product because the first version is an internal workflow application with forms, tables, status filters, editable proposal pages, dialogs, and role-based actions.

### Frontend and App Framework

Use Next.js App Router as the main application framework.

Responsibilities:

1. PM workspace pages
2. Proposal creation page
3. Proposal detail and analyst review page
4. Customer feedback entry page
5. Server-side routes for proposal, revision, search, and AI actions

Use shadcn/ui with Tailwind CSS for the interface. The MVP should lean on standard components such as tables, cards, badges, tabs, text areas, dialogs, dropdown menus, toasts, and side navigation.

### Database

Use PostgreSQL for durable storage.

Store:

1. proposal cases
2. revisions
3. users and roles
4. audit logs
5. accepted historical cases for search

Use Prisma for the MVP if the priority is development speed and clear schema management. Drizzle is also viable, but Prisma is the simpler default for a first version.

### Authentication and Roles

Use Auth.js or a comparable Next.js-compatible authentication layer.

MVP roles:

1. PM
2. Analyst
3. Admin, optional for user management

### AI Integration

Wrap AI calls behind server-side application services instead of calling providers directly from UI components.

The MVP should support one active model provider first. The service boundary should leave room for later multi-model draft generation through the future `AIDraftCandidate` model.

AI generation may start as synchronous server-side actions for the MVP. If generation time or concurrency becomes painful, move generation into a background job system such as Inngest, BullMQ, or a managed queue.

### Search

Start with PostgreSQL full-text search across requirement summaries and accepted final proposal text. This is enough for the MVP goal of finding similar prior requests for analyst reference.

Vector search can be added later if keyword search is not good enough.

## Data Model

### ProposalCase

Fields:

1. `id`
2. `title`
3. `customer_name`
4. `original_request_text`
5. `requirement_summary`
6. `missing_information`
7. `status`
8. `pm_user_id`
9. `analyst_user_id`
10. `current_revision_number`
11. `final_outcome`
12. `created_at`
13. `updated_at`

### Revision

Fields:

1. `id`
2. `proposal_case_id`
3. `revision_number`
4. `customer_feedback_text`
5. `ai_draft`
6. `analyst_confirmed_text`
7. `revision_notes`
8. `sent_to_customer_at`
9. `confirmed_by_analyst_at`
10. `created_at`
11. `updated_at`

The first revision has no customer feedback. Later revisions include the customer's feedback that triggered the revision.

The MVP can store one selected AI draft per revision. The model should not prevent a later `AIDraftCandidate` expansion, where one revision can contain multiple drafts generated by different models or prompt strategies.

### Future AIDraftCandidate

This is deferred beyond the MVP.

Fields:

1. `id`
2. `revision_id`
3. `model_provider`
4. `model_name`
5. `prompt_version`
6. `draft_text`
7. `generation_metadata`
8. `created_at`

This would allow the platform to generate multiple proposal versions at the same time, compare them side by side, and let the analyst choose or merge the best one.

### SimilarCase

This can be a search result shape rather than a persisted table in the MVP.

Fields:

1. `proposal_case_id`
2. `title`
3. `requirement_summary`
4. `final_proposal_excerpt`
5. `matched_reason`
6. `score`

Only accepted proposal cases should be treated as high-quality default references.

### AuditLog

Fields:

1. `id`
2. `proposal_case_id`
3. `revision_id`
4. `actor_user_id`
5. `action`
6. `before_status`
7. `after_status`
8. `metadata`
9. `created_at`

## AI Behavior

### First-Round Generation

Input:

1. Original customer request text

Output:

1. Requirement summary
2. Missing-information checklist
3. Proposal draft

The proposal draft should use this structure:

1. Customer requirement understanding
2. Analysis goals
3. Sample and data requirements
4. Recommended analysis workflow
5. Deliverables and figures
6. Timeline, notes, and risks
7. Questions requiring customer confirmation

### Revision Generation

Input:

1. Original customer request text
2. Previous analyst-confirmed proposal
3. Latest customer feedback

Output:

1. Revision summary explaining what changed
2. Revised proposal draft
3. Remaining questions or risks

The AI must preserve relevant confirmed content from the previous version and explicitly address the customer's feedback. The revised draft is still only a draft until the analyst confirms it.

### Similar Case Search

MVP search should use accepted proposal cases as the trusted source. It should search across requirement summary and confirmed final proposal text.

The search result must show why a case matched, so analysts can judge whether it is actually relevant. Historical cases are references only; they are not automatically inserted into the AI prompt in the MVP.

## Quality and Safety Rules

1. AI output is never final without analyst confirmation.
2. Every sent proposal version must be preserved.
3. Customer feedback must create a new revision instead of overwriting the previous proposal.
4. Accepted proposals are eligible for high-quality historical reference.
5. Canceled proposals are archived but not recommended as high-quality cases by default.
6. The UI should make the next responsible person and next action obvious.

## Success Criteria

The MVP is successful if:

1. PMs no longer need to send customer requirements to analysts through scattered manual copy-forward chains.
2. Analysts can generate, edit, and confirm a proposal without leaving the platform.
3. PMs can see the current status of every proposal case.
4. Customer feedback and repeated revisions are tracked as explicit rounds.
5. Accepted historical proposals can be found and used as references for similar new requests.

## Deferred Extensions

1. Customer portal for direct proposal review, comments, acceptance, and cancellation.
2. Structured intake forms for species, sample type, omics type, analysis module, deliverables, and deadlines.
3. Semantic vector search for more accurate similar-case retrieval.
4. AI prompt enrichment using selected historical cases.
5. Template library for standard bioinformatics proposal types.
6. Multiple AI model support, allowing several models or prompt strategies to generate proposal variants in parallel for analyst comparison and selection.
7. Dashboards for turnaround time, revision count, analyst workload, proposal acceptance rate, model usage, and draft selection outcomes.

