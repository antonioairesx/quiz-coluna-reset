import { useState, useEffect, useRef, type TouchEvent } from 'react'
import { startQuizSession, trackAnswer, completeQuizSession } from './lib/quizTracker'

// ─── CONFIG (muda só aqui entre os dois deploys) ───────────────────
const PRODUCT_NAME = 'Coluna Reset'
const PRODUCT_NAME_UPPER = 'COLUNA RESET'
const CHECKOUT_URL = 'https://pay.cakto.com.br/o3aqkgo_910441'
// ───────────────────────────────────────────────────────────────────

const ACCENT = '#F5820D'
const ACCENT_LIGHT = '#FEF3E2'
const ACCENT_TEXT = '#B85800'
const DARK = '#1A1F2E'
const MUTED = '#6B7280'
const BORDER = '#E8E8E5'
const WHITE = '#FFFFFF'
const PAGE_BG = '#F0F0EE'

// ─── TYPES ────────────────────────────────────────────────────────
type QuestionStep = {
  type: 'question'
  id: string
  label: string
  intro?: string
  question: string
  options: string[]
  multi?: boolean
}
type IntroStep = {
  type: 'intro'
  headline: string
  paren?: string
  sub: string
  cta: string
  scarcity: string
  image?: string
}
type NameStep = {
  type: 'name'
  title: string
  placeholder: string
  cta: string
}
type ReflectionStep = {
  type: 'reflection'
  body: string[]
  highlight?: string
  cta: string
  image?: string
}
type BreakStep = {
  type: 'break'
  title: string
  body: string[]
  cta: string
  expert?: {
    name: string
    role: string
    photo: string
    bio: string[]
  }
}
type VSLStep = {
  type: 'vsl'
  slides: { title: string; body: string }[]
}
type TestimonialStep = {
  type: 'testimonial'
  label: string
  title: string
  images: string[]
  cta: string
}
type LoadingStep = { type: 'loading' }
type ResultStep = { type: 'result' }
type Step =
  | QuestionStep
  | IntroStep
  | NameStep
  | ReflectionStep
  | BreakStep
  | VSLStep
  | TestimonialStep
  | LoadingStep
  | ResultStep

// ─── INTERPOLAÇÃO DE PERSONALIZAÇÃO ───────────────────────────────
function interpolate(text: string, answers: Record<string, string | string[]>): string {
  const nome = (answers['nome'] as string)?.trim() || 'você'
  return text
    .replace(/\{nome\}/g, nome)
    .replace(/\[(\w+)\]/g, (_, key) => {
      const v = answers[key]
      const s = Array.isArray(v) ? v.join(', ') : (v || '')
      return s.toLowerCase()
    })
}

// ─── STEPS ────────────────────────────────────────────────────────
const STEPS: Step[] = [
  // ENTRADA
  {
    type: 'intro',
    headline: 'Em 2 minutos você descobre o que realmente está por trás da sua dor lombar.',
    paren: 'Não é postura. Não é colchão. Não é idade.',
    sub: 'Responda algumas perguntas e receba o diagnóstico do seu padrão de Colapso de Ativação Lombar, montado a partir das suas respostas.',
    cta: 'Quero meu diagnóstico',
    scarcity: 'Leva 2 minutos. Só dá pra responder uma vez.',
    image: '/quiz/entrada.webp',
  },

  // BLOCO A — Situacionais
  {
    type: 'question', id: 'sexo', label: 'Sobre você',
    intro: 'Vamos montar seu diagnóstico do zero. Primeiro, o básico:',
    question: 'Você é...',
    options: ['Homem', 'Mulher'],
  },
  {
    type: 'question', id: 'idade', label: 'Sobre você',
    intro: 'Sua idade muda como a lombar reage ao tempo sentado.',
    question: 'Em qual faixa você está?',
    options: ['25 a 35 anos', '36 a 45 anos', '46 a 55 anos', 'Acima de 55 anos'],
  },
  // CAPTURA DE NOME
  {
    type: 'name',
    title: 'Quase lá. Como você quer que eu te chame no seu diagnóstico?',
    placeholder: 'Seu primeiro nome',
    cta: 'Continuar',
  },
  {
    type: 'question', id: 'horas_sentado', label: 'Sua rotina',
    intro: '{nome}, agora a pergunta que mais pesa no seu caso:',
    question: 'Quantas horas por dia você passa sentado trabalhando?',
    options: ['Menos de 4 horas', 'De 4 a 6 horas', 'De 6 a 8 horas', 'Mais de 8 horas'],
  },
  {
    type: 'question', id: 'tempo_dor', label: 'Sua dor',
    intro: 'Tempo de exposição muda tudo no diagnóstico.',
    question: 'Há quanto tempo a dor virou parte da sua rotina?',
    options: ['Menos de 6 meses', 'De 6 meses a 2 anos', 'De 2 a 5 anos', 'Mais de 5 anos'],
  },
  // REFLEXO 1
  {
    type: 'reflection',
    body: [
      '{nome}, isso já diz muito.',
      'Não é coincidência nem azar. É o tempo parado mantendo seus estabilizadores lombares desligados, dia após dia. A boa notícia: isso tem nome, tem causa e tem solução. Continue que eu te mostro.',
    ],
    highlight: '[horas_sentado] sentado por dia, e uma dor que já te acompanha há [tempo_dor].',
    cta: 'Continuar',
  },
  {
    type: 'question', id: 'tentou_antes', label: 'Histórico',
    intro: 'Quero entender seu histórico antes de te dar o caminho certo.',
    question: 'Antes de hoje, você já tentou resolver isso?',
    options: [
      'Sim, mas não funcionou',
      'Sim, melhorou mas a dor voltou',
      'Nunca tentei de verdade',
    ],
  },
  // BREAK 1
  {
    type: 'break',
    title: '{nome}, por que tudo que você tentou falhou (e não é culpa sua)',
    body: [
      'A maioria das pessoas com dor nas costas tenta alongamento, academia ou fisioterapia. Algumas melhoram por um tempo. Mas a dor sempre volta.',
      'O motivo não é falta de esforço. É que tudo isso ataca o sintoma e ignora a causa real: a desativação dos músculos que sustentam a sua coluna.',
      'Continue respondendo pra eu te mostrar exatamente o que está acontecendo na sua lombar, e como reverter.',
    ],
    cta: 'Entendi, continuar',
    expert: {
      name: 'Rafael Souza',
      role: 'Criador do método Coluna Reset',
      photo: '/rafael.webp',
      bio: [
        'Rafael passou anos estudando por que tanta gente que trabalha sentada convive com dor lombar mesmo fazendo academia, alongamento e fisioterapia. A resposta não estava no esforço, estava no músculo errado sendo tratado.',
        'Foi assim que ele identificou o Colapso de Ativação Lombar e desenvolveu o Coluna Reset: uma sequência de 8 minutos que reativa os estabilizadores profundos na ordem certa, sem equipamento e sem sair do lugar onde você trabalha.',
      ],
    },
  },
  // BLOCO B — Problema
  {
    type: 'question', id: 'o_que_tentou', label: 'O que você tentou',
    intro: 'Marque tudo que você já tentou. Vou cruzar com o seu padrão.',
    question: 'O que você já tentou para resolver a dor? (pode marcar mais de uma)',
    options: ['Alongamento em casa', 'Academia', 'Fisioterapia', 'Remédio para dor', 'Nada até agora'],
    multi: true,
  },
  {
    type: 'question', id: 'resultado_tentativas', label: 'Resultado',
    intro: 'E sinceramente, o que sobrou de tudo isso?',
    question: 'Qual foi o resultado real dessas tentativas?',
    options: [
      'Funcionou por um tempo, depois a dor voltou',
      'Não resolveu nada',
      'Melhorou mas não eliminou a dor',
      'Nunca tentei',
    ],
  },
  {
    type: 'question', id: 'onde_dor', label: 'Localização',
    intro: 'Onde a dor mora revela qual estabilizador desligou primeiro.',
    question: 'Onde você sente com mais força?',
    options: [
      'Lombar baixa (região do cinto)',
      'Lombar e glúteo',
      'Lombar irradiando para a perna',
      'Difusa em toda a parte baixa das costas',
    ],
  },
  {
    type: 'question', id: 'quando_dor', label: 'Timing',
    intro: 'O horário da dor é uma das pistas mais importantes.',
    question: 'Em que momento do dia ela aperta mais?',
    options: [
      'Ao acordar',
      'Depois de horas sentado',
      'No fim do expediente',
      'A dor é constante ao longo do dia',
    ],
  },
  {
    type: 'question', id: 'intensidade', label: 'Intensidade',
    intro: 'Sem suavizar. Nos dias ruins, como é de verdade?',
    question: 'Como você descreveria a dor nos piores dias?',
    options: [
      'Incômoda mas suportável',
      'Moderada, atrapalha minha concentração',
      'Forte, difícil trabalhar',
      'Às vezes incapacitante',
    ],
  },
  {
    type: 'question', id: 'se_levanta', label: 'Comportamento',
    intro: 'Aquele momento em que você precisa levantar só pra aliviar...',
    question: 'Você precisa se levantar pra dar uma trégua à dor durante o trabalho?',
    options: ['Não', 'Às vezes sim', 'Com frequência', 'Quase o tempo todo'],
  },
  {
    type: 'question', id: 'produtividade', label: 'Impacto no trabalho',
    intro: 'A dor não cobra só nas costas. Ela cobra no seu rendimento.',
    question: 'Ela afeta sua produtividade?',
    options: [
      'Não',
      'Às vezes perco o foco',
      'Frequentemente fico improdutivo',
      'Impacta diretamente minha entrega',
    ],
  },
  {
    type: 'question', id: 'vida_pessoal', label: 'Impacto pessoal',
    intro: 'E quando o expediente acaba, ela vai embora?',
    question: 'A dor acompanha você pra fora do trabalho?',
    options: [
      'Não',
      'Um pouco',
      'Chego em casa cansado e doendo',
      'Compromete meu tempo com a família',
    ],
  },
  // REFLEXO 2 (pico emocional)
  {
    type: 'reflection',
    body: [
      '{nome}, deixa eu te falar uma coisa.',
      'A dor que começa na cadeira não termina nela. Ela rouba seu foco, sua paciência, seu tempo com quem você ama. E não melhora sozinha: cada dia sentado reinicia o ciclo do zero.',
      'Mas existe uma forma de quebrar isso em 8 minutos por dia. Vou te mostrar agora como funciona.',
    ],
    cta: 'Quero entender',
    image: '/quiz/reflexo.webp',
  },
  // MINI VSL
  {
    type: 'vsl',
    slides: [
      {
        title: 'O músculo que ninguém te contou',
        body: 'Existe um grupo muscular chamado estabilizadores lombares. São responsáveis por sustentar sua coluna durante a posição sentada.',
      },
      {
        title: 'O que acontece depois de 2h sentado',
        body: 'Esses músculos entram em modo de hibernação. Eles param de trabalhar ativamente. Isso é o Colapso de Ativação Lombar, e é o que está causando sua dor.',
      },
      {
        title: 'Por que o alongamento falha',
        body: 'Alongar um músculo hibernado é como espremer um pano seco: você pode esticar, mas ele não volta a funcionar. O alívio dura minutos. Depois a dor volta.',
      },
      {
        title: `O que o ${PRODUCT_NAME} faz`,
        body: `{nome}, o ${PRODUCT_NAME} usa uma sequência específica: ativa os estabilizadores profundos primeiro, depois os superficiais. Em 8 minutos, o Colapso é revertido e a coluna recupera suporte real.`,
      },
    ],
  },
  // BLOCO C — Implicação
  {
    type: 'question', id: 'frequencia_pensamento', label: 'Impacto mental',
    intro: 'Quero medir o quanto isso ocupa a sua cabeça.',
    question: 'Com que frequência você pensa na dor durante o expediente?',
    options: ['Raramente', 'Algumas vezes por dia', 'Frequentemente', 'O tempo todo'],
  },
  {
    type: 'question', id: 'humor', label: 'Impacto emocional',
    intro: 'Essa é difícil de admitir, mas importa muito:',
    question: 'A dor já mexeu com seu humor ou sua paciência com quem está perto?',
    options: ['Não', 'Raramente', 'Às vezes sim', 'Com frequência'],
  },
  {
    type: 'question', id: 'deixou_de_fazer', label: 'Limitações',
    intro: 'Pensa nas coisas que você gosta de fazer.',
    question: 'Você já abriu mão de algo por causa da dor?',
    options: ['Nunca', 'Raramente', 'Algumas vezes', 'Com frequência'],
  },
  {
    type: 'question', id: 'preocupacao_futuro', label: 'Perspectiva',
    intro: 'Agora olha pra frente.',
    question: 'Você se preocupa com como sua lombar vai estar em 5 ou 10 anos?',
    options: ['Não pensei nisso', 'Um pouco', 'Sim, me preocupa', 'Muito, tenho medo de piorar'],
  },
  {
    type: 'question', id: 'rotina_2_anos', label: 'Projeção',
    intro: 'Seja honesto com você mesmo:',
    question: 'Se nada mudar, como você imagina sua rotina daqui a 2 anos?',
    options: ['Igual a hoje', 'Um pouco pior', 'Significativamente pior', 'Não quero nem pensar'],
  },
  // REFLEXO 3 (future pacing + virada)
  {
    type: 'reflection',
    body: [
      '{nome}, você acabou de admitir pra você mesmo onde isso pode chegar.',
      'A diferença é que esse futuro ainda não está fechado. Faltam poucas perguntas pra eu montar o protocolo exato que muda essa trajetória.',
    ],
    cta: 'Continuar',
  },
  // BLOCO D — Pré-comprometimento
  {
    type: 'question', id: 'faria_protocolo', label: 'Comprometimento',
    intro: 'Imagina que esse caminho existe e está provado.',
    question: 'Se existisse um protocolo de 8 minutos por dia, você faria todos os dias?',
    options: ['Sim, com certeza', 'Provavelmente sim', 'Dependeria da dificuldade', 'Teria dificuldade de manter'],
  },
  {
    type: 'question', id: 'melhor_horario', label: 'Rotina',
    intro: 'Vamos encaixar na sua vida real.',
    question: 'Qual momento do dia funcionaria pra você?',
    options: ['Antes do trabalho', 'Na pausa do almoço', 'Em uma pausa no expediente', 'Após o trabalho'],
  },
  {
    type: 'question', id: 'sem_sair', label: 'Praticidade',
    intro: 'Praticidade é o que faz o hábito durar.',
    question: 'Prefere algo que dá pra fazer sem sair da sua mesa?',
    options: ['Sim, com certeza', 'Tanto faz', 'Prefiro fora do ambiente de trabalho'],
  },
  {
    type: 'question', id: 'motivacao', label: 'Motivação',
    intro: 'Última coisa antes do seu diagnóstico:',
    question: 'O que mais te moveria a começar hoje?',
    options: [
      'Aliviar a dor rapidamente',
      'Ter mais energia e foco ao longo do dia',
      'Evitar que a dor piore com a idade',
      'As três coisas',
    ],
  },
  {
    type: 'question', id: 'pronto', label: 'Decisão',
    intro: 'Então só me confirma:',
    question: 'Você está disposto a testar uma abordagem diferente de tudo que já tentou?',
    options: ['Sim, estou pronto', 'Depende do que é', 'Estou cético mas curioso'],
  },
  // DEPOIMENTOS
  {
    type: 'testimonial',
    label: 'Quem já aplicou',
    title: '{nome}, veja quem já reverteu o Colapso de Ativação Lombar',
    images: ['/depoimentos/depo-01.webp', '/depoimentos/depo-02.webp'],
    cta: 'Ver meu diagnóstico →',
  },
  // LOADING + RESULT
  { type: 'loading' },
  { type: 'result' },
]

const TOTAL_QUESTIONS = STEPS.filter(s => s.type === 'question').length

function getQuestionNumber(idx: number) {
  let n = 0
  for (let i = 0; i <= idx; i++) if (STEPS[i].type === 'question') n++
  return n
}

function getProgress(idx: number) {
  const step = STEPS[idx]
  if (step.type === 'loading') return 0
  if (step.type === 'result') return 100
  const qNum = getQuestionNumber(idx)
  return Math.round((qNum / TOTAL_QUESTIONS) * 90)
}

// ─── SUBCOMPONENTS ────────────────────────────────────────────────

function Header({ step, stepIdx }: { step: Step; stepIdx: number }) {
  if (step.type === 'result' || step.type === 'intro') return null
  const progress = getProgress(stepIdx)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: `1px solid ${BORDER}`, background: WHITE }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/icon.png" alt="" style={{ width: 28, height: 'auto', objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, color: ACCENT, letterSpacing: 0.5 }}>
            {PRODUCT_NAME_UPPER}
          </span>
        </div>
      </div>
      <div style={{ height: 3, background: '#E8E8E5' }}>
        <div style={{ height: 3, width: `${progress}%`, background: ACCENT, borderRadius: '0 2px 2px 0', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function IntroView({ step, onContinue }: { step: IntroStep; onContinue: () => void }) {
  return (
    <div style={{ padding: '36px 20px 40px', display: 'flex', flexDirection: 'column', minHeight: '90vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        <img src="/icon.png" alt="" style={{ width: 30, height: 'auto', objectFit: 'contain' }} />
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: ACCENT, letterSpacing: 0.5 }}>
          {PRODUCT_NAME_UPPER}
        </span>
      </div>

      {step.image && (
        <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 28, border: `1px solid ${BORDER}` }}>
          <img src={step.image} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      )}

      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 32, color: DARK, lineHeight: 1.1, marginBottom: 14 }}>
        {step.headline}
      </h1>
      {step.paren && (
        <p style={{ fontSize: 15, color: ACCENT_TEXT, fontWeight: 600, marginBottom: 18 }}>
          {step.paren}
        </p>
      )}
      <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.7, marginBottom: 'auto' }}>
        {step.sub}
      </p>

      <button
        onClick={onContinue}
        style={{ marginTop: 32, width: '100%', padding: 17, background: ACCENT, color: WHITE, border: 'none', borderRadius: 10, fontFamily: "'Barlow', sans-serif", fontSize: 17, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3 }}
      >
        {step.cta}
      </button>
      <p style={{ marginTop: 14, fontSize: 13, color: MUTED, textAlign: 'center' }}>
        {step.scarcity}
      </p>
    </div>
  )
}

function NameView({ step, onSubmit }: { step: NameStep; onSubmit: (name: string) => void }) {
  const [value, setValue] = useState('')
  const valid = value.trim().length >= 2

  function submit() {
    if (valid) onSubmit(value.trim())
  }

  return (
    <div style={{ padding: '40px 20px 40px', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 24, color: DARK, lineHeight: 1.25, marginBottom: 24 }}>
        {step.title}
      </h2>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit() }}
        placeholder={step.placeholder}
        autoFocus
        onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
        onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
        style={{ width: '100%', boxSizing: 'border-box', padding: '15px 16px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontFamily: "'Barlow', sans-serif", fontSize: 16, color: DARK, outline: 'none', marginBottom: 20, transition: 'border-color 0.15s ease' }}
      />
      <button
        onClick={submit}
        disabled={!valid}
        style={{ width: '100%', padding: 15, background: valid ? ACCENT : BORDER, color: valid ? WHITE : MUTED, border: 'none', borderRadius: 10, fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, cursor: valid ? 'pointer' : 'default', transition: 'background 0.2s ease' }}
      >
        {step.cta}
      </button>
    </div>
  )
}

function ReflectionView({ step, answers, onContinue }: { step: ReflectionStep; answers: Record<string, string | string[]>; onContinue: () => void }) {
  return (
    <div style={{ padding: '36px 20px 40px' }}>
      {step.image && (
        <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 24, border: `1px solid ${BORDER}` }}>
          <img src={step.image} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      )}
      <p style={{ fontSize: 18, color: DARK, lineHeight: 1.6, fontWeight: 500, marginBottom: step.highlight ? 18 : 14 }}>
        {interpolate(step.body[0], answers)}
      </p>
      {step.highlight && (
        <div style={{ padding: '16px 18px', background: ACCENT_LIGHT, borderLeft: `3px solid ${ACCENT}`, borderRadius: 8, marginBottom: 18 }}>
          <p style={{ fontSize: 16, color: ACCENT_TEXT, fontWeight: 600, lineHeight: 1.5 }}>
            {interpolate(step.highlight, answers)}
          </p>
        </div>
      )}
      {step.body.slice(1).map((p, i) => (
        <p key={i} style={{ fontSize: 15, color: MUTED, lineHeight: 1.75, marginBottom: 14 }}>
          {interpolate(p, answers)}
        </p>
      ))}
      <button
        onClick={onContinue}
        style={{ marginTop: 18, width: '100%', padding: 15, background: ACCENT, color: WHITE, border: 'none', borderRadius: 10, fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >
        {step.cta}
      </button>
    </div>
  )
}

function QuestionView({ step, answers, selected, onSelect, onContinue }: {
  step: QuestionStep
  answers: Record<string, string | string[]>
  selected: string[]
  onSelect: (o: string) => void
  onContinue: () => void
}) {
  const hasSelection = selected.length > 0
  return (
    <div style={{ padding: '24px 18px 32px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {step.label}
      </p>
      {step.intro && (
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, marginBottom: 12 }}>
          {interpolate(step.intro, answers)}
        </p>
      )}
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: DARK, lineHeight: 1.2, marginBottom: 22 }}>
        {step.question}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {step.options.map(opt => {
          const isSel = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 14px',
                border: isSel ? `2px solid ${ACCENT}` : `1.5px solid ${BORDER}`,
                borderRadius: 10,
                background: isSel ? ACCENT_LIGHT : WHITE,
                cursor: 'pointer',
                fontFamily: "'Barlow', sans-serif",
                fontSize: 14,
                color: isSel ? ACCENT_TEXT : DARK,
                fontWeight: isSel ? 600 : 400,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                lineHeight: 1.4,
                transition: 'all 0.15s ease',
              }}
            >
              {opt}
              {isSel && (
                <span style={{ marginLeft: 8, flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
      {step.multi && hasSelection && (
        <button
          onClick={onContinue}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '15px',
            background: ACCENT,
            color: WHITE,
            border: 'none',
            borderRadius: 10,
            fontFamily: "'Barlow', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: 0.2,
          }}
        >
          Continuar →
        </button>
      )}
    </div>
  )
}

function TestimonialCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)
  const startX = useRef<number | null>(null)
  const total = images.length

  function go(n: number) {
    setIdx(prev => Math.max(0, Math.min(total - 1, prev + n)))
  }

  function onTouchStart(e: TouchEvent<HTMLDivElement>) {
    startX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: TouchEvent<HTMLDivElement>) {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (dx < -40) go(1)
    else if (dx > 40) go(-1)
    startX.current = null
  }

  return (
    <div>
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ overflow: 'hidden', borderRadius: 14, border: `1px solid ${BORDER}`, background: '#F9F9F7' }}
      >
        <div style={{ display: 'flex', transform: `translateX(-${idx * 100}%)`, transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
          {images.map((src, i) => (
            <div key={i} style={{ minWidth: '100%' }}>
              <img src={src} alt={`Depoimento ${i + 1}`} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          aria-label="Depoimento anterior"
          style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${BORDER}`, background: WHITE, cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s ease' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        <div style={{ display: 'flex', gap: 6 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ir para depoimento ${i + 1}`}
              style={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 4, border: 'none', background: i === idx ? ACCENT : BORDER, cursor: 'pointer', padding: 0, transition: 'width 0.25s ease, background 0.25s ease' }}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          disabled={idx === total - 1}
          aria-label="Próximo depoimento"
          style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${BORDER}`, background: WHITE, cursor: idx === total - 1 ? 'default' : 'pointer', opacity: idx === total - 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s ease' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  )
}

function TestimonialView({ step, answers, onContinue }: { step: TestimonialStep; answers: Record<string, string | string[]>; onContinue: () => void }) {
  return (
    <div style={{ padding: '32px 18px 32px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {step.label}
      </p>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: DARK, lineHeight: 1.2, marginBottom: 18 }}>
        {interpolate(step.title, answers)}
      </h2>
      <TestimonialCarousel images={step.images} />
      <button
        onClick={onContinue}
        style={{ marginTop: 24, width: '100%', padding: 15, background: ACCENT, color: WHITE, border: 'none', borderRadius: 10, fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >
        {step.cta}
      </button>
    </div>
  )
}

function BreakView({ step, answers, onContinue }: { step: BreakStep; answers: Record<string, string | string[]>; onContinue: () => void }) {
  return (
    <div style={{ padding: '32px 18px 32px' }}>
      <div style={{ width: 48, height: 48, borderRadius: 10, background: ACCENT_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke={ACCENT} strokeWidth="2" />
          <path d="M12 8v4M12 16h.01" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: DARK, lineHeight: 1.2, marginBottom: 16 }}>
        {interpolate(step.title, answers)}
      </h2>
      {step.body.map((p, i) => (
        <p key={i} style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: i < step.body.length - 1 ? 12 : 24 }}>
          {interpolate(p, answers)}
        </p>
      ))}

      {step.expert && (
        <div style={{ marginBottom: 24, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 16 }}>
            <img
              src={step.expert.photo}
              alt={step.expert.name}
              loading="lazy"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 26, color: DARK, lineHeight: 1.1, marginBottom: 4 }}>
            {step.expert.name}
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: ACCENT_TEXT, marginBottom: 18 }}>
            {step.expert.role}
          </p>
          {step.expert.bio.map((p, i) => (
            <p key={i} style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: i < step.expert!.bio.length - 1 ? 12 : 0 }}>
              {p}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={onContinue}
        style={{ width: '100%', padding: 15, background: ACCENT, color: WHITE, border: 'none', borderRadius: 10, fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >
        {step.cta}
      </button>
    </div>
  )
}

function VSLView({ step, answers, onComplete }: { step: VSLStep; answers: Record<string, string | string[]>; onComplete: () => void }) {
  const [slide, setSlide] = useState(0)
  const total = step.slides.length
  const current = step.slides[slide]
  const isLast = slide === total - 1

  return (
    <div style={{ padding: '32px 18px 32px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {step.slides.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= slide ? ACCENT : BORDER, transition: 'background 0.3s' }} />
        ))}
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Entenda o mecanismo
      </p>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: DARK, lineHeight: 1.2, marginBottom: 18 }}>
        {interpolate(current.title, answers)}
      </h2>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.75, marginBottom: 32 }}>
        {interpolate(current.body, answers)}
      </p>
      <button
        onClick={() => isLast ? onComplete() : setSlide(s => s + 1)}
        style={{ width: '100%', padding: 15, background: ACCENT, color: WHITE, border: 'none', borderRadius: 10, fontFamily: "'Barlow', sans-serif", fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >
        {isLast ? 'Ver meu diagnóstico →' : 'Próximo →'}
      </button>
    </div>
  )
}

function LoadingView({ answers, onComplete }: { answers: Record<string, string | string[]>; onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)
  const nome = (answers['nome'] as string)?.trim() || ''

  const loadingMsgs = [
    nome ? `Analisando as respostas de ${nome}...` : 'Analisando suas respostas...',
    'Calculando seu nível de Colapso de Ativação Lombar...',
    'Montando seu protocolo personalizado...',
  ]

  useEffect(() => {
    let p = 0
    const iv = setInterval(() => {
      p += 1.5
      setProgress(Math.min(100, Math.round(p)))
      if (p >= 30 && p < 32) setMsgIdx(1)
      if (p >= 65 && p < 67) setMsgIdx(2)
      if (p >= 100) { clearInterval(iv); setTimeout(onComplete, 600) }
    }, 45)
    return () => clearInterval(iv)
  }, [onComplete])

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 18px' }}>
      <img src="/icon.png" alt="" style={{ width: 64, height: 'auto', marginBottom: 32, opacity: 0.9 }} />
      <div style={{ width: '100%', height: 6, background: BORDER, borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: 6, width: `${progress}%`, background: ACCENT, borderRadius: 3, transition: 'width 0.2s ease' }} />
      </div>
      <p style={{ fontSize: 15, color: DARK, textAlign: 'center', fontWeight: 500, minHeight: 48, transition: 'opacity 0.3s' }}>
        {loadingMsgs[msgIdx]}
      </p>
      <p style={{ marginTop: 8, fontSize: 13, color: MUTED }}>{progress}%</p>
    </div>
  )
}

function ResultView({ answers }: { answers: Record<string, string | string[]> }) {
  const nome = (answers['nome'] as string)?.trim() || ''
  const intensidade = (answers['intensidade'] as string) || ''
  const produtividade = (answers['produtividade'] as string) || ''
  const horas = (answers['horas_sentado'] as string) || 'várias horas'
  const tempoDor = (answers['tempo_dor'] as string) || ''
  const ondeDor = (answers['onde_dor'] as string) || ''
  const quandoDor = (answers['quando_dor'] as string) || ''

  const isAvancado =
    intensidade.includes('Forte') ||
    intensidade.includes('incapacitante') ||
    produtividade.includes('Impacta diretamente')

  const nivel = isAvancado ? 'AVANÇADO' : 'MODERADO-AVANÇADO'
  const nivelColor = isAvancado ? '#C0392B' : '#D97706'

  return (
    <div style={{ background: WHITE }}>
      {/* Hero */}
      <div style={{ background: DARK, padding: '28px 18px 24px', textAlign: 'center' }}>
        <img src="/icon.png" alt="" style={{ width: 52, height: 'auto', marginBottom: 16 }} />
        <p style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Diagnóstico concluído
        </p>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: WHITE, lineHeight: 1.15, marginBottom: 16 }}>
          {nome ? `${nome}, seu` : 'Seu'} nível de Colapso de Ativação Lombar está identificado
        </h1>
        <div style={{ display: 'inline-block', background: nivelColor, color: WHITE, fontWeight: 700, fontSize: 15, padding: '6px 18px', borderRadius: 20, letterSpacing: 0.5 }}>
          {nivel}
        </div>
      </div>

      {/* Diagnóstico personalizado */}
      <div style={{ padding: '24px 18px', borderBottom: `1px solid ${BORDER}` }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: DARK, marginBottom: 12 }}>
          O que isso significa para você
        </h2>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 10 }}>
          Com <strong style={{ color: DARK }}>{horas}</strong> sentado por dia
          {tempoDor ? ` e convivendo com dor lombar há ${tempoDor.toLowerCase()}` : ''}
          {ondeDor ? `, concentrada principalmente em ${ondeDor.toLowerCase()}` : ''}
          {quandoDor ? `, que costuma apertar mais ${quandoDor.toLowerCase()}` : ''}, seus
          estabilizadores lombares estão em modo de hibernação crônica.
        </p>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7 }}>
          {nome ? `${nome}, isso` : 'Isso'} não vai melhorar sozinho. Cada hora sentado reinicia o ciclo. A boa notícia é que o Colapso de Ativação Lombar tem solução — e ela leva 8 minutos por dia.
        </p>
      </div>

      {/* Produto */}
      <div style={{ padding: '24px 18px', borderBottom: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Seu protocolo está pronto
        </p>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: DARK, lineHeight: 1.2, marginBottom: 18 }}>
          {PRODUCT_NAME}
        </h2>

        {[
          { title: `Protocolo ${PRODUCT_NAME} em vídeo`, desc: '8 minutos de exercícios guiados que reativam os estabilizadores na sequência correta. Sem equipamento, sem sair do trabalho.', price: 'R$97' },
          { title: 'Guia de Ergonomia Express', desc: 'PDF com os ajustes de cadeira, monitor e postura que reduzem a pressão lombar em até 60% durante o expediente.', price: 'R$37' },
          { title: 'Protocolo de Emergência', desc: '3 movimentos para aplicar no momento da crise, sem sair da cadeira. Alívio em menos de 3 minutos.', price: 'R$27' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, padding: '14px', background: '#F9F9F7', borderRadius: 10, border: `1px solid ${BORDER}` }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: ACCENT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 4 }}>{item.title}</p>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 4 }}>{item.desc}</p>
              <p style={{ fontSize: 11, color: MUTED, textDecoration: 'line-through' }}>Valor: {item.price}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Prova social */}
      <div style={{ padding: '24px 18px', borderBottom: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          O que estão dizendo
        </p>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: DARK, lineHeight: 1.2, marginBottom: 18 }}>
          Você não está sozinho nessa
        </h2>
        <TestimonialCarousel images={['/depoimentos/depo-03.webp', '/depoimentos/depo-04.webp']} />
      </div>

      {/* Preço */}
      <div style={{ padding: '24px 18px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>
          Tudo isso de <span style={{ textDecoration: 'line-through' }}>R$161</span> por
        </p>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 48, color: DARK, lineHeight: 1, marginBottom: 4 }}>
          R$37
        </p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 24 }}>
          Acesso imediato logo após o pagamento
        </p>

        <a
          href={CHECKOUT_URL}
          style={{ display: 'block', width: '100%', padding: '17px 0', background: ACCENT, color: WHITE, borderRadius: 10, textDecoration: 'none', fontFamily: "'Barlow', sans-serif", fontSize: 17, fontWeight: 700, textAlign: 'center', letterSpacing: 0.3 }}
        >
          Quero meu protocolo por R$37 →
        </a>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke={MUTED} strokeWidth="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={MUTED} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 12, color: MUTED }}>Pagamento seguro · Acesso imediato · Garantia de 7 dias</p>
        </div>

        {/* Garantia */}
        <div style={{ marginTop: 20, padding: '16px', border: `1.5px dashed ${BORDER}`, borderRadius: 10, textAlign: 'left' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 6 }}>Garantia de 7 dias</p>
          <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
            Se você aplicar o protocolo por 7 dias e não sentir nenhuma diferença, devolvemos 100% do valor. Sem perguntas.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────
export default function App() {
  const [stepIdx, setStepIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [selected, setSelected] = useState<string[]>([])
  const [fading, setFading] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const step = STEPS[stepIdx]

  useEffect(() => {
    startQuizSession()
  }, [])

  useEffect(() => {
    setSelected([])
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [stepIdx])

  function advance(answeredText?: string) {
    const current = STEPS[stepIdx]
    if (current.type === 'question' && answeredText !== undefined) {
      trackAnswer(stepIdx + 1, current.question, answeredText)
    }
    if (STEPS[stepIdx + 1]?.type === 'result') {
      completeQuizSession()
    }
    setFading(true)
    setTimeout(() => {
      setStepIdx(i => i + 1)
      setFading(false)
    }, 200)
  }

  function goBack() {
    if (stepIdx === 0) return
    setFading(true)
    setTimeout(() => {
      setStepIdx(i => i - 1)
      setFading(false)
    }, 150)
  }

  function handleSelect(opt: string) {
    if (step.type !== 'question') return
    const isMulti = step.multi

    if (isMulti) {
      if (opt === 'Nada até agora') {
        setSelected(['Nada até agora'])
      } else {
        setSelected(prev => {
          const without = prev.filter(o => o !== 'Nada até agora')
          return prev.includes(opt) ? without.filter(o => o !== opt) : [...without, opt]
        })
      }
    } else {
      setSelected([opt])
      setAnswers(a => ({ ...a, [step.id]: opt }))
      setTimeout(() => advance(opt), 350)
    }
  }

  function handleContinue() {
    if (step.type === 'question') {
      setAnswers(a => ({ ...a, [step.id]: selected.length === 1 ? selected[0] : selected }))
      advance(selected.join(', '))
    } else {
      advance()
    }
  }

  function handleNameSubmit(name: string) {
    setAnswers(a => ({ ...a, nome: name }))
    advance()
  }

  return (
    <div style={{ minHeight: '100%', background: PAGE_BG, display: 'flex', justifyContent: 'center' }}>
      <div
        ref={topRef}
        style={{
          width: '100%',
          maxWidth: 480,
          minHeight: '100vh',
          background: WHITE,
          display: 'flex',
          flexDirection: 'column',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.18s ease',
          position: 'relative',
        }}
      >
        <Header step={step} stepIdx={stepIdx} />

        <div style={{ flex: 1 }}>
          {step.type === 'intro' && (
            <IntroView step={step} onContinue={() => advance()} />
          )}
          {step.type === 'name' && (
            <NameView step={step} onSubmit={handleNameSubmit} />
          )}
          {step.type === 'reflection' && (
            <ReflectionView step={step} answers={answers} onContinue={() => advance()} />
          )}
          {step.type === 'question' && (
            <QuestionView step={step} answers={answers} selected={selected} onSelect={handleSelect} onContinue={handleContinue} />
          )}
          {step.type === 'break' && (
            <BreakView step={step} answers={answers} onContinue={() => advance()} />
          )}
          {step.type === 'vsl' && (
            <VSLView step={step} answers={answers} onComplete={() => advance()} />
          )}
          {step.type === 'testimonial' && (
            <TestimonialView step={step} answers={answers} onContinue={() => advance()} />
          )}
          {step.type === 'loading' && (
            <LoadingView answers={answers} onComplete={() => advance()} />
          )}
          {step.type === 'result' && (
            <ResultView answers={answers} />
          )}
        </div>

        {step.type === 'question' && stepIdx > 0 && (
          <button
            onClick={goBack}
            style={{ background: 'none', border: 'none', borderTop: `1px solid ${BORDER}`, color: MUTED, fontSize: 13, fontFamily: "'Barlow', sans-serif", cursor: 'pointer', padding: '12px 18px', textAlign: 'left' }}
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  )
}
