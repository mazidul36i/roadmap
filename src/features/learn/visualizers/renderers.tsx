import { motion } from "framer-motion";
import { useId } from "react";
import type { ArrayState, GraphState, GridState, ListState, Pointer, TableState, VizState } from "./types";
import s from "./Visualizer.module.css";

function Vars({ vars }: { vars?: Array<[string, string | number]> }) {
  if (!vars?.length) return null;
  return (
    <div className={s.vars}>
      {vars.map(([k, v]) => (
        <span key={k} className={s.var}>
          <b>{k}</b> {v}
        </span>
      ))}
    </div>
  );
}

function PointerRow({ pointers, length }: { pointers: Pointer[]; length: number }) {
  // Several pointers on one index stack into a single label.
  const byIndex = new Map<number, Pointer[]>();
  for (const p of pointers) byIndex.set(p.index, [...(byIndex.get(p.index) ?? []), p]);
  return (
    <div className={s.ptrRow} style={{ gridTemplateColumns: `repeat(${length}, 48px)` }}>
      {pointers.map(p => {
        const group = byIndex.get(p.index)!;
        const offset = group.indexOf(p);
        return (
          <motion.span
            key={p.label}
            layout
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={s.ptr}
            data-tone={p.tone ?? "brand"}
            style={{ gridColumn: p.index + 1, gridRow: offset + 1 }}
          >
            {p.label}
          </motion.span>
        );
      })}
    </div>
  );
}

function ArrayView({ state }: { state: ArrayState }) {
  return (
    <>
      <div className={s.arrayWrap}>
        <div className={s.rows}>
          {state.rows.map((row, r) => (
            <div key={r} className={row.label ? s.row : `${s.row} ${s.noLabel}`}>
              {row.label && <span className={s.rowLabel}>{row.label}</span>}
              <div>
                <div className={s.cellsGrid}>
                  {row.cells.map((c, i) => (
                    <div key={i}>
                      <div className={`${s.cell} ${s.arrCell}`} data-tone={c.tone ?? "default"}>
                        {c.value}
                      </div>
                      {(row.showIndex || c.sub) && <div className={s.index}>{c.sub ?? i}</div>}
                    </div>
                  ))}
                </div>
                {row.pointers && <PointerRow pointers={row.pointers} length={row.cells.length} />}
              </div>
            </div>
          ))}
        </div>
        {state.stack && (
          <div className={s.stackPanel}>
            <span className={s.stackLabel}>{state.stack.label} ↑ top</span>
            <div className={s.stackItems}>
              {state.stack.items.map((item, i) => (
                <motion.div key={`${item}-${i}`} className={s.stackItem} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Vars vars={state.vars} />
    </>
  );
}

function GridView({ state }: { state: GridState }) {
  const cols = state.cells[0]?.length ?? 0;
  return (
    <>
      <div className={s.gridWrap}>
        <div className={s.grid} style={{ gridTemplateColumns: `repeat(${cols}, 44px)` }} role="grid" aria-label="Grid">
          {state.cells.flatMap((row, r) =>
            row.map((c, col) => (
              <div key={`${r}-${col}`} role="gridcell" className={`${s.cell} ${s.gridCell}`} data-tone={c.tone ?? "default"}>
                {c.value}
              </div>
            )),
          )}
        </div>
        {state.queue && (
          <div className={s.queue}>
            <span className={s.stackLabel}>queue (front → back)</span>
            <div className={s.chips}>
              {state.queue.length ? state.queue.map((q, i) => <span key={`${q}-${i}`} className={s.chip}>{q}</span>) : <span className="u-xs u-faint">empty</span>}
            </div>
          </div>
        )}
      </div>
      <Vars vars={state.vars} />
    </>
  );
}

const W = 640;
const H = 300;

function GraphView({ state }: { state: GraphState }) {
  const marker = useId().replace(/:/g, "");
  const pos = new Map(state.nodes.map(n => [n.id, { x: (n.x / 100) * W, y: (n.y / 100) * H }]));
  const nodeW = (label: string) => Math.max(44, label.length * 9 + 18);
  return (
    <>
      <svg className={s.graphSvg} viewBox={`-10 -10 ${W + 20} ${H + 20}`} role="img" aria-label="Graph">
        <defs>
          <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className={s.arrowHead} />
          </marker>
        </defs>
        {state.edges.map(e => {
          const a = pos.get(e.from)!;
          const b = pos.get(e.to)!;
          const toNode = state.nodes.find(n => n.id === e.to)!;
          // Stop the line at the target box's edge so the arrow head is visible.
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const pad = e.directed ? Math.min(nodeW(toNode.label) / 2, 30) + 4 : 0;
          const line = (
            <line
              key={`${e.from}-${e.to}`}
              className={s.edge}
              data-tone={e.tone ?? "default"}
              x1={a.x}
              y1={a.y}
              x2={b.x - (dx / len) * pad}
              y2={b.y - (dy / len) * pad}
              markerEnd={e.directed ? `url(#${marker})` : undefined}
            />
          );
          if (!e.label) return line;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          return (
            <g key={`${e.from}-${e.to}`}>
              {line}
              <g className={s.edgeLabel} data-tone={e.tone ?? "default"} transform={`translate(${mx}, ${my})`}>
                <rect x={-11} y={-10} width={22} height={20} rx={6} />
                <text textAnchor="middle" dominantBaseline="central">
                  {e.label}
                </text>
              </g>
            </g>
          );
        })}
        {state.nodes.map(n => {
          const p = pos.get(n.id)!;
          const w = nodeW(n.label);
          return (
            <g key={n.id} className={s.node} data-tone={n.tone ?? "default"} transform={`translate(${p.x}, ${p.y})`}>
              <rect className={s.nodeRect} x={-w / 2} y={-17} width={w} height={34} rx={9} />
              <text className={s.nodeText} textAnchor="middle" dominantBaseline="central">
                {n.label}
              </text>
              {n.badge !== undefined && (
                <g transform={`translate(${w / 2 - 2}, -16)`}>
                  <circle className={s.badgeCircle} r={10} />
                  <text className={s.badgeText} textAnchor="middle" dominantBaseline="central">
                    {n.badge}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {state.lists?.map(list => (
        <div key={list.label} className="u-row" style={{ alignItems: "flex-start" }}>
          <span className={s.stackLabel} style={{ minWidth: 64, paddingTop: 4 }}>
            {list.label}
          </span>
          <div className={s.chips}>
            {list.items.length ? list.items.map((it, i) => <span key={`${it}-${i}`} className={s.chip}>{it}</span>) : <span className="u-xs u-faint">empty</span>}
          </div>
        </div>
      ))}
      <Vars vars={state.vars} />
    </>
  );
}

function TableView({ state }: { state: TableState }) {
  return (
    <>
      <table className={s.table}>
        <thead>
          <tr>
            <th />
            {state.colHeaders.map((h, j) => (
              <th key={j} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.cells.map((row, i) => (
            <tr key={i}>
              <th scope="row">{state.rowHeaders[i]}</th>
              {row.map((c, j) => (
                <td key={j}>
                  <div className={`${s.cell} ${s.tableCell}`} data-tone={c.tone ?? "default"}>
                    {c.value}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Vars vars={state.vars} />
    </>
  );
}

function ListView({ state }: { state: ListState }) {
  const marker = useId().replace(/:/g, "");
  const gap = 84;
  const r = 22;
  const y = 70;
  const xOf = (i: number) => 40 + i * gap;
  const width = xOf(state.nodes.length - 1) + 60;
  const ptrTone = (t?: string) => (t === "info" ? "var(--info)" : "var(--brand)");
  return (
    <>
      <svg className={s.listSvg} viewBox={`0 0 ${width} 170`} role="img" aria-label="Linked list">
        <defs>
          <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className={s.arrowHead} />
          </marker>
        </defs>
        {state.nodes.slice(0, -1).map((_, i) => (
          <line key={i} className={s.edge} x1={xOf(i) + r} y1={y} x2={xOf(i + 1) - r - 3} y2={y} markerEnd={`url(#${marker})`} />
        ))}
        {state.cycleTo !== null && (
          <path
            className={s.edge}
            fill="none"
            d={`M ${xOf(state.nodes.length - 1)} ${y - r} C ${xOf(state.nodes.length - 1)} ${y - 70}, ${xOf(state.cycleTo)} ${y - 70}, ${xOf(state.cycleTo)} ${y - r - 3}`}
            markerEnd={`url(#${marker})`}
          />
        )}
        {state.nodes.map((n, i) => (
          <g key={i} transform={`translate(${xOf(i)}, ${y})`}>
            <circle className={s.listNode} data-tone={n.tone ?? "default"} r={r} />
            <text className={s.nodeText} textAnchor="middle" dominantBaseline="central">
              {n.value}
            </text>
          </g>
        ))}
        {state.pointers.map(p => {
          const same = state.pointers.filter(q => q.index === p.index);
          const offset = same.indexOf(p) * 16;
          return (
            <motion.text
              key={p.label}
              className={s.listPtr}
              textAnchor="middle"
              fill={ptrTone(p.tone)}
              initial={false}
              animate={{ x: xOf(p.index), y: y + r + 22 + offset }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              {p.label}
            </motion.text>
          );
        })}
      </svg>
      <Vars vars={state.vars} />
    </>
  );
}

export function VizRenderer({ state }: { state: VizState }) {
  switch (state.kind) {
    case "array":
      return <ArrayView state={state} />;
    case "grid":
      return <GridView state={state} />;
    case "graph":
      return <GraphView state={state} />;
    case "table":
      return <TableView state={state} />;
    case "list":
      return <ListView state={state} />;
  }
}
