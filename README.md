This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy no Render (Docker)

O projeto tem `Dockerfile`, `docker-compose.yml` e `render.yaml` prontos.

### 1. Testar localmente com Docker

```bash
docker compose up --build
```

Sobe a app em `http://localhost:3000` junto com um Postgres local (as migrations do Prisma rodam automaticamente no start do container).

### 2. Deploy no Render via Blueprint

1. Suba o repositório no GitHub/GitLab.
2. No Render, clique em **New > Blueprint** e aponte para o repositório — ele lê o `render.yaml` e cria automaticamente o Web Service (Docker) e o banco Postgres, já conectando `DATABASE_URL` e gerando o `SESSION_SECRET`.
3. Depois do primeiro deploy, preencha manualmente as variáveis do gateway Pix no painel do serviço (**Environment**): `VEOPAG_CLIENT_ID`, `VEOPAG_CLIENT_SECRET`, `VEOPAG_WEBHOOK_SECRET`, `VEOPAG_CALLBACK_URL` (essa última deve apontar para a URL pública do Render, ex.: `https://seu-app.onrender.com/api/pix/webhook`).

O container roda `prisma migrate deploy` antes de iniciar o servidor, então as migrations em `prisma/migrations` são aplicadas automaticamente a cada deploy.
