# Firestore Data Dictionary — GGR-ICMS

**Project:** GGR-ICMS  
**Phase:** Phase 3  

---

## Collections Summary

1. **`users/{uid}`**
   - `uid` (string): Firebase Auth UID.
   - `displayName` (string): User display name.
   - `email` (string): Email address.
   - `status` (`active` | `disabled` | `pending`): Account status.
   - `roles` (array): Assigned RBAC roles.
   - `createdAt`, `updatedAt` (timestamp).

2. **`residents/{residentId}`**
   - `residentId` (string): Unique ID.
   - `uid` (string | null): Linked user account.
   - `houseId` (string): Household reference.
   - `fullName` (string): Resident full name.
   - `verificationStatus` (`pending` | `verified` | `rejected`).

3. **`households/{houseId}`**
   - `houseId` (string): Unique household ID.
   - `houseCode` (string): Unit code (e.g., GG-RT06-001).
   - `addressLabel` (string): Address descriptor.
   - `headResidentId` (string): Head of household.
   - `memberIds` (array): Resident member IDs.

4. **`transactions/{transactionId}`**
   - `transactionId` (string): Transaction ID.
   - `type` (`income` | `expense`).
   - `amount` (integer): Amount in IDR.
   - `period` (string): YYYY-MM format.
   - `status` (`draft` | `posted` | `reversed`).

5. **`auditLogs/{logId}`**
   - `eventId`, `actorUid`, `action`, `entityType`, `entityId`, `result`, `metadata`, `timestamp`.
