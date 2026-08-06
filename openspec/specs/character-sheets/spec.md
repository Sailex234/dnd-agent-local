# character-sheets

## Purpose
Mantener la hoja de personaje de cada jugador en MongoDB con un schema estricto y tipado (terminologia del Manual del Jugador 2024), permitir que el agente la lea y proponga cambios derivados de las reglas del corpus como sugerencia (el jugador aplica el cambio a mano en la web), acotando cada operacion a la hoja del propio jugador.
## Requirements
### Requirement: Hoja de personaje por jugador en MongoDB con schema estricto
El sistema SHALL persistir la hoja de personaje de cada personaje en una coleccion MongoDB `character_sheets`, con un documento por hoja. Cada documento MUST contener el `user_id` del usuario dueño (referencia al `_id` del documento en `players`, como string), un nombre, el instante de ultima actualizacion (`updated_at`) y la hoja en si (`sheet`). Un mismo usuario MAY tener cero, una o varias hojas (varios personajes), independientemente de su rol (jugador o GM); el sistema MUST NOT limitar la cantidad de hojas por usuario. El `sheet` MUST cumplir un schema estricto, fijo y tipado (estructura cerrada que rechaza campos desconocidos), con la terminologia del Manual del Jugador 2024 en espanol, mapeando la hoja oficial completa (paginas 36-37), cubriendo al menos:
- identidad: especie, clase, subclase, nivel, trasfondo, alineamiento, puntos de experiencia (`px`) y tamaño;
- las seis puntuaciones de caracteristica;
- competencias: bono de competencia, salvaciones, habilidades, armaduras, armas, herramientas, idiomas;
- combate: puntos de golpe maximos/actuales/temporales, dados de golpe, clase de armadura, escudo, iniciativa, velocidad;
- estado de sesion: dados de golpe gastados, salvaciones contra muerte (exitos y fallos) e inspiracion heroica;
- ataques: lista de armas/trucos de daño con nombre, bonificador de ataque o CD, daño y tipo, y notas;
- rasgos, dotes;
- equipo: objetos (con peso por unidad), monedas y sintonizacion con objetos magicos;
- conjuros (opcional, nulo para no-lanzadores): caracteristica de lanzamiento, CD de salvacion, bonificador de ataque, espacios de conjuro por nivel con total y gastados, y la lista estructurada de trucos y conjuros (nivel, nombre, tiempo de lanzamiento, alcance, marcas de concentracion/ritual/material, notas y si esta preparado);
- datos descriptivos: aspecto, historia y personalidad, y notas.

El schema SHALL guardar los valores base (puntuaciones, competencias, nivel) y derivar los valores que son funcion pura de ellos (modificador de caracteristica, total de salvaciones y habilidades, percepcion pasiva), en lugar de duplicarlos. Los campos agregados MUST ser opcionales o tener valor por defecto, de modo que un alta minima siga validando. El alta de una hoja puede hacerse desde la web (formulario que valida contra el mismo schema antes de persistir) o a mano en Mongo; en ambos casos la `sheet` MUST validar contra el schema estricto al persistir.

#### Scenario: Lectura de una hoja existente
- **WHEN** existe un documento en `character_sheets` con un `_id` o slug dado y se pide su hoja
- **THEN** se obtiene el `sheet` de esa hoja conforme al schema

#### Scenario: Usuario sin ninguna hoja
- **WHEN** no existe ningun documento en `character_sheets` para el `user_id` de un usuario y se pide su hoja
- **THEN** el sistema indica que ese usuario no tiene hoja, sin crear una vacia automaticamente

#### Scenario: Usuario con varias hojas
- **WHEN** un usuario tiene mas de un documento en `character_sheets` (varios personajes)
- **THEN** el sistema SHALL tratarlos como hojas independientes, cada una con su propio `sheet`, `nombre` y `updated_at`, todas asociadas al mismo `user_id`

#### Scenario: Cardinalidad independiente del rol
- **WHEN** un usuario con rol GM o un usuario con rol jugador crea una segunda hoja
- **THEN** el sistema la crea sin restriccion de cardinalidad, igual que para cualquier otro usuario

#### Scenario: Hoja propuesta o cargada que no cumple el schema
- **WHEN** se intenta persistir una hoja (propuesta del agente o alta/edicion desde la web) que no cumple el schema (campo desconocido, tipo invalido o valor fuera de rango)
- **THEN** la operacion se rechaza con el error de validacion y nada se persiste

#### Scenario: Hoja minima con campos nuevos por defecto
- **WHEN** se da de alta una hoja que no especifica los campos nuevos (px, tamaño, escudo, ataques, sintonizacion, aspecto, historia, estado de sesion)
- **THEN** la hoja valida contra el schema y esos campos quedan con su valor por defecto (cero, vacio, false o nulo segun corresponda)

#### Scenario: No-lanzador sin conjuros
- **WHEN** una hoja corresponde a un personaje sin aptitud magica
- **THEN** el campo `conjuros` es nulo y la hoja valida igual contra el schema

### Requirement: Propuesta de cambio como sugerencia, sin escritura automatica
El sistema SHALL registrar toda actualizacion propuesta por el agente en estado pendiente (persistida en la coleccion `pending_sheet_changes`, referenciando la hoja concreta por `sheet_id`, como mucho una pendiente por hoja, reemplazando una anterior de esa misma hoja si la hubiera) y NO MUST escribirla en `character_sheets` durante la corrida del agente. Un usuario con varias hojas MAY tener varias propuestas pendientes en simultaneo, una por hoja, sin que proponer un cambio en una hoja afecte la pendiente de otra hoja del mismo usuario. La propuesta MUST presentarse al jugador como un mensaje con el resumen del cambio. La escritura sobre `character_sheets` solo ocurre si el jugador aplica el cambio el mismo, a mano, editando su hoja completa desde la web (Requirement de `character-sheet-web`).

#### Scenario: Propuesta no se aplica sola
- **WHEN** el agente propone una actualizacion de una hoja en respuesta a un mensaje del jugador
- **THEN** se registra una propuesta pendiente para esa hoja, se le envia al jugador un mensaje con el resumen, y `character_sheets` no se modifica

#### Scenario: Propuestas independientes en hojas distintas del mismo usuario
- **WHEN** un usuario con dos hojas tiene una propuesta pendiente en la primera y el agente le propone un cambio en la segunda
- **THEN** ambas propuestas quedan pendientes de forma independiente, cada una referenciando su propia hoja

### Requirement: Derivacion de los cambios desde las reglas del corpus
El sistema SHALL instruir al agente (via system prompt) a derivar los cambios de la hoja a partir de las reglas leidas del corpus, no de conocimiento externo. Ante un pedido mecanico (por ejemplo "subi mi barbaro de nivel 3 a 4"), el agente MUST navegar las reglas pertinentes del corpus y la hoja actual del jugador antes de proponer. El agente MUST expresar la propuesta como un patch parcial (solo los campos que cambian), no como la hoja completa, y el resumen presentado al jugador MUST reflejar que el cambio sale de esas reglas.

#### Scenario: Subida de nivel derivada de reglas
- **WHEN** un jugador pide subir de nivel a su personaje
- **THEN** el agente consulta las reglas del corpus y la hoja actual, y propone una actualizacion (como patch parcial) coherente con esas reglas, describiendola antes de aplicarla

### Requirement: Propuesta de cambios de hoja como patch parcial fusionado en el servidor
El sistema SHALL aceptar la propuesta de cambios del agente como un patch parcial que contiene SOLO los campos a modificar, no la hoja completa, dirigido a una hoja concreta del usuario autor (identificada por nombre cuando el autor tiene mas de una hoja propia). El sistema MUST fusionar el patch sobre la hoja actual de esa hoja con semantica de merge: las secciones anidadas (por ejemplo identidad, combate, competencia, equipo, conjuros y conjuros.espacios) se fusionan por clave; las listas (por ejemplo ataques, rasgos, dotes, objetos de equipo, lista de conjuros y las listas de competencia) se reemplazan enteras; un valor `null` explicito setea el campo en `null` (no borra la clave). El sistema MUST validar la hoja RESULTANTE COMPLETA contra el schema estricto y, si valida, registrar la propuesta pendiente (referenciando esa hoja por `sheet_id`) con esa hoja completa, como referencia para que el jugador la aplique a mano en la web. Si la hoja resultante no cumple el schema, la propuesta MUST rechazarse con el error de validacion por campo, sin registrar nada. Si el usuario autor no tiene ninguna hoja, o tiene mas de una y no especifico cual, el sistema MUST indicarlo (pidiendo que se especifique el nombre cuando corresponda) y no registrar propuesta.

#### Scenario: Patch fusionado sobre la hoja actual
- **WHEN** el agente propone un cambio pasando solo los campos modificados (por ejemplo bajar los PG actuales) para una hoja identificable del autor
- **THEN** el sistema fusiona ese patch sobre la hoja actual de esa hoja, deja intactos los campos no incluidos, y registra la propuesta pendiente (referenciando esa hoja) con la hoja completa resultante

#### Scenario: Lista reemplazada entera
- **WHEN** el patch incluye una lista (por ejemplo las herramientas de competencia o los conjuros)
- **THEN** esa lista reemplaza por completo a la anterior en la hoja resultante, en lugar de fusionarse elemento por elemento

#### Scenario: Patch cuya hoja resultante no cumple el schema
- **WHEN** el patch, una vez fusionado, produce una hoja que no cumple el schema (campo desconocido, tipo invalido o valor fuera de rango)
- **THEN** la propuesta se rechaza con el error de validacion por campo y nada se registra como pendiente ni se escribe en `character_sheets`

#### Scenario: Patch sobre un usuario sin ninguna hoja
- **WHEN** el agente intenta proponer un patch para un usuario que no tiene ninguna hoja cargada
- **THEN** el sistema indica que no hay hoja sobre la cual aplicar el cambio y no registra ninguna propuesta

#### Scenario: Patch sobre un usuario con varias hojas sin especificar cual
- **WHEN** el agente intenta proponer un patch para un usuario con mas de una hoja sin indicar el nombre del personaje
- **THEN** el sistema indica que hay que especificar cual de sus personajes, listando sus nombres, y no registra ninguna propuesta

### Requirement: Lectura de cualquier hoja por nombre y listado de personajes
El sistema SHALL permitir que el agente lea la hoja de cualquier personaje, no solo los del autor del mensaje. El agente MUST disponer de una tool para listar los personajes disponibles (al menos nombre del personaje y nombre del jugador dueño, sin exponer `user_id` ni `player_id`) y de una tool de lectura que reciba un nombre destino y resuelva la hoja correspondiente. La resolucion del nombre destino MUST hacerse contra los datos de las hojas en la base (no contra conocimiento del agente). Si no se indica destino, la lectura MUST operar sobre una hoja del propio autor: si el autor tiene exactamente una hoja, esa; si tiene mas de una, la tool MUST devolver la lista de sus propios personajes y pedir que se especifique el nombre, en vez de elegir una por defecto; si no tiene ninguna, MUST indicarlo.

#### Scenario: Lectura de la hoja propia (un solo personaje)
- **WHEN** el jugador pide ver su hoja sin nombrar a otro, el agente llama la tool de lectura sin destino, y el autor tiene exactamente una hoja
- **THEN** la tool devuelve esa hoja

#### Scenario: Lectura propia con varios personajes sin especificar
- **WHEN** el jugador pide ver su hoja sin nombrar a otro, el agente llama la tool de lectura sin destino, y el autor tiene mas de una hoja
- **THEN** la tool devuelve la lista de los personajes propios del autor y pide que se especifique cual, sin asumir ninguno por defecto

#### Scenario: Lectura de la hoja de otro jugador
- **WHEN** un jugador pide ver la hoja de otro personaje por su nombre y el agente resuelve ese nombre
- **THEN** la tool devuelve la hoja de ese personaje, aunque no sea el autor del mensaje ni pertenezca al mismo usuario

#### Scenario: Listado de personajes
- **WHEN** el jugador pide saber que personajes existen o el agente necesita resolver un nombre
- **THEN** la tool de listado devuelve los personajes disponibles con su nombre y el nombre de su jugador dueño, sin incluir `user_id` ni `player_id` de nadie; un mismo jugador MAY aparecer en mas de una fila si tiene varios personajes

#### Scenario: Nombre que no resuelve a ninguna hoja
- **WHEN** el nombre destino no coincide con ningun personaje conocido
- **THEN** la tool indica que no encontro una hoja con ese nombre y no devuelve la de otro personaje por defecto

### Requirement: Escritura de la hoja acotada al dueño
El sistema SHALL mantener la propuesta de actualizacion de una hoja acotada al usuario dueño de esa hoja. La tool de propuesta MUST operar siempre sobre una hoja cuyo `user_id` sea el del autor del mensaje en curso (resuelto desde el contexto de la corrida, no desde un argumento elegible libremente por el agente): si el autor tiene una sola hoja, la tool opera sobre ella sin mas; si tiene varias, la tool MUST recibir el nombre del personaje para identificar CUAL de sus propias hojas modificar, y MUST rechazar cualquier nombre que no corresponda a una hoja propia del autor (aunque exista una hoja con ese nombre perteneciente a otro usuario), de modo que un jugador SOLO pueda proponer cambios sobre sus propias hojas, aunque pueda leer las de otros.

#### Scenario: Propuesta sobre la propia hoja (un solo personaje)
- **WHEN** el jugador pide un cambio mecanico de su personaje y tiene una sola hoja
- **THEN** la propuesta se registra sobre esa hoja, del `user_id` del autor

#### Scenario: Propuesta sobre una de varias hojas propias
- **WHEN** el jugador pide un cambio mecanico especificando el nombre de uno de sus varios personajes
- **THEN** la propuesta se registra sobre la hoja de ese nombre, verificando que pertenece al `user_id` del autor

#### Scenario: Intento de escribir la hoja de otro
- **WHEN** un jugador pide aplicar un cambio sobre la hoja de un personaje que no le pertenece (aunque acierte el nombre)
- **THEN** el agente no puede proponer sobre esa hoja ajena: la tool de propuesta rechaza el nombre por no corresponder a una hoja propia del autor

### Requirement: Alta y edicion de hojas desde la web

El sistema SHALL permitir crear y editar la hoja completa de un personaje desde la web, sin requerir confirmacion adicional. La creacion MUST recibir el `user_id` del usuario dueño (que MUST corresponder a un usuario dado de alta) y la hoja completa, validar la hoja contra el schema estricto, y persistirla en `character_sheets` con `updated_at`. La creacion MUST NOT rechazarse por que el usuario ya tenga otra hoja: un usuario puede tener varias. La edicion MUST resolver la hoja por su slug, validar la hoja recibida contra el schema, y reemplazar el `sheet` del documento existente actualizando `updated_at`. La escritura desde la web NO MUST registrar una propuesta pendiente : aplica directo tras validar.

#### Scenario: Crear hoja desde la web
- **WHEN** desde la web se carga una hoja completa para un usuario dado de alta, y la hoja cumple el schema
- **THEN** se crea el documento en `character_sheets` con esa hoja, su `user_id` y su `updated_at`, sin generar una propuesta pendiente

#### Scenario: Editar hoja existente desde la web
- **WHEN** desde la web se edita la hoja de un personaje existente (por su slug) con una hoja que cumple el schema
- **THEN** el `sheet` del documento se reemplaza por el editado y se actualiza `updated_at`, sin generar una propuesta pendiente

#### Scenario: Crear una segunda hoja para el mismo usuario
- **WHEN** desde la web se crea una segunda hoja para un usuario que ya tiene una
- **THEN** la operacion se acepta igual que cualquier otra creacion, y el usuario queda con dos hojas independientes

#### Scenario: Crear una hoja para un usuario inexistente
- **WHEN** desde la web se intenta crear una hoja para un `user_id` que no corresponde a ningun usuario dado de alta
- **THEN** la operacion se rechaza y no se crea ninguna hoja

### Requirement: Alta de jugador desde la web

El sistema SHALL permitir dar de alta un jugador (whitelist `players`) desde la web, como paso previo a asociarle una hoja. El alta MUST recibir el id de jugador (string) y el nombre del jugador, y crear el documento en `players`. El alta MUST rechazarse si el id de jugador ya existe. El sistema SHALL exponer ademas un listado de jugadores (id de jugador y nombre) para poblar el selector del formulario de creacion de hoja.

#### Scenario: Alta de jugador nuevo
- **WHEN** desde la web se da de alta un jugador con un id de jugador no usado y un nombre
- **THEN** se crea el documento en `players` con ese id de jugador y nombre

#### Scenario: Alta de jugador con id de jugador ya existente
- **WHEN** desde la web se intenta dar de alta un jugador con un id de jugador que ya esta en `players`
- **THEN** la operacion se rechaza y no se duplica el jugador

#### Scenario: Listado de jugadores para asociar hoja
- **WHEN** la web necesita el listado de jugadores para crear una hoja
- **THEN** obtiene los jugadores con su id de jugador y nombre

### Requirement: Contexto de roster inyectado en cada corrida del agente
El sistema SHALL darle al agente, en cada corrida, un contexto con el roster de personajes de la partida (al menos nombre de personaje y nombre de jugador) y, si el jugador autor del mensaje tiene una hoja, cual es su propio personaje. Ese contexto MUST armarse de forma fresca en cada corrida a partir del estado actual de las hojas (no MUST quedar cacheado entre corridas ni persistirse en la memoria de conversacion), de modo que nunca quede desactualizado ni se acumule turno a turno en el historial reinyectado. Si la consulta para armar el contexto falla (por ejemplo la base no responde), el sistema MUST degradar a correr sin ese contexto en vez de fallar el turno.

#### Scenario: Roster disponible al arrancar el turno
- **WHEN** el agente arranca a resolver una pregunta
- **THEN** ya cuenta, sin haber llamado ninguna tool, con el listado de personajes de la partida y, si corresponde, cual es el personaje del autor del mensaje

#### Scenario: Roster no se acumula en la memoria persistida
- **WHEN** se persiste la traza de un turno y se recupera para un turno posterior
- **THEN** la traza persistida no contiene el bloque de contexto de roster de turnos anteriores; el contexto que ve el agente en el turno nuevo es el armado fresco para ese turno

#### Scenario: Fallo al armar el contexto
- **WHEN** la consulta para armar el roster falla (por ejemplo la base de datos no responde)
- **THEN** el turno sigue sin ese contexto (el agente puede recurrir a `listar_personajes`/`leer_hoja_personaje` bajo demanda) en vez de fallar

### Requirement: Grounding de respuestas sobre un personaje en la hoja real
El sistema SHALL instruir al agente (via system prompt y docstrings de las tools de hoja) a basar en una lectura real de `leer_hoja_personaje` toda afirmacion sobre datos concretos de un personaje nombrado (propio o ajeno): clase, subclase, nivel, caracteristicas, competencias, puntos de golpe, clase de armadura, ataques, rasgos, dotes, equipo o conjuros. El agente MUST llamar `leer_hoja_personaje` (con `nombre` si el personaje no es el autor del mensaje) antes de afirmar cualquiera de esos datos, salvo que la hoja de ese personaje ya haya sido leida en el mismo turno o sesion (reusable segun la regla general de memoria de la conversacion). El agente MUST NOT inferir esos datos a partir del nombre del personaje, de mensajes previos no verificados contra la hoja, ni de conocimiento general sobre D&D.

#### Scenario: Pregunta sobre el estado de un personaje sin pedido de cambio
- **WHEN** un jugador pregunta algo que depende del estado concreto de un personaje nombrado (por ejemplo "que puede hacer Tharzan en combate" o "cuantos PG le quedan a Tharzan") y esa hoja no fue leida antes en el turno/sesion
- **THEN** el agente llama `leer_hoja_personaje` con el nombre de ese personaje antes de responder, y la respuesta se basa en los datos devueltos por la tool

#### Scenario: Hoja ya leida en el turno o sesion
- **WHEN** la hoja del personaje en cuestion ya fue leida antes en el mismo turno o sesion (esta en el historial de mensajes)
- **THEN** el agente puede reusar esos datos sin volver a llamar `leer_hoja_personaje`

#### Scenario: Pregunta de reglas generales sin referencia a un personaje concreto
- **WHEN** la pregunta es sobre una regla general del manual sin depender del estado de un personaje especifico (por ejemplo "como funciona la ventaja")
- **THEN** el agente no esta obligado a llamar `leer_hoja_personaje`, y sigue el flujo normal de `search_corpus`

### Requirement: Tolerancia de formato en campos enum completados por el agente
El sistema SHALL normalizar, antes de validar, los valores de tipo enum de la hoja que tipicamente completa el agente a mano (`competencia.salvaciones`, `competencia.habilidades`, `rasgos[].origen`, `conjuros.caracteristica_lanzamiento`): un valor string que no matchea exactamente ningun miembro del enum MUST reintentar la resolucion normalizando el valor (sin acentos, en minuscula, con espacios y guiones colapsados a guion bajo) antes de rechazarlo. Un valor que, incluso normalizado, no matchea ningun miembro del enum MUST seguir rechazandose con el error de validacion de siempre. Esta tolerancia MUST NOT cambiar los valores canonicos que se persisten: un valor ya en su forma canonica resuelve exactamente igual que antes.

#### Scenario: Variante con mayuscula o acento
- **WHEN** se valida una hoja cuyo patch trae `competencia.salvaciones` con un valor como "Fuerza" o "Constitución" en vez del token canonico
- **THEN** la validacion resuelve ese valor al miembro del enum correspondiente (`fuerza`, `constitucion`) y no lo rechaza

#### Scenario: Variante con espacios en vez de guion bajo
- **WHEN** se valida una hoja cuyo patch trae una habilidad como "Trato con animales" en vez de `trato_con_animales`
- **THEN** la validacion resuelve ese valor al miembro `trato_con_animales` y no lo rechaza

#### Scenario: Valor fuera del dominio
- **WHEN** se valida una hoja cuyo patch trae un valor que, normalizado, sigue sin matchear ningun miembro del enum (por ejemplo una caracteristica inventada)
- **THEN** la validacion rechaza el valor con el error de enum de siempre, sin inventar una resolucion

#### Scenario: Valor ya canonico
- **WHEN** se valida una hoja cuyo patch trae ya el token canonico exacto (por ejemplo `fuerza`)
- **THEN** la validacion resuelve igual que antes de este cambio, sin alterar el comportamiento del caso feliz

