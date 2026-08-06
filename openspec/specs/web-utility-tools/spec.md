# web-utility-tools

## Purpose
TBD - created by syncing change web-players-nav-tools. Update Purpose after archive.

## Requirements

### Requirement: Drawer de herramientas accesible desde cualquier pagina

El sistema SHALL ofrecer un drawer de herramientas anclado al costado izquierdo de la pantalla, accesible desde un boton en la barra de navegacion superior en cualquier pagina protegida de la web. El drawer MUST poder abrirse y cerrarse sin recargar la pagina ni perder el estado de la pagina subyacente, y MUST ser cerrable tanto con un control explicito como con la tecla Escape. La apertura y el cierre MUST animarse con una transicion suave (deslizamiento desde la izquierda), respetando la preferencia `prefers-reduced-motion` del sistema.

#### Scenario: Abrir el drawer desde cualquier pagina

- **WHEN** un usuario esta en cualquier pagina protegida de la web y activa el boton de herramientas de la nav superior
- **THEN** el drawer de herramientas se despliega desde la izquierda con una animacion, sin recargar la pagina

#### Scenario: Animacion respeta reduced motion

- **WHEN** el sistema del usuario tiene activada la preferencia de movimiento reducido
- **THEN** el drawer se abre y cierra sin la transicion animada

#### Scenario: Cerrar el drawer con Escape

- **WHEN** el drawer de herramientas esta abierto y el usuario presiona Escape
- **THEN** el drawer se cierra y el foco vuelve al boton que lo abrio

### Requirement: Calculadora de conversion de unidades de uso libre

El drawer de herramientas SHALL incluir una calculadora de conversion de unidades con dos secciones independientes: peso (kilogramos <-> libras) y distancia (metros <-> pies). Cada seccion MUST permitir tipear un valor en cualquiera de sus dos unidades y recalcular la otra en tiempo real, sin requerir una hoja de personaje cargada ni depender de ningun estado de sesion previo. Las conversiones MUST usar las mismas constantes estandar de D&D que ya usa la vista de hoja (1 kg = 2 lb; 1,5 m = 5 pies, es decir metros por 10/3 para pies), reutilizando las funciones de `lib/derive`.

#### Scenario: Convertir peso de kg a libras

- **WHEN** el usuario escribe un valor en el campo de kilogramos de la calculadora
- **THEN** el campo de libras se actualiza mostrando ese valor multiplicado por 2

#### Scenario: Convertir distancia de metros a pies

- **WHEN** el usuario escribe un valor en el campo de metros de la calculadora
- **THEN** el campo de pies se actualiza mostrando ese valor multiplicado por 10/3

#### Scenario: Convertir en el sentido inverso

- **WHEN** el usuario escribe un valor en el campo de libras o en el campo de pies
- **THEN** el campo de kilogramos o de metros correspondiente se actualiza con el valor convertido en sentido inverso

#### Scenario: Uso sin hoja cargada

- **WHEN** el usuario abre el drawer de herramientas desde el listado de jugadores (sin haber entrado a ninguna hoja)
- **THEN** la calculadora de unidades funciona igual, sin errores ni dependencia de datos de una hoja
