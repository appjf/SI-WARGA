# GIS Security Baseline — GGR-ICMS

**Project:** GGR-ICMS  
**Phase:** Phase 4  

---

## 1. Security Principles
- **Server-Side Mediation**: GIS service endpoints require authentication via Firebase ID tokens validated at the gateway or service layer.
- **Role-Based Access Control**: Spatial query complexity and sensitive asset data access are restricted according to Phase 3 RBAC rules.
- **SQL Injection Defense**: SQLAlchemy ORM with parameterized queries prevents raw SQL injection.
- **No PII Exposure**: Spatial layers expose structural and geographic metadata only; resident PII remains strictly secured in Firestore.
