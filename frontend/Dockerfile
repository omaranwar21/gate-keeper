# Single stage, full node_modules (incl. devDependencies) kept at runtime:
# `next start` re-reads next.config.ts on every boot, which loads the
# next-intl plugin and Tailwind's Turbopack CSS loader, so trimming this
# down to a slim multi-stage image risks missing one of those at runtime.
# This is a local dev tool, not the production image (that's Vercel's job
# per the README), so a bigger image is the right trade here.
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* variables are inlined into the client bundle at build time,
# not read at runtime, so it has to be set before `next build` runs here.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3001
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
