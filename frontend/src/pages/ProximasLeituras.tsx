import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronUp, ChevronDown, Trash2, Play, Search } from 'lucide-react';
import { getBiblioteca, atualizarBiblioteca, removerBiblioteca } from '../lib/api';
import { Card } from '../components/ui/Card';
import { BookCover } from '../components/BookCover';
import { PrioridadeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { spawnSparkles } from '../lib/animations';

export default function ProximasLeituras() {
  const [livros, setLivros] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);
  const startBtnRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => { loadLivros(); }, []);

  async function loadLivros() {
    const data = await getBiblioteca('PROXIMA_LEITURA');
    data.sort((a: any, b: any) => (a.POSICAO || 999) - (b.POSICAO || 999));
    setLivros(data);
  }

  async function moveUp(index: number) {
    if (index <= 0) return;
    const a = livros[index];
    const b = livros[index - 1];
    await atualizarBiblioteca(a.ID, { POSICAO: b.POSICAO });
    await atualizarBiblioteca(b.ID, { POSICAO: a.POSICAO });
    loadLivros();
  }

  async function moveDown(index: number) {
    if (index >= livros.length - 1) return;
    const a = livros[index];
    const b = livros[index + 1];
    await atualizarBiblioteca(a.ID, { POSICAO: b.POSICAO });
    await atualizarBiblioteca(b.ID, { POSICAO: a.POSICAO });
    loadLivros();
  }

  async function comecarALer(livro: any) {
    setStartingId(livro.ID);
    if (startBtnRef.current) {
      spawnSparkles(startBtnRef.current, 12);
    }
    const now = new Date().toISOString().slice(0, 19);
    await atualizarBiblioteca(livro.ID, { STATUS: 'LENDO', DATA_INICIO: now });
    setTimeout(() => navigate(`/livro/${livro.ID}`), 400);
  }

  async function handleDelete() {
    if (deleteId) {
      await removerBiblioteca(deleteId);
      setDeleteId(null);
      loadLivros();
    }
  }

  if (livros.length === 0) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: '#ffffff' }}>Próximas Leituras</h1>
        <div className="flex flex-col items-center gap-3 md:gap-4 py-12 md:py-20" style={{ color: 'rgba(255,255,255,0.8)' }}>
          <BookOpen size={40} />
          <p className="text-base md:text-lg font-medium">Nenhuma leitura na fila</p>
          <p className="text-xs md:text-sm text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>Adicione livros da sua wishlist ou busque novos</p>
          <Button onClick={() => navigate('/buscar')}>
            <Search size={16} /> Buscar Livros
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: '#ffffff' }}>Próximas Leituras</h1>

      <div className="flex flex-col gap-2 md:gap-3">
        {livros.map((livro, index) => (
          <Card
            key={livro.ID}
            className={`p-3 md:p-4 ${index === 0 ? 'ring-2 ring-primary/30' : ''}`}
            style={{ animation: `staggerUp 0.4s ease-out ${index * 80}ms both` }}
          >
            <div className="flex items-center gap-2 md:gap-4">
              <div className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0 ${
                index === 0 ? 'bg-primary text-white' :
                index === 1 ? 'bg-primary-light text-white' :
                index === 2 ? 'bg-purple-200 text-purple-700' :
                'bg-gray-100 text-text-secondary'
              }`}>
                {index + 1}
              </div>

              <Link to={`/livro/${livro.ID}`} className="flex-shrink-0">
                <BookCover url={livro.CAPA_URL} titulo={livro.TITULO} size="sm" />
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/livro/${livro.ID}`} className="text-xs md:text-sm font-medium text-text hover:text-primary transition-colors line-clamp-2">{livro.TITULO}</Link>
                <p className="text-[11px] md:text-xs text-text-secondary truncate">{livro.AUTOR}</p>
                <div className="mt-0.5 md:mt-1">
                  <PrioridadeBadge prioridade={livro.PRIORIDADE || 'MEDIA'} />
                </div>
              </div>

              <div className="flex items-center gap-0.5 md:gap-2 flex-shrink-0">
                {index === 0 && (
                  <div ref={startBtnRef}>
                    <Button
                      size="sm"
                      onClick={() => comecarALer(livro)}
                      disabled={startingId === livro.ID}
                      className="!text-[11px] md:!text-xs !px-2 md:!px-3 whitespace-nowrap"
                    >
                      <Play size={12} style={startingId === livro.ID ? { animation: 'pageFlip 0.5s ease-in-out' } : undefined} />
                      <span className="hidden sm:inline">{startingId === livro.ID ? 'Abrindo...' : 'Começar'}</span>
                      <span className="sm:hidden">{startingId === livro.ID ? '...' : 'Ler'}</span>
                    </Button>
                  </div>
                )}

                <div className="flex flex-col gap-0">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-0.5 md:p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-text-secondary"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === livros.length - 1}
                    className="p-0.5 md:p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-text-secondary"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                <button
                  onClick={() => setDeleteId(livro.ID)}
                  className="p-1 md:p-1.5 rounded-md hover:bg-red-50 text-red-500 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Tem certeza que deseja remover este livro da fila?"
      />
    </div>
  );
}
