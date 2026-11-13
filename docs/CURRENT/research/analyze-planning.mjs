import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const VERSION = '1.0.0';
const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('Usage: node docs/CURRENT/research/analyze-planning.mjs <source.xlsx> [output-directory]');
  process.exit(2);
}
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = process.argv[3] ? path.resolve(process.argv[3]) : path.join(scriptDir, 'generated');
fs.mkdirSync(outputDir, { recursive: true });

function readZipEntries(filePath) {
  const buffer = fs.readFileSync(filePath);
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  assert.notEqual(eocd, -1, 'ZIP end-of-central-directory not found');
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(buffer.readUInt32LE(offset), 0x02014b50, 'Invalid ZIP central entry');
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    assert.equal(buffer.readUInt32LE(localOffset), 0x04034b50, `Invalid local ZIP entry: ${name}`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(start, start + compressedSize);
    const content = method === 0 ? compressed : method === 8 ? zlib.inflateRawSync(compressed) : null;
    assert.ok(content, `Unsupported ZIP compression ${method}: ${name}`);
    assert.equal(content.length, uncompressedSize, `ZIP size mismatch: ${name}`);
    entries.set(name, content);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

const decodeXml = (value = '') => value
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');
const textNodes = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1])).join('');

function readWorkbook(filePath) {
  const entries = readZipEntries(filePath);
  const sharedXml = entries.get('xl/sharedStrings.xml')?.toString('utf8') || '';
  const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textNodes(m[1]));
  const sheet = entries.get('xl/worksheets/sheet1.xml')?.toString('utf8');
  assert.ok(sheet, 'xl/worksheets/sheet1.xml is required');
  return [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const row = {};
    for (const cell of rowMatch[1].matchAll(/<c\s([^>]*?)(?<!\/)\>([\s\S]*?)<\/c>/g)) {
      const column = cell[1].match(/\br="([A-Z]+)\d+/)?.[1];
      const type = cell[1].match(/\bt="([^"]+)"/)?.[1];
      const raw = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let value = '';
      if (type === 'inlineStr') value = textNodes(cell[2]);
      else if (raw !== undefined) value = type === 's' ? shared[Number(raw)] : decodeXml(raw);
      if (column && value !== '') row[column] = value.trim();
    }
    return row;
  });
}

const workbookRows = readWorkbook(sourcePath);
assert.equal(workbookRows[0].A, 'Submission ID');
assert.equal(workbookRows[0].B, 'Submission time');
const rows = workbookRows.slice(1).filter((row) => row.A || row.B).map((row, index) => ({
  ...row, _originalIndex: index, _rid: `R${String(index + 1).padStart(3, '0')}`
}));
const first = (row, columns) => {
  for (const column of columns) if (row[column]?.trim()) return row[column].trim();
  return '';
};
assert.equal(rows.length, 166, 'Full cohort must contain 166 responses');
assert.equal(new Set(rows.map((row) => first(row, ['A']))).size, 166, 'Submission IDs must be unique');
for (const row of rows) assert.ok(Number.isFinite(Number(first(row, ['B']))), `Missing submission time at ${row._rid}`);
const sortedRows = [...rows].sort((a, b) => Number(first(a, ['B'])) - Number(first(b, ['B'])) || a._originalIndex - b._originalIndex);
const cohorts = { early99: sortedRows.slice(0, 99), late67: sortedRows.slice(99), full166: sortedRows };
assert.equal(cohorts.early99.length, 99);
assert.equal(cohorts.late67.length, 67);
const isoDate = (row) => new Date(Date.UTC(1899, 11, 30) + Number(first(row, ['B'])) * 86400000).toISOString().slice(0, 10);

const C = {
  age: ['D', 'K', 'R'], gender: ['E', 'L', 'S'], occupation: ['G', 'N', 'U'],
  frequency: ['I', 'P', 'W'], dailyPlan: ['Y', 'AD', 'AI'],
  unfinished: ['AA', 'AF', 'AK'], smallTrap: ['AB', 'AG', 'AL'], guilt: ['AC', 'AH', 'AM'],
  focus: ['AN', 'AW', 'BF'], energy: ['AO', 'AX', 'BG'], addTasks: ['BO', 'BS', 'BW'],
  accessibility: ['BQ', 'BU', 'BY'], timing: ['AP', 'AY', 'BH'], overload: ['AQ', 'AZ', 'BI'],
  small: ['AR', 'BA', 'BJ'], clarity: ['AS', 'BB', 'BK'], state: ['AT', 'BC', 'BL'], capacity: ['AU', 'BD', 'BM']
};
const pct = (n, d) => d ? Number((100 * n / d).toFixed(1)) : null;
const csv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const writeCsv = (name, header, records) => fs.writeFileSync(path.join(outputDir, name), [header.map(csv).join(','), ...records.map((row) => row.map(csv).join(','))].join('\n') + '\n');

function buildAggregates(cohortName, cohortRows) {
  const result = [];
  const add = (id, section, label, category, numerator, denominator, definition) => result.push({
    cohort: cohortName, id, section, label, category, numerator, denominator,
    percent: pct(numerator, denominator), definition
  });
  const distribution = (id, section, label, columns, mapper, order) => {
    const values = cohortRows.map((row) => first(row, columns)).filter(Boolean);
    const mapped = values.map((value) => {
      const category = mapper(value);
      assert.ok(category, `Unmapped ${id}: ${value}`);
      return category;
    });
    for (const category of order || [...new Set(mapped)].sort()) {
      add(id, section, label, category, mapped.filter((x) => x === category).length, values.length, `Count of ${category} / valid ${label} responses`);
    }
  };
  distribution('language', 'demographics', 'Language', ['C'], (x) => x, ['English', 'Español', 'Русский']);
  distribution('age', 'demographics', 'Age', C.age, (x) => /Under 18|Menos de 18/.test(x) ? 'under18' : /18-25/.test(x) ? '18-25' : /26-35/.test(x) ? '26-35' : /36-45/.test(x) ? '36-45' : /46|56|60/.test(x) ? '46+' : null, ['under18', '18-25', '26-35', '36-45', '46+']);
  distribution('gender', 'demographics', 'Gender', C.gender, (x) => /Woman|Mujer|Женщина/.test(x) ? 'woman' : /Man|Hombre|Мужчина/.test(x) ? 'man' : /non-binary|no binaria/i.test(x) ? 'non-binary' : /Prefer|Prefiero/.test(x) ? 'prefer_not_to_say' : null, ['woman', 'man', 'non-binary', 'prefer_not_to_say']);
  distribution('occupation_group', 'demographics', 'Occupation group', C.occupation, (x) => /^Student$|^Estudiante$|^Студент$|Office employee|Работаю по найму|Empleado\/a/.test(x) ? 'A_system' : /Freelanc|Фрилансер|Manager|Directivo|Руководитель/.test(x) ? 'B_autonomous' : 'Other', ['A_system', 'B_autonomous', 'Other']);
  distribution('planner_frequency', 'behaviour', 'Planner frequency', C.frequency, (x) => /Daily|A diario|Каждый день/.test(x) ? 'daily' : /few times|Varias veces|Несколько раз/.test(x) ? 'few_times_week' : /Only when busy|Solo cuando|Только в очень/.test(x) ? 'only_when_busy' : /Rarely|Casi nunca|Практически никогда/.test(x) ? 'rarely_never' : null, ['daily', 'few_times_week', 'only_when_busy', 'rarely_never']);
  distribution('daily_plan', 'behaviour', 'Daily plan', C.dailyPlan, (x) => /Task list without|Lista de tareas sin|Список задач без/.test(x) ? 'list_without_time' : /Detailed list|Lista detallada|Подробный список/.test(x) ? 'detailed_time_priority' : /key tasks|tareas clave|ключевых задач/.test(x) ? 'in_head' : /No plan|Sin plan|Никакого плана/.test(x) ? 'no_plan' : null, ['list_without_time', 'in_head', 'detailed_time_priority', 'no_plan']);
  distribution('small_trap_frequency', 'behaviour', 'Small task trap frequency', C.smallTrap, (x) => /all the time|constantly|constante|постоянно/i.test(x) ? 'constant' : /Sometimes|A veces|Иногда/.test(x) ? 'sometimes' : /Rarely|Raras veces|Редко/.test(x) ? 'rarely' : /never|nunca|Нет, такого/i.test(x) ? 'never' : null, ['constant', 'sometimes', 'rarely', 'never']);
  distribution('guilt', 'behaviour', 'Unfinished-task emotion', C.guilt, (x) => /Upset|Frustrado|Сильно/.test(x) ? 'strong_guilt' : /bit anxious|poco ansioso|Немного беспоко/.test(x) ? 'mild_anxiety' : /Fine|Tranquilo|Спокойно|doesn't bother/.test(x) ? 'calm' : null, ['calm', 'mild_anxiety', 'strong_guilt']);
  distribution('energy_check', 'behaviour', 'Energy check', C.energy, (x) => /always|siempre|всегда/i.test(x) ? 'always' : /Sometimes|A veces|Иногда/.test(x) ? 'sometimes' : /^No|^Нет/.test(x) ? 'never' : null, ['always', 'sometimes', 'never']);
  distribution('accessibility_use', 'behaviour', 'Accessibility settings used', C.accessibility, (x) => /^No$|^Нет$/.test(x) ? 'no' : /^Yes$|^Sí$|^Да$/.test(x) ? 'yes' : null, ['no', 'yes']);

  const unfinished = cohortRows.map((row) => first(row, C.unfinished)).filter(Boolean).map((value) => value.split(/\s*,\s*/));
  const has = (options, regex) => options.some((option) => regex.test(option));
  const branches = {
    manual: /^(Manually move|Las muevo manualmente|Переношу вручную)/,
    accumulation: /^(They pile|Se acumulan|Они накапливаются)/,
    reprioritize: /^(I review|Reviso|Пересматриваю)/,
    forget: /^(I simply forget|Simplemente se me olvidan|Просто забываю)/,
    rarely: /^(This rarely|Casi nunca|Такого почти)/
  };
  for (const [branch, regex] of Object.entries(branches)) {
    add(`unfinished_${branch}`, 'unfinished', 'Unfinished tasks', branch, unfinished.filter((options) => has(options, regex)).length, unfinished.length, `Respondents selecting ${branch} / valid unfinished responses`);
  }
  const manualCount = unfinished.filter((options) => has(options, branches.manual)).length;
  const accumulationCount = unfinished.filter((options) => has(options, branches.accumulation)).length;
  const overlap = unfinished.filter((options) => has(options, branches.manual) && has(options, branches.accumulation)).length;
  add('unfinished_intersection', 'unfinished', 'Unfinished tasks', 'manual_AND_accumulation', overlap, unfinished.length, 'Intersection of manual and accumulation');
  add('unfinished_union', 'unfinished', 'Unfinished tasks', 'manual_OR_accumulation', unfinished.filter((options) => has(options, branches.manual) || has(options, branches.accumulation)).length, unfinished.length, `Union; invariant ${manualCount}+${accumulationCount}-${overlap}`);

  const likerts = Object.entries({ timing: C.timing, overload: C.overload, small: C.small, clarity: C.clarity, state: C.state, capacity: C.capacity });
  for (const [name, columns] of likerts) {
    const values = cohortRows.map((row) => first(row, columns)).filter(Boolean).map(Number);
    for (const value of values) assert.ok(Number.isInteger(value) && value >= 1 && value <= 5, `Invalid Likert ${name}: ${value}`);
    distribution(`likert_${name}`, 'likert_distribution', `${name} rating`, columns, String, ['1', '2', '3', '4', '5']);
    add(`likert_${name}_top2`, 'likert_top2', `${name} Top2`, '4-5', values.filter((value) => value >= 4).length, values.length, 'Ratings 4 or 5 / valid Likert responses');
    add(`likert_${name}_low2`, 'likert_low2', `${name} Low2`, '1-2', values.filter((value) => value <= 2).length, values.length, 'Ratings 1 or 2 / valid Likert responses');
  }

  distribution('focus_peak', 'focus', 'Focus peak', C.focus, (x) => /morning|mañana|утро/i.test(x) ? 'morning' : /evening|noche|вечер/i.test(x) ? 'evening_night' : /afternoon|tarde/i.test(x) ? 'afternoon' : /depends|Depende|Зависит/.test(x) ? 'variable' : /never thought|Никогда/.test(x) ? 'never_considered' : null, ['morning', 'afternoon', 'evening_night', 'variable', 'never_considered']);
  const focus = cohortRows.map((row) => first(row, C.focus)).filter(Boolean);
  const fixed = focus.filter((x) => /morning|mañana|утро|afternoon|tarde|evening|noche|вечер/i.test(x));
  const morning = fixed.filter((x) => /morning|mañana|утро/i.test(x)).length;
  const afternoon = fixed.filter((x) => /afternoon|tarde/i.test(x)).length;
  const evening = fixed.filter((x) => /evening|noche|вечер/i.test(x)).length;
  add('focus_fixed_morning', 'focus_fixed_only', 'Fixed focus peak', 'morning', morning, fixed.length, 'Morning / respondents with a fixed peak');
  add('focus_fixed_afternoon', 'focus_fixed_only', 'Fixed focus peak', 'afternoon', afternoon, fixed.length, 'Afternoon / respondents with a fixed peak');
  add('focus_fixed_evening', 'focus_fixed_only', 'Fixed focus peak', 'evening_night', evening, fixed.length, 'Evening/night / respondents with a fixed peak');
  add('focus_no_fixed', 'focus', 'No fixed focus peak', 'variable_OR_never_considered', focus.length - fixed.length, focus.length, 'Variable plus never considered / valid focus responses');

  const addTasks = cohortRows.map((row) => first(row, C.addTasks)).filter(Boolean);
  const voiceCount = addTasks.filter((value) => value.split(/\s*,\s*/).some((x) => /Voice input|Por voz|Голосовой ввод/.test(x))).length;
  add('add_tasks_voice', 'behaviour', 'Voice task entry', 'voice', voiceCount, addTasks.length, 'Respondents selecting voice / valid add-task responses');
  return result;
}

const aggregateByCohort = {
  early99: buildAggregates('early99', cohorts.early99),
  late67: buildAggregates('late67', cohorts.late67),
  full166: buildAggregates('full166', cohorts.full166)
};

const patterns = {
  frustrations: {
    F1_fragmentation: /different tools|separate|dispers|fragment|overview|disorgan|disorder|organi[sz]|categori[sz]|segment|carpet|tablero|perd(?:e|i)|lost|perdido|scattered|todo.*apps|apps.*years|notes.*apps|each thing|different place|разных инструмент|не пересекаются|cada cosa|sitio distinto/i,
    F2_notifications: /notific|recorda|remind|alarma|avisa|pending|pendiente|forget|olvid|forgetting|напомин|забываю|нагадуван/i,
    F3_input_usability_custom: /click|time.*(?:write|record|config|orden)|slow|usability|difficult to utili[sz]e|difíciles de utilizar|interfaz|interface|color|custom|decorat|aesthetic|paper|papel|lápiz|pencil|handwrit|escribir|escribo|write|widget|word|physical|edit|borrar|typing|keyboard|mobile|draw|diseño|layout|feature|functionality|comfort|inc[oó]mod|бумаж|таскать|под рукой|время.*запис|тратить время|интерфейс|клик|сложн|голосов|how much.*done|progress|funciones|visual|a mano/i,
    F4_overload_capacity: /stress|overw|overload|too much|rigid|underestimat|time needed|procrastin|poco tiempo|no pued[oa] cumplir|pressure|burnout|fatigue|energy|mocking me|worthless|too many|abrum|how long|when to start/i,
    F5_priorities: /prioriti|prioridad|приоритет|important|urgente|urgency/i,
    F6_adoption_habit: /habit|routine|regular|consistent|motivat|boring|aburr|don.t use|do not use|no uso|rarely|не регулярно|лень|me aburro|no.*look at my plan|no.*planning each morning|привычк|rutina/i
  },
  recovery: {
    R1_rest_restore: /rest|descans|sleep|relax|tranquil|caminar|walk|music|música|film|movie|serie|time for me|time to myself|self.?care|recover|recarg|breath|respiro|cama|bed|acostad|quiet|gust[eé]|hobby|refrescar|restore|recuper|отдох|отдых|постел|лежу|сон|лечусь|me tomo.*tiempo/i,
    R2_postpone_redistribute: /next day|following day|another day|siguiente|pospon|postpon|move|muevo|delay|later|tomorrow|weekend|fin de semana|semana|distribute|divid|re.?schedule|otro día|otros días|reprioriti[sz]|primer.*urgente|aplaz|domingo|push.*time|перен|потом|подожд|отлож/i,
    R3_reduce_simplify: /\bsimples?\b|sencill|easier|small|manageable|break|divide|reduce|menos|one thing|one task|1 task|3 most|lower.*load|few.*task|light|easy|menor carga|reduce.*goal|low.*energy|solo.*important|menos tareas|попроще|посильн|снижаю нагруз|легкими делами|sola tarea|deleg/i,
    R4_accept_self_compassion: /accept|okay|\bnormal\b|mental health|listen.*body|escuch.*cuerpo|compassion|permit|allow|tell.*myself|acept|calm|tranquil|be kind|no.*guilt|forgive|comprend|no pasa nada|está bien|принимаю|позволяю|ресурс/i,
    R5_difficulty_shutdown: /shut down|snowball|cycle|bloqueo|acumul|frustro|force|oblig|no puedo|not ideal|procrastinat|no reduzco|siempre intento|not always possible|mandatory|desvel|can.t|cannot|no.*gestiono|me bloqueo|no.*possible|perezosa|nothing seems to work|не справляюсь|большим трудом/i
  },
  magic: {
    M1_auto_prioritize_schedule: /prioriti|prioridad|orden|order|autom[aá]tic|reschedul|postpone|posponga|old tasks|classif|segment|distribu|urgency|urgencia|importance|task order|organiza|acomodar|asigna|sort|reestructur|conflict|schedule|приоритет|перераспис|пріоритет/i,
    M2_energy_context_capacity: /energy|energ|estado|[aá]nimo|cansancio|fatigue|concentration|sleep|sueño|ciclo|capacidad|capacity|real.*time|tiempo real|persona|\bpersonal\b|workload|mood|mental|resource|recurso|stres|stress|concentraci|health|fitness|state|how long|tiempo.*(?:tarda|necesario)|cu[aá]ntas tareas|capaz/i,
    M3_reminder_motivation: /remind|recorda|notific|avisa|alarma|accountable|motivat|insist|pin(?:a|ar)|keep track|overdue|incentiv|gamif|reward|recompens|be on me|bloque|hasta que|molestar|goal|finish|complete|no olvidar|remember|deadline|пинал|напомин|хвал|нагадуван|no me aburra/i,
    M4_ai_voice_integration: /\bAI\b|\bIA\b|voz|voice|dictad|speech|email|sync|connect|conect|apps|devices|clickthrough|read.*mail|integrat|correo|calendar.*other|open.*page|fitness|assistant|asistente|голос|\bии\b|девайс|синхрон/i,
    M5_visual_custom_progress: /color|visual|overview|progress|resumen|gr[aá]fic|minimal|decor|personaliz|custom|picture|layout|structure|week|display|image|foto|divisions|carpetas|checks|bar|status|seguimiento|organized by hours|clean|clear|цвет|визуал|картин|concluid/i,
    M6_guidance_planning: /consej|suggest|tips|how to|planning|realistic|guide|break.*task|calcular|calculate|analy[sz]|anali[sz]|advice|learn|instruction|improve|better.*plan|plan.*better|choose|recommend|recomend/i
  }
};
const openDefinitions = {
  frustrations: { prefix: 'F', columns: ['BP','BT','BX','CT','CU','CV'] },
  recovery: { prefix: 'R', columns: ['AV','BE','BN','CQ','CR','CS'] },
  magic: { prefix: 'M', columns: ['CA','CB','CC','CW','CX','CY'] }
};
function exclusionReason(type, text) {
  const value = text.trim();
  if (type === 'frustrations') {
    if (/^(?:&nbsp;|\?|nada(?: en concreto)?|nothing|none|no|я адаптировалась, все устраивает|все устраивает)$/i.test(value)) return 'base_no_content';
    if (/^(?:Nada, estoy bastante contenta|La verdad que las herramientas digitales.*|dont use any|I don't use one|I’m happy with a paper planner|Nada, me organizo bien|No me frustra nada|pues nada estan bien para mi)$/i.test(value)) return 'satisfied_or_nonuser';
  }
  if (type === 'recovery') {
    if (/^(?:&nbsp;|no|No me pasa eso)$/i.test(value)) return 'base_no_content';
    if (/^(?:Конечно\.?|Да такое бывает\.?|yes|Sometimes|sometimes i do|Si, pero muy rara la vez)$/i.test(value)) return 'strategy_free_confirmation';
  }
  if (type === 'magic') {
    if (/^(?:&nbsp;|Затрудняюсь ответить|Не знаю|No sabría.*|no lo s[ée].*|No se me ocurre|nada)$/i.test(value)) return 'base_no_content';
    if (/^(?:I don't use one|i like my current tools)$/i.test(value)) return 'satisfied_or_nonuser';
  }
  return '';
}

const addCodes = {
  frustrations: {
    R001: ['F3_input_usability_custom'], R003: ['F1_fragmentation', 'F3_input_usability_custom'], R005: ['F5_priorities'],
    R009: ['F2_notifications'], R010: ['F3_input_usability_custom'], R014: ['F3_input_usability_custom'],
    R015: ['F6_adoption_habit'], R044: ['F2_notifications'], R046: ['F4_overload_capacity'],
    R074: ['F3_input_usability_custom'], R075: ['F4_overload_capacity'], R111: ['F4_overload_capacity'],
    R113: ['F6_adoption_habit'], R122: ['F3_input_usability_custom'], R130: ['F3_input_usability_custom'],
    R161: ['F3_input_usability_custom'], R163: ['F3_input_usability_custom']
  },
  recovery: {
    R001: ['R2_postpone_redistribute', 'R3_reduce_simplify', 'R4_accept_self_compassion'],
    R005: ['R5_difficulty_shutdown'], R006: ['R2_postpone_redistribute'], R009: ['R2_postpone_redistribute'],
    R010: ['R3_reduce_simplify'], R011: ['R1_rest_restore', 'R3_reduce_simplify'],
    R012: ['R1_rest_restore', 'R3_reduce_simplify'], R014: ['R1_rest_restore'], R016: ['R1_rest_restore'],
    R044: ['R4_accept_self_compassion'], R056: ['R1_rest_restore', 'R3_reduce_simplify'],
    R074: ['R2_postpone_redistribute'], R092: ['R1_rest_restore'], R102: ['R1_rest_restore', 'R2_postpone_redistribute'],
    R122: ['R1_rest_restore'], R130: ['R3_reduce_simplify'], R160: ['R5_difficulty_shutdown'], R166: ['R1_rest_restore']
  },
  magic: {
    R001: ['M1_auto_prioritize_schedule'], R002: ['M5_visual_custom_progress'],
    R003: ['M3_reminder_motivation', 'M4_ai_voice_integration'],
    R005: ['M1_auto_prioritize_schedule', 'M5_visual_custom_progress'], R006: ['M5_visual_custom_progress'],
    R009: ['M1_auto_prioritize_schedule', 'M3_reminder_motivation'], R011: ['M4_ai_voice_integration'],
    R012: ['M3_reminder_motivation'], R014: ['M1_auto_prioritize_schedule'], R027: ['M1_auto_prioritize_schedule'],
    R037: ['M5_visual_custom_progress'], R044: ['M1_auto_prioritize_schedule', 'M3_reminder_motivation'],
    R070: ['M5_visual_custom_progress'], R092: ['M3_reminder_motivation'], R102: ['M3_reminder_motivation'],
    R114: ['M2_energy_context_capacity', 'M5_visual_custom_progress', 'M6_guidance_planning'],
    R121: ['M1_auto_prioritize_schedule'], R122: ['M3_reminder_motivation'], R128: ['M5_visual_custom_progress'],
    R134: ['M1_auto_prioritize_schedule'], R138: ['M2_energy_context_capacity'], R159: ['M1_auto_prioritize_schedule']
  }
};
const removeCodes = {
  frustrations: { R068: ['F2_notifications'], R137: ['F2_notifications'], R130: ['F5_priorities'] },
  recovery: {
    R067: ['R5_difficulty_shutdown'], R083: ['R1_rest_restore'], R100: ['R3_reduce_simplify'],
    R111: ['R4_accept_self_compassion'], R159: ['R1_rest_restore']
  },
  magic: {
    R022: ['M2_energy_context_capacity'], R091: ['M1_auto_prioritize_schedule'], R098: ['M1_auto_prioritize_schedule'],
    R114: ['M4_ai_voice_integration'], R128: ['M1_auto_prioritize_schedule'],
    R131: ['M1_auto_prioritize_schedule', 'M2_energy_context_capacity'], R160: ['M1_auto_prioritize_schedule'],
    R161: ['M3_reminder_motivation', 'M4_ai_voice_integration', 'M5_visual_custom_progress']
  }
};

const openResponses = [];
for (const [type, definition] of Object.entries(openDefinitions)) {
  const extracted = sortedRows.map((row) => ({ row, text: first(row, definition.columns) })).filter((item) => item.text);
  extracted.forEach(({ row, text }, index) => {
    const exclusion = exclusionReason(type, text);
    const labelSet = new Set();
    if (!exclusion) {
      for (const [label, regex] of Object.entries(patterns[type])) if (regex.test(text.toLowerCase())) labelSet.add(label);
      for (const label of addCodes[type][row._rid] || []) labelSet.add(label);
      for (const label of removeCodes[type][row._rid] || []) labelSet.delete(label);
    }
    openResponses.push({
      key: `${definition.prefix}${String(index + 1).padStart(3, '0')}`,
      question: type, row, included: !exclusion, exclusion_reason: exclusion,
      codes: exclusion ? [] : [...labelSet].sort()
    });
  });
}

function openForCohort(cohortRows) {
  const sourceRows = new Set(cohortRows);
  return openResponses.filter((response) => sourceRows.has(response.row));
}
function openThemeRows(cohortName, cohortRows) {
  const responses = openForCohort(cohortRows);
  const result = [];
  for (const type of Object.keys(openDefinitions)) {
    const subset = responses.filter((response) => response.question === type);
    const included = subset.filter((response) => response.included);
    for (const reason of ['base_no_content', 'satisfied_or_nonuser', 'strategy_free_confirmation']) {
      const count = subset.filter((response) => response.exclusion_reason === reason).length;
      if (count) result.push({ cohort: cohortName, question: type, code: `EXCLUDED_${reason}`, numerator: count, denominator: subset.length, percent: pct(count, subset.length), definition: 'Excluded raw responses / raw open-question base' });
    }
    result.push({ cohort: cohortName, question: type, code: 'THEMATIC_BASE', numerator: included.length, denominator: subset.length, percent: pct(included.length, subset.length), definition: 'Included thematic responses / raw open-question base' });
    const unclear = included.filter((response) => !response.codes.length).length;
    result.push({ cohort: cohortName, question: type, code: 'OTHER_UNCLEAR', numerator: unclear, denominator: included.length, percent: pct(unclear, included.length), definition: 'Uncoded substantive responses / thematic base' });
    for (const code of Object.keys(patterns[type])) {
      const count = included.filter((response) => response.codes.includes(code)).length;
      result.push({ cohort: cohortName, question: type, code, numerator: count, denominator: included.length, percent: pct(count, included.length), definition: 'Unique respondents with code / thematic base; multi-label' });
    }
  }
  return result;
}
const openThemes = { early99: openThemeRows('early99', cohorts.early99), full166: openThemeRows('full166', cohorts.full166) };

const getAgg = (cohort, id, category = null) => {
  const record = aggregateByCohort[cohort].find((row) => row.id === id && (!category || row.category === category));
  assert.ok(record, `Missing aggregate ${cohort}/${id}/${category || ''}`);
  return record;
};
const expectedFull = {
  unfinished_manual: 92, unfinished_accumulation: 60, unfinished_intersection: 23, unfinished_union: 129,
  likert_state_top2: 89, likert_capacity_top2: 86, likert_small_top2: 78,
  likert_overload_top2: 59, likert_clarity_top2: 39, likert_timing_top2: 52,
  focus_fixed_morning: 48, focus_fixed_afternoon: 22, focus_fixed_evening: 50,
  focus_no_fixed: 43, add_tasks_voice: 5
};
for (const [id, expected] of Object.entries(expectedFull)) assert.equal(getAgg('full166', id).numerator, expected, `Full-166 invariant failed: ${id}`);
assert.equal(getAgg('full166', 'likert_state_top2').denominator, 163);
assert.equal(getAgg('full166', 'unfinished_union').numerator, getAgg('full166', 'unfinished_manual').numerator + getAgg('full166', 'unfinished_accumulation').numerator - getAgg('full166', 'unfinished_intersection').numerator);
const expectedOpen = {
  frustrations: { raw: 95, base: 68, unclear: 3 },
  recovery: { raw: 99, base: 81, unclear: 4 },
  magic: { raw: 99, base: 82, unclear: 0 }
};
for (const [type, expected] of Object.entries(expectedOpen)) {
  const subset = openResponses.filter((response) => response.question === type);
  assert.equal(subset.length, expected.raw, `${type} raw base mismatch`);
  assert.equal(subset.filter((response) => response.included).length, expected.base, `${type} thematic base mismatch`);
  assert.equal(subset.filter((response) => response.included && !response.codes.length).length, expected.unclear, `${type} unclear mismatch`);
}
const expectedThemes = {
  frustrations: { F1_fragmentation: 12, F2_notifications: 18, F3_input_usability_custom: 27, F4_overload_capacity: 9, F5_priorities: 3, F6_adoption_habit: 7 },
  recovery: { R1_rest_restore: 28, R2_postpone_redistribute: 39, R3_reduce_simplify: 18, R4_accept_self_compassion: 11, R5_difficulty_shutdown: 17 },
  magic: { M1_auto_prioritize_schedule: 32, M2_energy_context_capacity: 15, M3_reminder_motivation: 27, M4_ai_voice_integration: 12, M5_visual_custom_progress: 17, M6_guidance_planning: 14 }
};
for (const [type, codes] of Object.entries(expectedThemes)) {
  const included = openResponses.filter((response) => response.question === type && response.included);
  for (const [code, expected] of Object.entries(codes)) assert.equal(included.filter((response) => response.codes.includes(code)).length, expected, `Theme invariant failed: ${code}`);
}
const expectedExclusions = {
  frustrations: { base_no_content: 19, satisfied_or_nonuser: 8 },
  recovery: { base_no_content: 11, strategy_free_confirmation: 7 },
  magic: { base_no_content: 15, satisfied_or_nonuser: 2 }
};
for (const [type, reasons] of Object.entries(expectedExclusions)) {
  for (const [reason, expected] of Object.entries(reasons)) assert.equal(openResponses.filter((response) => response.question === type && response.exclusion_reason === reason).length, expected, `Exclusion invariant failed: ${type}/${reason}`);
}

const outputNames = [];
const aggregateHeader = ['cohort', 'id', 'section', 'label', 'category', 'numerator', 'denominator', 'percent', 'definition'];
for (const [cohort, records] of Object.entries(aggregateByCohort)) {
  const name = `aggregates-${cohort}.csv`;
  writeCsv(name, aggregateHeader, records.map((row) => aggregateHeader.map((key) => row[key])));
  outputNames.push(name);
}
const themeHeader = ['cohort', 'question', 'code', 'numerator', 'denominator', 'percent', 'definition'];
for (const [cohort, records] of Object.entries(openThemes)) {
  const name = `open-themes-${cohort}.csv`;
  writeCsv(name, themeHeader, records.map((row) => themeHeader.map((key) => row[key])));
  outputNames.push(name);
  const auditName = `open-audit-${cohort}.csv`;
  const audit = openForCohort(cohorts[cohort]).map((response) => [
    response.key, response.question, response.included ? 1 : 0,
    response.exclusion_reason, response.codes.length ? response.codes.join('|') : response.included ? 'OTHER_UNCLEAR' : ''
  ]);
  writeCsv(auditName, ['response_key', 'question', 'included', 'exclusion_reason', 'codes'], audit);
  outputNames.push(auditName);
}

const formatMetric = (cohort, id) => {
  const row = getAgg(cohort, id);
  return `${row.numerator}/${row.denominator} (${row.percent}%)`;
};
const selectedMetrics = [
  ['unfinished_manual', 'Manual transfer'], ['unfinished_accumulation', 'Accumulation'],
  ['unfinished_intersection', 'Manual AND accumulation'], ['unfinished_union', 'Manual OR accumulation'],
  ['likert_state_top2', 'State-aware planning, 4–5'], ['likert_capacity_top2', 'Capacity difficulty, 4–5'],
  ['likert_small_top2', 'Small-task difficulty, 4–5'], ['likert_overload_top2', 'List overload, 4–5'],
  ['likert_clarity_top2', 'Day-clarity difficulty, 4–5'], ['add_tasks_voice', 'Voice task entry'],
  ['focus_fixed_morning', 'Morning / fixed peaks'], ['focus_fixed_evening', 'Evening / fixed peaks'],
  ['focus_no_fixed', 'No fixed peak / all valid focus responses']
];
const report = [
  '# Planning survey — reproducible analysis report', '',
  `Protocol: **v${VERSION}**. Full-166 is primary; early-99 is a retrospective audit; late-67 is exploratory only.`,
  'The survey followed earlier prototyping/dogfooding and does not establish product outcomes.', '',
  `Source basename: \`${path.basename(sourcePath)}\``,
  `Source SHA-256: \`${crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex')}\``, '',
  '## Cohorts', '',
  '| Cohort | N | First submission | Last submission | Role |', '|---|---:|---|---|---|',
  `| Early-99 | 99 | ${isoDate(cohorts.early99[0])} | ${isoDate(cohorts.early99.at(-1))} | Historical sensitivity audit |`,
  `| Late-67 | 67 | ${isoDate(cohorts.late67[0])} | ${isoDate(cohorts.late67.at(-1))} | Exploratory composition check |`,
  `| Full-166 | 166 | ${isoDate(cohorts.full166[0])} | ${isoDate(cohorts.full166.at(-1))} | Primary synthesis |`, '',
  '## Closed-question comparison', '',
  '| Metric | Early-99 | Full-166 |', '|---|---:|---:|',
  ...selectedMetrics.map(([id, label]) => `| ${label} | ${formatMetric('early99', id)} | ${formatMetric('full166', id)} |`), '',
  'Every percentage uses the valid non-empty denominator for that item and cohort. Multi-select branches are counted per respondent; the union is not a sum of percentages.', '',
  '## Open-question bases', '',
  '| Cohort | Question | Raw | Excluded | Thematic base | Other/unclear |', '|---|---|---:|---:|---:|---:|'
];
for (const cohort of ['early99', 'full166']) {
  for (const question of Object.keys(openDefinitions)) {
    const subset = openForCohort(cohorts[cohort]).filter((response) => response.question === question);
    const included = subset.filter((response) => response.included);
    report.push(`| ${cohort} | ${question} | ${subset.length} | ${subset.length - included.length} | ${included.length} | ${included.filter((response) => !response.codes.length).length} |`);
  }
}
const rareBusy = (cohort) => getAgg(cohort, 'planner_frequency', 'only_when_busy').numerator + getAgg(cohort, 'planner_frequency', 'rarely_never').numerator;
const rareBusyText = (cohort) => `${rareBusy(cohort)}/${cohorts[cohort].length} (${pct(rareBusy(cohort), cohorts[cohort].length)}%)`;
report.push('', '## Exploratory cohort composition — not a time trend', '',
  `Rare/busy planning: early-99 ${rareBusyText('early99')}; late-67 ${rareBusyText('late67')}.`,
  `State-aware planning 4–5: early-99 ${formatMetric('early99', 'likert_state_top2')}; late-67 ${formatMetric('late67', 'likert_state_top2')}.`,
  'These are descriptive post-hoc comparisons. They do not establish temporal change, causality or a latent factor.', '',
  '## Files', '',
  '- `aggregates-*.csv`: closed-question distributions and explicit metric denominators.',
  '- `open-themes-*.csv`: multi-label theme counts and exclusion summaries.',
  '- `open-audit-*.csv`: pseudonymous inclusion decisions and codes without response text.',
  '- `analysis-manifest.json`: source hash, cohort ranges and validation status.', '');
fs.writeFileSync(path.join(outputDir, 'analysis-report.md'), report.join('\n'));
outputNames.push('analysis-report.md');

const primary = Object.fromEntries(selectedMetrics.map(([id]) => [id, {
  numerator: getAgg('full166', id).numerator, denominator: getAgg('full166', id).denominator, percent: getAgg('full166', id).percent
}]));
const manifest = {
  protocol_version: VERSION,
  source_file: path.basename(sourcePath),
  source_sha256: crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex'),
  cohorts: Object.fromEntries(Object.entries(cohorts).map(([name, cohort]) => [name, {
    n: cohort.length, first_submission_date: isoDate(cohort[0]), last_submission_date: isoDate(cohort.at(-1))
  }])),
  primary_full166: primary,
  validation: {
    unique_submission_count: 166,
    headline_invariants: 'passed',
    open_base_invariants: 'passed',
    deterministic_outputs: true,
    direct_identifiers_in_outputs: false
  },
  outputs: [...outputNames, 'analysis-manifest.json']
};
fs.writeFileSync(path.join(outputDir, 'analysis-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
outputNames.push('analysis-manifest.json');
for (const name of outputNames) {
  const content = fs.readFileSync(path.join(outputDir, name), 'utf8');
  assert.ok(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(content), `Email-shaped identifier in ${name}`);
  assert.ok(!/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(content), `UUID-shaped Submission ID in ${name}`);
  assert.ok(!content.includes('avbur'), `Local user path in ${name}`);
}
console.log(`Analysis v${VERSION} complete: early-99 audit, late-67 exploratory, full-166 primary.`);
console.log(`Full-166 headline: union=${formatMetric('full166', 'unfinished_union')}; state=${formatMetric('full166', 'likert_state_top2')}; capacity=${formatMetric('full166', 'likert_capacity_top2')}.`);
console.log(`Generated ${outputNames.length} deterministic files in ${outputDir}`);
