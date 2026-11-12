document.addEventListener("DOMContentLoaded", async () => {
    // Conexión pública de solo lectura: los precios se administran desde admin.html.
    const config = window.RANCHO_SUPABASE_CONFIG || {};
    const configured = config.url && config.anonKey &&
        !config.url.includes("TU-PROYECTO") && !config.anonKey.includes("TU-CLAVE");

    if (configured && window.supabase?.createClient) {
        const db = window.supabase.createClient(config.url, config.anonKey);
        try {
            const { data, error } = await db
                .from("products")
                .select("id, price")
                .eq("active", true);
            if (error) throw error;

            const prices = new Map((data || []).map(p => [p.id, p.price]));
            document.querySelectorAll(".menu-item[data-product-id]").forEach(item => {
                const id = item.dataset.productId;
                if (!prices.has(id)) return;

                let priceEl = item.querySelector(".menu-price");
                if (!priceEl) {
                    priceEl = [...item.querySelectorAll(":scope > span")]
                        .find(el => !el.classList.contains("description"));
                    if (priceEl) priceEl.classList.add("menu-price");
                }

                const price = prices.get(id);
                if (price === null || price === undefined) {
                    if (priceEl) priceEl.remove();
                } else {
                    if (!priceEl) {
                        priceEl = document.createElement("span");
                        priceEl.className = "menu-price";
                        item.appendChild(priceEl);
                    }
                    priceEl.textContent = formatCOP(price);
                }
            });
        } catch (err) {
            console.error("No se pudieron sincronizar los precios. Se muestran los valores guardados en el HTML.", err);
        }
    } else {
        console.warn("Supabase no está configurado; se muestran los precios de respaldo del HTML.");
    }

    // Modal de detalle
    const menuItems = document.querySelectorAll(".menu-item");
    const overlay = document.getElementById("food-details-overlay");
    const content = document.getElementById("food-details-content");
    const foodImage = document.getElementById("food-image");
    const foodName = document.getElementById("food-name");
    const foodIngredients = document.getElementById("food-ingredients");
    const closeButton = document.querySelector(".close-button");

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            if (!overlay || !foodName || !foodIngredients || !foodImage) return;
            const name = item.querySelector("p:first-child")?.textContent.trim() || "Producto";
            const description = item.querySelector(".description")?.textContent.trim() || "Producto de Rancho Burger";
            const priceElement = item.querySelector(".menu-price") ||
                [...item.querySelectorAll(":scope > span")].find(el => !el.classList.contains("description"));
            const price = priceElement?.textContent.trim() || "";

            foodName.textContent = name;
            foodIngredients.textContent = description;
            if (price) {
                const priceSpan = document.createElement("span");
                priceSpan.className = "modal-price";
                priceSpan.textContent = price;
                foodIngredients.append(document.createElement("br"), document.createElement("br"), priceSpan);
            }

            const sectionImage = item.closest(".menu-section")?.querySelector(".section-image");
            if (sectionImage) {
                foodImage.src = sectionImage.src;
                foodImage.alt = name;
                foodImage.style.display = "block";
            } else {
                foodImage.style.display = "none";
            }
            overlay.classList.add("active");
            document.body.style.overflow = "hidden";
        });
    });

    function closeModal() {
        overlay?.classList.remove("active");
        document.body.style.overflow = "";
    }
    closeButton?.addEventListener("click", closeModal);
    overlay?.addEventListener("click", event => {
        if (event.target === overlay) closeModal();
    });
    content?.addEventListener("click", event => event.stopPropagation());
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeModal();
    });
});

function formatCOP(value) {
    return "$" + Number(value).toLocaleString("es-CO", { maximumFractionDigits: 0 });
}
// =====================================
// CORREGIR PANTALLA DE BIENVENIDA
// =====================================

(function () {
    function cerrarBienvenida() {
        const posiblesPantallas = [
            "#intro",
            "#intro-screen",
            "#loading-screen",
            "#loader",
            ".intro",
            ".intro-screen",
            ".loading-screen",
            ".loader",
            ".splash-screen",
            ".welcome-screen"
        ];

        posiblesPantallas.forEach(selector => {
            document.querySelectorAll(selector).forEach(elemento => {
                elemento.style.opacity = "0";
                elemento.style.visibility = "hidden";
                elemento.style.pointerEvents = "none";

                setTimeout(() => {
                    elemento.style.display = "none";
                }, 700);
            });
        });

        document.body.classList.remove("loading");
        document.body.classList.remove("intro-active");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            setTimeout(cerrarBienvenida, 1500);
        });
    } else {
        setTimeout(cerrarBienvenida, 1500);
    }

    // Respaldo por si algún recurso tarda en cargar
    window.addEventListener("load", cerrarBienvenida);
})();