document.addEventListener("DOMContentLoaded", () => {

    const menuItems = document.querySelectorAll(".menu-item");

    const overlay = document.getElementById("food-details-overlay");
    const content = document.getElementById("food-details-content");

    const foodImage = document.getElementById("food-image");
    const foodName = document.getElementById("food-name");
    const foodIngredients = document.getElementById("food-ingredients");

    const closeButton = document.querySelector(".close-button");


    /* =====================================================
       ABRIR DETALLES DE LA COMIDA
       ===================================================== */

    menuItems.forEach(item => {

        item.addEventListener("click", () => {

            const nameElement = item.querySelector("p:first-child");
            const descriptionElement = item.querySelector(".description");
            const priceElement = item.querySelector("span");

            const name = nameElement
                ? nameElement.textContent.trim()
                : "Producto";

            const description = descriptionElement
                ? descriptionElement.textContent.trim()
                : "Producto de Rancho Burger";

            const price = priceElement
                ? priceElement.textContent.trim()
                : "";


            /* Nombre */

            foodName.textContent = name;


            /* Descripción + precio */

            if (price) {

                foodIngredients.innerHTML = `
                    <strong>${description}</strong>
                    <br><br>
                    <span class="modal-price">${price}</span>
                `;

            } else {

                foodIngredients.textContent = description;

            }


            /* =================================================
               BUSCAR LA IMAGEN DE LA CATEGORÍA
               ================================================= */

            const section = item.closest(".menu-section");

            const sectionImage = section
                ? section.querySelector(".section-image")
                : null;


            if (sectionImage) {

                foodImage.src = sectionImage.src;

                foodImage.alt = name;

                foodImage.style.display = "block";

            } else {

                foodImage.style.display = "none";

            }


            /* =================================================
               MOSTRAR MODAL
               ================================================= */

            overlay.classList.add("active");

            document.body.style.overflow = "hidden";

        });

    });


    /* =====================================================
       CERRAR MODAL
       ===================================================== */

    function closeModal() {

        overlay.classList.remove("active");

        document.body.style.overflow = "";

    }


    /* Botón X */

    if (closeButton) {

        closeButton.addEventListener("click", closeModal);

    }


    /* Cerrar haciendo clic fuera */

    overlay.addEventListener("click", (event) => {

        if (event.target === overlay) {

            closeModal();

        }

    });


    /* =====================================================
       CERRAR CON ESC
       ===================================================== */

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeModal();

        }

    });


    /* =====================================================
       EVITAR QUE EL CLICK DENTRO DEL MODAL LO CIERRE
       ===================================================== */

    if (content) {

        content.addEventListener("click", (event) => {

            event.stopPropagation();

        });

    }

});