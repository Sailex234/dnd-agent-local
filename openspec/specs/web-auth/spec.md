# web-auth

## Purpose
Autenticacion minima con credencial compartida para la web: login, sesion con cookie de expiracion deslizante de 30 dias, proteccion de todas las paginas, y adjunto de la credencial en las llamadas a la API.

## Requirements
### Requirement: Login con credencial compartida
La web SHALL exponer una pagina de login (`/login`) con campos de usuario y contrasena. La web MUST validar esas credenciales, server-side, contra un unico usuario y contrasena compartidos configurados por variable de entorno (`AUTH_USER`, `AUTH_PASSWORD`). No SHALL existir alta, baja ni gestion de multiples cuentas: es una unica credencial compartida entre todos los jugadores.

#### Scenario: Login con credenciales validas
- **WHEN** se envia el formulario de `/login` con el usuario y la contrasena configurados
- **THEN** la validacion server-side aprueba las credenciales y se establece una sesion (ver Requirement de cookie de sesion)

#### Scenario: Login con credenciales invalidas
- **WHEN** se envia el formulario de `/login` con un usuario o contrasena que no coincide con `AUTH_USER`/`AUTH_PASSWORD`
- **THEN** no se establece ninguna sesion y la pagina de login muestra un error, sin revelar cual de los dos campos es incorrecto

### Requirement: Cookie de sesion con expiracion deslizante de 30 dias
Al loguearse con exito, la web SHALL establecer una cookie de sesion (`dnd_auth`) con las credenciales validadas, con una duracion (`Max-Age`) de 30 dias. En cada request autenticado exitoso a una pagina protegida, la web MUST reemitir la cookie reseteando su `Max-Age` a 30 dias, de forma que la sesion se mantenga activa mientras haya al menos una visita cada 30 dias ("expiracion deslizante"). La cookie SHALL marcarse `Secure` y `SameSite=Lax`.

#### Scenario: Visita dentro de la ventana de 30 dias
- **WHEN** un usuario con sesion valida visita la web antes de que pasen 30 dias desde su ultima visita
- **THEN** no se le pide login de nuevo y la cookie de sesion se reemite con el `Max-Age` reseteado a 30 dias

#### Scenario: Inactividad de 30 dias
- **WHEN** pasan 30 dias sin que el navegador visite la web (la cookie expira y el navegador la descarta)
- **THEN** la siguiente visita no tiene cookie de sesion valida y se trata como no autenticada

### Requirement: Proteccion de todas las paginas de la web
La web SHALL proteger todas sus paginas (excepto `/login`) exigiendo una cookie de sesion valida. Si la cookie falta o no corresponde a las credenciales configuradas, la web MUST redirigir a `/login`.

#### Scenario: Acceso sin sesion
- **WHEN** se solicita cualquier pagina de la web (por ejemplo la lista de personajes o una hoja) sin cookie de sesion valida
- **THEN** la web redirige a `/login`

#### Scenario: Acceso con sesion valida
- **WHEN** se solicita cualquier pagina de la web con una cookie de sesion valida
- **THEN** la web sirve la pagina solicitada normalmente

### Requirement: La web adjunta la credencial en cada llamada a la API
Las llamadas que la web hace a la API (lectura y escritura de hojas y jugadores) SHALL incluir la credencial de la sesion activa como header `Authorization: Basic <usuario:contrasena en base64>`, de modo que la API pueda autenticar cada request sin que el usuario tenga que loguearse por separado en la API.

#### Scenario: Llamada a la API desde una sesion valida
- **WHEN** la web hace una peticion a la API (por ejemplo `GET /character-sheets` o `POST /players`) estando logueada
- **THEN** la peticion incluye el header `Authorization: Basic` con la credencial de la sesion activa

### Requirement: Logout
La web SHALL exponer una forma de cerrar sesion que elimine la cookie de sesion del navegador, de modo que la siguiente visita requiera loguearse de nuevo.

#### Scenario: Cerrar sesion
- **WHEN** el usuario cierra sesion desde la web
- **THEN** la cookie de sesion se elimina y la siguiente visita a una pagina protegida redirige a `/login`
