document.addEventListener("DOMContentLoaded", () => {
  const config = window.RANCHO_SUPABASE_CONFIG || {};
  const loginPanel = document.getElementById("login-panel");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const statusMessage = document.getElementById("status-message");
  const tbody = document.getElementById("products-body");
  const search = document.getElementById("search");
  const categoryFilter = document.getElementById("category-filter");
  const count = document.getElementById("product-count");
  let client = null;
  let products = [];

  if (!config.url || !config.anonKey || config.url.includes("TU-PROYECTO") || config.anonKey.includes("TU-CLAVE")) {
    loginMessage.textContent = "Primero configura la URL y la clave publicable en supabase-config.js.";
    loginMessage.classList.add("error");
    loginForm.querySelector("button").disabled = true;
    return;
  }
  client = window.supabase.createClient(config.url, config.anonKey);

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    setMessage(loginMessage, "Verificando acceso...");
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) { setMessage(loginMessage, "No se pudo iniciar sesión. Revisa tus datos y que el usuario esté autorizado.", "error"); return; }
    await showDashboard();
  });
  document.getElementById("logout-button").addEventListener("click", async () => {
    await client.auth.signOut();
    dashboard.hidden = true; loginPanel.hidden = false;
    loginForm.reset(); setMessage(loginMessage, "Sesión cerrada.");
  });
  search.addEventListener("input", renderProducts);
  categoryFilter.addEventListener("change", renderProducts);

  client.auth.getSession().then(async ({data}) => {
    if (data.session) await showDashboard();
  });

  async function showDashboard() {
    loginPanel.hidden = true; dashboard.hidden = false;
    await loadProducts();
  }
  async function loadProducts() {
    setMessage(statusMessage, "Cargando menú...");
    const { data, error } = await client.from("products").select("id,category,name,description,price,active,sort_order").order("sort_order", {ascending:true});
    if (error) {
      setMessage(statusMessage, "No se pudieron cargar los productos. Verifica que tu usuario esté registrado como administrador en la tabla admin_users.", "error");
      tbody.innerHTML = "<tr><td colspan=\"5\">Sin acceso a los productos.</td></tr>"; return;
    }
    products = data || [];
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
    categoryFilter.innerHTML = '<option value="">Todas las categorías</option>' + categories.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
    count.textContent = `${products.length} productos registrados`;
    setMessage(statusMessage, ""); renderProducts();
  }
  function renderProducts() {
    const query = search.value.trim().toLocaleLowerCase("es");
    const category = categoryFilter.value;
    const filtered = products.filter(p => (!category || p.category === category) && (!query || `${p.name} ${p.category}`.toLocaleLowerCase("es").includes(query)));
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="5">No se encontraron productos.</td></tr>'; return; }
    tbody.innerHTML = filtered.map(p => `<tr data-id="${escapeHTML(p.id)}"><td><div class="product-name">${escapeHTML(p.name)}</div>${p.active ? "" : '<small>Oculto del menú público</small>'}</td><td>${escapeHTML(p.category)}</td><td class="price">${p.price == null ? "Sin precio" : formatCOP(p.price)}</td><td><input class="price-input" type="number" min="0" step="500" aria-label="Nuevo precio para ${escapeHTML(p.name)}" value="${p.price == null ? "" : p.price}" placeholder="Ej. 15000"></td><td><button class="save-button" type="button">Guardar</button></td></tr>`).join("");
    tbody.querySelectorAll(".save-button").forEach(button => button.addEventListener("click", savePrice));
  }
  async function savePrice(event) {
    const button = event.currentTarget;
    const row = button.closest("tr");
    const id = row.dataset.id;
    const input = row.querySelector("input");
    const value = input.value.trim();
    if (!value || !Number.isSafeInteger(Number(value)) || Number(value) < 0) { setMessage(statusMessage, "Escribe un precio válido en pesos colombianos, sin puntos ni comas.", "error"); input.focus(); return; }
    button.disabled = true; button.textContent = "Guardando...";
    const { error } = await client.from("products").update({price:Number(value), updated_at:new Date().toISOString()}).eq("id", id);
    button.disabled = false; button.textContent = "Guardar";
    if (error) { setMessage(statusMessage, "No se pudo guardar. Comprueba que tu cuenta esté autorizada como administrador.", "error"); return; }
    const product = products.find(p => p.id === id); if (product) product.price = Number(value);
    renderProducts(); setMessage(statusMessage, "Precio actualizado correctamente. Ya está guardado en la base de datos.", "success");
  }
  function setMessage(el, message, type="") { el.textContent = message; el.classList.remove("error","success"); if(type) el.classList.add(type); }
  function formatCOP(value) { return "$" + Number(value).toLocaleString("es-CO", {maximumFractionDigits:0}); }
  function escapeHTML(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
});
