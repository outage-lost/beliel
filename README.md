# Una experiencia especial

Una experiencia interactiva convertida en una pequeña aventura web. El proyecto combina una secuencia de diálogos, personajes pixelados, girasoles y un minijuego runner.

La versión especial está disponible únicamente el 6 de agosto de 2026, de 00:00 a 23:59 en la hora local del navegador. El aviso de privacidad se muestra una sola vez y se guarda en el almacenamiento local del navegador.

La vista especial y el contador se activan automáticamente usando la zona horaria, fecha y hora actuales del navegador. La interfaz también actualiza su estado al volver a hacerse visible la pestaña y al cambiar de día.

El aviso de privacidad es únicamente informativo y no bloquea la experiencia. Un sitio estático no puede identificar de forma fiable si otra persona está mirando físicamente la pantalla; para una protección real haría falta autenticación y un servidor.

## Ejecutar localmente

Al cargar `index.html` directamente funciona en la mayoría de navegadores, pero el runner necesita que el `.piskel` se sirva por HTTP. Para una prueba local:

```bash
docker build -t beliel .
docker run --rm -p 8080:80 beliel
```

Visita `http://localhost:8080` para desarrollo local. En producción, sirve el sitio detrás de HTTPS; el frontend redirige a HTTPS y Nginx respeta `X-Forwarded-Proto` cuando está detrás de un proxy como Cloudflare.

## Controles

- Avanza los diálogos haciendo clic, pulsando `Enter` o la barra espaciadora.
- En el runner, salta con `Espacio`, `↑` o tocando la pantalla.
- El récord y los girasoles recogidos se guardan en el almacenamiento local del navegador.

## Estructura

- `index.html`: pantallas, controles y contenido accesible.
- `styles.css`: estilos, animaciones y componentes de la interfaz.
- `app.js`: navegación de diálogos, persistencia y lógica del minijuego.
- `recursos-visuales/`: sprites, fondos y elementos gráficos.
