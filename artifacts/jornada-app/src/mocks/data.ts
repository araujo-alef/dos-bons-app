export type ContentBlock =
  | { type: 'text'; content: string; /** Centers the block vertically and horizontally on the page — for short standalone lines. */ center?: boolean }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'reflection'; question: string }
  | { type: 'practice'; instruction: string }
  | { type: 'audio'; title: string; duration: string }
  | { type: 'video'; title: string; duration: string };

export type LessonStatus = 'completed' | 'inProgress' | 'new' | 'upcoming';

export interface LessonPage {
  id: number;
  type?: 'cover' | 'content' | 'closing';
  blocks: ContentBlock[];
}

export interface Lesson {
  id: number;
  number: string;
  title: string;
  status: LessonStatus;
  intro?: string;
  blocks?: ContentBlock[];
  pages?: LessonPage[];
}

// Add real lessons here following the shape above (Lesson, LessonPage,
// ContentBlock). Lessons with a `pages` array use the full BookReader
// experience; lessons with only `blocks` fall back to the simple scroll
// reader in Lesson.tsx.
export const lessons: Lesson[] = [
  {
    id: 1,
    number: '01',
    title: 'Pare de tentar sair da friendzone. Aprenda a usá-la.',
    status: 'inProgress',
    intro: 'Todo cara quer sair da friendzone. Eu vou te ensinar a entrar nela de propósito.',
    pages: [
      // 1 — Capa editorial
      { id: 1, type: 'cover', blocks: [] },

      // 2 — Abertura + a história pessoal + o insight central
      {
        id: 2, type: 'content', blocks: [
          { type: 'text', content: 'Calma. Me deixa explicar.' },
          { type: 'text', content: 'Quando eu era mais novo, me matava tentando ficar com as mulheres mais bonitas. Gastava energia, gastava dinheiro, me esforçava muito. E sabe o que acontecia? Ela dava uns beijinhos e ia embora pro cara mais bonito.' },
          { type: 'text', content: 'Foi quando eu entendi uma coisa sobre como a cabeça feminina funciona.' },
          { type: 'text', content: 'Mulher se compara.' },
          { type: 'text', content: 'E mulher vai atrás de homem que já foi escolhido por outra mulher.' },
        ]
      },

      // 3 — Explicação do mecanismo + nomeando o conceito
      {
        id: 3, type: 'content', blocks: [
          { type: 'text', content: 'Você já viu notícia de mulher ficando com homem casado e ficou sem entender por quê? Eu vou te explicar. Quando um homem está com uma mulher, ele já passou por um processo de seleção. Outra mulher já o escolheu. Ele já está aprovado. Então em vez de procurar do zero, muitas mulheres vão atrás de quem já está acompanhado.' },
          { type: 'text', content: 'Isso tem nome. Se chama pré-seleção feminina.' },
          { type: 'text', content: 'E você pode usar isso a seu favor — sem precisar estar num relacionamento de verdade.' },
          { type: 'text', content: 'Como?' },
          { type: 'text', content: 'Simples.' },
        ]
      },

      // 4 — Chegar como amigo + como postar
      {
        id: 4, type: 'content', blocks: [
          { type: 'text', content: 'Para de tentar ficar com a mulher bonita logo de cara. Chega como amigo. Sem pressão, sem intenção aparente. Faz rolê com ela, viaja junto, tira foto junto.' },
          { type: 'text', content: 'E posta.' },
          { type: 'text', content: 'Sem marcar ela. Sem legenda explicando quem é. Só você vivendo sua vida, com uma mulher bonita do lado.' },
          { type: 'text', content: 'As outras vão ver e pensar: que que esse cara tem?' },
        ]
      },

      // 5 — Por que funciona + curiosidade + a lição
      {
        id: 5, type: 'content', blocks: [
          { type: 'text', content: 'Funciona ainda mais se você não for o cara mais bonito da sala. Porque aí elas não conseguem explicar. Se você fosse bonito, seria fácil. Mas você não é — e mesmo assim está ali com ela. Isso ativa um gatilho poderoso: a curiosidade.' },
          { type: 'text', content: 'E curiosidade vira atração.' },
          { type: 'text', content: 'Usa ela também pra comentar nas suas fotos. Pede pra ela elogiar você numa publicação. Natural, sem forçar. Quando as outras mulheres veem uma mulher bonita te elogiando, seu valor social sobe na cabeça delas sem você precisar fazer nada.' },
          { type: 'text', content: 'A lição:' },
          { type: 'text', content: 'Friendzone não é derrota.' },
          { type: 'text', content: 'É uma ferramenta.' },
        ]
      },
    ]
  },
  {
    id: 2,
    number: '02',
    title: 'O cara das flores',
    status: 'new',
    intro: 'Você já viu uma mulher postar um buquê de flores no Instagram sem marcar quem deu? Pois é.',
    pages: [
      // 1 — Capa editorial
      { id: 1, type: 'cover', blocks: [] },

      // 2 — A virada: não foi gratidão, foi isca
      {
        id: 2, type: 'content', blocks: [
          { type: 'text', content: 'Se ela não marcou, não foi gratidão.' },
          { type: 'text', content: 'Foi isca.' },
          { type: 'text', content: 'Ela está usando as flores de um cara pra chamar atenção de outro.' },
          { type: 'text', content: 'O cara que ela realmente quer — aquele que faz ela perder o sono — nunca mandaria flores.' },
        ]
      },

      // 3 — Por que não + o que presente cria de verdade
      {
        id: 3, type: 'content', blocks: [
          { type: 'text', content: 'Não porque é grosseiro.' },
          { type: 'text', content: 'Porque ele entende que o jogo não se joga assim.' },
          { type: 'text', content: 'Ele sabe que presente, agrado e bajulação não criam desejo.' },
          { type: 'text', content: 'Criam dívida.' },
          { type: 'text', content: 'E ninguém se apaixona por quem deve favor.' },
        ]
      },

      // 4 — A crença do cara das flores + o twist + o Cachorro dos Bons + a lição
      {
        id: 4, type: 'content', blocks: [
          { type: 'text', content: 'O cara das flores acha que se fizer todas as vontades dela, vai ter resultado.' },
          { type: 'text', content: 'Vai ter.' },
          { type: 'text', content: 'Só que o resultado é ela te ligar quando precisar de alguma coisa.' },
          { type: 'text', content: 'O Cachorro dos Bons não corre atrás com presente na mão.' },
          { type: 'text', content: 'Ele existe de um jeito que ela quer correr atrás dele.' },
          { type: 'text', content: 'A lição:' },
          { type: 'text', content: 'Pare de tentar impressionar.' },
          { type: 'text', content: 'Comece a ser interessante.' },
        ]
      },
    ]
  },
  {
    id: 3,
    number: '03',
    title: 'Nunca bata de frente com mulher pilantra. Vire sócio dela.',
    status: 'new',
    intro: 'Todo cara que já cruzou com uma mulher pilantra fez a mesma coisa. Tentou vencer o jogo dela. E perdeu.',
    pages: [
      // 1 — Capa editorial
      { id: 1, type: 'cover', blocks: [] },

      // 2 — Por que o jogo é perdido de saída
      {
        id: 2, type: 'content', blocks: [
          { type: 'text', content: 'Porque o jogo dela foi construído pra você perder.' },
          { type: 'text', content: 'Ela é boa nisso. Muito boa. Sabe provocar, sabe manipular, sabe fazer você gastar energia tentando provar que é mais esperto.' },
          { type: 'text', content: 'E enquanto você tenta ganhar, ela já está três jogadas na frente.' },
        ]
      },

      // 3 — A história pessoal começa
      {
        id: 3, type: 'content', blocks: [
          { type: 'text', content: 'Eu aprendi isso com uma loira que era de outro nível de lábia.' },
          { type: 'text', content: 'Linda. Esperta. Pilantra de carteirinha.' },
          { type: 'text', content: 'Fiquei com ela. Mas logo vi que ela queria sempre sair por cima — ficava me provocando, falava de outros caras, tentava ganhar de mim no emocional.' },
        ]
      },

      // 4 — A escolha + a virada de estratégia + a fala
      {
        id: 4, type: 'content', blocks: [
          { type: 'text', content: 'Eu podia continuar tentando ganhar dela.' },
          { type: 'text', content: 'Mas ia gastar energia que não compensava.' },
          { type: 'text', content: 'Então fiz o oposto do que ela esperava.' },
          { type: 'text', content: 'Elogiei o jogo dela.' },
          { type: 'text', content: 'Falei: cara, você é boa nisso. Sério. Vi o que você fez com aquele cara ali.' },
        ]
      },

      // 5 — A reação dela + a proposta
      {
        id: 5, type: 'content', blocks: [
          { type: 'text', content: 'Ela ficou sem saber o que fazer com isso.' },
          { type: 'text', content: 'Aí propus: e se a gente fosse parceiro em vez de adversário?' },
          { type: 'text', content: 'Virou a melhor parceria que já tive.' },
        ]
      },

      // 6 — O que ela trazia + o payoff
      {
        id: 6, type: 'content', blocks: [
          { type: 'text', content: 'Ia pra festa com ela. Ela era linda, conhecia todo mundo, tinha acesso a tudo.' },
          { type: 'text', content: 'Enquanto os outros caras brigavam pela atenção dela e comiam na mão dela, eu ia de graça nos melhores camarotes, bebia sem pagar nada e ainda saía com a presença social mais forte do ambiente.' },
          { type: 'text', content: 'Porque aparecer com uma mulher desse nível ao lado vale mais do que qualquer cantada.' },
        ]
      },

      // 7 — A lição (o porquê)
      {
        id: 7, type: 'content', blocks: [
          { type: 'text', content: 'A lição é essa:' },
          { type: 'text', content: 'Com mulher pilantra, batalha impossível não compensa.' },
          { type: 'text', content: 'Ela vai ser pilantra com homem que quer algo dela.' },
          { type: 'text', content: 'Com amigo ela não tem motivo pra isso.' },
          { type: 'text', content: 'Então para de tentar ganhar dela no jogo que ela criou.' },
        ]
      },

      // 8 — A lição (a ação) + o resultado final
      {
        id: 8, type: 'content', blocks: [
          { type: 'text', content: 'Muda as regras.' },
          { type: 'text', content: 'Vira sócio.' },
          { type: 'text', content: 'E enquanto os outros perdem energia tentando vencê-la, você aproveita tudo que ela abre de porta — sem pagar nada por isso.' },
        ]
      },
    ]
  },
  {
    id: 4,
    number: '04',
    title: 'Água no deserto',
    status: 'new',
    intro: 'Sabe por que você fica destruído quando leva um fora? Porque você chegou com sede.',
    pages: [
      { id: 1, type: 'cover', blocks: [] },

      // 2 — A metáfora da água
      {
        id: 2, type: 'content', blocks: [
          { type: 'text', content: 'Pensa assim.' },
          { type: 'text', content: 'Você tem uma garrafa cheia de água na mão. Escorrega um pouquinho no chão. O que você faz?' },
          { type: 'text', content: 'Nada. Nem olha pro lado. Você tem água de sobra.' },
          { type: 'text', content: 'Agora imagina a mesma cena no deserto. Aquela era sua última água. Você precisava daquela água pra sobreviver.' },
          { type: 'text', content: 'Deixa cair.' },
          { type: 'text', content: 'Entra em desespero.' },
        ]
      },

      // 3 — A metáfora vira real
      {
        id: 3, type: 'content', blocks: [
          { type: 'text', content: 'É exatamente isso que acontece quando você chega numa mulher precisando da aprovação dela.' },
          { type: 'text', content: 'Você não está chegando nela.' },
          { type: 'text', content: 'Você está chegando na sua última água.' },
          { type: 'text', content: 'E ela sente isso antes de você abrir a boca. Na postura. No tom de voz. No jeito que você olha esperando uma resposta boa.' },
          { type: 'text', content: 'Você chega encolhido, com medo, com energia de quem depende daquilo.' },
          { type: 'text', content: 'E quem depende de algo implora por ele — mesmo sem perceber.' },
        ]
      },

      // 4 — O Cachorro dos Bons chega diferente
      {
        id: 4, type: 'content', blocks: [
          { type: 'text', content: 'O Cachorro dos Bons chega diferente.' },
          { type: 'text', content: 'Não porque é mais bonito. Não porque tem mais dinheiro.' },
          { type: 'text', content: 'Porque tem água de sobra.' },
          { type: 'text', content: 'Chega sabendo que se ela não quiser, tem outras. Não como arrogância. Como realidade.' },
          { type: 'text', content: 'E quando você tem essa realidade — ou age como se tivesse — tudo muda.' },
          { type: 'text', content: 'A postura muda. O tom muda. O resultado muda.' },
        ]
      },

      // 5 — Quando ela dá um fora, o jeito comum
      {
        id: 5, type: 'content', blocks: [
          { type: 'text', content: 'E quando ela te dá um fora?' },
          { type: 'text', content: 'O cara comum pergunta por quê. Implora por uma explicação. Fica triste na frente dela.' },
          { type: 'text', content: 'Está pedindo pra saber o motivo da própria rejeição.' },
          { type: 'text', content: 'Sabe o que isso comunica?' },
          { type: 'text', content: 'Que você precisava tanto daquela aprovação que agora está implorando até pelo fora.' },
        ]
      },

      // 6 — O jeito do Cachorro dos Bons
      {
        id: 6, type: 'content', blocks: [
          { type: 'text', content: 'O Cachorro dos Bons ri.' },
          { type: 'text', content: 'Não de falsidade. De verdade mesmo.' },
          { type: 'text', content: 'Porque pra quem tem água de sobra, um pouquinho que escorregou não muda nada.' },
          { type: 'text', content: 'Você pode virar pra ela e falar com bom humor:' },
          { type: 'text', content: '"Tu tem coragem hein. Bom rolê pra você."' },
          { type: 'text', content: 'Ou simplesmente:' },
          { type: 'text', content: '"Que isso, boa festa."' },
          { type: 'text', content: 'E sair andando sem olhar pra trás.' },
        ]
      },

      // 7 — O que ela pensa + a lição
      {
        id: 7, type: 'content', blocks: [
          { type: 'text', content: 'Sabe o que ela pensa?' },
          { type: 'text', content: 'Que que esse cara tem? Não mudou nada nele.' },
          { type: 'text', content: 'E curiosidade é o começo de tudo.' },
          { type: 'text', content: 'A lição:' },
          { type: 'text', content: 'Rejeição só dói em quem estava com sede.' },
          { type: 'text', content: 'Multiplica suas opções e você para de implorar aprovação — porque para de precisar dela.' },
        ]
      },
    ]
  },
  {
    id: 5,
    number: '05',
    title: 'Ela não está no pedestal. Você que colocou ela lá.',
    status: 'new',
    intro: 'Deixa eu te contar um segredo sobre mulher bonita.',
    pages: [
      { id: 1, type: 'cover', blocks: [] },

      // 2 — Ela é humana
      {
        id: 2, type: 'content', blocks: [
          { type: 'text', content: 'Ela acorda.' },
          { type: 'text', content: 'Joga água no rosto.' },
          { type: 'text', content: 'Olha no espelho sem maquiagem.' },
          { type: 'text', content: 'E às vezes ela mesma não gosta do que vê.' },
          { type: 'text', content: 'Ela tem insegurança. Ela tem dia ruim. Ela tem autoestima que oscila igual a de qualquer pessoa.' },
          { type: 'text', content: 'A diferença é que você nunca viu isso.' },
          { type: 'text', content: 'Porque ficou longe demais dela pra enxergar.' },
        ]
      },

      // 3 — O pedestal
      {
        id: 3, type: 'content', blocks: [
          { type: 'text', content: 'O pedestal que você colocou ela é o maior obstáculo entre você e ela.' },
          { type: 'text', content: 'Não a aparência dela. Não o dinheiro que você tem. Não a sua altura.' },
          { type: 'text', content: 'O pedestal.' },
          { type: 'text', content: 'Porque quando você coloca alguém lá em cima, você automaticamente se coloca lá embaixo.' },
          { type: 'text', content: 'E aí você chega diferente. Fala diferente. Age diferente.' },
          { type: 'text', content: 'Age como alguém que não merece estar ali.' },
          { type: 'text', content: 'E ela sente.' },
        ]
      },

      // 4 — O exercício mental
      {
        id: 4, type: 'content', blocks: [
          { type: 'text', content: 'Aqui está o exercício mental que muda tudo:' },
          { type: 'text', content: 'Antes de chegar nela, pensa assim:' },
          { type: 'text', content: 'Essa menina sem maquiagem provavelmente é mais feia do que eu.' },
          { type: 'text', content: 'Ela acorda igual a todo mundo. Ela tem defeito. Ela também quer ser notada, também quer atenção, também tem medo de não ser suficiente.' },
          { type: 'text', content: 'Ela é uma pessoa normal.' },
          { type: 'text', content: 'Normal.' },
          { type: 'text', content: 'Sabe o que acontece quando você trata ela como pessoa normal?' },
          { type: 'text', content: 'Ela te respeita.' },
        ]
      },

      // 5 — O contraste com os outros caras + a analogia do dinheiro
      {
        id: 5, type: 'content', blocks: [
          { type: 'text', content: 'Porque noventa por cento dos caras chegam babando, nervoso, tratando ela como se fosse rara.' },
          { type: 'text', content: 'E você chegou como quem já está acostumado.' },
          { type: 'text', content: 'Como quem já tem.' },
          { type: 'text', content: 'Pensa assim.' },
          { type: 'text', content: 'Se eu te oferecesse um salário de um milhão por mês hoje, você saberia administrar?' },
          { type: 'text', content: 'De verdade?' },
          { type: 'text', content: 'Você tem um plano pra esse dinheiro? Sabe como multiplicar? Sabe como não perder tudo em seis meses?' },
          { type: 'text', content: 'Provavelmente não.' },
          { type: 'text', content: 'Porque sua cabeça ainda não está preparada pra aquilo.' },
        ]
      },

      // 6 — A analogia aplicada + a preparação
      {
        id: 6, type: 'content', blocks: [
          { type: 'text', content: 'Com mulher bonita é a mesma coisa.' },
          { type: 'text', content: 'Se você ainda treme quando chega nela, sua cabeça não está pronta pra administrar uma.' },
          { type: 'text', content: 'E ela percebe isso antes de você abrir a boca.' },
          { type: 'text', content: 'Então o trabalho não é tentar parecer confiante.' },
          { type: 'text', content: 'É se preparar mentalmente até a mulher bonita virar normal pra você.' },
          { type: 'text', content: 'Faça amizade com elas. Conviva. Veja sem maquiagem, veja com dia ruim, veja chata, veja humana.' },
          { type: 'text', content: 'Quando ela virar normal, você para de agir como quem não merece.' },
          { type: 'text', content: 'E aí o jogo muda.' },
        ]
      },

      // 7 — A lição
      {
        id: 7, type: 'content', blocks: [
          { type: 'text', content: 'A lição:' },
          { type: 'text', content: 'Quanto mais você tira ela do pedestal e trata ela como gente, mais ela te respeita.' },
          { type: 'text', content: 'Trate o extraordinário como ordinário.' },
        ]
      },
    ]
  },
  {
    id: 6,
    number: '06',
    title: 'Ela quer carinho. Só não do cara que dá carinho.',
    status: 'new',
    intro: 'Toda mulher diz que quer um cara fofo. Atencioso. Presente. Que mande bom dia. Que faça surpresa. Que seja tudo que os filmes ensinaram você a ser.',
    pages: [
      { id: 1, type: 'cover', blocks: [] },

      // 2 — A contradição
      {
        id: 2, type: 'content', blocks: [
          { type: 'text', content: 'E você acreditou.' },
          { type: 'text', content: 'Se tornou esse cara.' },
          { type: 'text', content: 'E perdeu ela pra quem não era nada disso.' },
          { type: 'text', content: 'Aqui está a contradição que ninguém explica:' },
          { type: 'text', content: 'Ela quer carinho.' },
          { type: 'text', content: 'Mas não do cara que fica dando carinho o tempo inteiro.' },
        ]
      },

      // 3 — A lei da escassez
      {
        id: 3, type: 'content', blocks: [
          { type: 'text', content: 'Porque carinho de quem nunca falta perde o valor.' },
          { type: 'text', content: 'É lei básica de escassez — o que é abundante não é valorizado.' },
          { type: 'text', content: 'Quando você está sempre disponível, sempre atencioso, sempre com aquela voz de cachorrinho molhado pedindo aprovação — você deixou de ser desejo e virou obrigação.' },
          { type: 'text', content: 'E ninguém corre atrás do que já está garantido.' },
        ]
      },

      // 4 — O que ela quer sentir de verdade
      {
        id: 4, type: 'content', blocks: [
          { type: 'text', content: 'O que ela realmente quer sentir não é carinho.' },
          { type: 'text', content: 'É o medo de te perder.' },
          { type: 'text', content: 'Esse frio na barriga de não saber se você vai ficar.' },
          { type: 'text', content: 'Essa dúvida de se ela é especial pra você ou se você tem outras opções.' },
          { type: 'text', content: 'Adrenalina.' },
          { type: 'text', content: 'E adrenalina não vem de quem está sempre lá, fazendo tudo certo, esperando ser recompensado.' },
          { type: 'text', content: 'Vem de quem ela não consegue decifrar.' },
        ]
      },

      // 5 — O erro fatal
      {
        id: 5, type: 'content', blocks: [
          { type: 'text', content: 'O dia que ela pensar que você come na mão dela — que você deita e rola, que ela é o ápice da sua vida e que você não seria capaz de ficar com mais ninguém — você perdeu.' },
          { type: 'text', content: 'Perdeu duas vezes.' },
          { type: 'text', content: 'Perdeu ela. E perdeu o respeito dela.' },
        ]
      },

      // 6 — Como eu trato
      {
        id: 6, type: 'content', blocks: [
          { type: 'text', content: 'Eu trato ela como brother.' },
          { type: 'text', content: 'Suave. Natural. Às vezes flerto de leve. De repente estou flertando com outra também.' },
          { type: 'text', content: 'E o que mais escuto é: você é cachorro.' },
          { type: 'text', content: 'E o que mais respondo é: é mesmo.' },
          { type: 'text', content: 'Com convicção. Sem pedir desculpa por isso.' },
          { type: 'text', content: 'Porque quem quer um cara bonzinho que faz tudo tem vários lá fora.' },
          { type: 'text', content: 'Diversão é aqui.' },
        ]
      },

      // 7 — O que acontece depois
      {
        id: 7, type: 'content', blocks: [
          { type: 'text', content: 'E sabe o que acontece depois?' },
          { type: 'text', content: 'Quando ela já está com adrenalina, quando ela já não sabe direito onde te encaixa — ela deita, pega sua mão, faz carinho em você.' },
          { type: 'text', content: 'Quer aquele momento de afeto.' },
          { type: 'text', content: 'Mas quer de você.' },
          { type: 'text', content: 'Não do cara fofo que nunca faltou.' },
          { type: 'text', content: 'Do cara que poderia não ter ficado.' },
        ]
      },

      // 8 — A lição
      {
        id: 8, type: 'content', blocks: [
          { type: 'text', content: 'Esse é o carinho que ela valoriza.' },
          { type: 'text', content: 'O que foi conquistado — não o que foi servido de bandeja.' },
          { type: 'text', content: 'A lição:' },
          { type: 'text', content: 'Não seja o cara que nunca falta.' },
          { type: 'text', content: 'Seja o cara que ela tem medo de perder.' },
        ]
      },
    ]
  },
  {
    id: 7,
    number: '07',
    title: 'O mundo é injusto. Nivela seu jogo.',
    status: 'new',
    intro: 'Deixa eu te perguntar uma coisa. Você acha que ela joga limpo?',
    pages: [
      { id: 1, type: 'cover', blocks: [] },

      // 2 — Ela chega preparada, você não
      {
        id: 2, type: 'content', blocks: [
          { type: 'text', content: 'Ela acorda duas horas antes de sair pra se arrumar. Escolhe a roupa que vai fazer você perder o foco. Coloca maquiagem que esconde os defeitos e destaca o que ela quer destacar. Alinha com as amigas como vai se portar na festa. Já chegou organizada, preparada, com estratégia.' },
          { type: 'text', content: 'E você chegou de jeans e camiseta achando que vai jogar um jogo justo.' },
          { type: 'text', content: 'Não vai.' },
          { type: 'text', content: 'O jogo nunca foi justo.' },
          { type: 'text', content: 'E ficar esperando ele ser justo é a coisa mais ingênua que você pode fazer.' },
        ]
      },

      // 3 — O aplicativo
      {
        id: 3, type: 'content', blocks: [
          { type: 'text', content: 'Eu criei um aplicativo.' },
          { type: 'text', content: 'Chama Lábia de Cachorro.' },
          { type: 'text', content: 'Você tira print do story dela, sobe no app, e ele te dá a resposta pronta. Personalizada. Com contexto. Como se fosse você — só que sem você precisar gastar energia pensando.' },
          { type: 'text', content: 'Muita gente me perguntou: pra que isso? Você não tem lábia?' },
          { type: 'text', content: 'Tenho. Mais do que a maioria.' },
          { type: 'text', content: 'Mas hoje eu tenho mais de três mil mulheres nas minhas listas. Tinder, Instagram, festas. São opções boas, em volume que eu não consigo dar conta sozinho.' },
          { type: 'text', content: 'Haja tempo. Haja gasolina.' },
        ]
      },

      // 4 — Por que uso ferramenta
      {
        id: 4, type: 'content', blocks: [
          { type: 'text', content: 'Então eu usei ferramenta.' },
          { type: 'text', content: 'Não porque não sei conversar.' },
          { type: 'text', content: 'Porque sou inteligente o suficiente pra não gastar energia onde não preciso.' },
          { type: 'text', content: 'Essa é a lição.' },
          { type: 'text', content: 'Você não precisa ser o melhor em tudo.' },
          { type: 'text', content: 'Precisa ser inteligente o suficiente pra usar o que está disponível.' },
        ]
      },

      // 5 — Use o que está disponível
      {
        id: 5, type: 'content', blocks: [
          { type: 'text', content: 'Comunidade que nivela seu jogo — usa.' },
          { type: 'text', content: 'Aplicativo que responde por você — usa.' },
          { type: 'text', content: 'Técnica que funciona — usa antes, não depois.' },
          { type: 'text', content: 'O erro que mais vejo é o cara guardar o melhor pra depois.' },
          { type: 'text', content: 'Fica jogando limpo esperando o momento certo.' },
          { type: 'text', content: 'Enquanto isso ela já está três passos na frente — aparência, comunidade, estratégia.' },
        ]
      },

      // 6 — O nivelamento
      {
        id: 6, type: 'content', blocks: [
          { type: 'text', content: 'No mundo injusto, quem joga justo chega por último.' },
          { type: 'text', content: 'Sabe qual é a diferença entre você e ela hoje?' },
          { type: 'text', content: 'Ela já nivelou o jogo dela faz tempo.' },
          { type: 'text', content: 'Esse livro é o seu nivelamento.' },
          { type: 'text', content: 'Usa tudo que está aqui.' },
          { type: 'text', content: 'Usa antes que precise.' },
          { type: 'text', content: 'Porque no campo onde ela já chegou preparada, você não pode se dar ao luxo de improvisar.' },
        ]
      },
    ]
  },
  {
    id: 8,
    number: '08',
    title: 'Ela não quer jantar. Ela quer adrenalina.',
    status: 'new',
    intro: 'Você pode levar ela no melhor restaurante da cidade. Mesa reservada. Vinho caro. Garçom de terno.',
    pages: [
      { id: 1, type: 'cover', blocks: [] },

      // 2 — Jantar não cria desejo
      {
        id: 2, type: 'content', blocks: [
          { type: 'text', content: 'E ela vai agradecer, vai sorrir, vai postar no story.' },
          { type: 'text', content: 'E vai dar pra outro.' },
          { type: 'text', content: 'Porque jantar não cria desejo.' },
          { type: 'text', content: 'Cria obrigação social.' },
          { type: 'text', content: 'E obrigação não vira atração.' },
          { type: 'text', content: 'A maioria das meninas não quer ficar uma hora te vendo comer de boca aberta na frente dela.' },
        ]
      },

      // 3 — O que ela quer + a aposta
      {
        id: 3, type: 'content', blocks: [
          { type: 'text', content: 'Ela quer se divertir.' },
          { type: 'text', content: 'Quer sentir adrenalina.' },
          { type: 'text', content: 'Quer um cara que vira um desafio — que ela precise ganhar, que ela precise provar alguma coisa.' },
          { type: 'text', content: 'Então para de gastar dinheiro tentando impressionar.' },
          { type: 'text', content: 'Chama ela pra jogar sinuca.' },
          { type: 'text', content: 'Chama ela pra jogar boliche.' },
          { type: 'text', content: 'Cria uma aposta.' },
        ]
      },

      // 4 — A aposta em prática + o contexto
      {
        id: 4, type: 'content', blocks: [
          { type: 'text', content: '"Vou ganhar isso aqui mesmo. Se eu ganhar, eu quero isso. E você, o que quer se ganhar?"' },
          { type: 'text', content: 'Agora você criou competição. Criou tensão. Criou diversão.' },
          { type: 'text', content: 'E diversão vira desejo muito mais rápido que jantar caro.' },
          { type: 'text', content: 'Mas a maior sacada não é o programa.' },
          { type: 'text', content: 'É o contexto.' },
        ]
      },

      // 5 — Criando o contexto
      {
        id: 5, type: 'content', blocks: [
          { type: 'text', content: 'Eu moro num condomínio com piscina aquecida, mesa de sinuca, área de jogos.' },
          { type: 'text', content: 'Eu não convido ela pra vir pra cá diretamente.' },
          { type: 'text', content: 'Eu crio o contexto.' },
          { type: 'text', content: '"Tenho uma surpresa aqui que você vai gostar. Você gosta de piscina aquecida? De sinuca?"' },
          { type: 'text', content: 'Ou então:' },
          { type: 'text', content: '"Você está cansada de ir pros mesmos lugares?"' },
        ]
      },

      // 6 — A surpresa + a percepção
      {
        id: 6, type: 'content', blocks: [
          { type: 'text', content: 'Mando um vídeo de alguém cozinhando muito bem. Ela chega. Peço iFood.' },
          { type: 'text', content: 'Ela não vai falar que veio pra sua casa.' },
          { type: 'text', content: 'Vai falar que veio ver uma surpresa.' },
          { type: 'text', content: 'Que você preparou algo especial pra ela.' },
          { type: 'text', content: 'A percepção vale mais que a realidade.' },
        ]
      },

      // 7 — O efeito manada
      {
        id: 7, type: 'content', blocks: [
          { type: 'text', content: 'E sabe o que funciona ainda mais?' },
          { type: 'text', content: 'Quando ela recusa — você vai com outra.' },
          { type: 'text', content: 'Posta. Natural. Sem marcar, sem explicar.' },
          { type: 'text', content: 'Ela vê.' },
          { type: 'text', content: 'E pensa: espera. Ele está saindo com mais mulheres enquanto eu recusei?' },
          { type: 'text', content: 'Aí o efeito manada ativa.' },
          { type: 'text', content: 'Ela não quer você necessariamente.' },
          { type: 'text', content: 'Ela não quer ficar de fora.' },
        ]
      },

      // 8 — A lição
      {
        id: 8, type: 'content', blocks: [
          { type: 'text', content: 'E quando ela aparecer — vai aparecer querendo.' },
          { type: 'text', content: 'A lição:' },
          { type: 'text', content: 'Restaurante caro cria obrigação.' },
          { type: 'text', content: 'Adrenalina cria desejo.' },
          { type: 'text', content: 'Crie o contexto. Crie a competição. Crie o medo de ficar de fora.' },
        ]
      },
    ]
  },
  {
    id: 9,
    number: '09',
    title: 'Ela está na sua frente porque ela se une. Você não.',
    status: 'new',
    intro: 'Deixa eu te fazer uma pergunta. Quando foi a última vez que você falou pros seus amigos o que estava sentindo de verdade?',
    pages: [
      { id: 1, type: 'cover', blocks: [] },

      // 2 — Você guarda, ela compartilha
      {
        id: 2, type: 'content', blocks: [
          { type: 'text', content: 'Não como piada. Não como comentário rápido.' },
          { type: 'text', content: 'De verdade.' },
          { type: 'text', content: 'Provavelmente faz tempo. Ou nunca aconteceu.' },
          { type: 'text', content: 'Você achou frescura. Achou fraqueza. Engoliu.' },
          { type: 'text', content: 'Enquanto isso ela estava com as amigas.' },
          { type: 'text', content: 'Falando tudo.' },
        ]
      },

      // 3 — A inteligência coletiva
      {
        id: 3, type: 'content', blocks: [
          { type: 'text', content: 'O cara que sumiu. O que fez errado. O que funcionou. O que não funcionou.' },
          { type: 'text', content: 'E as amigas completaram. Adicionaram. Passaram detalhes.' },
          { type: 'text', content: 'Aquela fofoca que você acha frescura?' },
          { type: 'text', content: 'É inteligência coletiva.' },
          { type: 'text', content: 'Ela saiu daquela conversa mais preparada do que entrou.' },
          { type: 'text', content: 'E você saiu de casa sozinho, sem ter falado nada com ninguém.' },
        ]
      },

      // 4 — A matilha
      {
        id: 4, type: 'content', blocks: [
          { type: 'text', content: 'Isso é uma vantagem desleal.' },
          { type: 'text', content: 'E você está perdendo feio.' },
          { type: 'text', content: 'E vai além.' },
          { type: 'text', content: 'Se você entrar numa sala com cinco mulheres e começar a discutir com uma, as outras quatro entram juntas.' },
          { type: 'text', content: 'Sem combinar. Sem precisar pedir.' },
          { type: 'text', content: 'Porque elas são matilha.' },
        ]
      },

      // 5 — Divide e conquista
      {
        id: 5, type: 'content', blocks: [
          { type: 'text', content: 'Então aprende com isso.' },
          { type: 'text', content: 'Divide e conquista.' },
          { type: 'text', content: 'Nunca enfrente o grupo junto.' },
          { type: 'text', content: 'Vai uma por uma. Encontra algo genuíno em cada uma. Um traço, um detalhe, algo que só ela tem.' },
          { type: 'text', content: '"Nossa, esse corte de cabelo ficou incrível."' },
          { type: 'text', content: '"Hoje eu não quero brigar não, vamos conversar numa boa?"' },
        ]
      },

      // 6 — A lição maior
      {
        id: 6, type: 'content', blocks: [
          { type: 'text', content: 'Você vai amolecendo, dividindo, conquistando uma por uma.' },
          { type: 'text', content: 'Quem fala com todas ao mesmo tempo — "vocês estão lindas hoje" — não conquista nenhuma.' },
          { type: 'text', content: 'Mas a lição maior é essa:' },
          { type: 'text', content: 'Se você não tem uma comunidade de homens que se desenvolvem, você está sozinho num jogo que ela joga em equipe.' },
          { type: 'text', content: 'Ela manda print pra amiga e em dez minutos tem cinco opiniões.' },
          { type: 'text', content: 'Você fica na dúvida sozinho tentando adivinhar o que fazer.' },
        ]
      },

      // 7 — Por isso a comunidade
      {
        id: 7, type: 'content', blocks: [
          { type: 'text', content: 'É por isso que eu criei comunidade.' },
          { type: 'text', content: 'Porque a mesma dúvida que você teve hoje, outro cara já passou e já sabe a resposta.' },
          { type: 'text', content: 'E quando você manda o print lá dentro, em minutos alguém que já viveu aquilo te fala o que fazer.' },
          { type: 'text', content: 'Isso é matilha.' },
          { type: 'text', content: 'Você nasceu pra viver em comunidade.' },
        ]
      },

      // 8 — A lição final
      {
        id: 8, type: 'content', blocks: [
          { type: 'text', content: 'Não é fraqueza pedir ajuda.' },
          { type: 'text', content: 'É inteligência usar o que está disponível.' },
          { type: 'text', content: 'Elas são unidas. E por isso estão na sua frente.' },
          { type: 'text', content: 'A única resposta é se unir também.' },
        ]
      },
    ]
  },
];

export const ecosystemProducts = [
  { id: 'comunidade', name: 'Comunidade', available: true },
  { id: 'mentorias', name: 'Mentorias', available: true },
  { id: 'ia-conversas', name: 'IA de Conversas', available: false },
];
