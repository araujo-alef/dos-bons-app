import chapterImage from '@/assets/chapter-image.png';

export type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'reflection'; question: string }
  | { type: 'practice'; instruction: string }
  | { type: 'audio'; title: string; duration: string }
  | { type: 'video'; title: string; duration: string };

export type ChapterStatus = 'completed' | 'inProgress' | 'new' | 'upcoming';

export interface ChapterPage {
  id: number;
  type?: 'cover' | 'content' | 'closing';
  blocks: ContentBlock[];
}

export interface Chapter {
  id: number;
  number: string;
  title: string;
  status: ChapterStatus;
  intro?: string;
  blocks?: ContentBlock[];
  pages?: ChapterPage[];
}

export const chapters: Chapter[] = [
  {
    id: 1,
    number: '01',
    title: 'Fundamentos',
    status: 'completed',
    blocks: [
      { type: 'text', content: 'Toda grande transformação começa com a coragem de olhar para o que fundamenta suas escolhas. Neste primeiro passo, não buscaremos respostas prontas, mas sim as perguntas certas.' },
      { type: 'reflection', question: 'O que você tem aceitado em sua vida que não reflete o que você realmente deseja?' }
    ]
  },
  { id: 2, number: '02', title: 'Mentalidade', status: 'completed' },
  { id: 3, number: '03', title: 'Presença', status: 'completed' },
  { id: 4, number: '04', title: 'Comunicação', status: 'completed' },
  { id: 5, number: '05', title: 'Confiança', status: 'completed' },
  {
    id: 6,
    number: '06',
    title: 'Conexão e Presença',
    status: 'inProgress',
    intro: 'Nem todo encontro precisa de palavras. A presença, quando real, já comunica.',
    pages: [
      // 1 — Capa editorial
      { id: 1, type: 'cover', blocks: [] },

      // 2 — O mito da técnica
      {
        id: 2, type: 'content', blocks: [
          { type: 'text', content: 'O maior mito sobre conexão é que ela exige técnica. Existem cursos que prometem ensinar como se conectar com pessoas, como fazer as perguntas certas, como parecer interessante. Mas conexão real não é um conjunto de habilidades sociais. É uma disposição interna — a capacidade de estar genuinamente presente diante de outra pessoa.' },
        ]
      },

      // 3 — Atenção como escassez
      {
        id: 3, type: 'content', blocks: [
          { type: 'text', content: 'Pense na última conversa importante que você teve. Em que parte da conversa sua mente estava realmente lá? Planejando a próxima resposta. Avaliando o que a pessoa disse. Pensando em algo completamente diferente. Estar presente em uma conversa é raro. E exatamente por isso, quando acontece, é inesquecível.' },
        ]
      },

      // 4 — Escuta sem agenda
      {
        id: 4, type: 'content', blocks: [
          { type: 'text', content: 'Quando você está conversando com alguém, onde está sua mente? A maioria das pessoas escuta para responder — não para entender. Essa diferença sutil muda tudo. Escutar para responder é um ato centrado em si mesmo. Escutar para entender é um ato de generosidade.' },
        ]
      },

      // 5 — Reflexão
      {
        id: 5, type: 'content', blocks: [
          { type: 'reflection', question: 'Qual foi a última vez que você teve uma conversa em que se sentiu completamente ouvido? O que estava diferente naquele momento?' }
        ]
      },

      // 6 — Imagem
      {
        id: 6, type: 'content', blocks: [
          { type: 'image', src: chapterImage, alt: 'Caminho solitário e reflexivo' }
        ]
      },

      // 7 — Áudio
      {
        id: 7, type: 'content', blocks: [
          { type: 'audio', title: 'Reflexão do autor: O silêncio na conversa', duration: '03:12' }
        ]
      },

      // 8 — O silêncio
      {
        id: 8, type: 'content', blocks: [
          { type: 'text', content: 'O silêncio muitas vezes é lido como desconforto. Mas é no espaço vazio entre as palavras que a profundidade acontece. As culturas que mais valorizam o silêncio em conversas são as mesmas que mais valorizam o respeito. Não é coincidência.' },
        ]
      },

      // 9 — Profundidade
      {
        id: 9, type: 'content', blocks: [
          { type: 'text', content: 'Conexão não nasce de concordância, mas de honestidade. Quando você se permite discordar com leveza, quando você compartilha algo verdadeiro sem precisar de aprovação, algo acontece: a outra pessoa se sente segura para fazer o mesmo. É assim que conversas se transformam em encontros reais.' },
        ]
      },

      // 10 — Prática
      {
        id: 10, type: 'content', blocks: [
          { type: 'practice', instruction: 'Na próxima conversa importante que tiver hoje, experimente fazer uma pausa de dois segundos antes de responder. Apenas escute, respire, e depois fale. Observe o que muda.' }
        ]
      },

      // 11 — Vídeo
      {
        id: 11, type: 'content', blocks: [
          { type: 'video', title: 'Veja isso na prática', duration: '08:45' }
        ]
      },

      // 12 — Encerramento
      { id: 12, type: 'closing', blocks: [] },
    ]
  },
  { id: 7, number: '07', title: 'A Arte da Conexão', status: 'new' },
  { id: 8, number: '08', title: 'Próximo capítulo', status: 'upcoming' },
];

export const ecosystemProducts = [
  { id: 'comunidade', name: 'Comunidade', available: true },
  { id: 'mentorias', name: 'Mentorias', available: true },
  { id: 'ia-conversas', name: 'IA de Conversas', available: false },
];
