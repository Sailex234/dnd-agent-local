# guia-dm-corpus

## Purpose
Curar la Guía del Dungeon Master 2024 como corpus markdown bajo `corpus/guia-dm/`, fiel al PDF fuente y consultable por el agente con las mismas tools de filesystem que el manual del jugador, producido por un pipeline reproducible que reserva Claude solo para la estructuración final.

## Requirements

### Requirement: Guía del DM 2024 curada en el corpus
El sistema SHALL incluir la Guía del Dungeon Master 2024 como markdown curado bajo `corpus/guia-dm/`, organizado jerárquicamente por capítulo y sección, siguiendo las mismas convenciones que `corpus/manual-jugador/`: headings en sentence case, tablas en markdown, recuadros laterales como blockquote, y el español del PDF fuente. El corpus MUST tratarse como solo lectura en runtime y quedar incluido en la imagen Docker, de modo que el agente lo navegue con las mismas tools de filesystem sin cambios de código.

#### Scenario: Capítulo consultable por el agente
- **WHEN** el agente lista `corpus/guia-dm/` y lee uno de los archivos de capítulo
- **THEN** recibe el árbol de la Guía del DM y el contenido markdown curado del capítulo pedido

#### Scenario: Consistencia de convenciones con el manual del jugador
- **WHEN** se compara la estructura de `corpus/guia-dm/` con `corpus/manual-jugador/`
- **THEN** ambos usan la misma organización por capítulo/sección, headings en sentence case, tablas markdown y recuadros como blockquote

### Requirement: Cobertura fiel al PDF fuente
El corpus de la Guía del DM SHALL reflejar el contenido del PDF fuente (`data/pdfs/D&D 2024 Guía Dungeon Master.pdf`) sin inventar reglas ni omitir secciones de reglas consultables (encuentros, recompensas, tesoros, objetos mágicos, bastiones y herramientas de DM). El texto MUST estar libre de los artefactos de OCR del PDF (columnas entrelazadas, saltos de párrafo espurios, `O` por `0` en tablas, palabras cortadas por guion de fin de línea).

#### Scenario: Sin artefactos de OCR remanentes
- **WHEN** se revisa un archivo curado contra su chunk PDF de origen
- **THEN** el texto markdown lee como prosa continua correcta, con tablas alineadas y sin caracteres OCR espurios

#### Scenario: Sección de reglas presente y atribuible
- **WHEN** el agente busca una regla de DM cubierta por el PDF (ej. una tabla de tesoro o un objeto mágico)
- **THEN** la encuentra en el archivo de capítulo correspondiente de `corpus/guia-dm/` y puede citar el archivo

### Requirement: Pipeline reproducible con costo de Claude acotado
El sistema SHALL documentar y ejecutar un pipeline reproducible que produzca `corpus/guia-dm/` a partir del PDF, ejecutando localmente (sin Claude) las etapas de split por capítulo, extracción de texto y limpieza mecánica de patrones OCR, y reservando Claude únicamente para la estructuración final a markdown sobre el texto ya limpio, chunk por chunk. El estado de avance MUST quedar registrado por archivo en un `STATUS.md`, equivalente al usado para el manual del jugador.

#### Scenario: Etapas locales sin consumo de tokens
- **WHEN** se corren las etapas de split, extracción y limpieza mecánica
- **THEN** se completan con herramientas locales (`qpdf`/`gs`, `pdftotext`, scripts) sin invocar a Claude

#### Scenario: Claude solo en el repaso final
- **WHEN** se estructura un chunk a markdown final
- **THEN** Claude opera sobre el texto ya extraído y limpio de ese chunk, no sobre el PDF completo

#### Scenario: Avance trazable
- **WHEN** se consulta `STATUS.md` durante el procesamiento
- **THEN** muestra, por archivo `.md`, su chunk PDF de origen y su estado (pendiente / extraído / curado / revisado)
