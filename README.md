# InTrap API (Node.js + PostgreSQL + Docker)

Node.js API for `intrap.sanadais.com/api/v1` using PostgreSQL table `gallery_detections`.

## Endpoints

- `GET /health`
- `POST /api/v1/gallery-detections`
- `GET /api/v1/gallery-detections`
- `GET /api/v1/gallery-detections/:id`
- `PUT /api/v1/gallery-detections/:id`
- `DELETE /api/v1/gallery-detections/:id`

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

## Run

```bash
docker compose up --build
```

API will be available on `http://localhost:3200`.

## Traefik routing

This service is configured in the same pattern as your working stack:
- networks: `root_default` and `web` (both external)
- host rule: `intrap.sanadais.com` or `sanadais.com`
- path prefix: `/api/v1`
- backend port: `3200`
- certresolver: `letsencrypt`

## Example create request

```bash
curl -X POST http://localhost:3200/api/v1/gallery-detections \
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
