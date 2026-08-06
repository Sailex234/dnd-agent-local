# Instalación en otra PC (Windows)

Guía para instalar una copia independiente del sistema en otra notebook
(por ejemplo, la de tu DM). No hace falta Visual Studio Code ni ninguna IA
para esto — son unos programas y unos comandos de una sola vez.

Es una instalación **independiente**: no se conecta a tu PC ni comparte
datos con ella. Arranca con la base de datos vacía (sin jugadores ni
personajes cargados) — se cargan de nuevo desde la web, como se explica en
`GUIA_DM.md`.

## 1. Programas a instalar (una sola vez)

1. **Git** — <https://git-scm.com/download/win> (para clonar el repositorio).
2. **Docker Desktop** — <https://www.docker.com/products/docker-desktop/>.
   Al instalarlo te va a pedir habilitar WSL2; seguí las indicaciones del
   instalador (puede pedir reiniciar la PC una vez). Después abrilo y
   dejalo corriendo en segundo plano (queda un ícono de ballena en la
   bandeja del sistema).
3. **Node.js LTS** (20 o más nuevo) — <https://nodejs.org/> (instalador
   normal, "Next, Next, Next").
4. **uv** (maneja Python solo, no hace falta instalar Python aparte) — abrí
   PowerShell y corré:
   ```powershell
   irm https://astral.sh/uv/install.ps1 | iex
   ```
   Cerrá y volvé a abrir PowerShell después de esto.

## 2. Clonar el repositorio

En PowerShell, parado en la carpeta donde quieras dejarlo (ej. `Documentos`):

```powershell
git clone https://github.com/Sailex234/dnd-agent-local.git
cd dnd-agent-local
```

## 3. Configurar

```powershell
uv sync --project apps\shared
uv sync --project apps\api

copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
```

Abrí `apps\api\.env` y `apps\web\.env.local` con el Notepad (o el editor que
quieras) y poneles el **mismo** usuario y clave en los dos archivos
(`API_AUTH_USER`/`API_AUTH_PASSWORD` en uno, `AUTH_USER`/`AUTH_PASSWORD` en
el otro) — elegí los que quieras, no tienen que coincidir con los de mi PC.

Generá los datos de referencia (monstruos, glosario, botín) una sola vez:

```powershell
uv run python scripts\build_reference_data.py
```

## 4. Instalar dependencias de la web (una sola vez, tarda un par de minutos)

```powershell
cd apps\web
npm install
cd ..\..
```

## 5. Usarlo en cada sesión

Primero abrí **Docker Desktop** y esperá a que el ícono de la ballena, abajo
a la derecha, deje de estar "cargando" (Docker tiene que estar corriendo
antes del siguiente paso).

Después, doble clic en `scripts\windows\iniciar.bat`. Levanta Mongo, la API y la web
en dos ventanas de consola aparte, y abre `http://localhost:3000` solo. La
primera vez Windows puede preguntar si permitir acceso de red a Node/Docker
— aceptar.

Cuando termine la sesión, doble clic en `scripts\windows\detener.bat` (o
simplemente cerrá las dos ventanas de consola y Docker Desktop).

## Si en vez de Windows es Mac o Linux

Avisame y te armo el equivalente — cambian los instaladores (Docker Desktop
para Mac, Docker Engine en Linux) y el script de arranque (`iniciar.bat` se
reemplaza por un `.sh`), pero los pasos de configuración (3 y 4) son los
mismos.
