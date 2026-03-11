const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Dashboard
export const getDashboardKpis = () => request<{
  total: number; lidos: number; lendo: number; wishlist: number; proximas: number;
}>('/dashboard/kpis');

export const getLendoAgora = () => request<any>('/dashboard/lendo-agora');

export const getAtividadeRecente = () => request<any[]>('/dashboard/atividade-recente');

export const getRecentes = () => request<any[]>('/dashboard/recentes');

// Biblioteca
export const getBiblioteca = (status?: string) =>
  request<any[]>(`/biblioteca${status ? `?status=${status}` : ''}`);

export const getLivroDetalhes = (bibliotecaId: number) =>
  request<any>(`/livro/${bibliotecaId}`);

export const atualizarBiblioteca = (id: number, data: any) =>
  request<any>(`/biblioteca/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const removerBiblioteca = (id: number) =>
  request<any>(`/biblioteca/${id}`, { method: 'DELETE' });

export const reordenarBiblioteca = (items: { id: number; posicao: number }[]) =>
  request<any>('/biblioteca/reordenar', { method: 'PUT', body: JSON.stringify({ items }) });

// Notas
export const getNotas = (bibliotecaId: number) =>
  request<any[]>(`/notas/${bibliotecaId}`);

export const criarNota = (data: { BIBLIOTECA_ID: number; TEXTO: string; PAGINA?: number }) =>
  request<any>('/notas', { method: 'POST', body: JSON.stringify(data) });

export const editarNota = (id: number, data: { TEXTO: string; PAGINA?: number }) =>
  request<any>(`/notas/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const removerNota = (id: number) =>
  request<any>(`/notas/${id}`, { method: 'DELETE' });

// Avaliações
export const getAvaliacao = (bibliotecaId: number) =>
  request<any>(`/avaliacoes/${bibliotecaId}`);

export const criarAvaliacao = (data: { BIBLIOTECA_ID: number; NOTA: number; REVIEW?: string }) =>
  request<any>('/avaliacoes', { method: 'POST', body: JSON.stringify(data) });

export const editarAvaliacao = (id: number, data: { NOTA: number; REVIEW?: string }) =>
  request<any>(`/avaliacoes/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Stats
export const getStatsGerais = () =>
  request<{ total_lidos: number; total_paginas: number; media_nota: number }>('/stats/gerais');

export const getStatsPorMes = (ano?: number) =>
  request<{ mes: string; count: number }[]>(`/stats/por-mes${ano ? `?ano=${ano}` : ''}`);

export const getStatsGeneros = () =>
  request<{ genero: string; count: number }[]>('/stats/generos');

export const getStatsAutores = () =>
  request<{ autor: string; count: number }[]>('/stats/autores');

// Meta
export const getMeta = (ano: number) =>
  request<{ meta: any; lidos: number }>(`/meta/${ano}`);

export const salvarMeta = (data: { ANO: number; META_LIVROS: number }) =>
  request<any>('/meta', { method: 'POST', body: JSON.stringify(data) });

// Livros
export const criarLivro = (data: any) =>
  request<{ id: number; existing?: boolean }>('/livros', { method: 'POST', body: JSON.stringify(data) });

export const adicionarBiblioteca = (data: { LIVRO_ID: number; STATUS: string; PRIORIDADE?: string; POSICAO?: number }) =>
  request<{ id: number }>('/biblioteca', { method: 'POST', body: JSON.stringify(data) });

export const verificarLivro = (googleBooksId: string) =>
  request<any>(`/livros/verificar/${encodeURIComponent(googleBooksId)}`);

// Google Books
export const buscarGoogleBooks = (q: string, startIndex = 0, maxResults = 12, filtrar = false, opts?: { orderBy?: string; minYear?: number; comCapa?: boolean }) =>
  request<any>(`/google-books/search?q=${encodeURIComponent(q)}&startIndex=${startIndex}&maxResults=${maxResults}&filtrar=${filtrar ? '1' : '0'}${opts?.orderBy ? `&orderBy=${opts.orderBy}` : ''}${opts?.minYear ? `&minYear=${opts.minYear}` : ''}${opts?.comCapa ? '&comCapa=1' : ''}`);
