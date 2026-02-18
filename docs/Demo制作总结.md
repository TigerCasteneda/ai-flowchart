# Demo 制作总结

## 一、Demo 完成情况

### 1. 实现的核心功能 ✅

| 功能 | 完成度 | 说明 |
|------|--------|------|
| **AI 文字生成图表** | 100% | 输入描述，点击纸飞机按钮即可生成 |
| **文档转图表** | 100% | 支持 .txt/.md/.docx 上传 |
| **基础形状绘制** | 100% | 矩形、圆形、菱形、三角形等 |
| **特殊图形** | 100% | 太阳、云朵、叶子、水滴、心脏等 |
| **节点拖拽移动** | 100% | 鼠标拖拽即可移动节点 |
| **节点连线** | 100% | 连线工具点击两节点创建箭头 |
| **样式调整** | 100% | 颜色、大小、文字可编辑 |
| **导出 PNG/JSON** | 100% | 支持图片和数据导出 |
| **撤销/重做** | 100% | Ctrl+Z / Ctrl+Y |
| **画布缩放** | 100% | 滚轮缩放、平移 |
| **黑白色调主题** | 100% | 整体黑白配色 |
| **网站图标 Favicon** | 100% | 自定义 SVG 图标 |
| **后端 API 代理** | 100% | Cloudflare Functions 隐藏密钥 |

### 2. 未实现的功能及原因

| 功能 | 状态 | 原因 |
|------|------|------|
| 实时协作 | 未实现 | 单人使用为主，复杂度高 |
| 云端存储 | 未实现 | 本地导出已够用 |
| 移动端适配 | 未实现 | 优先桌面端体验 |
| 撤销重做无限历史 | 简化为50步 | 内存优化 |

---

## 二、制作过程中遇到的问题及解决方法

### 问题 1：Canvas 坐标系混乱

**现象**：缩放后鼠标点击位置不对

**原因**：Canvas 缩放和平移后，需要转换坐标

```javascript
// 错误写法
const x = e.clientX;
const y = e.clientY;

// 正确写法 - 需要考虑 pan 和 zoom
const x = (e.clientX - rect.left - panX) / zoom;
const y = (e.clientY - rect.top - panY) / zoom;
```

**解决方法**：
```javascript
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    // 关键：将屏幕坐标转换为画布内部坐标
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    // ...
}
```

---

### 问题 2：AI 返回格式不稳定

**现象**：AI 有时返回带 markdown 代码块的 JSON

```
AI 返回:
```json
{ "nodes": [...] }
```

直接 JSON.parse 会报错
```

**解决方法**：
```javascript
function parseAIResponse(response) {
    let content = response.choices[0].message.content;
    content = content.trim();
    
    // 方法1: 尝试去除 ```json 标记
    if (content.startsWith('```json')) {
        content = content.slice(7);
    }
    if (content.endsWith('```')) {
        content = content.slice(0, -3);
    }
    
    // 方法2: 提取第一个 { } 内容
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd >= 0) {
        content = content.slice(jsonStart, jsonEnd + 1);
    }
    
    return JSON.parse(content);
}
```

---

### 问题 3：节点连线起点终点计算

**现象**：连线总是从节点中心开始，而不是边缘

**解决方法**：计算边缘交点

```javascript
function getNodeEdgePoint(node, angle) {
    const hw = node.width / 2;
    const hh = node.height / 2;
    
    // 圆形
    if (node.type === 'circle' || node.type === 'sun') {
        const r = Math.min(hw, hh);
        return {
            x: node.x + Math.cos(angle) * r,
            y: node.y + Math.sin(angle) * r
        };
    }
    
    // 矩形
    const tanAngle = Math.tan(angle);
    if (Math.abs(tanAngle) <= hh / hw) {
        // 左右边
        if (Math.cos(angle) >= 0) {
            return { x: node.x + hw, y: node.y + hw * tanAngle };
        } else {
            return { x: node.x - hw, y: node.y - hw * tanAngle };
        }
    } else {
        // 上下边
        if (Math.sin(angle) >= 0) {
            return { x: node.x + hh / tanAngle, y: node.y + hh };
        } else {
            return { x: node.x - hh / tanAngle, y: node.y - hh };
        }
    }
}
```

---

### 问题 4：Git 命令引号问题

**现象**：PowerShell 中 `git commit -m "message"` 报错

```
错误: unexpected argument 'commit:' found
```

**解决方法**：使用单引号
```powershell
# 错误
git commit -m "Initial commit"

# 正确
git commit -m 'Initial commit'
```

---

### 问题 5：AI API Key 暴露问题

**现象**：如果直接写在前端代码中，任何人都可以看到

```javascript
// ❌ 危险！任何人都能看到这个 Key
const API_KEY = 'sk-or-v1-xxx';
```

**解决方法**：创建后端代理

```javascript
// ✅ 安全！前端看不到真实 Key
// ai.js
const PROXY_ENDPOINT = '/api/proxy';

// functions/api/proxy.js (Cloudflare Functions)
const response = await fetch(OPENROUTER_API_URL, {
    headers: {
        'Authorization': `Bearer ${context.env.OPENROUTER_API_KEY}`
        // 环境变量在 Cloudflare Dashboard 设置
    }
});
```

---

### 问题 6：docx 文件解析

**现象**：.docx 是压缩包，不是纯文本

**解决方法**：使用 JSZip 解压

```javascript
async function readDocxFile(file) {
    const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3/+esm')).default;
    const zip = await JSZip.loadAsync(fileArrayBuffer);
    // .docx 实际上是个 zip 文件
    const docXml = await zip.file('word/document.xml').async('text');
    // 解析 XML 提取文字
    const text = docXml.replace(/<[^>]+>/g, ' ');
    return text;
}
```

---

## 三、收获与感悟

### 1. 学到的新技术/技能

| 技术/技能 | 掌握程度 | 应用场景 |
|----------|---------|---------|
| **HTML5 Canvas** | 熟练 | 自定义绘图、游戏开发 |
| **AI API 集成** | 熟练 | ChatGPT、Claude 等 API 调用 |
| **Prompt 工程** | 入门 | 引导 AI 输出指定格式 |
| **Cloudflare Functions** | 入门 | 无服务器后端、API 代理 |
| **全栈部署** | 入门 | 从设计到上线完整流程 |
| **Git 版本控制** | 熟练 | 代码管理、团队协作 |

### 2. 对"科技产品落地"的理解

**以前的理解**：
- 以为做个网站就是写 HTML/CSS/JS
- 以为 AI 应用就是调个 API

**现在的理解**：

| 维度 | 学到的东西 |
|------|-----------|
| **产品设计** | 要先调研、再设计，不能上来就写代码 |
| **用户体验** | 纸飞机按钮比"生成"文字按钮更直观 |
| **技术选型** | 简单的工具用简单的技术，不追求高大上 |
| **安全性** | API Key 等敏感信息绝不能放前端 |
| **成本意识** | 免费服务够用就好，不盲目付费 |
| **容错处理** | AI 返回的数据可能各种格式，要健壮解析 |
| **性能优化** | Canvas 渲染要考虑节点数量限制 |

### 3. 最有成就感的时刻

1. **第一次画出图形**：当 Canvas 上出现第一个矩形时
2. **AI 生成第一张流程图**：输入"登录流程"，3秒后出现完整图表
3. **文档转图表成功**：上传一个 .docx，真的能分析内容画图
4. **部署成功**：从 GitHub 推送到 Cloudflare，全球可访问

### 4. 给未来做项目的建议

1. **先画草图再写代码** - 设计阶段很重要
2. **分步实现** - 不要想着一次做完所有功能
3. **善用开源工具** - JSZip、Font Awesome 节省大量时间
4. **善用免费服务** - Cloudflare Pages/Functions 完全够用
5. **多测试边界情况** - AI 返回什么奇怪数据都有可能
6. **写注释** - 过一周自己都忘了当时怎么想的

---

## 四、项目文件清单

```
ai-flowchart/
├── index.html              # 主页面 400 行
├── style.css               # 样式 700+ 行
├── app.js                  # 应用逻辑 1800+ 行
├── ai.js                   # AI 集成 250+ 行
├── functions/
│   └── api/
│       └── proxy.js        # 后端代理 60 行
├── docs/
│   ├── 产品调研文档.md      # 产品调研
│   ├── 产品设计文档.md      # 设计方案
│   ├── 成本预算表.md        # 成本分析
│   └── Demo制作总结.md      # 本文件
├── DEPLOY.md               # 部署指南
├── .gitignore              # Git 配置
└── wrangler.toml           # Worker 配置
```

**代码总行数**：约 3500+ 行

---

## 五、总结

这个项目从"想做一个类似 Next AI Draw.io 的工具"开始，经历了：

1. **调研阶段** - 了解 Next AI Draw.io 的核心功能和技术
2. **设计阶段** - 确定简化方案，选择原生 JS + Canvas
3. **实现阶段** - 逐步完成绘图、交互、AI 集成
4. **优化阶段** - 添加后端代理、调整主题
5. **部署阶段** - 推送到 GitHub、部署到 Cloudflare

整个过程大约 **15-20 小时**，完成了一个**功能完整、可实际使用**的 AI 绘图工具。

**最大的收获**：原来"AI 应用"并不遥远，只要掌握基本的前端知识 + API 调用能力，就能做出有用的工具！

**下一步计划**：
- 添加更多形状
- 优化移动端体验
- 添加中文语音输入
- 尝试接入更多免费 AI 模型
