# Entity Relationship Diagram (ERD) — GGR-ICMS

**Project:** GGR-ICMS  
**Phase:** Phase 4  

---

## Spatial Schema ERD (`ggr_gis`)

```
+-------------------+       +-------------------+       +-------------------+
|    boundaries     |       |      houses       |       |       roads       |
|-------------------|       |-------------------|       |-------------------|
| boundary_id (PK)  |       | house_id (PK)     |       | road_id (PK)      |
| boundary_name     |       | house_code (UQ)   |       | road_name         |
| boundary_type     |       | block_name        |       | surface_type      |
| geom (Polygon)    |       | geom (Point)      |       | width_m           |
+-------------------+       | parcel (Polygon)  |       | geom (MultiLine)  |
                            +-------------------+       +-------------------+
                                      |
                                      | (linked ID)
                                      v
                            +-------------------+
                            |  Cloud Firestore  |
                            |   (houseId)       |
                            +-------------------+
```
