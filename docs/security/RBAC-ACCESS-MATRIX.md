# RBAC Access Matrix — GGR-ICMS

**Project:** GGR-ICMS  
**Phase:** Phase 3  

---

## Role & Permission Matrix

| Role | User Management | Residents & Households | Finance & Iuran | Complaints | GIS & Maps | Audit Logs |
|---|---|---|---|---|---|---|
| **SUPER_ADMIN** | Full (CRUD + Roles) | Full | Full | Full | Full | Read |
| **ADMIN_RW** | Read | Full | Read | Manage | Full | Read |
| **KETUA_RT** | Read | Full | Approve | Manage | Read | Read |
| **SEKRETARIS_RT** | None | Full | Read | Create/Read | Read | None |
| **BENDAHARA_RT** | None | Read | Full (CRUD + Approve) | Read | Read | None |
| **PENGURUS** | None | Read | Read | Manage | Read | None |
| **WARGA** | Read (Self) | Read (Self) | Read (Self) | Create/Read (Self) | Read | None |

## Governance Rules
- Least privilege principle enforced.
- Role assignment restricted to `SUPER_ADMIN` via secure backend APIs.
- Cross-region or cross-neighborhood access is strictly blocked.
