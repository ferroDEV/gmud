# GMUD Fullstack

Stack:
- Frontend: React + Vite + TypeScript. Sidebar colado na esquerda. Tema claro/escuro.
- Backend: Node + Express + Prisma (MySQL). Autenticação via AD (LDAP) + usuário admin local.
- Sessão: JWT em cookie httpOnly.
- Sem mocks: tudo via API.

## Requisitos
- Node 18+
- MySQL 8+ (ou Docker)
- PNPM (recomendado) ou NPM/Yarn

## Subir MySQL com Docker
```bash
docker compose up -d
# credenciais padrão em .env (ajuste conforme necessário)
```

## Configuração
Crie os arquivos `.env`:
- `backend/.env` (edite os valores conforme seu AD e MySQL)
- `frontend/.env` (opcional, já usa proxy para /api em dev)

## Inicialização (dev)
```bash
# 1) Backend
cd backend
pnpm i   # ou npm i / yarn
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm seed
pnpm dev

# 2) Frontend (novo terminal)
cd ../frontend
pnpm i
pnpm dev
```
Acesse: http://localhost:5173

### Login
- Via AD: suas credenciais corporativas (requer configuração LDAP).
- Admin local: usuário cadastrado no seed.
  - username: admin@local
  - senha: Admin!234

## Build
```bash
# backend
cd backend && pnpm build

# frontend
cd ../frontend && pnpm build
```

## Bibliotecas
- Backend: express, cors, cookie-parser, dotenv, bcryptjs, jsonwebtoken, @prisma/client, ldapauth-fork, zod
- Dev backend: prisma, typescript, ts-node, ts-node-dev, @types/*
- Frontend: react, react-dom, react-router-dom
- Dev frontend: vite, typescript, @types/*

## Scripts úteis
```bash
# reset do banco (DANGER: apaga tudo)
pnpm prisma migrate reset

# rodar seeds
pnpm seed
```
