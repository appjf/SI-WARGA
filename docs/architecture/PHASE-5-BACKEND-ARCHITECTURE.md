# Phase 5 Backend Architecture — GGR-ICMS

**Project:** Green Garden Residence – Integrated Community Management System (GGR-ICMS)  
**Wilayah:** RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut  
**Phase:** Phase 5 — Backend BFF & Business Logic  

---

## 1. Overview
The Backend-for-Frontend (BFF) is built using Next.js App Router API route handlers (`/api/v1/*`). It mediates all communication between the frontend client and the underlying persistence layers (Cloud Firestore for operational records, PostgreSQL/PostGIS for relational spatial data, and FastAPI for GIS operations).

## 2. BFF Layer Principles
1. **Server-Side Authentication**: Firebase ID tokens are verified securely on the server using Firebase Admin SDK.
2. **Standardized Responses**: All API endpoints return a predictable JSON structure (`success`, `data`/`error`, `meta`).
3. **Auditability**: Critical mutations automatically generate immutable audit log entries.
4. **Data Integrity**: Financial calculations use integer IDR formatting and idempotency keys.
