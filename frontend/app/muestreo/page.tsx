'use client';
import { useEffect, useState } from 'react';
import { getSampling } from '@/lib/api';
import Link from 'next/link';

interface SamplingData {
  total: number; qualified: number; target: number;
  zonas:  { zona: string;  done: number; target: number; left: number }[];
  rubros: { rubro: string; done: number; target: number; left: number }[];
}

function SegmentBar({ name, done, target, left }: { name: string; done: number; target: number; left: number }) {
  const pct = Math.min(100, Math.round(done/target*100));
  const complete = done >= target;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{name}</span>
        <span className="font-medium text-gray-900">{done}/{target}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: complete ? 'var(--green)' : undefined }}/>
      </div>
      <p className="text-[11px] mt-0.5" style={{ color: complete ? 'var(--green)' : '#888' }}>
        {complete ? '✓ Completo' : `Faltan ${left}`}
      </p>
    </div>
  );
}

export default function MuestreoPage() {
  const [data, setData] = useState<SamplingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSampling().then(setData).finally(() => setLoading(false));
  }, []);

  const totalPct = data ? Math.min(100, Math.round(data.qualified / data.target * 100)) : 0;

  return (
    <div className="flex flex-col flex-1">
      <nav style={{ background: 'var(--teal)' }} className="px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-white/80 text-sm">← Encuesta</Link>
        <span className="text-white font-medium text-[15px]">Muestreo</span>
        <Link href="/dashboard" className="text-white/80 text-xs bg-white/15 px-3 py-1 rounded-full">Dashboard</Link>
      </nav>

      <div className="flex-1 p-4 overflow-y-auto">
        {loading && <p className="text-sm text-gray-500 text-center py-8">Cargando...</p>}
        {data && <>

          {/* Total progress */}
          <div className="border border-gray-200 rounded-xl p-4 text-center mb-3">
            <p className="text-sm text-gray-500 mb-1">Meta total de encuestas</p>
            <p className="text-3xl font-medium mb-2">{data.qualified} / {data.target}</p>
            <div className="progress-bar mb-1"><div className="progress-fill" style={{ width: `${totalPct}%` }}/></div>
            <p className="text-xs text-gray-500">
              {data.qualified >= data.target ? '🎉 ¡Meta alcanzada!' : `Faltan ${data.target - data.qualified} encuestas válidas`}
            </p>
          </div>

          {/* Zonas */}
          <div className="border border-gray-200 rounded-xl p-4 mb-3">
            <p className="text-xs text-gray-500 font-medium mb-4">Por zona</p>
            {data.zonas.map(z => <SegmentBar key={z.zona} name={z.zona} done={z.done} target={z.target} left={z.left}/>)}
          </div>

          {/* Rubros */}
          <div className="border border-gray-200 rounded-xl p-4 mb-3">
            <p className="text-xs text-gray-500 font-medium mb-4">Por rubro</p>
            {data.rubros.map(r => <SegmentBar key={r.rubro} name={r.rubro} done={r.done} target={r.target} left={r.left}/>)}
          </div>

          {/* Summary */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-3">Resumen de campo</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="metric-card"><div className="metric-label">Totales</div><div className="metric-value">{data.total}</div></div>
              <div className="metric-card"><div className="metric-label">Válidas</div><div className="metric-value">{data.qualified}</div></div>
              <div className="metric-card"><div className="metric-label">% Calificación</div><div className="metric-value">{data.total ? Math.round(data.qualified/data.total*100) : 0}%</div></div>
              <div className="metric-card"><div className="metric-label">Zonas completas</div><div className="metric-value">{data.zonas.filter(z=>z.done>=z.target).length}/{data.zonas.length}</div></div>
            </div>
          </div>

        </>}
      </div>
    </div>
  );
}
