"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Caracteristica, CharacterSheet, Conjuros, Rasgo } from "@/lib/sheet";
import { updateSheet } from "@/lib/api";
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
import {
  AtaquesModal,
  CombatModal,
  ConjurosModal,
  DotesModal,
  type Edit,
  EquipoModal,
  IdentityModal,
  RasgosModal,
  StatsModal,
} from "./editors";
import DownloadPdfWrapper from "./DownloadPdfWrapper";

const FISICAS: Caracteristica[] = ["fuerza", "destreza", "constitucion"];
const MENTALES: Caracteristica[] = ["inteligencia", "sabiduria", "carisma"];

const VACIO = <span className="muted">-</span>;
const num = (v: string) => (v === "" ? 0 : Number(v));
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
// Dados maximos a partir del string "4d12" -> 4.
const dadosMax = (s: string) => {
  const m = /^(\d+)/.exec(s.trim());
  return m ? Number(m[1]) : 0;
};

type Status = "idle" | "saving" | "saved" | "error";

export default function Sheet({ slug, initial }: { slug: string; initial: CharacterSheet }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<CharacterSheet>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [modal, setModal] = useState<string | null>(null);
  const [sistema, setSistema] = useState<Sistema>("metrico");
  const slugRef = useRef(slug);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // La unidad es solo visual y se recuerda por navegador. Se lee tras montar para no
  // romper la hidratacion (el render inicial es siempre metrico).
  useEffect(() => {
    if (localStorage.getItem("unidades") === "imperial") setSistema("imperial");
  }, []);
  const cambiarSistema = (s: Sistema) => {
    setSistema(s);
    localStorage.setItem("unidades", s);
  };

  // Autosave con debounce. Aplica el cambio al estado al instante (optimista) y guarda
  // ~600ms despues. Si el nombre cambia, el slug cambia: usamos el slug devuelto.
  const save = (next: CharacterSheet) => {
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const detail = await updateSheet(slugRef.current, next);
        if (detail.slug !== slugRef.current) {
          slugRef.current = detail.slug;
          router.replace(`/${detail.slug}`);
        }
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 600);
  };

  const edit = (mut: (s: CharacterSheet) => void) =>
    setSheet((prev) => {
      const next = structuredClone(prev);
      mut(next);
      save(next);
      return next;
    });

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

  const abilityBlock = (c: Caracteristica) => {
    const save = saves.find((s) => s.caracteristica === c)!;
    const carSkills = skills.filter((s) => s.caracteristica === c);
    return (
      <section className="box ability-block" key={c}>
        <div className="ability-title">{LABEL_CARACTERISTICA[c]}</div>
        <div className="ability-circle">
          <span className="mod">{conSigno(modificador(caracteristicas[c]))}</span>
          <span className="score">{caracteristicas[c]}</span>
        </div>
        <div className="ability-rows">
          <div className="row">
            <span className="name">
              <span className={`pip ${save.competente ? "on" : ""}`} />
              Salvacion
            </span>
            <span className="total">{conSigno(save.total)}</span>
          </div>
          {carSkills.map((h) => (
            <div className="row" key={h.habilidad}>
              <span className="name">
                <span className={`pip ${h.competente ? "on" : ""}`} />
                {LABEL_HABILIDAD[h.habilidad]}
              </span>
              <span className="total">{conSigno(h.total)}</span>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="sheet">
      <div className="sheet-topbar">
        <Link href="/" className="back-link">
          &larr; Volver
        </Link>
        <div className="topbar-right">
          <UnitToggle sistema={sistema} onChange={cambiarSistema} />
          <SaveStatus status={status} />
          <DownloadPdfWrapper slug={slugRef.current} sheet={sheet} sistema={sistema} />
        </div>
      </div>

      <header className="ph-header">
        <div className="ph-id">
          <div className="ph-id-top">
            <div className="ph-name">{sheet.nombre}</div>
            <button className="edit-btn" onClick={() => setModal("identidad")} aria-label="Editar identidad">
              ✎
            </button>
          </div>
          <div className="ph-id-grid">
            <Labeled l="Trasfondo" v={identidad.trasfondo} />
            <Labeled l="Clase" v={identidad.clase} />
            <Labeled l="Especie" v={identidad.especie} />
            <Labeled l="Subclase" v={identidad.subclase ?? "-"} />
            <Labeled l="Alineamiento" v={identidad.alineamiento ?? "-"} />
          </div>
        </div>

        <div className="ph-level">
          <span className="lvl">{identidad.nivel}</span>
          <span className="lvl-l">Nivel</span>
          <span className="px">{identidad.px} PX</span>
        </div>

        <div className="ph-ac">
          <div className="ph-shield">
            <span className="v">{combate.ca}</span>
            <span className="l">CA</span>
          </div>
          <div className="ph-escudo muted">Escudo: {combate.escudo ? "Si" : "No"}</div>
          <button className="edit-btn" onClick={() => setModal("combate")} aria-label="Editar combate">
            ✎
          </button>
        </div>

        <div className="ph-hpblock">
          <span className="cap">Puntos de golpe</span>
          <div className="ph-cells">
            <HpStepper
              l="Actuales"
              v={combate.pg_actuales}
              onChange={(n) => edit((s) => (s.combate.pg_actuales = n))}
            />
            <HpStepper
              l="Temp."
              v={combate.pg_temporales}
              min={0}
              onChange={(n) => edit((s) => (s.combate.pg_temporales = n))}
            />
            <div className="ph-cell">
              <span className="v">{combate.pg_max}</span>
              <span className="l">Max.</span>
            </div>
          </div>
        </div>

        <div className="ph-hpblock">
          <span className="cap">Dados de golpe</span>
          <div className="ph-cells">
            <div className="ph-cell ph-hd">
              <div className="hd-ctrl">
                <button
                  className="step"
                  aria-label="Recuperar dado"
                  onClick={() =>
                    edit((s) => (s.combate.dados_golpe_gastados = clamp(combate.dados_golpe_gastados - 1, 0, hdMax)))
                  }
                >
                  -
                </button>
                <span className="v">{combate.dados_golpe_gastados}</span>
                <button
                  className="step"
                  aria-label="Gastar dado"
                  onClick={() =>
                    edit((s) => (s.combate.dados_golpe_gastados = clamp(combate.dados_golpe_gastados + 1, 0, hdMax)))
                  }
                >
                  +
                </button>
              </div>
              <span className="l">Gastados</span>
            </div>
            <div className="ph-cell">
              <span className="v">{combate.dados_golpe}</span>
              <span className="l">Max.</span>
            </div>
          </div>
        </div>

        <div className="ph-death">
          <span className="cap">Salv. contra muerte</span>
          <DeathRow
            l="Exitos"
            n={combate.salvaciones_muerte.exitos}
            onChange={(n) => edit((s) => (s.combate.salvaciones_muerte.exitos = n))}
          />
          <DeathRow
            l="Fallos"
            n={combate.salvaciones_muerte.fallos}
            onChange={(n) => edit((s) => (s.combate.salvaciones_muerte.fallos = n))}
          />
        </div>
      </header>

      <div className="brand">DUNGEONS &amp; DRAGONS</div>

      <div className="ph-body">
        <div className="ph-col">
          <div className="box prof-box">
            <button
              className="edit-btn prof-edit"
              onClick={() => setModal("stats")}
              aria-label="Editar caracteristicas y competencias"
            >
              ✎
            </button>
            <div className="ability-title">Bonif. competencia</div>
            <div className="prof-value">{conSigno(competencia.bono)}</div>
          </div>
          {FISICAS.map(abilityBlock)}
          <button
            className="box insp-box insp-toggle"
            onClick={() => edit((s) => (s.combate.inspiracion_heroica = !s.combate.inspiracion_heroica))}
            aria-pressed={combate.inspiracion_heroica}
          >
            <div className="ability-title">Inspiracion heroica</div>
            <div className="insp-dot">{combate.inspiracion_heroica ? "◆" : "◇"}</div>
          </button>
          <TrainingBox competencia={competencia} onEdit={() => setModal("stats")} />
        </div>

        <div className="ph-col">{MENTALES.map(abilityBlock)}</div>

        <div className="ph-col-wide">
          <div className="ph-strip">
            <Stat v={conSigno(combate.iniciativa)} l="Iniciativa" />
            <Stat v={formatVelocidad(combate.velocidad, sistema)} l="Velocidad" />
            <Stat v={identidad.tamano} l="Tamano" />
            <Stat v={percPasiva} l="Perc. pasiva" />
          </div>

          <section className="box">
            <EditH2 title="Armas y trucos de dano" onEdit={() => setModal("ataques")} />
            {ataques.length > 0 ? (
              <div className="attacks">
                <div className="attack-row head">
                  <span>Nombre</span>
                  <span>Bonif. atq./CD</span>
                  <span>Dano y tipo</span>
                  <span>Notas</span>
                </div>
                {ataques.map((a, i) => (
                  <div className="attack-row" key={i}>
                    <span>{a.nombre}</span>
                    <span>{a.bono_ataque}</span>
                    <span>
                      {a.dano}
                      {a.tipo ? ` ${a.tipo}` : ""}
                    </span>
                    <span className="muted">{a.notas ?? ""}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">Sin ataques.</div>
            )}
          </section>

          <section className="box">
            <EditH2 title="Rasgos de clase" onEdit={() => setModal("rasgos")} />
            <RasgoList rasgos={rasgosClase} withTag />
          </section>

          <div className="ph-two">
            <section className="box">
              <EditH2 title="Atributos de especie" onEdit={() => setModal("rasgos")} />
              <RasgoList rasgos={rasgosEspecie} />
            </section>
            <section className="box">
              <EditH2 title="Dotes" onEdit={() => setModal("dotes")} />
              {dotes.length === 0 && rasgosDote.length === 0 ? (
                <div className="muted">Sin dotes.</div>
              ) : (
                <div className="feature-grid">
                  {dotes.map((d, i) => (
                    <div className="feature" key={`d${i}`}>
                      <span className="ttl">{d.nombre}</span>
                      <div>{d.descripcion}</div>
                    </div>
                  ))}
                  {rasgosDote.map((r, i) => (
                    <div className="feature" key={`r${i}`}>
                      <span className="ttl">{r.nombre}</span>
                      <div>{r.descripcion}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <ConjurosBox conjuros={conjuros} edit={edit} onEdit={() => setModal("conjuros")} />

      <section className="box section-mt">
        <EditH2 title="Equipo" onEdit={() => setModal("equipo")} />
        {equipo.objetos.length > 0 ? (
          equipo.objetos.map((o, i) => (
            <div className="row" key={i}>
              <span className="name">
                {o.nombre}
                {o.cantidad > 1 ? <span className="muted"> x{o.cantidad}</span> : null}
                {o.equipado ? <span className="tag">equipado</span> : null}
                {o.notas ? <span className="muted"> - {o.notas}</span> : null}
              </span>
              <span className="total">{o.peso > 0 ? formatPeso(o.peso * o.cantidad, sistema) : "-"}</span>
            </div>
          ))
        ) : (
          <div className="muted">Sin objetos.</div>
        )}
        <div className="row" style={{ fontWeight: 700 }}>
          <span className="name">
            Peso total
            {sobrecargado ? (
              <span className="tag" style={{ color: "var(--accent)" }}>
                sobrecargado
              </span>
            ) : null}
          </span>
          <span className="total">
            {formatPeso(pesoTotal, sistema)} / {formatPeso(capacidad, sistema)}
          </span>
        </div>
        <div className="coins section-mt">
          <CoinInput l="PC" v={equipo.monedas.cobre} onChange={(n) => edit((s) => (s.equipo.monedas.cobre = n))} />
          <CoinInput l="PP" v={equipo.monedas.plata} onChange={(n) => edit((s) => (s.equipo.monedas.plata = n))} />
          <CoinInput l="PE" v={equipo.monedas.electro} onChange={(n) => edit((s) => (s.equipo.monedas.electro = n))} />
          <CoinInput l="PO" v={equipo.monedas.oro} onChange={(n) => edit((s) => (s.equipo.monedas.oro = n))} />
          <CoinInput l="PL" v={equipo.monedas.platino} onChange={(n) => edit((s) => (s.equipo.monedas.platino = n))} />
        </div>
        <div className="muted section-mt">Sintonizacion con objetos magicos</div>
        {equipo.sintonizacion.length > 0 ? (
          <div className="chips">
            {equipo.sintonizacion.map((s, i) => (
              <span className="chip" key={i}>
                {s}
              </span>
            ))}
          </div>
        ) : (
          VACIO
        )}
      </section>

      <InlineProse l="Aspecto" v={aspecto} onSave={(t) => edit((s) => (s.aspecto = t || null))} />
      <InlineProse
        l="Historia y personalidad"
        v={historia}
        onSave={(t) => edit((s) => (s.historia = t || null))}
      />
      <InlineProse l="Notas" v={notas} onSave={(t) => edit((s) => (s.notas = t || null))} />

      {modal === "identidad" && <IdentityModal sheet={sheet} edit={edit} onClose={() => setModal(null)} />}
      {modal === "combate" && <CombatModal sheet={sheet} edit={edit} onClose={() => setModal(null)} />}
      {modal === "stats" && <StatsModal sheet={sheet} edit={edit} onClose={() => setModal(null)} />}
      {modal === "ataques" && <AtaquesModal sheet={sheet} edit={edit} onClose={() => setModal(null)} />}
      {modal === "rasgos" && <RasgosModal sheet={sheet} edit={edit} onClose={() => setModal(null)} />}
      {modal === "dotes" && <DotesModal sheet={sheet} edit={edit} onClose={() => setModal(null)} />}
      {modal === "equipo" && <EquipoModal sheet={sheet} edit={edit} onClose={() => setModal(null)} />}
      {modal === "conjuros" && <ConjurosModal sheet={sheet} edit={edit} onClose={() => setModal(null)} />}
    </div>
  );
}

function EditH2({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <h2 className="h2-edit">
      <span>{title}</span>
      <button className="edit-btn" onClick={onEdit} aria-label={`Editar ${title}`}>
        ✎
      </button>
    </h2>
  );
}

function UnitToggle({ sistema, onChange }: { sistema: Sistema; onChange: (s: Sistema) => void }) {
  return (
    <div className="unit-toggle" role="group" aria-label="Sistema de unidades">
      <button
        type="button"
        className={`unit-opt ${sistema === "metrico" ? "on" : ""}`}
        aria-pressed={sistema === "metrico"}
        onClick={() => onChange("metrico")}
      >
        kg/m
      </button>
      <button
        type="button"
        className={`unit-opt ${sistema === "imperial" ? "on" : ""}`}
        aria-pressed={sistema === "imperial"}
        onClick={() => onChange("imperial")}
      >
        lb/pies
      </button>
    </div>
  );
}

function SaveStatus({ status }: { status: Status }) {
  const text =
    status === "saving"
      ? "Guardando..."
      : status === "saved"
        ? "Guardado"
        : status === "error"
          ? "Error al guardar"
          : "";
  return <span className={`save-status ${status}`}>{text}</span>;
}

function HpStepper({
  l,
  v,
  min,
  onChange,
}: {
  l: string;
  v: number;
  min?: number;
  onChange: (n: number) => void;
}) {
  const lo = min ?? -9999;
  return (
    <div className="ph-cell ph-hd">
      <div className="hd-ctrl">
        <button className="step" aria-label={`${l} -1`} onClick={() => onChange(Math.max(lo, v - 1))}>
          -
        </button>
        <input
          className="hp-input"
          value={v}
          onChange={(e) => onChange(Math.max(lo, num(e.target.value)))}
          aria-label={l}
        />
        <button className="step" aria-label={`${l} +1`} onClick={() => onChange(v + 1)}>
          +
        </button>
      </div>
      <span className="l">{l}</span>
    </div>
  );
}

function CoinInput({ l, v, onChange }: { l: string; v: number; onChange: (n: number) => void }) {
  return (
    <label className="coin">
      <span className="coin-l">{l}</span>
      <input
        className="coin-input"
        type="number"
        min={0}
        value={v}
        onChange={(e) => onChange(Math.max(0, num(e.target.value)))}
        aria-label={l}
      />
    </label>
  );
}

function Labeled({ l, v }: { l: string; v: string }) {
  return (
    <div className="ph-field">
      <span className="ph-field-l">{l}</span>
      <span className="ph-field-v">{v}</span>
    </div>
  );
}

// Tres rombos por fila (exitos/fallos). Click llena hasta ese rombo; click en el ultimo
// lleno lo vacia.
function DeathRow({ l, n, onChange }: { l: string; n: number; onChange: (n: number) => void }) {
  return (
    <div className="death-row-view">
      <span className="l">{l}</span>
      <span className="diamonds">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            className="diamond-btn"
            aria-label={`${l} ${i + 1}`}
            onClick={() => onChange(n === i + 1 ? i : i + 1)}
          >
            {i < n ? "◆" : "◇"}
          </button>
        ))}
      </span>
    </div>
  );
}

function InlineProse({
  l,
  v,
  onSave,
}: {
  l: string;
  v: string | null;
  onSave: (t: string) => void;
}) {
  const [text, setText] = useState(v ?? "");
  return (
    <section className="box section-mt">
      <h2>{l}</h2>
      <textarea
        className="prose-edit"
        rows={3}
        value={text}
        placeholder="-"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== (v ?? "")) onSave(text);
        }}
      />
    </section>
  );
}

function Stat({ v, l }: { v: string | number; l: string }) {
  return (
    <div className="stat">
      <div className="v">{v}</div>
      <div className="l">{l}</div>
    </div>
  );
}

function RasgoList({ rasgos, withTag }: { rasgos: Rasgo[]; withTag?: boolean }) {
  if (rasgos.length === 0) return <div className="muted">Sin rasgos.</div>;
  return (
    <div className="feature-grid">
      {rasgos.map((r, i) => (
        <div className="feature" key={i}>
          <span className="ttl">{r.nombre}</span>
          {withTag && r.nivel ? <span className="tag">nivel {r.nivel}</span> : null}
          <div>{r.descripcion}</div>
        </div>
      ))}
    </div>
  );
}

function TrainingBox({
  competencia,
  onEdit,
}: {
  competencia: CharacterSheet["competencia"];
  onEdit: () => void;
}) {
  const grupos: [string, string[]][] = [
    ["Armaduras", competencia.armaduras],
    ["Armas", competencia.armas],
    ["Herramientas", competencia.herramientas],
    ["Idiomas", competencia.idiomas],
  ];
  return (
    <section className="box">
      <EditH2 title="Entrenamiento y competencias" onEdit={onEdit} />
      {grupos.map(([titulo, items]) => (
        <div key={titulo} className="train-group">
          <div className="muted">{titulo}</div>
          {items.length > 0 ? (
            <div className="chips">
              {items.map((it, i) => (
                <span className="chip" key={i}>
                  {it}
                </span>
              ))}
            </div>
          ) : (
            <span className="muted">-</span>
          )}
        </div>
      ))}
    </section>
  );
}

function ConjurosBox({
  conjuros,
  edit,
  onEdit,
}: {
  conjuros: Conjuros | null;
  edit: Edit;
  onEdit: () => void;
}) {
  const espacios = conjuros
    ? Object.entries(conjuros.espacios).sort((a, b) => Number(a[0]) - Number(b[0]))
    : [];
  const lista = conjuros?.lista ?? [];
  return (
    <section className="box section-mt">
      <EditH2 title="Conjuros" onEdit={onEdit} />
      <div className="combat">
        <Stat
          v={conjuros ? ABREV_CARACTERISTICA[conjuros.caracteristica_lanzamiento] : "-"}
          l="Caracteristica"
        />
        <Stat v={conjuros ? conjuros.cd_salvacion : "-"} l="CD salvacion" />
        <Stat v={conjuros ? conSigno(conjuros.bono_ataque) : "-"} l="Bono de ataque" />
      </div>
      <div className="section-mt">
        <b>Espacios:</b>{" "}
        {espacios.length > 0 ? (
          <span className="chips">
            {espacios.map(([nivel, e]) => (
              <span className="chip slot-chip" key={nivel}>
                Nv {nivel}:
                <button
                  className="step"
                  aria-label={`Recuperar espacio nivel ${nivel}`}
                  onClick={() =>
                    edit((s) => {
                      const cur = s.conjuros!.espacios[nivel];
                      cur.gastados = Math.max(0, cur.gastados - 1);
                    })
                  }
                >
                  -
                </button>
                {e.gastados}/{e.total}
                <button
                  className="step"
                  aria-label={`Gastar espacio nivel ${nivel}`}
                  onClick={() =>
                    edit((s) => {
                      const cur = s.conjuros!.espacios[nivel];
                      cur.gastados = Math.min(cur.total, cur.gastados + 1);
                    })
                  }
                >
                  +
                </button>
              </span>
            ))}
          </span>
        ) : (
          VACIO
        )}
      </div>
      <div className="section-mt">
        {lista.length > 0 ? (
          <div className="spells">
            <div className="spell-row head">
              <span>Nv</span>
              <span>Nombre</span>
              <span>Lanz.</span>
              <span>Alcance</span>
              <span>C/R/M</span>
              <span>Prep.</span>
            </div>
            {lista
              .slice()
              .sort((a, b) => a.nivel - b.nivel)
              .map((c, i) => (
                <div className="spell-row" key={i}>
                  <span>{c.nivel === 0 ? "T" : c.nivel}</span>
                  <span>
                    {c.nombre}
                    {c.notas ? <span className="muted"> - {c.notas}</span> : null}
                  </span>
                  <span className="muted">{c.tiempo_lanzamiento ?? "-"}</span>
                  <span className="muted">{c.alcance ?? "-"}</span>
                  <span className="muted">
                    {[c.concentracion ? "C" : "", c.ritual ? "R" : "", c.material ? "M" : ""]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </span>
                  <span>{c.preparado ? "Si" : "-"}</span>
                </div>
              ))}
          </div>
        ) : (
          <span className="muted">Sin conjuros.</span>
        )}
      </div>
    </section>
  );
}

