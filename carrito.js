
document.addEventListener("DOMContentLoaded", () => {
    // CAMBIA ESTE NÚMERO POR EL WHATSAPP DEL RESTAURANTE.
    // Colombia: 57 + número de celular, sin espacios ni signos.
    const WHATSAPP_RANCHO = "573015092315";

    const $ = (id) => document.getElementById(id);
    const panel = $("cartPanel");
    const backdrop = $("cartBackdrop");
    const cartItems = $("cartItems");
    const cartCount = $("cartCount");
    const subtotal = $("cartSubtotal");
    const checkoutButton = $("checkoutButton");
    const checkoutOverlay = $("checkoutOverlay");
    const checkoutForm = $("checkoutForm");
    const toast = $("toastMessage");

    let carrito = JSON.parse(localStorage.getItem("ranchoCarrito") || "[]");

    const pesos = (valor) =>
        "$" + Number(valor).toLocaleString("es-CO", {
            maximumFractionDigits: 0
        });

    function mostrarAviso(mensaje) {
        if (!toast) return;
        toast.textContent = mensaje;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2500);
    }

    function guardar() {
        localStorage.setItem("ranchoCarrito", JSON.stringify(carrito));
        pintarCarrito();
    }

    function abrirCarrito() {
        panel?.classList.add("open");
        backdrop?.classList.add("visible");
        panel?.setAttribute("aria-hidden", "false");
    }

    function cerrarCarrito() {
        panel?.classList.remove("open");
        backdrop?.classList.remove("visible");
        panel?.setAttribute("aria-hidden", "true");
    }

    $("openCart")?.addEventListener("click", abrirCarrito);
    $("closeCart")?.addEventListener("click", cerrarCarrito);
    backdrop?.addEventListener("click", cerrarCarrito);

    // Agregar botón a cada producto que tenga precio.
    document.querySelectorAll(".menu-item").forEach((producto) => {
        if (producto.querySelector(".add-cart-button")) return;

        const nombre = producto.querySelector("p:first-child")
            ?.textContent.trim() || "Producto";

        const precioElemento = [...producto.querySelectorAll(":scope > span")]
            .find(el => !el.classList.contains("description"));

        const precioTexto = precioElemento?.textContent || "";
        const coincidencia = precioTexto.match(/\$?\s*([\d.,]+)/);

        if (!coincidencia) return;

        const precio = Number(coincidencia[1].replace(/[.,]/g, ""));
        if (!Number.isFinite(precio) || precio <= 0) return;

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "add-cart-button";
        boton.textContent = "＋ AGREGAR";

        boton.addEventListener("click", (evento) => {
            evento.stopPropagation();

            const id = producto.dataset.productId || nombre;

            const existente = carrito.find(item => item.id === id);

            if (existente) {
                existente.cantidad++;
            } else {
                carrito.push({
                    id,
                    nombre,
                    precio,
                    cantidad: 1
                });
            }

            guardar();
            mostrarAviso(nombre + " agregado al pedido");
        });

        producto.appendChild(boton);
    });

    function pintarCarrito() {
        if (!cartItems) return;

        cartItems.replaceChildren();

        if (carrito.length === 0) {
            cartItems.innerHTML =
                '<p class="cart-empty">Tu carrito está esperando algo delicioso 🤠</p>';
        }

        let total = 0;
        let unidades = 0;

        carrito.forEach(item => {
            total += item.precio * item.cantidad;
            unidades += item.cantidad;

            const fila = document.createElement("div");
            fila.className = "cart-row";

            const informacion = document.createElement("div");
            const titulo = document.createElement("strong");
            titulo.textContent = item.nombre;

            const detalle = document.createElement("small");
            detalle.textContent = pesos(item.precio) + " c/u";

            informacion.append(titulo, detalle);

            const valor = document.createElement("strong");
            valor.textContent = pesos(item.precio * item.cantidad);

            const controles = document.createElement("div");
            controles.className = "cart-controls";

            const menos = document.createElement("button");
            menos.type = "button";
            menos.textContent = "−";
            menos.setAttribute("aria-label", "Quitar uno");
            menos.addEventListener("click", () => cambiarCantidad(item.id, -1));

            const cantidad = document.createElement("span");
            cantidad.textContent = item.cantidad;

            const mas = document.createElement("button");
            mas.type = "button";
            mas.textContent = "+";
            mas.setAttribute("aria-label", "Agregar uno más");
            mas.addEventListener("click", () => cambiarCantidad(item.id, 1));

            const quitar = document.createElement("button");
            quitar.type = "button";
            quitar.className = "cart-remove";
            quitar.textContent = "Eliminar";
            quitar.addEventListener("click", () => {
                carrito = carrito.filter(p => p.id !== item.id);
                guardar();
            });

            controles.append(menos, cantidad, mas, quitar);
            fila.append(informacion, valor, controles);
            cartItems.appendChild(fila);
        });

        if (cartCount) cartCount.textContent = unidades;
        if (subtotal) subtotal.textContent = pesos(total);
        if (checkoutButton) checkoutButton.disabled = carrito.length === 0;
    }

    function cambiarCantidad(id, cambio) {
        const item = carrito.find(p => p.id === id);
        if (!item) return;

        item.cantidad += cambio;

        if (item.cantidad <= 0) {
            carrito = carrito.filter(p => p.id !== id);
        }

        guardar();
    }

    // Abrir formulario de datos del cliente.
    checkoutButton?.addEventListener("click", () => {
        if (carrito.length === 0) return;
        cerrarCarrito();
        checkoutOverlay?.classList.add("visible");
        checkoutOverlay?.setAttribute("aria-hidden", "false");
    });

    $("closeCheckout")?.addEventListener("click", () => {
        checkoutOverlay?.classList.remove("visible");
        checkoutOverlay?.setAttribute("aria-hidden", "true");
    });

    // Mostrar u ocultar dirección según el tipo de pedido.
    $("orderType")?.addEventListener("change", (evento) => {
        const esDomicilio = evento.target.value === "Domicilio";
        const campos = $("addressFields");

        if (campos) campos.style.display = esDomicilio ? "block" : "none";

        $("address")?.toggleAttribute("required", esDomicilio);
        $("neighborhood")?.toggleAttribute("required", esDomicilio);
    });

    // Enviar resumen del pedido a WhatsApp.
    checkoutForm?.addEventListener("submit", (evento) => {
        evento.preventDefault();

        if (carrito.length === 0) return;

        if (WHATSAPP_RANCHO.includes("X")) {
            mostrarAviso("Configura primero el WhatsApp del restaurante en carrito.js");
            return;
        }

        const datos = new FormData(checkoutForm);
        const nombre = datos.get("customerName");
        const telefono = datos.get("phone");
        const tipo = datos.get("orderType");
        const direccion = datos.get("address");
        const barrio = datos.get("neighborhood");
        const pago = datos.get("payment");
        const notas = datos.get("notes");

        let total = 0;
        let mensaje = "🤠 *NUEVO PEDIDO - RANCHO BURGER*%0A%0A";

        mensaje += "*Cliente:* " + nombre + "%0A";
        mensaje += "*Celular:* " + telefono + "%0A";
        mensaje += "*Tipo:* " + tipo + "%0A";

        if (tipo === "Domicilio") {
            mensaje += "*Dirección:* " + direccion + "%0A";
            mensaje += "*Barrio:* " + barrio + "%0A";
        }

        mensaje += "*Pago:* " + pago + "%0A%0A";
        mensaje += "*PRODUCTOS:*%0A";

        carrito.forEach(item => {
            const parcial = item.precio * item.cantidad;
            total += parcial;

            mensaje += "• " + item.nombre +
                " x" + item.cantidad +
                " - " + pesos(parcial) + "%0A";
        });

        mensaje += "%0A*TOTAL: " + pesos(total) + "*";

        if (notas) {
            mensaje += "%0A*Notas:* " + notas;
        }

        const url = "https://wa.me/" + WHATSAPP_RANCHO +
            "?text=" + encodeURIComponent(
                decodeURIComponent(mensaje.replace(/%0A/g, "\n"))
            );

        window.open(url, "_blank");

        carrito = [];
        guardar();
        checkoutForm.reset();
        checkoutOverlay?.classList.remove("visible");
        checkoutOverlay?.setAttribute("aria-hidden", "true");
        mostrarAviso("Pedido preparado. Confirma el envío en WhatsApp.");
    });

    pintarCarrito();
});
