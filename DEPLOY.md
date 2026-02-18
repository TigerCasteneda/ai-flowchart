# 部署指南

## 项目结构

```
ai-flowchart/
├── index.html
├── style.css
├── app.js
├── ai.js
├── functions/                 # Cloudflare Pages Functions
│   └── api/
│       └── proxy.js          # 后端代理 (隐藏 API Key)
├── worker/                    # 独立 Worker 版本 (可选)
│   ├── index.js
│   └── package.json
└── wrangler.toml             # Worker 配置
```

## 最简单部署方式: Cloudflare Pages Functions

### 1. 安装 wrangler

```powershell
npm install -g wrangler
```

### 2. 登录 Cloudflare

```powershell
wrangler login
```

### 3. 部署

```powershell
cd ai-flowchart
wrangler pages deploy . --project-name=ai-flowchart
```

### 4. 设置环境变量 (重要!)

部署完成后，在 Cloudflare Dashboard 设置 API Key:

1. 进入 **Pages** -> 你的项目 -> **Settings** -> **Environment variables**
2. 添加变量:
   - 名称: `OPENROUTER_API_KEY`
   - 值: `sk-or-v1-你的-api-key`
   - 勾选 "Encrypt"
3. 重新部署一次生效

## 本地开发

### 方式 1: 使用 Pages Functions 本地开发

```powershell
cd ai-flowchart

# 创建 .dev.vars 文件存放本地密钥
echo OPENROUTER_API_KEY=sk-or-v1-xxx... > .dev.vars

# 启动 Pages 开发服务器
wrangler pages dev .
```

访问 `http://localhost:8788`

### 方式 2: 分别运行 Worker 和前端

终端1 - 启动前端:
```powershell
cd ai-flowchart
python -m http.server 8080
```

终端2 - 启动 Worker:
```powershell
cd ai-flowchart
wrangler pages dev .
```

访问 `http://localhost:8788`

## 获取 OpenRouter API Key

1. 访问 https://openrouter.ai
2. 注册/登录
3. 进入 **Settings** -> **API Keys**
4. 创建新的 Key

## 注意事项

- **不要**把 `.dev.vars` 文件提交到 Git
- 环境变量必须在 Cloudflare Dashboard 设置才会在生产环境生效
- 修改环境变量后需要重新部署
