# Pilot Demo Script

## Demo Goal

Show a low-risk government property service workflow:

NDI login -> property document submission -> officer review -> approval -> audit log -> public proof record.

Avoid leading with marketplace, trading, or fractional investment language.

## Opening Pitch

Smart Property is a privacy-preserving property service pilot. It helps citizens submit property documents through NDI-verified access and helps officers review, approve, and publish tamper-evident proof records. Personal identity details and documents stay off-chain. The blockchain layer only anchors proof hashes and wallet references.

## Demo Flow

### 1. Public Portal

Show:

- Government-style interface.
- Public registry area.
- NDI login entry point.
- Help desk/contact area.

Say:

> This is the citizen-facing service portal. Public users can view approved records, but only NDI-verified users can submit or manage property service requests.

### 2. Citizen NDI Login

Show:

- Citizen Login with NDI.
- QR/deep link flow.
- Successful login opens citizen dashboard.

Say:

> NDI gives us verified access without building a new identity system. The portal uses the verified session for service access, but personal details are not written to the blockchain.

### 3. Citizen Dashboard

Show:

- Citizen profile uses NDI-provided display name.
- Wallet address with copy control.
- Submit property form.
- Empty or live registry listings.

Say:

> The wallet is a system wallet linked to the NDI holder identity. It is used for proof and record ownership references, not for exposing personal information.

### 4. Submit Property Package

Show:

- Property title.
- Location.
- Property type.
- Price/share fields only if needed for demo.
- Document upload.
- Optional photo upload.

Say:

> For the first pilot, this form would be adjusted to match the exact fields required by NLCS or the pilot land record office.

### 5. Officer Login

Show:

- Officer Portal.
- NDI login.
- Admin allowlist behavior.

Say:

> Officer access is restricted. A normal citizen NDI identity cannot open the officer console unless the backend allowlist approves it.

### 6. Officer Review Queue

Show:

- Pending submission.
- Document hash/storage reference.
- Approve and reject actions.

Say:

> The officer sees submitted records, checks the evidence, and either approves or rejects with correction notes. Every action is logged.

### 7. Approval And Proof

Show:

- Approve action.
- Public registry updates.
- Audit log entry.
- Chain transaction/hash if available.

Say:

> Approval creates a tamper-evident proof anchor. The chain records proof references such as document hash and wallet reference, not the citizen's name or ID number.

### 8. Public Registry

Show:

- Approved public record.
- No personal NDI details.

Say:

> The public can verify approved records without seeing private identity details or uploaded documents.

## Close

Say:

> The first pilot is not trying to replace the national land registry immediately. It tests whether NDI, officer review, audit logs, secure document references, and proof anchoring can improve a specific property service workflow. If the pilot succeeds, the next step is integration planning with NLCS and existing systems such as e-Sakor.

## Likely Questions

### Is this the official land registry?

No. The pilot is a verification and workflow layer. It becomes an official record system only after NLCS approval, legal review, and integration with existing registry systems.

### Is personal data on-chain?

No. NDI name, ID number, holder DID, officer notes, documents, and audit details stay off-chain. The chain only stores proof anchors.

### Is this a crypto marketplace?

No. The pilot should focus on property proof and officer review. Marketplace and fractional ownership features are optional future modules that require legal and regulatory review.

### Why use blockchain at all?

To create a tamper-evident proof anchor for approved records and document hashes. The blockchain is not used as a public database of personal information.

### Who should own the pilot?

GovTech can sponsor the digital service approach, but NLCS or a land record office should own the business workflow.
