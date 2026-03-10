import express from 'express';
import cors from 'cors';
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'milvidas.db');

const app = express();
app.use(cors());
app.use(express.json());

const SQL = await initSqlJs();
let db;

if (existsSync(DB_PATH)) {
  const buffer = readFileSync(DB_PATH);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

function saveDb() {
  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] };
}

// ── Create tables ──
db.run(`CREATE TABLE IF NOT EXISTS LIVROS (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  GOOGLE_BOOKS_ID TEXT UNIQUE, TITULO TEXT, AUTOR TEXT, CAPA_URL TEXT, SINOPSE TEXT,
  EDITORA TEXT, ISBN TEXT, PAGINAS INTEGER, GENERO TEXT, ANO_PUBLICACAO TEXT, IDIOMA TEXT, CRIADO_EM TEXT
)`);
db.run(`CREATE TABLE IF NOT EXISTS BIBLIOTECA (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  LIVRO_ID INTEGER REFERENCES LIVROS(ID), STATUS TEXT, PRIORIDADE TEXT, POSICAO INTEGER,
  DATA_ADICIONADO TEXT, DATA_INICIO TEXT, DATA_FIM TEXT, CRIADO_EM TEXT
)`);
db.run(`CREATE TABLE IF NOT EXISTS AVALIACOES (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  BIBLIOTECA_ID INTEGER UNIQUE REFERENCES BIBLIOTECA(ID), NOTA INTEGER, REVIEW TEXT, CRIADO_EM TEXT
)`);
db.run(`CREATE TABLE IF NOT EXISTS NOTAS_LEITURA (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  BIBLIOTECA_ID INTEGER REFERENCES BIBLIOTECA(ID), TEXTO TEXT, PAGINA INTEGER, CRIADO_EM TEXT
)`);
db.run(`CREATE TABLE IF NOT EXISTS META_LEITURA (
  ID INTEGER PRIMARY KEY AUTOINCREMENT, ANO INTEGER, META_LIVROS INTEGER, CRIADO_EM TEXT
)`);
saveDb();

const GOOGLE_BOOKS_API_KEY = 'AIzaSyA8FpQjUaCWtTir-EJhUjhFuJ09T3rqQ5I';

// ── Dashboard ──
app.get('/api/dashboard/kpis', (req, res) => {
  const total = get('SELECT COUNT(*) as count FROM BIBLIOTECA');
  const lidos = get("SELECT COUNT(*) as count FROM BIBLIOTECA WHERE STATUS = 'LIDO'");
  const lendo = get("SELECT COUNT(*) as count FROM BIBLIOTECA WHERE STATUS = 'LENDO'");
  const wishlist = get("SELECT COUNT(*) as count FROM BIBLIOTECA WHERE STATUS = 'WISHLIST'");
  const proximas = get("SELECT COUNT(*) as count FROM BIBLIOTECA WHERE STATUS = 'PROXIMA_LEITURA'");
  res.json({
    total: total.count,
    lidos: lidos.count,
    lendo: lendo.count,
    wishlist: wishlist.count,
    proximas: proximas.count
  });
});

app.get('/api/dashboard/lendo-agora', (req, res) => {
  const livro = get(`
    SELECT B.*, L.TITULO, L.AUTOR, L.CAPA_URL, L.PAGINAS, L.GENERO
    FROM BIBLIOTECA B
    JOIN LIVROS L ON B.LIVRO_ID = L.ID
    WHERE B.STATUS = 'LENDO'
    ORDER BY B.DATA_INICIO DESC
    LIMIT 1
  `);
  res.json(livro || null);
});

app.get('/api/dashboard/atividade-recente', (req, res) => {
  const atividades = all(`
    SELECT * FROM (
      SELECT 'AVALIACAO' as tipo, A.NOTA as detalhe, A.CRIADO_EM as data, L.TITULO, B.ID as biblioteca_id
      FROM AVALIACOES A
      JOIN BIBLIOTECA B ON A.BIBLIOTECA_ID = B.ID
      JOIN LIVROS L ON B.LIVRO_ID = L.ID
      UNION ALL
      SELECT 'NOTA' as tipo, SUBSTR(N.TEXTO, 1, 80) as detalhe, N.CRIADO_EM as data, L.TITULO, B.ID as biblioteca_id
      FROM NOTAS_LEITURA N
      JOIN BIBLIOTECA B ON N.BIBLIOTECA_ID = B.ID
      JOIN LIVROS L ON B.LIVRO_ID = L.ID
      UNION ALL
      SELECT 'ADICIONADO' as tipo, B.STATUS as detalhe, B.DATA_ADICIONADO as data, L.TITULO, B.ID as biblioteca_id
      FROM BIBLIOTECA B
      JOIN LIVROS L ON B.LIVRO_ID = L.ID
    ) ORDER BY data DESC
    LIMIT 8
  `);
  res.json(atividades);
});

app.get('/api/dashboard/recentes', (req, res) => {
  const livros = all(`
    SELECT B.*, L.TITULO, L.AUTOR, L.CAPA_URL, L.GENERO
    FROM BIBLIOTECA B
    JOIN LIVROS L ON B.LIVRO_ID = L.ID
    ORDER BY B.DATA_ADICIONADO DESC
    LIMIT 10
  `);
  res.json(livros);
});

// ── Biblioteca ──
app.get('/api/biblioteca', (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT B.*, L.TITULO, L.AUTOR, L.CAPA_URL, L.GENERO, L.PAGINAS,
           A.NOTA, A.REVIEW
    FROM BIBLIOTECA B
    JOIN LIVROS L ON B.LIVRO_ID = L.ID
    LEFT JOIN AVALIACOES A ON A.BIBLIOTECA_ID = B.ID
  `;
  const params = [];
  if (status) {
    query += ' WHERE B.STATUS = ?';
    params.push(status);
  }
  query += ' ORDER BY B.DATA_ADICIONADO DESC';
  const livros = all(query, params);
  res.json(livros);
});

app.get('/api/livro/:bibliotecaId', (req, res) => {
  const livro = get(`
    SELECT B.*, L.TITULO, L.AUTOR, L.CAPA_URL, L.SINOPSE, L.EDITORA, L.ISBN,
           L.PAGINAS, L.GENERO, L.ANO_PUBLICACAO, L.IDIOMA,
           B.ID as BIBLIOTECA_ID, L.ID as LIVRO_ID,
           A.ID as AVALIACAO_ID, A.NOTA, A.REVIEW
    FROM BIBLIOTECA B
    JOIN LIVROS L ON B.LIVRO_ID = L.ID
    LEFT JOIN AVALIACOES A ON A.BIBLIOTECA_ID = B.ID
    WHERE B.ID = ?
  `, [Number(req.params.bibliotecaId)]);
  if (!livro) return res.status(404).json({ error: 'Livro não encontrado' });
  res.json(livro);
});

app.patch('/api/biblioteca/:id', (req, res) => {
  const { STATUS, PRIORIDADE, POSICAO, DATA_INICIO, DATA_FIM } = req.body;
  const fields = [];
  const values = [];
  if (STATUS !== undefined) { fields.push('STATUS = ?'); values.push(STATUS); }
  if (PRIORIDADE !== undefined) { fields.push('PRIORIDADE = ?'); values.push(PRIORIDADE); }
  if (POSICAO !== undefined) { fields.push('POSICAO = ?'); values.push(POSICAO); }
  if (DATA_INICIO !== undefined) { fields.push('DATA_INICIO = ?'); values.push(DATA_INICIO); }
  if (DATA_FIM !== undefined) { fields.push('DATA_FIM = ?'); values.push(DATA_FIM); }
  if (fields.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
  values.push(Number(req.params.id));
  run(`UPDATE BIBLIOTECA SET ${fields.join(', ')} WHERE ID = ?`, values);
  res.json({ success: true });
});

app.delete('/api/biblioteca/:id', (req, res) => {
  const id = Number(req.params.id);
  run('DELETE FROM NOTAS_LEITURA WHERE BIBLIOTECA_ID = ?', [id]);
  run('DELETE FROM AVALIACOES WHERE BIBLIOTECA_ID = ?', [id]);
  run('DELETE FROM BIBLIOTECA WHERE ID = ?', [id]);
  res.json({ success: true });
});

// ── Notas ──
app.get('/api/notas/:bibliotecaId', (req, res) => {
  const notas = all('SELECT * FROM NOTAS_LEITURA WHERE BIBLIOTECA_ID = ? ORDER BY CRIADO_EM DESC',
    [Number(req.params.bibliotecaId)]);
  res.json(notas);
});

app.post('/api/notas', (req, res) => {
  const { BIBLIOTECA_ID, TEXTO, PAGINA } = req.body;
  const now = new Date().toISOString().slice(0, 19);
  const result = run(
    'INSERT INTO NOTAS_LEITURA (BIBLIOTECA_ID, TEXTO, PAGINA, CRIADO_EM) VALUES (?, ?, ?, ?)',
    [BIBLIOTECA_ID, TEXTO, PAGINA || null, now]);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/notas/:id', (req, res) => {
  const { TEXTO, PAGINA } = req.body;
  run('UPDATE NOTAS_LEITURA SET TEXTO = ?, PAGINA = ? WHERE ID = ?',
    [TEXTO, PAGINA || null, Number(req.params.id)]);
  res.json({ success: true });
});

app.delete('/api/notas/:id', (req, res) => {
  run('DELETE FROM NOTAS_LEITURA WHERE ID = ?', [Number(req.params.id)]);
  res.json({ success: true });
});

// ── Avaliações ──
app.get('/api/avaliacoes/:bibliotecaId', (req, res) => {
  const avaliacao = get('SELECT * FROM AVALIACOES WHERE BIBLIOTECA_ID = ?',
    [Number(req.params.bibliotecaId)]);
  res.json(avaliacao || null);
});

app.post('/api/avaliacoes', (req, res) => {
  const { BIBLIOTECA_ID, NOTA, REVIEW } = req.body;
  const now = new Date().toISOString().slice(0, 19);
  const result = run(
    'INSERT INTO AVALIACOES (BIBLIOTECA_ID, NOTA, REVIEW, CRIADO_EM) VALUES (?, ?, ?, ?)',
    [BIBLIOTECA_ID, NOTA, REVIEW || null, now]);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/avaliacoes/:id', (req, res) => {
  const { NOTA, REVIEW } = req.body;
  run('UPDATE AVALIACOES SET NOTA = ?, REVIEW = ? WHERE ID = ?',
    [NOTA, REVIEW || null, Number(req.params.id)]);
  res.json({ success: true });
});

// ── Stats ──
app.get('/api/stats/gerais', (req, res) => {
  const lidos = get("SELECT COUNT(*) as count FROM BIBLIOTECA WHERE STATUS = 'LIDO'");
  const paginas = get(`
    SELECT COALESCE(SUM(L.PAGINAS), 0) as total
    FROM BIBLIOTECA B JOIN LIVROS L ON B.LIVRO_ID = L.ID WHERE B.STATUS = 'LIDO'`);
  const media = get('SELECT COALESCE(AVG(NOTA), 0) as media FROM AVALIACOES');
  res.json({
    total_lidos: lidos.count,
    total_paginas: paginas.total,
    media_nota: Math.round(media.media * 10) / 10
  });
});

app.get('/api/stats/por-mes', (req, res) => {
  const ano = req.query.ano || new Date().getFullYear();
  const meses = all(`
    SELECT SUBSTR(DATA_FIM, 6, 2) as mes, COUNT(*) as count
    FROM BIBLIOTECA WHERE STATUS = 'LIDO' AND SUBSTR(DATA_FIM, 1, 4) = ?
    GROUP BY mes ORDER BY mes`, [String(ano)]);
  res.json(meses);
});

app.get('/api/stats/generos', (req, res) => {
  const generos = all(`
    SELECT L.GENERO as genero, COUNT(*) as count
    FROM BIBLIOTECA B JOIN LIVROS L ON B.LIVRO_ID = L.ID
    WHERE B.STATUS = 'LIDO' AND L.GENERO IS NOT NULL AND L.GENERO != ''
    GROUP BY L.GENERO ORDER BY count DESC`);
  res.json(generos);
});

app.get('/api/stats/autores', (req, res) => {
  const autores = all(`
    SELECT L.AUTOR as autor, COUNT(*) as count
    FROM BIBLIOTECA B JOIN LIVROS L ON B.LIVRO_ID = L.ID
    WHERE B.STATUS = 'LIDO' GROUP BY L.AUTOR ORDER BY count DESC LIMIT 10`);
  res.json(autores);
});

// ── Meta ──
app.get('/api/meta/:ano', (req, res) => {
  const meta = get('SELECT * FROM META_LEITURA WHERE ANO = ?', [Number(req.params.ano)]);
  const lidos = get(`
    SELECT COUNT(*) as count FROM BIBLIOTECA
    WHERE STATUS = 'LIDO' AND SUBSTR(DATA_FIM, 1, 4) = ?`, [String(req.params.ano)]);
  res.json({ meta: meta || null, lidos: lidos.count });
});

app.post('/api/meta', (req, res) => {
  const { ANO, META_LIVROS } = req.body;
  const now = new Date().toISOString().slice(0, 19);
  const existing = get('SELECT ID FROM META_LEITURA WHERE ANO = ?', [ANO]);
  if (existing) {
    run('UPDATE META_LEITURA SET META_LIVROS = ? WHERE ANO = ?', [META_LIVROS, ANO]);
    res.json({ id: existing.ID });
  } else {
    const result = run(
      'INSERT INTO META_LEITURA (ANO, META_LIVROS, CRIADO_EM) VALUES (?, ?, ?)',
      [ANO, META_LIVROS, now]);
    res.json({ id: result.lastInsertRowid });
  }
});

// ── Livros ──
app.post('/api/livros', (req, res) => {
  const { GOOGLE_BOOKS_ID, TITULO, AUTOR, CAPA_URL, SINOPSE, EDITORA, ISBN, PAGINAS, GENERO, ANO_PUBLICACAO, IDIOMA } = req.body;
  const now = new Date().toISOString().slice(0, 19);
  const capaHttps = CAPA_URL ? CAPA_URL.replace(/^http:/, 'https:') : null;
  const existing = get('SELECT ID FROM LIVROS WHERE GOOGLE_BOOKS_ID = ?', [GOOGLE_BOOKS_ID]);
  if (existing) {
    res.json({ id: existing.ID, existing: true });
    return;
  }
  const result = run(
    `INSERT INTO LIVROS (GOOGLE_BOOKS_ID, TITULO, AUTOR, CAPA_URL, SINOPSE, EDITORA, ISBN, PAGINAS, GENERO, ANO_PUBLICACAO, IDIOMA, CRIADO_EM)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [GOOGLE_BOOKS_ID, TITULO, AUTOR, capaHttps, SINOPSE || null, EDITORA || null, ISBN || null, PAGINAS || null, GENERO || null, ANO_PUBLICACAO || null, IDIOMA || null, now]);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/livros/verificar/:googleBooksId', (req, res) => {
  const livro = get(`
    SELECT L.ID as LIVRO_ID, B.ID as BIBLIOTECA_ID, B.STATUS
    FROM LIVROS L LEFT JOIN BIBLIOTECA B ON B.LIVRO_ID = L.ID
    WHERE L.GOOGLE_BOOKS_ID = ?`, [req.params.googleBooksId]);
  res.json(livro || null);
});

app.post('/api/biblioteca', (req, res) => {
  const { LIVRO_ID, STATUS, PRIORIDADE, POSICAO, DATA_INICIO, DATA_FIM } = req.body;
  const now = new Date().toISOString().slice(0, 19);
  const dataInicio = DATA_INICIO || (['LENDO', 'LIDO'].includes(STATUS) ? now : null);
  const dataFim = DATA_FIM || (STATUS === 'LIDO' ? now : null);
  const result = run(
    `INSERT INTO BIBLIOTECA (LIVRO_ID, STATUS, PRIORIDADE, POSICAO, DATA_ADICIONADO, DATA_INICIO, DATA_FIM, CRIADO_EM)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [LIVRO_ID, STATUS, PRIORIDADE || null, POSICAO || null, now, dataInicio, dataFim, now]);
  res.json({ id: result.lastInsertRowid });
});

// ── Google Books Proxy ──
const CATEGORIAS_BLOQUEADAS = [
  'science', 'technology', 'mathematics', 'medical', 'computers',
  'education', 'law', 'business', 'economics', 'engineering',
  'psychology', 'philosophy', 'political', 'religion', 'health',
  'cooking', 'gardening', 'crafts', 'games', 'sports',
  'travel', 'reference', 'study aids', 'textbook', 'academic',
  'journal', 'periodical', 'dissertation', 'thesis', 'proceedings',
  'architecture', 'design', 'art', 'music', 'photography',
  'nature', 'pets', 'transportation', 'antiques', 'body, mind & spirit',
];

function ehLiteratura(item) {
  const vol = item.volumeInfo || {};
  const cats = (vol.categories || []).map(c => c.toLowerCase());
  const titulo = (vol.title || '').toLowerCase();

  // Rejeitar se não tem título ou parece acadêmico/referência pelo título
  const termosAcademicos = [
    'journal', 'proceedings', 'handbook', 'textbook', 'manual',
    'encyclopedia', 'dictionary', 'conference', 'dissertation',
    'thesis', 'review of', 'bulletin', 'annual report', 'transactions of',
    'finding list', 'bibliography', 'catalogue', 'catalog', 'index of',
    'companion to', 'guide to', 'introduction to', 'history of',
    'studies in', 'essays on', 'critical', 'analysis of',
    'beacham', 'popular world fiction', 'condensed',
  ];
  if (termosAcademicos.some(t => titulo.includes(t))) return false;

  // Categorias que indicam que É literatura (aceitar)
  const catsFiccao = ['fiction', 'novel', 'poetry', 'drama', 'humor', 'comics', 'graphic novels', 'young adult', 'juvenile fiction', 'self-help'];
  if (cats.some(c => catsFiccao.some(f => c.includes(f)))) return true;

  // Categorias de referência/acadêmico sobre literatura (rejeitar)
  const catsReferencia = ['literary criticism', 'literary collections', 'reference', 'study aids', 'language arts'];
  if (cats.some(c => catsReferencia.some(r => c.includes(r)))) return false;

  // Categorias bloqueadas (rejeitar)
  if (cats.some(c => CATEGORIAS_BLOQUEADAS.some(b => c.includes(b)))) return false;

  // Sem categoria definida → aceitar (pode ser literatura sem classificação)
  return true;
}

app.get('/api/google-books/search', async (req, res) => {
  const { q, startIndex = 0, maxResults = 12, filtrar, orderBy, minYear } = req.query;
  if (!q) return res.status(400).json({ error: 'Query obrigatória' });
  try {
    const filtroRigido = filtrar === '1';
    const fetchSize = filtroRigido ? Math.min(Number(maxResults) * 3, 40) : Number(maxResults);
    let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&startIndex=${startIndex}&maxResults=${fetchSize}&printType=books&key=${GOOGLE_BOOKS_API_KEY}`;
    if (orderBy === 'newest') url += '&orderBy=newest';
    const response = await fetch(url);
    const data = await response.json();

    if (data.items) {
      // Só aplica filtro de literatura quando explicitamente pedido (recomendações)
      let filtered = filtroRigido ? data.items.filter(ehLiteratura) : data.items;

      // Filtro por ano mínimo de publicação
      if (minYear) {
        const min = Number(minYear);
        filtered = filtered.filter(item => {
          const pubDate = item.volumeInfo?.publishedDate || '';
          const year = parseInt(pubDate.slice(0, 4));
          return !isNaN(year) && year >= min;
        });
      }

      // Filtro: só livros com capa REAL disponível (para recomendações visuais)
      if (req.query.comCapa === '1') {
        // Primeiro: deve ter imageLinks
        filtered = filtered.filter(item => {
          const links = item.volumeInfo?.imageLinks;
          return links && (links.thumbnail || links.smallThumbnail);
        });

        // Segundo: verificar se a capa é real (JPEG) e não placeholder (PNG)
        // Google retorna PNG para placeholders "image not available" e JPEG para capas reais
        // Tenta zoom=3 primeiro (alta res = melhor qualidade), senão zoom=1, senão filtra
        const verificacoes = await Promise.all(
          filtered.map(async (item) => {
            try {
              const baseUrl = (item.volumeInfo.imageLinks.thumbnail || item.volumeInfo.imageLinks.smallThumbnail)
                .replace(/^http:/, 'https:').replace(/&edge=curl/g, '');

              // Tentar zoom=3 (melhor resolução) — JPEG = capa real
              const zoom3Url = baseUrl.replace(/zoom=\d/, 'zoom=3');
              const resp3 = await fetch(zoom3Url, { method: 'HEAD' });
              if (resp3.headers.get('content-type')?.includes('jpeg')) {
                item._bestCoverUrl = zoom3Url;
                return true;
              }

              // zoom=3 é placeholder PNG, tentar zoom=1
              const zoom1Url = baseUrl.replace(/zoom=\d/, 'zoom=1');
              const resp1 = await fetch(zoom1Url, { method: 'HEAD' });
              if (resp1.headers.get('content-type')?.includes('jpeg')) {
                item._bestCoverUrl = zoom1Url;
                return true;
              }

              // Nenhum zoom tem capa real
              return false;
            } catch {
              return false;
            }
          })
        );
        filtered = filtered.filter((_, i) => verificacoes[i]);
      }

      data.items = filtered.slice(0, Number(maxResults));
      // Preservar totalItems original do Google para paginação funcionar
      // Próximas páginas podem ter mais resultados mesmo se esta página teve poucos
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar na Google Books API' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`MilVidas API rodando em http://localhost:${PORT}`);
});
