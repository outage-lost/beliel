FROM node:22-alpine
WORKDIR /app
COPY package.json server.js ./
COPY index.html styles.css app.js especial.html special.css special.js ./
COPY recursos-visuales ./recursos-visuales
RUN mkdir -p /app/data && chown -R node:node /app
ENV PORT=80 DATA_DIR=/app/data
VOLUME ["/app/data"]
USER node
EXPOSE 80
CMD ["node", "server.js"]
