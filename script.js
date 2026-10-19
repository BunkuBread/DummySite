// ----------- TELEGRAM CONFIGURATIONS -----------
const TELEGRAM_BOT_TOKEN = '8871844782:AAESEct5I23R4yyDVWOXivxJ7o808pJeneU';
const TELEGRAM_CHAT_ID = '-1003350834763';
const WHATSAPP_PHONE = '971544588113';
const ALLOWED_TIME_CITIES = ["Dubai", "Sharjah", "Ajman", "Umm Al Quwain"];
const FEE_CITIES = ["Fujairah", "Ras Al Khaimah", "Abu Dhabi", "Al Ain", "Umm Al Quwain"];
const SAME_DAY_CITIES = ["Ajman", "Dubai", "Sharjah"];
const MAX_QTY = 10;

// keepalive lets the request finish even after the page navigates to WhatsApp
function sendTelegramOrder(message) {
  try {
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
      keepalive: true
    }).then(r => { if (!r.ok) console.error("Telegram message failed", r.status); })
      .catch(e => console.error("Telegram error", e));
  } catch (e) { console.error("Telegram error", e); }
}

// ----------- MENU -----------
const PRODUCTS = [
  { n: "OG Bunku", p: 55, c: "savory", img: "BUNKUOG.jpg", d: "Five imported cheeses with a Korean-Japanese twist.", add: "Extra garlic sauce" },
  { n: "Zaatar Bomb", p: 60, c: "savory", img: "ZAATAR.jpg", d: "A burst of eight Zataar blends with our Korean-Japanese cheeses mix", add: "Extra garlic sauce" },
  { n: "Labneh Bliss", p: 60, c: "savory", img: "LABNEHBLISS.png", d: "Home made labneh with our mix of nuts and flavorful spices" },
  { n: "Date Me", p: 65, c: "savory", img: "DateMe.png", d: "Five imported cheeses with a Korean-Japanese & Arabic twist, blended with sweet dates." },
  { n: "Diabetes", p: 65, c: "sweet", img: "DIABETES.jpg", d: "Nutella, chocolate fusion & marshmallow topping.", add: "Extra chocolate sauce" },
  { n: "Strawberry Haven", p: 60, c: "sweet", img: "STRAWBERRYHAVEN.jpg", d: "Home-made jam with our Korean- Japanese cheeses mix" },
  { n: "Berry Blast", p: 60, c: "sweet", img: "BERRYBLAST.jpg", d: "Home-made Blackberry Jam with our Korean-Japanese cheeses mix" },
  { n: "Honey Trap", p: 65, c: "sweet", img: "HoneyTrap.png", d: "Homemade cream cheese with cinnamon, finished with a rich honey drizzle." },
  { n: "Signature Box", p: 145, c: "box", img: "SignatureBox.png", d: "Enjoy every Bunku flavour in our Signature Box." }
];
const SECTIONS = [["savory", "Savory"], ["sweet", "Sweet"], ["box", "Box"]];
const ADDON_PRICE = 5;
const cart = {};      // name -> qty
const addons = {};    // name -> true
const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const byName = n => PRODUCTS.find(p => p.n === n);

function renderMenu() {
  $('menu').innerHTML = SECTIONS.map(([id, title]) => `
    <section id="${id}"><h2>${title}</h2><div class="grid">
    ${PRODUCTS.filter(p => p.c === id).map(p => `
      <article class="card" data-n="${esc(p.n)}">
        <img class="thumb" src="images/${p.img}" alt="${esc(p.n)}" loading="lazy" />
        <div class="info">
          <h3>${esc(p.n)}</h3><p>${esc(p.d)}</p>
          <div class="row"><span class="price">${p.p} AED</span><span class="ctl"></span></div>
          ${p.add ? `<label class="addon hidden"><input type="checkbox" data-addon="${esc(p.n)}" /> ${p.add} (+${ADDON_PRICE} AED)</label>` : ""}
        </div>
      </article>`).join("")}
    </div></section>`).join("");
}

// ----------- PRICING -----------
const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
const orderType = () => document.querySelector('input[name="order_type"]:checked').value;
const feeFor = city => FEE_CITIES.includes(city) ? 45 : 0;
function addonList() { return PRODUCTS.filter(p => p.add && addons[p.n] && cart[p.n]); }
function total() {
  let t = Object.entries(cart).reduce((s, [n, q]) => s + q * byName(n).p, 0);
  t += addonList().length * ADDON_PRICE;
  if (orderType() === "delivery") t += feeFor($('deliveryCity').value);
  return t;
}

// ----------- RENDER -----------
const stepper = (n, q) => `<span class="step"><button type="button" data-act="dec" data-n="${esc(n)}" aria-label="Reduce ${esc(n)}">-</button><span>${q}</span><button type="button" data-act="inc" data-n="${esc(n)}" aria-label="Increase ${esc(n)}">+</button></span>`;

function update() {
  document.querySelectorAll('.card').forEach(card => {
    const n = card.dataset.n, q = cart[n] || 0;
    card.querySelector('.ctl').innerHTML = q
      ? stepper(n, q)
      : `<button type="button" class="add" data-act="inc" data-n="${esc(n)}">Add</button>`;
    const a = card.querySelector('.addon');
    if (a) a.classList.toggle('hidden', !q);
  });

  const lines = $('lines');
  const entries = Object.entries(cart);
  lines.innerHTML = entries.length ? "" : '<li class="empty">Your order is empty. Add something tasty.</li>';
  entries.forEach(([n, q]) => {
    lines.insertAdjacentHTML('beforeend', `<li><div class="nm">${esc(n)}<div class="sub">${q * byName(n).p} AED</div></div>${stepper(n, q)}</li>`);
  });
  addonList().forEach(p => lines.insertAdjacentHTML('beforeend', `<li><div class="nm">${p.add} (${esc(p.n)})</div><span>+${ADDON_PRICE} AED</span></li>`));
  if (orderType() === "delivery") {
    const city = $('deliveryCity').value, fee = feeFor(city);
    $('feeNote').textContent = fee ? `Delivery charge: +${fee} AED` : (city ? "Delivery charge estimated on message" : "");
    if (fee) lines.insertAdjacentHTML('beforeend', `<li><div class="nm">Delivery fee</div><span>+${fee} AED</span></li>`);
  }

  const c = count(), t = total();
  $('total').textContent = `${t} AED`;
  $('barCount').textContent = `${c} item${c !== 1 ? 's' : ''}`;
  $('barTotal').textContent = `${t} AED`;
  $('bar').classList.toggle('hidden', c === 0);
}

function setQty(n, q) {
  q = Math.max(0, Math.min(MAX_QTY, q));
  if (q) cart[n] = q; else { delete cart[n]; delete addons[n]; }
  update();
}

function toggleFields() {
  const del = orderType() === "delivery";
  $('deliveryFields').classList.toggle('hidden', !del);
  $('pickupFields').classList.toggle('hidden', del);
  const timeOk = ALLOWED_TIME_CITIES.includes($('deliveryCity').value);
  const t = $('deliveryTime');
  t.disabled = !timeOk;
  if (!timeOk) t.value = "";
  $('timeNote').classList.toggle('hidden', timeOk || !$('deliveryCity').value);
  update();
}

// ----------- VALIDATION -----------
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function validate() {
  const errs = {};
  const v = id => $(id).value.trim();
  const dateCheck = (id, city, word) => {
    if (!v(id)) errs[id] = "Select date";
    else if (v(id) < todayStr()) errs[id] = "Date cannot be in past";
    else if (v(id) === todayStr() && !SAME_DAY_CITIES.includes(city)) errs[id] = `Same day ${word} allowed only in Ajman, Dubai, Sharjah`;
  };
  if (orderType() === "delivery") {
    const city = v('deliveryCity');
    if (!v('deliveryName')) errs.deliveryName = "Name required";
    if (!/^\d+$/.test(v('deliveryPhone'))) errs.deliveryPhone = "Valid phone required";
    if (!city) errs.deliveryCity = "Select city";
    if (!v('deliveryArea')) errs.deliveryArea = "Area required";
    dateCheck('deliveryDate', city, "delivery");
    if (ALLOWED_TIME_CITIES.includes(city) && !v('deliveryTime')) errs.deliveryTime = "Select time";
  } else {
    if (!v('pickupName')) errs.pickupName = "Name required";
    if (!/^\d+$/.test(v('pickupPhone'))) errs.pickupPhone = "Valid phone required";
    if (!/^[a-zA-Z0-9]+$/.test(v('pickupPlate'))) errs.pickupPlate = "Valid plate number required";
    dateCheck('pickupDate', "Dubai", "pickup");
    if (!v('pickupTime')) errs.pickupTime = "Select time";
  }
  document.querySelectorAll('.err').forEach(e => e.textContent = errs[e.dataset.for] || "");
  const first = Object.keys(errs)[0];
  if (first) $(first).focus();
  return !first;
}

// ----------- MESSAGE -----------
function buildMessage() {
  const v = id => $(id).value.trim();
  let m = "Hello! I placed an order:\n\n";
  if (orderType() === "delivery") {
    const city = $('deliveryCity').value;
    const time = ALLOWED_TIME_CITIES.includes(city) ? $('deliveryTime').value : "Due to your region, time of delivery is unavailable";
    const fee = feeFor(city) || "Estimated on message";
    m += "Delivery Details:\n";
    m += `Name: ${v('deliveryName')}\nPhone: ${v('deliveryPhone')}\nCity: ${city}\nDate: ${$('deliveryDate').value}\nTime: ${time}\nArea: ${v('deliveryArea')}\nDelivery Charge: ${fee} AED\n\n`;
  } else {
    m += "Pick Up Details:\n";
    m += `Name: ${v('pickupName')}\nPhone: ${v('pickupPhone')}\nPlate Number: ${v('pickupPlate')}\nDate: ${$('pickupDate').value}\nTime: ${$('pickupTime').value}\n\n`;
  }
  m += "Orders:\n";
  for (const [n, q] of Object.entries(cart)) m += `${n}: ${q} box(es)\n`;
  addonList().forEach(p => { m += `${p.add} (${p.n}): Yes (+${ADDON_PRICE} AED)\n`; });
  m += `\nTotal: ${total()} AED`;
  return m;
}

// ----------- SUBMIT -----------
function submitOrder(e) {
  e.preventDefault();
  if (count() < 1) { alert("Your order is empty. Please add at least one item."); return; }
  if (!validate()) return;
  const message = buildMessage();
  const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`;
  $('checkoutBtn').disabled = true;
  sendTelegramOrder(message);
  $('waLink').href = url;
  $('sent').classList.remove('hidden');
  // Same-tab navigation: mobile browsers block window.open() after alerts or async work.
  window.location.href = url;
  setTimeout(() => { $('checkoutBtn').disabled = false; }, 4000);
}

// ----------- EVENTS -----------
const sheet = open => { document.body.classList.toggle('sheet', open); if (open) update(); };

document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  const today = todayStr();
  $('deliveryDate').min = today; $('pickupDate').min = today;

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (b) { const n = b.dataset.n; setQty(n, (cart[n] || 0) + (b.dataset.act === "inc" ? 1 : -1)); return; }
    if (e.target.classList.contains('thumb')) {
      $('lightboxImg').src = e.target.src; $('lightboxImg').alt = e.target.alt;
      $('lightbox').classList.remove('hidden');
    }
  });
  document.addEventListener('change', e => {
    if (e.target.dataset.addon) { addons[e.target.dataset.addon] = e.target.checked; update(); }
  });
  document.querySelectorAll('input[name="order_type"]').forEach(r => r.addEventListener('change', toggleFields));
  $('deliveryCity').addEventListener('change', toggleFields);
  $('bar').addEventListener('click', () => sheet(true));
  $('closeSheet').addEventListener('click', () => sheet(false));
  $('backdrop').addEventListener('click', () => sheet(false));
  $('lightbox').addEventListener('click', e => { if (e.target.id !== 'lightboxImg') $('lightbox').classList.add('hidden'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { sheet(false); $('lightbox').classList.add('hidden'); } });
  $('orderForm').addEventListener('submit', submitOrder);

  // highlight active section tab
  const tabs = [...document.querySelectorAll('.tabs a')];
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) tabs.forEach(t => t.classList.toggle('on', t.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-30% 0px -60% 0px' });
  document.querySelectorAll('.menu section').forEach(s => io.observe(s));

  toggleFields();
});
