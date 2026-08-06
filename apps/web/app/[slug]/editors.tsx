"use client";

import type { Caracteristica, CharacterSheet, Habilidad } from "@/lib/sheet";
import { emptyConjuros } from "@/lib/sheet";
import {
  ALINEAMIENTOS,
  ARMADURAS,
  ARMAS,
  CARACTERISTICAS,
  CLASES,
  ESPECIES,
  HABILIDADES,
  HERRAMIENTAS,
  IDIOMAS,
  LABEL_CARACTERISTICA,
  LABEL_HABILIDAD,
  SUBCLASES,
  TAMANOS,
  TRASFONDOS,
} from "@/lib/derive";

export type Edit = (mut: (s: CharacterSheet) => void) => void;

const num = (v: string) => (v === "" ? 0 : Number(v));
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const ORIGENES = ["clase", "especie", "trasfondo", "dote"] as const;
const NIVELES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="modal-body form">{children}</div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Campos reutilizables ---

function Num({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(num(e.target.value))}
      />
    </label>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Sel({
  label,
  value,
  options,
  onChange,
  empty,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  empty?: boolean;
}) {
  const opts = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {empty && <option value="">-</option>}
        {opts.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Checks({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="check-grid">
        {options.map((o) => (
          <label key={o.value} className="check">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={(e) => {
                const set = new Set(selected);
                e.target.checked ? set.add(o.value) : set.delete(o.value);
                onChange(options.map((x) => x.value).filter((v) => set.has(v)));
              }}
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function ListEditor<T>({
  title,
  rows,
  onAdd,
  onRemove,
  render,
  rowClass,
}: {
  title: string;
  rows: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  render: (row: T, i: number) => React.ReactNode;
  rowClass?: string;
}) {
  return (
    <div className="list-block">
      <div className="list-head">
        <span className="field-label">{title}</span>
        <button type="button" className="btn-add" onClick={onAdd}>
          + Agregar
        </button>
      </div>
      {rows.length === 0 && <p className="muted">Sin {title.toLowerCase()}.</p>}
      {rows.map((row, i) => (
        <div className={`list-row ${rowClass ?? ""}`} key={i}>
          {render(row, i)}
          <button type="button" className="btn-remove" onClick={() => onRemove(i)}>
            Quitar
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Modales por seccion ---

export function IdentityModal({
  sheet,
  edit,
  onClose,
}: {
  sheet: CharacterSheet;
  edit: Edit;
  onClose: () => void;
}) {
  const { identidad } = sheet;
  return (
    <Modal title="Editar identidad" onClose={onClose}>
      <div className="form-grid">
        <Text label="Nombre" value={sheet.nombre} onChange={(v) => edit((s) => (s.nombre = v))} />
        <Sel
          label="Especie"
          value={identidad.especie}
          options={ESPECIES}
          onChange={(v) => edit((s) => (s.identidad.especie = v))}
        />
        <Sel
          label="Clase"
          value={identidad.clase}
          options={CLASES}
          onChange={(v) =>
            edit((s) => {
              s.identidad.clase = v;
              if (!(SUBCLASES[v] ?? []).includes(s.identidad.subclase ?? "")) {
                s.identidad.subclase = null;
              }
            })
          }
        />
        <Sel
          label="Subclase"
          value={identidad.subclase ?? ""}
          options={SUBCLASES[identidad.clase] ?? []}
          empty
          onChange={(v) => edit((s) => (s.identidad.subclase = v || null))}
        />
        <Sel
          label="Trasfondo"
          value={identidad.trasfondo}
          options={TRASFONDOS}
          onChange={(v) => edit((s) => (s.identidad.trasfondo = v))}
        />
        <Sel
          label="Alineamiento"
          value={identidad.alineamiento ?? ""}
          options={ALINEAMIENTOS}
          empty
          onChange={(v) => edit((s) => (s.identidad.alineamiento = v || null))}
        />
        <Num
          label="Nivel"
          min={1}
          max={20}
          value={identidad.nivel}
          onChange={(n) => edit((s) => (s.identidad.nivel = clamp(n, 1, 20)))}
        />
        <Num
          label="Puntos de experiencia"
          min={0}
          value={identidad.px}
          onChange={(n) => edit((s) => (s.identidad.px = Math.max(0, n)))}
        />
        <Sel
          label="Tamano"
          value={identidad.tamano}
          options={TAMANOS}
          onChange={(v) => edit((s) => (s.identidad.tamano = v))}
        />
      </div>
    </Modal>
  );
}

export function CombatModal({
  sheet,
  edit,
  onClose,
}: {
  sheet: CharacterSheet;
  edit: Edit;
  onClose: () => void;
}) {
  const { combate } = sheet;
  return (
    <Modal title="Combate" onClose={onClose}>
      <div className="form-grid">
        <Num label="Clase de armadura" value={combate.ca} onChange={(n) => edit((s) => (s.combate.ca = n))} />
        <Num
          label="Iniciativa"
          value={combate.iniciativa}
          onChange={(n) => edit((s) => (s.combate.iniciativa = n))}
        />
        <Num
          label="Velocidad"
          value={combate.velocidad}
          onChange={(n) => edit((s) => (s.combate.velocidad = n))}
        />
        <Num
          label="PG maximos"
          min={0}
          value={combate.pg_max}
          onChange={(n) => edit((s) => (s.combate.pg_max = n))}
        />
        <Text
          label="Dados de golpe (ej. 4d12)"
          value={combate.dados_golpe}
          onChange={(v) => edit((s) => (s.combate.dados_golpe = v))}
        />
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={combate.escudo}
          onChange={(e) => edit((s) => (s.combate.escudo = e.target.checked))}
        />
        Escudo
      </label>
    </Modal>
  );
}

export function StatsModal({
  sheet,
  edit,
  onClose,
}: {
  sheet: CharacterSheet;
  edit: Edit;
  onClose: () => void;
}) {
  const { caracteristicas, competencia } = sheet;
  return (
    <Modal title="Caracteristicas y competencias" onClose={onClose}>
      <div className="form-grid">
        {CARACTERISTICAS.map((c) => (
          <Num
            key={c}
            label={LABEL_CARACTERISTICA[c]}
            min={1}
            max={30}
            value={caracteristicas[c]}
            onChange={(n) => edit((s) => (s.caracteristicas[c] = n))}
          />
        ))}
        <Num
          label="Bono de competencia"
          min={0}
          value={competencia.bono}
          onChange={(n) => edit((s) => (s.competencia.bono = n))}
        />
      </div>
      <Checks
        label="Salvaciones (competente)"
        options={CARACTERISTICAS.map((c) => ({ value: c, label: LABEL_CARACTERISTICA[c] }))}
        selected={competencia.salvaciones}
        onChange={(next) => edit((s) => (s.competencia.salvaciones = next as Caracteristica[]))}
      />
      <Checks
        label="Habilidades (competente)"
        options={HABILIDADES.map((h) => ({ value: h, label: LABEL_HABILIDAD[h] }))}
        selected={competencia.habilidades}
        onChange={(next) => edit((s) => (s.competencia.habilidades = next as Habilidad[]))}
      />
      <Checks
        label="Armaduras"
        options={ARMADURAS}
        selected={competencia.armaduras}
        onChange={(next) => edit((s) => (s.competencia.armaduras = next))}
      />
      <Checks
        label="Armas"
        options={ARMAS}
        selected={competencia.armas}
        onChange={(next) => edit((s) => (s.competencia.armas = next))}
      />
      <Checks
        label="Herramientas"
        options={HERRAMIENTAS.map((t) => ({ value: t, label: t }))}
        selected={competencia.herramientas}
        onChange={(next) => edit((s) => (s.competencia.herramientas = next))}
      />
      <Checks
        label="Idiomas"
        options={IDIOMAS.map((i) => ({ value: i, label: i }))}
        selected={competencia.idiomas}
        onChange={(next) => edit((s) => (s.competencia.idiomas = next))}
      />
    </Modal>
  );
}

export function AtaquesModal({
  sheet,
  edit,
  onClose,
}: {
  sheet: CharacterSheet;
  edit: Edit;
  onClose: () => void;
}) {
  return (
    <Modal title="Armas y trucos de dano" onClose={onClose}>
      <ListEditor
        title="Ataques"
        rowClass="attack-form-row"
        rows={sheet.ataques}
        onAdd={() =>
          edit((s) => s.ataques.push({ nombre: "", bono_ataque: "", dano: "", tipo: "", notas: null }))
        }
        onRemove={(i) => edit((s) => s.ataques.splice(i, 1))}
        render={(a, i) => (
          <>
            <input
              placeholder="Nombre"
              value={a.nombre}
              onChange={(e) => edit((s) => (s.ataques[i].nombre = e.target.value))}
            />
            <input
              placeholder="Bonif./CD"
              value={a.bono_ataque}
              onChange={(e) => edit((s) => (s.ataques[i].bono_ataque = e.target.value))}
            />
            <input
              placeholder="Dano"
              value={a.dano}
              onChange={(e) => edit((s) => (s.ataques[i].dano = e.target.value))}
            />
            <input
              placeholder="Tipo"
              value={a.tipo}
              onChange={(e) => edit((s) => (s.ataques[i].tipo = e.target.value))}
            />
            <input
              className="grow"
              placeholder="Notas"
              value={a.notas ?? ""}
              onChange={(e) => edit((s) => (s.ataques[i].notas = e.target.value || null))}
            />
          </>
        )}
      />
    </Modal>
  );
}

export function RasgosModal({
  sheet,
  edit,
  onClose,
}: {
  sheet: CharacterSheet;
  edit: Edit;
  onClose: () => void;
}) {
  return (
    <Modal title="Rasgos (clase, especie, trasfondo)" onClose={onClose}>
      <p className="muted modal-hint">
        El nivel es el nivel de personaje al que se obtiene el rasgo (se muestra como &quot;Nivel
        X&quot; en la hoja). Dejalo vacio para rasgos de especie o trasfondo.
      </p>
      <ListEditor
        title="Rasgos"
        rowClass="rasgo-row"
        rows={sheet.rasgos}
        onAdd={() =>
          edit((s) => s.rasgos.push({ nombre: "", descripcion: "", origen: "clase", nivel: null }))
        }
        onRemove={(i) => edit((s) => s.rasgos.splice(i, 1))}
        render={(r, i) => (
          <>
            <label className="mini-field rasgo-nombre">
              <span className="field-label">Nombre</span>
              <input
                placeholder="Nombre del rasgo"
                value={r.nombre}
                onChange={(e) => edit((s) => (s.rasgos[i].nombre = e.target.value))}
              />
            </label>
            <label className="mini-field">
              <span className="field-label">Origen</span>
              <select
                value={r.origen}
                onChange={(e) => edit((s) => (s.rasgos[i].origen = e.target.value as (typeof ORIGENES)[number]))}
              >
                {ORIGENES.map((o) => (
                  <option key={o} value={o}>
                    {o[0].toUpperCase() + o.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="mini-field">
              <span className="field-label">Nivel</span>
              <input
                type="number"
                min={1}
                max={20}
                placeholder="-"
                value={r.nivel ?? ""}
                onChange={(e) =>
                  edit((s) => (s.rasgos[i].nivel = e.target.value === "" ? null : num(e.target.value)))
                }
              />
            </label>
            <textarea
              className="rasgo-desc"
              rows={2}
              placeholder="Descripcion"
              value={r.descripcion}
              onChange={(e) => edit((s) => (s.rasgos[i].descripcion = e.target.value))}
            />
          </>
        )}
      />
    </Modal>
  );
}

export function DotesModal({
  sheet,
  edit,
  onClose,
}: {
  sheet: CharacterSheet;
  edit: Edit;
  onClose: () => void;
}) {
  return (
    <Modal title="Dotes" onClose={onClose}>
      <ListEditor
        title="Dotes"
        rows={sheet.dotes}
        onAdd={() => edit((s) => s.dotes.push({ nombre: "", descripcion: "" }))}
        onRemove={(i) => edit((s) => s.dotes.splice(i, 1))}
        render={(d, i) => (
          <>
            <input
              placeholder="Nombre"
              value={d.nombre}
              onChange={(e) => edit((s) => (s.dotes[i].nombre = e.target.value))}
            />
            <input
              className="grow"
              placeholder="Descripcion"
              value={d.descripcion}
              onChange={(e) => edit((s) => (s.dotes[i].descripcion = e.target.value))}
            />
          </>
        )}
      />
    </Modal>
  );
}

export function EquipoModal({
  sheet,
  edit,
  onClose,
}: {
  sheet: CharacterSheet;
  edit: Edit;
  onClose: () => void;
}) {
  const { equipo } = sheet;
  return (
    <Modal title="Equipo" onClose={onClose}>
      <ListEditor
        title="Objetos"
        rows={equipo.objetos}
        onAdd={() =>
          edit((s) => s.equipo.objetos.push({ nombre: "", cantidad: 1, peso: 0, equipado: false, notas: null }))
        }
        onRemove={(i) => edit((s) => s.equipo.objetos.splice(i, 1))}
        render={(o, i) => (
          <>
            <input
              placeholder="Nombre"
              value={o.nombre}
              onChange={(e) => edit((s) => (s.equipo.objetos[i].nombre = e.target.value))}
            />
            <input
              type="number"
              min={0}
              placeholder="Cant."
              value={o.cantidad}
              onChange={(e) => edit((s) => (s.equipo.objetos[i].cantidad = num(e.target.value)))}
            />
            <input
              type="number"
              min={0}
              step={0.1}
              placeholder="Peso"
              value={o.peso}
              onChange={(e) => edit((s) => (s.equipo.objetos[i].peso = num(e.target.value)))}
            />
            <label className="check">
              <input
                type="checkbox"
                checked={o.equipado}
                onChange={(e) => edit((s) => (s.equipo.objetos[i].equipado = e.target.checked))}
              />
              Equip.
            </label>
            <input
              className="grow"
              placeholder="Notas"
              value={o.notas ?? ""}
              onChange={(e) => edit((s) => (s.equipo.objetos[i].notas = e.target.value || null))}
            />
          </>
        )}
      />
      <div className="form-grid">
        {(["cobre", "plata", "electro", "oro", "platino"] as const).map((m) => (
          <Num
            key={m}
            label={`${m[0].toUpperCase()}${m.slice(1)}`}
            min={0}
            value={equipo.monedas[m]}
            onChange={(n) => edit((s) => (s.equipo.monedas[m] = n))}
          />
        ))}
      </div>
      <Text
        label="Sintonizacion (separada por coma)"
        value={equipo.sintonizacion.join(", ")}
        onChange={(v) =>
          edit(
            (s) =>
              (s.equipo.sintonizacion = v
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)),
          )
        }
      />
    </Modal>
  );
}

export function ConjurosModal({
  sheet,
  edit,
  onClose,
}: {
  sheet: CharacterSheet;
  edit: Edit;
  onClose: () => void;
}) {
  const c = sheet.conjuros;
  return (
    <Modal title="Conjuros" onClose={onClose}>
      <label className="check">
        <input
          type="checkbox"
          checked={c !== null}
          onChange={(e) => edit((s) => (s.conjuros = e.target.checked ? emptyConjuros() : null))}
        />
        Es lanzador de conjuros
      </label>
      {c && (
        <>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Caracteristica</span>
              <select
                value={c.caracteristica_lanzamiento}
                onChange={(e) =>
                  edit((s) => (s.conjuros!.caracteristica_lanzamiento = e.target.value as Caracteristica))
                }
              >
                {CARACTERISTICAS.map((x) => (
                  <option key={x} value={x}>
                    {LABEL_CARACTERISTICA[x]}
                  </option>
                ))}
              </select>
            </label>
            <Num
              label="CD salvacion"
              value={c.cd_salvacion}
              onChange={(n) => edit((s) => (s.conjuros!.cd_salvacion = n))}
            />
            <Num
              label="Bono de ataque"
              value={c.bono_ataque}
              onChange={(n) => edit((s) => (s.conjuros!.bono_ataque = n))}
            />
          </div>
          <div className="field">
            <span className="field-label">Espacios por nivel</span>
            <div className="form-grid">
              {NIVELES.map((n) => {
                const e = c.espacios[n] ?? { total: 0, gastados: 0 };
                return (
                  <div key={n} className="slot-row">
                    <span className="slot-lvl">Nivel {n}</span>
                    <input
                      type="number"
                      min={0}
                      aria-label={`Total nivel ${n}`}
                      value={e.total}
                      onChange={(ev) =>
                        edit((s) => {
                          const cur = s.conjuros!.espacios[n] ?? { total: 0, gastados: 0 };
                          s.conjuros!.espacios[n] = { ...cur, total: num(ev.target.value) };
                        })
                      }
                    />
                    <input
                      type="number"
                      min={0}
                      aria-label={`Gastados nivel ${n}`}
                      value={e.gastados}
                      onChange={(ev) =>
                        edit((s) => {
                          const cur = s.conjuros!.espacios[n] ?? { total: 0, gastados: 0 };
                          s.conjuros!.espacios[n] = { ...cur, gastados: num(ev.target.value) };
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <ListEditor
            title="Conjuros conocidos"
            rows={c.lista}
            onAdd={() =>
              edit((s) =>
                s.conjuros!.lista.push({
                  nivel: 0,
                  nombre: "",
                  tiempo_lanzamiento: null,
                  alcance: null,
                  concentracion: false,
                  ritual: false,
                  material: false,
                  notas: null,
                  preparado: false,
                }),
              )
            }
            onRemove={(i) => edit((s) => s.conjuros!.lista.splice(i, 1))}
            render={(sp, i) => (
              <>
                <input
                  type="number"
                  min={0}
                  max={9}
                  placeholder="Nv"
                  value={sp.nivel}
                  onChange={(e) => edit((s) => (s.conjuros!.lista[i].nivel = num(e.target.value)))}
                />
                <input
                  placeholder="Nombre"
                  value={sp.nombre}
                  onChange={(e) => edit((s) => (s.conjuros!.lista[i].nombre = e.target.value))}
                />
                <input
                  placeholder="Alcance"
                  value={sp.alcance ?? ""}
                  onChange={(e) => edit((s) => (s.conjuros!.lista[i].alcance = e.target.value || null))}
                />
                <label className="check">
                  <input
                    type="checkbox"
                    checked={sp.preparado}
                    onChange={(e) => edit((s) => (s.conjuros!.lista[i].preparado = e.target.checked))}
                  />
                  Prep.
                </label>
              </>
            )}
          />
        </>
      )}
    </Modal>
  );
}
