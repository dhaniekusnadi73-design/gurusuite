const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const root = __dirname;
loadEnvFile(path.join(root, ".env"));

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, "data");
const ordersFile = path.join(dataDir, "orders.json");
const port = Number(process.env.PORT || 4175);
const host = process.env.HOST || "0.0.0.0";
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
const adminPin = process.env.ADMIN_PIN || "123456";
const webhookSecret = process.env.WEBHOOK_SECRET || "";
const paymentConfig = {
  bank: process.env.PAYMENT_BANK || "BSI",
  accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || "7567057270",
  accountName: process.env.PAYMENT_ACCOUNT_NAME || "Dhanie Kusnadi",
  qrisLabel: process.env.PAYMENT_QRIS_LABEL || "Siapkan QRIS merchant kamu di sini",
  adminEmail: process.env.ADMIN_EMAIL || "dhaniekusnadi73@guru.sd.belajar.id"
};
const plans = [
  { name: "Pro Guru", price: Number(process.env.PRICE_PRO_GURU || 79000) },
  { name: "Sekolah", price: Number(process.env.PRICE_SEKOLAH || 299000) }
];
const limits = new Map();
let orderWriteQueue = Promise.resolve();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const index = trimmed.indexOf("=");
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

async function ensureDataStore() {
  await fsp.mkdir(dataDir, { recursive: true });
  try {
    await fsp.access(ordersFile);
  } catch {
    await fsp.writeFile(ordersFile, "[]", "utf8");
  }
}

async function readOrders() {
  if (supabaseEnabled()) {
    const rows = await supabaseRequest("gurusuite_orders?select=data&order=created_at.desc");
    return rows.map((row) => normalizeOrder(row.data));
  }
  await ensureDataStore();
  const raw = await fsp.readFile(ordersFile, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeOrders(orders) {
  if (supabaseEnabled()) {
    await supabaseRequest("gurusuite_orders?id=neq.__never__", { method: "DELETE" });
    if (orders.length) {
      await supabaseRequest("gurusuite_orders", {
        method: "POST",
        body: JSON.stringify(orders.map((order) => {
          const normalized = normalizeOrder(order);
          return { id: normalized.id, data: normalized, created_at: normalized.createdAt };
        }))
      });
    }
    return;
  }
  await ensureDataStore();
  orderWriteQueue = orderWriteQueue.then(() => fsp.writeFile(ordersFile, JSON.stringify(orders, null, 2), "utf8"));
  await orderWriteQueue;
}

function supabaseEnabled() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function temporaryOrdersAllowed() {
  return process.env.ALLOW_TEMPORARY_ORDERS === "true" || !process.env.VERCEL;
}

function paymentEnabled() {
  return supabaseEnabled() || temporaryOrdersAllowed();
}

async function supabaseRequest(endpoint, options = {}) {
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${base}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(typeof body === "string" ? body : body?.message || "Supabase request failed");
  }
  return body;
}

function normalizeOrder(order) {
  return {
    id: String(order.id || `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`),
    name: String(order.name || "Pengguna GuruSuite").slice(0, 120),
    contact: String(order.contact || "").slice(0, 120),
    plan: String(order.plan || "Pro Guru"),
    basePrice: Number(order.basePrice || 0),
    amount: Number(order.amount || 0),
    bank: String(order.bank || paymentConfig.bank),
    accountNumber: String(order.accountNumber || paymentConfig.accountNumber),
    accountName: String(order.accountName || paymentConfig.accountName),
    adminEmail: String(order.adminEmail || paymentConfig.adminEmail),
    status: order.status === "paid" ? "paid" : "pending",
    activationCode: String(order.activationCode || ""),
    licenseToken: String(order.licenseToken || ""),
    createdAt: String(order.createdAt || new Date().toISOString()),
    paidAt: String(order.paidAt || ""),
    activatedAt: String(order.activatedAt || "")
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(body));
}

function sendDownload(res, filename, body) {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

function assertAdmin(body) {
  if (String(body.adminPin || "") !== adminPin) {
    const error = new Error("PIN admin salah");
    error.status = 401;
    throw error;
  }
}

function assertRateLimit(key, maxHits, windowMs) {
  const now = Date.now();
  const entry = limits.get(key) || { hits: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.hits = 0;
    entry.resetAt = now + windowMs;
  }
  entry.hits += 1;
  limits.set(key, entry);
  if (entry.hits > maxHits) {
    const error = new Error("Terlalu banyak request. Coba lagi sebentar.");
    error.status = 429;
    throw error;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new Error("Payload terlalu besar"));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("JSON tidak valid"));
      }
    });
  });
}

function uniqueAmount(basePrice) {
  return Number(basePrice) + Math.floor(100 + Math.random() * 899);
}

function activationCode() {
  return `GS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

function licenseToken() {
  return `LIC-${Math.random().toString(36).slice(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

function findPlan(planName) {
  return plans.find((plan) => plan.name.toLowerCase() === String(planName || "").toLowerCase());
}

function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  const proto = req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http");
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${port}`;
  return `${proto}://${hostHeader}`;
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, app: "GuruSuite", publicBaseUrl: getPublicBaseUrl(req), storage: supabaseEnabled() ? "supabase" : "file" });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/config") {
    sendJson(res, 200, {
      payment: paymentConfig,
      plans,
      storage: supabaseEnabled() ? "supabase" : "file",
      paymentEnabled: paymentEnabled()
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/create-order") {
    if (!paymentEnabled()) {
      sendJson(res, 503, { error: "Pembayaran belum aktif. Admin perlu mengaktifkan Supabase agar order tersimpan permanen." });
      return;
    }
    assertRateLimit(`order:${req.socket.remoteAddress}`, 20, 60_000);
    const body = await readBody(req);
    const selectedPlan = findPlan(body.plan || "Pro Guru");
    if (!selectedPlan) {
      sendJson(res, 400, { error: "Paket tidak valid" });
      return;
    }
    const plan = selectedPlan.name;
    const basePrice = selectedPlan.price;
    const order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      name: String(body.name || "Pengguna GuruSuite").trim().slice(0, 120),
      contact: String(body.contact || "").trim().slice(0, 120),
      plan,
      basePrice,
      amount: uniqueAmount(basePrice),
      bank: paymentConfig.bank,
      accountNumber: paymentConfig.accountNumber,
      accountName: paymentConfig.accountName,
      adminEmail: paymentConfig.adminEmail,
      status: "pending",
      activationCode: "",
      licenseToken: "",
      createdAt: new Date().toISOString(),
      paidAt: "",
      activatedAt: ""
    };
    const orders = await readOrders();
    orders.unshift(order);
    await writeOrders(orders);
    sendJson(res, 201, { order });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/orders") {
    assertRateLimit(`admin-list:${req.socket.remoteAddress}`, 60, 60_000);
    if (url.searchParams.get("adminPin") !== adminPin) {
      sendJson(res, 401, { error: "PIN admin salah" });
      return;
    }
    const orders = await readOrders();
    sendJson(res, 200, { orders });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/orders-export") {
    assertRateLimit(`admin-export:${req.socket.remoteAddress}`, 20, 60_000);
    if (url.searchParams.get("adminPin") !== adminPin) {
      sendJson(res, 401, { error: "PIN admin salah" });
      return;
    }
    const orders = await readOrders();
    sendDownload(res, `gurusuite-orders-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(orders, null, 2));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders-restore") {
    assertRateLimit(`admin-restore:${req.socket.remoteAddress}`, 6, 60_000);
    const body = await readBody(req);
    assertAdmin(body);
    if (!Array.isArray(body.orders)) {
      sendJson(res, 400, { error: "Format backup tidak valid" });
      return;
    }
    const normalized = body.orders.map((order) => ({
      id: String(order.id || `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`),
      name: String(order.name || "Pengguna GuruSuite").slice(0, 120),
      contact: String(order.contact || "").slice(0, 120),
      plan: String(order.plan || "Pro Guru"),
      basePrice: Number(order.basePrice || 0),
      amount: Number(order.amount || 0),
      bank: String(order.bank || paymentConfig.bank),
      accountNumber: String(order.accountNumber || paymentConfig.accountNumber),
      accountName: String(order.accountName || paymentConfig.accountName),
      adminEmail: String(order.adminEmail || paymentConfig.adminEmail),
      status: order.status === "paid" ? "paid" : "pending",
      activationCode: String(order.activationCode || ""),
      licenseToken: String(order.licenseToken || ""),
      createdAt: String(order.createdAt || new Date().toISOString()),
      paidAt: String(order.paidAt || ""),
      activatedAt: String(order.activatedAt || "")
    }));
    await writeOrders(normalized);
    sendJson(res, 200, { ok: true, restored: normalized.length });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/mark-paid") {
    assertRateLimit(`admin-paid:${req.socket.remoteAddress}`, 60, 60_000);
    const body = await readBody(req);
    assertAdmin(body);
    const orders = await readOrders();
    const order = orders.find((item) => item.id === body.orderId);
    if (!order) {
      sendJson(res, 404, { error: "Order tidak ditemukan" });
      return;
    }
    order.status = "paid";
    order.paidAt = new Date().toISOString();
    order.activationCode = order.activationCode || activationCode();
    order.licenseToken = order.licenseToken || licenseToken();
    await writeOrders(orders);
    sendJson(res, 200, { order });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/activate-code") {
    assertRateLimit(`activate:${req.socket.remoteAddress}`, 30, 60_000);
    const body = await readBody(req);
    const code = String(body.code || "").trim().toUpperCase();
    const orders = await readOrders();
    const order = orders.find((item) => item.activationCode === code && item.status === "paid");
    if (!order) {
      sendJson(res, 404, { error: "Kode aktivasi tidak valid atau belum lunas" });
      return;
    }
    order.activatedAt = order.activatedAt || new Date().toISOString();
    order.licenseToken = order.licenseToken || licenseToken();
    await writeOrders(orders);
    sendJson(res, 200, { plan: order.plan, licenseToken: order.licenseToken, order });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/validate-license") {
    const body = await readBody(req);
    const token = String(body.licenseToken || "").trim();
    if (!token) {
      sendJson(res, 401, { valid: false, error: "Token lisensi kosong" });
      return;
    }
    const orders = await readOrders();
    const order = orders.find((item) => item.licenseToken === token && item.status === "paid");
    if (!order) {
      sendJson(res, 401, { valid: false, error: "Lisensi tidak valid" });
      return;
    }
    sendJson(res, 200, { valid: true, plan: order.plan, orderId: order.id });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/payment-webhook") {
    const body = await readBody(req);
    if (webhookSecret && body.webhookSecret !== webhookSecret) {
      sendJson(res, 401, { error: "Webhook secret salah" });
      return;
    }
    const orders = await readOrders();
    const order = orders.find((item) => item.id === body.orderId || Number(item.amount) === Number(body.amount));
    if (!order) {
      sendJson(res, 404, { error: "Order tidak ditemukan" });
      return;
    }
    order.status = "paid";
    order.paidAt = new Date().toISOString();
    order.activationCode = order.activationCode || activationCode();
    order.licenseToken = order.licenseToken || licenseToken();
    order.webhookPayload = body;
    await writeOrders(orders);
    sendJson(res, 200, { order });
    return;
  }

  sendJson(res, 404, { error: "Endpoint tidak ditemukan" });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${host}:${port}`);
  if (url.pathname.startsWith("/api/")) {
    try {
      await handleApi(req, res, url);
    } catch (error) {
      sendJson(res, error.status || 500, { error: error.message || "Server error" });
    }
    return;
  }

  const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const filePath = path.resolve(root, requested);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    });
    res.end(content);
  });
});

server.listen(port, host, () => {
  console.log(`GuruSuite running at ${publicBaseUrl}`);
});
