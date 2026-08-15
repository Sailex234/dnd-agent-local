"""Seed de jugadores (whitelist) y hojas de personaje en Mongo.

Uso:
    uv run --directory apps/api python seed_sheets.py

Hace upsert por player_id en players (jugadores/whitelist) y en
character_sheets (hojas). Los datos reflejan el estado actual de la base; editar
aca o directamente en Mongo. Cada hoja se valida contra el schema
(shared.sheets.CharacterSheet) antes de insertarla.
"""

from datetime import datetime, timezone

from shared.sheets import CharacterSheet
from shared.db import client

# Jugadores de la whitelist (coleccion players). El rol es opcional: "gm" para
# el Dungeon Master, "jugador" para los demas (ausente = jugador por defecto).
PLAYERS = [{'player_id': '8774223457', 'nombre': 'Julian', 'rol': 'gm'},
 {'player_id': '8778524961', 'nombre': 'Jonathan', 'rol': 'jugador'},
 {'player_id': '6796457120', 'nombre': 'Sebastian', 'rol': 'jugador'},
 {'player_id': '7607075666', 'nombre': 'Elias', 'rol': 'jugador'}]

# Hojas de personaje (coleccion character_sheets), una por jugador.
# Jonathan -> Tharzan (player_id de la whitelist).
THARZAN = {'player_id': '8778524961',
 'sheet': {'nombre': 'Tharzan',
           'identidad': {'especie': 'Enano',
                         'clase': 'Bárbaro',
                         'subclase': 'Senda del Fanático',
                         'nivel': 4,
                         'trasfondo': 'Soldado',
                         'alineamiento': 'Neutral bueno',
                         'px': 2966,
                         'tamano': 'Mediano'},
           'caracteristicas': {'fuerza': 18,
                               'destreza': 13,
                               'constitucion': 16,
                               'inteligencia': 8,
                               'sabiduria': 12,
                               'carisma': 10},
           'competencia': {'bono': 2,
                           'salvaciones': ['fuerza', 'constitucion'],
                           'habilidades': ['atletismo', 'intimidacion', 'percepcion'],
                           'armaduras': ['ligera', 'media', 'escudos'],
                           'armas': ['sencillas', 'marciales'],
                           'herramientas': ['Dados'],
                           'idiomas': ['Común', 'Enano']},
           'combate': {'pg_max': 48,
                       'pg_actuales': 46,
                       'pg_temporales': 0,
                       'dados_golpe': '4d12',
                       'dados_golpe_gastados': 2,
                       'ca': 14,
                       'escudo': False,
                       'iniciativa': 1,
                       'velocidad': 9,
                       'salvaciones_muerte': {'exitos': 0, 'fallos': 0},
                       'inspiracion_heroica': False},
           'ataques': [{'nombre': 'Hacha a dos manos',
                        'bono_ataque': '+6',
                        'dano': '1d12+4',
                        'tipo': 'cortante',
                        'notas': 'Maestria: Hender'},
                       {'nombre': 'Espadon',
                        'bono_ataque': '+6',
                        'dano': '2d6+4',
                        'tipo': 'cortante',
                        'notas': 'Maestria: Rozar'},
                       {'nombre': 'Hacha de mano',
                        'bono_ataque': '+6',
                        'dano': '1d6+4',
                        'tipo': 'cortante',
                        'notas': 'Arrojadiza (alcance 6/18 m); Maestria: Molestar'}],
           'rasgos': [{'nombre': 'Rabia',
                       'descripcion': '3 usos por descanso largo (recupera 1 con descanso corto). '
                                      '+2 dano en ataques de Fuerza, ventaja en pruebas y '
                                      'salvaciones de Fuerza, resistencia a dano contundente, '
                                      'perforante y cortante.',
                       'origen': 'clase',
                       'nivel': 1},
                      {'nombre': 'Defensa sin armadura',
                       'descripcion': 'Sin armadura, CA = 10 + mod. DES + mod. CON.',
                       'origen': 'clase',
                       'nivel': 1},
                      {'nombre': 'Maestria de armas',
                       'descripcion': 'Competencia con 2 propiedades de maestria de armas.',
                       'origen': 'clase',
                       'nivel': 1},
                      {'nombre': 'Sentido del peligro',
                       'descripcion': 'Ventaja en salvaciones de DES contra efectos que puedas ver '
                                      '(si no estas incapacitado).',
                       'origen': 'clase',
                       'nivel': 2},
                      {'nombre': 'Ataque imprudente',
                       'descripcion': 'Podes atacar con ventaja ese turno, pero los ataques contra '
                                      'vos tambien tienen ventaja hasta tu proximo turno.',
                       'origen': 'clase',
                       'nivel': 2},
                      {'nombre': 'Furia Divina',
                       'descripcion': 'Enfurecido, la primera criatura que golpees por turno '
                                      'recibe 1d6 + mitad de nivel de barbaro de dano necrotico o '
                                      'radiante (a eleccion). A nivel 4: 1d6+2.',
                       'origen': 'clase',
                       'nivel': 3},
                      {'nombre': 'Guerrero de los Dioses',
                       'descripcion': 'Reserva de 4d12 para curarte: como accion adicional gastas '
                                      'dados, los tiras y recuperas esos PG. Se recupera con '
                                      'descanso largo.',
                       'origen': 'clase',
                       'nivel': 3},
                      {'nombre': 'Conocimiento primigenio',
                       'descripcion': 'Competencia en Percepcion (elegida de la lista de barbaro). '
                                      'Ademas, enfurecido, podes hacer pruebas de Acrobacias, '
                                      'Intimidacion, Percepcion, Sigilo o Supervivencia como '
                                      'pruebas de Fuerza.',
                       'origen': 'clase',
                       'nivel': 3},
                      {'nombre': 'Mejora de caracteristica',
                       'descripcion': '+1 Fuerza y +1 Constitucion.',
                       'origen': 'clase',
                       'nivel': 4},
                      {'nombre': 'Vision en la oscuridad',
                       'descripcion': 'Vision en la oscuridad a 60 pies.',
                       'origen': 'especie',
                       'nivel': None},
                      {'nombre': 'Resistencia enana',
                       'descripcion': 'Ventaja en salvaciones contra veneno y resistencia a dano '
                                      'por veneno.',
                       'origen': 'especie',
                       'nivel': None},
                      {'nombre': 'Aguante enano',
                       'descripcion': '+1 PG maximo y +1 mas por cada nivel que subas (incluido en '
                                      'el calculo de PG).',
                       'origen': 'especie',
                       'nivel': None}],
           'dotes': [{'nombre': 'Atacante salvaje',
                      'descripcion': 'Una vez por turno, al acertar con un arma, tiras dos veces '
                                     'los dados de dano del arma y usas el mejor resultado.'}],
           'equipo': {'objetos': [{'nombre': 'Hacha a dos manos',
                                   'cantidad': 1,
                                   'peso': 3.5,
                                   'equipado': True,
                                   'notas': 'Maestria: Hender'},
                                  {'nombre': 'Espadon',
                                   'cantidad': 1,
                                   'peso': 2.7,
                                   'equipado': False,
                                   'notas': 'Maestria: Rozar'},
                                  {'nombre': 'Hacha de mano',
                                   'cantidad': 2,
                                   'peso': 0.9,
                                   'equipado': False,
                                   'notas': 'Maestria: Molestar; arrojadiza y ligera'}],
                      'monedas': {'cobre': 6, 'plata': 3, 'electro': 0, 'oro': 211, 'platino': 0},
                      'sintonizacion': []},
           'conjuros': None,
           'aspecto': None,
           'historia': None,
           'notas': None}}

# Sebastian -> Moric (player_id de la whitelist).
MORIC = {'player_id': '6796457120',
 'sheet': {'nombre': 'Moric',
           'identidad': {'especie': 'Enano',
                         'clase': 'Clérigo',
                         'subclase': 'Dominio de la Guerra',
                         'nivel': 4,
                         'trasfondo': 'Acólito',
                         'alineamiento': 'Legal bueno',
                         'px': 0,
                         'tamano': 'Mediano'},
           'caracteristicas': {'fuerza': 14,
                               'destreza': 12,
                               'constitucion': 15,
                               'inteligencia': 10,
                               'sabiduria': 17,
                               'carisma': 8},
           'competencia': {'bono': 2,
                           'salvaciones': ['sabiduria', 'carisma'],
                           'habilidades': ['historia', 'perspicacia', 'percepcion', 'religion'],
                           'armaduras': ['ligera', 'media', 'pesada', 'escudos'],
                           'armas': ['sencillas', 'marciales'],
                           'herramientas': ['suministros de calígrafo'],
                           'idiomas': ['Común', 'Enano', 'Élfico']},
           'combate': {'pg_max': 29,
                       'pg_actuales': 29,
                       'pg_temporales': 0,
                       'dados_golpe': '4d8',
                       'dados_golpe_gastados': 0,
                       'ca': 18,
                       'escudo': False,
                       'iniciativa': 1,
                       'velocidad': 9,
                       'salvaciones_muerte': {'exitos': 0, 'fallos': 0},
                       'inspiracion_heroica': False},
           'ataques': [],
           'rasgos': [{'nombre': 'Lanzamiento de conjuros',
                       'descripcion': 'Lanzas conjuros de clérigo usando Sabiduría como aptitud '
                                      'mágica. Puedes usar un símbolo sagrado como canalizador '
                                      'mágico.',
                       'origen': 'clase',
                       'nivel': 1},
                      {'nombre': 'Orden divina: Protector',
                       'descripcion': 'Entrenado para el combate. Gana competencia con armas '
                                      'marciales y entrenamiento con armaduras pesadas.',
                       'origen': 'clase',
                       'nivel': 1},
                      {'nombre': 'Canalizar divinidad',
                       'descripcion': '2 usos por descanso (recupera 1 con descanso corto, todos '
                                      'con descanso largo). Opciones: Chispa divina y Expulsar '
                                      'muertos vivientes.',
                       'origen': 'clase',
                       'nivel': 2},
                      {'nombre': 'Golpe guiado',
                       'descripcion': 'Cuando tú o una criatura a 9 m fallen una tirada de ataque, '
                                      'puedes gastar un uso de Canalizar divinidad para darle +10 '
                                      'a la tirada. Usarlo para otro requiere una reacción.',
                       'origen': 'clase',
                       'nivel': 3},
                      {'nombre': 'Sacerdote guerrero',
                       'descripcion': 'Como acción adicional, puedes hacer un ataque con arma o '
                                      'sin armas. Usos iguales al mod. SAB (mínimo 1); se '
                                      'recuperan con descanso corto o largo.',
                       'origen': 'clase',
                       'nivel': 3},
                      {'nombre': 'Mejora de característica (nivel 4)',
                       'descripcion': 'Obtenida a nivel 4. Usada para tomar la dote Lanzador en '
                                      'combate.',
                       'origen': 'clase',
                       'nivel': 4},
                      {'nombre': 'Afinidad con la piedra',
                       'descripcion': 'Como acción adicional, siente vibraciones en un radio de 18 '
                                      'm durante 10 minutos estando en contacto con piedra. Usos = '
                                      'bono de competencia; se recuperan con descanso largo.',
                       'origen': 'especie',
                       'nivel': None},
                      {'nombre': 'Aguante enano',
                       'descripcion': 'Los PG máximos aumentan en 1 al crear el personaje y en 1 '
                                      'más por cada nivel ganado.',
                       'origen': 'especie',
                       'nivel': None},
                      {'nombre': 'Resistencia enana',
                       'descripcion': 'Resistencia al daño de veneno. Ventaja en salvaciones para '
                                      'evitar o poner fin al estado envenenado.',
                       'origen': 'especie',
                       'nivel': None},
                      {'nombre': 'Visión en la oscuridad',
                       'descripcion': 'Visión en la oscuridad hasta 36 m.',
                       'origen': 'especie',
                       'nivel': None}],
           'dotes': [{'nombre': 'Iniciado en la magia',
                      'descripcion': 'Dote de origen (Acólito). Aprende dos trucos y un conjuro de '
                                     'nivel 1 de la lista de clérigo, druida o mago. Aptitud '
                                     'mágica elegida al tomar la dote. El conjuro de nivel 1 '
                                     'siempre está preparado y puede lanzarse una vez sin espacio '
                                     'por descanso largo.'},
                     {'nombre': 'Lanzador en combate',
                      'descripcion': 'Dote general (requisito: nivel 4 + Lanzamiento de conjuros). '
                                     '+1 a INT, SAB o CAR; ventaja en salvaciones de CON para '
                                     'concentración; conjuro reactivo como reacción ante ataque de '
                                     'oportunidad; componentes somáticos con manos ocupadas.'}],
           'equipo': {'objetos': [],
                      'monedas': {'cobre': 0, 'plata': 0, 'electro': 0, 'oro': 0, 'platino': 0},
                      'sintonizacion': []},
           'conjuros': None,
           'aspecto': None,
           'historia': None,
           'notas': 'Pendiente: confirmar qué característica subió con Lanzador en combate (+1 a '
                    'SAB/INT/CAR). Pendiente: conjuros (trucos, lista preparada, espacios '
                    'gastados), ataques y equipo.'}}

# Elias -> Saelix (player_id de la whitelist).
SAELIX = {'player_id': '7607075666',
 'sheet': {'nombre': 'Saelix',
           'identidad': {'especie': 'Tiefling',
                         'clase': 'Hechicero',
                         'subclase': 'Linaje Draconico',
                         'nivel': 4,
                         'trasfondo': 'Charlatán',
                         'alineamiento': 'Neutral',
                         'px': 0,
                         'tamano': 'Mediano'},
           'caracteristicas': {'fuerza': 8,
                               'destreza': 14,
                               'constitucion': 14,
                               'inteligencia': 12,
                               'sabiduria': 10,
                               'carisma': 17},
           'competencia': {'bono': 2,
                           'salvaciones': ['constitucion', 'carisma'],
                           'habilidades': ['engano',
                                           'juego_de_manos',
                                           'arcanos',
                                           'historia',
                                           'persuasion',
                                           'perspicacia',
                                           'interpretacion'],
                           'armaduras': [],
                           'armas': ['sencillas'],
                           'herramientas': ['útiles para falsificar'],
                           'idiomas': ['Común', 'Infernal', 'Dracónico']},
           'combate': {'pg_max': 23,
                       'pg_actuales': 23,
                       'pg_temporales': 0,
                       'dados_golpe': '4d6',
                       'dados_golpe_gastados': 0,
                       'ca': 15,
                       'escudo': False,
                       'iniciativa': 2,
                       'velocidad': 9,
                       'salvaciones_muerte': {'exitos': 0, 'fallos': 0},
                       'inspiracion_heroica': False},
           'ataques': [{'nombre': 'Punal',
                        'bono_ataque': '+4',
                        'dano': '1d4+2',
                        'tipo': 'perforante',
                        'notas': 'Ligera, arrojadiza (alcance 6/18 m). Usa mod DES.'},
                       {'nombre': 'Ballesta ligera',
                        'bono_ataque': '+4',
                        'dano': '1d8+2',
                        'tipo': 'perforante',
                        'notas': 'Alcance 24/96 m, recarga. Usa mod DES.'},
                       {'nombre': 'Lanza',
                        'bono_ataque': '+1',
                        'dano': '1d6-1',
                        'tipo': 'perforante',
                        'notas': 'Alcance 6/12 m si se arroja. Usa mod FUE.'}],
           'rasgos': [{'nombre': 'Visión en la oscuridad',
                       'descripcion': 'Visión en la oscuridad a 18 m (60 pies).',
                       'origen': 'especie',
                       'nivel': None},
                      {'nombre': 'Presencia sobrenatural',
                       'descripcion': 'Conoces el truco taumaturgia (legado infernal Tiefling).',
                       'origen': 'especie',
                       'nivel': None},
                      {'nombre': 'Legado infernal — Infernal',
                       'descripcion': 'Resistencia al daño de fuego. Truco: descarga de fuego. '
                                      'Niv. 3: reprensión infernal. Niv. 5: oscuridad.',
                       'origen': 'especie',
                       'nivel': None},
                      {'nombre': 'Ascendencia dracónica',
                       'descripcion': 'Dragón Rojo (fuego).',
                       'origen': 'clase',
                       'nivel': 1},
                      {'nombre': 'Resiliencia dracónica',
                       'descripcion': 'CA sin armadura = 10 + mod DES + mod CAR. PG máx aumentan '
                                      'en 3 al tomar el rasgo y en 1 por cada nivel de hechicero '
                                      'posterior.',
                       'origen': 'clase',
                       'nivel': 1},
                      {'nombre': 'Hechicería innata',
                       'descripcion': 'Como acción adicional, desatas tu magia durante 1 minuto: '
                                      'CD de salvación +1 y ventaja en tiradas de ataque de '
                                      'conjuros. 2 usos por descanso largo.',
                       'origen': 'clase',
                       'nivel': 1},
                      {'nombre': 'Fuente de magia',
                       'descripcion': 'Puntos de hechicería: 4/4. Puedes convertir espacios en '
                                      'puntos y crear espacios nuevos.',
                       'origen': 'clase',
                       'nivel': 2},
                      {'nombre': 'Metamagia',
                       'descripcion': 'Opciones conocidas: Conjuro Cauteloso y Conjuro Veloz.',
                       'origen': 'clase',
                       'nivel': 2},
                      {'nombre': 'Lanzador preciso',
                       'descripcion': 'Dote de nivel 4. CAR +1. Ignorás cobertura media y tres '
                                      'cuartos en ataques con conjuros. Sin desventaja al lanzar '
                                      'conjuros a 1,5 m o menos de un enemigo. Alcance de conjuros '
                                      'de ataque aumenta en 18 m.',
                       'origen': 'clase',
                       'nivel': 4},
                      {'nombre': 'Habilidoso (trasfondo Charlatán)',
                       'descripcion': 'Ganas competencia en cualquier combinación de tres '
                                      'habilidades o herramientas a tu elección.',
                       'origen': 'trasfondo',
                       'nivel': None}],
           'dotes': [{'nombre': 'Habilidoso',
                      'descripcion': 'Dote de origen (trasfondo Charlatán). Competencia en tres '
                                     'habilidades o herramientas a elección. Repetible.'},
                     {'nombre': 'Lanzador preciso',
                      'descripcion': 'Dote general (nivel 4). CAR +1. Tus tiradas de ataque con '
                                     'conjuros ignoran cobertura media y tres cuartos. Estar a 1,5 '
                                     'm o menos de un enemigo no impone desventaja en tiradas de '
                                     'ataque con conjuros. Cuando lances un conjuro con alcance '
                                     'mínimo de 3 m que requiera tirada de ataque, podés aumentar '
                                     'su alcance en 18 m.'}],
           'equipo': {'objetos': [{'nombre': 'Puñal',
                                   'cantidad': 2,
                                   'peso': 0.5,
                                   'equipado': True,
                                   'notas': None},
                                  {'nombre': 'Ballesta ligera',
                                   'cantidad': 1,
                                   'peso': 2.5,
                                   'equipado': True,
                                   'notas': None},
                                  {'nombre': 'Virote',
                                   'cantidad': 20,
                                   'peso': 0.0,
                                   'equipado': False,
                                   'notas': 'Municion de ballesta.'},
                                  {'nombre': 'Foco arcano (cristal carmesi)',
                                   'cantidad': 1,
                                   'peso': 0.0,
                                   'equipado': True,
                                   'notas': 'Canalizador arcano (cristal). Equipo de clase '
                                            'Hechicero.'},
                                  {'nombre': 'Mochila de explorador',
                                   'cantidad': 1,
                                   'peso': 0.0,
                                   'equipado': False,
                                   'notas': 'Cuerda, antorchas, yesquero, raciones, odre, palanca, '
                                            'martillo y piquetes.'},
                                  {'nombre': 'Lanza',
                                   'cantidad': 1,
                                   'peso': 1.5,
                                   'equipado': False,
                                   'notas': 'Equipo de clase Hechicero (opción A).'},
                                  {'nombre': 'Carta sin resolver',
                                   'cantidad': 1,
                                   'peso': 0.0,
                                   'equipado': False,
                                   'notas': 'Gancho de trama.'},
                                  {'nombre': 'Ropa de viajero',
                                   'cantidad': 1,
                                   'peso': 0.0,
                                   'equipado': True,
                                   'notas': None}],
                      'monedas': {'cobre': 0, 'plata': 0, 'electro': 0, 'oro': 78, 'platino': 0},
                      'sintonizacion': []},
           'conjuros': {'caracteristica_lanzamiento': 'carisma',
                        'cd_salvacion': 13,
                        'bono_ataque': 5,
                        'espacios': {'1': {'total': 6, 'gastados': 6},
                                     '2': {'total': 3, 'gastados': 3}},
                        'lista': [{'nivel': 0,
                                   'nombre': 'Descarga de Fuego',
                                   'tiempo_lanzamiento': '1 accion',
                                   'alcance': '18 m',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': False,
                                   'notas': 'Truco especie (Legado infernal). Tambien en lista '
                                            'hechicero.',
                                   'preparado': False},
                                  {'nivel': 0,
                                   'nombre': 'Rayo de Escarcha',
                                   'tiempo_lanzamiento': '1 accion',
                                   'alcance': '18 m',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': False,
                                   'notas': None,
                                   'preparado': False},
                                  {'nivel': 0,
                                   'nombre': 'Prestidigitacion',
                                   'tiempo_lanzamiento': '1 accion',
                                   'alcance': '3 m',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': False,
                                   'notas': None,
                                   'preparado': False},
                                  {'nivel': 0,
                                   'nombre': 'Ilusion Menor',
                                   'tiempo_lanzamiento': '1 accion',
                                   'alcance': '9 m',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': False,
                                   'notas': None,
                                   'preparado': False},
                                  {'nivel': 0,
                                   'nombre': 'Taumaturgia',
                                   'tiempo_lanzamiento': '1 accion',
                                   'alcance': '9 m',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': False,
                                   'notas': 'Truco de especie Tiefling (Presencia sobrenatural). '
                                            'No ocupa espacio de truco de clase.',
                                   'preparado': False},
                                  {'nivel': 0,
                                   'nombre': 'Reparar',
                                   'tiempo_lanzamiento': '1 minuto',
                                   'alcance': 'Toque',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': True,
                                   'notas': 'Repara una grieta o rotura de hasta 30 cm en '
                                            'cualquier objeto. No restaura magia.',
                                   'preparado': False},
                                  {'nivel': 1,
                                   'nombre': 'Proyectil Magico',
                                   'tiempo_lanzamiento': '1 accion',
                                   'alcance': '36 m',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': False,
                                   'notas': None,
                                   'preparado': False},
                                  {'nivel': 1,
                                   'nombre': 'Escudo',
                                   'tiempo_lanzamiento': '1 reaccion',
                                   'alcance': 'Personal',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': False,
                                   'notas': 'Reaccion al ser impactado o elegido como objetivo de '
                                            'proyectil magico.',
                                   'preparado': False},
                                  {'nivel': 1,
                                   'nombre': 'Caida de Pluma',
                                   'tiempo_lanzamiento': '1 reaccion',
                                   'alcance': '18 m',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': True,
                                   'notas': 'Reaccion cuando vos u otra criatura visible a 18 m '
                                            'caen. Hasta 5 criaturas descienden a 18 m/asalto y no '
                                            'reciben daño de caída.',
                                   'preparado': False},
                                  {'nivel': 2,
                                   'nombre': 'Rayo Abrasador',
                                   'tiempo_lanzamiento': '1 accion',
                                   'alcance': '27 m',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': False,
                                   'notas': None,
                                   'preparado': False},
                                  {'nivel': 2,
                                   'nombre': 'Paso Brumoso',
                                   'tiempo_lanzamiento': '1 accion adicional',
                                   'alcance': 'Personal',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': False,
                                   'notas': None,
                                   'preparado': False},
                                  {'nivel': 1,
                                   'nombre': 'Aliento de dragon',
                                   'tiempo_lanzamiento': '1 accion adicional',
                                   'alcance': 'Personal',
                                   'concentracion': True,
                                   'ritual': False,
                                   'material': False,
                                   'notas': 'Conjuro de subclase Linaje Draconico (niv. 3). '
                                            'Siempre preparado, no ocupa espacio de preparados.',
                                   'preparado': True},
                                  {'nivel': 2,
                                   'nombre': 'Alterar el propio aspecto',
                                   'tiempo_lanzamiento': '1 accion',
                                   'alcance': 'Personal',
                                   'concentracion': True,
                                   'ritual': False,
                                   'material': False,
                                   'notas': 'Conjuro de subclase Linaje Draconico (niv. 3). '
                                            'Siempre preparado, no ocupa espacio de preparados.',
                                   'preparado': True},
                                  {'nivel': 1,
                                   'nombre': 'Orbe cromatico',
                                   'tiempo_lanzamiento': '1 accion',
                                   'alcance': '27 m',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': True,
                                   'notas': 'Conjuro de subclase Linaje Draconico (niv. 3). '
                                            'Siempre preparado, no ocupa espacio de preparados.',
                                   'preparado': True},
                                  {'nivel': 1,
                                   'nombre': 'Orden imperiosa',
                                   'tiempo_lanzamiento': '1 accion adicional',
                                   'alcance': '18 m',
                                   'concentracion': False,
                                   'ritual': False,
                                   'material': False,
                                   'notas': 'Conjuro de subclase Linaje Draconico (niv. 3). '
                                            'Siempre preparado, no ocupa espacio de preparados.',
                                   'preparado': True}]},
           'aspecto': 'Tiefling de linaje de Asmodeo. 20 anios, 1.75 m, 75 kg. Ojos rojos, piel '
                      'rojo granate, pelo negro.',
           'historia': 'Saelix nacio marcado por la sangre de Asmodeo, y entendio pronto que esa '
                       'herencia pesaba tanto como cualquier titulo. La gente lo miraba con '
                       'desconfianza antes de conocerlo, asi que decidio que el conocimiento, y el '
                       'poder que viene con el, seria su mejor armadura. Paso su infancia entre '
                       'libros y maestros menores de magia, fascinado con la idea de que la '
                       'hechiceria no tiene techo: solo falta saber cuanto se puede llegar a '
                       'empujar. En su tierra natal nunca se sintio del todo comodo, no por la '
                       'gente sino por la politica; cuando entendio que ahi no iba a poder crecer '
                       'mas como hechicero, hizo las valijas y se fue a recorrer otros pueblos y '
                       'ver como otras razas entienden y manejan la magia. Es solitario por '
                       'naturaleza, prefiere depender de si mismo, pero no es ningun inutil en '
                       'equipo: identifica rapido que puede aportar cada companero y como '
                       'aprovecharlo. Respeta genuinamente a quien sabe de magia o a quien al '
                       'menos es capaz de plantarle batalla. Persuasivo y directo, con poca '
                       'paciencia para ordenes sin fundamento. Cuando algo lo entusiasma, sin '
                       'embargo, pierde un poco la cabeza, y ahi empiezan sus problemas. Rasgos de '
                       'personalidad: mido a la gente por su utilidad para mis planes, y tengo '
                       'poca paciencia con ordenes sin una buena razon detras. Ideal: el saber es '
                       'poder; la magia es el futuro, y solo respeto a quien la domina o es capaz '
                       'de hacerle frente (Conocimiento). Vinculo: mi verdadero hogar no es un '
                       'lugar, es cada sitio nuevo donde todavia me queda algo por aprender. '
                       'Defecto: cuando algo me entusiasma demasiado, dejo de escuchar la razon, y '
                       'ahi suelo cometer mis peores errores.',
           'notas': 'Hoja de nivel 4 completada. CA 15 por Resistencia dracónica (10 + mod DES +2 '
                    '+ mod CAR +3). PG máx 30: base 26 (niv4, CON+2) + 4 bonus Resistencia '
                    'dracónica. CAR 17 por dote Lanzador preciso (mod +3, sin cambio en CD ni bono '
                    'de ataque de conjuros).'}}

SHEETS = [THARZAN, MORIC, SAELIX]


def seed_players() -> None:
    coll = client.players_collection()
    for p in PLAYERS:
        coll.update_one(
            {"player_id": p["player_id"]},
            {"$set": p},
            upsert=True,
        )
        print(f"Jugador upserted: {p['nombre']} (player_id={p['player_id']})")


def seed_sheets() -> None:
    coll = client.character_sheets()
    for entry in SHEETS:
        sheet = CharacterSheet.model_validate(entry["sheet"])
        coll.update_one(
            {"player_id": entry["player_id"]},
            {
                "$set": {
                    "nombre": sheet.nombre,
                    "sheet": sheet.model_dump(mode="json"),
                    "updated_at": datetime.now(timezone.utc),
                },
                "$setOnInsert": {"player_id": entry["player_id"]},
            },
            upsert=True,
        )
        print(f"Hoja upserted: {sheet.nombre} (player_id={entry['player_id']})")


def main() -> None:
    seed_players()
    seed_sheets()


if __name__ == "__main__":
    main()
