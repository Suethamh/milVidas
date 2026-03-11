import { useState, useEffect, useRef } from 'react';

const frases = [
  'Eu te amo, meu amor',
  'P\u00e2mella, minha princesa',
  'Voc\u00ea \u00e9 o melhor cap\u00edtulo da minha vida',
  'Cada p\u00e1gina me lembra de voc\u00ea',
  'Meu amor por voc\u00ea \u00e9 infinito',
  'P\u00e2mella, minha hist\u00f3ria favorita',
  'Te amo mais que todos os livros do mundo',
  'Voc\u00ea \u00e9 minha protagonista',
  'Com voc\u00ea, todo dia \u00e9 um final feliz',
  'P\u00e2mella, dona do meu cora\u00e7\u00e3o',
];

const coresBrancas = ['#ffffff', '#f0f0f0', '#e8e8e8', '#fce4ec', '#fdf2f8'];

function MicroHeart({ delay, left }: { delay: number; left: number }) {
  return (
    <span
      className="absolute pointer-events-none select-none"
      style={{
        left: `${left}%`,
        bottom: 0,
        fontSize: `${6 + Math.random() * 5}px`,
        color: coresBrancas[Math.floor(Math.random() * coresBrancas.length)],
        animation: `microHeartFloat ${1.5 + Math.random() * 1.5}s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    >
      &#9829;
    </span>
  );
}

export function LoveMessage({ className = '' }: { className?: string }) {
  const [frase, setFrase] = useState('');
  const [hearts, setHearts] = useState<{ id: number; delay: number; left: number }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    setFrase(frases[Math.floor(Math.random() * frases.length)]);
  }, []);

  useEffect(() => {
    function spawnHeart() {
      const id = nextId.current++;
      setHearts(prev => [...prev.slice(-6), { id, delay: 0, left: Math.random() * 100 }]);
    }

    for (let i = 0; i < 3; i++) {
      setTimeout(spawnHeart, i * 600);
    }

    const interval = setInterval(spawnHeart, 2000 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, []);

  if (!frase) return null;

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-[10px] md:text-xs italic" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {frase} <span style={{ color: '#ffffff' }}>&#9829;</span>
      </span>
      {hearts.map(h => (
        <MicroHeart key={h.id} delay={h.delay} left={h.left} />
      ))}
    </div>
  );
}
