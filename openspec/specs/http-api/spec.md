# http-api

## Purpose
Exponer por HTTP con FastAPI la superficie minima que consume la web: un healthcheck y la gestion de hojas de personaje, jugadores y encuentros de combate.
## Requirements
### Requirement: Healthcheck
La API SHALL exponer `GET /health` que devuelve status 200 cuando el servicio esta operativo.

#### Scenario: Servicio operativo
- **WHEN** se hace `GET /health`
- **THEN** la respuesta tiene status 200 con un cuerpo que indica estado OK

### Requirement: Documentacion OpenAPI
La API SHALL exponer la documentacion OpenAPI interactiva de FastAPI en `/docs`, generada a partir de los endpoints expuestos. La documentacion SHALL reflejar `GET /health`, `GET /character-sheets` y `GET /character-sheets/{slug}`.

#### Scenario: Acceso a la documentacion
- **WHEN** se accede a `GET /docs`
- **THEN** se sirve la UI de documentacion con `/health`, `/character-sheets` y `/character-sheets/{slug}`

### Requirement: Autenticacion requerida en toda la API
Todos los endpoints de la API (incluyendo `/health` y `/docs`) SHALL requerir autenticacion HTTP Basic. La API MUST validar el usuario y la contrasena recibidos contra `API_AUTH_USER` y `API_AUTH_PASSWORD` (variables de entorno, una unica credencial compartida, sin cuentas individuales), usando una comparacion resistente a timing attacks. Toda peticion sin credenciales o con credenciales invalidas MUST recibir status 401 con header `WWW-Authenticate: Basic`, sin ejecutar la logica del endpoint.

#### Scenario: Peticion sin credenciales
- **WHEN** se hace una peticion a cualquier endpoint de la API sin header `Authorization`
- **THEN** la respuesta tiene status 401 con header `WWW-Authenticate: Basic` y no se ejecuta ninguna logica del endpoint

#### Scenario: Peticion con credenciales invalidas
- **WHEN** se hace una peticion con un header `Authorization: Basic` que no corresponde a `API_AUTH_USER`/`API_AUTH_PASSWORD`
- **THEN** la respuesta tiene status 401 y no se ejecuta ninguna logica del endpoint

#### Scenario: Peticion con credenciales validas
- **WHEN** se hace una peticion con un header `Authorization: Basic` que corresponde a `API_AUTH_USER`/`API_AUTH_PASSWORD`
- **THEN** la peticion se procesa normalmente segun el endpoint solicitado

### Requirement: API publica de hojas por slug
La API SHALL exponer una API de solo lectura para las hojas de personaje, consumida por la web. La API MUST exponer `GET /character-sheets` que devuelve la lista de personajes disponibles (cada item con al menos nombre del personaje, un `slug` estable, y el `jugador_id` del usuario dueno de la hoja, sin el id de jugador), y `GET /character-sheets/{slug}` que devuelve la hoja del personaje identificado por su slug. El `slug` MUST derivarse de forma estable del nombre del personaje (o del jugador) y MUST ser unico entre las hojas. Ningun cuerpo de respuesta de esta API MUST incluir el id de jugador. Estos endpoints de lectura MUST requerir autenticacion HTTP Basic como el resto de la API (ver Requirement de autenticacion requerida).

#### Scenario: Listado de hojas
- **WHEN** se hace `GET /character-sheets` con credenciales validas
- **THEN** la respuesta tiene status 200 con la lista de personajes (nombre, slug y `jugador_id`), sin id de jugador en ningun item

#### Scenario: Hoja por slug existente
- **WHEN** se hace `GET /character-sheets/{slug}` con credenciales validas para un slug que corresponde a una hoja
- **THEN** la respuesta tiene status 200 con el JSON de la hoja de ese personaje, sin id de jugador

#### Scenario: Slug inexistente
- **WHEN** se hace `GET /character-sheets/{slug}` con credenciales validas para un slug que no corresponde a ninguna hoja
- **THEN** la respuesta tiene status 404

### Requirement: Endpoints de escritura de hojas

La API SHALL exponer endpoints de escritura para crear y actualizar hojas de personaje, protegidos por la misma autenticacion HTTP Basic que el resto de la API. La API MUST exponer `POST /character-sheets` que recibe un `user_id` (string, el `id` de un usuario dado de alta) y una `sheet`, valida la `sheet` contra el schema estricto de hoja, y crea el documento en `character_sheets` (con ese `user_id`) con su `updated_at`. La creacion MUST NOT rechazarse por cardinalidad: un usuario puede tener varias hojas. La API MUST exponer `PUT /character-sheets/{slug}` que recibe una `sheet`, resuelve el slug a la hoja existente, valida la `sheet` contra el schema y actualiza el documento. Ambos endpoints MUST rechazar con un error de validacion (status 422) cualquier `sheet` que no cumpla el schema, sin persistir nada. `POST /character-sheets` MUST rechazar con status 422 un `user_id` que no corresponda a ningun usuario dado de alta.

#### Scenario: Crear hoja valida
- **WHEN** se hace `POST /character-sheets` con credenciales validas, el `user_id` de un usuario dado de alta y una `sheet` que cumple el schema
- **THEN** la respuesta tiene status 200/201, se crea el documento en `character_sheets` con `updated_at`, y queda accesible por su slug

#### Scenario: Crear una segunda hoja para el mismo usuario
- **WHEN** se hace `POST /character-sheets` con credenciales validas y el `user_id` de un usuario que ya tiene una o mas hojas
- **THEN** la respuesta tiene status 200/201 igual que cualquier otra creacion, y se crea una hoja adicional independiente

#### Scenario: Crear hoja con user_id inexistente
- **WHEN** se hace `POST /character-sheets` con credenciales validas y un `user_id` que no corresponde a ningun usuario dado de alta
- **THEN** la respuesta tiene status 422 y no se crea ninguna hoja

#### Scenario: Crear hoja con sheet invalida
- **WHEN** se hace `POST /character-sheets` con credenciales validas y una `sheet` que no cumple el schema (campo desconocido, tipo invalido o valor fuera de rango)
- **THEN** la respuesta tiene status 422 con el error de validacion y nada se persiste

#### Scenario: Actualizar hoja existente
- **WHEN** se hace `PUT /character-sheets/{slug}` con credenciales validas para un slug existente con una `sheet` valida
- **THEN** la respuesta tiene status 200, el documento de esa hoja se actualiza con la `sheet` recibida y un nuevo `updated_at`

#### Scenario: Actualizar hoja de un slug inexistente
- **WHEN** se hace `PUT /character-sheets/{slug}` con credenciales validas para un slug que no corresponde a ninguna hoja
- **THEN** la respuesta tiene status 404 y nada se persiste

#### Scenario: Actualizar con sheet invalida
- **WHEN** se hace `PUT /character-sheets/{slug}` con credenciales validas y una `sheet` que no cumple el schema
- **THEN** la respuesta tiene status 422 con el error de validacion y la hoja existente no se modifica

### Requirement: Endpoints de gestion de jugadores

La API SHALL exponer endpoints para listar y dar de alta usuarios (whitelist `players`), protegidos por la misma autenticacion HTTP Basic que el resto de la API. La API MUST exponer `GET /players` que devuelve los usuarios con su `id` (identidad interna, usada para asociarle hojas), su `player_id` y su `nombre`. La API MUST exponer `POST /players` que recibe `player_id` (string) y `nombre`, y da de alta el usuario en `players`. El alta MUST rechazar con conflicto (status 409) si el `player_id` ya existe.

#### Scenario: Listar jugadores
- **WHEN** se hace `GET /players` con credenciales validas
- **THEN** la respuesta tiene status 200 con la lista de usuarios, cada uno con `id`, `player_id` y `nombre`

#### Scenario: Alta de jugador nuevo
- **WHEN** se hace `POST /players` con credenciales validas, un `player_id` que no existe y un `nombre`
- **THEN** la respuesta tiene status 200/201 y el usuario queda dado de alta en `players`, con un `id` asignado

#### Scenario: Alta de jugador con id de jugador repetido
- **WHEN** se hace `POST /players` con credenciales validas y un `player_id` que ya esta dado de alta
- **THEN** la respuesta indica conflicto (status 409) y no se duplica el jugador

### Requirement: Documentacion OpenAPI de los endpoints de escritura

La documentacion OpenAPI en `/docs` SHALL reflejar los endpoints de escritura de hojas (`POST /character-sheets`, `PUT /character-sheets/{slug}`) y de jugadores (`GET /players`, `POST /players`), ademas de los endpoints ya existentes.

#### Scenario: Acceso a la documentacion con los endpoints de escritura
- **WHEN** se accede a `GET /docs`
- **THEN** la UI de documentacion incluye `POST /character-sheets`, `PUT /character-sheets/{slug}`, `GET /players` y `POST /players`

