import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingVideoProps {
  videoUrls: string[];
  videoCaptions?: string[];
  videoSpeeches?: string[];
  className?: string;
  showOptions?: boolean;
  options?: Array<{ label: string; onClick: () => void }>;
  autoOpen?: boolean;
}

const extractVimeoId = (url: string) => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (match?.[1]) return match[1];
  return url;
};

const FloatingVideo: React.FC<FloatingVideoProps> = ({ videoUrls, videoCaptions, videoSpeeches, className, showOptions, options, autoOpen = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: window.innerHeight - 370 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, startX: 0, startY: 0 });
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const normalizedVideoUrls = videoUrls.length > 0 ? videoUrls : ['https://vimeo.com/1186307419?share=copy&fl=sv&fe=ci'];
  const normalizedSpeeches = videoSpeeches && videoSpeeches.length > 0 ? videoSpeeches : ['Olá! Eu sou a Lia e posso te ajudar com dúvidas frequentes do IFCE Campus Fortaleza. Escolha uma opção para começar.'];
  const currentVideoId = extractVimeoId(normalizedVideoUrls[activeVideoIndex] ?? normalizedVideoUrls[0]);
  const currentSpeech = normalizedSpeeches[activeVideoIndex] ?? normalizedSpeeches[0];
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dynamicSubtitle, setDynamicSubtitle] = useState('');
  const subtitleTimerRef = useRef<number | null>(null);

  const startDynamicSubtitle = useCallback((text: string) => {
    if (subtitleTimerRef.current) {
      window.clearInterval(subtitleTimerRef.current);
      subtitleTimerRef.current = null;
    }

    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      setDynamicSubtitle('');
      return;
    }

    let index = 0;
    setDynamicSubtitle(words[0]);
    subtitleTimerRef.current = window.setInterval(() => {
      index += 1;
      if (index >= words.length) {
        if (subtitleTimerRef.current) {
          window.clearInterval(subtitleTimerRef.current);
          subtitleTimerRef.current = null;
        }
        setDynamicSubtitle(text);
        return;
      }

      setDynamicSubtitle(words.slice(0, index + 1).join(' '));
    }, 220);
  }, []);

  React.useEffect(() => {
    setActiveVideoIndex(0);
  }, [videoUrls]);

  const speakCurrentText = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !currentSpeech) return;

    startDynamicSubtitle(currentSpeech);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentSpeech);
    const voices = window.speechSynthesis.getVoices();
    const ptBrVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('pt-br'));
    if (ptBrVoice) {
      utterance.voice = ptBrVoice;
    }

    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [currentSpeech, startDynamicSubtitle]);

  React.useEffect(() => {
    if (!isExpanded || !currentSpeech) return;
    speakCurrentText();

    return () => {
      if (subtitleTimerRef.current) {
        window.clearInterval(subtitleTimerRef.current);
        subtitleTimerRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, [currentSpeech, isExpanded, speakCurrentText]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({
      x: clientX,
      y: clientY,
      startX: position.x,
      startY: position.y
    });
  }, [position]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 280, dragStart.startX + deltaX));
    const newY = Math.max(0, Math.min(window.innerHeight - 350, dragStart.startY + deltaY));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    }
  }, [handleDragStart]);

  // Global event handlers
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      handleDragEnd();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Auto-open Avatar 3D on mount if autoOpen is true
  React.useEffect(() => {
    if (autoOpen) {
      setIsExpanded(true);
    }
  }, [autoOpen]);

  // Handle window resize to keep avatar in bounds
  React.useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 280),
        y: Math.min(prev.y, window.innerHeight - 350)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isExpanded) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Avatar 3D em tela cheia"
      >
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="relative w-full h-[60vh] bg-floating-bg rounded-lg overflow-hidden">
              <iframe
                src={`https://player.vimeo.com/video/${currentVideoId}?h=0&badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&loop=1&muted=1&controls=0&transparent=0&portrait=0&title=0&byline=0`}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                title="Avatar 3D da Lia"
                style={{ clipPath: 'inset(0 0 30% 0)' }}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200">
                <p className="text-sm md:text-base text-black font-medium text-center">{dynamicSubtitle || currentSpeech}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto flex gap-2 flex-wrap">
            {normalizedVideoUrls.length > 1 && normalizedVideoUrls.map((_, index) => (
                <Button
                  key={index}
                  variant={activeVideoIndex === index ? 'default' : 'outline'}
                  onClick={() => setActiveVideoIndex(index)}
                  className="flex-1"
                >
                  Vídeo {index + 1}
                </Button>
              ))}
            <Button
              variant={isSpeaking ? 'default' : 'outline'}
              onClick={speakCurrentText}
              className="min-w-36"
            >
              {isSpeaking ? 'Lia falando...' : 'Ouvir Lia'}
            </Button>
          </div>
        </div>
        
        {/* Navigation Options - Sticky Footer */}
        {showOptions && options && options.length > 0 && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 max-h-[30vh] overflow-y-auto">
            <div className="space-y-2 max-w-4xl mx-auto">
              {options.map((option, index) => (
                <Button
                  key={index}
                  variant="option"
                  size="option"
                  onClick={option.onClick}
                  className="w-full"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Control Buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="floating"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="rounded-full"
              aria-label="Minimizar Avatar 3D"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="floating"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="rounded-full"
              aria-label="Fechar Avatar 3D"
            >
              <X className="h-4 w-4" />
            </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Avatar 3D Button */}
      <div className="fixed bottom-32 right-4 z-40">
        <Button
          variant="floating"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="rounded-full shadow-lg"
          aria-label="Abrir Avatar 3D em tela cheia"
          title="Avatar 3D"
        >
          Avatar 3D
        </Button>
      </div>

      {/* Floating Video */}
      <div
        className={cn(
          "fixed z-30 bg-floating-bg border border-border rounded-lg shadow-lg overflow-hidden select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          className
        )}
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: '280px',
          height: '350px',
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        {/* Drag overlay - captures all touch/mouse events */}
        <div
          className="absolute inset-0 z-10"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ touchAction: 'none' }}
        />
        
        {/* Expand button */}
        <div className="absolute top-2 right-2 z-20 flex gap-1">
          <Button
            variant="floating"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="w-6 h-6 rounded-full text-xs"
            aria-label="Maximizar Avatar 3D"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Video iframe */}
        <iframe
          src={`https://player.vimeo.com/video/${currentVideoId}?h=0&badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&loop=1&muted=1&controls=0&transparent=0&portrait=0&title=0&byline=0`}
          className="w-full h-full rounded-lg"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          title="Avatar 3D da Lia"
          style={{ 
            pointerEvents: isDragging ? 'none' : 'auto',
            clipPath: 'inset(0 5% 25% 5%)',
            objectFit: 'cover'
          }}
        />
      </div>
    </>
  );
};

export default FloatingVideo;
