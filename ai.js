const AIGenerator = (function() {
    const SYSTEM_PROMPT = `你是一个专业的图表生成助手。你的任务是将用户描述的内容转换为结构化的 JSON 数据，用于绘制各种类型的图表。

## 输出要求
你必须且只能输出一个有效的 JSON 对象，不要包含任何其他文字、解释或 markdown 代码块标记。

## JSON 格式规范
{
  "nodes": [
    {
      "id": "唯一标识符",
      "text": "显示的文字",
      "type": "形状类型",
      "x": x坐标(可选,会自动布局),
      "y": y坐标(可选,会自动布局),
      "width": 宽度(可选),
      "height": 高度(可选),
      "fillColor": "填充颜色(可选,如#4A90D9)",
      "label": "标签文字(可选)"
    }
  ],
  "edges": [
    {
      "from": "起始节点id",
      "to": "目标节点id",
      "label": "连线标签(可选)",
      "style": "连线样式(可选: solid/dashed/curved)"
    }
  ],
  "diagramType": "图表类型(可选: flowchart/diagram/illustration)"
}

## 形状类型说明

### 流程图形状
- "start": 开始/结束节点（椭圆形）
- "process": 处理过程（矩形）
- "decision": 判断/分支（菱形）
- "data": 数据输入/输出（平行四边形）

### 基础形状
- "circle": 圆形
- "rectangle": 矩形
- "triangle": 三角形
- "star": 星形

### 自然元素（用于科学图示）
- "sun": 太阳 ☀
- "cloud": 云朵 ☁
- "leaf": 叶子 🍃
- "drop": 水滴 💧

### 生物相关
- "cell": 细胞
- "bacteria": 细菌
- "dna": DNA
- "heart": 心脏 ♥

### 绘图元素
- "arrow": 箭头
- "line": 直线
- "text": 纯文本框

## 图表类型说明
- "flowchart": 流程图（默认）
- "diagram": 示意图（如光合作用图、水循环图）
- "illustration": 插图（更自由的布局）

## 示例1：用户登录流程图
用户输入：用户登录流程，输入账号密码后验证，成功则进入首页，失败则提示错误

输出：
{
  "diagramType": "flowchart",
  "nodes": [
    {"id": "1", "text": "开始", "type": "start"},
    {"id": "2", "text": "输入账号密码", "type": "data"},
    {"id": "3", "text": "验证", "type": "process"},
    {"id": "4", "text": "验证成功?", "type": "decision"},
    {"id": "5", "text": "进入首页", "type": "process"},
    {"id": "6", "text": "提示错误", "type": "process"},
    {"id": "7", "text": "结束", "type": "start"}
  ],
  "edges": [
    {"from": "1", "to": "2"},
    {"from": "2", "to": "3"},
    {"from": "3", "to": "4"},
    {"from": "4", "to": "5", "label": "是"},
    {"from": "4", "to": "6", "label": "否"},
    {"from": "5", "to": "7"},
    {"from": "6", "to": "2"}
  ]
}

## 示例2：光合作用示意图
用户输入：画一个光合作用过程示意图

输出：
{
  "diagramType": "diagram",
  "nodes": [
    {"id": "1", "text": "太阳", "type": "sun", "fillColor": "#FFFFFF"},
    {"id": "2", "text": "阳光", "type": "arrow"},
    {"id": "3", "text": "叶片", "type": "leaf", "fillColor": "#333333"},
    {"id": "4", "text": "二氧化碳\\nCO₂", "type": "text", "fillColor": "#2A2A2A"},
    {"id": "5", "text": "水\\nH₂O", "type": "drop", "fillColor": "#2A2A2A"},
    {"id": "6", "text": "氧气\\nO₂", "type": "text", "fillColor": "#333333"},
    {"id": "7", "text": "葡萄糖", "type": "text", "fillColor": "#3A3A3A"},
    {"id": "8", "text": "叶绿体", "type": "cell", "fillColor": "#3A3A3A"}
  ],
  "edges": [
    {"from": "1", "to": "2"},
    {"from": "2", "to": "3"},
    {"from": "4", "to": "3"},
    {"from": "5", "to": "3"},
    {"from": "3", "to": "6"},
    {"from": "3", "to": "7"}
  ]
}

## 示例3：太阳系行星分布
用户输入：画一个太阳系行星分布图

输出：
{
  "diagramType": "illustration",
  "nodes": [
    {"id": "sun", "text": "太阳", "type": "sun", "fillColor": "#FFFFFF", "width": 80, "height": 80},
    {"id": "mercury", "text": "水星", "type": "circle", "fillColor": "#555555", "width": 20, "height": 20},
    {"id": "venus", "text": "金星", "type": "circle", "fillColor": "#444444", "width": 30, "height": 30},
    {"id": "earth", "text": "地球", "type": "circle", "fillColor": "#333333", "width": 32, "height": 32},
    {"id": "mars", "text": "火星", "type": "circle", "fillColor": "#4A4A4A", "width": 24, "height": 24},
    {"id": "jupiter", "text": "木星", "type": "circle", "fillColor": "#3A3A3A", "width": 60, "height": 60},
    {"id": "saturn", "text": "土星", "type": "circle", "fillColor": "#5A5A5A", "width": 50, "height": 50},
    {"id": "uranus", "text": "天王星", "type": "circle", "fillColor": "#2A2A2A", "width": 36, "height": 36},
    {"id": "neptune", "text": "海王星", "type": "circle", "fillColor": "#222222", "width": 34, "height": 34}
  ],
  "edges": []
}

## 注意事项
1. 根据用户描述选择合适的图表类型
2. 科学图示优先使用自然元素和生物形状
3. 节点文字要简洁，可以用\\n换行
4. 使用黑白色调：#1A1A1A, #222222, #2A2A2A, #333333, #444444, #555555, #666666, #FFFFFF
5. 确保所有 edges 中引用的节点 id 都存在于 nodes 中
6. 对于示意图，可以省略部分连线，让布局更清晰`;

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const PROXY_ENDPOINT = isLocalhost 
        ? 'http://localhost:8787' 
        : '/api/proxy';

    async function generate(userPrompt, settings, documentContent = null) {
        let fullPrompt = userPrompt;
        
        if (documentContent) {
            fullPrompt = `请根据以下文档内容生成图表：

文档内容：
${documentContent}

用户要求：${userPrompt || '根据文档内容生成合适的图表'}`;
        }

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: fullPrompt }
        ];

        let response;

        if (settings.aiMode === 'builtin') {
            response = await callBuiltinAPI(messages);
        } else {
            response = await callCustomAPI(messages, settings);
        }

        return parseAIResponse(response);
    }

    async function callBuiltinAPI(messages) {
        const response = await fetch(PROXY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
                temperature: 0.7,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API 请求失败: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    async function callCustomAPI(messages, settings) {
        if (!settings.apiEndpoint) {
            throw new Error('请先配置 API 端点');
        }
        if (!settings.apiKey) {
            throw new Error('请先配置 API Key');
        }

        const requestBody = {
            model: settings.modelName || 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.7,
            max_tokens: 3000
        };

        const response = await fetch(settings.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API 请求失败: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    function parseAIResponse(response) {
        try {
            let content = response.choices[0].message.content;
            
            content = content.trim();
            
            if (content.startsWith('```json')) {
                content = content.slice(7);
            } else if (content.startsWith('```')) {
                content = content.slice(3);
            }
            if (content.endsWith('```')) {
                content = content.slice(0, -3);
            }
            content = content.trim();

            const parsed = JSON.parse(content);

            if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
                throw new Error('缺少 nodes 数组');
            }
            if (!parsed.edges || !Array.isArray(parsed.edges)) {
                parsed.edges = [];
            }

            parsed.nodes = parsed.nodes.map((node, index) => ({
                id: node.id || String(index + 1),
                text: node.text || node.label || node.name || '',
                type: normalizeNodeType(node.type),
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
                fillColor: node.fillColor || node.color,
                strokeColor: node.strokeColor,
                textColor: node.textColor,
                label: node.label
            }));

            parsed.edges = parsed.edges.map(edge => ({
                from: edge.from || edge.source || edge.start,
                to: edge.to || edge.target || edge.end,
                label: edge.label || edge.text || '',
                style: edge.style || 'solid'
            }));

            return parsed;
        } catch (error) {
            console.error('Parse error:', error);
            console.error('Response:', response);
            throw new Error('AI 返回的数据格式解析失败，请重试');
        }
    }

    function normalizeNodeType(type) {
        if (!type) return 'process';
        
        const typeMap = {
            'start': 'start',
            'end': 'start',
            'begin': 'start',
            '开始': 'start',
            '结束': 'start',
            'process': 'process',
            'operation': 'process',
            'action': 'process',
            '处理': 'process',
            '操作': 'process',
            'step': 'process',
            'decision': 'decision',
            'condition': 'decision',
            '判断': 'decision',
            '条件': 'decision',
            'branch': 'decision',
            'data': 'data',
            'input': 'data',
            'output': 'data',
            '数据': 'data',
            '输入': 'data',
            '输出': 'data',
            'circle': 'circle',
            '圆形': 'circle',
            'oval': 'circle',
            'rectangle': 'rectangle',
            'rect': 'rectangle',
            '矩形': 'rectangle',
            'box': 'rectangle',
            'triangle': 'triangle',
            '三角形': 'triangle',
            'star': 'star',
            '星形': 'star',
            'sun': 'sun',
            '太阳': 'sun',
            'cloud': 'cloud',
            '云': 'cloud',
            '云朵': 'cloud',
            'leaf': 'leaf',
            '叶子': 'leaf',
            '叶片': 'leaf',
            'drop': 'drop',
            '水滴': 'drop',
            'water': 'drop',
            'cell': 'cell',
            '细胞': 'cell',
            'bacteria': 'bacteria',
            '细菌': 'bacteria',
            'dna': 'dna',
            'DNA': 'dna',
            'heart': 'heart',
            '心脏': 'heart',
            'arrow': 'arrow',
            '箭头': 'arrow',
            'line': 'line',
            '直线': 'line',
            'text': 'text',
            '文本': 'text',
            'label': 'text'
        };

        const normalized = type.toLowerCase().trim();
        return typeMap[normalized] || typeMap[type] || 'process';
    }

    return {
        generate
    };
})();