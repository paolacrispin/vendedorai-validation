export const ZONAS  = ['Abasto','Mutualista','Los Pozos','7 Calles','Barrio Lindo'] as const;
export const RUBROS = ['Abarrotes','Comida','Frutas/Verduras','Papelería','Juguetería','Bazar','Ropa','Otros'] as const;

export const TARGET_TOTAL = 45;
export const TARGET_POR_ZONA  = 9;
export const TARGET_POR_RUBRO = 6;

export const PRICE_MAP: Record<string,number> = {
  'Bs. 20–40': 30, 'Bs. 40–80': 60,
  'Bs. 80–150': 115, 'Más de Bs. 150': 175, 'Nada (gratuito)': 0,
};

export const PREGUNTAS_FILTRO = [
  { q: '¿Eres dueño o encargado del negocio?',              key: 'owner',    type: 'yn' },
  { q: '¿Vendes todos los días o casi todos los días?',     key: 'daily',    type: 'yn' },
  { q: '¿Tienes más de 10 ventas al día?',                  key: 'volume',   type: 'yn' },
  { q: '¿Usas WhatsApp para tu negocio?',                   key: 'whatsapp', type: 'yn' },
  { q: '¿Cómo registras tus ventas actualmente?',           key: 'registro', type: 'choice',
    opts: ['Libreta / papel','Excel o Google Sheets','App del celular','De memoria','No registro'] },
] as const;

export const ENCUESTA = [
  { section: 'Problema actual',         q: '¿Cuál es tu mayor problema para vender más?',           key: 'problema',        type: 'choice',
    opts: ['No tengo suficientes clientes','Los clientes no regresan','No sé cuánto gané','Tengo mucho inventario sin vender','Los pagos son complicados'] },
  { section: 'Problema actual',         q: '¿Qué tan difícil es controlar tus ventas e inventario?', key: 'pain_level',      type: 'scale' },
  { section: 'Validación de solución',  q: '¿Te interesaría una app que registre ventas y avise cuándo reponer producto?', key: 'interested', type: 'yn' },
  { section: 'Validación de solución',  q: '¿Cuál función te parece más útil?',                     key: 'feature',         type: 'choice',
    opts: ['Registro de ventas rápido','Control de inventario','Reportes de ganancias','Avisos de stock bajo','Catálogo para clientes'] },
  { section: 'Disposición de pago',     q: '¿Estarías dispuesto a pagar por esta herramienta?',     key: 'willing_to_pay',  type: 'yn' },
  { section: 'Disposición de pago',     q: '¿Cuánto pagarías al mes?',                              key: 'price_range',     type: 'choice',
    opts: ['Bs. 20–40','Bs. 40–80','Bs. 80–150','Más de Bs. 150','Nada (gratuito)'] },
  { section: 'Comportamiento',          q: '¿Cuántas horas al día usas el celular para tu negocio?', key: 'phone_hours',    type: 'choice',
    opts: ['Menos de 1 hora','1–2 horas','2–4 horas','Más de 4 horas'] },
  { section: 'Comportamiento',          q: '¿Usarías la app si alguien te enseñara en 10 minutos?', key: 'adoption',        type: 'yn' },
] as const;

export function evaluarFiltro(answers: Record<string,string>): boolean {
  let score = 0;
  if (answers.owner === 'si')    score++;
  if (answers.daily === 'si')    score++;
  if (answers.volume === 'si')   score++;
  if (answers.whatsapp === 'si') score++;
  if (['Libreta / papel','Excel o Google Sheets','App del celular'].includes(answers.registro)) score++;
  return score >= 4;
}
