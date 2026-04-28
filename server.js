// backend/server.js — VendedorAI API
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

app.post('/surveys', async (req, res) => {
  try {
    const { zona, rubro, qualified, preq_answers, answers, willing_to_pay, price_range, price_val, pain_level, interested } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO surveys (zona,rubro,qualified,preq_answers,answers,willing_to_pay,price_range,price_val,pain_level,interested)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [zona, rubro, qualified, preq_answers, answers, willing_to_pay ?? null, price_range ?? null, price_val ?? null, pain_level ?? null, interested ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al guardar' }); }
});

app.get('/surveys', async (req, res) => {
  try {
    const { zona, rubro } = req.query;
    let where = [], params = [];
    if (zona)  { params.push(zona);  where.push(`zona = $${params.length}`); }
    if (rubro) { params.push(rubro); where.push(`rubro = $${params.length}`); }
    const sql = `SELECT * FROM surveys ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 500`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Error al obtener' }); }
});

app.get('/metrics', async (_, res) => {
  try {
    const base = await pool.query(`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE qualified) AS qualified,
      COUNT(*) FILTER (WHERE interested) AS interested,
      COUNT(*) FILTER (WHERE willing_to_pay) AS willing_to_pay,
      ROUND(AVG(price_val) FILTER (WHERE price_val > 0)) AS avg_price,
      ROUND(AVG(pain_level) FILTER (WHERE pain_level IS NOT NULL),1) AS avg_pain
      FROM surveys`);
    const byZona   = await pool.query(`SELECT zona, COUNT(*) FILTER (WHERE qualified) AS qualified, COUNT(*) AS total FROM surveys GROUP BY zona`);
    const byRubro  = await pool.query(`SELECT rubro, COUNT(*) FILTER (WHERE qualified) AS qualified, COUNT(*) AS total FROM surveys GROUP BY rubro`);
    const byPrice  = await pool.query(`SELECT price_range, COUNT(*) AS cnt FROM surveys WHERE qualified AND price_range IS NOT NULL GROUP BY price_range ORDER BY cnt DESC`);
    const byProblem= await pool.query(`SELECT answers->>'problema' AS problema, COUNT(*) AS cnt FROM surveys WHERE qualified AND answers->>'problema' IS NOT NULL GROUP BY problema ORDER BY cnt DESC`);
    res.json({ ...base.rows[0], by_zona: byZona.rows, by_rubro: byRubro.rows, by_price: byPrice.rows, by_problem: byProblem.rows });
  } catch (e) { res.status(500).json({ error: 'Error métricas' }); }
});

app.get('/sampling', async (_, res) => {
  try {
    const ZONAS  = ['Abasto','Mutualista','Los Pozos','7 Calles','Barrio Lindo'];
    const RUBROS = ['Abarrotes','Comida','Frutas/Verduras','Papelería','Juguetería','Bazar','Ropa','Otros'];
    const T_ZONA = 9, T_RUBRO = 6, TARGET = 45;
    const zonaRows  = (await pool.query(`SELECT zona, COUNT(*) FILTER (WHERE qualified) AS done FROM surveys GROUP BY zona`)).rows;
    const rubroRows = (await pool.query(`SELECT rubro, COUNT(*) FILTER (WHERE qualified) AS done FROM surveys GROUP BY rubro`)).rows;
    const totals    = (await pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE qualified) AS qualified FROM surveys`)).rows[0];
    const zMap = Object.fromEntries(zonaRows.map(r=>[r.zona, +r.done]));
    const rMap = Object.fromEntries(rubroRows.map(r=>[r.rubro, +r.done]));
    res.json({
      total: +totals.total, qualified: +totals.qualified, target: TARGET,
      zonas:  ZONAS.map(z=>({ zona:z,  done: zMap[z]||0, target: T_ZONA,  left: Math.max(0,T_ZONA-(zMap[z]||0))  })),
      rubros: RUBROS.map(r=>({ rubro:r, done: rMap[r]||0, target: T_RUBRO, left: Math.max(0,T_RUBRO-(rMap[r]||0)) })),
    });
  } catch (e) { res.status(500).json({ error: 'Error muestreo' }); }
});

app.get('/export/csv', async (_, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM surveys ORDER BY created_at');
    const h = ['id','created_at','zona','rubro','qualified','interested','willing_to_pay','price_range','price_val','pain_level'];
    const csv = [h.join(','), ...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="encuestas.csv"');
    res.send(csv);
  } catch (e) { res.status(500).json({ error: 'Error exportación' }); }
});

app.get('/export/json', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM surveys ORDER BY created_at');
  res.setHeader('Content-Disposition','attachment; filename="encuestas.json"');
  res.json(rows);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`VendedorAI API en puerto ${PORT}`));
