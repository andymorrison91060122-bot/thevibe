import { FEISHU_CARDS, FEISHU_PENALTIES } from './feishuCards';

export type CardPhase = 1 | 2 | 3;
export type CardLevel = CardPhase | 4;

export interface Card {
  id: string;
  phase: CardPhase;
  /**
   * Content intensity level from the card library.
   * Level 4 is still rendered as Phase 3, but only unlocks at 100°C.
   */
  level?: CardLevel;
  type: 'topic' | 'game' | 'action' | 'play'; // 走心 | 默契 | 触碰 | 玩乐
  title: string;
  content: string;
  initiatorPrompt: string; // 主导方特定引导
  receiverPrompt: string;  // 配合方特定引导
  points: number;          // 增加的温度值
}

export interface PenaltyTask {
  id: string;
  text: string;
}

export const getCardLevel = (card: Card): CardLevel => card.level ?? card.phase;

const BASE_CARDS_POOL: Card[] = [
  // =================== PHASE 1: 破冰微温 (Ice-breaking) ===================
  {
    id: 'p1-1',
    phase: 1,
    type: 'topic',
    title: '初遇气味',
    content: '闭上眼睛，描述一下你记忆中对方最深的一种味道，或者第一次见面时对方给你的感觉。',
    initiatorPrompt: '用最温柔的语调，看着对方的眼睛开始描述。',
    receiverPrompt: '保持安静注视对方，并在对方说完后给予一个甜甜的微笑。',
    points: 6
  },
  {
    id: 'p1-2',
    phase: 1,
    type: 'action',
    title: '掌心温度',
    content: '伸出双手，十指相扣，保持十秒钟，闭上眼感受彼此掌心的温度和心跳。',
    initiatorPrompt: '主动合上双掌，握紧一些。',
    receiverPrompt: '放松手指，感受对方手指缝隙间的力度。',
    points: 9
  },
  {
    id: 'p1-3',
    phase: 1,
    type: 'topic',
    title: '心动瞬间',
    content: '在过去的一周/一个月里，对方做的哪件不起眼的小事，悄悄拨动了你的心弦？',
    initiatorPrompt: '分享一个细节，并说出当时的内心小剧场。',
    receiverPrompt: '聆听的同时，靠近对方一拳的距离。',
    points: 6
  },
  {
    id: 'p1-4',
    phase: 1,
    type: 'action',
    title: '温柔对视',
    content: '看着对方的瞳孔，不能眨眼，保持 15 秒。期间可以微笑，但不能发出声音。',
    initiatorPrompt: '尝试从对方的眼神中读出两个形容词，事后说出来。',
    receiverPrompt: '注视对方的右眼，体会彼此视线的纠缠。',
    points: 9
  },
  {
    id: 'p1-5',
    phase: 1,
    type: 'game',
    title: '声音催眠',
    content: '凑在对方的耳边，用只有两个人能听到的耳语，说出你最喜欢的对方的一个身体部位。',
    initiatorPrompt: '轻拂对方的耳廓，带一丝温热的气息说出。',
    receiverPrompt: '闭上眼睛，细细品味耳朵触电般的酥麻感。',
    points: 8
  },
  {
    id: 'p1-6',
    phase: 1,
    type: 'topic',
    title: '如果倒流',
    content: '如果我们可以回到相识的第一天，你最想改写哪一个相处的场景？',
    initiatorPrompt: '提出一个你一直渴望拥有的浪漫重来机会。',
    receiverPrompt: '点评对方的设想，并决定是否在未来满足他/她。',
    points: 6
  },

  // =================== PHASE 2: 微醺灼热 (Warming) ===================
  {
    id: 'p2-1',
    phase: 2,
    type: 'action',
    title: '耳畔私语',
    content: '用微弱的气流声，在对方的耳垂后面吹一口气，并轻声叫一声对方的专属昵称。',
    initiatorPrompt: '让嘴唇轻轻掠过对方的耳垂，带出酥麻的震动。',
    receiverPrompt: '深呼吸，双手轻搭在主导方的肩膀或膝盖上。',
    points: 9
  },
  {
    id: 'p2-2',
    phase: 2,
    type: 'action',
    title: '指尖游弋',
    content: '用指尖轻轻划过对方的颈部侧面，沿着锁骨的线条游走一圈，力度保持在像一根羽毛。',
    initiatorPrompt: '眼神专注在指尖落下的皮肤上，缓慢而轻柔。',
    receiverPrompt: '仰起头露出颈部线条，顺着对方的触碰轻轻闭眼。',
    points: 9
  },
  {
    id: 'p2-3',
    phase: 2,
    type: 'topic',
    title: '秘密梦境',
    content: '分享一个最近做过的、关于对方的暧昧或者新奇的梦，如果没有，编造一个合理的渴望。',
    initiatorPrompt: '大方分享，用富有画面感的词汇描述梦里的触感与环境。',
    receiverPrompt: '听完后，给讲梦者一个温柔的脸颊吻。',
    points: 6
  },
  {
    id: 'p2-4',
    phase: 2,
    type: 'action',
    title: '唇畔的呼吸',
    content: '两人的脸部贴近到只有两公分，闭上眼，感受彼此的呼吸，维持 10 秒，但不准嘴唇碰触。',
    initiatorPrompt: '稍微移动一点点，用鼻尖轻轻触碰对方的鼻尖。',
    receiverPrompt: '控制呼吸节奏，细细品味空气微微升温的张力。',
    points: 9
  },
  {
    id: 'p2-5',
    phase: 2,
    type: 'game',
    title: '心跳印记',
    content: '贴近对方的胸膛，倾听彼此的心跳。主导方需要用一只手绕过对方的腰，将对方揽入怀中。',
    initiatorPrompt: '把对方搂得稍微紧一些，不留一丝空隙。',
    receiverPrompt: '侧头倾听，数一下对方的心跳频率大约是多少。',
    points: 8
  },
  {
    id: 'p2-6',
    phase: 2,
    type: 'topic',
    title: '引力法则',
    content: '在约会的时候，哪一瞬间你最想扑进对方的怀里，或者渴望被对方狠狠抱住？',
    initiatorPrompt: '看着对方微湿的嘴唇，轻声说出这个情境。',
    receiverPrompt: '如果可以，现在就给对方一个长达 10 秒的深拥抱。',
    points: 6
  },

  // =================== PHASE 3: 沸腾高潮 (Climax) ===================
  {
    id: 'p3-1',
    phase: 3,
    type: 'action',
    title: '炽热封锁',
    content: '挑选对方身上你最迷恋的一个部分（如嘴角、颈窝或下巴），轻轻落下一个维持 5 秒以上的温暖之吻。',
    initiatorPrompt: '闭上眼睛，带着深情与侵略性去触碰。',
    receiverPrompt: '将双手轻轻没入对方的发梢，回应这份温存。',
    points: 9
  },
  {
    id: 'p3-2',
    phase: 3,
    type: 'play',
    title: '盲盒感官',
    content: '配合方闭上眼睛。主导方用手指轻抚配合方脸上或者手上的任何地方，配合方需猜出主导方使用的是手指的哪个部位（或哪个关节）。',
    initiatorPrompt: '可以使用指甲、指背或者温热的侧面来增加迷惑度。',
    receiverPrompt: '屏蔽视觉，将注意力完全倾注在被触碰的微小局域。',
    points: 10
  },
  {
    id: 'p3-3',
    phase: 3,
    type: 'action',
    title: '颈间温度',
    content: '主导方俯下身，在配合方的耳后锁骨三角区轻轻呵一口热气，并用双唇微触那里的皮肤。',
    initiatorPrompt: '触碰后，轻声耳语：“你现在，心跳好快”。',
    receiverPrompt: '双手撑在两侧，放松颈部线条，全心感受灼热的气息。',
    points: 9
  },
  {
    id: 'p3-4',
    phase: 3,
    type: 'topic',
    title: '私密探寻',
    content: '如果今晚有且仅有一次无拘无束的探索机会，你最渴望对方为你尝试什么样的动作或姿态？',
    initiatorPrompt: '抛开所有顾虑，用最真诚、带着火花的炽热眼神说出来。',
    receiverPrompt: '诚实回答对方，如果可以接受，拉住对方的手握一下。',
    points: 6
  },
  {
    id: 'p3-5',
    phase: 3,
    type: 'play',
    title: '缠绕领地',
    content: '双脚自然交叉，主导方扶住配合方的后腰，让彼此的额头紧贴在一起，用几乎重合的口吻轻声说：“今晚，听你的”。',
    initiatorPrompt: '眼神要带有统治感，指尖在后腰微微施力。',
    receiverPrompt: '直视迎上对方的目光，不闪不躲，感受彼此升高的荷尔蒙。',
    points: 10
  }
];

export const CARDS_POOL: Card[] = [...BASE_CARDS_POOL, ...FEISHU_CARDS];

const BASE_PENALTY_POOL: PenaltyTask[] = [
  { id: 'pen-1', text: '两人各自端起酒杯，深情对视并喝下一小口（或果汁、饮料）。' },
  { id: 'pen-2', text: '认罚者用小拇指在对方掌心轻轻画三个圆圈，再让对方猜最后停在哪个位置。' },
  { id: 'pen-3', text: '认罚者双手环抱对方，在对方背后盲写一个字，让对方猜。' },
  { id: 'pen-4', text: '用额头轻轻贴着对方额头保持 8 秒，期间双方闭上眼。' },
  { id: 'pen-5', text: '喂对方喝一口水或酒，动作必须慢一点、温柔一点。' },
  { id: 'pen-6', text: '认罚者闭眼 10 秒，由对方决定一个轻柔的靠近动作。' },
  { id: 'pen-7', text: '认罚者用一句只属于今晚的称呼叫对方，并保持对视 5 秒。' },
  { id: 'pen-8', text: '认罚者把手交给对方，由对方牵住并决定保持多久，最长不超过 15 秒。' }
];

export const PENALTY_POOL: PenaltyTask[] = [...BASE_PENALTY_POOL, ...FEISHU_PENALTIES];
