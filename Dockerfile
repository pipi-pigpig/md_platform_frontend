FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm ci --silent
COPY . .
RUN npm run build

FROM nginx:alpine
# ✅ 关键：复制自定义的nginx配置，完全替换默认配置
COPY nginx.conf /etc/nginx/nginx.conf
# ✅ 复制构建的前端文件
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]