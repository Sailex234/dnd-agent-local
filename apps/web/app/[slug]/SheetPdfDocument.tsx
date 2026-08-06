import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Caracteristica, CharacterSheet } from "@/lib/sheet";
import {
  ABREV_CARACTERISTICA,
  LABEL_CARACTERISTICA,
  LABEL_HABILIDAD,
  type Sistema,
  capacidadCarga,
  conSigno,
  formatPeso,
  formatVelocidad,
  habilidades,
  modificador,
  percepcionPasiva,
  salvaciones,
} from "@/lib/derive";

// Paleta papel/tinta, espejo de las variables de globals.css.
const INK = "#1a1410";
const PARCHMENT = "#f4ead2";
const PARCHMENT_DARK = "#e7d7b3";
const BOX = "#fbf5e4";
const LINE = "#8a6d3b";
const ACCENT = "#7b1e1e";
const MUTED = "#6b5a3e";
const DOT = "#c9b486";

// Se usa la fuente serif estandar embebida de react-pdf (Times-Roman). No se registran
// TTF propios: el PDF mantiene la estructura editorial sin sumar archivos de fuente. Las
// marcas ◆/◇ y los pips se dibujan con View porque las fuentes estandar no traen esos glifos.

// Sin separacion silabica: las palabras envuelven enteras en vez de partirse con guion
// (evita cortes como "ES-PECIE" o "NIV-EL 4" en titulos y celdas angostas).
Font.registerHyphenationCallback((word) => [word]);

const FISICAS: Caracteristica[] = ["fuerza", "destreza", "constitucion"];
const MENTALES: Caracteristica[] = ["inteligencia", "sabiduria", "carisma"];

const dadosMax = (s: string) => {
  const m = /^(\d+)/.exec(s.trim());
  return m ? Number(m[1]) : 0;
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    backgroundColor: PARCHMENT,
    color: INK,
    fontSize: 8.5,
    padding: 24,
    flexDirection: "column",
  },
  // --- Cabecera ---
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "stretch",
    borderBottomWidth: 2,
    borderBottomColor: LINE,
    paddingBottom: 10,
    marginBottom: 10,
  },
  idCol: { flexGrow: 1, flexBasis: 230, justifyContent: "center", gap: 6 },
  name: { fontFamily: "Times-Bold", fontSize: 18, color: ACCENT, lineHeight: 1 },
  idGrid: { flexDirection: "row", flexWrap: "wrap" },
  field: { width: "50%", paddingRight: 8, marginBottom: 3 },
  fieldL: { fontSize: 6, textTransform: "uppercase", letterSpacing: 0.6, color: LINE },
  fieldV: { fontSize: 8.5, borderBottomWidth: 0.5, borderBottomColor: LINE, paddingBottom: 1 },
  // Cluster de combate, agrupado arriba a la derecha (como en la web).
  combatCluster: { width: 250, flexDirection: "column", gap: 5 },
  cRow: { flexDirection: "row", gap: 5 },
  // Cajas redondeadas de la cabecera
  hBox: { borderWidth: 1.5, borderColor: LINE, borderRadius: 6, backgroundColor: BOX, padding: 5, gap: 2 },
  levelBox: { borderColor: ACCENT, alignItems: "center", justifyContent: "center" },
  levelV: { fontFamily: "Times-Bold", fontSize: 18, color: ACCENT, lineHeight: 1 },
  smallCaps: { fontSize: 5.5, letterSpacing: 0.8, textTransform: "uppercase", color: LINE },
  px: { fontSize: 6, color: LINE },
  acBox: { borderColor: ACCENT, alignItems: "center", justifyContent: "center" },
  acV: { fontFamily: "Times-Bold", fontSize: 18, color: ACCENT, lineHeight: 1 },
  cap: { fontSize: 6, textTransform: "uppercase", letterSpacing: 0.8, color: ACCENT, fontFamily: "Times-Bold" },
  cells: { flexDirection: "row", gap: 4, marginTop: 2 },
  cell: {
    flex: 1,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: LINE,
    borderRadius: 3,
    backgroundColor: PARCHMENT,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  cellV: { fontFamily: "Times-Bold", fontSize: 11, lineHeight: 1.1 },
  cellL: { fontSize: 5, textTransform: "uppercase", letterSpacing: 0.3, color: LINE },
  deathRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6, marginTop: 1 },
  // --- Banner ---
  brand: {
    textAlign: "center",
    fontFamily: "Times-Bold",
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: ACCENT,
    marginBottom: 10,
  },
  // --- Cuerpo ---
  body: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  colNarrow: { width: 132, flexDirection: "column", gap: 8 },
  colWide: { flex: 1, flexDirection: "column", gap: 8 },
  box: { backgroundColor: BOX, borderWidth: 1.5, borderColor: LINE, borderRadius: 6, padding: 7 },
  h2: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: ACCENT,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
    paddingBottom: 2,
    marginBottom: 5,
  },
  // Bonif. competencia / inspiracion (centrados)
  centerBox: { alignItems: "center" },
  bigValue: { fontFamily: "Times-Bold", fontSize: 18, lineHeight: 1, marginTop: 2 },
  abilityTitle: { fontSize: 8, textTransform: "uppercase", letterSpacing: 1, color: ACCENT, fontFamily: "Times-Bold", textAlign: "center" },
  // Circulo de modificador
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: LINE,
    backgroundColor: PARCHMENT,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
    marginHorizontal: "auto",
  },
  circleMod: { fontFamily: "Times-Bold", fontSize: 16, lineHeight: 1 },
  circleScore: { fontSize: 6.5, color: LINE, marginTop: 1 },
  abilityRows: { borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 3 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
    paddingVertical: 1.5,
    borderBottomWidth: 0.5,
    borderBottomColor: DOT,
  },
  rowName: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  pip: { width: 6, height: 6, borderRadius: 3, borderWidth: 0.75, borderColor: LINE },
  pipOn: { backgroundColor: ACCENT, borderColor: ACCENT },
  diamond: { width: 5, height: 5, transform: "rotate(45deg)", borderWidth: 0.75, borderColor: ACCENT },
  diamondOn: { backgroundColor: ACCENT },
  total: { fontFamily: "Times-Bold" },
  inspDot: { width: 11, height: 11, transform: "rotate(45deg)", borderWidth: 1, borderColor: ACCENT, marginTop: 3 },
  trainGroup: { marginBottom: 4 },
  // Strip de stats
  strip: { flexDirection: "row", gap: 6 },
  stat: { flex: 1, alignItems: "center", backgroundColor: BOX, borderWidth: 1.5, borderColor: LINE, borderRadius: 6, paddingVertical: 5 },
  statV: { fontFamily: "Times-Bold", fontSize: 14, lineHeight: 1 },
  statL: { fontSize: 6, textTransform: "uppercase", letterSpacing: 0.6, color: LINE, marginTop: 2 },
  // Tablas
  tHead: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingBottom: 2, marginBottom: 2 },
  tRow: { flexDirection: "row", paddingVertical: 1.5, borderBottomWidth: 0.5, borderBottomColor: DOT },
  tCol: { fontSize: 8 },
  thCol: { fontSize: 6, textTransform: "uppercase", letterSpacing: 0.6, color: LINE },
  // Features (rasgos/dotes)
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  feature: {
    width: "48.5%",
    backgroundColor: PARCHMENT,
    borderWidth: 0.5,
    borderColor: LINE,
    borderRadius: 4,
    padding: 5,
  },
  featureWide: { width: "100%" },
  featureTtl: { fontFamily: "Times-Bold", fontSize: 8.5 },
  tag: { fontSize: 6, textTransform: "uppercase", letterSpacing: 0.6, color: LINE },
  featureDesc: { fontSize: 8, marginTop: 1 },
  two: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  // Chips
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  chip: {
    fontSize: 7,
    backgroundColor: PARCHMENT_DARK,
    borderWidth: 0.5,
    borderColor: LINE,
    borderRadius: 8,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  coins: { flexDirection: "row", gap: 10, marginTop: 5 },
  muted: { color: MUTED, fontSize: 8 },
  prose: { fontSize: 8.5, lineHeight: 1.4 },
  sectionGap: { marginTop: 8 },
});

function Pip({ on }: { on: boolean }) {
  return <View style={[s.pip, on ? s.pipOn : {}]} />;
}

export default function SheetPdfDocument({ sheet, sistema }: { sheet: CharacterSheet; sistema: Sistema }) {
  const { identidad, caracteristicas, competencia, combate, ataques, rasgos, dotes, equipo, conjuros, aspecto, historia, notas } =
    sheet;
  const saves = salvaciones(caracteristicas, competencia);
  const skills = habilidades(caracteristicas, competencia);
  const percPasiva = percepcionPasiva(caracteristicas, competencia);
  const pesoTotal = equipo.objetos.reduce((acc, o) => acc + o.peso * o.cantidad, 0);
  const capacidad = capacidadCarga(caracteristicas.fuerza, identidad.tamano);
  const sobrecargado = pesoTotal > capacidad;

  const rasgosClase = rasgos.filter((r) => r.origen === "clase" || r.origen === "trasfondo");
  const rasgosEspecie = rasgos.filter((r) => r.origen === "especie");
  const rasgosDote = rasgos.filter((r) => r.origen === "dote");
  const hdMax = dadosMax(combate.dados_golpe);

  const espacios = conjuros
    ? Object.entries(conjuros.espacios).sort((a, b) => Number(a[0]) - Number(b[0]))
    : [];
  const lista = conjuros?.lista ?? [];

  const abilityBlock = (c: Caracteristica) => {
    const save = saves.find((sv) => sv.caracteristica === c)!;
    const carSkills = skills.filter((sk) => sk.caracteristica === c);
    return (
      <View style={s.box} key={c} wrap={false}>
        <Text style={s.abilityTitle}>{LABEL_CARACTERISTICA[c]}</Text>
        <View style={s.circle}>
          <Text style={s.circleMod}>{conSigno(modificador(caracteristicas[c]))}</Text>
          <Text style={s.circleScore}>{caracteristicas[c]}</Text>
        </View>
        <View style={s.abilityRows}>
          <View style={s.row}>
            <View style={s.rowName}>
              <Pip on={save.competente} />
              <Text>Salvacion</Text>
            </View>
            <Text style={s.total}>{conSigno(save.total)}</Text>
          </View>
          {carSkills.map((h) => (
            <View style={s.row} key={h.habilidad}>
              <View style={s.rowName}>
                <Pip on={h.competente} />
                <Text>{LABEL_HABILIDAD[h.habilidad]}</Text>
              </View>
              <Text style={s.total}>{conSigno(h.total)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const trainGroups: [string, string[]][] = [
    ["Armaduras", competencia.armaduras],
    ["Armas", competencia.armas],
    ["Herramientas", competencia.herramientas],
    ["Idiomas", competencia.idiomas],
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Cabecera */}
        <View style={s.header}>
          <View style={s.idCol}>
            <Text style={s.name}>{sheet.nombre}</Text>
            <View style={s.idGrid}>
              <Field l="Trasfondo" v={identidad.trasfondo} />
              <Field l="Clase" v={identidad.clase} />
              <Field l="Especie" v={identidad.especie} />
              <Field l="Subclase" v={identidad.subclase ?? "-"} />
              <Field l="Alineamiento" v={identidad.alineamiento ?? "-"} />
              <Field l="Tamano" v={identidad.tamano} />
            </View>
          </View>
          <View style={s.combatCluster}>
            <View style={s.cRow}>
              <View style={[s.hBox, s.levelBox, { width: 52 }]}>
                <Text style={s.levelV}>{identidad.nivel}</Text>
                <Text style={s.smallCaps}>Nivel</Text>
                <Text style={s.px}>{identidad.px} PX</Text>
              </View>
              <View style={[s.hBox, s.acBox, { width: 52 }]}>
                <Text style={s.acV}>{combate.ca}</Text>
                <Text style={s.smallCaps}>CA</Text>
                <Text style={[s.px, { textAlign: "center" }]}>Esc: {combate.escudo ? "Si" : "No"}</Text>
              </View>
              <View style={[s.hBox, { flex: 1 }]}>
                <Text style={s.cap}>Puntos de golpe</Text>
                <View style={s.cells}>
                  <Cell v={combate.pg_actuales} l="Actuales" />
                  <Cell v={combate.pg_temporales} l="Temp." />
                  <Cell v={combate.pg_max} l="Max." />
                </View>
              </View>
            </View>
            <View style={s.cRow}>
              <View style={[s.hBox, { flex: 1 }]}>
                <Text style={s.cap}>Dados de golpe</Text>
                <View style={s.cells}>
                  <Cell v={`${combate.dados_golpe_gastados}/${hdMax}`} l="Gastados" />
                  <Cell v={combate.dados_golpe || "-"} l="Max." />
                </View>
              </View>
              <View style={[s.hBox, { flex: 1.2 }]}>
                <Text style={s.cap}>Salv. contra muerte</Text>
                <DeathRow l="Exitos" n={combate.salvaciones_muerte.exitos} />
                <DeathRow l="Fallos" n={combate.salvaciones_muerte.fallos} />
              </View>
            </View>
          </View>
        </View>

        <Text style={s.brand}>DUNGEONS &amp; DRAGONS</Text>

        {/* Cuerpo en tres columnas */}
        <View style={s.body}>
          <View style={s.colNarrow}>
            <View style={[s.box, s.centerBox]} wrap={false}>
              <Text style={s.abilityTitle}>Bonif. competencia</Text>
              <Text style={s.bigValue}>{conSigno(competencia.bono)}</Text>
            </View>
            {FISICAS.map(abilityBlock)}
            <View style={[s.box, s.centerBox]} wrap={false}>
              <Text style={s.abilityTitle}>Inspiracion heroica</Text>
              <View style={[s.inspDot, combate.inspiracion_heroica ? s.diamondOn : {}]} />
            </View>
            <View style={s.box} wrap={false}>
              <Text style={s.h2}>Entrenamiento y competencias</Text>
              {trainGroups.map(([titulo, items]) => (
                <View key={titulo} style={s.trainGroup}>
                  <Text style={[s.smallCaps, { color: MUTED }]}>{titulo}</Text>
                  {items.length > 0 ? (
                    <View style={s.chips}>
                      {items.map((it, i) => (
                        <Text style={s.chip} key={i}>
                          {it}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={s.muted}>-</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={s.colNarrow}>{MENTALES.map(abilityBlock)}</View>

          <View style={s.colWide}>
            <View style={s.strip}>
              <Stat v={conSigno(combate.iniciativa)} l="Iniciativa" />
              <Stat v={formatVelocidad(combate.velocidad, sistema)} l="Velocidad" />
              <Stat v={identidad.tamano} l="Tamano" />
              <Stat v={percPasiva} l="Perc. pasiva" />
            </View>

            <View style={s.box}>
              <Text style={s.h2}>Armas y trucos de dano</Text>
              {ataques.length > 0 ? (
                <View>
                  <View style={s.tHead}>
                    <Text style={[s.thCol, { flex: 2 }]}>Nombre</Text>
                    <Text style={[s.thCol, { flex: 1 }]}>Atq./CD</Text>
                    <Text style={[s.thCol, { flex: 1.5 }]}>Dano y tipo</Text>
                    <Text style={[s.thCol, { flex: 2 }]}>Notas</Text>
                  </View>
                  {ataques.map((a, i) => (
                    <View style={s.tRow} key={i}>
                      <Text style={[s.tCol, { flex: 2 }]}>{a.nombre}</Text>
                      <Text style={[s.tCol, { flex: 1 }]}>{a.bono_ataque}</Text>
                      <Text style={[s.tCol, { flex: 1.5 }]}>
                        {a.dano}
                        {a.tipo ? ` ${a.tipo}` : ""}
                      </Text>
                      <Text style={[s.tCol, s.muted, { flex: 2 }]}>{a.notas ?? ""}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={s.muted}>Sin ataques.</Text>
              )}
            </View>

            <View style={s.box}>
              <Text style={s.h2}>Rasgos de clase</Text>
              <FeatureGrid
                items={rasgosClase.map((r) => ({ ttl: r.nombre, tag: r.nivel ? `nivel ${r.nivel}` : null, desc: r.descripcion }))}
                empty="Sin rasgos."
              />
            </View>

            <View style={s.two} wrap={false}>
              <View style={[s.box, { flex: 1 }]}>
                <Text style={s.h2}>Atributos de especie</Text>
                <FeatureGrid
                  items={rasgosEspecie.map((r) => ({ ttl: r.nombre, tag: null, desc: r.descripcion }))}
                  empty="Sin rasgos."
                  wide
                />
              </View>
              <View style={[s.box, { flex: 1 }]}>
                <Text style={s.h2}>Dotes</Text>
                <FeatureGrid
                  items={[
                    ...dotes.map((d) => ({ ttl: d.nombre, tag: null, desc: d.descripcion })),
                    ...rasgosDote.map((r) => ({ ttl: r.nombre, tag: null, desc: r.descripcion })),
                  ]}
                  empty="Sin dotes."
                  wide
                />
              </View>
            </View>
          </View>
        </View>

        {/* Conjuros */}
        <View style={[s.box, s.sectionGap]}>
          <Text style={s.h2}>Conjuros</Text>
          <View style={s.strip}>
            <Stat v={conjuros ? ABREV_CARACTERISTICA[conjuros.caracteristica_lanzamiento] : "-"} l="Caracteristica" />
            <Stat v={conjuros ? conjuros.cd_salvacion : "-"} l="CD salvacion" />
            <Stat v={conjuros ? conSigno(conjuros.bono_ataque) : "-"} l="Bono de ataque" />
          </View>
          <View style={{ marginTop: 5 }}>
            <Text style={s.cap}>Espacios</Text>
            {espacios.length > 0 ? (
              <View style={s.chips}>
                {espacios.map(([nivel, e]) => (
                  <Text style={s.chip} key={nivel}>
                    Nv {nivel}: {e.gastados}/{e.total}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={s.muted}>-</Text>
            )}
          </View>
          <View style={{ marginTop: 5 }}>
            {lista.length > 0 ? (
              <View>
                <View style={s.tHead}>
                  <Text style={[s.thCol, { width: 16 }]}>Nv</Text>
                  <Text style={[s.thCol, { flex: 2 }]}>Nombre</Text>
                  <Text style={[s.thCol, { flex: 1 }]}>Lanz.</Text>
                  <Text style={[s.thCol, { flex: 1 }]}>Alcance</Text>
                  <Text style={[s.thCol, { width: 36 }]}>C/R/M</Text>
                  <Text style={[s.thCol, { width: 26 }]}>Prep.</Text>
                </View>
                {lista
                  .slice()
                  .sort((a, b) => a.nivel - b.nivel)
                  .map((c, i) => (
                    <View style={s.tRow} key={i}>
                      <Text style={[s.tCol, { width: 16 }]}>{c.nivel === 0 ? "T" : c.nivel}</Text>
                      <Text style={[s.tCol, { flex: 2 }]}>
                        {c.nombre}
                        {c.notas ? ` - ${c.notas}` : ""}
                      </Text>
                      <Text style={[s.tCol, s.muted, { flex: 1 }]}>{c.tiempo_lanzamiento ?? "-"}</Text>
                      <Text style={[s.tCol, s.muted, { flex: 1 }]}>{c.alcance ?? "-"}</Text>
                      <Text style={[s.tCol, s.muted, { width: 36 }]}>
                        {[c.concentracion ? "C" : "", c.ritual ? "R" : "", c.material ? "M" : ""].filter(Boolean).join(" ") || "-"}
                      </Text>
                      <Text style={[s.tCol, { width: 26 }]}>{c.preparado ? "Si" : "-"}</Text>
                    </View>
                  ))}
              </View>
            ) : (
              <Text style={s.muted}>Sin conjuros.</Text>
            )}
          </View>
        </View>

        {/* Equipo: wrap={false} para que no se corte el borde ni se parta el bloque de
            monedas. Si no entra al pie de la pagina, salta entero a la siguiente. */}
        <View style={[s.box, s.sectionGap]} wrap={false}>
          <Text style={s.h2}>Equipo</Text>
          {equipo.objetos.length > 0 ? (
            equipo.objetos.map((o, i) => (
              <View style={s.row} key={i}>
                <Text style={{ flex: 1 }}>
                  {o.nombre}
                  {o.cantidad > 1 ? ` x${o.cantidad}` : ""}
                  {o.equipado ? " (equipado)" : ""}
                  {o.notas ? ` - ${o.notas}` : ""}
                </Text>
                <Text style={s.total}>{o.peso > 0 ? formatPeso(o.peso * o.cantidad, sistema) : "-"}</Text>
              </View>
            ))
          ) : (
            <Text style={s.muted}>Sin objetos.</Text>
          )}
          <View style={[s.row, { borderBottomWidth: 0 }]}>
            <Text style={[s.total, { flex: 1 }]}>
              Peso total{sobrecargado ? " (sobrecargado)" : ""}
            </Text>
            <Text style={[s.total, sobrecargado ? { color: ACCENT } : {}]}>
              {formatPeso(pesoTotal, sistema)} / {formatPeso(capacidad, sistema)}
            </Text>
          </View>
          <View style={s.coins}>
            <Coin l="PC" v={equipo.monedas.cobre} />
            <Coin l="PP" v={equipo.monedas.plata} />
            <Coin l="PE" v={equipo.monedas.electro} />
            <Coin l="PO" v={equipo.monedas.oro} />
            <Coin l="PL" v={equipo.monedas.platino} />
          </View>
          <Text style={[s.smallCaps, { color: MUTED, marginTop: 5 }]}>Sintonizacion con objetos magicos</Text>
          {equipo.sintonizacion.length > 0 ? (
            <View style={s.chips}>
              {equipo.sintonizacion.map((it, i) => (
                <Text style={s.chip} key={i}>
                  {it}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={s.muted}>-</Text>
          )}
        </View>

        <Prose l="Aspecto" v={aspecto} />
        <Prose l="Historia y personalidad" v={historia} />
        <Prose l="Notas" v={notas} />
      </Page>
    </Document>
  );
}

function Field({ l, v }: { l: string; v: string }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldL}>{l}</Text>
      <Text style={s.fieldV}>{v}</Text>
    </View>
  );
}

function Cell({ v, l }: { v: string | number; l: string }) {
  return (
    <View style={s.cell}>
      <Text style={s.cellV}>{v}</Text>
      <Text style={s.cellL}>{l}</Text>
    </View>
  );
}

function Stat({ v, l }: { v: string | number; l: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statV}>{v}</Text>
      <Text style={s.statL}>{l}</Text>
    </View>
  );
}

function DeathRow({ l, n }: { l: string; n: number }) {
  return (
    <View style={s.deathRow}>
      <Text style={[s.px, { color: LINE }]}>{l}</Text>
      <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.diamond, i < n ? s.diamondOn : {}]} />
        ))}
      </View>
    </View>
  );
}

function Coin({ l, v }: { l: string; v: number }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontFamily: "Times-Bold", fontSize: 10 }}>{v}</Text>
      <Text style={s.cellL}>{l}</Text>
    </View>
  );
}

function FeatureGrid({
  items,
  empty,
  wide,
}: {
  items: { ttl: string; tag: string | null; desc: string }[];
  empty: string;
  wide?: boolean;
}) {
  if (items.length === 0) return <Text style={s.muted}>{empty}</Text>;
  return (
    <View style={s.featureGrid}>
      {items.map((it, i) => (
        <View style={[s.feature, wide ? s.featureWide : {}]} key={i} wrap={false}>
          <Text>
            <Text style={s.featureTtl}>{it.ttl}</Text>
            {it.tag ? <Text style={s.tag}>{`  ${it.tag}`}</Text> : null}
          </Text>
          <Text style={s.featureDesc}>{it.desc}</Text>
        </View>
      ))}
    </View>
  );
}

function Prose({ l, v }: { l: string; v: string | null }) {
  return (
    <View style={[s.box, s.sectionGap]} wrap={false}>
      <Text style={s.h2}>{l}</Text>
      <Text style={s.prose}>{v ? v : "-"}</Text>
    </View>
  );
}
