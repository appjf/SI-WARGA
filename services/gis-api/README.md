# GGR-ICMS FastAPI GIS Service

Python FastAPI backend for spatial database queries, PostGIS integration, GeoJSON serialization, and spatial analysis for Green Garden Residence (RT 06 RW 01, Desa Cipicung, Banyuresmi, Garut).

## Running Locally

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
3. Interactive API documentation:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`
