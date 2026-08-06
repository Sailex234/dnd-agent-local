# manual-monstruos-corpus Specification

## Purpose
Curar el Manual de Monstruos 2024 como markdown navegable bajo `corpus/manual-monstruos/`, con stat blocks literales verificados por vision, lore completo fiel al PDF y un pipeline reproducible con costo de Claude acotado, para que el agente lo consulte con las mismas tools de filesystem que los demas manuales.

## Requirements

### Requirement: Manual de Monstruos 2024 curado en el corpus
El sistema SHALL incluir el Manual de Monstruos 2024 como markdown curado bajo `corpus/manual-monstruos/`, organizado como catalogo alfabetico de criaturas (una entrada por criatura, agrupadas por rango de letras, analogo a `corpus/guia-dm/objetos-magicos/`), mas un archivo de front matter de reglas (como leer un stat block, glosario de rasgos de criatura) y los apendices. El corpus MUST seguir las mismas convenciones que `corpus/manual-jugador/` y `corpus/guia-dm/`: headings en sentence case, tablas en markdown, recuadros/lore lateral como prosa, y el espanol del PDF fuente. El corpus MUST tratarse como solo lectura en runtime y quedar incluido en la imagen Docker, de modo que el agente lo navegue con las mismas tools de filesystem sin cambios de codigo.

#### Scenario: Criatura consultable por el agente
- **WHEN** el agente lista `corpus/manual-monstruos/` y lee el archivo del rango alfabetico de una criatura
- **THEN** recibe el arbol del Manual de Monstruos y el contenido markdown curado de esa criatura (stat block + lore)

#### Scenario: Consistencia de convenciones con los otros manuales
- **WHEN** se compara la estructura de `corpus/manual-monstruos/` con `corpus/manual-jugador/` y `corpus/guia-dm/`
- **THEN** todos usan headings en sentence case, tablas markdown y la misma organizacion navegable por archivo

### Requirement: Stat block literal y verificado por vision
Cada entrada de criatura SHALL incluir su bloque de estadisticas literal y completo (CA, Iniciativa, PG con su expresion de dados, velocidad, los seis atributos con modificadores y salvaciones, resistencias/inmunidades, sentidos, idiomas, VD con PX y BC, rasgos/ATRIBUTOS y ACCIONES). Los valores numericos del stat block MUST verificarse leyendo la pagina del PDF renderizada (`pdftoppm`), no confiando en la capa de OCR, dado que las imagenes del manual degradan el OCR justamente en las celdas numericas. El texto MUST estar libre de artefactos de OCR (`7810` por `7d10`, `Sap`/`Sam` por `Sab`, columnas entrelazadas, guiones de fin de linea).

#### Scenario: Numeros del stat block correctos
- **WHEN** se compara el stat block curado de una criatura contra la pagina del PDF renderizada
- **THEN** CA, PG (con dados), velocidad, atributos, salvaciones, sentidos y VD coinciden exactamente, sin artefactos de OCR

#### Scenario: Agente cita un stat block completo
- **WHEN** el agente busca una criatura cubierta por el PDF y lee su entrada
- **THEN** encuentra el stat block completo y el lore en el archivo del rango correspondiente y puede citar el archivo

### Requirement: Lore completo y cobertura fiel al PDF
El corpus SHALL reflejar el contenido textual del PDF fuente (`data/pdfs/D&D 2024 Manual de Monstruos.ocr.pdf`) sin inventar ni omitir criaturas ni secciones de reglas. Cada entrada MUST incluir el lore completo de su barra lateral (habitat, tesoro, descripcion y comportamiento) fiel al PDF. El arte de monstruos (ilustraciones) NO se transcribe por ser decorativo; el `.md` puede documentar su presencia pero no reconstruye imagenes.

#### Scenario: Ninguna criatura falta ni sobra
- **WHEN** se compara el listado de entradas curadas contra los encabezados de criatura del PDF
- **THEN** cada criatura del PDF tiene su entrada y no hay entradas inventadas

#### Scenario: Lore presente y atribuible
- **WHEN** el agente busca el lore de una criatura cubierta por el PDF
- **THEN** lo encuentra en su entrada de `corpus/manual-monstruos/` y puede citar el archivo

### Requirement: Pipeline reproducible con costo de Claude acotado
El sistema SHALL ejecutar un pipeline reproducible que produzca `corpus/manual-monstruos/` a partir del PDF, corriendo localmente (sin Claude) el split por rango alfabetico, la extraccion de texto column-aware y la limpieza mecanica de patrones OCR, reservando Claude para la estructuracion final a markdown y para la lectura visual de las paginas renderizadas durante la verificacion. El estado de avance MUST quedar registrado por archivo en un `STATUS.md` equivalente al de los otros manuales.

#### Scenario: Etapas locales sin consumo de tokens
- **WHEN** se corren split, extraccion y limpieza mecanica
- **THEN** se completan con herramientas locales (`qpdf`, `pdftotext`, `pdftoppm`, scripts) sin invocar a Claude

#### Scenario: Avance trazable
- **WHEN** se consulta `STATUS.md` durante el procesamiento
- **THEN** muestra, por archivo `.md`, su rango/chunk de origen y su estado (pendiente / extraido / curado / revisado)
