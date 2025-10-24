import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ChatBubble from './ChatBubble';
import FloatingVideo from './FloatingVideo';

interface ChatOption {
  label: string;
  next: string;
}

interface ChatState {
  type: 'message' | 'options' | 'command';
  avatar?: string;
  message?: string;
  options?: ChatOption[];
  next?: string;
  command?: string;
  params?: any;
}

// ATENÇÃO:
// - O avatar flutuante DEVE funcionar em mobile
// - Deve ser possível mover (arrastar) com o dedo
// - Deve ser possível redimensionar com gesto de pinça (zoom)
// - Posição inicial: canto inferior direito

const chatFlow: Record<string, ChatState> = {
  start: {
    type: 'message',
    avatar: 'lia',
    message: `👋 Bem-vindo(a) ao Mapa Interativo Acessível do IFCE Fortaleza.
O NeoTalk nasceu para tornar o campus mais acessível por meio da tecnologia.
Aqui, qualquer pessoa pode se orientar com autonomia, inclusão e inovação, utilizando Libras, texto ou áudio.

Mais que mapas, criamos conexões. 🌐`,
    next: 'introduction'
  },
  
  introduction: {
    type: 'message',
    avatar: 'lia',
    message: `Olá, eu sou a Lia.
O NeoTalk é uma tecnologia assistiva criada para deixar o prédio Ernando Pinheiro 100% acessível em Libras.
Aqui, o chat responde dúvidas sobre salas, banheiros, saídas de emergência e muito mais — tudo em Libras, texto ou áudio, como você preferir.

Seu acesso, sua autonomia. Vamos começar?`,
    next: 'menu_principal'
  },
  
  menu_principal: {
    type: 'options',
    message: 'Escolha uma das opções abaixo para assistir ao vídeo correspondente:',
    options: [
      { label: '🎥 Recepção', next: 'recepcao_video' },
      { label: '🎥 NAPNE', next: 'napne_video' },
      { label: '🎥 Biblioteca', next: 'biblioteca_video' }
    ]
  },

  recepcao_video: {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1129591813',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'menu_principal'
  },

  napne_video: {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1130092406',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'menu_principal'
  },

  biblioteca_video: {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1130092406',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'menu_principal'
  }
};

const Chat: React.FC = () => {
  const [currentState, setCurrentState] = useState('start');
  const [messages, setMessages] = useState<Array<{ id: string; message: string; isBot: boolean }>>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [floatingVideoUrl, setFloatingVideoUrl] = useState('https://vimeo.com/1129591813');

  React.useEffect(() => {
    const state = chatFlow[currentState];
    if (state) {
      // Only add to messages if it's not a command type
      if (state.type !== 'command' && state.message) {
        const messageId = `${currentState}-${Date.now()}`;
        setMessages(prev => [...prev, {
          id: messageId,
          message: state.message,
          isBot: true
        }]);
      }
      
      if (state.type === 'options') {
        setShowOptions(true);
      } else if (state.type === 'command') {
        if (state.command === 'setFloatingAvatarVideo' && state.params?.url) {
          setFloatingVideoUrl(state.params.url);
        }
        setShowOptions(false);
        if (state.next) {
          setTimeout(() => {
            setCurrentState(state.next!);
          }, 300);
        }
      } else if (state.next) {
        setShowOptions(false);
        // Auto-advance for message types after a delay, but only for start message
        if (state.type === 'message' && currentState === 'start') {
          setTimeout(() => {
            setCurrentState(state.next!);
          }, 1500);
        } else if (state.type === 'message' && currentState !== 'start') {
          // For other message types, auto-advance after 2 seconds
          setTimeout(() => {
            setCurrentState(state.next!);
          }, 2000);
        }
      }
    }
  }, [currentState]);

  const handleOptionClick = (nextState: string) => {
    setMessages([]);
    setShowOptions(false);
    setCurrentState(nextState);
  };

  const currentChatState = chatFlow[currentState];

  return (
    <div className="flex flex-col h-screen bg-chat-background">
      {/* Header */}
      <div className="bg-background border-b border-border p-4 flex items-center gap-3">
        <img
          src="data:image/png;base64,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"
          alt="Logotipo do IFCE"
          className="h-12 w-auto"
        />
        <h1 className="text-xl font-bold text-foreground">Área de Conversação</h1>
      </div>

      {/* Messages and Maps */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="w-full">
          <img
            src="/lovable-uploads/IFCE.png"
            alt="Mapa do IFCE"
            className="w-full max-w-md mx-auto rounded-lg shadow"
          />
        </div>

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.message}
            isBot={msg.isBot}
          />
        ))}
      </div>

      {/* Options */}
      {showOptions && currentChatState?.options && (
        <div className="p-4 border-t border-border bg-background">
          <div className="space-y-2">
            {currentChatState.options.map((option, index) => (
              <Button
                key={index}
                variant="option"
                size="option"
                onClick={() => handleOptionClick(option.next)}
                className="w-full"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Video */}
      <FloatingVideo 
        videoUrl={floatingVideoUrl} 
        showOptions={showOptions} 
        options={currentChatState?.options?.map(option => ({
          label: option.label,
          onClick: () => handleOptionClick(option.next)
        }))}
        autoOpen={true}
      />
    </div>
  );
};

export default Chat;
