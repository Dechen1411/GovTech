# Smart Property Pilot Proposal

## Working Title

NDI-verified digital property proof and officer review pilot.

## Executive Summary

Smart Property is a pilot digital public service for property record submission, officer review, and tamper-evident proof. Citizens authenticate with Bhutan NDI, submit property documents through a secure portal, and authorized officers review, approve, reject, and audit those submissions. Approved records can publish a public proof view while keeping personal identity details and sensitive documents off-chain.

The pilot should be positioned as a workflow and trust layer for property services, not as a replacement for the national land registry on day one. The goal is to prove that NDI authentication, encrypted document handling, officer review, audit logs, and blockchain proof anchors can improve transparency and reduce manual verification burden without exposing private citizen data.

## Primary Pilot Question

Can a government property service use NDI login, digital document submission, officer review, and tamper-evident proof to make property record verification faster, more transparent, and more auditable while preserving privacy?

## Recommended Pilot Partners

| Partner | Role in pilot |
| --- | --- |
| GovTech Agency | Digital public service sponsor, NDI/government platform alignment, security and deployment guidance. |
| National Land Commission Secretariat | Business owner for land administration rules, land record fields, title workflow, and official validation. |
| Thimphu Thromde Land Record and Survey Division | Practical pilot site for urban land record workflows, officer review, and feedback. |
| Bhutan NDI / DHI | Identity integration support, NDI proof flow validation, and digital trust alignment. |
| Ministry of Finance / Department of Revenue and Customs | Observer for future property tax, transfer tax, and valuation integration. |

## Problem Statement

Property service workflows often depend on paper documents, repeated identity checks, manual follow-up, and limited public verification. This creates delays for citizens and makes it harder for officers to maintain a clean audit trail across document submission, review, correction, approval, and public proof.

The pilot addresses this by creating a structured digital workflow:

- NDI-verified citizen access.
- Secure property document submission.
- Officer review and approval queue.
- Off-chain audit trail in MongoDB.
- Encrypted document storage references.
- Public proof record for approved submissions.
- Blockchain hash anchoring for integrity, with no personal data written on-chain.

## Pilot Scope

### In Scope

- Citizen login with Bhutan NDI.
- Officer login with restricted admin access.
- Property package submission with document and optional property image.
- Officer review queue with approve and reject actions.
- Audit log for important platform events.
- Public registry view for approved records.
- Encrypted document storage reference.
- Blockchain proof anchor for approved records.
- Wallet-linked proof identity for system actions.

### Out of Scope For The First Pilot

- Replacing e-Sakor or NLCS as the official source of truth.
- Legal title transfer automation.
- Public fractional investment marketplace.
- Open public sale of property shares.
- Tax payment collection.
- Mortgage lien registration.
- Court dispute resolution.
- Bulk migration of national land records.
- Personal NDI data on-chain.

## Current MVP Capabilities

The current system already demonstrates:

- Public government-style portal.
- NDI login popup for citizens and officers.
- Citizen dashboard for property submission, listings, portfolio, and leases.
- Officer dashboard for review, approval, rejection, risk controls, and audit logs.
- MongoDB Atlas storage for sessions, users, records, listings, leases, and audit events.
- IPFS-style encrypted document storage references.
- ERC-6909 smart contract proof layer on Sepolia.
- Off-chain audit log.
- Public registry that only shows approved backend records.

For the pilot, the marketplace and fractional ownership features should be presented as optional future modules, not as the main value proposition.

## Proposed Pilot Workflow

1. Citizen opens the property services portal.
2. Citizen logs in using Bhutan NDI.
3. System creates or reuses a platform wallet linked to the NDI holder DID.
4. Citizen submits a property package with title, location, property type, document bundle, and optional image.
5. System stores sensitive documents off-chain and records hash/reference metadata.
6. Officer logs in through NDI-restricted admin access.
7. Officer reviews the submission in the dashboard.
8. Officer approves or rejects with correction notes.
9. If approved, the system creates an immutable proof anchor using document hash and wallet reference.
10. Public registry shows only approved non-sensitive record details.
11. Audit log records every important action for internal accountability.

## Data And Privacy Model

### Kept Off-Chain

- Citizen name from NDI.
- Citizen ID display value.
- Holder DID.
- Uploaded documents.
- Officer review notes.
- Audit log details.
- Session tokens.
- Internal system status.

### Can Be Anchored On-Chain

- Document hash.
- Property proof identifier or token ID.
- Wallet address.
- Share/proof quantity where applicable.
- Transaction hash.
- Timestamp emitted by the chain.

### Privacy Principle

The blockchain should prove that a record existed and was approved without exposing the citizen's personal identity or private documents.

## Security And Governance Controls

- NDI authentication for citizens and officers.
- Admin allowlist using NDI holder DID, ID hash, or approved wallet.
- No local JSON app-state storage in production.
- MongoDB Atlas as the operational data store.
- Audit logs stored off-chain for compliance review.
- Documents stored encrypted or through approved secure storage.
- No private keys, MongoDB passwords, NDI credentials, or JWTs committed to the repository.
- Personal details never written to the public chain.

## Success Metrics

| Metric | Target for pilot |
| --- | --- |
| Successful NDI login rate | 95% or better in pilot sessions. |
| Property submission completion | 20 to 50 test submissions completed without manual developer support. |
| Officer review completion | 100% of pilot submissions approved or rejected with audit entries. |
| Audit coverage | Every login request, approval, rejection, and proof action has an audit event. |
| Privacy check | No NDI name, citizen ID, or uploaded document content appears on-chain. |
| Review time | Baseline manual review time recorded, then compared against digital workflow. |
| Officer satisfaction | Pilot officers confirm whether workflow fields and review steps match reality. |

## 90-Day Pilot Plan

### Phase 1: Discovery And Alignment, Weeks 1-2

- Confirm pilot owner and agency sponsor.
- Select one property service workflow.
- Validate required fields with land officers.
- Confirm what can be public, private, and on-chain.
- Agree on sample or sandbox records.

### Phase 2: Pilot Hardening, Weeks 3-4

- Remove or hide marketplace features from the pilot demo if needed.
- Add official property fields required by the pilot agency.
- Finalize admin role management.
- Finalize document storage policy.
- Prepare deployment and backup checklist.

### Phase 3: Controlled Pilot, Weeks 5-8

- Run test submissions with selected users/officers.
- Record approval, rejection, and correction workflows.
- Capture audit logs and public proof views.
- Track usability issues and missing official fields.

### Phase 4: Review And Security Check, Weeks 9-10

- Review privacy model with GovTech or agency security team.
- Confirm no personal data is on-chain.
- Review logs, access controls, storage, and recovery process.
- Document legal or policy gaps.

### Phase 5: Pilot Report And Scale Decision, Weeks 11-12

- Produce pilot outcome report.
- Recommend whether to expand to more workflows or agencies.
- Decide integration path with NLCS/e-Sakor and local government systems.
- Define production roadmap and budget.

## Key Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Misunderstood as a crypto marketplace | Lead with property proof, officer review, and audit trail. Keep fractional selling optional/future. |
| Personal data exposure | Store NDI details off-chain only. Use hashes and wallet references on-chain. |
| Legal registry conflict | Position as a pilot verification layer, not the official source of truth until approved by NLCS. |
| Officer workflow mismatch | Validate fields and review steps with actual land officers before expanding code. |
| Admin access abuse | Use strict NDI/admin allowlist and audit every officer action. |
| Storage compliance concerns | Use government-approved encrypted storage for production. |

## What We Need From A Pilot Agency

- A named pilot focal person.
- Confirmation of one target workflow.
- Sample anonymized property records or sandbox cases.
- Required property field list.
- Review officer role definitions.
- Agreement on what data can be public.
- Feedback sessions during the pilot.
- Permission to test NDI login and proof flows in a controlled environment.

## Recommended First Use Case

Start with a narrow workflow:

> NDI-verified property document submission and officer approval proof for selected urban property records.

This is safer and easier to approve than starting with full title transfer or fractional ownership.

## Demo Narrative

1. Citizen logs in with Bhutan NDI.
2. Citizen submits a property document package.
3. Officer logs in and reviews the submission.
4. Officer approves the record.
5. The system records an audit event.
6. The system creates a proof anchor.
7. Public registry shows the approved record without personal NDI details.

## Final Ask

Approve a 90-day controlled pilot with GovTech, NLCS, and one local land record office or Thromde unit to validate the workflow, privacy model, audit trail, and proof anchoring before any discussion of national rollout.

## Reference Links

- GovTech Agency: https://tech.gov.bt/
- National Land Commission Secretariat: https://web.nlcs.gov.bt/
- Thimphu Thromde Land Record and Survey Division: https://thimphucity.bt/land-record-and-survey-division/
- Bhutan NDI / DHI: https://dhi.bt/strategy/InvestmentStrategy/technology/national-digital-identity-%28bhutan-ndi%29
- Royal Monetary Authority legislation and sandbox context: https://www.rma.org.bt/legislation/
