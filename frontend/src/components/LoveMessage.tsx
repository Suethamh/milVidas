import { useState, useEffect, useRef } from 'react';

const frases = [
  'Eu te amo, meu amor',
  'Pamella, minha princesa',
  'Voce e o melhor capitulo da minha vida',
  'Cada pagina me lembra de voce',
  'Meu amor por voce e infinito',
  'Pamella, minha historia favorita',
  'Te amo mais que todos os livros do mundo',
  'Voce e minha protagonista',
  'Com voce, todo dia e um final feliz',
  'Pamella, dona do meu coracao',
];

const coresPink = ['#ec4899', '#f472b6', '#db2777', '#be185d', '#fda4af', '#f9a8d4', '#fbcfe8'];

function MicroHeart({ delay, left }: { delay: number; left: number }) {
  return (
    <span
      className="absolute pointer-events-none select-none"
      style={{
        left: `${left}%`,
        bottom: 0,
        fontSize: `${6 + Math.random() * 5}px`,
        color: coresPink[Math.floor(Math.random() * coresPink.length)],
        animation: `microHeartFloat ${1.5 + Math.random() * 1.5}s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    >
      ♥
    </span>
  );
}

export function LoveMessage({ className = '' }: { className?: string }) {
  const [frase, setFrase] = useState('');
  const [hearts, setHearts] = useState<{ id: number; delay: number; left: number }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    // Escolher frase aleatória
    setFrase(frases[Math.floor(Math.random() * frases.length)]);
  }, []);

  // Spawn micro-corações periodicamente
  useEffect(() => {
    function spawnHeart() {
      const id = nextId.current++;
      setHearts(prev => [...prev.slice(-6), { id, delay: 0, left: Math.random() * 100 }]);
    }

    // Spawnar alguns iniciais
    for (let i = 0; i < 3; i++) {
      setTimeout(spawnHeart, i * 600);
    }

    const interval = setInterval(spawnHeart, 2000 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, []);

  if (!frase) return null;

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-[10px] md:text-xs italic" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {frase} <span style={{ color: '#ec4899' }}>♥</span>
      </span>
      {hearts.map(h => (
        <MicroHeart key={h.id} delay={h.delay} left={h.left} />
      ))}
    </div>
  );
}
