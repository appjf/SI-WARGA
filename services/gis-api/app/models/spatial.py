from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]
    id: Optional[str] = None

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class SpatialQueryRequest(BaseModel):
    geometry_wkt: str
    buffer_meters: Optional[float] = 0.0
    layer_type: str  # 'houses', 'facilities', 'roads', 'drainage'

class GeometryValidationRequest(BaseModel):
    geometry_wkt: str
    expected_srid: Optional[int] = 4326
