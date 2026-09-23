# syntax=docker/dockerfile:1.7
#
# AkorPro — Next.js standalone imajı.
#
# Build VPS'te değil, GitHub Actions'ta yapılır; Coolify yalnız hazır imajı çeker.
# Alpine (musl) bilinçli seçim: sharp'ın glibc tarafındaki bellek şişmesi sorunu
# yaşanmıyor (bkz. Next.js self-hosting kılavuzu, Image Optimization notu).

# ──────────────────────────────────────────────
# base
# ──────────────────────────────────────────────
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ──────────────────────────────────────────────
# deps — yalnız lockfile değişince yeniden çalışır
# ──────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ──────────────────────────────────────────────
# builder
# ──────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* değişkenleri build sırasında bundle'a gömülür.
# Bu yüzden imaj ortama özeldir: akorpro.com imajı akorpro.com.tr'de kullanılamaz.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_DIRECTUS_URL
ARG NEXT_PUBLIC_GA4_ID
ARG NEXT_PUBLIC_VITALS_ENDPOINT
# Sunucu tarafı: prerender sırasında Directus'tan okumak için gerekli.
ARG DIRECTUS_URL
ARG SENTRY_ORG
ARG SENTRY_PROJECT

ENV NODE_ENV=production \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_DIRECTUS_URL=${NEXT_PUBLIC_DIRECTUS_URL} \
    NEXT_PUBLIC_GA4_ID=${NEXT_PUBLIC_GA4_ID} \
    NEXT_PUBLIC_VITALS_ENDPOINT=${NEXT_PUBLIC_VITALS_ENDPOINT} \
    DIRECTUS_URL=${DIRECTUS_URL} \
    SENTRY_ORG=${SENTRY_ORG} \
    SENTRY_PROJECT=${SENTRY_PROJECT}

# Sırlar ARG ile geçilmez — ARG imaj katman geçmişinde okunabilir kalır.
# BuildKit secret mount'u yalnız bu RUN adımı boyunca dosya olarak var olur.
RUN --mount=type=secret,id=directus_token \
    --mount=type=secret,id=sentry_auth_token \
    export DIRECTUS_TOKEN="$(cat /run/secrets/directus_token 2>/dev/null || echo '')" && \
    export SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || echo '')" && \
    npm run build

# ──────────────────────────────────────────────
# runner
# ──────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# standalone, public ve .next/static klasörlerini kopyalamaz — elle taşınır.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ISR disk önbelleği buraya yazar; konteyner içinde yazılabilir olmalı.
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
