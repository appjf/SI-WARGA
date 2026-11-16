# Firebase Architecture Document — GGR-ICMS

**Project:** Green Garden Residence – Integrated Community Management System (GGR-ICMS)  
**Wilayah:** RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut  
**Phase:** Phase 3 — Firebase Foundation & Security Architecture  

---

## 1. Overview
GGR-ICMS uses Firebase as the foundational layer for Identity and Access Management (Firebase Authentication), operational document persistence (Cloud Firestore), and security policy enforcement (Firestore Security Rules & Firebase Admin SDK).

## 2. Component Architecture

### 2.1 Firebase Client SDK (`lib/firebase/`)
- **`config.ts`**: Initializes the Firebase app client singleton using environment variables (`NEXT_PUBLIC_FIREBASE_*`).
- **`auth.ts`**: Client-side authentication utilities (`signIn`, `signUp`, `signOut`, `resetPassword`, `subscribeToAuthChanges`).
- **Client-Side Boundaries**: Direct client writes to sensitive collections (audit logs, user roles) are restricted by security rules. Client components interact primarily through secure Next.js API routes or server actions.

### 2.2 Firebase Admin SDK (`lib/firebase/admin.ts`)
- **Server-Only Isolation**: Protected with `import "server-only"`. Executed exclusively on Node.js runtime.
- **`admin-auth.ts`**: Verifies ID tokens (`verifyIdToken`), retrieves user records, and manages custom claims.
- **`admin-firestore.ts`**: Performs privileged database operations and audit log recordings (`createAuditLog`, `getUserProfile`, `upsertUserProfile`).

## 3. Security & Access Control
- **Deny-by-Default**: Firestore security rules (`firestore.rules`) deny all unauthenticated and unauthorized access by default.
- **RBAC Enforcement**: Roles (`SUPER_ADMIN`, `ADMIN_RW`, `KETUA_RT`, `SEKRETARIS_RT`, `BENDAHARA_RT`, `PENGURUS`, `WARGA`) are verified both at the Firestore rules layer and server-side API middleware.
