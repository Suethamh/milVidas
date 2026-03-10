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

function processUrl(url: string, zoom?: number): string {
  let processed = url.replace(/^http:/, 'https:');
  if (isGoogleBooksUrl(processed)) {
    processed = processed.replace(/&edge=curl/g, '');
    if (zoom !== undefined) {
      processed = processed.replace(/zoom=\d/, `zoom=${zoom}`);
    }
  }
  return processed;
}

export function BookCover({ url, titulo, className = '', size = 'md' }: BookCoverProps) {
  const [state, setState] = React.useState<'loading' | 'zoom3' | 'zoom1' | 'fallback'>('loading');
  const isFull = size === 'full';

  // Reset state when URL changes
  React.useEffect(() => {
    setState('loading');
  }, [url]);

  if (!url || state === 'fallback') {
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

  // Determinar qual URL mostrar
  let displayUrl: string;
  if (isGoogleBooksUrl(url)) {
    if (state === 'zoom1') {
      // Fallback para zoom=1 (mais confiável, mostra capa real)
      displayUrl = processUrl(url, 1);
    } else {
      // Tentar zoom=3 primeiro (melhor resolução)
      displayUrl = processUrl(url, 3);
    }
  } else {
    displayUrl = processUrl(url);
  }

  return (
    <img
      src={displayUrl}
      alt={titulo || 'Capa do livro'}
      onLoad={() => {
        if (state === 'loading') setState('zoom3');
      }}
      onError={() => {
        if (state === 'loading' && isGoogleBooksUrl(url)) {
          // zoom=3 falhou, tentar zoom=1
          setState('zoom1');
        } else if (state === 'zoom1' || !isGoogleBooksUrl(url)) {
          // zoom=1 também falhou ou não é Google Books, mostrar fallback
          setState('fallback');
        } else {
          setState('fallback');
        }
      }}
      className={`${sizes[size]} rounded-xl object-cover shadow-lg ${className}`}
      style={{ aspectRatio: '2/3' }}
    />
  );
}
