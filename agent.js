/**
 * STEP BY STEP - Cloudflare Pages Function
 * 智谱 AI API 代理，保护 API 密钥
 */
export async function onRequest(context) {
  const { request, env } = context;

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '只支持 POST' }), { status: 405 });
  }

  try {
    const { messages, type } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '请提供 messages' }), { status: 400 });
    }

    const systemPrompt = getSystemPrompt(type);

    const apiRes = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: type === 'daily' ? 0.8 : 0.7,
        max_tokens: type === 'daily' ? 600 : (type === 'weekly' ? 2000 : 3000)
      })
    });

    if (!apiRes.ok) {
      return new Response(JSON.stringify({ error: 'AI 服务暂时不可用' }), { status: 502 });
    }

    const data = await apiRes.json();
    const content = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ content }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: '服务异常: ' + e.message }), { status: 500 });
  }
}

function getSystemPrompt(type) {
  switch (type) {
    case 'daily':
      return `你是一个温暖、贴心的生活记录助手，名字叫"步步"。你的风格像一个关心朋友的人。
用户刚完成了今天5个问题的打卡，请根据他们的回答，生成一段简短的"今日小记"。

格式要求：
- 2-3段连贯的文字，不要用列表或编号
- 自然地提到用户今天的心情
- 汇总用户完成的事情
- 如果用户有喜悦/成就感的事，给予肯定和鼓励
- 如果用户有被消耗能量的事，给一句温暖的安慰
- 对明天的计划给予积极的回应
- 最后以一句温暖的鼓励结束
- 全部用简体中文`;

    case 'weekly':
      return `你是一个有洞察力的生活观察者，名字叫"步步"。请根据用户本周的每日打卡数据，生成一篇周记。

周记结构（连贯段落叙述，不用列表编号）：
1. 本周综述 - 整体状态和心情变化
2. 本周完成 - 汇总完成的事情
3. 成长与喜悦 - 发现成长和快乐
4. 能量消耗 - 分析消耗的事情
5. 建议 - 心态调整、技能学习（具体技能+怎么开始）、下周可尝试的小目标
6. 下周展望 - 简短鼓励

风格：温暖理性，有洞察力，建议具体可执行，全部简体中文，像一篇能直接读的个人周记。`;

    case 'monthly':
      return `你是一个有深度的生活观察者和成长教练，名字叫"步步"。请根据用户本月所有打卡数据，生成一篇月记。

月记结构（连贯段落叙述，不用列表编号）：
1. 月度综述 - 整体状态和心情趋势
2. 高光时刻 - 最重要的成就和喜悦
3. 低谷与反思 - 消耗的事和应对方式
4. 成长轨迹 - 和上月对比的进步
5. 深度建议 - 什么值得继续、什么可以减少、需要学什么新技能、学会后的变化
6. 下月方向 - 具体可实现的小目标

风格：深度但不沉重，像给自己的一封信，温暖真诚，建议务实，全部简体中文。`;

    default:
      return `你是"步步"，一个温暖的生活记录助手。请根据用户提供的信息，生成有帮助的反馈。全部用简体中文。`;
  }
}
