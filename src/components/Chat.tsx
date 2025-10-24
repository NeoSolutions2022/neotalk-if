import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ChatBubble from './ChatBubble';
import FloatingVideo from './FloatingVideo';
import FloorMap from './FloorMap';

interface ChatOption {
  label: string;
  next: string;
}

interface ChatState {
  type: 'message' | 'options' | 'videoMessage' | 'command' | 'mapWithVideo';
  avatar?: string;
  message?: string;
  options?: ChatOption[];
  videoUrl?: string;
  next?: string;
  command?: string;
  params?: any;
  mapSrc?: string;
  floorName?: string;
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
    message: 'Seja bem-vindo!',
    next: 'introduction'
  },
  
  introduction: {
    type: 'message',
    avatar: 'lia',
    message: `Olá, eu sou a Lia.
O NeoTalk é uma tecnologia assistiva criada para deixar o prédio Ernando Pinheiro 100% acessível em Libras.
Aqui, o chat responde dúvidas sobre salas, banheiros, saídas de emergência e muito mais — tudo em Libras, texto ou áudio, como você preferir.

Seu acesso, sua autonomia. Vamos começar?`,
    next: 'menu_principal_p1'
  },
  
  menu_principal_p1: {
    type: 'options',
    message: 'Escolha abaixo qual andar ou área deseja explorar:',
    options: [
      { label: '📍 Térreo', next: 'terreo_menu' },
      { label: '🌀 1º Andar', next: 'placeholder_1andar' },
      { label: '🌀 2º Andar', next: 'placeholder_2andar' },
      { label: '🌀 3º Andar', next: 'placeholder_3andar' },
      { label: '→ Próxima Página', next: 'menu_principal_p2' }
    ]
  },
  
  menu_principal_p2: {
    type: 'options',
    message: 'Continue explorando:',
    options: [
      { label: '🌀 4º Andar', next: 'placeholder_4andar' },
      { label: '← Voltar', next: 'menu_principal_p1' }
    ]
  },
  
  terreo_menu: {
    type: 'options',
    message: 'Você está no térreo. Qual área deseja conhecer?',
    options: [
      { label: '← Voltar', next: 'menu_principal_p1' },
      { label: '🚻 Banheiros', next: 'terreo_banheiros_intro' },
      { label: '📂 Salas', next: 'terreo_salas_intro' },
      { label: '🚨 Escada de Emergência', next: 'terreo_escada_intro' }
    ]
  },
  
  terreo_banheiros_intro: {
    type: 'message',
    avatar: 'lia',
    message: `Os banheiros masculino, feminino e acessível ficam à direita da entrada, depois da porta cinza.
No mapa, um ícone azul pisca indicando o local.`,
    next: 'terreo_banheiros_video'
  },
  
  terreo_banheiros_video: {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1101984008',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'voltar_ou_continuar'
  },
  
  
  terreo_escada_intro: {
    type: 'message',
    avatar: 'lia',
    message: `A escada de emergência fica à direita da entrada, ao lado da porta cinza.
No mapa, uma porta verde pisca indicando o local.`,
    next: 'terreo_escada_video'
  },
  
  terreo_escada_video: {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1101983991',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'voltar_ou_continuar'
  },
  
  terreo_salas_intro: {
    type: 'message',
    avatar: 'lia',
    message: `Entre pela porta ao lado da recepção.
• 1ª porta à esquerda: Sala de Atendimento
• 2ª porta: Coordenação do Curso
• 3ª porta: Chefia do Departamento
• Parede direita, ao lado do extintor: Estúdio 1
No mapa, ícones lilás, azul-claro, azul-escuro e amarelo piscam indicando cada sala.`,
    next: 'terreo_salas_video'
  },
  
  terreo_salas_video: {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1105915322',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'voltar_ou_continuar'
  },

  voltar_ou_continuar: {
    type: 'options',
    message: 'Deseja continuar explorando?',
    options: [
      { label: 'Voltar', next: 'menu_principal_p1' }
    ]
  },
  
  placeholder_1andar: {
    type: 'mapWithVideo',
    message: 'Vamos explorar o 1º andar do prédio.',
    mapSrc: '/lovable-uploads/df2514e5-e85a-49ee-a9ab-5d5dfdc8b5a0.png',
    floorName: '1º Andar',
    next: '1andar_video1'
  },

  '1andar_video1': {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1105915188',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'voltar_ou_continuar_1andar'
  },

  voltar_ou_continuar_1andar: {
    type: 'options',
    message: 'Deseja continuar explorando?',
    options: [
      { label: 'Voltar', next: 'menu_principal_p1' }
    ]
  },
  
  placeholder_2andar: {
    type: 'mapWithVideo',
    message: 'Vamos explorar o 2º andar do prédio.',
    mapSrc: '/lovable-uploads/2ccd559c-d8b6-40cf-9376-4da701cfa6d3.png',
    floorName: '2º Andar',
    next: '2andar_video1'
  },

  '2andar_video1': {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1105915289',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'voltar_ou_continuar_2andar'
  },

  voltar_ou_continuar_2andar: {
    type: 'options',
    message: 'Deseja continuar explorando?',
    options: [
      { label: 'Voltar', next: 'menu_principal_p1' }
    ]
  },
  
  placeholder_3andar: {
    type: 'mapWithVideo',
    message: 'Vamos explorar o 3º andar do prédio.',
    mapSrc: '/lovable-uploads/0ea087c5-d4eb-46e1-a0ea-456bbd600f2c.png',
    floorName: '3º Andar',
    next: '3andar_video'
  },

  '3andar_video': {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1101983923',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'voltar_ou_continuar_3andar'
  },

  voltar_ou_continuar_3andar: {
    type: 'options',
    message: 'Deseja continuar explorando?',
    options: [
      { label: 'Voltar', next: 'menu_principal_p1' }
    ]
  },
  
  placeholder_4andar: {
    type: 'mapWithVideo',
    message: 'Vamos explorar o 4º andar do prédio.',
    mapSrc: '/lovable-uploads/b5573414-7001-4ae1-a18d-8955d2137746.png',
    floorName: '4º Andar',
    next: '4andar_video1'
  },

  '4andar_video1': {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1105915245',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'voltar_ou_continuar_4andar'
  },

  voltar_ou_continuar_4andar: {
    type: 'options',
    message: 'Deseja continuar explorando?',
    options: [
      { label: 'Voltar', next: 'menu_principal_p2' }
    ]
  },
  
  placeholder_banheiros: {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1101984008',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'voltar_ou_continuar_banheiros'
  },

  voltar_ou_continuar_banheiros: {
    type: 'options',
    message: 'Deseja continuar explorando?',
    options: [
      { label: 'Voltar', next: 'menu_principal_p2' }
    ]
  },
  
  placeholder_emergencia: {
    type: 'command',
    command: 'setFloatingAvatarVideo',
    params: {
      url: 'https://vimeo.com/1101983991',
      mute: true,
      controls: false,
      float: true,
      resizable: true
    },
    next: 'voltar_ou_continuar_emergencia'
  },

  voltar_ou_continuar_emergencia: {
    type: 'options',
    message: 'Deseja continuar explorando?',
    options: [
      { label: 'Voltar', next: 'menu_principal_p2' }
    ]
  },
  
  end: {
    type: 'options',
    message: 'Obrigado por explorar o prédio com a Lia. Até a próxima!',
    options: [
      { label: '🔄 Recomeçar', next: 'menu_principal_p1' }
    ]
  }
};

const Chat: React.FC = () => {
  const [currentState, setCurrentState] = useState('start');
  const [messages, setMessages] = useState<Array<{ id: string; message: string; isBot: boolean }>>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [floatingVideoUrl, setFloatingVideoUrl] = useState('https://vimeo.com/1101984042');
  const [currentMap, setCurrentMap] = useState<{ src: string; floorName: string } | null>(null);

  React.useEffect(() => {
    const state = chatFlow[currentState];
    if (state) {
      // Handle mapWithVideo type
      if (state.type === 'mapWithVideo') {
        if (state.message) {
          const messageId = `${currentState}-${Date.now()}`;
          setMessages(prev => [...prev, {
            id: messageId,
            message: state.message,
            isBot: true
          }]);
        }
        
        // Set the map data
        if (state.mapSrc && state.floorName) {
          setCurrentMap({ src: state.mapSrc, floorName: state.floorName });
        }
        
        // Auto-advance after showing map
        setShowOptions(false);
        if (state.next) {
          setTimeout(() => {
            setCurrentState(state.next!);
          }, 2000);
        }
        return;
      }
      
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
        // Handle setFloatingAvatarVideo command
        if (state.command === 'setFloatingAvatarVideo' && state.params?.url) {
          setFloatingVideoUrl(state.params.url);
        }
        // For command types, auto-advance to next state with a small delay to ensure video loads
        setShowOptions(false);
        if (state.next) {
          setTimeout(() => {
            setCurrentState(state.next!);
          }, 500); // Small delay to ensure video updates properly
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
    // Clear messages when button is clicked - only show avatar
    setMessages([]);
    setCurrentMap(null); // Clear current map
    setShowOptions(false);
    setCurrentState(nextState);
  };

  const currentChatState = chatFlow[currentState];

  return (
    <div className="flex flex-col h-screen bg-chat-background">
      {/* Header */}
      <div className="bg-background border-b border-border p-4">
        <h1 className="text-xl font-bold text-foreground">Área de Conversação</h1>
      </div>

      {/* Messages and Maps */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatBubble 
            key={msg.id}
            message={msg.message} 
            isBot={msg.isBot} 
          />
        ))}
        
        {/* Floor Map Display */}
        {currentMap && (
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* Map - Above on mobile, left on desktop */}
            <div className="w-full lg:w-1/2">
              <FloorMap 
                mapSrc={currentMap.src}
                floorName={currentMap.floorName}
              />
            </div>
            
            {/* Avatar space - Below on mobile, right on desktop */}
            <div className="w-full lg:w-1/2">
              <div className="text-sm text-muted-foreground text-center">
                Lia está explicando este andar
              </div>
            </div>
          </div>
        )}
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