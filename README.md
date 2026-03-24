
# SyncDoc

SyncDoc is a production-oriented collaborative document workspace built with a Next.js frontend and an Express + Socket.io backend. It includes JWT auth, PostgreSQL via Prisma, strict RBAC enforcement, document chat, Cloudinary uploads, and Gemini streaming actions for summarization and grammar/tone polishing.

## Project Structure

```text
syncdoc-workspace/
+-- backend/
|   +-- prisma/
|   |   +-- schema.prisma
|   +-- src/
|   |   +-- app.ts
|   |   +-- server.ts
|   |   +-- config/
|   |   +-- lib/
|   |   +-- middleware/
|   |   +-- modules/
|   |   |   +-- ai/
|   |   |   +-- auth/
|   |   |   +-- chat/
|   |   |   +-- documents/
|   |   |   +-- permissions/
|   |   |   +-- upload/
|   |   +-- socket/
|   |   +-- types/
|   |   +-- utils/
|   +-- .env.example
|   +-- package.json
|   +-- tsconfig.json
+-- frontend/
|   +-- app/
|   |   +-- (auth)/
|   |   +-- workspace/
|   +-- components/
|   |   +-- auth/
|   |   +-- ui/
|   |   +-- workspace/
|   +-- lib/
|   +-- store/
|   +-- types/
|   +-- .env.example
|   +-- package.json
|   +-- tailwind.config.ts
|   +-- tsconfig.json
+-- package.json
+-- README.md
```

## Features

- JWT registration/login with bcrypt password hashing
- PostgreSQL schema for `User`, `Document`, `DocumentUser`, `Message`, and `File`
- RBAC roles: `OWNER`, `EDITOR`, `VIEWER`
- Server-side access enforcement for REST and WebSocket actions
- Real-time document editing over Socket.io with version-based conflict protection
- Real-time document chat with optimistic UI
- File upload in chat via Cloudinary, restricted to editors and owners
- Gemini streaming AI actions for summarizing and polishing content
- Notion-inspired responsive layout with sidebar, editor, and right rail

## Backend APIs

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`
- `GET /documents`
- `POST /documents`
- `GET /documents/:documentId`
- `PATCH /documents/:documentId`
- `PUT /documents/:documentId/content`
- `DELETE /documents/:documentId`
- `GET /permissions/:documentId`
- `POST /permissions/:documentId`
- `PATCH /permissions/:documentId/:userId`
- `DELETE /permissions/:documentId/:userId`
- `GET /chat/:documentId/messages`
- `POST /chat/:documentId/messages`
- `POST /upload/:documentId`
- `POST /ai/stream`

## WebSocket Events

- `join-document`
- `leave-document`
- `document-change`
- `chat-message`
- `user-presence`

## RBAC Rules

- `VIEWER`: can read documents and participate in chat
- `EDITOR`: can edit documents, chat, and upload files
- `OWNER`: full document control, including rename, delete, and permission management

The backend enforces these rules in both HTTP routes and Socket.io handlers.

## Setup

### 1. Install dependencies

```bash
npm install
npm install --workspace backend
npm install --workspace frontend
```

### 2. Configure environment variables

Copy the example env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill in:

- `DATABASE_URL` for PostgreSQL
- `DIRECT_URL` for Prisma migrations and deploys
- `JWT_SECRET`
- `CLIENT_URL`
- `CORS_ORIGINS` if you want multiple allowed frontend origins
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GEMINI_API_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` for production password reset emails
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`

### 3. Run Prisma

```bash
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend
```

### 4. Start both apps

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Collaboration Model

SyncDoc uses a last-write-safe versioning strategy:

1. Each document stores a numeric `version`.
2. Editor updates send `baseVersion` with each change.
3. The backend rejects stale writes with a conflict response.
4. Fresh document state is pushed back to the client to prevent silent overwrites.

This keeps concurrent edits safe without allowing stale clients to overwrite newer content.

## Deploy Live

This repo is now set up for a concrete production path:

- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

There is a ready-to-import Render blueprint in [render.yaml](./render.yaml).

### 1. Push the repo to GitHub

Create a GitHub repository and push the full monorepo so both Vercel and Render can import the same codebase.

### 2. Create a Neon PostgreSQL database

Create a Neon project and copy two connection strings:

- `DATABASE_URL`: use the pooled/runtime URL
- `DIRECT_URL`: use the direct connection URL for Prisma migrations

Set both in the backend environment. SyncDoc's Prisma schema is configured to use `DIRECT_URL` for deploy-time migrations and `DATABASE_URL` for the running app.

### 3. Deploy the backend on Render

Use the root-level [render.yaml](./render.yaml) blueprint, or create the service manually with these values:

- Runtime: `Node`
- Build command: `npm install && npm run prisma:generate --workspace backend && npm run build --workspace backend`
- Pre-deploy command: `npm run prisma:deploy --workspace backend`
- Start command: `npm run start --workspace backend`
- Health check path: `/health`

Backend environment variables to set:

- `NODE_ENV=production`
- `PORT=10000`
- `DATABASE_URL=<your pooled Neon URL>`
- `DIRECT_URL=<your direct Neon URL>`
- `JWT_SECRET=<long random secret>`
- `JWT_EXPIRES_IN=7d`
- `CLIENT_URL=<your Vercel production URL>`
- `CORS_ORIGINS=<your Vercel URL>` or a comma-separated list of exact origins
- `CLOUDINARY_CLOUD_NAME=<cloudinary cloud name>`
- `CLOUDINARY_API_KEY=<cloudinary api key>`
- `CLOUDINARY_API_SECRET=<cloudinary api secret>`
- `GEMINI_API_KEY=<gemini api key>`
- `GEMINI_MODEL=gemini-2.5-flash`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES=30`
- `SMTP_HOST=<smtp host>`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=<smtp username>`
- `SMTP_PASS=<smtp password>`
- `MAIL_FROM=SyncDoc <no-reply@yourdomain.com>`

### 4. Deploy the frontend on Vercel

Import the same GitHub repo into Vercel and set:

- Root Directory: `frontend`
- Framework Preset: `Next.js`

Frontend environment variables:

- `NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com`
- `NEXT_PUBLIC_SOCKET_URL=https://your-render-service.onrender.com`

After the first Vercel deploy, copy the Vercel production URL back into the Render backend as `CLIENT_URL` and `CORS_ORIGINS`, then redeploy the backend once.

### 5. Attach custom domains

Once both services are healthy:

- Add your app domain in Vercel, for example `app.yourdomain.com`
- Add your API domain in Render, for example `api.yourdomain.com`
- Update `CLIENT_URL`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SOCKET_URL` to those custom domains
- Redeploy both services

### 6. Smoke-test the live app

Verify these production flows:

1. Sign up and sign in
2. Create a document and rename it
3. Open the same document in two browsers and confirm live editing and presence
4. Send a chat message
5. Upload an image or PDF as an owner/editor
6. Run Gemini summarize and grammar actions
7. Trigger forgot-password and confirm the reset email arrives

## Production Notes

- Keep the backend on a single instance for now. Socket presence and document broadcast state are process-local, so horizontal scaling needs a shared Socket.io adapter such as Redis.
- Password reset emails now work in production when SMTP is configured. In development, the reset URL is still returned in the response body for easy local testing.
- Render needs the paid-capable pre-deploy hook path for the cleanest `prisma migrate deploy` flow defined in [render.yaml](./render.yaml).

## Notes

- The frontend uses Zustand for auth, document, socket, chat, presence, and AI state.
- The editor uses TipTap with live sync through Socket.io.
- Chat is document-scoped and supports both text and uploaded files.
- The right rail swaps between Chat, AI, and Share controls.
>>>>>>> 6317fe4 (Initial commit)
