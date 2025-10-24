import { useEffect, useMemo, useState } from 'react';
import { Book, Hand, Map as MapIcon, MapPin } from 'lucide-react';

type PoiId = 'recepcao' | 'napne' | 'biblioteca';

interface NeoTalkMapProps {
  vimeoUrl: string;
  initialPoi?: PoiId;
}

type PoiIconKey = 'map' | 'hand' | 'book';

const POIS = [
  { id: 'recepcao', name: 'Recepção', x: 120, y: 80, active: true, icon: 'map' },
  { id: 'napne', name: 'NAPNE', x: 240, y: 165, active: true, icon: 'hand' },
  { id: 'biblioteca', name: 'Biblioteca', x: 320, y: 110, active: false, icon: 'book' },
] as const satisfies ReadonlyArray<{
  id: PoiId;
  name: string;
  x: number;
  y: number;
  active: boolean;
  icon: PoiIconKey;
}>;

const ICONS: Record<PoiIconKey, typeof MapPin> = {
  map: MapPin,
  hand: Hand,
  book: Book,
};

const mapBackground = (
  <svg
    className="w-full h-full"
    viewBox="0 0 400 300"
    role="img"
    aria-label="Mapa simplificado do campus"
  >
    <rect x="0" y="0" width="400" height="300" fill="#E8F5E9" />
    <rect
      x="40"
      y="40"
      width="120"
      height="80"
      rx="12"
      fill="#E6EEF5"
      stroke="#7A8AA0"
      strokeWidth="2"
    />
    <rect
      x="200"
      y="50"
      width="140"
      height="90"
      rx="12"
      fill="#E6EEF5"
      stroke="#7A8AA0"
      strokeWidth="2"
    />
    <rect
      x="80"
      y="160"
      width="220"
      height="100"
      rx="12"
      fill="#E6EEF5"
      stroke="#7A8AA0"
      strokeWidth="2"
    />
    <path
      d="M60 140 H340"
      stroke="#7A8AA0"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M200 140 V260"
      stroke="#7A8AA0"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const NeoTalkMap = ({ vimeoUrl, initialPoi = 'recepcao' }: NeoTalkMapProps) => {
  const [isAvatarOpen, setAvatarOpen] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<PoiId | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<PoiId>(initialPoi);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAvatarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setSelectedPoi(initialPoi);
  }, [initialPoi]);

  const selectedPoiData = useMemo(
    () => POIS.find((poi) => poi.id === selectedPoi) ?? POIS[0],
    [selectedPoi],
  );

  const handleOpenAvatar = (poiId: PoiId) => {
    setSelectedPoi(poiId);
    setAvatarOpen(true);
  };

  const handlePinClick = (poiId: PoiId, isActive: boolean) => {
    setActiveTooltip(poiId);
    if (isActive) {
      handleOpenAvatar(poiId);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      <button
        type="button"
        onClick={() => setAvatarOpen(true)}
        aria-label="Abrir painel do avatar"
        className="fixed top-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B5FFF] text-white shadow-lg transition duration-200 hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#00D9FF]/60"
      >
        <MapIcon className="h-6 w-6" />
      </button>

      <div className="flex flex-col items-center px-4 pt-20 pb-48">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight">NeoTalk Map</h1>
          <p className="mt-2 text-sm text-[#8B949E]">
            Explore os pontos principais do campus e encontre intérpretes em tempo real.
          </p>
        </div>

        <div className="mt-8 w-full max-w-3xl">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-3xl bg-[#161B26] p-6 shadow-xl">
            <div className="absolute inset-0 flex items-center justify-center">{mapBackground}</div>
            <div className="relative h-full w-full">
              {POIS.map((poi) => {
                const Icon = ICONS[poi.icon];
                const isTooltipVisible = activeTooltip === poi.id;
                const leftPercent = `${(poi.x / 400) * 100}%`;
                const topPercent = `${(poi.y / 300) * 100}%`;

                return (
                  <div
                    key={poi.id}
                    className="absolute"
                    style={{ left: leftPercent, top: topPercent, transform: 'translate(-50%, -50%)' }}
                    onMouseLeave={() =>
                      setActiveTooltip((current) => (current === poi.id ? null : current))
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handlePinClick(poi.id, poi.active)}
                      onFocus={() => setActiveTooltip(poi.id)}
                      onBlur={(event) => {
                        const next = event.relatedTarget as HTMLElement | null;
                        if (next && event.currentTarget.parentElement?.contains(next)) {
                          return;
                        }
                        setActiveTooltip((current) => (current === poi.id ? null : current));
                      }}
                      aria-label={`${poi.name}${poi.active ? '' : ' indisponível'}`}
                      aria-disabled={!poi.active}
                      className={`group relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-[#00D9FF]/60 ${
                        poi.active
                          ? 'border-[#0B5FFF] bg-[#0B5FFF]/80 text-white hover:scale-110 active:scale-95'
                          : 'cursor-not-allowed border-[#7A8AA0] bg-[#161B26] text-[#7A8AA0] opacity-70'
                      }`}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </button>

                    {isTooltipVisible && (
                      <div
                        className="absolute left-1/2 top-full mt-2 w-40 -translate-x-1/2 rounded-xl bg-[#161B26] p-3 text-center text-sm shadow-lg ring-1 ring-white/10"
                      >
                        <p className="font-medium text-[#E6EDF3]">{poi.name}</p>
                        {poi.active ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAvatar(poi.id)}
                            onFocus={() => setActiveTooltip(poi.id)}
                            className="mt-2 w-full rounded-lg bg-[#0B5FFF] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#00D9FF]/60"
                          >
                            Ver avatar
                          </button>
                        ) : (
                          <p className="mt-2 text-xs text-[#8B949E]">Em breve</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="neotalk-avatar-title"
        aria-hidden={!isAvatarOpen}
        className={`fixed inset-x-0 bottom-0 z-20 transform transition-transform duration-300 ease-out ${
          isAvatarOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-3xl max-h-[70vh] overflow-auto rounded-t-3xl bg-[#161B26] p-6 shadow-2xl ring-1 ring-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="neotalk-avatar-title" className="text-xl font-semibold text-white">
                Intérprete NeoTalk
              </h2>
              <p className="mt-1 text-sm text-[#8B949E]">
                Local atual: {selectedPoiData?.name ?? 'Recepção'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAvatarOpen(false)}
              className="rounded-full bg-[#0B5FFF]/10 px-4 py-2 text-sm font-medium text-[#E6EDF3] transition hover:bg-[#0B5FFF]/20 focus:outline-none focus:ring-4 focus:ring-[#00D9FF]/60"
            >
              Fechar
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <iframe
              title="Avatar intérprete NeoTalk"
              src={vimeoUrl}
              className="h-[320px] w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/95 to-transparent px-4 pb-6 pt-24">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 md:flex-row">
          {POIS.map((poi) => {
            const Icon = ICONS[poi.icon];
            const isDisabled = !poi.active;
            return (
              <button
                key={poi.id}
                type="button"
                onClick={() => (isDisabled ? undefined : handleOpenAvatar(poi.id))}
                aria-disabled={isDisabled}
                disabled={isDisabled}
                className={`flex flex-1 items-center justify-center gap-3 rounded-2xl px-4 py-4 text-sm font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-4 focus:ring-[#00D9FF]/60 ${
                  isDisabled
                    ? 'cursor-not-allowed bg-[#161B26] text-[#7A8AA0]'
                    : poi.id === selectedPoi
                    ? 'bg-[#0B5FFF] text-white shadow-lg hover:brightness-110'
                    : 'bg-[#161B26] text-[#E6EDF3] hover:bg-[#0B5FFF]/20'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {poi.name}
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
};

export default NeoTalkMap;
