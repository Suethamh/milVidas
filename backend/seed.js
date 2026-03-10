import initSqlJs from 'sql.js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'milvidas.db');

const GOOGLE_BOOKS_API_KEY = 'AIzaSyA8FpQjUaCWtTir-EJhUjhFuJ09T3rqQ5I';

async function fetchGoogleBooksCover(googleBooksId, titulo, autor) {
  try {
    // Try direct volume lookup first
    const url = `https://www.googleapis.com/books/v1/volumes/${googleBooksId}?key=${GOOGLE_BOOKS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const links = data.volumeInfo?.imageLinks;
    const thumb = links?.thumbnail || links?.smallThumbnail || null;
    if (thumb) return thumb.replace(/^http:/, 'https:');

    // Fallback: search by title + author
    const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(titulo + ' ' + autor)}&maxResults=3&key=${GOOGLE_BOOKS_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    for (const item of (searchData.items || [])) {
      const il = item.volumeInfo?.imageLinks;
      const t = il?.thumbnail || il?.smallThumbnail;
      if (t) return t.replace(/^http:/, 'https:');
    }
    return null;
  } catch (e) {
    console.warn(`Falha ao buscar capa para ${googleBooksId}:`, e.message);
    return null;
  }
}

const SQL = await initSqlJs();
const db = new SQL.Database();

// Create tables
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

const now = '2026-03-06T10:00:00';

// Buscar capas reais da Google Books API
console.log('Buscando capas da Google Books API...');

const livrosData = [
  { id: 'wrOQLV6xB-wC', titulo: 'Harry Potter e a Pedra Filosofal', autor: 'J.K. Rowling', sinopse: 'Harry Potter nunca tinha ouvido falar em Hogwarts até o momento em que as cartas começam a aparecer no capacho do número 4 da rua dos Alfeneiros.', editora: 'Rocco', isbn: '9788532511010', paginas: 264, genero: 'Fantasia', ano: '1997', idioma: 'pt-BR' },
  { id: 'k6DwzwEACAAJ', titulo: 'O Senhor dos Anéis: A Sociedade do Anel', autor: 'J.R.R. Tolkien', sinopse: 'Numa cidadezinha indolente do Condado, o jovem hobbit Frodo recebe um presente de seu tio Bilbo: um anel mágico.', editora: 'Martins Fontes', isbn: '9788533613379', paginas: 576, genero: 'Fantasia', ano: '1954', idioma: 'pt-BR' },
  { id: 'HCo1DwAAQBAJ', titulo: '1984', autor: 'George Orwell', sinopse: 'Winston Smith trabalha no Ministério da Verdade, em Londres, adaptando a realidade dos fatos à versão oficial do Partido.', editora: 'Companhia das Letras', isbn: '9788535914849', paginas: 416, genero: 'Ficção Científica', ano: '1949', idioma: 'pt-BR' },
  { id: 'MZHORAS_bLcC', titulo: 'Dom Casmurro', autor: 'Machado de Assis', sinopse: 'Bento Santiago, o Dom Casmurro, narra a história de seu amor por Capitu, a vizinha de olhos de ressaca.', editora: 'Penguin-Companhia', isbn: '9788582850350', paginas: 256, genero: 'Romance', ano: '1899', idioma: 'pt-BR' },
  { id: 'FmyBAwAAQBAJ', titulo: 'O Pequeno Príncipe', autor: 'Antoine de Saint-Exupéry', sinopse: 'Um piloto cai com seu avião no deserto do Saara e encontra um pequeno príncipe, vindo de um longínquo asteroide.', editora: 'HarperCollins', isbn: '9788595081512', paginas: 96, genero: 'Fábula', ano: '1943', idioma: 'pt-BR' },
  { id: 'W-n9CQAAQBAJ', titulo: 'Cem Anos de Solidão', autor: 'Gabriel García Márquez', sinopse: 'A história da família Buendía na mítica cidade de Macondo, ao longo de sete gerações.', editora: 'Record', isbn: '9788501012173', paginas: 448, genero: 'Realismo Mágico', ano: '1967', idioma: 'pt-BR' },
  { id: 'ydQiDQAAQBAJ', titulo: 'Sapiens: Uma Breve História da Humanidade', autor: 'Yuval Noah Harari', sinopse: 'O que possibilitou ao Homo sapiens subjugar as demais espécies?', editora: 'L&PM', isbn: '9788525432186', paginas: 464, genero: 'Não-ficção', ano: '2011', idioma: 'pt-BR' },
  { id: 'NGbWnQEACAAJ', titulo: 'A Revolução dos Bichos', autor: 'George Orwell', sinopse: 'Os animais da Granja do Solar, cansados da exploração, expulsam os humanos e criam suas próprias regras de convivência.', editora: 'Companhia das Letras', isbn: '9788535909555', paginas: 152, genero: 'Sátira', ano: '1945', idioma: 'pt-BR' },
];

const livros = [];
for (const l of livrosData) {
  const capaUrl = await fetchGoogleBooksCover(l.id, l.titulo, l.autor);
  console.log(`  ${l.titulo}: ${capaUrl ? 'OK' : 'sem capa'}`);
  livros.push([l.id, l.titulo, l.autor, capaUrl, l.sinopse, l.editora, l.isbn, l.paginas, l.genero, l.ano, l.idioma]);
}

for (const l of livros) {
  db.run(
    `INSERT INTO LIVROS (GOOGLE_BOOKS_ID, TITULO, AUTOR, CAPA_URL, SINOPSE, EDITORA, ISBN, PAGINAS, GENERO, ANO_PUBLICACAO, IDIOMA, CRIADO_EM)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...l, now]
  );
}

const bibliotecaEntries = [
  [1, 'LIDO', null, null, '2026-01-05T09:00:00', '2026-01-05T09:00:00', '2026-01-18T21:00:00'],
  [2, 'LIDO', null, null, '2026-01-20T10:00:00', '2026-01-20T10:00:00', '2026-02-10T18:00:00'],
  [3, 'LENDO', null, null, '2026-02-15T08:00:00', '2026-02-20T08:00:00', null],
  [4, 'LIDO', null, null, '2025-12-01T14:00:00', '2025-12-01T14:00:00', '2025-12-20T22:00:00'],
  [5, 'WISHLIST', 'ALTA', null, '2026-03-01T11:00:00', null, null],
  [6, 'PROXIMA_LEITURA', 'ALTA', 1, '2026-02-28T15:00:00', null, null],
  [7, 'PROXIMA_LEITURA', 'MEDIA', 2, '2026-03-02T09:00:00', null, null],
  [8, 'WISHLIST', 'MEDIA', null, '2026-03-04T16:00:00', null, null],
];

for (const b of bibliotecaEntries) {
  db.run(
    `INSERT INTO BIBLIOTECA (LIVRO_ID, STATUS, PRIORIDADE, POSICAO, DATA_ADICIONADO, DATA_INICIO, DATA_FIM, CRIADO_EM)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [...b, now]
  );
}

const avaliacoes = [
  [1, 5, 'Um clássico absoluto! A magia de Hogwarts me transportou para outro mundo. Rowling criou um universo incrível.'],
  [2, 5, 'A obra-prima da fantasia. Tolkien construiu um mundo com uma riqueza de detalhes impressionante.'],
  [4, 4, 'Machado de Assis é genial. A narrativa em primeira pessoa de Bentinho nos deixa sempre em dúvida sobre Capitu.'],
];

for (const a of avaliacoes) {
  db.run('INSERT INTO AVALIACOES (BIBLIOTECA_ID, NOTA, REVIEW, CRIADO_EM) VALUES (?, ?, ?, ?)', [...a, now]);
}

const notas = [
  [1, 'O chapéu seletor é uma metáfora brilhante sobre as escolhas que fazemos na vida.', 88],
  [1, 'A cena do espelho de Ojesed é de partir o coração. Mostra o desejo mais profundo de Harry.', 152],
  [2, 'A descrição do Condado transmite uma paz absurda. Tolkien sabia criar atmosfera como ninguém.', 25],
  [3, 'A ideia de duplipensar é assustadoramente atual. Orwell era visionário.', 210],
];

for (const n of notas) {
  db.run('INSERT INTO NOTAS_LEITURA (BIBLIOTECA_ID, TEXTO, PAGINA, CRIADO_EM) VALUES (?, ?, ?, ?)', [...n, now]);
}

db.run('INSERT INTO META_LEITURA (ANO, META_LIVROS, CRIADO_EM) VALUES (?, ?, ?)', [2026, 24, now]);

const data = db.export();
writeFileSync(DB_PATH, Buffer.from(data));

console.log('Seed concluído com sucesso!');
console.log('- 8 livros inseridos');
console.log('- 8 entradas na biblioteca');
console.log('- 3 avaliações');
console.log('- 4 notas de leitura');
console.log('- 1 meta anual (24 livros para 2026)');

db.close();
