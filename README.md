# InTrap API (Node.js + PostgreSQL + Docker)

Node.js API for `intrap.sanadais.com/intrap/api/v1` using PostgreSQL table `gallery_detections`.

## Endpoints

- `GET /health`
- `POST /intrap/api/v1/gallery-detections`
- `GET /intrap/api/v1/gallery-detections`
- `GET /intrap/api/v1/gallery-detections/:id`
- `PUT /intrap/api/v1/gallery-detections/:id`
- `DELETE /intrap/api/v1/gallery-detections/:id`

## Fields handled

- `id`
- `device_id`
- `image_name`
- `image_path`
- `image_url`
- `insect_name`
- `life_stage`
- `captured_at`
- `received_at`
- `confidence`

## Environment

Use `.env` (already configured):

- `POSTGRES_USER=apiuser`
- `POSTGRES_PASSWORD=StrongApiPass2025`
- `POSTGRES_DB=intrap`
- `DATABASE_URL=postgresql://apiuser:StrongApiPass2025@db:5432/intrap`

## Run

```bash
docker compose up --build
```

API will be available on `http://localhost:3200`.

## Traefik routing

This service is configured for Traefik with:
- Host: `sanadais.com` or `intrap.sanadais.com`
- Path prefix: `/intrap/api/v1`
- Target container port: `3200`

If your Traefik Docker network is not `traefik-public`, set:

```bash
TRAEFIK_NETWORK=your_traefik_network_name
```

## Example create request

```bash
curl -X POST http://localhost:3200/intrap/api/v1/gallery-detections \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "cam-01",
    "image_name": "img_001.jpg",
    "image_path": "/uploads/2026/03/img_001.jpg",
    "image_url": "https://intrap.sanadais.com/uploads/2026/03/img_001.jpg",
    "insect_name": "ant",
    "life_stage": "adult",
    "captured_at": "2026-03-02T12:30:00Z",
    "confidence": 0.97
  }'
```
