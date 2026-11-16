# GIS Service Architecture (FastAPI) — GGR-ICMS

**Project:** GGR-ICMS  
**Phase:** Phase 4  

---

## 1. Overview
The GIS Service is a microservice built with Python FastAPI, GeoAnalytics via GeoPandas and Shapely, and SQLAlchemy with GeoAlchemy2 connecting to the PostgreSQL/PostGIS database.

## 2. Core Components
- **API Router (`app/api/router.py`)**: RESTful endpoints for health checks, spatial layers (boundaries, houses, roads, facilities), and spatial queries.
- **Pydantic Models (`app/models/spatial.py`)**: Strict request validation and GeoJSON FeatureCollection response formatting.
- **Security & Middleware**: CORS configuration, error handling, and token verification integration hooks with Firebase Auth.
