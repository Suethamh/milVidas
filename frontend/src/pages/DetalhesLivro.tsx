import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, BookCheck, Heart, BookOpen, XCircle, Trash2, Edit2, ArrowLeft, BookMarked, Hash, Building, Globe, Calendar } from 'lucide-react';
import {
  getLivroDetalhes, atualizarBiblioteca, removerBiblioteca,
  getNotas, criarNota, editarNota, removerNota,
  getAvaliacao, criarAvaliacao, editarAvaliacao
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BookCover } from '../components/BookCover';
import { StarRating } from '../components/StarRating';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { spawnConfetti, spawnHearts, spawnSparkles } from '../lib/animations';

const statusOptions = [
  { value: 'LENDO', label: 'Lendo', icon: Eye, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'LIDO', label: 'Lido', icon: BookCheck, color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'WISHLIST', label: 'Wishlist', icon: Heart, color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { value: 'PROXIMA_LEITURA', label: 'Próxima', icon: BookOpen, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'ABANDONADO', label: 'Abandonado', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-300' },
];

export default function DetalhesLivro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [livro, setLivro] = useState<any>(null);
  const [notas, setNotas] = useState<any[]>([]);
  const [avaliacao, setAvaliacao] = useState<any>(null);
  const [nota, setNota] = useState(0);
  const [review, setReview] = useState('');
  const [novaNota, setNovaNota] = useState('');
  const [novaPagina, setNovaPagina] = useState('');
  const [editingNota, setEditingNota] = useState<any>(null);
  const [deleteNotaId, setDeleteNotaId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [statusAnimating, setStatusAnimating] = useState<string | null>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    const data = await getLivroDetalhes(Number(id));
    setLivro(data);
    const notasData = await getNotas(Number(id));
    setNotas(notasData);
    const av = await getAvaliacao(Number(id));
    if (av) {
      setAvaliacao(av);
      setNota(av.NOTA);
      setReview(av.REVIEW || '');
    }
  }

  async function handleStatusChange(newStatus: string) {
    const updates: any = { STATUS: newStatus };
    const now = new Date().toISOString().slice(0, 19);
    if (newStatus === 'LENDO') updates.DATA_INICIO = now;
    if (newStatus === 'LIDO') updates.DATA_FIM = now;
    await atualizarBiblioteca(Number(id), updates);

    // Efeitos visuais por status
    setStatusAnimating(newStatus);
    const target = statusBarRef.current;
    if (target) {
      if (newStatus === 'LIDO') {
        spawnConfetti(target, 40);
      } else if (newStatus === 'WISHLIST') {
        spawnHearts(target, 6);
      } else {
        spawnSparkles(target, 8);
      }
    }
    setTimeout(() => setStatusAnimating(null), 800);

    loadData();
  }

  async function handleSaveAvaliacao() {
    if (nota === 0) return;
    if (avaliacao) {
      await editarAvaliacao(avaliacao.ID, { NOTA: nota, REVIEW: review });
    } else {
      await criarAvaliacao({ BIBLIOTECA_ID: Number(id), NOTA: nota, REVIEW: review });
    }
    loadData();
  }

  async function handleAddNota() {
    if (!novaNota.trim()) return;
    await criarNota({
      BIBLIOTECA_ID: Number(id),
      TEXTO: novaNota,
      PAGINA: novaPagina ? Number(novaPagina) : undefined,
    });
    setNovaNota('');
    setNovaPagina('');
    loadData();
  }

  async function handleEditNota() {
    if (!editingNota) return;
    await editarNota(editingNota.ID, { TEXTO: editingNota.TEXTO, PAGINA: editingNota.PAGINA });
    setEditingNota(null);
    loadData();
  }

  async function handleDeleteNota() {
    if (deleteNotaId) {
      await removerNota(deleteNotaId);
      setDeleteNotaId(null);
      loadData();
    }
  }

  async function handleDeleteLivro() {
    await removerBiblioteca(Number(id));
    navigate('/biblioteca');
  }

  function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('pt-BR');
  }

  if (!livro) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 md:mb-6 cursor-pointer hover:opacity-80 transition-opacity" style={{ color: 'rgba(255,255,255,0.8)' }}>
        <ArrowLeft size={18} /> Voltar
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-5 md:mb-8">
        <div className="flex justify-center md:block flex-shrink-0 w-36 md:w-48 mx-auto md:mx-0">
          <BookCover url={livro.CAPA_URL} titulo={livro.TITULO} size="full" className="shadow-xl" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg md:text-2xl font-bold mb-1 text-center md:text-left" style={{ color: '#ffffff' }}>{livro.TITULO}</h1>
          <p className="text-sm md:text-lg mb-3 md:mb-4 text-center md:text-left" style={{ color: 'rgba(255,255,255,0.75)' }}>{livro.AUTOR}</p>

          <div ref={statusBarRef} className="flex flex-wrap justify-center md:justify-start gap-1.5 md:gap-2 mb-3 md:mb-6">
            {statusOptions.map(opt => {
              const isActive = livro.STATUS === opt.value;
              const justActivated = statusAnimating === opt.value;
              const glowColors: Record<string, string> = {
                LENDO: 'rgba(168,85,247,0.5)',
                LIDO: 'rgba(16,185,129,0.5)',
                WISHLIST: 'rgba(236,72,153,0.5)',
                PROXIMA_LEITURA: 'rgba(59,130,246,0.5)',
                ABANDONADO: 'rgba(239,68,68,0.5)',
              };
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium border transition-all cursor-pointer ${
                    isActive ? opt.color + ' border-current' : 'border-white/30 hover:bg-white/10'
                  }`}
                  style={{
                    ...(isActive ? {} : { color: 'rgba(255,255,255,0.85)' }),
                    ...(justActivated ? {
                      animation: 'pulseGlow 0.8s ease-out',
                      '--glow-color': glowColors[opt.value] || 'rgba(124,58,237,0.5)',
                    } as any : {}),
                  }}
                >
                  <opt.icon size={14} className="md:w-4 md:h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {livro.SINOPSE && (
            <p className="text-xs md:text-sm leading-relaxed mb-3 md:mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>{livro.SINOPSE}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
            {livro.EDITORA && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <Building size={13} className="flex-shrink-0" /> <span className="truncate">{livro.EDITORA}</span>
              </div>
            )}
            {livro.ISBN && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <Hash size={13} className="flex-shrink-0" /> <span className="truncate">{livro.ISBN}</span>
              </div>
            )}
            {livro.PAGINAS && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <BookMarked size={13} className="flex-shrink-0" /> {livro.PAGINAS} pág.
              </div>
            )}
            {livro.GENERO && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <BookOpen size={13} className="flex-shrink-0" /> <span className="truncate">{livro.GENERO}</span>
              </div>
            )}
            {livro.ANO_PUBLICACAO && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <Calendar size={13} className="flex-shrink-0" /> {livro.ANO_PUBLICACAO}
              </div>
            )}
            {livro.IDIOMA && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <Globe size={13} className="flex-shrink-0" /> {livro.IDIOMA}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 md:gap-6 mt-3 md:mt-4 items-start sm:items-center text-[11px] md:text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <span>Adicionado: {formatDate(livro.DATA_ADICIONADO)}</span>
            <label className="flex items-center gap-1.5">
              Início:
              <input
                type="date"
                value={livro.DATA_INICIO ? livro.DATA_INICIO.slice(0, 10) : ''}
                onChange={async (e) => {
                  const val = e.target.value;
                  await atualizarBiblioteca(Number(id), { DATA_INICIO: val || null });
                  loadData();
                }}
                className="bg-transparent border border-white/30 rounded px-1.5 md:px-2 py-0.5 text-[11px] md:text-xs focus:outline-none focus:border-white/60"
                style={{ color: 'rgba(255,255,255,0.8)', colorScheme: 'dark' }}
              />
            </label>
            <label className="flex items-center gap-1.5">
              Fim:
              <input
                type="date"
                value={livro.DATA_FIM ? livro.DATA_FIM.slice(0, 10) : ''}
                onChange={async (e) => {
                  const val = e.target.value;
                  await atualizarBiblioteca(Number(id), { DATA_FIM: val || null });
                  loadData();
                }}
                className="bg-transparent border border-white/30 rounded px-1.5 md:px-2 py-0.5 text-[11px] md:text-xs focus:outline-none focus:border-white/60"
                style={{ color: 'rgba(255,255,255,0.8)', colorScheme: 'dark' }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Avaliação */}
        <Card>
          <CardHeader>
            <CardTitle>Avaliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <StarRating value={nota} onChange={setNota} size={28} />
              <Textarea
                placeholder="Escreva sua review..."
                value={review}
                onChange={e => setReview(e.target.value)}
                rows={4}
              />
              <Button onClick={handleSaveAvaliacao} disabled={nota === 0}>
                {avaliacao ? 'Atualizar' : 'Salvar'} Avaliação
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas de Leitura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto">
              {notas.map(n => (
                <div key={n.ID} className="p-3 bg-primary-bg rounded-lg">
                  {editingNota?.ID === n.ID ? (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        value={editingNota.TEXTO}
                        onChange={e => setEditingNota({ ...editingNota, TEXTO: e.target.value })}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleEditNota}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingNota(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-text">{n.TEXTO}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-text-secondary">
                          {n.PAGINA ? `p. ${n.PAGINA}` : ''} {n.CRIADO_EM ? `· ${formatDate(n.CRIADO_EM)}` : ''}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingNota({ ...n })} className="p-1 hover:bg-gray-100 rounded cursor-pointer text-text-secondary"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteNotaId(n.ID)} className="p-1 hover:bg-red-50 rounded cursor-pointer text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {notas.length === 0 && <p className="text-sm text-text-secondary text-center py-4">Nenhuma nota ainda</p>}
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-text mb-2">Nova Nota</p>
              <Textarea
                placeholder="Escreva sua nota..."
                value={novaNota}
                onChange={e => setNovaNota(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Página"
                  value={novaPagina}
                  onChange={e => setNovaPagina(e.target.value)}
                  className="w-24"
                />
                <Button size="sm" onClick={handleAddNota} disabled={!novaNota.trim()}>Adicionar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
          <Trash2 size={14} /> Remover da Biblioteca
        </Button>
      </div>

      <ConfirmDialog
        open={!!deleteNotaId}
        onClose={() => setDeleteNotaId(null)}
        onConfirm={handleDeleteNota}
        message="Deseja excluir esta nota?"
      />
      <ConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteLivro}
        title="Remover Livro"
        message="Isso removerá o livro, avaliações e notas da sua biblioteca. Continuar?"
      />
    </div>
  );
}
