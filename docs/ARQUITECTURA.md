# Beliel · documentación técnica

## Alcance

Beliel tiene dos experiencias separadas:

- `/`: vista pública. Incluye la portada, identidad del jugador, tabla global y runner.
- `/especial.html`: vista personal. Solo muestra su contenido durante el 6 de agosto de 2026 usando la zona horaria `America/Guayaquil`. Fuera de esa fecha presenta una pantalla cerrada y no expone los diálogos.

La portada pública reutiliza `paisaje-de-fondo-inicio.png`, `avatar-mil-de-pie-fijo-removebg-preview.png` y `beliel-removebg-preview.png`. El runner utiliza el GIF de carrera, el paisaje secuencial, los dos obstáculos y los girasoles.

## Componentes

### Frontend

- `index.html`: estructura de portada, tabla, juego y diálogo de identidad.
- `styles.css`: sistema visual Organic; bosque, salvia, arcilla, ocre y arena; Fraunces para titulares, DM Sans para interfaz y Space Mono para números.
- `app.js`: sesión local, normalización de formularios, llamadas API, leaderboard, ciclo del juego, piso móvil en Canvas, pausas del avatar y responsive.
- `especial.html`, `special.js`, `special.css`: superficie aislada para la experiencia de fecha especial.

### Backend

- `server.js`: servidor HTTP sin dependencias externas.
- `POST /api/users/register`: crea un usuario nuevo. Rechaza nombres repetidos.
- `POST /api/users/login`: verifica la frase con `scrypt` y entrega un token de sesión de 30 días.
- `GET /api/leaderboard`: devuelve los diez mejores puntajes y el número total de jugadores.
- `POST /api/scores`: requiere `Authorization: Bearer <token>` y solo conserva el mejor puntaje.
- `data/beliel.sqlite`: persistencia local dentro del volumen `beliel_leaderboard`.

El nombre se compara con una clave en minúsculas. La frase acepta únicamente letras ASCII minúsculas y espacios entre palabras; el navegador la convierte y limpia al escribir. El backend vuelve a validar todo, porque la validación del cliente no es una frontera de seguridad.

## Flujo de identidad

1. Primera visita: se muestran nombre y frase.
2. El navegador intenta registrar el nombre.
3. Si el nombre no existe, se crea y se entrega un token.
4. Si el nombre ya existe, el mismo formulario intenta iniciar sesión con la frase.
5. El token y el usuario se guardan en `localStorage` para no preguntar de nuevo en ese navegador.
6. “Cambiar jugador” borra el token y vuelve a mostrar el formulario.

El token es firmado con HMAC y contiene la identidad y expiración. No depende de una tabla de sesiones en memoria, por lo que reconstruir o reiniciar el contenedor no abre el formulario al perder una partida. Si una sincronización falla, la pantalla de derrota permanece visible con las acciones `REINTENTAR` y `INICIO`.

La frase no se puede recuperar. Si se pierde, el usuario debe utilizar otro nombre; no hay restablecimiento implementado. Al arrancar, esta versión elimina deliberadamente `data/leaderboard.json` si existe para descartar los usuarios de la versión anterior; no se realiza migración de esos datos.

## Protección de datos

La base SQLite usa una clave derivada de `BELIEL_DATA_KEY`. Los nombres, puntajes, sales y hashes de frase se almacenan como blobs cifrados con AES-256-GCM; para buscar un usuario se usa un HMAC de su nombre, no el nombre en claro. El hash de la frase usa `scrypt` antes de cifrarse. La clave no se guarda en SQLite ni en el repositorio.

SQLite no es SQLCipher: la estructura técnica del archivo y sus nombres de columnas no están cifrados, pero los valores de usuario, frase y puntaje sí lo están. Si el requisito futuro es cifrado integral del archivo SQLite, habría que desplegar SQLCipher o un proveedor externo de secretos.

La identidad reduce el uso casual de nombres ajenos. No convierte un juego client-side en un sistema anti-trampas: un usuario con conocimientos puede modificar el navegador y enviar un puntaje válido. Para una clasificación competitiva real habría que mover la simulación o la validación del resultado al servidor.

## Físicas del runner

El juego usa un paso de tiempo (`delta time`) limitado a 32 ms para evitar saltos grandes cuando una pestaña se congela.

- Gravedad base: `2200` ajustada por la escala de viewport.
- Impulso vertical: `930 * sqrt(escala)`, para conservar una proporción similar en móvil.
- Velocidad horizontal: comienza en `420` y sigue una curva variable hasta `420 * 3.7`, con la velocidad máxima alcanzada alrededor de 1800 puntos.
- Puntuación: 10 puntos por segundo, multiplicados por los boosts activos.
- Velocidad de salto: desde 2.0×, el tiempo de vuelo y el recorrido horizontal se reducen gradualmente hasta un 10% menos en 3.7×. La altura se conserva aumentando la gravedad y compensando el impulso vertical.
- Colisión: hitbox central del avatar, menor que la imagen transparente completa.
- Coyote time: `110 ms`, permite saltar justo después de abandonar el borde.
- Jump buffer: `140 ms`, guarda una pulsación justo antes de tocar el suelo y permite encadenar el siguiente salto al aterrizar.
- Separación: cada nuevo obstáculo calcula su espera usando el tiempo completo de vuelo, la distancia horizontal alcanzable, el ancho del obstáculo y un margen adicional. No se usa una brecha que disminuya con el puntaje.
- Piso: el Canvas pinta una franja inferior con el tramo de suelo del paisaje y la desplaza mediante `groundOffset`; mientras carga la imagen mantiene un suelo de respaldo visible.
- Girasoles: aparecen con menor frecuencia, aproximadamente cada 5.2–12.6 segundos. Cada girasol agrega un boost independiente de 10 segundos. Los boosts activos se acumulan como `2^n` y se muestran en el HUD junto con el tiempo restante del boost que está más próximo a terminar; la interfaz limita la indicación visual a 16×.

El runner no permite doble salto. Un segundo salto solo ocurre después de aterrizar, o mediante la pulsación almacenada del jump buffer.

Al colisionar se detiene el ciclo, se muestra el score final y aparece el overlay de derrota con `REINTENTAR` y `INICIO`. Ninguna de esas acciones solicita una nueva identidad.

## Pausa del GIF

Los GIF no exponen una API fiable para detenerse en el frame actual. Al comenzar un salto, `app.js` dibuja el frame visible del GIF sobre `player-freeze`, un Canvas superpuesto del mismo tamaño, y oculta temporalmente el GIF. El Canvas permanece fijo durante todo el vuelo. Al aterrizar se retira y el GIF vuelve a mostrarse, conservando el movimiento únicamente cuando el avatar corre sobre el suelo.

## Responsive

En pantallas menores de 700 px se aplica una escala de mundo de `0.62` a avatar, obstáculos, velocidad, gravedad e impulso. El HUD reduce información secundaria, la tabla pasa a una columna y las acciones se apilan. El cálculo de distancias siempre usa las dimensiones escaladas reales, no valores de escritorio reutilizados.

## Despliegue

```bash
docker compose up -d --build
docker compose ps
```

El contenedor usa Node 22 y sirve la interfaz y la API en el mismo puerto. El volumen `beliel_leaderboard` debe conservarse entre despliegues. `nginx.conf` pertenece a la etapa estática anterior y no participa en el Dockerfile actual.
