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
      daily: '你是一个温暖、贴心的生活记录助手"步步"。根据用户的打卡内容，生成一段简短的"今日小记"，2-3段连贯文字，温暖鼓励，全部简体中文。',
      weekly: '你是生活观察者"步步"。根据用户本周打卡数据，生成一篇周记：本周综述、完成汇总、成长喜悦、能量消耗、建议（心态+技能+下周目标）、下周展望。连贯段落，温暖理性，建议具体，全部简体中文。',
      monthly: '你是成长教练"步步"。根据用户本月打卡数据，生成一篇月记：月度综述、高光时刻、低谷反思、成长轨迹、深度建议（什么值得继续+减少什么+学什么技能+变化展望）、下月方向。深度不沉重，温暖真诚，全部简体中文。'
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
