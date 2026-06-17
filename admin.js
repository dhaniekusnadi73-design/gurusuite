const el = {
  adminPinInput: document.querySelector("#adminPinInput"),
  refreshOrdersBtn: document.querySelector("#refreshOrdersBtn"),
  exportOrdersBtn: document.querySelector("#exportOrdersBtn"),
  restoreOrdersInput: document.querySelector("#restoreOrdersInput"),
  adminOrders: document.querySelector("#adminOrders"),
  adminStatus: document.querySelector("#adminStatus"),
  storageStatus: document.querySelector("#storageStatus"),
  adminSummary: document.querySelector("#adminSummary")
};

let ordersCache = [];

async function loadHealth() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    const storage = data.storage || "unknown";
    if (storage === "supabase") {
      el.storageStatus.textContent = "Storage permanen aktif: Supabase.";
      el.storageStatus.className = "storage-ok";
    } else {
      el.storageStatus.textContent = "Peringatan: storage masih sementara. Aktifkan Supabase sebelum menerima order sungguhan.";
      el.storageStatus.className = "storage-warning";
    }
  } catch {
    el.storageStatus.textContent = "Tidak bisa memeriksa status storage.";
    el.storageStatus.className = "storage-warning";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatRupiah(value) {
  return `Rp${Number(value).toLocaleString("id-ID")}`;
}

function paymentMessage(order) {
  return [
    "Halo, pembayaran GuruSuite sudah kami verifikasi.",
    `Order: ${order.id}`,
    `Paket: ${order.plan}`,
    `Kode aktivasi: ${order.activationCode}`,
    "Silakan masukkan kode tersebut di kolom Kode Aktivasi pada aplikasi GuruSuite."
  ].join("\n");
}

async function refreshOrders() {
  const adminPin = el.adminPinInput.value.trim();
  if (!adminPin) {
    alert("Masukkan PIN admin terlebih dahulu.");
    return;
  }
  const response = await fetch(`/api/orders?adminPin=${encodeURIComponent(adminPin)}`);
  const data = await response.json();
  if (!response.ok) {
    el.adminStatus.textContent = response.status === 401 ? "Ditolak" : "Error server";
    el.adminOrders.innerHTML = `<p>${escapeHtml(data.error || "Gagal memuat order.")}</p>`;
    return;
  }
  ordersCache = data.orders;
  el.adminStatus.textContent = "Terbuka";
  renderAdminOrders(data.orders);
}

function renderAdminOrders(orders) {
  const pending = orders.filter((order) => order.status === "pending").length;
  const paid = orders.filter((order) => order.status === "paid").length;
  el.adminSummary.textContent = `${orders.length} order total, ${pending} pending, ${paid} lunas.`;

  if (!orders.length) {
    el.adminOrders.innerHTML = "<p>Belum ada order.</p>";
    return;
  }

  el.adminOrders.innerHTML = "";
  orders.forEach((order) => {
    const card = document.createElement("div");
    card.className = "order-card admin-order-card";
    const emailLink = order.activationCode
      ? `mailto:${encodeURIComponent(order.contact || "")}?subject=${encodeURIComponent("Kode Aktivasi GuruSuite")}&body=${encodeURIComponent(paymentMessage(order))}`
      : "#";
    card.innerHTML = `
      <div class="order-head">
        <strong>${escapeHtml(order.plan)} - ${formatRupiah(order.amount)}</strong>
        <span class="status-pill ${order.status === "paid" ? "paid" : "pending"}">${escapeHtml(order.status)}</span>
      </div>
      <span>${escapeHtml(order.name || "Pengguna")} - ${escapeHtml(order.contact || "tanpa kontak")}</span>
      <span>Dibuat: ${new Date(order.createdAt).toLocaleString("id-ID")}</span>
      <code>${escapeHtml(order.id)}</code>
      ${order.activationCode ? `<code>Kode: ${escapeHtml(order.activationCode)}</code>` : ""}
      ${order.activatedAt ? `<span>Aktivasi: ${new Date(order.activatedAt).toLocaleString("id-ID")}</span>` : ""}
      <div class="form-actions">
        ${order.status === "pending" ? `<button class="small" data-order-paid="${escapeHtml(order.id)}" type="button">Tandai Lunas</button>` : ""}
        ${order.activationCode ? `<button class="ghost small" data-copy-code="${escapeHtml(order.activationCode)}" type="button">Salin Kode</button>` : ""}
        ${order.activationCode ? `<a class="wa-button small-link" href="${emailLink}" rel="noreferrer">Kirim Email</a>` : ""}
      </div>
    `;
    el.adminOrders.appendChild(card);
  });

  el.adminOrders.querySelectorAll("[data-order-paid]").forEach((button) => {
    button.addEventListener("click", () => markOrderPaid(button.dataset.orderPaid));
  });
  el.adminOrders.querySelectorAll("[data-copy-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(button.dataset.copyCode);
      button.textContent = "Tersalin";
    });
  });
}

async function markOrderPaid(orderId) {
  const adminPin = el.adminPinInput.value.trim();
  const response = await fetch("/api/mark-paid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, adminPin })
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.error || "Gagal menandai order lunas.");
    return;
  }
  await refreshOrders();
  alert(`Order lunas. Kode aktivasi: ${data.order.activationCode}`);
}

function exportOrders() {
  if (!ordersCache.length) {
    alert("Belum ada data order untuk diexport.");
    return;
  }
  const blob = new Blob([JSON.stringify(ordersCache, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gurusuite-orders-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function restoreOrders(event) {
  const file = event.target.files[0];
  const adminPin = el.adminPinInput.value.trim();
  if (!file) return;
  if (!adminPin) {
    alert("Masukkan PIN admin sebelum restore.");
    event.target.value = "";
    return;
  }
  const text = await file.text();
  let orders;
  try {
    orders = JSON.parse(text);
  } catch {
    alert("File JSON tidak valid.");
    event.target.value = "";
    return;
  }
  if (!Array.isArray(orders)) {
    alert("Backup harus berupa array order.");
    event.target.value = "";
    return;
  }
  if (!confirm(`Restore ${orders.length} order? Data order saat ini akan diganti.`)) {
    event.target.value = "";
    return;
  }
  const response = await fetch("/api/orders-restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminPin, orders })
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.error || "Restore gagal.");
    event.target.value = "";
    return;
  }
  alert(`Restore berhasil: ${data.restored} order.`);
  event.target.value = "";
  await refreshOrders();
}

el.refreshOrdersBtn.addEventListener("click", refreshOrders);
el.exportOrdersBtn.addEventListener("click", exportOrders);
el.restoreOrdersInput.addEventListener("change", restoreOrders);
loadHealth();
