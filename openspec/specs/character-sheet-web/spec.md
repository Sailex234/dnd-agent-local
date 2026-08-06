# character-sheet-web Specification

## Purpose
TBD - created by archiving change character-sheets-web. Update Purpose after archive.
## Requirements
### Requirement: Frontend Next.js que consume la API publica de hojas
El sistema SHALL incluir una aplicacion frontend en Next.js que consuma la API publica de hojas (`GET /character-sheets` y `GET /character-sheets/{slug}`) y de jugadores (`GET /players`) sin requerir login directo contra la API (la web gestiona su propia sesion, ver `web-auth`). La app MUST obtener la URL base de la API por configuracion (variable de entorno), no hardcodeada. La app MUST presentar, en la pagina principal, un listado de jugadores (a partir de `GET /players`) donde cada jugador agrupa sus propias hojas (a partir de `GET /character-sheets`, agrupadas por el jugador dueno de cada una), con un acceso directo a la vista de detalle de cada hoja por slug. El deploy/hosting de la app queda fuera del alcance de este cambio.

#### Scenario: Jugadores con sus hojas agrupadas en el indice
- **WHEN** un visitante abre la pagina principal de la web
- **THEN** la web lista los jugadores obtenidos de `GET /players`, y bajo cada jugador muestra sus hojas (obtenidas de `GET /character-sheets`, filtradas por el jugador dueno), cada una con un acceso directo a su vista de detalle por slug

#### Scenario: Jugador sin hojas
- **WHEN** un jugador todavia no tiene ninguna hoja cargada
- **THEN** la web muestra, bajo ese jugador, un estado vacio con un acceso directo para crear una hoja para el

#### Scenario: Personaje inexistente
- **WHEN** un visitante navega a la vista de un slug que la API responde con 404
- **THEN** la web muestra un estado de "no encontrado" en vez de romper

### Requirement: Render de la hoja con layout estilo Manual del Jugador 2024
El sistema SHALL renderizar la hoja en un layout visual fiel a la hoja de personaje del Manual del Jugador 2024 (paginas 36-37), en HTML, con las caracteristicas dispuestas en dos columnas (fisicas y mentales) y, dentro de cada caracteristica, su tirada de salvacion y sus habilidades asociadas. La vista MUST mostrar, a partir de los valores base de la hoja: identidad (nombre, especie, clase y subclase, trasfondo, alineamiento y tamaño), con el nivel y los puntos de experiencia destacados de forma prominente (al estilo del circulo de nivel de la hoja del manual); las seis caracteristicas con su modificador derivado; las tiradas de salvacion (marcando competencia y el total derivado); las habilidades (marcando si es competente y el total derivado; la pericia de competencia x2 no se modela como estado de la habilidad, se carga como un rasgo); el bono de competencia; los datos de combate (PG max/actuales/temporales, dados de golpe y gastados, CA, escudo, iniciativa, velocidad) y la percepcion pasiva derivada; las salvaciones contra muerte e inspiracion heroica; los ataques; los rasgos; las dotes; el equipo (objetos con su peso, monedas y sintonizacion), con el peso total derivado y la capacidad de carga maxima derivada de la Fuerza y el tamaño segun el manual; el bloque de conjuros (caracteristica de lanzamiento, CD, bono de ataque, espacios con total y gastados, y la lista de trucos y conjuros con sus marcas); y los datos descriptivos (aspecto, historia y notas). Los valores derivados (modificadores de caracteristica, totales de salvaciones y habilidades, percepcion pasiva) MUST calcularse en el cliente a partir de los valores base, ya que la API no los persiste.

#### Scenario: Render de una hoja completa
- **WHEN** la web carga la hoja de un personaje con todos sus bloques
- **THEN** muestra identidad, caracteristicas en dos columnas con su salvacion y habilidades, combate, ataques, rasgos, dotes, equipo y conjuros en un layout estilo hoja del manual

#### Scenario: Modificadores derivados
- **WHEN** una caracteristica tiene un valor base (por ejemplo fuerza 16)
- **THEN** la web muestra su modificador derivado correcto (por ejemplo +3) sin que la API lo haya enviado

#### Scenario: Habilidad competente con su total
- **WHEN** un personaje es competente en una habilidad
- **THEN** la web marca esa habilidad como competente y muestra su total derivado (modificador de la caracteristica mas el bono de competencia), sin un estado de experto/pericia

### Requirement: Render completo de todas las secciones aun vacias
El sistema SHALL renderizar todas las secciones de la hoja siempre, independientemente de la clase del personaje. Cuando un personaje no usa una seccion por su clase (por ejemplo, un no-lanzador sin conjuros, o un personaje sin ataques, sin dotes o sin sintonizacion), la web MUST renderizar igualmente esa seccion, mostrandola vacia o con un placeholder, en vez de ocultarla.

#### Scenario: No-lanzador muestra el bloque de conjuros vacio
- **WHEN** la web carga la hoja de un personaje con `conjuros` nulo
- **THEN** la seccion de conjuros se renderiza igual, vacia o con un placeholder, sin ocultarse

#### Scenario: Seccion sin datos
- **WHEN** una seccion de la hoja (ataques, dotes, sintonizacion, aspecto, historia) no tiene datos
- **THEN** la web muestra la seccion con un estado vacio en lugar de omitirla

### Requirement: Formulario web para crear una hoja completa

El sistema SHALL incluir en la web un formulario para crear una hoja de personaje nueva. El formulario MUST permitir elegir el usuario al que se asocia la hoja a partir del listado de jugadores (que incluye su `id` interno), y MUST permitir cargar la hoja completa segun el schema del Manual del Jugador 2024: identidad, las seis caracteristicas, competencias, combate, ataques, rasgos, dotes, equipo (objetos, monedas, sintonizacion), conjuros (opcional) y datos descriptivos. El formulario MUST permitir crear una hoja para un usuario que ya tiene una o mas hojas, sin tratarlo como error. Las secciones de lista (ataques, rasgos, dotes, objetos, conjuros) MUST permitir agregar y quitar filas. Al enviar, la web MUST llamar al endpoint de creacion (con el `id` del usuario elegido) y MUST mostrar el resultado: en exito, llevar a la hoja creada; en error de validacion del schema, mostrar el error sin perder lo cargado.

#### Scenario: Crear una hoja desde el formulario
- **WHEN** el usuario completa el formulario con un jugador y una hoja valida y envia
- **THEN** la web crea la hoja via la API y muestra la hoja resultante

#### Scenario: Crear una segunda hoja para el mismo jugador
- **WHEN** el usuario elige en el formulario un jugador que ya tiene una hoja y completa una hoja valida para un personaje nuevo
- **THEN** la web crea la hoja adicional sin mostrar ningun error de "ya tiene hoja"

#### Scenario: Error de validacion al crear
- **WHEN** el usuario envia una hoja que la API rechaza por no cumplir el schema
- **THEN** la web muestra el error de validacion y conserva los datos cargados en el formulario

### Requirement: Formulario web para editar una hoja existente

El sistema SHALL incluir en la web un formulario para editar la hoja completa de un personaje existente. El formulario MUST precargarse con los valores actuales de la hoja (obtenidos por su slug) y MUST permitir modificar todas las secciones de la hoja, incluyendo agregar/quitar filas en las listas. Al enviar, la web MUST llamar al endpoint de actualizacion por slug y MUST mostrar el resultado (exito o error de validacion).

#### Scenario: Editar una hoja existente
- **WHEN** el usuario abre el formulario de edicion de un personaje, cambia valores validos y envia
- **THEN** la web actualiza la hoja via la API y refleja los cambios en la vista de la hoja

#### Scenario: Precarga de la hoja en el formulario
- **WHEN** el usuario abre el formulario de edicion de un personaje existente
- **THEN** los campos del formulario muestran los valores actuales de la hoja

### Requirement: Pantalla web para cargar un jugador

El sistema SHALL incluir en la web una pantalla para dar de alta un jugador, pidiendo su id de jugador y su nombre. Al enviar, la web MUST llamar al endpoint de alta de jugador y MUST mostrar el resultado: en exito, dejar al jugador disponible para asociarle una hoja; si el id de jugador ya existe, mostrar el conflicto.

#### Scenario: Cargar un jugador nuevo
- **WHEN** el usuario ingresa un id de jugador no usado y un nombre y envia
- **THEN** la web da de alta el jugador via la API y queda disponible en el selector de creacion de hoja

#### Scenario: Cargar un jugador con id de jugador repetido
- **WHEN** el usuario intenta cargar un jugador con un id de jugador ya existente
- **THEN** la web muestra el conflicto y no da de alta un duplicado

### Requirement: UX de formularios y feedback de guardado

Los formularios de la web (crear hoja, editar hoja, cargar jugador) SHALL seguir buenas practicas de UX: cada campo MUST tener su `label` asociado, la validacion de campos MUST ocurrir al menos al perder el foco (no solo al enviar), y el envio MUST dar feedback claro (estado de carga durante la operacion y luego exito o error). Los controles interactivos MUST ser accesibles por teclado con foco visible.

#### Scenario: Feedback durante el envio
- **WHEN** el usuario envia un formulario
- **THEN** la web muestra un estado de carga y, al terminar, un estado de exito o de error

#### Scenario: Validacion al perder el foco
- **WHEN** el usuario completa un campo con un valor invalido y sale del campo
- **THEN** la web señala el error en ese campo antes de enviar el formulario

### Requirement: UI de la web refinada con estetica del Manual del Jugador 2024

El sistema SHALL presentar la web (indice de jugadores con sus hojas, vista de hoja y formularios) con una UI refinada que mantiene la estetica tipo Manual del Jugador 2024 (papel/tinta), con tipografia editorial consistente y suficiente contraste de texto. Una barra de navegacion superior MUST estar presente en todas las paginas protegidas (ver Requirement "Barra de navegacion superior"). La creacion de una hoja MUST hacerse unicamente desde la tarjeta de un jugador en el indice (`/`), no desde la nav superior. La estetica MUST ser consistente entre las paginas de lectura y las de formulario.

#### Scenario: Crear hoja solo desde la tarjeta del jugador en el indice
- **WHEN** un usuario quiere crear una hoja de personaje
- **THEN** lo hace desde el boton "Crear hoja" de la tarjeta de un jugador en `/`, con ese jugador preseleccionado; la nav superior no ofrece un acceso separado para crear hoja

#### Scenario: Consistencia visual entre lectura y formularios
- **WHEN** el usuario navega entre la vista de una hoja y un formulario de edicion
- **THEN** ambas paginas comparten la misma estetica papel/tinta y tipografia

### Requirement: Barra de navegacion superior

El sistema SHALL presentar una barra de navegacion superior de ancho completo (edge-to-edge, sin el margen del contenedor centrado de la pagina ni espacio residual por encima), en todas las paginas protegidas de la web (excepto `/login`), con un acceso a Inicio (indice de jugadores), un acceso a "Cargar jugador", un boton para abrir el drawer de herramientas utilitarias (ver capability `web-utility-tools`) y un acceso para cerrar sesion. La nav superior MUST mantenerse visible de forma consistente al navegar entre el indice y la vista de detalle de una hoja.

#### Scenario: Nav superior visible en toda pagina protegida
- **WHEN** un usuario navega a cualquier pagina protegida de la web
- **THEN** ve la barra de navegacion superior con los accesos a Inicio, Cargar jugador, el boton de herramientas y cerrar sesion, ocupando todo el ancho de la ventana sin espacio por encima

#### Scenario: Nav superior ausente en login
- **WHEN** un visitante sin sesion es redirigido a `/login`
- **THEN** la pagina de login no muestra la barra de navegacion superior

#### Scenario: Volver al inicio desde cualquier pagina
- **WHEN** un usuario activa el acceso "Inicio" de la nav superior desde la vista de una hoja
- **THEN** la web lo lleva al indice de jugadores

### Requirement: Exportar la hoja a PDF desde la vista de detalle

El sistema SHALL ofrecer en la vista de detalle de un personaje (`/[slug]`) una accion para exportar la hoja a un archivo PDF. Al activarla, la web MUST generar el PDF en el cliente y descargarlo con un nombre derivado del personaje (por ejemplo `<slug>.pdf`), sin depender del dialogo de impresion del navegador y sin llamadas adicionales a la API (se usa la hoja ya cargada). El texto del PDF MUST ser texto real seleccionable (no una imagen rasterizada), de modo que la informacion se pueda copiar y parsear desde el PDF. El PDF MUST reproducir el layout de la hoja del Manual del Jugador 2024 con la misma disposicion de bloques que la vista web. Los controles de edicion de la vista (botones de editar, barra de guardado) MUST quedar fuera del PDF.

#### Scenario: Descargar el PDF de la hoja

- **WHEN** el usuario abre la vista de un personaje y activa "Exportar PDF"
- **THEN** la web genera en el cliente y descarga un archivo PDF con la hoja del personaje, sin abrir el dialogo de impresion del navegador

#### Scenario: Texto seleccionable en el PDF

- **WHEN** el usuario abre el PDF descargado en un lector de PDF
- **THEN** puede seleccionar y copiar el texto de la hoja (nombre, caracteristicas, combate, equipo, etc.), porque el contenido es texto real y no una imagen

#### Scenario: Feedback durante la generacion

- **WHEN** el usuario activa "Exportar PDF" y la generacion esta en curso
- **THEN** la web muestra un estado de carga en el control y lo rehabilita al terminar la descarga

### Requirement: Contenido y derivados del PDF identicos a la vista web

El PDF exportado SHALL incluir las mismas secciones y valores que la vista web de la hoja: identidad (nombre, especie, clase y subclase, trasfondo, alineamiento, tamaño, nivel y PX), las seis caracteristicas con su modificador, las tiradas de salvacion y habilidades con su marca de competencia y total, el bono de competencia, los datos de combate y la percepcion pasiva, las salvaciones contra muerte e inspiracion heroica, los ataques, los rasgos, las dotes, el equipo (objetos con peso, monedas y sintonizacion) con el peso total y la capacidad de carga, el bloque de conjuros y los datos descriptivos (aspecto, historia, notas). Los valores derivados (modificadores, totales de salvaciones y habilidades, percepcion pasiva, peso total, capacidad de carga) MUST calcularse con las mismas funciones de `lib/derive` que usa la vista web, para que el PDF y la pantalla coincidan. Las secciones sin datos MUST renderizarse igualmente (vacias o con placeholder), igual que en la vista web.

#### Scenario: Derivados coinciden con la pantalla

- **WHEN** la vista web muestra un modificador o total derivado (por ejemplo fuerza 16 con +3, o una salvacion competente con su total)
- **THEN** el PDF exportado muestra el mismo valor derivado para ese campo

#### Scenario: Seccion vacia en el PDF

- **WHEN** un personaje no tiene datos en una seccion (por ejemplo `conjuros` nulo o sin ataques)
- **THEN** el PDF renderiza esa seccion igualmente, vacia o con un placeholder, en vez de omitirla

### Requirement: Selector de unidades visual en la vista de hoja

El sistema SHALL ofrecer en la vista de detalle de un personaje (`/[slug]`) un selector de unidades que alterna entre el sistema metrico (kg y metros, el actual) y el sistema imperial (libras y pies). El selector MUST afectar unicamente la presentacion: los valores de peso (peso de cada objeto, peso total y capacidad de carga) y de velocidad MUST mostrarse convertidos a la unidad elegida, mientras la hoja se sigue persistiendo siempre en kg y metros. El cambio de unidad MUST NOT disparar ninguna llamada de guardado ni modificar el valor almacenado en la hoja. La unidad por defecto MUST ser el sistema metrico, y la preferencia elegida MUST recordarse entre recargas de la pagina en el navegador.

#### Scenario: Cambiar a unidades imperiales

- **WHEN** el usuario, en la vista de una hoja, selecciona el sistema imperial
- **THEN** el peso de los objetos, el peso total, la capacidad de carga y la velocidad se muestran en libras y pies, sin que se guarde ni cambie el valor almacenado de la hoja

#### Scenario: Persistencia de la preferencia

- **WHEN** el usuario elige una unidad y luego recarga la pagina
- **THEN** la vista vuelve a mostrarse con la unidad que habia elegido

#### Scenario: Metrico por defecto

- **WHEN** el usuario abre la vista de una hoja sin haber elegido una unidad antes
- **THEN** los valores se muestran en kg y metros

### Requirement: Conversiones estandar de D&D para peso y velocidad

El sistema SHALL convertir peso y velocidad usando las conversiones estandar de D&D (no las conversiones fisicas reales): 1 kg equivale a 2 libras, y 1,5 metros equivalen a 5 pies (es decir, los metros se multiplican por 10/3 para obtener pies). Las funciones de conversion y de formato de unidad MUST vivir en `lib/derive` y MUST usarse tanto en la vista web como en el PDF, para que ambos coincidan.

#### Scenario: Conversion de peso

- **WHEN** un objeto pesa 3 kg y la unidad seleccionada es imperial
- **THEN** la vista muestra 6 libras para ese objeto

#### Scenario: Conversion de velocidad

- **WHEN** la velocidad de la hoja es 9 metros y la unidad seleccionada es imperial
- **THEN** la vista muestra 30 pies de velocidad

### Requirement: PDF exportado respeta la unidad seleccionada

El PDF exportado desde la vista de detalle SHALL usar la unidad seleccionada en la pagina al momento de exportar: si la vista esta en imperial, el PDF MUST mostrar peso en libras y velocidad en pies; si esta en metrico, el PDF MUST mostrar kg y metros. Las conversiones del PDF MUST calcularse con las mismas funciones de `lib/derive` que usa la vista web, de modo que el PDF coincida con lo que se ve en pantalla.

#### Scenario: PDF en unidades imperiales

- **WHEN** el usuario tiene la vista en imperial y exporta el PDF
- **THEN** el PDF muestra el peso en libras y la velocidad en pies, con los mismos valores que la vista web

#### Scenario: PDF en unidades metricas

- **WHEN** el usuario tiene la vista en metrico y exporta el PDF
- **THEN** el PDF muestra el peso en kg y la velocidad en metros

