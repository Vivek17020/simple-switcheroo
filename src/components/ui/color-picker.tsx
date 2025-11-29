import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

const colors = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF8800', '#FFFF00', '#88FF00', '#00FF00', '#00FF88',
  '#00FFFF', '#0088FF', '#0000FF', '#8800FF', '#FF00FF', '#FF0088',
  '#8B4513', '#D2691E', '#CD853F', '#DEB887', '#F5DEB3', '#FFEBCD',
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <div 
              className="w-4 h-4 rounded border border-border"
              style={{ backgroundColor: value || 'transparent' }}
            />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="grid grid-cols-6 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => {
                onChange(color);
                setOpen(false);
              }}
              className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8 rounded border border-border cursor-pointer"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}