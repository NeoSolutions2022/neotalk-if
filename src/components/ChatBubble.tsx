import React from 'react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  message: string;
  isBot?: boolean;
  avatar?: string;
  className?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isBot = false, 
  avatar = "lia", 
  className 
}) => {
  const currentTime = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return (
    <div className={cn(
      "flex gap-3 mb-4 animate-fade-in",
      isBot ? "justify-start" : "justify-end",
      className
    )}>
      {isBot && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-avatar-background border-2 border-avatar-border flex items-center justify-center">
          <span className="text-sm font-medium text-primary">L</span>
        </div>
      )}
      <div className="flex flex-col">
        <div
          className={cn(
            "max-w-[80vw] sm:max-w-[70%] p-4 rounded-lg shadow-sm",
            isBot 
              ? "bg-chat-bubble-bot text-chat-bubble-bot-foreground rounded-tl-none" 
              : "bg-chat-bubble-user text-chat-bubble-user-foreground rounded-tr-none"
          )}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message}
          </div>
        </div>
        <div className={cn(
          "text-xs text-muted-foreground mt-1",
          isBot ? "text-left" : "text-right"
        )}>
          {currentTime}
        </div>
      </div>
      {!isBot && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-chat-bubble-user flex items-center justify-center">
          <span className="text-sm font-medium text-chat-bubble-user-foreground">U</span>
        </div>
      )}
    </div>
  );
};

export default ChatBubble;