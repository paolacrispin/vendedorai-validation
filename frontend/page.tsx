'use client';
import { useState, useEffect } from 'react';
import { ZONAS, RUBROS, PREGUNTAS_FILTRO, ENCUESTA, PRICE_MAP, evaluarFiltro } from '@/lib/constants';
import { saveSurvey } from '@/lib/api';
import Link from 'next/link';

type Screen = 'selection' | 'preq' | 'disqualified' | 'survey' | 'complete';

export default function HomePage() {
  const [screen, setScreen]           = useState<Screen>('selection');
  const [zona, setZona]               = useState('');
  const [rubro, setRubro]             = useState('');
  const [preqStep, setPreqStep]       = useState(0);
  const [preqAns, setPreqAns]         = useState<Record<string,string>>({});
  const [surveyStep, setSurveyStep]   = useState(0);
  const [surveyAns, setSurveyAns]     = useState<Record<string,unknown>>({});
  const [saving, setSaving]           = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<object[]>([]);

  // Auto-sync offline queue
  useEffect(() => {
    const q = JSON.parse(localStorage.getItem('vai_queue') || '[]');
    if (q.length) setOfflineQueue(q);
  }, []);

  async function flushQueue(queue: object[]) {
    const failed: object[] = [];
    for (const item of queue) {
      try { await saveSurvey(item); } catch { failed.push(item); }
    }
    localStorage.setItem('vai_queue', JSON.stringify(failed));
    setOfflineQueue(failed);
  }

  // ── SCREEN: Selection ──
  function handleStart() {
    if (!zona || !rubro) return alert('Selecciona zona y rubro');
    setPreqStep(0); setPreqAns({});
    setScreen('preq');
  }

  // ── SCREEN: Pre-qualification ──
  function handlePreqAnswer(key: string, val: string) {
    const next = { ...preqAns, [key]: val };
    setPreqAns(next);
    if (preqStep < PREGUNTAS_FILTRO.length - 1) {
      setPreqStep(s => s + 1);
    } else {
      const qualified = evaluarFiltro(next);
      submitPreq(next, qualified);
    }
  }

  async function submitPreq(answers: Record<string,string>, qualified: boolean) {
    if (!qualified) {
      const survey = { zona, rubro, qualified: false, preq_answers: answers, answers: {}, willing_to_pay: false };
      try { await saveSurvey(survey); } catch {
        const q = JSON.parse(localStorage.getItem('vai_queue') || '[]');
        localStorage.setItem('vai_queue', JSON.stringify([...q, survey]));
      }
      setScreen('disqualified');
    } else {
      setSurveyStep(0); setSurveyAns({});
      setScreen('survey');
    }
  }

  // ── SCREEN: Survey ──
  function handleSurveyAnswer(key: string, val: unknown) {
    const next = { ...surveyAns, [key]: val };
    setSurveyAns(next);
    const q = ENCUESTA[surveyStep];
    if (q.type !== 'scale') {
      setTimeout(() => {
        if (surveyStep < ENCUESTA.length - 1) setSurveyStep(s => s + 1);
        else finishSurvey({ ...next });
      }, 280);
    }
  }

  async function finishSurvey(answers: Record<string,unknown>) {
    setSaving(true);
    const priceRange = answers.price_range as string;
    const survey = {
      zona, rubro, qualified: true,
      preq_answers: preqAns, answers,
      willing_to_pay: answers.willing_to_pay === 'si',
      price_range: priceRange || null,
      price_val: PRICE_MAP[priceRange] ?? null,
      pain_level: answers.pain_level ?? null,
      interested: answers.interested === 'si',
    };
    try {
      await saveSurvey(survey);
      await flushQueue(offlineQueue);
    } catch {
      const q = JSON.parse(localStorage.getItem('vai_queue') || '[]');
      localStorage.setItem('vai_queue', JSON.stringify([...q, survey]));
    }
    setSaving(false);
    setScreen('complete');
  }

  function reset() {
    setZona(''); setRubro(''); setPreqAns({}); setSurveyAns({});
    setPreqStep(0); setSurveyStep(0);
    setScreen('selection');
  }

  const curQ = screen === 'preq' ? PREGUNTAS_FILTRO[preqStep] : ENCUESTA[surveyStep];
  const surveyPct = Math.round((surveyStep / ENCUESTA.length) * 100);

  return (
    <div className="flex flex-col flex-1">

      {/* ── NAV ── */}
      <nav style={{ background: 'var(--teal)' }} className="px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="text-white font-medium text-[15px]">VendedorAI</span>
        <div className="flex gap-2">
          <Link href="/dashboard" className="text-white/80 text-xs bg-white/15 px-3 py-1 rounded-full">Dashboard</Link>
          <Link href="/muestreo"  className="text-white/80 text-xs bg-white/15 px-3 py-1 rounded-full">Muestreo</Link>
        </div>
      </nav>

      <div className="flex-1 p-4 overflow-y-auto">

        {/* ══ SCREEN: SELECTION ══ */}
        {screen === 'selection' && (
          <div>
            <div className="border border-gray-200 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3 mb-4">
                <div style={{ background: 'var(--teal-light)' }} className="w-10 h-10 rounded-xl flex items-center justify-center text-xl">🏪</div>
                <div>
                  <p className="font-medium">Nueva encuesta</p>
                  <p className="text-sm text-gray-500">Selecciona zona y rubro</p>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-500 mb-1.5 block">Zona del mercado</label>
                <select value={zona} onChange={e => setZona(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-[15px] bg-white appearance-none">
                  <option value="">— Seleccionar zona —</option>
                  {ZONAS.map(z => <option key={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1.5 block">Rubro del negocio</label>
                <select value={rubro} onChange={e => setRubro(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-[15px] bg-white appearance-none">
                  <option value="">— Seleccionar rubro —</option>
                  {RUBROS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {offlineQueue.length > 0 && (
              <div className="alert alert-warn mb-3">
                ⚠️ {offlineQueue.length} encuesta(s) pendientes de sincronización
              </div>
            )}
            <button onClick={handleStart} className="btn btn-primary">Comenzar encuesta →</button>
          </div>
        )}

        {/* ══ SCREEN: PRE-QUALIFICATION ══ */}
        {screen === 'preq' && (
          <div>
            <div className="border border-gray-200 rounded-xl p-4 mb-3">
              <span style={{ background: 'var(--teal-light)', color: 'var(--teal-dark)' }} className="text-[11px] font-medium px-3 py-1 rounded-full inline-block mb-3">
                Filtro de calificación
              </span>
              <p className="text-[16px] font-medium mb-4 leading-snug">{curQ?.q}</p>

              {curQ?.type === 'choice' && 'opts' in curQ && (
                <div className="flex flex-col gap-2">
                  {curQ.opts.map((o: string) => (
                    <button key={o} className={`choice ${preqAns[curQ.key] === o ? 'selected' : ''}`}
                      onClick={() => handlePreqAnswer(curQ.key, o)}>{o}</button>
                  ))}
                </div>
              )}
              {curQ?.type === 'yn' && (
                <div className="grid grid-cols-2 gap-3">
                  <button className={`yn-btn yes ${preqAns[curQ.key]==='si' ? 'selected' : ''}`} onClick={() => handlePreqAnswer(curQ.key, 'si')}>Sí</button>
                  <button className={`yn-btn no  ${preqAns[curQ.key]==='no' ? 'selected' : ''}`} onClick={() => handlePreqAnswer(curQ.key, 'no')}>No</button>
                </div>
              )}

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Pregunta {preqStep+1} de {PREGUNTAS_FILTRO.length}</span>
                  <span>{Object.values(preqAns).filter(v=>v==='si'||['Libreta / papel','Excel o Google Sheets','App del celular'].includes(v)).length} ✓</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${((preqStep+1)/PREGUNTAS_FILTRO.length)*100}%` }}/></div>
              </div>
            </div>
            {preqStep > 0 && <button onClick={() => setPreqStep(s=>s-1)} className="text-sm text-gray-500">← Atrás</button>}
          </div>
        )}

        {/* ══ SCREEN: DISQUALIFIED ══ */}
        {screen === 'disqualified' && (
          <div className="flex flex-col items-center text-center py-12">
            <div className="text-5xl mb-4">🙏</div>
            <h2 className="text-xl font-medium mb-2">Muchas gracias</h2>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Este estudio está enfocado en otro tipo de negocios. Tu tiempo fue muy valioso para nosotros.
            </p>
            <button onClick={reset} className="btn btn-secondary mt-8 max-w-xs">← Nueva encuesta</button>
          </div>
        )}

        {/* ══ SCREEN: SURVEY ══ */}
        {screen === 'survey' && (
          <div>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Sección: {ENCUESTA[surveyStep].section}</span>
                <span>{surveyPct}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${surveyPct}%` }}/></div>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 mb-3">
              <span style={{ background: 'var(--teal-light)', color: 'var(--teal-dark)' }} className="text-[11px] font-medium px-3 py-1 rounded-full inline-block mb-3">
                {ENCUESTA[surveyStep].section}
              </span>
              <p className="text-[16px] font-medium mb-4 leading-snug">{ENCUESTA[surveyStep].q}</p>

              {ENCUESTA[surveyStep].type === 'choice' && 'opts' in ENCUESTA[surveyStep] && (
                <div className="flex flex-col gap-2">
                  {(ENCUESTA[surveyStep] as {opts: readonly string[]}).opts.map((o: string) => (
                    <button key={o} className={`choice ${surveyAns[ENCUESTA[surveyStep].key] === o ? 'selected' : ''}`}
                      onClick={() => handleSurveyAnswer(ENCUESTA[surveyStep].key, o)}>{o}</button>
                  ))}
                </div>
              )}
              {ENCUESTA[surveyStep].type === 'yn' && (
                <div className="grid grid-cols-2 gap-3">
                  <button className={`yn-btn yes ${surveyAns[ENCUESTA[surveyStep].key]==='si'?'selected':''}`} onClick={() => handleSurveyAnswer(ENCUESTA[surveyStep].key,'si')}>Sí</button>
                  <button className={`yn-btn no  ${surveyAns[ENCUESTA[surveyStep].key]==='no'?'selected':''}`} onClick={() => handleSurveyAnswer(ENCUESTA[surveyStep].key,'no')}>No</button>
                </div>
              )}
              {ENCUESTA[surveyStep].type === 'scale' && (
                <>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} className={`scale-btn s${n} ${surveyAns[ENCUESTA[surveyStep].key]===n?'selected':''}`}
                        onClick={() => handleSurveyAnswer(ENCUESTA[surveyStep].key, n)}>{n}</button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2"><span>Fácil</span><span>Muy difícil</span></div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {surveyStep > 0 && <button onClick={() => setSurveyStep(s=>s-1)} className="btn btn-secondary" style={{width:'auto',padding:'16px 20px'}}>←</button>}
              {ENCUESTA[surveyStep].type === 'scale' && (
                <button onClick={() => {
                  if (!surveyAns[ENCUESTA[surveyStep].key]) return;
                  if (surveyStep < ENCUESTA.length-1) setSurveyStep(s=>s+1);
                  else finishSurvey({...surveyAns});
                }} className="btn btn-primary flex-1" disabled={saving}>
                  {saving ? 'Guardando...' : surveyStep===ENCUESTA.length-1 ? 'Finalizar ✓' : 'Siguiente →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══ SCREEN: COMPLETE ══ */}
        {screen === 'complete' && (
          <div className="flex flex-col items-center text-center py-12">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--teal)' }}>¡Encuesta guardada!</h2>
            <p className="text-sm text-gray-500">La respuesta fue registrada exitosamente.</p>
            <div className="w-full mt-8 flex flex-col gap-3">
              <button onClick={reset} className="btn btn-primary">+ Nueva encuesta</button>
              <Link href="/dashboard" className="btn btn-secondary">Ver dashboard →</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
