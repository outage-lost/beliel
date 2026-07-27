# Beliel · Una experiencia especial

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

Beliel es una experiencia web interactiva que combina una secuencia de diálogos, personajes ilustrados, girasoles y un minijuego runner. La experiencia está pensada como un contenido personal, con una presentación especial disponible únicamente el 6 de agosto de 2026.

La aplicación consulta la zona horaria, la fecha y la hora actuales del navegador cada vez que se abre. Con esa información determina la vista activa, actualiza el contador en tiempo real y mantiene la disponibilidad de los diálogos exclusivamente durante el 6 de agosto, desde las 00:00 hasta las 23:59.

El aviso de privacidad se muestra una sola vez por navegador. El contenido especial debe ser visto únicamente por la persona asignada y no debe compartirse, copiarse ni difundirse.

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

En producción, publica el puerto del contenedor detrás de un proxy con HTTPS. La configuración de Nginx incluye encabezados de seguridad y respeta `X-Forwarded-Proto` cuando se utiliza detrás de Cloudflare u otro proxy inverso.

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

- Avanza los diálogos haciendo clic, pulsando `Enter` o la barra espaciadora.
- En el runner, salta con `Espacio`, `↑` o tocando la pantalla.
- El récord y los girasoles recogidos se guardan en el almacenamiento local del navegador.

## Estructura

- `index.html`: pantallas, controles, metadatos y analítica.
- `styles.css`: estilos, animaciones y componentes de la interfaz.
- `app.js`: detección de fecha, contador, navegación de diálogos, persistencia y lógica del minijuego.
- `nginx.conf`: servidor web y encabezados de seguridad.
- `docker-compose.yml`: configuración de despliegue local y producción.
- `recursos-visuales/`: sprites, fondos y elementos gráficos.
