# Stage 1: build and prerender the Angular app
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && npm run check:dist

# Stage 2: serve the static output
FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist/web/browser /usr/share/nginx/html
EXPOSE 80
