# Optional container image (used by Glama and other directories to start the server and list its tools).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
COPY data ./data
RUN npm ci --ignore-scripts && npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data
USER node
ENTRYPOINT ["node", "dist/index.js"]
