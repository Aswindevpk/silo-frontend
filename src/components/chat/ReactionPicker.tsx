import React from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ 
  onSelect, 
  trigger,
  className,
  side = 'top',
  align = 'center'
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8 text-gray-500 hover:text-gray-900 rounded-full", className)}
          >
            <SmilePlus className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        align={align} 
        className="w-auto p-0 border-none shadow-xl rounded-xl"
      >
        <Picker 
          data={data} 
          onEmojiSelect={(emoji: any) => onSelect(emoji.native)} 
          theme="light"
          set="native"
          previewPosition="none"
          skinTonePosition="none"
        />
      </PopoverContent>
    </Popover>
  );
};
