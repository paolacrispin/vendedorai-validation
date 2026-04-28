'use client';
import { useEffect, useState, useRef } from 'react';
import { getMetrics, EXPORT_CSV_URL, EXPORT_JSON_URL } from '@/lib/api';
import Link from 'next/link';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface Metrics {
  total: number; qualified: number; interested: number;
  willing_to_pay: number; avg_price: number; avg_pain: number;
  by_zona: {zona: string; qualified: number; total: number}[];
  by_rubro: {rubro: string; qualified: number; total: number}[];
  by_price: {price_range: string; cnt: number}[];
  by_problem: {problema: string; cnt: number}[];
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMetrics().then(setMetrics).finally(() => setLoading(false));
  }, []);

  function pct(a: number, b: number) { return b ? Math.round(a/b*100) : 0; }

  const alerts = [];
  if (metrics && +metrics.total >= 5) {
    const unqPct = pct(+metrics.total - +metrics.qualified, +metrics.total);
    if (unqPct > 60) alerts.push({ type: 'warn', msg: `⚠️ ${unqPct}% de encuestados no califica. Considera ajustar el perfil objetivo.` });
  }
  if (metrics && +metrics.willing_to_pay >= 3 && +metrics.qualified >= 5) {
    const payPct = pct(+metrics.willing_to_pay, +metrics.qualified);
    if (payPct < 30) alerts.push({ type: 'warn', msg: `⚠️ Baja disposición de pago (${payPct}%). Revisa el rango de precios.` });
    if (payPct >= 60) alerts.push({ type: 'success', msg: `✓ Alta disposición de pago (${payPct}%). Muy buena señal de mercado.` });
  }

  const funnelSteps = metrics ? [
    { label: 'Total encuestados',   val: +metrics.total,          color: '#185FA5' },
    { label: 'Calificados',         val: +metrics.qualified,       color: '#1D9E75' },
    { label: 'Interesados',         val: +metrics.interested,      color: '#BA7517' },
    { label: 'Dispuestos a pagar',  val: +metrics.willing_to_pay,  color: '#A32D2D' },
  ] : [];

  return (
    <div className="flex flex-col flex-1">
      <nav style={{ background: 'var(--teal)' }} className="px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-white/80 text-sm">← Encuesta</Link>
        <span className="text-white font-medium text-[15px]">Dashboard</span>
        <Link href="/muestreo" className="text-white/80 text-xs bg-white/15 px-3 py-1 rounded-full">Muestreo</Link>
      </nav>

      <div className="flex-1 p-4 overflow-y-auto">
        {loading && <p className="text-sm text-gray-500 text-center py-8">Cargando métricas...</p>}
        {!loading && !metrics && <p className="text-sm text-red-500 text-center py-8">Error al cargar. Verifica la conexión.</p>}

        {metrics && <>
          {alerts.map((a,i) => <div key={i} className={`alert alert-${a.type}`}>{a.msg}</div>)}

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {[
              { label: 'Total encuestas',    val: metrics.total },
              { label: 'Calificadas',        val: metrics.qualified },
              { label: '% Conversión',       val: pct(+metrics.qualified, +metrics.total)+'%' },
              { label: '% Interesados',      val: pct(+metrics.interested, +metrics.qualified)+'%' },
              { label: 'Dispuestos pagar',   val: pct(+metrics.willing_to_pay, +metrics.qualified)+'%' },
              { label: 'Precio promedio',    val: metrics.avg_price ? `Bs. ${metrics.avg_price}` : '—' },
            ].map(m => (
              <div key={m.label} className="metric-card">
                <div className="metric-label">{m.label}</div>
                <div className="metric-value">{m.val || '—'}</div>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div className="border border-gray-200 rounded-xl p-4 mb-3">
            <p className="text-xs text-gray-500 mb-3 font-medium">Embudo de conversión</p>
            <div className="flex flex-col gap-1.5">
              {funnelSteps.map((s,i) => (
                <div key={i} style={{ background: s.color+'18', borderLeft: `3px solid ${s.color}` }} className="rounded-lg px-3 py-2.5 flex justify-between">
                  <span style={{ color: s.color }} className="text-sm font-medium">{s.label}</span>
                  <span style={{ color: s.color }} className="text-sm font-medium">{s.val} <span className="font-normal text-xs">({pct(s.val, +metrics.total)}%)</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar: payment */}
          {metrics.by_price.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-4 mb-3">
              <p className="text-xs text-gray-500 mb-3 font-medium">Disposición de pago por rango</p>
              <div style={{ height: 200 }}>
                <Bar aria-label="Gráfico de disposición de pago" data={{
                  labels: metrics.by_price.map(p=>p.price_range.replace('Bs. ','')),
                  datasets: [{ data: metrics.by_price.map(p=>+p.cnt), backgroundColor: '#1D9E7570', borderColor: '#1D9E75', borderWidth: 1 }]
                }} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{ticks:{stepSize:1}}} }}/>
              </div>
            </div>
          )}

          {/* Doughnut: rubros */}
          {metrics.by_rubro.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-4 mb-3">
              <p className="text-xs text-gray-500 mb-3 font-medium">Tipos de negocio</p>
              <div className="flex gap-3 items-center">
                <div style={{ height: 150, width: 150, flexShrink: 0 }}>
                  <Doughnut aria-label="Tipos de negocio" data={{
                    labels: metrics.by_rubro.map(r=>r.rubro),
                    datasets:[{ data: metrics.by_rubro.map(r=>+r.total), backgroundColor:['#1D9E75','#185FA5','#BA7517','#D85A30','#A32D2D','#3B6D11','#534AB7','#5F5E5A'].map(c=>c+'CC'), borderWidth:0 }]
                  }} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}}/>
                </div>
                <div className="text-xs text-gray-500 flex flex-col gap-1">
                  {metrics.by_rubro.map((r,i) => r.total > 0 && (
                    <span key={r.rubro} className="flex items-center gap-1">
                      <span style={{ width:8,height:8,borderRadius:2,background:['#1D9E75','#185FA5','#BA7517','#D85A30','#A32D2D','#3B6D11','#534AB7','#5F5E5A'][i],flexShrink:0 }} />
                      {r.rubro}: {r.total}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bar: problems */}
          {metrics.by_problem.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-4 mb-3">
              <p className="text-xs text-gray-500 mb-3 font-medium">Problemas más frecuentes</p>
              <div style={{ height: 220 }}>
                <Bar aria-label="Problemas más frecuentes" data={{
                  labels: metrics.by_problem.map(p=>p.problema.length>20?p.problema.slice(0,20)+'…':p.problema),
                  datasets:[{ data: metrics.by_problem.map(p=>+p.cnt), backgroundColor:'#185FA570', borderColor:'#185FA5', borderWidth:1 }]
                }} options={{ indexAxis:'y' as const, responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{stepSize:1}}} }}/>
              </div>
            </div>
          )}

          {/* Export */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 font-medium">Exportar datos</p>
              <div className="flex gap-2">
                <a href={EXPORT_CSV_URL}  className="btn btn-secondary text-sm" style={{width:'auto',padding:'8px 14px'}}>CSV</a>
                <a href={EXPORT_JSON_URL} className="btn btn-secondary text-sm" style={{width:'auto',padding:'8px 14px'}}>JSON</a>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{metrics.total} registros disponibles</p>
          </div>
        </>}
      </div>
    </div>
  );
}
