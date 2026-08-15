# Guía del DM

Todo esto vive en `https://dnd-agent-local.vercel.app` - lo abrís desde
cualquier PC o celular con internet, no hace falta estar en la misma red ni
tener nada instalado. Entrás con el usuario y la clave que ya tenés.

La primera consulta después de un rato sin uso puede tardar 20-30 segundos en
cargar (el hosting gratuito "duerme" el servidor cuando nadie lo usa) - no es
que se colgó, solo hay que esperar esa primera vez.

## Fichas de personaje

En el inicio (`/`) están los jugadores y sus personajes. Cada ficha se edita
sola, se guarda mientras escribís (no hace falta un botón "Guardar").

Para sumar un jugador nuevo al grupo, "Cargar jugador" en el menú de arriba.
Cada jugador tiene un botón **Eliminar** junto a su nombre en el inicio, por
si alguien se baja de la mesa - borra también su ficha de personaje, así que
ojo, no se puede deshacer.

## Referencia rápida

Desde el menú **Herramientas** (arriba a la derecha) o desde `/referencia`
tenés cuatro páginas de consulta instantánea, sin esperas:

- **Monstruos**: los 407 perfiles del Manual de monstruos. Buscá por nombre,
  tipo o hábitat (ej. "kobold", "Infraoscuridad") y entrá para ver el stat
  block completo con ataques y acciones.
- **Glosario**: estados, acciones y reglas de descanso (ej. "aturdido",
  "ayudar", "descanso corto").
- **Encuentros**: calculadora de dificultad. Metés cuántos jugadores y de qué
  nivel, agregás las criaturas (el PX de cada una está en su página de
  Monstruos, en el campo VD) y te dice si el encuentro queda bajo, moderado o
  alto.
- **Botín**: tira las tablas de objetos mágicos aleatorios y de piedras
  preciosas/obras de arte, por tema y rareza.

## Rastreador de combate

Esta es la parte nueva para aprender. Vive en `/combate` (o el link
"Combate" de arriba).

### 1. Crear el encuentro

Entrá a `/combate` y tocá **+ Nuevo encuentro**. Le ponés un nombre (ej.
"Emboscada en el puente") y entrás directo a la pantalla del combate. El
nombre se puede cambiar después tocando el título arriba de todo, en
cualquier momento - se guarda solo, igual que el resto.

### 2. Agregar combatientes

Tocá **+ Agregar combatiente**. Elegís uno de los dos modos:

- **Personaje**: aparece la lista de PJs ya cargados. Tocás uno y se
  completan solos su CA, PG e iniciativa (los que tiene en su ficha).
- **Monstruo**: buscás por nombre (ej. "goblin") y elegís uno de los
  resultados. Se completan CA, PG e iniciativa (el modificador de Destreza)
  del bestiario.

En los dos casos podés retocar los números antes de confirmar (por ejemplo,
si tirás los PG del monstruo a mano en vez de usar el promedio). Tocá
**Agregar** y aparece en la lista.

Repetí para cada PJ y cada monstruo del encuentro.

### 3. Tirar iniciativa

El campo "Iniciativa" de cada combatiente, antes de tirar, es su **bono**
(el modificador de Destreza). Tocá **Tirar iniciativa (todos)** una vez que
estén todos agregados: tira 1d20 para cada uno, se lo suma a su bono, y
reordena la lista de mayor a menor. A partir de ahí ese número ya es el
resultado de la tirada, no el bono — si volvés a tocar el botón, tira de
nuevo sobre lo que haya en ese momento.

### 4. Jugar el combate

- La fila marcada con ▶ es el turno actual.
- **Siguiente turno →** pasa al que sigue en la lista; cuando le toca al
  último, arranca la ronda siguiente y vuelve al primero.
- Los PG, la CA y las condiciones de cada combatiente se editan directo en su
  fila (las condiciones van separadas por coma, ej. "envenenado, derribado").
- **Quitar** saca a un combatiente de la lista (por ejemplo, si muere o
  huye).

Todo lo que cambiás ahí se guarda solo, con un cartelito que dice "Guardando"
/ "Guardado" al lado del nombre del encuentro. Podés cerrar la pestaña a
mitad de combate y volver después: retoma tal como lo dejaste.

### 5. Terminar

No hay un botón "Terminar combate" — cuando el encuentro se acaba, simplemente
dejás de usar esa pantalla. Los encuentros viejos quedan listados en
`/combate` por si querés volver a mirarlos, con un botón **Eliminar** al lado
de cada uno para cuando ya no lo necesitás más (pide confirmación antes de
borrar, no se puede deshacer).

## Herramientas

El menú **Herramientas** (arriba a la derecha) tiene también el conversor de
kilos/libras y metros/pies para cuando el manual habla en unidades raras.

## Cosas que todavía no hace

- No calcula solo el PX total de un encuentro contra el bestiario (hay que
  mirar el VD de cada monstruo a mano y sumarlo en la calculadora).
- No hay botón para deshacer un cambio en el combate.
- Pensado para que lo use el DM desde una sola pantalla a la vez; si dos
  personas editan el mismo encuentro al mismo tiempo, gana el último guardado.
