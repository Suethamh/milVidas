import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookCheck } from 'lucide-react';
import { getBiblioteca } from '../lib/api';
import { BookCover } from '../components/BookCover';
import { StarRating } from '../components/StarRating';

export default function JaLidos() {
  const [livros, setLivros] = useState<any[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    loadLivros();
  }, []);

  async function loadLivros() {
    const data = await getBiblioteca('LIDO');
    setLivros(data);
  }

  const filteredLivros = livros.filter(l => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return l.TITULO?.toLowerCase().includes(q) || l.AUTOR?.toLowerCase().includes(q);
  });

  return (
    <div className="animate-fadeIn">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: '#ffffff' }}>Já Lidos</h1>

      <div className="max-w-md mb-5 md:mb-8">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar nos livros lidos..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 md:py-2.5 rounded-lg border border-border bg-white text-sm md:text-base text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
      </div>

      {filteredLivros.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 md:py-16" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <BookCheck size={36} className="opacity-40" />
          <p className="text-sm md:text-base">{busca ? 'Nenhum livro encontrado' : 'Nenhum livro lido ainda'}</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
