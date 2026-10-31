// ----------- TELEGRAM CONFIGURATIONS -----------
const TELEGRAM_BOT_TOKEN = '8871844782:AAESEct5I23R4yyDVWOXivxJ7o808pJeneU';
const TELEGRAM_CHAT_ID = '-1003350834763';
// Cities that are allowed to select a delivery time
const ALLOWED_TIME_CITIES = ["Dubai", "Sharjah", "Ajman", "Umm Al Quwain"];

// Telegram send function
function sendTelegramOrder(message) {
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    })
  }).then(response => {
    if (!response.ok) {
      console.error("Telegram message failed", response.status);
    }
  }).catch(e => {
    console.error("Telegram error", e);
  });
}

// ----------- Rest of cart and checkout code -----------
const cart = {};

function getDeliveryFee(city) {
  const chargeCities = [
    "Fujairah",
    "Ras Al Khaimah",
    "Abu Dhabi",
    "Al Ain",
    "Umm Al Quwain"
  ];
  if (chargeCities.includes(city)) return 45;
  return 0;
}

function updateCartSummary() {
  const count = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  let total = Object.values(cart).reduce((sum, item) => sum + (item.qty * item.price), 0);
  if (document.getElementById('extra_garlic_og')?.checked) total += 5;
  if (document.getElementById('extra_garlic_zaatar')?.checked) total += 5;
  if (document.getElementById('extra_choc_diabetes')?.checked) total += 5;
  const orderType = document.querySelector('input[name="order_type"]:checked');
  let deliveryFee = 0;
  if (orderType && orderType.value === 'delivery') {
    const city = document.getElementById('deliveryCity')?.value || "";
    deliveryFee = getDeliveryFee(city);
    total += deliveryFee;
  }
  const summaryEl = document.getElementById('cartSummary');
  summaryEl.innerHTML = `Cart: ${count} item${count !== 1 ? 's' : ''} <span id="cartTotal">${total} AED</span>`;
}

function updateCartItem(name, qty, price) {
  if (qty <= 0) {
    delete cart[name];
    qty = 0;
  } else {
    cart[name] = { qty, price };
  }
  const productInput = document.querySelector(`#qty_${name.toLowerCase().replace(/ /g, '_')}`);
  if (productInput) {
    productInput.value = qty;
    // Swap "Add to cart" button for the stepper
    const card = productInput.closest('.product-card');
    if (card) card.classList.toggle('in-cart', qty > 0);
  }
  const cartPanelInputs = document.querySelectorAll(`#cartList input.qty-input`);
  cartPanelInputs.forEach(input => {
    if (input.getAttribute('aria-label') === `${name} quantity`) {
      input.value = qty;
    }
  });
  updateCartSummary();
}

function populateCartPanel() {
  const cartPanel = document.getElementById('cartPanel');
  const cartList = cartPanel.querySelector('#cartList');
  cartList.innerHTML = "";
  const entries = Object.entries(cart);
  if (entries.length === 0) {
    cartList.innerHTML = "<li>Your cart is empty.</li>";
    return;
  }
  let total = 0;
  for (const [name, item] of entries) {
    const li = document.createElement("li");
    li.className = "cart-item";
    const itemNameSpan = document.createElement("span");
    itemNameSpan.textContent = name + ": ";
    li.appendChild(itemNameSpan);
    const minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.textContent = "-";
    minusBtn.className = "qty-btn minus";
    minusBtn.setAttribute("aria-label", `Reduce ${name} quantity`);
    li.appendChild(minusBtn);
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = 0;
    qtyInput.max = 10;
    qtyInput.value = item.qty;
    qtyInput.className = "qty-input";
    qtyInput.setAttribute("aria-label", `${name} quantity`);
    li.appendChild(qtyInput);
    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.textContent = "+";
    plusBtn.className = "qty-btn plus";
    plusBtn.setAttribute("aria-label", `Increase ${name} quantity`);
    li.appendChild(plusBtn);
    const priceSpan = document.createElement("span");
    priceSpan.textContent = ` - ${item.qty * item.price} AED`;
    priceSpan.className = "cart-item-price";
    li.appendChild(priceSpan);
    cartList.appendChild(li);
    total += item.qty * item.price;
    minusBtn.addEventListener("click", () => {
      let newQty = Math.max(0, item.qty - 1);
      updateCartItem(name, newQty, item.price);
      populateCartPanel();
      populateOverviewCart();
    });
    plusBtn.addEventListener("click", () => {
      let newQty = Math.min(10, item.qty + 1);
      updateCartItem(name, newQty, item.price);
      populateCartPanel();
      populateOverviewCart();
    });
    qtyInput.addEventListener("input", (e) => {
      let val = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
      updateCartItem(name, val, item.price);
      populateCartPanel();
      populateOverviewCart();
    });
  }
  ['extra_garlic_og', 'extra_garlic_zaatar', 'extra_choc_diabetes'].forEach(id => {
    const chk = document.getElementById(id);
    if (chk?.checked) {
      const li = document.createElement("li");
      const labels = {
        'extra_garlic_og': "Extra garlic sauce (OG Bunku)",
        'extra_garlic_zaatar': "Extra garlic sauce (Zaatar Bomb)",
        'extra_choc_diabetes': "Extra chocolate sauce (Diabetes)"
      };
      li.textContent = `${labels[id]}: +5 AED`;
      cartList.appendChild(li);
      total += 5;
    }
  });
  const orderType = document.querySelector('input[name="order_type"]:checked');
  if (orderType && orderType.value === 'delivery') {
    const city = document.getElementById('deliveryCity')?.value || "";
    const deliveryFee = getDeliveryFee(city);
    if (deliveryFee) {
      const li = document.createElement("li");
      li.textContent = `Delivery fee: +${deliveryFee} AED`;
      cartList.appendChild(li);
      total += deliveryFee;
    } else if (city) {
      const li = document.createElement("li");
      li.textContent = "Delivery charge estimated on message";
      cartList.appendChild(li);
    }
  }
  const totalLi = document.createElement("li");
  totalLi.textContent = `Total: ${total} AED`;
  totalLi.style.fontWeight = 'bold';
  cartList.appendChild(totalLi);
}

function populateOverviewCart() {
  const overviewList = document.getElementById("overviewCartList");
  overviewList.innerHTML = "";
  const entries = Object.entries(cart);
  if (entries.length === 0) {
    overviewList.innerHTML = "<li>Your cart is empty.</li>";
    return;
  }
  entries.forEach(([name, item]) => {
    const li = document.createElement("li");
    li.textContent = `${name}: ${item.qty} box${item.qty !== 1?"es":""} - ${item.qty * item.price} AED`;
    overviewList.appendChild(li);
  });
  let total = Object.values(cart).reduce((sum, item) => sum + (item.qty * item.price), 0);
  ['extra_garlic_og', 'extra_garlic_zaatar', 'extra_choc_diabetes'].forEach(id => {
    if(document.getElementById(id)?.checked) total += 5;
  });
  const orderType = document.querySelector('input[name="order_type"]:checked');
  if (orderType && orderType.value === 'delivery') {
    const city = document.getElementById('deliveryCity')?.value || "";
    const deliveryFee = getDeliveryFee(city);
    total += deliveryFee;
  }
  const totalLi = document.createElement("li");
  totalLi.textContent = `Total: ${total} AED`;
  totalLi.style.fontWeight = "bold";
  overviewList.appendChild(totalLi);
}

function isSameDayAllowed(city) {
  return ["Ajman", "Dubai", "Sharjah"].includes(city);
}

// Show/hide and disable delivery time field based on city
function toggleDeliveryTimeField() {
  const city = document.getElementById('deliveryCity').value;
  const timeInput = document.getElementById('deliveryTime');
  const timeMessage = document.getElementById('deliveryTimeMessage');
  const timeError = document.getElementById('deliveryTimeError');

  if (ALLOWED_TIME_CITIES.includes(city)) {
    timeInput.disabled = false;
    timeInput.required = true;
    timeMessage.classList.add('hidden');
    timeError.classList.remove('hidden');
  } else {
    timeInput.disabled = true;
    timeInput.required = false;
    timeInput.value = '';
    timeMessage.classList.remove('hidden');
    timeError.classList.add('hidden');
  }
}

function showHideOrderFields() {
  const deliveryFields = document.getElementById('deliveryFields');
  const pickupFields = document.getElementById('pickupFields');
  const orderType = document.querySelector('input[name="order_type"]:checked');
  if (!orderType) {
    deliveryFields.classList.add('hidden');
    pickupFields.classList.add('hidden');
    return;
  }
  if (orderType.value === "delivery") {
    deliveryFields.classList.remove('hidden');
    pickupFields.classList.add('hidden');
    toggleDeliveryTimeField();
  } else if (orderType.value === "pickup") {
    pickupFields.classList.remove('hidden');
    deliveryFields.classList.add('hidden');
  }
  updateDeliveryChargeInfo();
}

function updateDeliveryChargeInfo() {
  const city = document.getElementById('deliveryCity')?.value || "";
  const fee = getDeliveryFee(city);
  const info = document.getElementById('deliveryChargeInfo');
  if (fee) {
    info.textContent = `Delivery charge: +${fee} AED`;
  } else if (city) {
    info.textContent = "Delivery charge estimated on message";
  } else {
    info.textContent = "";
  }
}

function validateForm() {
  let valid = true;
  document.querySelectorAll(".error").forEach(span => span.textContent = "");
  const orderType = document.querySelector('input[name="order_type"]:checked');
  if (!orderType) {
    alert("Please select order type: Delivery or Pick up.");
    return false;
  }
  if (orderType.value === "delivery") {
    const name = document.getElementById("deliveryName").value.trim();
    const phone = document.getElementById("deliveryPhone").value.trim();
    const city = document.getElementById("deliveryCity").value;
    const date = document.getElementById("deliveryDate").value;
    const time = document.getElementById("deliveryTime").value;
    const area = document.getElementById("deliveryArea").value.trim();
    if (!name) {
      document.getElementById("deliveryNameError").textContent = "Name required";
      valid = false;
    }
    if (!phone || !/^\d+$/.test(phone)) {
      document.getElementById("deliveryPhoneError").textContent = "Valid phone required";
      valid = false;
    }
    if (!city) {
      document.getElementById("deliveryCityError").textContent = "Select city";
      valid = false;
    }
    if (!date) {
      document.getElementById("deliveryDateError").textContent = "Select date";
      valid = false;
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (selectedDate < today) {
        document.getElementById("deliveryDateError").textContent = "Date cannot be in past";
        valid = false;
      } else if (selectedDate.getTime() === today.getTime() && !isSameDayAllowed(city)) {
        document.getElementById("deliveryDateError").textContent = "Same day delivery allowed only in Ajman, Dubai, Sharjah";
        valid = false;
      }
    }
    if (ALLOWED_TIME_CITIES.includes(city)) {
      if (!time) {
        document.getElementById("deliveryTimeError").textContent = "Select time";
        valid = false;
      }
    }
    if (!area) {
      document.getElementById("deliveryAreaError").textContent = "Area required";
      valid = false;
    }
  } else if (orderType.value === "pickup") {
    const name = document.getElementById("pickupName").value.trim();
    const phone = document.getElementById("pickupPhone").value.trim();
    const plate = document.getElementById("pickupPlate").value.trim();
    const date = document.getElementById("pickupDate").value;
    const time = document.getElementById("pickupTime").value;
    if (!name) {
      document.getElementById("pickupNameError").textContent = "Name required";
      valid = false;
    }
    if (!phone || !/^\d+$/.test(phone)) {
      document.getElementById("pickupPhoneError").textContent = "Valid phone required";
      valid = false;
    }
    if (!plate || !/^[a-zA-Z0-9]+$/.test(plate)) {
      document.getElementById("pickupPlateError").textContent = "Valid plate number required";
      valid = false;
    }
    if (!date) {
      document.getElementById("pickupDateError").textContent = "Select date";
      valid = false;
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (selectedDate < today) {
        document.getElementById("pickupDateError").textContent = "Date cannot be in past";
        valid = false;
      } else if (selectedDate.getTime() === today.getTime() && !isSameDayAllowed("Dubai")) {
        document.getElementById("pickupDateError").textContent = "Same day pickup allowed only in Ajman, Dubai, Sharjah";
        valid = false;
      }
    }
    if (!time) {
      document.getElementById("pickupTimeError").textContent = "Select time";
      valid = false;
    }
  }
  return valid;
}

// Real price comes from data-price on the card (the struck-through price is decorative only)
function getCardPrice(el) {
  const card = el.closest('.product-card');
  return Number(card?.dataset.price) || 0;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.qty-input').forEach(input => {
    if (input.closest('#cartList')) return;
    input.addEventListener('input', (e) => {
      const name = e.target.dataset.name;
      const qty = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
      e.target.value = qty;
      updateCartItem(name, qty, getCardPrice(e.target));
      populateCartPanel();
      populateOverviewCart();
    });
  });

  document.querySelectorAll('.product-card .qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const input = document.getElementById(`qty_${name.toLowerCase().replace(/ /g, '_')}`);
      if (!input) return;
      let qty = parseInt(input.value) || 0;
      if (btn.classList.contains('plus')) qty = Math.min(qty + 1, 10);
      if (btn.classList.contains('minus')) qty = Math.max(qty - 1, 0);
      input.value = qty;
      updateCartItem(name, qty, getCardPrice(input));
      populateCartPanel();
      populateOverviewCart();
    });
  });

  // "Add to cart" buttons
  document.querySelectorAll('.add').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      updateCartItem(name, 1, getCardPrice(btn));
      populateCartPanel();
      populateOverviewCart();
    });
  });

  ['extra_garlic_og', 'extra_garlic_zaatar', 'extra_choc_diabetes'].forEach(id => {
    const cb = document.getElementById(id);
    if (cb) cb.addEventListener('change', () => {
      updateCartSummary();
      populateCartPanel();
      populateOverviewCart();
    });
  });

  const cartSummary = document.getElementById('cartSummary');
  const cartPanel = document.getElementById('cartPanel');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const orderTypeRadios = document.querySelectorAll('input[name="order_type"]');
  const deliveryCitySelect = document.getElementById('deliveryCity');

  orderTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      showHideOrderFields();
      populateOverviewCart();
    });
  });
  deliveryCitySelect.addEventListener('change', () => {
    updateDeliveryChargeInfo();
    updateCartSummary();
    toggleDeliveryTimeField();
  });
  cartSummary.addEventListener('click', () => {
    const isVisible = cartPanel.classList.contains('show');
    if (isVisible) {
      cartPanel.classList.remove('show');
      cartPanel.setAttribute('aria-hidden', 'true');
      cartSummary.focus();
    } else {
      populateCartPanel();
      cartPanel.classList.add('show');
      cartPanel.setAttribute('aria-hidden', 'false');
    }
  });
  closeCartBtn.addEventListener('click', () => {
    cartPanel.classList.remove('show');
    cartPanel.setAttribute('aria-hidden', 'true');
    cartSummary.focus();
  });

  // Lightbox logic for product images
  document.querySelectorAll('.product-img').forEach(img => {
    img.addEventListener('click', () => {
      const lightbox = document.getElementById('lightbox');
      const lightboxImg = document.getElementById('lightboxImg');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  });
  document.getElementById('lightboxClose').addEventListener('click', () => {
    document.getElementById('lightbox').classList.add('hidden');
    document.body.style.overflow = '';
  });
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });

  checkoutBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (Object.values(cart).reduce((a, b) => a + b.qty, 0) < 1) {
      alert("Your cart is empty. Please add at least one item.");
      return;
    }
    if (!validateForm()) return;
    let total = 0;
    let message = `Hello! I placed an order:\n\n`;

    const orderType = document.querySelector('input[name="order_type"]:checked');
    if (orderType.value === "delivery") {
      const deliveryName = document.getElementById("deliveryName").value.trim();
      const deliveryPhone = document.getElementById("deliveryPhone").value.trim();
      const deliveryCity = document.getElementById("deliveryCity").value;
      const deliveryDate = document.getElementById("deliveryDate").value;
      const deliveryTimeInput = document.getElementById("deliveryTime");
      let deliveryTimeText;
      if (ALLOWED_TIME_CITIES.includes(deliveryCity)) {
        deliveryTimeText = deliveryTimeInput.value;
      } else {
        deliveryTimeText = "Due to your region, time of delivery is unavailable";
      }
      const deliveryArea = document.getElementById("deliveryArea").value.trim();
      let deliveryCharge = getDeliveryFee(deliveryCity);
      if (deliveryCharge === 0) deliveryCharge = "Estimated on message";
      message += "Delivery Details:\n";
      message += `Name: ${deliveryName}\nPhone: ${deliveryPhone}\nCity: ${deliveryCity}\nDate: ${deliveryDate}\nTime: ${deliveryTimeText}\nArea: ${deliveryArea}\nDelivery Charge: ${deliveryCharge} AED\n\n`;
    } else if (orderType.value === "pickup") {
      const pickupName = document.getElementById("pickupName").value.trim();
      const pickupPhone = document.getElementById("pickupPhone").value.trim();
      const pickupPlate = document.getElementById("pickupPlate").value.trim();
      const pickupDate = document.getElementById("pickupDate").value;
      const pickupTime = document.getElementById("pickupTime").value;
      message += "Pick Up Details:\n";
      message += `Name: ${pickupName}\nPhone: ${pickupPhone}\nPlate Number: ${pickupPlate}\nDate: ${pickupDate}\nTime: ${pickupTime}\n\n`;
    }

    message += "Orders:\n";
    for (const [name, item] of Object.entries(cart)) {
      message += `${name}: ${item.qty} box(es)\n`;
      total += item.qty * item.price;
    }
    if (document.getElementById('extra_garlic_og')?.checked) {
      message += "Extra garlic sauce (OG Bunku): Yes (+5 AED)\n";
      total += 5;
    }
    if (document.getElementById('extra_garlic_zaatar')?.checked) {
      message += "Extra garlic sauce (Zaatar Bomb): Yes (+5 AED)\n";
      total += 5;
    }
    if (document.getElementById('extra_choc_diabetes')?.checked) {
      message += "Extra chocolate sauce (Diabetes): Yes (+5 AED)\n";
      total += 5;
    }
    if (orderType.value === "delivery") {
      const deliveryCity = document.getElementById("deliveryCity").value;
      let deliveryCharge = getDeliveryFee(deliveryCity);
      if (typeof deliveryCharge === "number") total += deliveryCharge;
    }
    message += `\nTotal: ${total} AED`;

    sendTelegramOrder(message);

    const whatsappUrl = `https://api.whatsapp.com/send?phone=971544588113&text=${encodeURIComponent(message)}`;
    alert("Order sent! Redirecting to WhatsApp.");
    window.open(whatsappUrl, "_blank");
  });

  updateCartSummary();
  populateCartPanel();
  populateOverviewCart();
  showHideOrderFields();
});
