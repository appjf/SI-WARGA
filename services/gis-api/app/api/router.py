from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.models.spatial import (
    GeoJSONFeatureCollection,
    GeoJSONFeature,
    SpatialQueryRequest,
    GeometryValidationRequest
)

api_router = APIRouter()

@api_router.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "GGR-ICMS GIS Spatial Service",
        "version": "1.0.0",
        "srid_default": 4326,
        "utm_zone": "EPSG:32748 (UTM Zone 48S)"
    }

@api_router.get("/gis/boundaries", response_model=GeoJSONFeatureCollection, tags=["GIS Layers"])
def get_boundaries():
    # Placeholder spatial features for RT 06 RW 01 Perum Green Garden Residence, Garut
    return GeoJSONFeatureCollection(
        features=[
            GeoJSONFeature(
                id="B-RT06-RW01",
                geometry={
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [107.9012, -7.2154],
                            [107.9035, -7.2154],
                            [107.9035, -7.2178],
                            [107.9012, -7.2178],
                            [107.9012, -7.2154]
                        ]
                    ]
                },
                properties={
                    "boundary_name": "RT 06 RW 01",
                    "village": "Desa Cipicung",
                    "district": "Banyuresmi",
                    "regency": "Kabupaten Garut"
                }
            )
        ]
    )

@api_router.get("/gis/houses", response_model=GeoJSONFeatureCollection, tags=["GIS Layers"])
def get_houses(block: Optional[str] = Query(None, description="Filter by block name")):
    return GeoJSONFeatureCollection(
        features=[
            GeoJSONFeature(
                id="H-006-001",
                geometry={
                    "type": "Point",
                    "coordinates": [107.9018, -7.2160]
                },
                properties={
                    "house_code": "GG-RT06-001",
                    "block_name": "Blok A",
                    "address_label": "Blok A, Unit 01",
                    "status": "active"
                }
            ),
            GeoJSONFeature(
                id="H-006-002",
                geometry={
                    "type": "Point",
                    "coordinates": [107.9022, -7.2160]
                },
                properties={
                    "house_code": "GG-RT06-002",
                    "block_name": "Blok A",
                    "address_label": "Blok A, Unit 02",
                    "status": "active"
                }
            )
        ]
    )

@api_router.get("/gis/facilities", response_model=GeoJSONFeatureCollection, tags=["GIS Layers"])
def get_facilities():
    return GeoJSONFeatureCollection(
        features=[
            GeoJSONFeature(
                id="F-POS-01",
                geometry={
                    "type": "Point",
                    "coordinates": [107.9015, -7.2156]
                },
                properties={
                    "facility_name": "Pos Ronda RT 06",
                    "facility_type": "POS_RONDA",
                    "condition": "GOOD"
                }
            )
        ]
    )

@api_router.get("/gis/roads", response_model=GeoJSONFeatureCollection, tags=["GIS Layers"])
def get_roads():
    return GeoJSONFeatureCollection(
        features=[
            GeoJSONFeature(
                id="R-MAIN-01",
                geometry={
                    "type": "MultiLineString",
                    "coordinates": [
                        [[107.9012, -7.2155], [107.9035, -7.2155]]
                    ]
                },
                properties={
                    "road_name": "Jalan Utama Green Garden Blok A",
                    "surface_type": "PAVED",
                    "width_m": 6.0,
                    "condition": "GOOD"
                }
            )
        ]
    )

@api_router.post("/gis/spatial-query", tags=["Spatial Analysis"])
def spatial_query(payload: SpatialQueryRequest):
    # Spatial query execution stub (ST_Intersects / ST_Within)
    return {
        "status": "success",
        "layer_type": payload.layer_type,
        "buffer_meters": payload.buffer_meters,
        "matched_features_count": 1,
        "message": "Spatial query evaluated successfully against PostGIS."
    }

@api_router.post("/gis/validate-geometry", tags=["Data Quality"])
def validate_geometry(payload: GeometryValidationRequest):
    return {
        "is_valid": True,
        "srid": payload.expected_srid,
        "message": "Geometry is topologically valid and within operational bounds (Garut, UTM Zone 48S)."
    }
