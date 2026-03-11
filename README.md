# beisi-start

一个基于 Node.js + Express（后端）和原生 HTML/CSS/JavaScript（前端）的**前后端分离登录系统**。  
前端只负责 UI 和交互，通过 HTTP 调用后端 `/api/login` 接口完成用户名/密码校验并获取模拟 Token（UUID）。

---

## 技术栈

- **前端**：原生 HTML + CSS + JavaScript（无框架）
- **后端**：Node.js 18+、Express、cors、helmet
- **数据存储**：无数据库，账号密码硬编码在内存中（题目要求）

---

## 功能说明

### 前端

- 登录页：
  - 输入框：用户名、密码
  - 登录按钮
- 交互体验：
  - 基本校验：用户名/密码不能为空
  - Loading：登录中禁用按钮并显示“登录中…”
  - 登录成功：显示“欢迎，用户名”
  - 登录失败：展示后端返回的错误提示（如“Invalid username or password”）
  - 退出登录：清空表单、隐藏欢迎区并聚焦到用户名输入框
- Token 处理（演示）：
  - 登录成功后，将后端返回的 `token` 存入 `localStorage`
  - 出于安全与题目要求考虑：**不在页面明文展示 token、也不会自动从 localStorage 恢复“已登录 UI”**

### 后端

- 提供登录接口：`POST /api/login`
- 接口行为：
  - 接收 JSON 请求体 `{ "username": string, "password": string }`
  - 校验账号密码是否正确（硬编码账号：`admin` / `123456`）
  - 正确时返回：

    ```json
    {
      "code": 0,
      "message": "Login successful",
      "data": {
        "token": "UUID"
      }
    }
    ```

  - 错误时返回：

    ```json
    {
      "code": 1,
      "message": "Invalid username or password",
      "data": null
    }
    ```

- 额外接口：`GET /api/health`  
  返回服务健康状态，方便部署和排查。

---

## 本地运行

### 1. 启动后端（server）

```bash
cd server
npm install
npm run start
```

- 默认监听：`http://localhost:3000`
- 可用接口：
  - `GET /api/health`
  - `POST /api/login`

### 2. 启动前端（web）

前端是静态页面，可用任意静态服务器，这里使用 `http-server` 示例：

```bash
# 在项目根目录
npx --yes http-server web -p 8080 -c-1
```

打开浏览器访问：

```text
http://localhost:8080
```

---

## 登录接口文档

- **URL**：`/api/login`
- **Method**：`POST`
- **Content-Type**：`application/json`

### 请求参数

| 字段名   | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| username | string | 是   | 用户名 |
| password | string | 是   | 密码   |

### 账号密码（硬编码）

- 用户名：`admin`
- 密码：`123456`

### 成功响应示例

```json
{
  "code": 0,
  "message": "Login successful",
  "data": {
    "token": "abcdef123456"
  }
}
```

### 失败响应示例

```json
{
  "code": 1,
  "message": "Invalid username or password",
  "data": null
}
```

说明：

- `code`：`0` 表示成功，`1` 表示失败
- `message`：提示信息
- `data.token`：登录成功后的模拟 Token（本项目使用 UUID，每次登录随机生成）

---

## 安全与防护

虽为练习项目，但在后端做了基础安全加固，便于面试讲解：

- 使用 **helmet** 设置常见安全响应头（XSS、点击劫持等基础防护）
- 限制 JSON 请求体大小：`8kb`
- 输入校验：
  - 用户名仅允许：`[a-zA-Z0-9_.-]`，长度 1–32
  - 密码不允许包含空白字符，长度 1–64
- 不回显用户输入内容，避免反射型 XSS
- 简单 IP 限流：每个 IP 每分钟最多 30 次登录请求，超出则统一按失败处理

---

## 项目结构

```text
.
├─ server/        # 后端服务（Node.js + Express）
│  ├─ src/
│  │  └─ index.js # 登录接口 / 健康检查 / 安全配置
│  ├─ package.json
│  └─ ...
└─ web/           # 前端静态页面
   ├─ index.html  # 登录页结构
   ├─ style.css   # 页面样式（米白配色）
   └─ app.js      # 表单交互与 API 调用逻辑
```

---

## 部署思路（简要）

### 后端

将 `server` 部署到支持 Node.js 的平台（如 Render / Railway / 自有服务器）：

- Root 目录：`server`
- Build 命令：`npm install`
- Start 命令：`npm start`

### 前端

将 `web` 目录作为静态资源部署到 Netlify / Vercel / GitHub Pages 等平台：

- Publish 目录：`web`
- 无需构建命令（纯静态）

### 前后端联调

- 可以在前端代码中，将默认的 API 地址改为线上后端地址
- 也可以在访问前端时，通过 URL 上的 `?api=` 参数覆盖后端地址，例如：

  ```text
  https://your-frontend.example.com/?api=https://your-backend.example.com
  ```


