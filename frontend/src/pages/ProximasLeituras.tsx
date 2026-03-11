import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronUp, ChevronDown, Trash2, Play, Search, GripVertical } from 'lucide-react';
import { getBiblioteca, atualizarBiblioteca, removerBiblioteca, reordenarBiblioteca } from '../lib/api';
import { Card } from '../components/ui/Card';
import { BookCover } from '../components/BookCover';
import { PrioridadeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { spawnSparkles } from '../lib/animations';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Card sortável individual ──
function SortableCard({
  livro,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
  onStart,
  startingId,
  startBtnRef,
}: {
  livro: any;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onStart: () => void;
  startingId: number | null;
  startBtnRef: React.RefObject<HTMLDivElement | null>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: livro.ID });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    animation: !isDragging ? `staggerUp 0.4s ease-out ${index * 80}ms both` : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`p-3 md:p-4 ${index === 0 ? 'ring-2 ring-primary/30' : ''}`}>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Drag handle */}
          <button
            className="p-0.5 md:p-1 rounded cursor-grab active:cursor-grabbing text-text-secondary hover:text-primary touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={18} />
          </button>

          {/* Position badge */}
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
                  onClick={onStart}
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
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-0.5 md:p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-text-secondary"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={onMoveDown}
                disabled={index === total - 1}
                className="p-0.5 md:p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-text-secondary"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <button
              onClick={onDelete}
              className="p-1 md:p-1.5 rounded-md hover:bg-red-50 text-red-500 cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Overlay do card sendo arrastado ──
function DragOverlayCard({ livro, index }: { livro: any; index: number }) {
  return (
    <Card className="p-3 md:p-4 ring-2 ring-primary shadow-xl rotate-[1.5deg]">
      <div className="flex items-center gap-2 md:gap-4">
        <div className="p-0.5 md:p-1 text-primary">
          <GripVertical size={18} />
        </div>
        <div className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0 bg-primary text-white`}>
          {index + 1}
        </div>
        <BookCover url={livro.CAPA_URL} titulo={livro.TITULO} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-text line-clamp-2">{livro.TITULO}</p>
          <p className="text-[11px] md:text-xs text-text-secondary truncate">{livro.AUTOR}</p>
        </div>
      </div>
    </Card>
  );
}

// ── Componente principal ──
export default function ProximasLeituras() {
  const [livros, setLivros] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const startBtnRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => { loadLivros(); }, []);

  async function loadLivros() {
    const data = await getBiblioteca('PROXIMA_LEITURA');
    data.sort((a: any, b: any) => (a.POSICAO || 999) - (b.POSICAO || 999));
    setLivros(data);
  }

  // Salvar nova ordem no backend (batch)
  const saveOrder = useCallback(async (reordered: any[]) => {
    const items = reordered.map((l, i) => ({ id: l.ID, posicao: i + 1 }));
    try {
      await reordenarBiblioteca(items);
    } catch (e) {
      console.error('Erro ao salvar ordem:', e);
      loadLivros(); // rollback: recarregar do banco
    }
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = livros.findIndex((l) => l.ID === active.id);
    const newIndex = livros.findIndex((l) => l.ID === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(livros, oldIndex, newIndex);
    setLivros(reordered); // otimista
    saveOrder(reordered);
  }

  async function moveUp(index: number) {
    if (index <= 0) return;
    const reordered = arrayMove(livros, index, index - 1);
    setLivros(reordered);
    saveOrder(reordered);
  }

  async function moveDown(index: number) {
    if (index >= livros.length - 1) return;
    const reordered = arrayMove(livros, index, index + 1);
    setLivros(reordered);
    saveOrder(reordered);
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

  const activeLivro = activeId ? livros.find((l) => l.ID === activeId) : null;
  const activeIndex = activeId ? livros.findIndex((l) => l.ID === activeId) : -1;

  if (livros.length === 0) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: '#ffffff' }}>Proximas Leituras</h1>
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
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: '#ffffff' }}>Proximas Leituras</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={livros.map((l) => l.ID)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 md:gap-3">
            {livros.map((livro, index) => (
              <SortableCard
                key={livro.ID}
                livro={livro}
                index={index}
                total={livros.length}
                onMoveUp={() => moveUp(index)}
                onMoveDown={() => moveDown(index)}
                onDelete={() => setDeleteId(livro.ID)}
                onStart={() => comecarALer(livro)}
                startingId={startingId}
                startBtnRef={startBtnRef}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeLivro ? <DragOverlayCard livro={activeLivro} index={activeIndex} /> : null}
        </DragOverlay>
      </DndContext>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Tem certeza que deseja remover este livro da fila?"
      />
    </div>
  );
}
