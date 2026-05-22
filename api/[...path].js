const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(os.tmpdir(), "gurusuite");
const ordersFile = path.join(dataDir, "orders.json");
const adminPin = process.env.ADMIN_PIN || "123456";
const webhookSecret = process.env.WEBHOOK_SECRET || "";
const publicBaseUrl = process.env.PUBLIC_BASE_URL || "";
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

function sendJson(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  Object.entries({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders
  }).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(body));
}

function assertAdmin(body) {
  if (String(body.adminPin || "") !== adminPin) {
    const error = new Error("PIN admin salah");
    error.status = 401;
    throw error;
  }
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
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  return host ? `${proto}://${host}` : "";
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

async function ensureFileStore() {
  await fsp.mkdir(dataDir, { recursive: true });
  if (!fs.existsSync(ordersFile)) await fsp.writeFile(ordersFile, "[]", "utf8");
}

async function readOrders() {
  if (supabaseEnabled()) {
    const rows = await supabaseRequest("gurusuite_orders?select=data&order=created_at.desc");
    return rows.map((row) => normalizeOrder(row.data));
  }
  await ensureFileStore();
  const raw = await fsp.readFile(ordersFile, "utf8");
  return JSON.parse(raw || "[]").map(normalizeOrder);
}

async function insertOrder(order) {
  const normalized = normalizeOrder(order);
  if (supabaseEnabled()) {
    await supabaseRequest("gurusuite_orders", {
      method: "POST",
      body: JSON.stringify({ id: normalized.id, data: normalized, created_at: normalized.createdAt })
    });
    return normalized;
  }
  const orders = await readOrders();
  orders.unshift(normalized);
  await fsp.writeFile(ordersFile, JSON.stringify(orders, null, 2), "utf8");
  return normalized;
}

async function replaceOrder(order) {
  const normalized = normalizeOrder(order);
  if (supabaseEnabled()) {
    await supabaseRequest(`gurusuite_orders?id=eq.${encodeURIComponent(normalized.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ data: normalized })
    });
    return normalized;
  }
  const orders = await readOrders();
  const index = orders.findIndex((item) => item.id === normalized.id);
  if (index >= 0) orders[index] = normalized;
  await fsp.writeFile(ordersFile, JSON.stringify(orders, null, 2), "utf8");
  return normalized;
}

async function restoreOrders(orders) {
  const normalized = orders.map(normalizeOrder);
  if (supabaseEnabled()) {
    await supabaseRequest("gurusuite_orders?id=neq.__never__", { method: "DELETE" });
    if (normalized.length) {
      await supabaseRequest("gurusuite_orders", {
        method: "POST",
        body: JSON.stringify(normalized.map((order) => ({ id: order.id, data: order, created_at: order.createdAt })))
      });
    }
    return normalized.length;
  }
  await ensureFileStore();
  await fsp.writeFile(ordersFile, JSON.stringify(normalized, null, 2), "utf8");
  return normalized.length;
}

async function getBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return {};
}

module.exports = async function handler(req, res) {
  try {
    const pathname = `/api/${Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path || ""}`;

    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, { ok: true, app: "GuruSuite", publicBaseUrl: getPublicBaseUrl(req), storage: supabaseEnabled() ? "supabase" : "file" });
      return;
    }

    if (req.method === "GET" && pathname === "/api/config") {
      sendJson(res, 200, {
        payment: paymentConfig,
        plans,
        storage: supabaseEnabled() ? "supabase" : "file",
        paymentEnabled: paymentEnabled()
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/create-order") {
      if (!paymentEnabled()) {
        sendJson(res, 503, { error: "Pembayaran belum aktif. Admin perlu mengaktifkan Supabase agar order tersimpan permanen." });
        return;
      }
      const body = await getBody(req);
      const selectedPlan = findPlan(body.plan || "Pro Guru");
      if (!selectedPlan) {
        sendJson(res, 400, { error: "Paket tidak valid" });
        return;
      }
      const order = await insertOrder({
        id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        name: String(body.name || "Pengguna GuruSuite").trim().slice(0, 120),
        contact: String(body.contact || "").trim().slice(0, 120),
        plan: selectedPlan.name,
        basePrice: selectedPlan.price,
        amount: uniqueAmount(selectedPlan.price),
        bank: paymentConfig.bank,
        accountNumber: paymentConfig.accountNumber,
        accountName: paymentConfig.accountName,
        adminEmail: paymentConfig.adminEmail,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      sendJson(res, 201, { order });
      return;
    }

    if (req.method === "GET" && pathname === "/api/orders") {
      if (req.query.adminPin !== adminPin) {
        sendJson(res, 401, { error: "PIN admin salah" });
        return;
      }
      sendJson(res, 200, { orders: await readOrders() });
      return;
    }

    if (req.method === "GET" && pathname === "/api/orders-export") {
      if (req.query.adminPin !== adminPin) {
        sendJson(res, 401, { error: "PIN admin salah" });
        return;
      }
      sendJson(res, 200, await readOrders(), {
        "Content-Disposition": `attachment; filename="gurusuite-orders-${new Date().toISOString().slice(0, 10)}.json"`
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/orders-restore") {
      const body = await getBody(req);
      assertAdmin(body);
      if (!Array.isArray(body.orders)) {
        sendJson(res, 400, { error: "Format backup tidak valid" });
        return;
      }
      sendJson(res, 200, { ok: true, restored: await restoreOrders(body.orders) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/mark-paid") {
      const body = await getBody(req);
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
      sendJson(res, 200, { order: await replaceOrder(order) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/activate-code") {
      const body = await getBody(req);
      const code = String(body.code || "").trim().toUpperCase();
      const orders = await readOrders();
      const order = orders.find((item) => item.activationCode === code && item.status === "paid");
      if (!order) {
        sendJson(res, 404, { error: "Kode aktivasi tidak valid atau belum lunas" });
        return;
      }
      order.activatedAt = order.activatedAt || new Date().toISOString();
      order.licenseToken = order.licenseToken || licenseToken();
      await replaceOrder(order);
      sendJson(res, 200, { plan: order.plan, licenseToken: order.licenseToken, order });
      return;
    }

    if (req.method === "POST" && pathname === "/api/validate-license") {
      const body = await getBody(req);
      const token = String(body.licenseToken || "").trim();
      const orders = await readOrders();
      const order = orders.find((item) => item.licenseToken === token && item.status === "paid");
      if (!order) {
        sendJson(res, 401, { valid: false, error: "Lisensi tidak valid" });
        return;
      }
      sendJson(res, 200, { valid: true, plan: order.plan, orderId: order.id });
      return;
    }

    if (req.method === "POST" && pathname === "/api/payment-webhook") {
      const body = await getBody(req);
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
      sendJson(res, 200, { order: await replaceOrder(order) });
      return;
    }

    sendJson(res, 404, { error: "Endpoint tidak ditemukan" });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || "Server error" });
  }
};
