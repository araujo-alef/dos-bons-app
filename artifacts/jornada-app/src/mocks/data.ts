import chapterImage from '@/assets/chapter-image.png';

export type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'reflection'; question: string }
  | { type: 'practice'; instruction: string }
  | { type: 'audio'; title: string; duration: string }
  | { type: 'video'; title: string; duration: string };

export type ChapterStatus = 'completed' | 'inProgress' | 'new' | 'upcoming';

export interface Chapter {
  id: number;
  number: string;
  title: string;
  status: ChapterStatus;
  blocks?: ContentBlock[];
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
    blocks: [
      { type: 'text', content: 'O maior mito sobre conexão é que ela exige técnica. A verdadeira conexão exige algo muito mais escasso: atenção plena e ausência de julgamento.' },
      { type: 'text', content: 'Quando você está conversando com alguém, onde está sua mente? Planejando a próxima resposta ou realmente absorvendo o que o outro diz?' },
      { type: 'image', src: chapterImage, alt: 'Caminho solitário e reflexivo' },
      { type: 'audio', title: 'Reflexão do autor: O silêncio na conversa', duration: '03:12' },
      { type: 'text', content: 'O silêncio muitas vezes é lido como desconforto. Mas é no espaço vazio entre as palavras que a profundidade acontece.' },
      { type: 'reflection', question: 'Qual foi a última vez que você sustentou o silêncio sem sentir a necessidade de preenchê-lo com palavras vazias?' },
      { type: 'practice', instruction: 'Na próxima conversa importante que tiver hoje, experimente fazer uma pausa de dois segundos antes de responder. Apenas escute, respire, e depois fale.' },
      { type: 'video', title: 'Veja isso na prática', duration: '08:45' }
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
