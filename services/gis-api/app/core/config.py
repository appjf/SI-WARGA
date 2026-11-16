import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GGR-ICMS GIS Spatial Service"
    API_V1_STR: str = "/v1"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg://postgres:postgres@localhost:5432/ggr_icms"
    )
    ALLOWED_ORIGINS: list[str] = ["*"]

    class Config:
        case_sensitive = True

settings = Settings()
