# ImageNova AI · 生产镜像
# 后端 Express 运行在 8787，静态前端由宿主机 nginx 直接托管（见 /etc/nginx/conf.d/imagenova.conf）
FROM node:20-alpine

WORKDIR /app

# 只装后端运行时依赖（前端已预构建进 dist/）
COPY deploy/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY server ./server
COPY dist ./dist

ENV NODE_ENV=production \
    PORT=8787 \
    HOST=0.0.0.0

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
