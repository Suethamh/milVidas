// Sistema de partículas leve para efeitos visuais celebratórios

type ParticleType = 'sparkle' | 'hearts' | 'confetti';

const COLORS = {
  sparkle: ['#fbbf24', '#f59e0b', '#fcd34d', '#ffffff', '#fef3c7'],
  hearts: ['#ec4899', '#f472b6', '#db2777', '#be185d', '#fda4af'],
  confetti: ['#ec4899', '#a855f7', '#fbbf24', '#3b82f6', '#7c3aed', '#f472b6', '#60a5fa'],
};

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/**
 * Cria partículas de brilho (sparkles) saindo de um elemento
 */
export function spawnSparkles(element: HTMLElement, count = 8) {
  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle-sparkle';
    const size = randomBetween(4, 10);
    const angle = (i / count) * Math.PI * 2 + randomBetween(-0.3, 0.3);
    const distance = randomBetween(20, 50);
    const color = COLORS.sparkle[Math.floor(Math.random() * COLORS.sparkle.length)];

    Object.assign(particle.style, {
      position: 'fixed',
      left: `${cx}px`,
      top: `${cy}px`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: '9999',
      boxShadow: `0 0 ${size}px ${color}`,
      transform: 'translate(-50%, -50%) scale(1)',
      animation: `sparkleOut 0.6s ease-out forwards`,
      '--tx': `${Math.cos(angle) * distance}px`,
      '--ty': `${Math.sin(angle) * distance}px`,
    } as any);

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 700);
  }
}

/**
 * Cria burst grande de sparkles (para 5 estrelas)
 */
export function spawnBigSparkles(element: HTMLElement) {
  spawnSparkles(element, 16);
  // Segunda onda com delay
  setTimeout(() => spawnSparkles(element, 12), 150);
}

/**
 * Cria corações flutuando para cima
 */
export function spawnHearts(element: HTMLElement, count = 7) {
  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top;

  for (let i = 0; i < count; i++) {
    const heart = document.createElement('div');
    heart.className = 'particle-heart';
    heart.innerHTML = '♥';
    const size = randomBetween(14, 26);
    const color = COLORS.hearts[Math.floor(Math.random() * COLORS.hearts.length)];
    const delay = randomBetween(0, 400);
    const xOffset = randomBetween(-40, 40);

    Object.assign(heart.style, {
      position: 'fixed',
      left: `${cx + xOffset}px`,
      top: `${cy}px`,
      fontSize: `${size}px`,
      color: color,
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '1',
      textShadow: `0 0 8px ${color}40`,
      animation: `heartFloat 1.2s ease-out ${delay}ms forwards`,
      '--swing': `${randomBetween(-25, 25)}px`,
    } as any);

    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1700);
  }
}

/**
 * Cria explosão de confetti
 */
export function spawnConfetti(element?: HTMLElement, count = 30) {
  let cx: number, cy: number;
  if (element) {
    const rect = element.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
  } else {
    cx = window.innerWidth / 2;
    cy = window.innerHeight / 3;
  }

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'particle-confetti';
    const color = COLORS.confetti[Math.floor(Math.random() * COLORS.confetti.length)];
    const size = randomBetween(5, 10);
    const isRect = Math.random() > 0.5;
    const delay = randomBetween(0, 200);

    Object.assign(piece.style, {
      position: 'fixed',
      left: `${cx}px`,
      top: `${cy}px`,
      width: `${isRect ? size * 0.4 : size}px`,
      height: `${isRect ? size : size * 0.4}px`,
      backgroundColor: color,
      borderRadius: isRect ? '1px' : '50%',
      pointerEvents: 'none',
      zIndex: '9999',
      animation: `confettiFall ${randomBetween(0.8, 1.5)}s ease-out ${delay}ms forwards`,
      '--tx': `${randomBetween(-120, 120)}px`,
      '--rot': `${randomBetween(0, 720)}deg`,
    } as any);

    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 2000);
  }
}

/**
 * Cria efeito ripple num elemento (para botões)
 */
export function createRipple(event: React.MouseEvent<HTMLElement>, color = 'rgba(255,255,255,0.4)') {
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('div');
  Object.assign(ripple.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: color,
    transform: 'scale(0)',
    animation: 'rippleExpand 0.5s ease-out forwards',
    pointerEvents: 'none',
    zIndex: '0',
  });

  // Garantir que o elemento tem position relative
  const pos = getComputedStyle(element).position;
  if (pos === 'static') element.style.position = 'relative';
  element.style.overflow = 'hidden';

  element.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

/**
 * Hook para animar números contando de 0 até o valor final
 */
export function animateCountUp(
  element: HTMLElement,
  endValue: number,
  duration = 800,
  prefix = '',
  suffix = '',
) {
  const startTime = performance.now();
  const startValue = 0;

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startValue + (endValue - startValue) * eased);
    element.textContent = `${prefix}${current.toLocaleString('pt-BR')}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
