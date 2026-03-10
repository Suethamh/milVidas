import { useEffect, useState, useRef } from 'react';
import { BookCheck, FileText, Star, Trophy, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getStatsGerais, getStatsPorMes, getStatsGeneros, getStatsAutores, getMeta, salvarMeta } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { animateCountUp } from '../lib/animations';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const PIE_COLORS = ['#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Estatisticas() {
  const [stats, setStats] = useState<any>(null);
  const [porMes, setPorMes] = useState<any[]>([]);
  const [generos, setGeneros] = useState<any[]>([]);
  const [autores, setAutores] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [metaLidos, setMetaLidos] = useState(0);
  const [metaInput, setMetaInput] = useState('');
  const ano = new Date().getFullYear();
  const statRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const countedUp = useRef(false);

  useEffect(() => {
    getStatsGerais().then(setStats);
    getStatsPorMes(ano).then(data => {
      const full = MESES.map((m, i) => {
        const mesNum = String(i + 1).padStart(2, '0');
        const found = data.find((d: any) => d.mes === mesNum);
        return { mes: m, count: found?.count || 0 };
      });
      setPorMes(full);
    });
    getStatsGeneros().then(setGeneros);
    getStatsAutores().then(setAutores);
    getMeta(ano).then(data => {
      setMeta(data.meta);
      setMetaLidos(data.lidos);
      if (data.meta) setMetaInput(String(data.meta.META_LIVROS));
    });
  }, []);

  async function handleSaveMeta() {
    const val = parseInt(metaInput);
    if (!val || val <= 0) return;
    await salvarMeta({ ANO: ano, META_LIVROS: val });
    const data = await getMeta(ano);
    setMeta(data.meta);
    setMetaLidos(data.lidos);
  }

  // Count-up for stats numbers
  useEffect(() => {
    if (stats && !countedUp.current) {
      countedUp.current = true;
      const vals = [
        { val: stats.total_lidos, suffix: '' },
        { val: stats.total_paginas, suffix: '' },
        { val: stats.media_nota, suffix: '' },
      ];
      vals.forEach(({ val, suffix }, i) => {
        const el = statRefs.current[i];
        if (el && val > 0) {
          el.textContent = '0';
          setTimeout(() => {
            if (i === 2) {
              // For average, animate to integer then set decimal
              animateCountUp(el, Math.round(val * 10), 800);
              setTimeout(() => { el.textContent = String(val); }, 850);
            } else {
              animateCountUp(el, val, 900);
            }
          }, i * 200);
        }
      });
    }
  }, [stats]);

  const metaTotal = meta?.META_LIVROS || 0;
  const metaPercent = metaTotal > 0 ? Math.min(100, Math.round((metaLidos / metaTotal) * 100)) : 0;

  return (
    <div className="animate-fadeIn">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: '#ffffff' }}>Estatísticas</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {stats && (
          <>
            <Card style={{ animation: 'staggerUp 0.5s ease-out 0ms both' }}>
              <CardContent className="pt-4 md:pt-6 !px-4 md:!px-6 !pb-4 md:!pb-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                    <BookCheck className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p ref={el => { statRefs.current[0] = el; }} className="text-xl md:text-2xl font-bold text-text">{stats.total_lidos}</p>
                    <p className="text-xs md:text-sm text-text-secondary">Livros Lidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card style={{ animation: 'staggerUp 0.5s ease-out 100ms both' }}>
              <CardContent className="pt-4 md:pt-6 !px-4 md:!px-6 !pb-4 md:!pb-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <FileText className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p ref={el => { statRefs.current[1] = el; }} className="text-xl md:text-2xl font-bold text-text">{stats.total_paginas.toLocaleString()}</p>
                    <p className="text-xs md:text-sm text-text-secondary">Total Páginas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card style={{ animation: 'staggerUp 0.5s ease-out 200ms both' }}>
              <CardContent className="pt-4 md:pt-6 !px-4 md:!px-6 !pb-4 md:!pb-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 flex-shrink-0">
                    <Star className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p ref={el => { statRefs.current[2] = el; }} className="text-xl md:text-2xl font-bold text-text">{stats.media_nota}</p>
                    <p className="text-xs md:text-sm text-text-secondary">Média Avaliação</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Meta Anual */}
      <Card className="mb-6 md:mb-8">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Target size={20} /> Meta de Leitura {ano}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={metaInput}
              onChange={e => setMetaInput(e.target.value)}
              placeholder="Meta"
              className="w-20 text-sm"
            />
            <Button size="sm" onClick={handleSaveMeta}>Salvar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {metaTotal > 0 ? (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">{metaLidos} de {metaTotal} livros</span>
                <span className="font-medium text-primary">{metaPercent}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full progress-bar-animated rounded-full transition-all duration-1000"
                  style={{ width: `${metaPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">Defina uma meta para acompanhar seu progresso</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Livros por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Livros por Mês ({ano})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="rgba(0,0,0,0.1)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} stroke="rgba(0,0,0,0.1)" />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Livros" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gêneros */}
        <Card>
          <CardHeader>
            <CardTitle>Gêneros Mais Lidos</CardTitle>
          </CardHeader>
          <CardContent>
            {generos.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={generos}
                    dataKey="count"
                    nameKey="genero"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                    label={({ genero, percent }) => `${genero} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    fontSize={12}
                  >
                    {generos.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-text-secondary text-center py-16">Sem dados suficientes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Autores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy size={20} /> Top Autores</CardTitle>
        </CardHeader>
        <CardContent>
          {autores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {autores.map((a, i) => (
                <div
                  key={a.autor}
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary-bg"
                  style={{ animation: `staggerUp 0.4s ease-out ${i * 60}ms both` }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-400 text-white' :
                    i === 1 ? 'bg-gray-400 text-white' :
                    i === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 text-text-secondary'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">{a.autor}</p>
                    <p className="text-xs text-text-secondary">{a.count} livro{a.count > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-8">Sem dados suficientes</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
