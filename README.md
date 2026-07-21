# Para Milena · 20 vueltas al sol

Regalo web estático de cumpleaños con diálogos interactivos y un minijuego runner.

## Ejecutar localmente

Al cargar `index.html` directamente funciona en la mayoría de navegadores, pero el runner necesita que el `.piskel` se sirva por HTTP. Para una prueba local:

```bash
docker build -t beliel .
docker run --rm -p 8080:80 beliel
```

Visita `http://localhost:8080`. En Dockploy, publica el puerto del contenedor `80` en el puerto que prefieras y usa esa dirección IP:puerto como origen para Cloudflared.
