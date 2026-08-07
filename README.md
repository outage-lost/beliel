# Beliel · Runner arcade

```text
                                    .%%%%      %=
                                   :%%-%%%%   %%%+
                                   :%%  =%%%+ %%%%%
                                   :%%   %%%% #%%%%
                                    .%%   %%%% *%%%
                                      .%%  %%%.*%%%
                                        %%%%%%*%%%%%%*:
                                          %%%%%%%%%%%%%*:
                                         %%%%%%%%%%#%%%%*.
                                         %%%%%%%%%%..%%%%#.
                                  %%%%%%%.%%%%%%%%%%%%%%%%@
                             -%%%%%%%%%%%%%%%%%%%%%%%%%%%#
                            *%%%%%%%%%%%%%%%%%%%%%%%%%...
                          %%%%%%%%%%%%%%%%%%%%%%%%%%%%#
                         %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                         %%%%%%%%%%#.:#%%%%%%%%%%%%%%%#
                         %%%%%%%%%%%%%% %%%%%%%%%%%%%%
                     %%% %%%%%%%%%%%%%%% %%%%%%+#%%%=
                    @%%%%%%%%%%%%%%%%%%% %%%%%%:*%%%
                     *%%%%%%%%%%%%%%%%+ ++%%%%%:*%%%@
                      =** *%%%%%%%%%%%%%%: =%%%%-=%%%-
                            ##############. ####:-####
```

## Dedicatoria

Esta página nació como una pequeña forma de decir algo que a veces cuesta poner en palabras.

No fue creada para exigir una respuesta ni para cambiar lo que ya pasó. Fue hecha para dejar un mensaje con calma: reconocer los errores, pedir perdón por las veces que fallé y agradecer los momentos compartidos. También para recordar que, incluso después de los días difíciles, siempre quise que te fuera bien.

Ojalá esta nueva etapa esté llena de tranquilidad, personas que te quieran de verdad y oportunidades para cumplir todo lo que te propongas. Que puedas mirar hacia adelante con libertad y encontrar muchos motivos para sentirte orgullosa de quien eres.

Esta aventura guarda un último deseo: que seas feliz. No importa cuánto tiempo pase ni dónde nos encuentre la vida; ese deseo permanece.

## Sobre el proyecto

Beliel es un runner arcade web que reutiliza los personajes, obstáculos, girasoles y paisajes originales. El juego usa delta time, gravedad y velocidad progresiva, salto con trayectoria parabólica, separación segura entre obstáculos y detección de colisiones con hitbox reducida.

La vista pública solicita el nombre y una frase secreta solo la primera vez en cada navegador. En visitas posteriores reutiliza el token local. En otro navegador se inicia sesión con el mismo nombre y frase. La frase nunca se guarda en el navegador ni en texto plano: el servidor la protege con `scrypt` y sal aleatoria. Los usuarios y puntajes viven en SQLite; los campos sensibles se cifran con AES-256-GCM usando `BELIEL_DATA_KEY`.

## Clonar el repositorio

Requisitos: Git y Docker con Docker Compose.

```bash
git clone https://github.com/outage-lost/beliel.git
cd beliel
```

## Desplegar con Docker

Construye la imagen y levanta el contenedor en segundo plano:

```bash
docker compose up -d --build
```

Comprueba que el servicio esté activo y saludable:

```bash
docker compose ps
```

## Abrir en el navegador

Con el despliegue local activo, abre:

```text
http://localhost:18080
```

En producción, publica el puerto del contenedor detrás de un proxy con HTTPS. El servicio Node incluye los encabezados básicos de seguridad y sirve tanto la interfaz como la API.

El despliegue crea el volumen Docker `beliel_leaderboard`; consérvalo para no perder usuarios y puntajes. Para producción debes definir una clave larga y secreta en `BELIEL_DATA_KEY`; el valor incluido en Compose solo sirve para desarrollo local.

## Detener y reiniciar el contenedor

Para detener el servicio sin eliminarlo:

```bash
docker compose stop
```

Para iniciarlo de nuevo:

```bash
docker compose start
```

Para detenerlo y eliminar los contenedores y la red del proyecto:

```bash
docker compose down
```

Para volver a desplegar después de modificar archivos:

```bash
docker compose up -d --build
```

## Controles

- En el runner, salta con `Espacio`, `↑` o tocando la pantalla.
- La mejor marca se sincroniza con el servidor al terminar una partida.
- La ruta `/especial.html` conserva la separación de la experiencia personal: solo se habilita el 6 de agosto de 2026 en la zona horaria de Guayaquil.

## Estructura

- `index.html`: pantallas, controles, metadatos y analítica.
- `styles.css`: estilos, animaciones y componentes de la interfaz.
- `app.js`: registro de usuario, clasificación global y lógica del minijuego.
- `server.js`: servidor HTTP, SQLite, cifrado y API de usuarios/puntajes.
- `package.json`: configuración mínima de Node.js.
- `nginx.conf`: configuración anterior conservada como referencia; el Dockerfile actual usa Node.
- `docker-compose.yml`: configuración de despliegue local y producción.
- `recursos-visuales/`: sprites, fondos y elementos gráficos.
- `especial.html`, `special.js`, `special.css`: vista especial aislada y protegida por fecha.

La documentación técnica completa está en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).
