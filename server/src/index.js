const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const crypto = require("crypto");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const MSG_SUCCESS = "Login successful";
const MSG_FAIL = "Invalid username or password";

function generateUUID() {
  // Node.js 18+ 支持 crypto.randomUUID()
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // 兜底：生成 UUID v4 格式字符串（尽量与 randomUUID 一致）
  const b = crypto.randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(
    20,
  )}`;
}

app.use(
  cors({
    origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN.split(",").map((s) => s.trim()),
  }),
);
app.use(
  helmet({
    // 前后端分离演示项目：默认不启用 CSP（静态页通常由其他域名托管，CSP 需要更细配置）
    contentSecurityPolicy: false,
  }),
);
app.use(express.json({ limit: "8kb", strict: true, type: ["application/json"] }));

// 简单 IP 限流：防止暴力尝试（演示用，不依赖第三方存储）
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
const rateBuckets = new Map(); // ip -> { count, resetAt }

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) return xff.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function rateLimit(req, res) {
  const ip = getClientIp(req);
  const now = Date.now();
  const cur = rateBuckets.get(ip);
  if (!cur || cur.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  cur.count += 1;
  if (cur.count > RATE_MAX) {
    res.status(200).json({ code: 1, message: MSG_FAIL, data: null });
    return false;
  }
  return true;
}

function normalizeUsername(u) {
  return u.trim();
}

function normalizePassword(p) {
  return p;
}

app.get("/api/health", (_req, res) => {
  res.json({ code: 0, message: "OK", data: { time: new Date().toISOString() } });
});

app.post("/api/login", (req, res) => {
  if (!rateLimit(req, res)) return;

  const { username, password } = req.body || {};

  if (typeof username !== "string" || typeof password !== "string") {
    const payload = {
      code: 1,
      message: MSG_FAIL,
      data: null,
    };
    // 面试演示用：在后端控制台打印“实际返回给前端”的 JSON
    // eslint-disable-next-line no-console
    console.log(`[response] ${JSON.stringify(payload)}`);
    return res.status(200).json(payload);
  }

  const u = normalizeUsername(username);
  const p = normalizePassword(password);

  // 基础输入校验（防止异常 payload / 注入载体进入业务流程）
  const usernameOk = /^[a-zA-Z0-9_.-]{1,32}$/.test(u);
  const passwordOk = /^[\S]{1,64}$/.test(p); // 不允许空白字符

  if (!usernameOk || !passwordOk) {
    const payload = { code: 1, message: MSG_FAIL, data: null };
    // eslint-disable-next-line no-console
    console.log(`[response] ${JSON.stringify(payload)}`);
    return res.status(200).json(payload);
  }

  // 硬编码账号：admin / 123456
  const ok = u === "admin" && p === "123456";

  if (!ok) {
    const payload = {
      code: 1,
      message: MSG_FAIL,
      data: null,
    };
    // eslint-disable-next-line no-console
    console.log(`[response] ${JSON.stringify(payload)}`);
    return res.status(200).json(payload);
  }

  const token = generateUUID();

  // 面试演示用：token 仅在后端日志中输出（不要在前端页面明文展示）
  // eslint-disable-next-line no-console
  console.log(`[login] username=${u} token=${token}`);

  const payload = {
    code: 0,
    message: MSG_SUCCESS,
    data: {
      token,
    },
  };
  // eslint-disable-next-line no-console
  console.log(`[response] ${JSON.stringify(payload)}`);
  return res.status(200).json(payload);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[server] CORS_ORIGIN=${CORS_ORIGIN}`);
});


