FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN mkdir -p .next && chown nextjs:nodejs .next
USER nextjs
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
