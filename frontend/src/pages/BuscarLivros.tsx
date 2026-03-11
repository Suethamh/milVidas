import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Check, Sparkles, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { buscarGoogleBooks, criarLivro, adicionarBiblioteca, verificarLivro } from '../lib/api';
import { BookCover } from '../components/BookCover';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { spawnHearts, spawnConfetti, spawnSparkles } from '../lib/animations';

const PER_PAGE = 12;
const categorias = ['Populares', 'Ficção', 'Fantasia', 'Romance', 'História', 'Clássicos'];

const categoriasQuery: Record<string, string> = {
  'Populares': 'subject:fiction',
  'Ficção': 'subject:literary fiction',
  'Fantasia': 'subject:fantasy',
  'Romance': 'subject:romance',
  'História': 'subject:"historical fiction"',
  'Clássicos': 'subject:classics',
};

export default function BuscarLivros() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [naBiblioteca, setNaBiblioteca] = useState<Record<string, boolean>>({});
  const [modalBook, setModalBook] = useState<any>(null);
  const [addingStatus, setAddingStatus] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [showDateFields, setShowDateFields] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [buscou, setBuscou] = useState(false);
  const [recomendacoes, setRecomendacoes] = useState<any[]>([]);
  const [loadingRec, setLoadingRec] = useState(true);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [modalSinopse, setModalSinopse] = useState<string | null>(null);
  const [loadingSinopse, setLoadingSinopse] = useState(false);
  // Para paginação: rastrear query real e se é filtrada
  const [lastApiQuery, setLastApiQuery] = useState('');
  const [lastFiltered, setLastFiltered] = useState(false);
  const debounceRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function carregarRecomendacoes() {
      try {
        // Buscar romances de autoras populares recentes
        const queries = [
          'emily henry romance',
          'colleen hoover romance',
          'ana huang romance',
          'ali hazelwood romance',
          'sarah j maas romance',
        ];
        const promises = queries.map(q =>
          buscarGoogleBooks(q, 0, 3, true, { minYear: 2020, comCapa: true })
        );
        const results = await Promise.all(promises);
        const allItems = results.flatMap(r => r.items || []);
        // Remover duplicatas por ID
        const seen = new Set<string>();
        const unique = allItems.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        setRecomendacoes(unique.slice(0, 10));
      } catch (e) {
        console.error(e);
      }
      setLoadingRec(false);
    }
    carregarRecomendacoes();
  }, []);

  async function buscar(q: string, startIndex = 0, filtrar = false) {
    if (!q.trim()) return;
    setLoading(true);
    setShowSugestoes(false);
    setBuscou(true);
    setLastApiQuery(q);
    setLastFiltered(filtrar);
    try {
      // Para buscas por categoria (filtrar=true), verificar capas reais via comCapa
      const data = await buscarGoogleBooks(q, startIndex, PER_PAGE, filtrar, filtrar ? { comCapa: true } : undefined);
      setResultados(data.items || []);
      setTotal(data.totalItems || 0);
      setPage(startIndex);
      const checks: Record<string, boolean> = {};
      for (const item of (data.items || [])) {
        const result = await verificarLivro(item.id);
        if (result && result.BIBLIOTECA_ID) checks[item.id] = true;
      }
      setNaBiblioteca(prev => ({ ...prev, ...checks }));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSugestoes([]);
      setShowSugestoes(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await buscarGoogleBooks(value, 0, 5);
        setSugestoes(data.items || []);
        setShowSugestoes(true);
      } catch (e) { /* ignore */ }
    }, 300);
  }

  async function handleAdd(status: string) {
    if (!modalBook) return;
    setAddingStatus(status);
    try {
      const vol = modalBook.volumeInfo;
      const livroData = {
        GOOGLE_BOOKS_ID: modalBook.id,
        TITULO: vol.title || 'Sem título',
        AUTOR: vol.authors?.join(', ') || 'Desconhecido',
        CAPA_URL: modalBook._bestCoverUrl || vol.imageLinks?.thumbnail || vol.imageLinks?.smallThumbnail || null,
        SINOPSE: modalSinopse || vol.description || null,
        EDITORA: vol.publisher || null,
        ISBN: vol.industryIdentifiers?.[0]?.identifier || null,
        PAGINAS: vol.pageCount || null,
        GENERO: vol.categories?.[0] || null,
        ANO_PUBLICACAO: vol.publishedDate?.slice(0, 4) || null,
        IDIOMA: vol.language || null,
      };
      const livro = await criarLivro(livroData);
      const maxPos = status === 'PROXIMA_LEITURA' ? 999 : undefined;
      const bibData: any = {
        LIVRO_ID: livro.id,
        STATUS: status,
        PRIORIDADE: ['WISHLIST', 'PROXIMA_LEITURA'].includes(status) ? 'MEDIA' : undefined,
        POSICAO: maxPos,
      };
      if (status === 'LIDO') {
        bibData.DATA_INICIO = dataInicio || undefined;
        bibData.DATA_FIM = dataFim || undefined;
      }
      await adicionarBiblioteca(bibData);

      // Efeitos visuais por tipo de ação
      const target = modalRef.current;
      if (target) {
        if (status === 'WISHLIST') {
          spawnHearts(target, 8);
        } else if (status === 'LIDO') {
          spawnConfetti(target, 35);
        } else if (status === 'LENDO') {
          spawnSparkles(target, 10);
        } else {
          spawnSparkles(target, 6);
        }
      }

      const addedBookId = modalBook.id;
      setNaBiblioteca(prev => ({ ...prev, [addedBookId]: true }));
      setJustAdded(addedBookId);
      setTimeout(() => setJustAdded(null), 1500);
      setModalBook(null);
      setShowDateFields(false);
      setDataInicio('');
      setDataFim('');
    } catch (e) {
      console.error(e);
    }
    setAddingStatus(null);
  }

  function getThumb(item: any, highRes = false) {
    // Se o backend já verificou a melhor URL de capa, usar diretamente
    if (highRes && item._bestCoverUrl) return item._bestCoverUrl;
    const links = item.volumeInfo?.imageLinks;
    let url = links?.thumbnail || links?.smallThumbnail || null;
    if (!url) return null;
    url = url.replace(/^http:/, 'https:');
    if (highRes) {
      url = url.replace(/&edge=curl/, '').replace(/zoom=\d/, 'zoom=3');
    }
    return url;
  }

  async function openModal(item: any) {
    setModalBook(item);
    setModalSinopse(null);
    setLoadingSinopse(true);
    try {
      const resp = await fetch(`/api/google-books/sinopse/${item.id}`);
      const data = await resp.json();
      if (data.sinopse) {
        setModalSinopse(data.sinopse);
      }
    } catch {
      // Manter a sinopse original se falhar
    }
    setLoadingSinopse(false);
  }

  function handleCategoriaClick(cat: string) {
    // Toggle: clicar de novo desativa o filtro
    if (categoriaAtiva === cat) {
      setCategoriaAtiva(null);
      setQuery('');
      setBuscou(false);
      setResultados([]);
      setTotal(0);
      setPage(0);
      return;
    }
    setCategoriaAtiva(cat);
    setQuery(cat);
    // Categorias já usam subject: no Google, não precisa de filtro extra
    buscar(categoriasQuery[cat] || cat, 0, false);
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: '#ffffff' }}>Buscar Livros</h1>

      {/* Search bar with separate button */}
      <div className="max-w-2xl mb-6 md:mb-10 relative">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar por titulo, autor ou ISBN..."
              value={query}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setCategoriaAtiva(null); buscar(query); } }}
              onFocus={() => sugestoes.length > 0 && setShowSugestoes(true)}
              onBlur={() => setTimeout(() => setShowSugestoes(false), 200)}
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 rounded-xl border border-border bg-white text-sm md:text-base text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => { setCategoriaAtiva(null); buscar(query); }}
            className="px-4 md:px-5 py-2.5 md:py-3 text-sm font-medium rounded-xl transition-colors shadow-sm cursor-pointer" style={{ backgroundColor: 'rgba(124, 58, 237, 0.6)', color: '#ffffff' }}
          >
            Buscar
          </button>
        </div>

        {showSugestoes && sugestoes.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-border z-20 overflow-hidden">
            {sugestoes.map(item => (
              <button
                key={item.id}
                className="flex items-center gap-3 p-3 w-full text-left hover:bg-primary-bg transition-colors cursor-pointer"
                onMouseDown={() => {
                  setQuery(item.volumeInfo.title);
                  setCategoriaAtiva(null);
                  buscar(item.volumeInfo.title);
                }}
              >
                <BookCover url={getThumb(item)} titulo={item.volumeInfo.title} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{item.volumeInfo.title}</p>
                  <p className="text-xs text-text-secondary truncate">{item.volumeInfo.authors?.join(', ')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Descubra novos livros section */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <Sparkles size={18} style={{ color: '#ffffff' }} />
          <h2 className="text-base md:text-lg font-semibold" style={{ color: '#ffffff' }}>Descubra novos livros</h2>
        </div>

        <div className="flex gap-1.5 md:gap-2 flex-wrap">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoriaClick(cat)}
              style={categoriaAtiva === cat ? { backgroundColor: '#ec4899', color: '#ffffff' } : undefined}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all cursor-pointer ${
                categoriaAtiva === cat
                  ? 'shadow-sm'
                  : 'bg-white border border-border text-text-secondary hover:bg-primary-bg hover:text-primary hover:border-primary-light'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recomendações de Romance - exibe quando não buscou */}
      {!buscou && (
        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Heart size={18} style={{ color: '#ec4899' }} />
            <h2 className="text-base md:text-lg font-semibold" style={{ color: '#ffffff' }}>Top Romances</h2>
          </div>
          {loadingRec ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recomendacoes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {recomendacoes.map((item, idx) => {
                const vol = item.volumeInfo;
                const inLib = naBiblioteca[item.id];
                const coverUrl = getThumb(item, true);
                const wasJustAdded = justAdded === item.id;
                return (
                  <div
                    key={item.id}
                    className="group relative"
                    style={{ animation: `staggerUp 0.5s ease-out ${idx * 80}ms both` }}
                  >
                    <div className="relative rounded-xl overflow-hidden shadow-lg book-cover-shimmer book-hover-lift" style={{ aspectRatio: '2/3' }}>
                      {/* Gradiente sempre visível como fallback */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500">
                        <span className="text-white font-bold text-2xl drop-shadow">{vol.title?.charAt(0) || '?'}</span>
                      </div>
                      {/* Imagem real por cima */}
                      {coverUrl && (
                        <img
                          src={coverUrl}
                          alt={vol.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      {inLib ? (
                        <div
                          className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow"
                          style={wasJustAdded ? { animation: 'bounceIn 0.5s ease-out' } : undefined}
                        >
                          <Check size={12} /> Na biblioteca
                        </div>
                      ) : (
                        <div
                          className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          onClick={() => openModal(item)}
                        >
                          <div className="bg-white/90 text-text font-medium text-sm px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm">
                            <Plus size={16} /> Adicionar
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 px-1">
                      <p className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>{vol.title}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{vol.authors?.join(', ') || 'Desconhecido'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && resultados.length === 0 && buscou && (
        <div className="flex flex-col items-center justify-center py-16" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <Search size={40} className="mb-3 opacity-40" />
          <p className="text-base">Nenhuma recomendação encontrada</p>
        </div>
      )}

      {!loading && resultados.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-6 md:mb-8">
            {resultados.map((item, idx) => {
              const vol = item.volumeInfo;
              const inLib = naBiblioteca[item.id];
              const coverUrl = getThumb(item, true);
              const wasJustAdded = justAdded === item.id;
              return (
                <div
                  key={item.id}
                  className="group relative"
                  style={{ animation: `staggerUp 0.4s ease-out ${idx * 60}ms both` }}
                >
                  <div className="relative rounded-xl overflow-hidden shadow-lg book-cover-shimmer book-hover-lift" style={{ aspectRatio: '2/3' }}>
                    {/* Gradiente sempre visível como fallback */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500">
                      <span className="text-white font-bold text-2xl drop-shadow">{vol.title?.charAt(0) || '?'}</span>
                    </div>
                    {/* Imagem real por cima */}
                    {coverUrl && (
                      <img
                        src={coverUrl}
                        alt={vol.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    {inLib ? (
                      <div
                        className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow"
                        style={wasJustAdded ? { animation: 'bounceIn 0.5s ease-out' } : undefined}
                      >
                        <Check size={12} /> Na biblioteca
                      </div>
                    ) : (
                      <div
                        className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => openModal(item)}
                      >
                        <div className="bg-white/90 text-text font-medium text-sm px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm">
                          <Plus size={16} /> Adicionar
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 px-1">
                    <p className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>{vol.title}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{vol.authors?.join(', ') || 'Desconhecido'}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 md:gap-3 mt-2">
            {page > 0 && (
              <Button variant="secondary" size="sm" onClick={() => buscar(lastApiQuery, page - PER_PAGE, lastFiltered)}>
                <ChevronLeft size={14} /> <span className="hidden sm:inline">Anterior</span>
              </Button>
            )}
            <span className="text-xs md:text-sm font-medium px-2.5 md:px-3 py-1 md:py-1.5 rounded-full" style={{ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.15)' }}>
              Pág. {Math.floor(page / PER_PAGE) + 1}
            </span>
            {page + PER_PAGE < total && (
              <Button variant="secondary" size="sm" onClick={() => buscar(lastApiQuery, page + PER_PAGE, lastFiltered)}>
                <span className="hidden sm:inline">Próxima</span> <ChevronRight size={14} />
              </Button>
            )}
          </div>
        </>
      )}

      <Modal open={!!modalBook} onClose={() => { setModalBook(null); setModalSinopse(null); setShowDateFields(false); setDataInicio(''); setDataFim(''); }} title="Adicionar à Biblioteca" size="md">
        <div ref={modalRef} className="flex flex-col gap-4">
          {/* Detalhes do livro */}
          {modalBook && (() => {
            const vol = modalBook.volumeInfo;
            const coverUrl = getThumb(modalBook, true);
            const sinopse = modalSinopse || vol.description || null;
            return (
              <div className="flex gap-4">
                <div className="w-24 flex-shrink-0">
                  <BookCover url={coverUrl} titulo={vol.title} size="full" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text text-sm leading-snug">{vol.title}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">{vol.authors?.join(', ') || 'Desconhecido'}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-text-secondary">
                    {vol.pageCount && <span>{vol.pageCount} pág.</span>}
                    {vol.publishedDate && <span>{vol.publishedDate.slice(0, 4)}</span>}
                    {vol.categories?.[0] && <span>{vol.categories[0]}</span>}
                  </div>
                  {loadingSinopse ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Buscando sinopse...
                    </div>
                  ) : sinopse ? (
                    <p className="text-xs text-text-secondary mt-2 line-clamp-6 leading-relaxed"
                       dangerouslySetInnerHTML={{ __html: sinopse }}
                    />
                  ) : (
                    <p className="text-xs text-text-secondary/60 mt-2 italic">Sinopse indisponível</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Separador */}
          <div className="border-t border-border" />

          {/* Botões de ação */}
          <p className="text-xs text-text-secondary font-medium">Adicionar como:</p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => handleAdd('LENDO')} disabled={!!addingStatus}>
              {addingStatus === 'LENDO' ? 'Adicionando...' : 'Lendo agora'}
            </Button>
            <Button variant="secondary" onClick={() => {
              if (!showDateFields) {
                setShowDateFields(true);
                const hoje = new Date().toISOString().slice(0, 10);
                setDataFim(hoje);
                setDataInicio(hoje);
              } else {
                handleAdd('LIDO');
              }
            }} disabled={!!addingStatus}>
              {addingStatus === 'LIDO' ? 'Adicionando...' : showDateFields ? 'Confirmar' : 'Lido'}
            </Button>
            {showDateFields && (
              <div className="flex flex-col gap-2 px-1 py-2 rounded-lg bg-gray-50 border border-border">
                <p className="text-xs text-text-secondary font-medium px-2">Quando leu?</p>
                <div className="flex gap-3 px-2">
                  <label className="flex-1">
                    <span className="text-xs text-text-secondary">Início</span>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={e => setDataInicio(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1.5 rounded-md border border-border bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </label>
                  <label className="flex-1">
                    <span className="text-xs text-text-secondary">Fim</span>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={e => setDataFim(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1.5 rounded-md border border-border bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </label>
                </div>
              </div>
            )}
            <Button variant="secondary" onClick={() => handleAdd('WISHLIST')} disabled={!!addingStatus}>
              {addingStatus === 'WISHLIST' ? 'Adicionando...' : 'Lista de desejos'}
            </Button>
            <Button variant="secondary" onClick={() => handleAdd('PROXIMA_LEITURA')} disabled={!!addingStatus}>
              {addingStatus === 'PROXIMA_LEITURA' ? 'Adicionando...' : 'Próximas leituras'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
