import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Book, Hand, Map as MapIcon, MapPin } from 'lucide-react';

type PoiId = 'recepcao' | 'napne' | 'biblioteca';

interface NeoTalkMapProps {
  vimeoUrl: string;
  defaultOpen?: boolean;
  onPoiOpen?(id: PoiId): void;
}

const POIS = [
  { id: 'recepcao', name: 'Recepção', x: 49, y: 63, color: '#79D56B', active: true },
  { id: 'napne', name: 'NAPNE', x: 76, y: 36, color: '#FF3B3B', active: true },
  { id: 'biblioteca', name: 'Biblioteca', x: 60, y: 20, color: '#FF3B3B', active: false },
] as const satisfies ReadonlyArray<{
  id: PoiId;
  name: string;
  x: number;
  y: number;
  color: string;
  active: boolean;
}>;

const LEGEND_ITEMS = [
  'Recepção',
  'NAPNE',
  'Biblioteca',
  'Auditório',
  'Elevadores',
  'Banheiros',
  'Áreas de descanso',
] as const;

const MAP_ROOMS = [
  { left: '10%', top: '18%', width: '28%', height: '32%' },
  { left: '44%', top: '16%', width: '24%', height: '28%' },
  { left: '70%', top: '22%', width: '18%', height: '30%' },
  { left: '16%', top: '58%', width: '30%', height: '28%' },
  { left: '52%', top: '54%', width: '32%', height: '34%' },
];

const ICONS: Record<PoiId, typeof MapPin> = {
  recepcao: MapPin,
  napne: Hand,
  biblioteca: Book,
};

const focusableSelectors =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const NeoTalkMap = ({ vimeoUrl, defaultOpen = true, onPoiOpen }: NeoTalkMapProps) => {
  const [isDrawerOpen, setDrawerOpen] = useState(defaultOpen);
  const [activeTooltip, setActiveTooltip] = useState<PoiId | null>(null);
  const [activePoi, setActivePoi] = useState<PoiId>('recepcao');
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDrawerOpen(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (defaultOpen) {
      onPoiOpen?.(activePoi);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeTooltip = useCallback((poiId: PoiId) => {
    setActiveTooltip((current) => (current === poiId ? null : current));
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isDrawerOpen) {
        if (event.key === 'Escape') {
          setDrawerOpen(false);
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }

      if (event.key === 'Tab') {
        const drawer = drawerRef.current;
        if (!drawer) {
          return;
        }
        const focusable = Array.from(
          drawer.querySelectorAll<HTMLElement>(focusableSelectors),
        ).filter((el) => !el.hasAttribute('disabled'));

        if (focusable.length === 0) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!drawer.contains(document.activeElement)) {
          first.focus();
          event.preventDefault();
          return;
        }

        if (!event.shiftKey && document.activeElement === last) {
          first.focus();
          event.preventDefault();
        } else if (event.shiftKey && document.activeElement === first) {
          last.focus();
          event.preventDefault();
        }
      }
    },
    [isDrawerOpen],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }
    const drawer = drawerRef.current;
    if (!drawer) {
      return;
    }

    const focusable = drawer.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstFocusable = focusable[0];
    firstFocusable?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) {
      setActiveTooltip(null);
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const pinWasClicked = POIS.some((poi) =>
        target.closest(`[data-poi-id="${poi.id}"]`),
      );

      if (!pinWasClicked) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openDrawerForPoi = useCallback(
    (poiId: PoiId) => {
      setActivePoi(poiId);
      setDrawerOpen(true);
      onPoiOpen?.(poiId);
    },
    [onPoiOpen],
  );

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((previous) => {
      const next = !previous;
      if (next) {
        onPoiOpen?.(activePoi);
      }
      return next;
    });
  }, [activePoi, onPoiOpen]);

  const currentPoi = useMemo(
    () => POIS.find((poi) => poi.id === activePoi) ?? POIS[0],
    [activePoi],
  );

  return (
    <div className="min-h-screen bg-[#0D1117] py-10 text-[#E6EDF3]">
      <div className="relative mx-auto max-w-[420px] sm:max-w-[480px] md:max-w-[560px] px-4">
        <button
          type="button"
          aria-label={isDrawerOpen ? 'Fechar mini mapa' : 'Abrir mini mapa'}
          onClick={toggleDrawer}
          className="fixed top-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B5FFF] text-white shadow-lg transition-transform duration-200 hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#00D9FF]/70"
        >
          <MapIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="rounded-3xl bg-[#161B26] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold">NeoTalk Map</h1>
            <p className="mt-2 text-sm text-[#8B949E]">
              Explore o campus e encontre os principais pontos com intérpretes disponíveis.
            </p>
          </header>

          <div className="relative mb-6">
            <div
              className="relative aspect-video overflow-hidden rounded-[32px] bg-[#0DA1FF]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at center, rgba(22,151,246,0.95), rgba(13,161,255,0.8) 45%, rgba(13,17,23,0.65) 100%)',
              }}
            >
              <div className="absolute inset-y-8 -left-6 hidden w-6 rounded-[24px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] sm:block" />
              <div className="absolute inset-y-8 -right-6 hidden w-6 rounded-[24px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] sm:block" />

              <div className="absolute inset-0">
                {MAP_ROOMS.map((room, index) => (
                  <div
                    key={`room-${index}`}
                    className="absolute rounded-[28px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                    style={{
                      left: room.left,
                      top: room.top,
                      width: room.width,
                      height: room.height,
                    }}
                  />
                ))}

                <div className="absolute left-[38%] top-[46%] h-[8%] w-[32%] rounded-full bg-white/70 blur-2xl" />

                <div className="absolute inset-0">
                  {POIS.map((poi) => {
                    const Icon = ICONS[poi.id];
                    const isTooltipActive = activeTooltip === poi.id;
                    return (
                      <div
                        key={poi.id}
                        className="absolute"
                        style={{ left: `${poi.x}%`, top: `${poi.y}%`, transform: 'translate(-50%, -50%)' }}
                        data-poi-id={poi.id}
                        onMouseLeave={() => closeTooltip(poi.id)}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTooltip(poi.id);
                            if (poi.active) {
                              openDrawerForPoi(poi.id);
                            }
                          }}
                          onFocus={() => setActiveTooltip(poi.id)}
                          aria-label={`${poi.name}${poi.active ? '' : ' indisponível'}`}
                          aria-disabled={!poi.active}
                          className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white/70 text-[#0D1117] shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-white/70 ${
                            poi.active ? 'hover:scale-110' : 'opacity-70'
                          }`}
                          style={{ backgroundColor: poi.color }}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>

                        {isTooltipActive && (
                          <div className="absolute left-1/2 top-full z-10 mt-3 w-48 -translate-x-1/2 rounded-2xl bg-[#161B26] p-4 text-sm text-[#E6EDF3] shadow-[0_12px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
                            <p className="font-semibold">{poi.name}</p>
                            {poi.active ? (
                              <button
                                type="button"
                                onClick={() => openDrawerForPoi(poi.id)}
                                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#0B5FFF] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#00D9FF]/70"
                              >
                                Ver avatar
                              </button>
                            ) : (
                              <p className="mt-3 text-xs text-[#8B949E]">Em breve</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional SVG alternative for the map layout:
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 400 225"
                role="img"
                aria-label="Mapa estilizado do campus"
              >
                <defs>
                  <radialGradient id="mapGlow" cx="50%" cy="50%" r="75%">
                    <stop offset="0%" stopColor="#1697F6" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#0DA1FF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0D1117" stopOpacity="0.65" />
                  </radialGradient>
                </defs>
                <rect width="400" height="225" fill="url(#mapGlow)" />
                <g fill="#FFFFFF" stroke="rgba(0,0,0,0.1)" strokeWidth="2">
                  <rect x="40" y="36" width="120" height="72" rx="28" />
                  <rect x="188" y="30" width="112" height="64" rx="28" />
                  <rect x="280" y="48" width="72" height="80" rx="28" />
                  <rect x="80" y="132" width="136" height="72" rx="28" />
                  <rect x="220" y="120" width="152" height="84" rx="28" />
                </g>
              </svg>
              */}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 text-[#0D1117] shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold">Legenda</h2>
            <ol className="mt-4 space-y-2 text-sm font-medium">
              {LEGEND_ITEMS.map((item, index) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B5FFF] text-base font-semibold text-white shadow-[0_6px_14px_rgba(11,95,255,0.35)]">
                    {index + 1}
                  </span>
                  <span className="text-[#111827]">
                    {item}
                    {item === 'Elevadores' ? (
                      <span className="ml-2 rounded-full bg-[#0B5FFF] px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                        Elevadores
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="neotalk-avatar-title"
        aria-hidden={!isDrawerOpen}
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          ref={drawerRef}
          className="mx-auto max-w-[420px] sm:max-w-[480px] md:max-w-[560px] rounded-t-3xl border-t border-white/10 bg-[#161B26] p-6 shadow-[0_-20px_48px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="neotalk-avatar-title" className="text-xl font-semibold text-white">
                Intérprete NeoTalk
              </h2>
              <p className="mt-1 text-sm text-[#8B949E]">Local atual: {currentPoi.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-[#00D9FF]/70"
            >
              Fechar
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <iframe
              title="Avatar intérprete NeoTalk"
              src={vimeoUrl}
              className="aspect-video w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeoTalkMap;
