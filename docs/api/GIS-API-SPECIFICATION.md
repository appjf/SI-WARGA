# GIS API Specification — GGR-ICMS

**Project:** GGR-ICMS  
**Phase:** Phase 4  

---

## Endpoints Summary
- `GET /v1/health`: Service health status.
- `GET /v1/gis/boundaries`: Neighborhood and block boundaries (GeoJSON).
- `GET /v1/gis/houses`: Houses and parcels (GeoJSON).
- `GET /v1/gis/facilities`: Public and social facilities (GeoJSON).
- `GET /v1/gis/roads`: Road network (GeoJSON).
- `POST /v1/gis/spatial-query`: Evaluate spatial predicates and buffer queries.
- `POST /v1/gis/validate-geometry`: Validate geometry topology and SRID conformance.
