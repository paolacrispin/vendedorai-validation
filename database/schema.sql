-- VendedorAI Validation Tool - Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE surveys (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  zona         TEXT NOT NULL CHECK (zona IN ('Abasto','Mutualista','Los Pozos','7 Calles','Barrio Lindo')),
  rubro        TEXT NOT NULL CHECK (rubro IN ('Abarrotes','Comida','Frutas/Verduras','Papelería','Juguetería','Bazar','Ropa','Otros')),
  qualified    BOOLEAN NOT NULL DEFAULT FALSE,
  preq_answers JSONB NOT NULL DEFAULT '{}',
  answers      JSONB NOT NULL DEFAULT '{}',
  willing_to_pay BOOLEAN,
  price_range  TEXT,
  price_val    INTEGER,
  pain_level   INTEGER CHECK (pain_level BETWEEN 1 AND 5),
  interested   BOOLEAN
);

CREATE INDEX idx_surveys_zona      ON surveys(zona);
CREATE INDEX idx_surveys_rubro     ON surveys(rubro);
CREATE INDEX idx_surveys_qualified ON surveys(qualified);
CREATE INDEX idx_surveys_created   ON surveys(created_at DESC);

-- Seed example data
INSERT INTO surveys (zona, rubro, qualified, preq_answers, answers, willing_to_pay, price_range, price_val, pain_level, interested)
VALUES
  ('Abasto','Abarrotes', true,
    '{"owner":"si","daily":"si","volume":"si","whatsapp":"si","registro":"Libreta / papel"}',
    '{"problema":"No sé cuánto gané","feature":"Registro de ventas rápido","phone_hours":"1–2 horas","adoption":"si"}',
    true, 'Bs. 40–80', 60, 4, true),
  ('Mutualista','Comida', true,
    '{"owner":"si","daily":"si","volume":"si","whatsapp":"si","registro":"De memoria"}',
    '{"problema":"Los clientes no regresan","feature":"Control de inventario","phone_hours":"2–4 horas","adoption":"si"}',
    false, 'Nada (gratuito)', 0, 3, true),
  ('Los Pozos','Frutas/Verduras', true,
    '{"owner":"si","daily":"si","volume":"si","whatsapp":"no","registro":"Libreta / papel"}',
    '{"problema":"Tengo mucho inventario sin vender","feature":"Avisos de stock bajo","phone_hours":"Menos de 1 hora","adoption":"si"}',
    true, 'Bs. 20–40', 30, 5, true),
  ('7 Calles','Ropa', false,
    '{"owner":"no","daily":"si","volume":"no","whatsapp":"si","registro":"De memoria"}',
    '{}', false, null, null, null, null);
