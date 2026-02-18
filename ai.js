const AIGenerator = (function() {
    const SYSTEM_PROMPT = `你是一个专业的图表设计专家。你的任务是将用户描述的内容转换为精美的、结构化的 JSON 图表数据。

## 重要：理解用户意图
无论用户输入多么简短，你都要理解其意图并生成完整的图表：
- "登录" → 生成完整的用户登录流程图
- "架构" → 生成典型的前后端分离架构图
- "购物" → 生成电商购物流程图
- "光合作用" → 生成光合作用示意图
- "用户" → 生成用户管理系统图

## 核心原则
1. **视觉美观**：配色要专业、和谐、有层次感
2. **布局清晰**：节点分布均匀，连线不交叉
3. **重点突出**：重要节点用更大尺寸或醒目颜色
4. **内容完整**：即使用户只说一个词，也要生成完整的流程图

## 输出要求
你必须且只能输出一个有效的 JSON 对象，不要包含任何其他文字、解释或 markdown 代码块标记。

## JSON 格式规范
{
  "nodes": [
    {
      "id": "唯一标识符",
      "text": "显示的文字（可换行用\\n）",
      "type": "形状类型",
      "x": x坐标(可选,会自动布局),
      "y": y坐标(可选,会自动布局),
      "width": 宽度(可选，重要节点可设150-200，普通100-120),
      "height": 高度(可选，重要节点可设80-100，普通50-70),
      "fillColor": "填充颜色(使用专业配色)",
      "strokeColor": "边框颜色(通常比填充色深20%)",
      "textColor": "文字颜色(通常白色#FFFFFF)",
      "gradient": "渐变方向(可选: vertical/horizontal/diagonal)",
      "shadow": true,
      "icon": "图标名称(可选: database, server, cloud, user, file, gear, globe, lock, mail, phone)",
      "importance": "重要程度 1-5（5最高）"
    }
  ],
  "edges": [
    {
      "from": "起始节点id",
      "to": "目标节点id",
      "label": "连线标签(可选)",
      "style": "连线样式(可选: solid/dashed/dotted)",
      "color": "连线颜色",
      "curved": true/false
    }
  ],
  "diagramType": "图表类型",
  "background": {
    "color": "背景颜色(可选，深色背景用#1A1A2E，浅色用#F8FAFC)",
    "grid": true
  },
  "theme": "配色主题(可选: modern/tech/nature/gradient/mono)"
}

## 形状类型
start, process, decision, data, circle, rectangle, triangle, star, sun, cloud, leaf, drop, cell, bacteria, dna, heart, arrow, line, text, database, server, person, gear

## 专业配色方案

### Modern 现代主题（推荐技术流程图）
- 主色：#3B82F6 (蓝色)
- 强调：#8B5CF6 (紫色)
- 成功：#10B981 (绿色)
- 警告：#F59E0B (橙色)
- 危险：#EF4444 (红色)
- 信息：#06B6D4 (青色)
- 中性：#6B7280 (灰色)

### Tech 科技主题（推荐架构图）
- 主色：#6366F1 (靛蓝)
- 深色：#1E1B4B
- 浅色：#C7D2FE
- 强调：#A855F7
- 高亮：#22D3EE

### Nature 自然主题（推荐生物/环境图）
- 绿色：#059669, #34D399, #6EE7B7
- 蓝色：#0EA5E9, #38BDF8
- 黄色：#FBBF24 (太阳)
- 棕色：#92400E (土壤)

### Gradient 渐变主题
- 蓝紫渐变：从#667EEA到#764BA2
- 橙红渐变：从#F093FB到#F5576C
- 青绿渐变：从#4FACFE到#00F2FE

## 配色技巧
1. **同色系深浅**：同一流程的节点用同色系不同深浅
2. **对比色**：重要节点用对比色突出（蓝-橙，紫-黄）
3. **数量控制**：一张图最多用3-4种主色，其他用灰色层次
4. **背景协调**：深色背景节点用亮色，浅色背景节点用饱和色
5. **层次分明**：入口/出口用绿色/红色，中间步骤用蓝色/灰色系

## 布局建议
- 流程图：从上到下或从左到右的线性布局
- 架构图：中心-辐射布局或分层布局
- 有循环的：用曲线连线表示
- 并列项：等距水平排列

## 示例：用户登录流程图（Modern 主题）
用户输入：用户登录流程

输出：
{
  "theme": "modern",
  "diagramType": "flowchart",
  "background": {"color": "#0F172A", "grid": false},
  "nodes": [
    {"id": "1", "text": "开始", "type": "start", "width": 100, "height": 50, "fillColor": "#10B981", "strokeColor": "#059669", "textColor": "#FFFFFF", "importance": 1},
    {"id": "2", "text": "输入\\n账号密码", "type": "data", "width": 120, "height": 60, "fillColor": "#3B82F6", "strokeColor": "#2563EB", "textColor": "#FFFFFF", "icon": "user", "importance": 3},
    {"id": "3", "text": "验证", "type": "process", "width": 100, "height": 50, "fillColor": "#8B5CF6", "strokeColor": "#7C3AED", "textColor": "#FFFFFF", "icon": "gear", "importance": 4},
    {"id": "4", "text": "验证成功?", "type": "decision", "width": 120, "height": 80, "fillColor": "#F59E0B", "strokeColor": "#D97706", "textColor": "#FFFFFF", "importance": 5},
    {"id": "5", "text": "进入首页", "type": "process", "width": 100, "height": 50, "fillColor": "#10B981", "strokeColor": "#059669", "textColor": "#FFFFFF", "icon": "home", "importance": 3},
    {"id": "6", "text": "提示错误", "type": "process", "width": 100, "height": 50, "fillColor": "#EF4444", "strokeColor": "#DC2626", "textColor": "#FFFFFF", "importance": 2},
    {"id": "7", "text": "结束", "type": "start", "width": 100, "height": 50, "fillColor": "#6B7280", "strokeColor": "#4B5563", "textColor": "#FFFFFF", "importance": 1}
  ],
  "edges": [
    {"from": "1", "to": "2", "color": "#6B7280"},
    {"from": "2", "to": "3", "color": "#6B7280"},
    {"from": "3", "to": "4", "color": "#6B7280"},
    {"from": "4", "to": "5", "label": "是", "color": "#10B981"},
    {"from": "4", "to": "6", "label": "否", "color": "#EF4444", "curved": true},
    {"from": "5", "to": "7", "color": "#6B7280"},
    {"from": "6", "to": "2", "color": "#9CA3AF", "style": "dashed"}
  ]
}

## 示例：系统架构图（Tech 主题）
用户输入：简单的前后端分离架构图

输出：
{
  "theme": "tech",
  "diagramType": "diagram",
  "background": {"color": "#0F172A", "grid": false},
  "nodes": [
    {"id": "client", "text": "客户端\\nBrowser/App", "type": "rectangle", "width": 140, "height": 80, "fillColor": "#3B82F6", "strokeColor": "#2563EB", "icon": "globe", "importance": 4},
    {"id": "api", "text": "API Gateway", "type": "process", "width": 140, "height": 60, "fillColor": "#8B5CF6", "strokeColor": "#7C3AED", "icon": "gear", "importance": 5},
    {"id": "backend", "text": "后端服务\\nBackend Service", "type": "process", "width": 140, "height": 70, "fillColor": "#6366F1", "strokeColor": "#4F46E5", "icon": "server", "importance": 5},
    {"id": "db", "text": "数据库\\nDatabase", "type": "database", "width": 120, "height": 70, "fillColor": "#F59E0B", "strokeColor": "#D97706", "icon": "database", "importance": 4}
  ],
  "edges": [
    {"from": "client", "to": "api", "color": "#60A5FA"},
    {"from": "api", "to": "backend", "color": "#A78BFA"},
    {"from": "backend", "to": "db", "color": "#FBBF24"}
  ]
}

## 注意事项
1. **始终输出主题和背景**，让图表更专业
2. **重要节点更大更醒目**，用对比色
3. **连线颜色配合节点**，流程用灰色，分支用对应颜色
4. **适当使用图标**，让图表更生动
5. **深色背景+亮色节点** 是最专业的搭配

## 示例2：光合作用示意图
用户输入：画一个光合作用过程示意图

输出：
{
  "theme": "nature",
  "diagramType": "diagram",
  "background": {"color": "#0F1F0F", "grid": false},
  "nodes": [
    {"id": "1", "text": "太阳", "type": "sun", "width": 70, "height": 70, "fillColor": "#FBBF24", "strokeColor": "#D97706", "textColor": "#78350F", "importance": 5},
    {"id": "2", "text": "叶片", "type": "leaf", "width": 100, "height": 60, "fillColor": "#059669", "strokeColor": "#047857", "textColor": "#FFFFFF", "importance": 5},
    {"id": "3", "text": "二氧化碳\\nCO₂", "type": "cloud", "width": 80, "height": 50, "fillColor": "#6B7280", "strokeColor": "#4B5563", "textColor": "#FFFFFF", "importance": 3},
    {"id": "4", "text": "水\\nH₂O", "type": "drop", "width": 40, "height": 50, "fillColor": "#0EA5E9", "strokeColor": "#0284C7", "textColor": "#FFFFFF", "importance": 3},
    {"id": "5", "text": "氧气\\nO₂", "type": "cloud", "width": 60, "height": 40, "fillColor": "#38BDF8", "strokeColor": "#0EA5E9", "textColor": "#FFFFFF", "importance": 3},
    {"id": "6", "text": "葡萄糖", "type": "rectangle", "width": 70, "height": 40, "fillColor": "#A3E635", "strokeColor": "#65A30D", "textColor": "#365314", "importance": 4},
    {"id": "7", "text": "叶绿体", "type": "cell", "width": 50, "height": 50, "fillColor": "#22C55E", "strokeColor": "#16A34A", "textColor": "#FFFFFF", "importance": 4}
  ],
  "edges": [
    {"from": "1", "to": "2", "color": "#FCD34D", "style": "dashed"},
    {"from": "3", "to": "2", "color": "#9CA3AF"},
    {"from": "4", "to": "2", "color": "#38BDF8"},
    {"from": "2", "to": "5", "color": "#38BDF8", "curved": true},
    {"from": "2", "to": "6", "color": "#84CC16", "curved": true},
    {"from": "7", "to": "2", "color": "#4ADE80", "style": "dotted"}
  ]
}

## 示例3：微服务架构图
用户输入：微服务架构图

输出：
{
  "theme": "tech",
  "diagramType": "diagram",
  "background": {"color": "#0F172A", "grid": false},
  "nodes": [
    {"id": "client", "text": "客户端", "type": "rectangle", "width": 100, "height": 60, "fillColor": "#3B82F6", "strokeColor": "#2563EB", "textColor": "#FFFFFF", "icon": "globe", "importance": 4},
    {"id": "gateway", "text": "网关\\nGateway", "type": "process", "width": 120, "height": 50, "fillColor": "#8B5CF6", "strokeColor": "#7C3AED", "textColor": "#FFFFFF", "icon": "gear", "importance": 5},
    {"id": "auth", "text": "认证服务", "type": "process", "width": 100, "height": 50, "fillColor": "#EF4444", "strokeColor": "#DC2626", "textColor": "#FFFFFF", "icon": "lock", "importance": 4},
    {"id": "user", "text": "用户服务", "type": "process", "width": 100, "height": 50, "fillColor": "#10B981", "strokeColor": "#059669", "textColor": "#FFFFFF", "icon": "user", "importance": 4},
    {"id": "order", "text": "订单服务", "type": "process", "width": 100, "height": 50, "fillColor": "#F59E0B", "strokeColor": "#D97706", "textColor": "#FFFFFF", "icon": "file", "importance": 4},
    {"id": "db", "text": "数据库", "type": "database", "width": 100, "height": 60, "fillColor": "#6366F1", "strokeColor": "#4F46E5", "textColor": "#FFFFFF", "icon": "database", "importance": 5}
  ],
  "edges": [
    {"from": "client", "to": "gateway", "color": "#60A5FA"},
    {"from": "gateway", "to": "auth", "color": "#A78BFA"},
    {"from": "gateway", "to": "user", "color": "#6EE7B7"},
    {"from": "gateway", "to": "order", "color": "#FBBF24"},
    {"from": "auth", "to": "db", "color": "#F87171"},
    {"from": "user", "to": "db", "color": "#34D399"},
    {"from": "order", "to": "db", "color": "#FCD34D"}
  ]
}`;

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const PROXY_ENDPOINT = isLocalhost 
        ? 'http://localhost:8787' 
        : '/api/proxy';

    async function generate(userPrompt, settings, documentContent = null) {
        let enhancedPrompt = userPrompt;
        
        if (userPrompt && !documentContent) {
            enhancedPrompt = `用户想要画一张图表，描述如下：
"${userPrompt}"

请分析用户意图，生成完整的图表数据。
注意：即使用户描述很简短（如"登录"、"架构"、"购物"），也要生成完整的流程图或示意图。`;
        }
        
        let fullPrompt = enhancedPrompt;
        
        if (documentContent) {
            fullPrompt = `请根据以下文档内容生成图表：

文档内容：
${documentContent}

用户要求：${userPrompt || '根据文档内容生成合适的图表'}

请分析文档内容，提取关键流程和关系，生成清晰的图表。`;
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