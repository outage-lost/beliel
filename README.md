# Para Milena · 20 vueltas al sol

Una carta interactiva de cumpleaños convertida en una pequeña aventura web. El proyecto combina una secuencia de diálogos, personajes pixelados, girasoles y un minijuego runner para celebrar los 20 años de Milena.

La experiencia comienza con el mensaje y, al terminarlo, abre el menú principal para volver a leerlo o jugar. Todo está construido como un sitio estático, sin backend ni dependencias de instalación.

## Ejecutar localmente

Al cargar `index.html` directamente funciona en la mayoría de navegadores, pero el runner necesita que el `.piskel` se sirva por HTTP. Para una prueba local:

```bash
docker build -t beliel .
docker run --rm -p 8080:80 beliel
```

Visita `http://localhost:8080`. En Dockploy, publica el puerto del contenedor `80` en el puerto que prefieras y usa esa dirección IP:puerto como origen para Cloudflared.

## Controles

- Avanza los diálogos haciendo clic, pulsando `Enter` o la barra espaciadora.
- En el runner, salta con `Espacio`, `↑` o tocando la pantalla.
- El récord y los girasoles recogidos se guardan en el almacenamiento local del navegador.

## Estructura

- `index.html`: pantallas, controles y contenido accesible.
- `styles.css`: estilos, animaciones y tratamiento visual pixel art de los globos.
- `app.js`: navegación de diálogos, persistencia y lógica del minijuego.
- `recursos-visuales/`: sprites, fondos y elementos gráficos.
