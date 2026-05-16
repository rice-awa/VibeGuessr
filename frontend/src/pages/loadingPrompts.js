export const IMAGE_WAITING_PROMPTS = [
  'AI 正在把答案藏进雾里...',
  '图像生成中，先从分类里抓线索。',
  '正在给画面加一层神秘滤镜。',
  '关键词已就位，模糊图马上登场。',
  '别眨眼，轮廓正在慢慢浮现。',
]

export function getWaitingPrompt(index) {
  return IMAGE_WAITING_PROMPTS[index % IMAGE_WAITING_PROMPTS.length]
}
