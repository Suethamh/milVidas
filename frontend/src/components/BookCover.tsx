import React from 'react';

interface BookCoverProps {
  url?: string | null;
  titulo?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizes = {
  sm: 'w-16 h-24',
  md: 'w-32 h-48',
  lg: 'w-48 h-72',
  full: 'w-full',
};

function getInitials(titulo?: string) {
  if (!titulo) return '?';
  return titulo
    .split(' ')
    .filter(w => w.length > 2)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function isGoogleBooksUrl(url: string): boolean {
  return url.includes('books.google') || url.includes('googleapis.com/books');
}

// Cache global de verificação de capas (evita re-verificar a mesma URL)
const coverCache = new Map<string, string | null>();

export function BookCover({ url, titulo, className = '', size = 'md' }: BookCoverProps) {
  const [state, setState] = React.useState<'loading' | 'verified' | 'fallback'>('loading');
  const [verifiedUrl, setVerifiedUrl] = React.useState<string | null>(null);
  const isFull = size === 'full';

  React.useEffect(() => {
    if (!url) {
      setState('fallback');
      return;
    }

    // URL não é do Google Books — usar diretamente
    if (!isGoogleBooksUrl(url)) {
      setVerifiedUrl(url.replace(/^http:/, 'https:'));
      setState('verified');
      return;
    }

    // Checar cache
    const cached = coverCache.get(url);
    if (cached !== undefined) {
      if (cached) {
        setVerifiedUrl(cached);
        setState('verified');
      } else {
        setState('fallback');
      }
      return;
    }

    // Verificar com o backend se a capa é real
    setState('loading');
    fetch(`/api/livros/verificar-capa?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(data => {
        coverCache.set(url, data.real ? data.url : null);
        if (data.real && data.url) {
          setVerifiedUrl(data.url);
          setState('verified');
        } else {
          setState('fallback');
        }
      })
      .catch(() => {
        // Se falhar a verificação, tenta usar a URL original
        setVerifiedUrl(url.replace(/^http:/, 'https:').replace(/&edge=curl/g, ''));
        setState('verified');
      });
  }, [url]);

  // Loading: mostrar skeleton
  if (state === 'loading') {
    return (
      <div
        className={`${sizes[size]} rounded-xl bg-white/10 animate-pulse shadow-lg overflow-hidden ${className}`}
        style={{ aspectRatio: '2/3' }}
      />
    );
  }

  // Fallback: gradiente bonito com iniciais
  if (state === 'fallback' || !verifiedUrl) {
    return (
      <div
        className={`${sizes[size]} rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 shadow-lg overflow-hidden ${className}`}
        style={{ aspectRatio: '2/3' }}
      >
        <span className={`text-white font-bold drop-shadow ${isFull ? 'text-2xl' : 'text-lg'}`}>
          {getInitials(titulo)}
        </span>
      </div>
    );
  }

  // Capa verificada
  return (
    <img
      src={verifiedUrl}
      alt={titulo || 'Capa do livro'}
      onError={() => setState('fallback')}
      className={`${sizes[size]} rounded-xl object-cover shadow-lg ${className}`}
      style={{ aspectRatio: '2/3' }}
    />
  );
}
