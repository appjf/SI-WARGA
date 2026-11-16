# Phase 4 Database Architecture — GGR-ICMS

**Project:** Green Garden Residence – Integrated Community Management System (GGR-ICMS)  
**Wilayah:** RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut  
**Phase:** Phase 4 — Database Architecture, PostgreSQL, PostGIS & GIS Service  

---

## 1. Overview
GGR-ICMS implements a hybrid data architecture:
- **Cloud Firestore**: Operational records, user authentication metadata, households, residents, financial transactions, complaints, and audit logs.
- **PostgreSQL + PostGIS**: Relational spatial database storing geospatial primitives (Point, LineString, Polygon, MultiLineString) for houses, parcels, roads, drainage, facilities, and boundaries.

## 2. Data Ownership Matrix
| Domain | Primary Storage | Secondary / Integration | Owner / Role |
|---|---|---|---|
| User Auth & Accounts | Firebase Auth / Firestore | None | SUPER_ADMIN / System |
| Resident Profiles | Firestore | PostgreSQL (linked ID) | Sekretaris RT |
| Households & Houses | Firestore | PostGIS (`ggr_gis.houses`) | Sekretaris / Koordinator GIS |
| Spatial Geometries | PostGIS (`ggr_gis.*`) | Firestore (spatialId reference) | Koordinator GIS |
| Financial Transactions | Firestore | None | Bendahara RT |
| Complaints & Assets | Firestore | PostGIS (`complaints_spatial`, `assets`) | Pengurus / PIC |
