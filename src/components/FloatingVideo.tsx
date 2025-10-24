import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingVideoProps {
  videoUrl: string;
  className?: string;
  showOptions?: boolean;
  options?: Array<{ label: string; onClick: () => void }>;
  autoOpen?: boolean;
}

const FloatingVideo: React.FC<FloatingVideoProps> = ({ videoUrl, className, showOptions, options, autoOpen = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: window.innerHeight - 370 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, startX: 0, startY: 0 });

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
          <div className="relative w-full max-w-4xl h-full max-h-[70vh] bg-floating-bg rounded-lg overflow-hidden">
            <iframe
              src={`https://player.vimeo.com/video/${videoUrl.split('/').pop()}?h=0&badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&loop=1&muted=1&controls=0&transparent=0&portrait=0&title=0&byline=0`}
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              title="Avatar 3D da Lia"
              style={{ clipPath: 'inset(0 0 30% 0)' }}
            />
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
          src={`https://player.vimeo.com/video/${videoUrl.split('/').pop()}?h=0&badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&loop=1&muted=1&controls=0&transparent=0&portrait=0&title=0&byline=0`}
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
