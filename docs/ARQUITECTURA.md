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
- `POST /api/runs/start`: crea una sesión de partida de 30 minutos.
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

Cada puntaje debe incluir el `runId` emitido al iniciar la partida. El servidor valida que pertenezca al usuario, que no haya expirado y que el score sea plausible para el tiempo transcurrido, con una tolerancia fija. Esto evita el envío directo de récords arbitrarios desde una consola; no sustituye una simulación autoritativa del juego para anti-trampas competitivo.

La frase no se puede recuperar. Si se pierde, el usuario debe utilizar otro nombre; no hay restablecimiento implementado. Al arrancar, esta versión elimina deliberadamente `data/leaderboard.json` si existe para descartar los usuarios de la versión anterior; no se realiza migración de esos datos.

## Protección de datos

La base SQLite usa una clave derivada de `BELIEL_DATA_KEY`. Los nombres, puntajes, sales y hashes de frase se almacenan como blobs cifrados con AES-256-GCM; para buscar un usuario se usa un HMAC de su nombre, no el nombre en claro. El hash de la frase usa `scrypt` antes de cifrarse. La clave no se guarda en SQLite ni en el repositorio.

SQLite no es SQLCipher: la estructura técnica del archivo y sus nombres de columnas no están cifrados, pero los valores de usuario, frase y puntaje sí lo están. Si el requisito futuro es cifrado integral del archivo SQLite, habría que desplegar SQLCipher o un proveedor externo de secretos.

La identidad reduce el uso casual de nombres ajenos. No convierte un juego client-side en un sistema anti-trampas: un usuario con conocimientos puede modificar el navegador y enviar un puntaje válido. Para una clasificación competitiva real habría que mover la simulación o la validación del resultado al servidor.

## Físicas del runner

El juego usa un paso de tiempo (`delta time`) limitado a 32 ms para evitar saltos grandes cuando una pestaña se congela.

- Gravedad base: `2200` en unidades de pantalla; se mantiene estable en móvil para que el tiempo de caída no se alargue artificialmente.
- Impulso vertical: `930 * sqrt(escala)`, para conservar una proporción similar en móvil.
- Velocidad horizontal: comienza en `420` y sigue una curva variable hasta `420 * 3.7`, con la velocidad máxima alcanzada alrededor de 1800 puntos.
- Puntuación: 10 puntos por segundo, multiplicados por los boosts activos.
- Velocidad de salto: desde 2.0×, el tiempo de vuelo y el recorrido horizontal se reducen gradualmente hasta un 10% menos en 3.7×. La altura se conserva aumentando la gravedad y compensando el impulso vertical.
- Colisión: hitbox central del avatar, menor que la imagen transparente completa.
- Coyote time: `110 ms`, permite saltar justo después de abandonar el borde.
- Jump buffer: `140 ms`, guarda una pulsación justo antes de tocar el suelo y permite encadenar el siguiente salto al aterrizar.
- Separación: cada nuevo obstáculo calcula su espera usando el tiempo completo de vuelo, la distancia horizontal alcanzable, el ancho del obstáculo y un margen adicional. No se usa una brecha que disminuya con el puntaje.
- Piso: el Canvas pinta directamente la franja inferior de `paisaje-de-fondo-carrusel-secuencial.png` y la desplaza mediante `groundOffset`. No se dibuja un bloque verde alternativo: el suelo visual pertenece al paisaje original.
- Obstáculos compuestos: desde `2.0×` aparecen dos piezas, desde `2.6×` tres y desde `3.2×` cuatro. Alternan cajas y mochilas y se superponen horizontalmente al 50% de su ancho, formando una aglomeración ancha sin hacerla más alta. La espera del siguiente grupo incluye el ancho real del conglomerado.
- Girasoles: aparecen con menor frecuencia, aproximadamente cada 5.2–12.6 segundos. Cada girasol agrega un boost independiente de 10 segundos. Los boosts activos se acumulan como `2^n` y se muestran en el HUD junto con el tiempo restante del boost que está más próximo a terminar; la interfaz limita la indicación visual a 16×.

El runner no permite doble salto. Un segundo salto solo ocurre después de aterrizar, o mediante la pulsación almacenada del jump buffer.

Al colisionar se detiene el ciclo, se muestra el score final y aparece el overlay de derrota con `REINTENTAR` y `INICIO`. Ninguna de esas acciones solicita una nueva identidad.

## Pausa del GIF

Los GIF no exponen una API fiable para detenerse en el frame actual. Al comenzar un salto, `app.js` dibuja el frame visible del GIF sobre `player-freeze`, un Canvas superpuesto del mismo tamaño, y oculta temporalmente el GIF. El Canvas permanece fijo durante todo el vuelo. Al aterrizar se retira y el GIF vuelve a mostrarse, conservando el movimiento únicamente cuando el avatar corre sobre el suelo.

## Responsive y controles de pantalla

En pantallas menores de 700 px se aplica una escala de mundo de `0.62` al avatar, obstáculos y velocidad. El impulso vertical usa `930 * sqrt(0.62)` mientras la gravedad permanece en `2200`; así la altura del salto disminuye en la misma proporción que el avatar y conserva una relación jugable con los obstáculos. El HUD reduce información secundaria, la tabla pasa a una columna y las acciones se apilan. El cálculo de distancias siempre usa las dimensiones escaladas reales, no valores de escritorio reutilizados.

Desde la pantalla de inicio, `GIRAR PARA JUGAR` solicita al navegador bloquear la orientación en `landscape`. Algunos navegadores móviles, especialmente los que no están en pantalla completa, rechazan esa solicitud; en ese caso se muestra una indicación para girar el dispositivo manualmente. `PANTALLA COMPLETA` usa la Fullscreen API y cambia su etiqueta para permitir salir. Ambas funciones dependen del permiso del navegador y no afectan la partida ni la identidad del jugador.

## Despliegue

```bash
docker compose up -d --build
docker compose ps
```

El contenedor usa Node 22 y sirve la interfaz y la API en el mismo puerto. Corre como usuario sin privilegios, con `no-new-privileges`, sin capabilities Linux y filesystem de solo lectura; solo `/app/data` y `/tmp` son escribibles.

En local, `BELIEL_PORT` usa `18080` y se enlaza a `127.0.0.1`, no a todas las interfaces. En Dokploy, el dominio debe apuntar al puerto interno `80` mediante Traefik; Dokploy recomienda `expose` para evitar publicar el puerto en el host. El puerto `18080` no aparece ocupado por otra aplicación en la auditoría realizada sobre el `docker ps` proporcionado.

En producción define obligatoriamente `NODE_ENV=production` y un `BELIEL_DATA_KEY` largo y aleatorio en las variables de entorno de Dokploy. El Compose no incluye una clave de producción. Dokploy inyecta las variables referenciadas por `${...}` desde su entorno configurado.

El volumen `beliel_leaderboard` debe conservarse entre despliegues. `nginx.conf` pertenece a la etapa estática anterior y no participa en el Dockerfile actual.

## Auditoría de seguridad

- CSP, `X-Frame-Options`, `Permissions-Policy`, `Referrer-Policy` y `nosniff` se envían desde el servidor.
- La API limita solicitudes por ruta/IP en ventanas de un minuto y rechaza cuerpos mayores de 10 KB.
- El servidor no habilita CORS; la API solo está pensada para el mismo origen.
- La ruta de archivos usa `path.relative` para impedir escapes fuera de la raíz pública.
- No se sirven `data/`, archivos ocultos ni secretos como recursos públicos.
- SQLite guarda valores sensibles cifrados; el secreto de cifrado no debe entrar al repositorio ni al Dockerfile.
- Los límites de score reducen manipulación, pero una defensa anti-cheat completa requeriría ejecutar la simulación en servidor.

## Spotify y letras

La API oficial de Spotify puede entregar la pista que el usuario está reproduciendo mediante `GET /me/player/currently-playing`, solicitando el scope `user-read-currently-playing`. Spotify no entrega las letras de la canción mediante su Web API. Además, sus políticas indican que no se deben sincronizar grabaciones con contenido visual. Por eso Beliel no implementa un karaoke de letras con Spotify directamente.

Para una integración permitida de metadatos se necesitarían un `client_id`, una URL de redirección registrada y consentimiento OAuth del usuario. Para mostrar letras haría falta, además, un proveedor de letras con licencia explícita para ese uso y revisar sus condiciones de sincronización. Hasta contar con esos datos y permisos, la integración no se activa ni se simula con letras inventadas.
