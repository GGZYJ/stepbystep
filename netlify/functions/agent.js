/**
 * STEP BY STEP - Netlify Function
 * 智谱 AI API 代理
 */
exports.handler = async (event) => {
  // CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: '只支持 POST' }) };
  }

  try {
    const { messages, type } = JSON.parse(event.body);

    const prompts = {
      daily: `你是一个温暖、贴心的生活记录助手，名字叫"步步"。你的风格像一个关心朋友的人。
用户刚完成了今天5个问题的打卡，请根据他们的回答，生成一段简短的"今日小记"。

要求：
- 2-3段连贯的文字，不要用列表或编号
- 自然地提到用户今天的心情
- 汇总用户完成的事情
- 如果用户有喜悦/成就感的事，给予肯定和鼓励
- 如果用户有被消耗能量的事，给一句温暖的安慰
- 对明天的计划给予积极的回应
- 最后以一句温暖的鼓励结束
- 温暖但不煽情，鼓励但不空洞，像朋友聊天一样自然
- 全部用简体中文`,

      weekly: `你是一个有洞察力的生活观察者，名字叫"步步"。请根据用户本周的每日打卡数据，生成一篇周记。

这篇周记是一篇连贯的个人周记，用户可以直接拿去分享或者自己安静翻阅。

结构（用连贯的段落叙述，不要用列表编号）：
1. 本周综述 - 用自然的段落描述本周整体状态和心情变化趋势
2. 本周完成 - 汇总这周完成的事情，像讲故事一样叙述
3. 成长与喜悦 - 从记录中发现用户的成长瞬间和快乐时刻
4. 能量消耗 - 分析消耗用户的事情，温柔地指出模式
5. 给你的建议 - 包含三个方面：
   · 心态上可以怎么调整或者重新看待
   · 如果需要学习什么技能来解决问题，具体是什么技能、怎么开始学
   · 下周可以尝试的1-2个小目标
6. 下周展望 - 简短温暖的鼓励

风格要求：
- 像一篇能直接拿出来读的个人周记
- 连贯的段落叙述，自然流畅，不列编号
- 温暖但理性，有洞察力
- 建议要具体可执行，不说空话
- 全部用简体中文`,

      monthly: `你是一个有深度的生活观察者和成长教练，名字叫"步步"。请根据用户本月的所有打卡数据，生成一篇月记。

这篇月记像是一封写给自己的信，保存下来日后回看自己的成长。

结构（用连贯的段落叙述，不要用列表编号）：
1. 月度综述 - 本月整体状态描述，包括心情趋势和关键数字
2. 高光时刻 - 本月最重要的成就和让你发光的事情
3. 低谷与反思 - 消耗你的事情，以及你是如何应对的
4. 成长轨迹 - 这个月和上个月相比，你在哪里进步了
5. 给你的深度建议：
   · 什么事情值得你继续投入？
   · 什么消耗你可以主动减少或重新看待？
   · 你需要学习什么新技能来突破当前的瓶颈？
   · 学习这些技能后，你的生活/工作可能会发生什么积极的变化？
6. 下月方向 - 1-3个具体的、可实现的小目标

风格要求：
- 深度但不沉重，像给自己的一封信
- 连贯的段落，自然流畅的叙述
- 温暖而真诚
- 建议务实、具体，不喊口号
- 全部用简体中文
- 适合保存下来，日后回看自己的成长`
    };

    const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: prompts[type] || prompts.daily },
          ...messages
        ],
        temperature: type === 'daily' ? 0.8 : 0.7,
        max_tokens: type === 'daily' ? 600 : (type === 'weekly' ? 2000 : 3000)
      })
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ content })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
