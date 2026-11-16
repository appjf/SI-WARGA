# Shared Types (`types/`)

Definisi kontrak tipe TypeScript untuk entitas domain, amplop API, peran RBAC, status alur kerja, dan fitur GeoJSON.

## Cakupan Tipe yang Direncanakan

- Entitas identitas & RBAC (`UserRole`, `AccountStatus`).
- Entitas warga & rumah tangga (`ResidentProfile`, `Household`, `HouseUnit`).
- Entitas operasional (`AdminRequest`, `FinanceTransaction`, `ComplaintTicket`, `Announcement`, `AssetItem`, `DocumentMetadata`).
- Tipe spasial (`GeoJsonFeatureCollection`, `GisLayerMetadata`).
- Amplop API (`ApiResponse`, `ApiError`, `CursorPage`).
