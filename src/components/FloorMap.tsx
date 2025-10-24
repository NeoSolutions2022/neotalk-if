import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface FloorMapProps {
  mapSrc: string;
  floorName: string;
  className?: string;
}

const FloorMap: React.FC<FloorMapProps> = ({ mapSrc, floorName, className = '' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`floor-map ${className}`}>
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer transition-all hover:opacity-80">
            <img 
              src={mapSrc}
              alt={`Mapa do ${floorName}`}
              className="w-full h-auto rounded-lg border border-border shadow-sm"
            />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Toque para ampliar o mapa do {floorName}
            </p>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
          <img 
            src={mapSrc}
            alt={`Mapa ampliado do ${floorName}`}
            className="w-full h-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FloorMap;