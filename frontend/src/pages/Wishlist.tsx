import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Search, ArrowRight, Trash2 } from 'lucide-react';
import { getBiblioteca, atualizarBiblioteca, removerBiblioteca } from '../lib/api';
import { LoveMessage } from '../components/LoveMessage';
import { Card } from '../components/ui/Card';
import { BookCover } from '../components/BookCover';
import { PrioridadeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function Wishlist() {
  const [livros, setLivros] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => { loadLivros(); }, []);

  async function loadLivros() {
    const data = await getBiblioteca('WISHLIST');
    setLivros(data);
  }

  async function ciclaPrioridade(livro: any) {
    const ordem = ['ALTA', 'MEDIA', 'BAIXA'];
    const idx = ordem.indexOf(livro.PRIORIDADE || 'MEDIA');
    const nova = ordem[(idx + 1) % 3];
    await atualizarBiblioteca(livro.ID, { PRIORIDADE: nova });
    loadLivros();
  }

  async function moverParaProximas(livro: any) {
    await atualizarBiblioteca(livro.ID, { STATUS: 'PROXIMA_LEITURA', POSICAO: 999 });
    loadLivros();
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
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: '#ffffff' }}>Wishlist</h1>
        <div className="flex flex-col items-center gap-3 md:gap-4 py-12 md:py-20" style={{ color: 'rgba(255,255,255,0.8)' }}>
          <Heart size={40} />
          <p className="text-base md:text-lg font-medium">Sua lista de desejos está vazia</p>
          <p className="text-xs md:text-sm text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>Busque livros para adicionar à sua wishlist</p>
          <Button onClick={() => navigate('/buscar')}>
            <Search size={16} /> Buscar Livros
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#ffffff' }}>Wishlist</h1>
        <LoveMessage />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {livros.map((livro, idx) => (
          <div
            key={livro.ID}
            className="group"
            style={{ animation: `staggerUp 0.4s ease-out ${idx * 50}ms both` }}
          >
            <Link to={`/livro/${livro.ID}`} className="block">
              <div className="book-cover-shimmer book-hover-lift rounded-xl">
                <BookCover url={livro.CAPA_URL} titulo={livro.TITULO} size="full" className="group-hover:shadow-xl transition-shadow" />
              </div>
            </Link>
            <div className="mt-1.5 md:mt-2 px-0.5">
              <p className="text-xs md:text-sm font-medium truncate" style={{ color: '#ffffff' }}>{livro.TITULO}</p>
              <p className="text-[11px] md:text-xs truncate mb-1.5 md:mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{livro.AUTOR}</p>
              <div className="flex items-center justify-between">
                <PrioridadeBadge prioridade={livro.PRIORIDADE || 'MEDIA'} onClick={() => ciclaPrioridade(livro)} />
                <div className="flex gap-1">
                  <button
                    onClick={() => moverParaProximas(livro)}
                    className="p-1.5 rounded-md text-white/70 hover:text-white cursor-pointer"
                    title="Mover para Próximas"
                  >
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(livro.ID)}
                    className="p-1.5 rounded-md text-red-400 hover:text-red-300 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Tem certeza que deseja remover este livro da wishlist?"
      />
    </div>
  );
}
