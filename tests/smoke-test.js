const assert = require("assert");
const { spawn } = require("child_process");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = 49175 + Math.floor(Math.random() * 1000);
const adminPin = "998877";
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "gurusuite-test-"));

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = text;
  }
  return { response, body };
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const { response } = await request("/api/health");
      if (response.ok) return;
    } catch {
      await wait(150);
    }
  }
  throw new Error("Server test tidak hidup");
}

(async () => {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      ADMIN_PIN: adminPin,
      DATA_DIR: dataDir
    },
    stdio: "ignore"
  });

  try {
    await waitForServer();

    const config = await request("/api/config");
    assert.equal(config.response.status, 200);
    assert.equal(config.body.payment.bank, "BSI");

    const order = await request("/api/create-order", {
      method: "POST",
      body: JSON.stringify({ name: "Smoke Test", contact: "smoke@example.com", plan: "Pro Guru", price: 1 })
    });
    assert.equal(order.response.status, 201);
    assert.equal(order.body.order.basePrice, 79000);
    assert.ok(order.body.order.amount >= 79100);

    const invalidPlan = await request("/api/create-order", {
      method: "POST",
      body: JSON.stringify({ plan: "Palsu", price: 1 })
    });
    assert.equal(invalidPlan.response.status, 400);

    const noPin = await request("/api/orders");
    assert.equal(noPin.response.status, 401);

    const paid = await request("/api/mark-paid", {
      method: "POST",
      body: JSON.stringify({ orderId: order.body.order.id, adminPin })
    });
    assert.equal(paid.response.status, 200);
    assert.equal(paid.body.order.status, "paid");
    assert.ok(paid.body.order.activationCode);

    const activated = await request("/api/activate-code", {
      method: "POST",
      body: JSON.stringify({ code: paid.body.order.activationCode })
    });
    assert.equal(activated.response.status, 200);
    assert.equal(activated.body.plan, "Pro Guru");
    assert.ok(activated.body.licenseToken);

    const valid = await request("/api/validate-license", {
      method: "POST",
      body: JSON.stringify({ licenseToken: activated.body.licenseToken })
    });
    assert.equal(valid.response.status, 200);
    assert.equal(valid.body.valid, true);

    const exported = await request(`/api/orders-export?adminPin=${adminPin}`);
    assert.equal(exported.response.status, 200);
    assert.ok(Array.isArray(exported.body));

    const restored = await request("/api/orders-restore", {
      method: "POST",
      body: JSON.stringify({ adminPin, orders: exported.body })
    });
    assert.equal(restored.response.status, 200);
    assert.equal(restored.body.restored, 1);

    console.log("Smoke test passed");
  } finally {
    child.kill();
    await fsp.rm(dataDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
