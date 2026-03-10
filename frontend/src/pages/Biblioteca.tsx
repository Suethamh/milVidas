import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, LayoutGrid, List } from 'lucide-react';
import { getBiblioteca } from '../lib/api';
import { Card } from '../components/ui/Card';
import { BookCover } from '../components/BookCover';
import { StarRating } from '../components/StarRating';
import { StatusBadge } from '../components/ui/Badge';
import { Badge } from '../components/ui/Badge';

const filtros = [
  { value: '', label: 'Todos' },
  { value: 'LIDO', label: 'Lidos' },
  { value: 'LENDO', label: 'Lendo' },
  { value: 'ABANDONADO', label: 'Abandonados' },
];

export default function Biblioteca() {
  const [livros, setLivros] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadLivros();
  }, [filtro]);

  async function loadLivros() {
    const data = await getBiblioteca(filtro || undefined);
    const filtered = data.filter((l: any) => !['WISHLIST', 'PROXIMA_LEITURA'].includes(l.STATUS));
    setLivros(filtered);
  }

  const filteredLivros = livros.filter(l => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return l.TITULO?.toLowerCase().includes(q) || l.AUTOR?.toLowerCase().includes(q);
  });

  return (
    <div className="animate-fadeIn">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: '#ffffff' }}>Biblioteca</h1>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 mb-4 md:mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar por titulo ou autor..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 md:py-2.5 rounded-lg border border-border bg-white text-sm md:text-base text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {filtros.map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                filtro === f.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-secondary hover:bg-primary-bg border border-border'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="flex gap-0.5 border border-border rounded-lg p-0.5 ml-auto">
            <button onClick={() => setView('grid')} className={`p-1.5 md:p-2 rounded-md cursor-pointer ${view === 'grid' ? 'bg-primary text-white' : 'text-text-secondary'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView('list')} className={`p-1.5 md:p-2 rounded-md cursor-pointer ${view === 'list' ? 'bg-primary text-white' : 'text-text-secondary'}`}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {filteredLivros.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 md:py-16" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <Search size={36} />
          <p className="text-sm md:text-base">Nenhum livro encontrado</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {filteredLivros.map((livro, idx) => (
            <Link
              key={livro.ID}
              to={`/livro/${livro.ID}`}
              className="group"
              style={{ animation: `staggerUp 0.4s ease-out ${idx * 50}ms both` }}
            >
              <div className="book-cover-shimmer book-hover-lift rounded-xl">
                <BookCover url={livro.CAPA_URL} titulo={livro.TITULO} size="full" className="group-hover:shadow-xl transition-shadow" />
              </div>
              <div className="mt-1.5 md:mt-2 px-0.5">
                <p className="text-xs md:text-sm font-medium truncate group-hover:text-primary transition-colors" style={{ color: '#ffffff' }}>{livro.TITULO}</p>
                <p className="text-[11px] md:text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{livro.AUTOR}</p>
                {livro.NOTA && <StarRating value={livro.NOTA} readonly size={12} />}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2 md:gap-3">
          {filteredLivros.map((livro, idx) => (
            <Link key={livro.ID} to={`/livro/${livro.ID}`} style={{ animation: `staggerUp 0.3s ease-out ${idx * 40}ms both` }}>
              <Card className="p-3 md:p-4 flex items-center gap-3 md:gap-4 group">
                <BookCover url={livro.CAPA_URL} titulo={livro.TITULO} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text group-hover:text-primary transition-colors truncate">{livro.TITULO}</p>
                  <p className="text-xs text-text-secondary truncate">{livro.AUTOR}</p>
                  <div className="flex items-center gap-2 mt-1 md:hidden">
                    <StatusBadge status={livro.STATUS} />
                    {livro.NOTA && <StarRating value={livro.NOTA} readonly size={12} />}
                  </div>
                </div>
                <span className="hidden md:inline-flex">{livro.GENERO && <Badge variant="neutral">{livro.GENERO}</Badge>}</span>
                <span className="hidden md:inline-flex"><StatusBadge status={livro.STATUS} /></span>
                <span className="hidden md:inline-flex">{livro.NOTA && <StarRating value={livro.NOTA} readonly size={16} />}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
