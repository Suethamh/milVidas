import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ── Banco de dados: Turso (produção) ou SQLite local (dev) ──
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${join(__dirname, 'milvidas.db')}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ── Helpers async ──
async function all(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows;
}

async function get(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function run(sql, args = []) {
  const result = await db.execute({ sql, args });
  return { lastInsertRowid: Number(result.lastInsertRowid) };
}

// ── Create tables ──
await db.batch([
  { sql: `CREATE TABLE IF NOT EXISTS LIVROS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    GOOGLE_BOOKS_ID TEXT UNIQUE, TITULO TEXT, AUTOR TEXT, CAPA_URL TEXT, SINOPSE TEXT,
    EDITORA TEXT, ISBN TEXT, PAGINAS INTEGER, GENERO TEXT, ANO_PUBLICACAO TEXT, IDIOMA TEXT, CRIADO_EM TEXT
  )` },
  { sql: `CREATE TABLE IF NOT EXISTS BIBLIOTECA (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    LIVRO_ID INTEGER REFERENCES LIVROS(ID), STATUS TEXT, PRIORIDADE TEXT, POSICAO INTEGER,
    DATA_ADICIONADO TEXT, DATA_INICIO TEXT, DATA_FIM TEXT, CRIADO_EM TEXT
  )` },
  { sql: `CREATE TABLE IF NOT EXISTS AVALIACOES (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    BIBLIOTECA_ID INTEGER UNIQUE REFERENCES BIBLIOTECA(ID), NOTA INTEGER, REVIEW TEXT, CRIADO_EM TEXT
  )` },
  { sql: `CREATE TABLE IF NOT EXISTS NOTAS_LEITURA (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    BIBLIOTECA_ID INTEGER REFERENCES BIBLIOTECA(ID), TEXTO TEXT, PAGINA INTEGER, CRIADO_EM TEXT
  )` },
  { sql: `CREATE TABLE IF NOT EXISTS META_LEITURA (
    ID INTEGER PRIMARY KEY AUTOINCREMENT, ANO INTEGER, META_LIVROS INTEGER, CRIADO_EM TEXT
  )` },
]);

// ── Auto-seed: popular banco se estiver vazio ──
const isEmpty = await get('SELECT COUNT(*) as count FROM LIVROS');
if (isEmpty.count === 0) {
  console.log('Banco vazio detectado — populando com dados iniciais...');
  const now = '2026-03-06T10:00:00';
  const seedLivros = [
    ['wrOQLV6xB-wC', 'Harry Potter e a Pedra Filosofal', 'J.K. Rowling', 'https://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Harry Potter nunca tinha ouvido falar em Hogwarts até o momento em que as cartas começam a aparecer no capacho do número 4 da rua dos Alfeneiros.', 'Rocco', '9788532511010', 264, 'Fantasia', '1997', 'pt-BR'],
    ['k6DwzwEACAAJ', 'O Senhor dos Anéis: A Sociedade do Anel', 'J.R.R. Tolkien', 'https://books.google.com/books/content?id=R7KuDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Numa cidadezinha indolente do Condado, o jovem hobbit Frodo recebe um presente de seu tio Bilbo: um anel mágico.', 'Martins Fontes', '9788533613379', 576, 'Fantasia', '1954', 'pt-BR'],
    ['HCo1DwAAQBAJ', '1984', 'George Orwell', 'https://books.google.com/books/content?id=HCo1DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Winston Smith trabalha no Ministério da Verdade, em Londres, adaptando a realidade dos fatos à versão oficial do Partido.', 'Companhia das Letras', '9788535914849', 416, 'Ficção Científica', '1949', 'pt-BR'],
    ['MZHORAS_bLcC', 'Dom Casmurro', 'Machado de Assis', 'https://books.google.com/books/content?id=MZHORAS_bLcC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Bento Santiago, o Dom Casmurro, narra a história de seu amor por Capitu, a vizinha de olhos de ressaca.', 'Penguin-Companhia', '9788582850350', 256, 'Romance', '1899', 'pt-BR'],
    ['FmyBAwAAQBAJ', 'O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'https://books.google.com/books/content?id=FmyBAwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Um piloto cai com seu avião no deserto do Saara e encontra um pequeno príncipe, vindo de um longínquo asteroide.', 'HarperCollins', '9788595081512', 96, 'Fábula', '1943', 'pt-BR'],
    ['MAqQDwAAQBAJ', 'Cem Anos de Solidão', 'Gabriel García Márquez', 'https://books.google.com/books/content?id=MAqQDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'A história da família Buendía na mítica cidade de Macondo, ao longo de sete gerações.', 'Record', '9788501012173', 448, 'Realismo Mágico', '1967', 'pt-BR'],
    ['ydQiDQAAQBAJ', 'Sapiens: Uma Breve História da Humanidade', 'Yuval Noah Harari', 'https://books.google.com/books/publisher/content?id=ydQiDQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'O que possibilitou ao Homo sapiens subjugar as demais espécies?', 'L&PM', '9788525432186', 464, 'Não-ficção', '2011', 'pt-BR'],
    ['NGbWnQEACAAJ', 'A Revolução dos Bichos', 'George Orwell', 'https://books.google.com/books/content?id=NGbWnQEACAAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Os animais da Granja do Solar, cansados da exploração, expulsam os humanos e criam suas próprias regras de convivência.', 'Companhia das Letras', '9788535909555', 152, 'Sátira', '1945', 'pt-BR'],
  ];
  const seedStmts = [];
  for (const l of seedLivros) {
    seedStmts.push({ sql: `INSERT INTO LIVROS (GOOGLE_BOOKS_ID, TITULO, AUTOR, CAPA_URL, SINOPSE, EDITORA, ISBN, PAGINAS, GENERO, ANO_PUBLICACAO, IDIOMA, CRIADO_EM) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [...l, now] });
  }
  const seedBib = [
    [1, 'LIDO', null, null, '2026-01-05T09:00:00', '2026-01-05T09:00:00', '2026-01-18T21:00:00'],
    [2, 'LIDO', null, null, '2026-01-20T10:00:00', '2026-01-20T10:00:00', '2026-02-10T18:00:00'],
    [3, 'LENDO', null, null, '2026-02-15T08:00:00', '2026-02-20T08:00:00', null],
    [4, 'LIDO', null, null, '2025-12-01T14:00:00', '2025-12-01T14:00:00', '2025-12-20T22:00:00'],
    [5, 'WISHLIST', 'ALTA', null, '2026-03-01T11:00:00', null, null],
    [6, 'PROXIMA_LEITURA', 'ALTA', 1, '2026-02-28T15:00:00', null, null],
    [7, 'PROXIMA_LEITURA', 'MEDIA', 2, '2026-03-02T09:00:00', null, null],
    [8, 'WISHLIST', 'MEDIA', null, '2026-03-04T16:00:00', null, null],
  ];
  for (const b of seedBib) {
    seedStmts.push({ sql: `INSERT INTO BIBLIOTECA (LIVRO_ID, STATUS, PRIORIDADE, POSICAO, DATA_ADICIONADO, DATA_INICIO, DATA_FIM, CRIADO_EM) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, args: [...b, now] });
  }
  const seedAval = [
    [1, 5, 'Um clássico absoluto! A magia de Hogwarts me transportou para outro mundo.'],
    [2, 5, 'A obra-prima da fantasia. Tolkien construiu um mundo com uma riqueza de detalhes impressionante.'],
    [4, 4, 'Machado de Assis é genial. A narrativa em primeira pessoa nos deixa sempre em dúvida sobre Capitu.'],
  ];
  for (const a of seedAval) {
    seedStmts.push({ sql: 'INSERT INTO AVALIACOES (BIBLIOTECA_ID, NOTA, REVIEW, CRIADO_EM) VALUES (?, ?, ?, ?)', args: [...a, now] });
  }
  const seedNotas = [
    [1, 'O chapéu seletor é uma metáfora brilhante sobre as escolhas que fazemos na vida.', 88],
    [1, 'A cena do espelho de Ojesed é de partir o coração.', 152],
    [2, 'A descrição do Condado transmite uma paz absurda. Tolkien sabia criar atmosfera.', 25],
    [3, 'A ideia de duplipensar é assustadoramente atual. Orwell era visionário.', 210],
  ];
  for (const n of seedNotas) {
    seedStmts.push({ sql: 'INSERT INTO NOTAS_LEITURA (BIBLIOTECA_ID, TEXTO, PAGINA, CRIADO_EM) VALUES (?, ?, ?, ?)', args: [...n, now] });
  }
  seedStmts.push({ sql: 'INSERT INTO META_LEITURA (ANO, META_LIVROS, CRIADO_EM) VALUES (?, ?, ?)', args: [2026, 24, now] });
  await db.batch(seedStmts);
  console.log('Auto-seed concluído: 8 livros, 8 biblioteca, 3 avaliações, 4 notas, 1 meta');
}

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || 'AIzaSyA8FpQjUaCWtTir-EJhUjhFuJ09T3rqQ5I';

// ── Servir frontend em produção ──
const frontendPath = join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));

// ── Dashboard ──
app.get('/api/dashboard/kpis', async (req, res) => {
  try {
    const total = await get('SELECT COUNT(*) as count FROM BIBLIOTECA');
    const lidos = await get("SELECT COUNT(*) as count FROM BIBLIOTECA WHERE STATUS = 'LIDO'");
    const lendo = await get("SELECT COUNT(*) as count FROM BIBLIOTECA WHERE STATUS = 'LENDO'");
    const wishlist = await get("SELECT COUNT(*) as count FROM BIBLIOTECA WHERE STATUS = 'WISHLIST'");
    const proximas = await get("SELECT COUNT(*) as count FROM BIBLIOTECA WHERE STATUS = 'PROXIMA_LEITURA'");
    res.json({
      total: total.count,
      lidos: lidos.count,
      lendo: lendo.count,
      wishlist: wishlist.count,
      proximas: proximas.count
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard/lendo-agora', async (req, res) => {
  try {
    const livro = await get(`
      SELECT B.*, L.TITULO, L.AUTOR, L.CAPA_URL, L.PAGINAS, L.GENERO
      FROM BIBLIOTECA B
      JOIN LIVROS L ON B.LIVRO_ID = L.ID
      WHERE B.STATUS = 'LENDO'
      ORDER BY B.DATA_INICIO DESC
      LIMIT 1
    `);
    res.json(livro || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard/atividade-recente', async (req, res) => {
  try {
    const atividades = await all(`
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard/recentes', async (req, res) => {
  try {
    const livros = await all(`
      SELECT B.*, L.TITULO, L.AUTOR, L.CAPA_URL, L.GENERO
      FROM BIBLIOTECA B
      JOIN LIVROS L ON B.LIVRO_ID = L.ID
      ORDER BY B.DATA_ADICIONADO DESC
      LIMIT 10
    `);
    res.json(livros);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Biblioteca ──
app.get('/api/biblioteca', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT B.*, L.TITULO, L.AUTOR, L.CAPA_URL, L.GENERO, L.PAGINAS,
             A.NOTA, A.REVIEW
      FROM BIBLIOTECA B
      JOIN LIVROS L ON B.LIVRO_ID = L.ID
      LEFT JOIN AVALIACOES A ON A.BIBLIOTECA_ID = B.ID
    `;
    const args = [];
    if (status) {
      query += ' WHERE B.STATUS = ?';
      args.push(status);
    }
    query += ' ORDER BY B.DATA_ADICIONADO DESC';
    const livros = await all(query, args);
    res.json(livros);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/livro/:bibliotecaId', async (req, res) => {
  try {
    const livro = await get(`
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/biblioteca/:id', async (req, res) => {
  try {
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
    await run(`UPDATE BIBLIOTECA SET ${fields.join(', ')} WHERE ID = ?`, values);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/biblioteca/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await run('DELETE FROM NOTAS_LEITURA WHERE BIBLIOTECA_ID = ?', [id]);
    await run('DELETE FROM AVALIACOES WHERE BIBLIOTECA_ID = ?', [id]);
    await run('DELETE FROM BIBLIOTECA WHERE ID = ?', [id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Notas ──
app.get('/api/notas/:bibliotecaId', async (req, res) => {
  try {
    const notas = await all('SELECT * FROM NOTAS_LEITURA WHERE BIBLIOTECA_ID = ? ORDER BY CRIADO_EM DESC',
      [Number(req.params.bibliotecaId)]);
    res.json(notas);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notas', async (req, res) => {
  try {
    const { BIBLIOTECA_ID, TEXTO, PAGINA } = req.body;
    const now = new Date().toISOString().slice(0, 19);
    const result = await run(
      'INSERT INTO NOTAS_LEITURA (BIBLIOTECA_ID, TEXTO, PAGINA, CRIADO_EM) VALUES (?, ?, ?, ?)',
      [BIBLIOTECA_ID, TEXTO, PAGINA || null, now]);
    res.json({ id: result.lastInsertRowid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/notas/:id', async (req, res) => {
  try {
    const { TEXTO, PAGINA } = req.body;
    await run('UPDATE NOTAS_LEITURA SET TEXTO = ?, PAGINA = ? WHERE ID = ?',
      [TEXTO, PAGINA || null, Number(req.params.id)]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/notas/:id', async (req, res) => {
  try {
    await run('DELETE FROM NOTAS_LEITURA WHERE ID = ?', [Number(req.params.id)]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Avaliações ──
app.get('/api/avaliacoes/:bibliotecaId', async (req, res) => {
  try {
    const avaliacao = await get('SELECT * FROM AVALIACOES WHERE BIBLIOTECA_ID = ?',
      [Number(req.params.bibliotecaId)]);
    res.json(avaliacao || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/avaliacoes', async (req, res) => {
  try {
    const { BIBLIOTECA_ID, NOTA, REVIEW } = req.body;
    const now = new Date().toISOString().slice(0, 19);
    const result = await run(
      'INSERT INTO AVALIACOES (BIBLIOTECA_ID, NOTA, REVIEW, CRIADO_EM) VALUES (?, ?, ?, ?)',
      [BIBLIOTECA_ID, NOTA, REVIEW || null, now]);
    res.json({ id: result.lastInsertRowid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/avaliacoes/:id', async (req, res) => {
  try {
    const { NOTA, REVIEW } = req.body;
    await run('UPDATE AVALIACOES SET NOTA = ?, REVIEW = ? WHERE ID = ?',
      [NOTA, REVIEW || null, Number(req.params.id)]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Stats ──
app.get('/api/stats/gerais', async (req, res) => {
  try {
    const lidos = await get("SELECT COUNT(*) as count FROM BIBLIOTECA WHERE STATUS = 'LIDO'");
    const paginas = await get(`
      SELECT COALESCE(SUM(L.PAGINAS), 0) as total
      FROM BIBLIOTECA B JOIN LIVROS L ON B.LIVRO_ID = L.ID WHERE B.STATUS = 'LIDO'`);
    const media = await get('SELECT COALESCE(AVG(NOTA), 0) as media FROM AVALIACOES');
    res.json({
      total_lidos: lidos.count,
      total_paginas: paginas.total,
      media_nota: Math.round(media.media * 10) / 10
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats/por-mes', async (req, res) => {
  try {
    const ano = req.query.ano || new Date().getFullYear();
    const meses = await all(`
      SELECT SUBSTR(DATA_FIM, 6, 2) as mes, COUNT(*) as count
      FROM BIBLIOTECA WHERE STATUS = 'LIDO' AND SUBSTR(DATA_FIM, 1, 4) = ?
      GROUP BY mes ORDER BY mes`, [String(ano)]);
    res.json(meses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats/generos', async (req, res) => {
  try {
    const generos = await all(`
      SELECT L.GENERO as genero, COUNT(*) as count
      FROM BIBLIOTECA B JOIN LIVROS L ON B.LIVRO_ID = L.ID
      WHERE B.STATUS = 'LIDO' AND L.GENERO IS NOT NULL AND L.GENERO != ''
      GROUP BY L.GENERO ORDER BY count DESC`);
    res.json(generos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats/autores', async (req, res) => {
  try {
    const autores = await all(`
      SELECT L.AUTOR as autor, COUNT(*) as count
      FROM BIBLIOTECA B JOIN LIVROS L ON B.LIVRO_ID = L.ID
      WHERE B.STATUS = 'LIDO' GROUP BY L.AUTOR ORDER BY count DESC LIMIT 10`);
    res.json(autores);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Meta ──
app.get('/api/meta/:ano', async (req, res) => {
  try {
    const meta = await get('SELECT * FROM META_LEITURA WHERE ANO = ?', [Number(req.params.ano)]);
    const lidos = await get(`
      SELECT COUNT(*) as count FROM BIBLIOTECA
      WHERE STATUS = 'LIDO' AND SUBSTR(DATA_FIM, 1, 4) = ?`, [String(req.params.ano)]);
    res.json({ meta: meta || null, lidos: lidos.count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/meta', async (req, res) => {
  try {
    const { ANO, META_LIVROS } = req.body;
    const now = new Date().toISOString().slice(0, 19);
    const existing = await get('SELECT ID FROM META_LEITURA WHERE ANO = ?', [ANO]);
    if (existing) {
      await run('UPDATE META_LEITURA SET META_LIVROS = ? WHERE ANO = ?', [META_LIVROS, ANO]);
      res.json({ id: existing.ID });
    } else {
      const result = await run(
        'INSERT INTO META_LEITURA (ANO, META_LIVROS, CRIADO_EM) VALUES (?, ?, ?)',
        [ANO, META_LIVROS, now]);
      res.json({ id: result.lastInsertRowid });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Livros ──
app.post('/api/livros', async (req, res) => {
  try {
    const { GOOGLE_BOOKS_ID, TITULO, AUTOR, CAPA_URL, SINOPSE, EDITORA, ISBN, PAGINAS, GENERO, ANO_PUBLICACAO, IDIOMA } = req.body;
    const now = new Date().toISOString().slice(0, 19);
    const capaHttps = CAPA_URL ? CAPA_URL.replace(/^http:/, 'https:') : null;
    const existing = await get('SELECT ID FROM LIVROS WHERE GOOGLE_BOOKS_ID = ?', [GOOGLE_BOOKS_ID]);
    if (existing) {
      res.json({ id: existing.ID, existing: true });
      return;
    }
    const result = await run(
      `INSERT INTO LIVROS (GOOGLE_BOOKS_ID, TITULO, AUTOR, CAPA_URL, SINOPSE, EDITORA, ISBN, PAGINAS, GENERO, ANO_PUBLICACAO, IDIOMA, CRIADO_EM)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [GOOGLE_BOOKS_ID, TITULO, AUTOR, capaHttps, SINOPSE || null, EDITORA || null, ISBN || null, PAGINAS || null, GENERO || null, ANO_PUBLICACAO || null, IDIOMA || null, now]);
    res.json({ id: result.lastInsertRowid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/livros/verificar/:googleBooksId', async (req, res) => {
  try {
    const livro = await get(`
      SELECT L.ID as LIVRO_ID, B.ID as BIBLIOTECA_ID, B.STATUS
      FROM LIVROS L LEFT JOIN BIBLIOTECA B ON B.LIVRO_ID = L.ID
      WHERE L.GOOGLE_BOOKS_ID = ?`, [req.params.googleBooksId]);
    res.json(livro || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/biblioteca', async (req, res) => {
  try {
    const { LIVRO_ID, STATUS, PRIORIDADE, POSICAO, DATA_INICIO, DATA_FIM } = req.body;
    const now = new Date().toISOString().slice(0, 19);
    const dataInicio = DATA_INICIO || (['LENDO', 'LIDO'].includes(STATUS) ? now : null);
    const dataFim = DATA_FIM || (STATUS === 'LIDO' ? now : null);
    const result = await run(
      `INSERT INTO BIBLIOTECA (LIVRO_ID, STATUS, PRIORIDADE, POSICAO, DATA_ADICIONADO, DATA_INICIO, DATA_FIM, CRIADO_EM)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [LIVRO_ID, STATUS, PRIORIDADE || null, POSICAO || null, now, dataInicio, dataFim, now]);
    res.json({ id: result.lastInsertRowid });
  } catch (e) { res.status(500).json({ error: e.message }); }
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

  const catsFiccao = ['fiction', 'novel', 'poetry', 'drama', 'humor', 'comics', 'graphic novels', 'young adult', 'juvenile fiction', 'self-help'];
  if (cats.some(c => catsFiccao.some(f => c.includes(f)))) return true;

  const catsReferencia = ['literary criticism', 'literary collections', 'reference', 'study aids', 'language arts'];
  if (cats.some(c => catsReferencia.some(r => c.includes(r)))) return false;

  if (cats.some(c => CATEGORIAS_BLOQUEADAS.some(b => c.includes(b)))) return false;

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
      let filtered = filtroRigido ? data.items.filter(ehLiteratura) : data.items;

      if (minYear) {
        const min = Number(minYear);
        filtered = filtered.filter(item => {
          const pubDate = item.volumeInfo?.publishedDate || '';
          const year = parseInt(pubDate.slice(0, 4));
          return !isNaN(year) && year >= min;
        });
      }

      if (req.query.comCapa === '1') {
        filtered = filtered.filter(item => {
          const links = item.volumeInfo?.imageLinks;
          return links && (links.thumbnail || links.smallThumbnail);
        });

        const verificacoes = await Promise.all(
          filtered.map(async (item) => {
            try {
              const baseUrl = (item.volumeInfo.imageLinks.thumbnail || item.volumeInfo.imageLinks.smallThumbnail)
                .replace(/^http:/, 'https:').replace(/&edge=curl/g, '');

              const zoom3Url = baseUrl.replace(/zoom=\d/, 'zoom=3');
              const resp3 = await fetch(zoom3Url, { method: 'HEAD' });
              if (resp3.headers.get('content-type')?.includes('jpeg')) {
                item._bestCoverUrl = zoom3Url;
                return true;
              }

              const zoom1Url = baseUrl.replace(/zoom=\d/, 'zoom=1');
              const resp1 = await fetch(zoom1Url, { method: 'HEAD' });
              if (resp1.headers.get('content-type')?.includes('jpeg')) {
                item._bestCoverUrl = zoom1Url;
                return true;
              }

              return false;
            } catch {
              return false;
            }
          })
        );
        filtered = filtered.filter((_, i) => verificacoes[i]);
      }

      data.items = filtered.slice(0, Number(maxResults));
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar na Google Books API' });
  }
});

// ── SPA fallback: qualquer rota não-API serve o index.html ──
app.get('*', (req, res) => {
  res.sendFile(join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MilVidas API rodando em http://localhost:${PORT}`);
});
