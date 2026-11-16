# Firebase Security Baseline — GGR-ICMS

**Project:** GGR-ICMS  
**Phase:** Phase 3  

---

## 1. Security Principles
1. **Deny by Default**: Unauthenticated or unauthorized access is unconditionally rejected.
2. **Server-Side Authorization**: Privileged mutations and sensitive reads are mediated by Firebase Admin SDK on Node.js.
3. **Privilege Escalation Prevention**: Clients cannot modify their own `roles` or `status` fields in Firestore.
4. **Auditability**: All critical admin actions and data mutations generate immutable audit log entries.
5. **No Secret Exposure**: Service accounts and private keys are never stored in version control or exposed to the client bundle.

## 2. Firestore Rules Enforcement
- Global match rule denies read and write (`allow read, write: if false;`).
- Granular matching rules enforce strict authentication and role checking for `users`, `residents`, `households`, `transactions`, and `complaints`.
- `auditLogs` collection is immutable from client applications.
