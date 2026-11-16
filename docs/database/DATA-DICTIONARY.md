# Spatial Data Dictionary — GGR-ICMS

**Project:** GGR-ICMS  
**Phase:** Phase 4  

---

## Table: `ggr_gis.houses`
| Field | Type | SRID | Definition |
|---|---|---|---|
| `house_id` | TEXT (PK) | - | Unique stable identifier |
| `house_code` | TEXT (UQ) | - | Unit code (e.g., GG-RT06-001) |
| `block_name` | TEXT | - | Block designation (e.g., Blok A) |
| `geom` | GEOMETRY(Point) | 4326 | Geographic point coordinate |
| `parcel_geom` | GEOMETRY(Polygon) | 4326 | Property parcel boundary |

## Table: `ggr_gis.roads`
| Field | Type | SRID | Definition |
|---|---|---|---|
| `road_id` | TEXT (PK) | - | Unique road segment ID |
| `road_name` | TEXT | - | Road name |
| `geom` | GEOMETRY(MultiLineString) | 4326 | Road centerline geometry |
