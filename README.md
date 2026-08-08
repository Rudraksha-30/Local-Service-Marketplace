# Local Service Marketplace

A role-based local service platform that connects customers with trusted professionals, supports bookings, trust scoring, disputes, and verification workflows.

## Overview

This system is designed to make local service requests simple, transparent, and reliable for all users involved.

- Customers can request services and track progress.
- Professionals can accept jobs and build trust over time.
- Admins, support staff, and inspectors can manage verification and dispute resolution.

## Functional Requirements

These describe what the system does.

1. The system shall allow a new user to register as a Customer or Professional using email/phone and password.
2. The system shall authenticate users via email/password and issue a JWT on successful login.
3. The system shall allow a Customer to create a Service Request by selecting a category and describing the issue.
4. The system shall allow a Professional to view open Service Requests in their category and accept or reject them.
5. The system shall create a Booking when a Professional accepts a Service Request, and manage its status through a fixed lifecycle: requested → accepted → in_progress → completed → cancelled.
6. The system shall reject any booking status update that does not follow a valid transition in the defined state machine.
7. The system shall allow a Customer to submit a rating and review after a Booking is marked completed.
8. The system shall automatically recalculate a Professional's Trust Score whenever a relevant event occurs, such as booking completion, cancellation, dispute resolution, or document verification.
9. The system shall display a Professional's current Trust Score, its sub-component breakdown, and a confidence level based on completed job count.
10. The system shall store a time-stamped history of a Professional's Trust Score so changes can be viewed over time.
11. The system shall allow a Customer to raise a Dispute on a completed Booking by attaching a description and evidence (photos/text).
12. The system shall move a Dispute through a fixed lifecycle: Complaint → Evidence Upload → Support Review → Professional Response → Inspector Review → Decision, rejecting invalid transitions.
13. The system shall allow a Quality Inspector to review evidence for a Dispute and submit findings.
14. The system shall allow Support/Admin to view all disputes, override or finalize a decision, and close the case.
15. The system shall log every state-changing action on a Booking or Dispute, including actor, timestamp, and before/after state, to an audit trail.
16. The system shall allow a Professional to upload verification documents (ID, certificate, address proof) for Admin review.
17. The system shall allow an Admin to approve or reject an uploaded verification document, updating the Professional's verification flags.
18. The system shall automatically log every completed Booking to the associated property's Service History.
19. The system shall allow a Customer to view the full Service History timeline for their property.
20. The system shall allow a Professional with permission to view a property's Service History before starting a new job.
21. The system shall enforce Role-Based Access Control so each of the four roles can only perform actions permitted for that role.

## Non-Functional Requirements

These describe how well the system performs in terms of security, reliability, usability, and maintainability.

1. Passwords must be hashed with bcrypt before storage; plaintext passwords must never be stored or logged.
2. All API endpoints except signup/login must require a valid JWT; role-restricted endpoints must reject tokens with insufficient role permissions.
3. Core API responses, such as booking creation and trust score fetch, should return within 500ms under normal load on the deployed free-tier environment.
4. The booking status and dispute status must be visually represented as a clear step-by-step tracker so a non-technical user can understand where their request stands.
5. State transitions for Booking and Dispute must be atomic, so a status update does not partially apply if an error occurs mid-request.
6. Business logic, including state machines and trust score calculation, must be isolated in dedicated service modules separate from route handlers so rules can be changed without touching the API layer.
7. The data model must support adding new service categories or new document-verification types without schema-breaking changes.
8. Every Trust Score change and dispute state change must be traceable to a specific actor, timestamp, and reason via the audit trail.
9. The deployed application should target reasonable uptime appropriate for a free-tier academic deployment, with graceful error messages on downtime rather than blank failures.
10. The three-tier separation must allow the presentation layer to be replaced, such as with a mobile app, without changes to the logic or data tiers.
11. Core business logic, including trust score formula and state transition rules, must be unit-testable independently of the database and HTTP layer.
12. A Dispute cannot exist without a valid completed Booking reference, and a Review cannot exist without a valid completed Booking reference.
