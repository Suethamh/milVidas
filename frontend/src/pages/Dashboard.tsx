import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, BookCheck, Eye, Heart, Star, StickyNote, Plus, ChevronRight } from 'lucide-react';
import { getDashboardKpis, getLendoAgora, getAtividadeRecente, getRecentes } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BookCover } from '../components/BookCover';
import { Button } from '../components/ui/Button';
import { animateCountUp } from '../lib/animations';

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [lendoAgora, setLendoAgora] = useState<any>(null);
  const [atividades, setAtividades] = useState<any[]>([]);
  const [recentes, setRecentes] = useState<any[]>([]);

  const kpiRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const countedUp = useRef(false);

  useEffect(() => {
    getDashboardKpis().then(setKpis);
    getLendoAgora().then(setLendoAgora);
    getAtividadeRecente().then(setAtividades);
    getRecentes().then(setRecentes);
  }, []);

  // Count-up animation for KPI numbers
  useEffect(() => {
    if (kpis && !countedUp.current) {
      countedUp.current = true;
      const values = [kpis.total, kpis.lidos, kpis.lendo, kpis.wishlist];
      values.forEach((val, i) => {
        const el = kpiRefs.current[i];
        if (el && val > 0) {
          el.textContent = '0';
          setTimeout(() => animateCountUp(el, val, 800), i * 150);
        }
      });
    }
  }, [kpis]);

  const kpiCards = kpis ? [
    { label: 'Total de Livros', value: kpis.total, icon: BookOpen, color: 'bg-purple-100 text-purple-600' },
    { label: 'Lidos', value: kpis.lidos, icon: BookCheck, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Lendo Agora', value: kpis.lendo, icon: Eye, color: 'bg-blue-100 text-blue-600' },
    { label: 'Lista de Desejos', value: kpis.wishlist, icon: Heart, color: 'bg-pink-100 text-pink-600' },
  ] : [];

  function formatAtividade(a: any) {
    if (a.tipo === 'AVALIACAO') return `Avaliou com ${a.detalhe} estrelas`;
    if (a.tipo === 'NOTA') return a.detalhe + '...';
    if (a.detalhe === 'LENDO') return 'Começou a ler';
    if (a.detalhe === 'LIDO') return 'Finalizou';
    if (a.detalhe === 'WISHLIST') return 'Adicionou a wishlist';
    return 'Adicionou à biblioteca';
  }

  function atividadeIcon(tipo: string) {
    if (tipo === 'AVALIACAO') return <Star size={16} className="text-accent-pink" />;
    if (tipo === 'NOTA') return <StickyNote size={16} className="text-accent-blue" />;
    return <Plus size={16} className="text-primary" />;
  }

  function formatDate(d: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#ffffff' }}>Dashboard</h1>
        <Link to="/buscar">
          <Button>
            <Plus size={16} /> <span className="hidden sm:inline">Buscar</span> Livros
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {kpiCards.map((kpi, idx) => (
          <Card key={kpi.label} style={{ animation: `staggerUp 0.5s ease-out ${idx * 100}ms both` }}>
            <CardContent className="pt-4 md:pt-6 !px-3 md:!px-6 !pb-4 md:!pb-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <div className="min-w-0">
                  <p
                    ref={el => { kpiRefs.current[idx] = el; }}
                    className="text-xl md:text-2xl font-bold text-text"
                  >
                    {kpi.value}
                  </p>
                  <p className="text-xs md:text-sm text-text-secondary truncate">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Lendo Agora</CardTitle>
          </CardHeader>
          <CardContent>
            {lendoAgora ? (
              <Link to={`/livro/${lendoAgora.ID}`} className="flex items-center gap-4 md:flex-col md:items-center group">
                <div className="w-24 md:w-40 flex-shrink-0">
                  <BookCover url={lendoAgora.CAPA_URL} titulo={lendoAgora.TITULO} size="full" className="group-hover:shadow-xl transition-shadow" />
                </div>
                <div className="md:text-center min-w-0">
                  <p className="font-semibold text-text group-hover:text-primary transition-colors text-sm md:text-base">{lendoAgora.TITULO}</p>
                  <p className="text-xs md:text-sm text-text-secondary">{lendoAgora.AUTOR}</p>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 md:py-8 text-text-secondary">
                <BookOpen size={32} />
                <p className="text-sm">Nenhum livro em leitura</p>
                <Link to="/proximas" className="text-primary text-sm font-medium hover:underline">Ver proximas leituras</Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {atividades.length > 0 ? (
              <div className="flex flex-col gap-3">
                {atividades.map((a, i) => (
                  <Link
                    key={i}
                    to={`/livro/${a.biblioteca_id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-bg transition-colors group"
                    style={{ animation: `staggerUp 0.4s ease-out ${i * 60}ms both` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {atividadeIcon(a.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate group-hover:text-primary transition-colors">{a.TITULO}</p>
                      <p className="text-xs text-text-secondary truncate">{formatAtividade(a)}</p>
                    </div>
                    <span className="text-xs text-text-secondary flex-shrink-0">{formatDate(a.data)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary text-center py-8">Nenhuma atividade ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      {recentes.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Adicionados Recentemente</CardTitle>
            <Link to="/biblioteca" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2">
              {recentes.map((livro: any, idx: number) => (
                <Link
                  key={livro.ID}
                  to={`/livro/${livro.ID}`}
                  className="flex-shrink-0 group w-24 md:w-32"
                  style={{ animation: `staggerUp 0.4s ease-out ${idx * 80}ms both` }}
                >
                  <div className="book-cover-shimmer book-hover-lift rounded-xl">
                    <BookCover url={livro.CAPA_URL} titulo={livro.TITULO} size="full" className="group-hover:shadow-xl transition-shadow" />
                  </div>
                  <p className="text-xs font-medium text-text mt-1.5 md:mt-2 truncate group-hover:text-primary transition-colors">{livro.TITULO}</p>
                  <p className="text-xs text-text-secondary truncate">{livro.AUTOR}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
