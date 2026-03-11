(() => {
  const $ = (id) => document.getElementById(id);

  const form = $("loginForm");
  const usernameEl = $("username");
  const passwordEl = $("password");
  const submitBtn = $("submitBtn");
  const hintEl = $("hint");

  const welcomeBox = $("welcome");
  const welcomeText = $("welcomeText");
  const logoutBtn = $("logoutBtn");

  const qs = new URLSearchParams(location.search);
  const apiBase = (qs.get("api") || "").replace(/\/+$/, "") || "http://localhost:3000";

  const STORAGE_KEY = "beisi_start_token";
  const STORAGE_USER_KEY = "beisi_start_username";

  function setHint(text, type) {
    hintEl.textContent = text || "";
    hintEl.classList.remove("ok", "err");
    if (type) hintEl.classList.add(type);
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? "登录中..." : "登录";
  }

  function showWelcome(username, token) {
    welcomeText.textContent = `欢迎，${username}`;
    welcomeBox.classList.remove("hidden");
  }

  function hideWelcome() {
    welcomeBox.classList.add("hidden");
  }

  function saveSession(username, token) {
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, username);
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  }

  async function login(username, password) {
    const res = await fetch(`${apiBase}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return await res.json();
  }

  // 不自动从 localStorage 恢复“已登录 UI”，避免造成“未请求后端也算登录成功”的误解

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setHint("");

    const username = (usernameEl.value || "").trim();
    const password = passwordEl.value || "";

    if (!username) return setHint("请输入用户名", "err");
    if (!password) return setHint("请输入密码", "err");

    setLoading(true);
    try {
      // eslint-disable-next-line no-console
      console.log(`[web] POST ${apiBase}/api/login`);
      const data = await login(username, password);
      if (data && data.code === 0 && data.data && data.data.token) {
        saveSession(username, data.data.token);
        setHint("登录成功", "ok");
        showWelcome(username, data.data.token);
      } else {
        setHint((data && data.message) || "登录失败", "err");
        hideWelcome();
      }
    } catch (_err) {
      setHint("网络错误：请确认后端已启动且允许跨域（CORS）", "err");
      hideWelcome();
    } finally {
      setLoading(false);
    }
  });

  logoutBtn.addEventListener("click", () => {
    clearSession();
    hideWelcome();
    usernameEl.value = "";
    passwordEl.value = "";
    setHint("已退出登录", "ok");
    usernameEl.focus();
  });
})();


