# PostGIS Spatial Architecture — GGR-ICMS

**Project:** GGR-ICMS  
**Phase:** Phase 4  

---

## 1. Spatial Reference System (SRS / SRID)
- **EPSG:4326 (WGS 84)**: Standard geographic coordinate system used for API exchange, GeoJSON serialization, and web mapping visualization.
- **EPSG:32748 (UTM Zone 48S)**: Projected metric coordinate system utilized for accurate area (`ST_Area`) and distance (`ST_Distance`) calculations within the Garut, West Java operational region.

## 2. Spatial Indexing & Performance
- All PostGIS tables (`boundaries`, `houses`, `roads`, `drainage`, `facilities`, `complaints_spatial`, `assets`) utilize **GiST (Generalized Search Tree)** spatial indexes (`USING GIST (geom)`) to optimize bounding box queries and spatial predicates (`ST_Intersects`, `ST_Within`, `ST_DWithin`).
