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
    type: 'options',
    avatar: 'lia',
    message: 'Olá! Eu sou a Lia e posso te ajudar com dúvidas frequentes do IFCE Campus Fortaleza. Escolha uma opção abaixo.',
    options: [
      { label: 'Sou novato(a)', next: 'novato_inicio' },
      { label: 'Plataformas e acessos', next: 'plataformas_inicio' }
    ]
  },

  novato_inicio: {
    type: 'options',
    message: 'Se você está chegando agora, eu posso te ajudar com os primeiros acessos e orientações iniciais.',
    options: [
      { label: 'Matrícula de ingressante', next: 'novato_matricula' },
      { label: 'Acessar sistemas', next: 'novato_sistemas' },
      { label: 'Ver cursos do campus', next: 'novato_cursos' },
      { label: 'Ver calendário acadêmico', next: 'novato_calendario' },
      { label: 'Voltar ao início', next: 'start' }
    ]
  },

  novato_matricula: {
    type: 'options',
    message: `Aqui você vai encontrar datas, prazos e orientações gerais sobre matrícula no calendário acadêmico:
https://portal.ifce.edu.br/campus/fortaleza/estudante/calendario-academico/

Se quiser ver informações gerais para estudantes, acesse a página do estudante:
https://portal.ifce.edu.br/campus/fortaleza/estudante/

Se precisar falar com o setor responsável, a CCA atende em cca.fortal@ifce.edu.br e pelos telefones (85) 3455-3073 | (85) 3307-3660 | (85) 3307-3661.`,
    options: [{ label: 'Voltar ao início', next: 'start' }]
  },

  novato_sistemas: {
    type: 'options',
    message: `Aqui estão os principais acessos para começar:
Q-Acadêmico para matrícula, notas, histórico e horário:
https://antigo.qacademico.ifce.edu.br/qacademico/index.asp?t=1001
SUAP para serviços institucionais:
https://suap.ifce.edu.br/
Tutorial do e-mail institucional:
https://portal.ifce.edu.br/documents/19254/FOR_Documento_tutorial_de_como_criar_e_acessar_o_email_institucional_no_SUAP.pdf
Página de sistemas do IFCE com outros acessos:
https://portal.ifce.edu.br/sistemas/`,
    options: [{ label: 'Voltar ao início', next: 'start' }]
  },

  novato_cursos: {
    type: 'options',
    message: `Aqui você vai encontrar a lista oficial de cursos do IFCE Campus Fortaleza:
https://portal.ifce.edu.br/cursos/buscar/?campus=fortaleza

Se quiser consultar a pós-graduação, acesse:
https://portal.ifce.edu.br/campus/fortaleza/pesquisa-remover/pos-graduacao/`,
    options: [{ label: 'Voltar ao início', next: 'start' }]
  },

  novato_calendario: {
    type: 'options',
    message: `Aqui você vai encontrar as datas importantes do semestre no calendário acadêmico oficial:
https://portal.ifce.edu.br/campus/fortaleza/estudante/calendario-academico/`,
    options: [{ label: 'Voltar ao início', next: 'start' }]
  },

  plataformas_inicio: {
    type: 'options',
    message: 'Essas são as principais plataformas do IFCE para a vida acadêmica. Escolha uma opção.',
    options: [
      { label: 'Q-Acadêmico', next: 'plataformas_qacademico' },
      { label: 'SUAP', next: 'plataformas_suap' },
      { label: 'E-mail institucional', next: 'plataformas_email' },
      { label: 'Moodle e sistemas', next: 'plataformas_moodle' },
      { label: 'SisAE', next: 'plataformas_sisae' },
      { label: 'Voltar ao início', next: 'start' }
    ]
  },

  plataformas_qacademico: {
    type: 'options',
    message: `Aqui você vai encontrar o Q-Acadêmico, usado para matrícula, notas, histórico e horário:
https://antigo.qacademico.ifce.edu.br/qacademico/index.asp?t=1001`,
    options: [{ label: 'Voltar ao início', next: 'start' }]
  },

  plataformas_suap: {
    type: 'options',
    message: `Aqui você vai encontrar o SUAP, usado para serviços institucionais:
https://suap.ifce.edu.br/`,
    options: [{ label: 'Voltar ao início', next: 'start' }]
  },

  plataformas_email: {
    type: 'options',
    message: `Aqui você vai encontrar o tutorial oficial para criar e acessar o e-mail institucional:
https://portal.ifce.edu.br/documents/19254/FOR_Documento_tutorial_de_como_criar_e_acessar_o_email_institucional_no_SUAP.pdf
Se precisar acessar o sistema base, use o SUAP:
https://suap.ifce.edu.br/
Se houver problema técnico, o suporte atende em cti.fortaleza@ifce.edu.br.`,
    options: [{ label: 'Voltar ao início', next: 'start' }]
  },

  plataformas_moodle: {
    type: 'options',
    message: `Aqui você vai encontrar a página oficial de sistemas do IFCE, com os principais ambientes e acessos acadêmicos:
https://portal.ifce.edu.br/sistemas/`,
    options: [{ label: 'Voltar ao início', next: 'start' }]
  },

  plataformas_sisae: {
    type: 'options',
    message: `Aqui você vai encontrar o SisAE, sistema relacionado à assistência estudantil:
https://sisae.ifce.edu.br/`,
    options: [{ label: 'Voltar ao início', next: 'start' }]
  }
};

const Chat: React.FC = () => {
  const [currentState, setCurrentState] = useState('start');
  const [messages, setMessages] = useState<Array<{ id: string; message: string; isBot: boolean }>>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [floatingVideoUrl, setFloatingVideoUrl] = useState('https://vimeo.com/1129591813');
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const mapImageSrc = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return `${import.meta.env.BASE_URL ?? '/'}lovable-uploads/IFCE.jpg`;
    }

    try {
      return new URL('lovable-uploads/IFCE.jpg', `${window.location.origin}${window.location.pathname}`).toString();
    } catch (error) {
      console.error('Erro ao resolver caminho do mapa:', error);
      return `${import.meta.env.BASE_URL ?? '/'}lovable-uploads/IFCE.jpg`;
    }
  }, []);

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

  React.useEffect(() => {
    if (!isMapExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMapExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapExpanded]);

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
          <button
            type="button"
            onClick={() => setIsMapExpanded(true)}
            className="w-full max-w-md mx-auto block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Ampliar mapa do IFCE"
          >
            <img
              src={mapImageSrc}
              alt="Mapa do IFCE"
              className="w-full rounded-lg shadow cursor-zoom-in"
            />
          </button>
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

      {isMapExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsMapExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada do mapa do IFCE"
        >
          <div
            className="relative max-h-full max-w-5xl w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsMapExpanded(false)}
              className="absolute top-4 right-4 px-4 py-2 rounded-full border border-white/30 bg-white/10 text-white text-sm font-medium backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Fechar
            </button>
            <img
              src={mapImageSrc}
              alt="Mapa do IFCE ampliado"
              className="w-full h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
