# CodeAlpha_URLShortener

Simple URL Shortener backend — built for the CodeAlpha Backend Development Internship (Task 1).

## How it meets the task requirements

- **Backend server**: Express.js (Node.js) — see `server.js`
- **API endpoint to shorten URLs**: `POST /api/shorten`
- **Database storage**: MongoDB via Mongoose — see `db.js` and `models/Url.js`
- **Redirect route**: `GET /:code` redirects to the original long URL and counts clicks
- **Optional frontend**: `public/index.html` — a simple form to shorten a URL and see recent links

## Setup

1. Make sure MongoDB is running:
   - Locally (`mongod` running on `localhost:27017`), or
   - A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` if you're not using the local default.
3. Install dependencies and start the server:

```bash
npm install
npm start
```

The server runs at `http://localhost:3000` by default. Open that URL in your browser to use the frontend.

## API Reference

### Shorten a URL
```
POST /api/shorten
Content-Type: application/json

{ "url": "https://example.com/some/very/long/path" }
```

Response:
```json
{
  "shortCode": "aB3xQ1z",
  "shortUrl": "http://localhost:3000/aB3xQ1z",
  "originalUrl": "https://example.com/some/very/long/path"
}
```

### Use a short URL
```
GET /:code
```
Redirects (302) to the original URL and increments its click count.

### List all URLs (bonus, used by the frontend)
```
GET /api/urls
```

## Data model (`models/Url.js`)

| Field        | Type    | Notes                          |
|--------------|---------|---------------------------------|
| shortCode    | String  | Unique, indexed                 |
| originalUrl  | String  | The long URL                    |
| clicks       | Number  | Increments on each redirect     |
| createdAt    | Date    | Added automatically (timestamps)|
| updatedAt    | Date    | Added automatically (timestamps)|

## Notes

- Requesting the same URL twice returns the same short code instead of creating a duplicate.
- Short codes are 7 characters, generated with `nanoid`, and checked for collisions before saving.
- If MongoDB isn't reachable, the server logs an error and exits — check your `MONGODB_URI`.

## Submitting this task (per CodeAlpha instructions)

1. Push this project to a GitHub repo named exactly `CodeAlpha_URLShortener`.
2. Record a short video explaining the project and post it on LinkedIn, tagging @CodeAlpha, with the repo link.
3. Submit through the Submission Form shared in the CodeAlpha WhatsApp group.
