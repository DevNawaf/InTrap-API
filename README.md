# InTrap API (Node.js + PostgreSQL + Docker)

Node.js API for `intrap-api.sanadais.com/api/v1` using PostgreSQL table `gallery_detections`.

## Endpoints

- `GET /health`
- `POST /api/v1/gallery-detections`
- `GET /api/v1/gallery-detections`
- `GET /api/v1/gallery-detections/:id`
- `PUT /api/v1/gallery-detections/:id`
- `DELETE /api/v1/gallery-detections/:id`

## Error format

All non-2xx responses return:

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": {},
  "requestId": "uuid"
}
```

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

## Validation behavior

- `image_name`, `image_path`, and `insect_name` are required non-empty strings.
- `confidence` is accepted as:
  - ratio in `[0, 1]` (converted to percentage), or
  - percentage in `[0, 100]`.
- Timestamps (`captured_at`, `received_at`) must be valid ISO strings.
- `limit` must be a positive integer and is clamped to `200`.
- `skip` must be a non-negative integer.

## List query parameters

- `limit` (optional): pagination page size (default `100`, max `200`)
- `skip` (optional): offset (default `0`)
- `since_received_at` (optional): ISO cursor timestamp for incremental fetch
- `since_id` (optional): positive integer cursor tiebreaker, requires `since_received_at`

## Run

```bash
docker compose up --build
```

API will be available on `http://localhost:3200`.

## Traefik routing

This service is configured in the same pattern as your working stack:
- networks: `root_default` and `web` (both external)
- host rule: `intrap-api.sanadais.com`
- path prefix: `/api/v1`
- backend port: `3200`
- certresolver: `mytlschallenge`

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
