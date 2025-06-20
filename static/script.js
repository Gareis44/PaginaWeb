const search = document.getElementById("search");
const suggestions = document.getElementById("suggestions");
const shoppingList = document.getElementById("shopping-list");
const confirmButton = document.getElementById("confirm-button");

let products = [];
let productMap = new Map();
let keywordIndex = new Map(); // Índice optimizado para búsqueda rápida
let searchTimeout;

// Función para normalizar cadenas
function normalizeString(str) {
    return str.normalize("NFD").replace(/[̀-\u036f]/g, "").toLowerCase();
}

// Función para extraer palabras clave correctamente
function extractKeywords(name) {
    const normalized = normalizeString(name);
    return normalized.split(/[^a-z0-9]+/).filter(Boolean); // Divide por cualquier carácter que no sea letra o número
}

// Funcion formatear precio ($ 1.041,34)
function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(value);
}

// Cargar productos y construir índice de búsqueda
fetch('https://ultra-mercado.onrender.com/productos')
    .then(response => response.json())
    .then(data => {
        products = data;

        products.forEach(product => {
            const keywords = extractKeywords(product.nombre); // Extraer palabras clave
            const normalizedName = keywords.join(" "); // Convertir de nuevo a string limpio

            productMap.set(normalizedName, product); // Guardar el producto con el nombre limpio

            // Construcción del índice de búsqueda
            keywords.forEach(word => {
                if (!keywordIndex.has(word)) {
                    keywordIndex.set(word, new Set());
                }
                keywordIndex.get(word).add(product);
            });
        });
    })
    .catch(error => console.error("Error al cargar productos:", error));

// Función mejorada de búsqueda con coincidencia exacta de todas las palabras clave
function searchProducts(query) {
    const queryWords = extractKeywords(query);
    if (queryWords.length === 0) return [];

    let matchedProducts = new Set(keywordIndex.get(queryWords[0]) || []);

    for (let i = 1; i < queryWords.length; i++) {
        if (!keywordIndex.has(queryWords[i])) {
            return []; // Si alguna palabra no tiene coincidencias, no hay resultados
        }
        matchedProducts = new Set([...matchedProducts].filter(product => keywordIndex.get(queryWords[i]).has(product)));
    }

    return Array.from(matchedProducts).sort((a, b) => a.precio - b.precio);
}

// Manejar Precio Total
function updateTotal() {
    const items = shoppingList.querySelectorAll("li");
    let total = 0;

    items.forEach(item => {
        const priceSpan = item.querySelector("span:last-of-type"); // El span que muestra precio total del producto
        const quantityInput = item.querySelector("input[type='number']");
        if (priceSpan && quantityInput) {
            // Extraer número del precio total que ya está calculado en formato moneda
            const texto = priceSpan.textContent;
            const match = texto.match(/\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/);
            if (match && match[1]) {
                const raw = match[1].replace(/\./g, "").replace(",", ".");
                const priceValue = parseFloat(raw);
                const qty = parseInt(quantityInput.value);
                total += priceValue; // priceValue ya es precio total producto (unitario * qty)
            }
        }
    });

    document.getElementById("total-container").textContent = `Total: ${formatCurrency(total)}`;
}

// Evento de entrada con debounce mejorado (500ms)
search.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        requestAnimationFrame(mostrarSugerencias);
    }, 500);
});

// Mostrar sugerencias
function mostrarSugerencias() {
    const query = normalizeString(search.value);
    suggestions.innerHTML = "";

    if (query) {
        const filtered = searchProducts(query);

        filtered.forEach(product => {
            const li = document.createElement("li");
            li.classList.add("list-group-item", "list-group-item-action", "d-flex", "align-items-center");
            li.style.cursor = "pointer";

            const img = document.createElement("img");
            img.src = product.imagen;
            img.alt = product.nombre;
            img.loading = "lazy";
            img.style.width = "100px";
            img.style.height = "100px";
            img.style.marginRight = "10px";

            const text = document.createElement("span");
            // text.innerHTML = `${product.nombre} - ${product.precio} (${product.db})`;
            text.innerHTML = `${product.nombre} ${formatCurrency(product.precio)} (${product.db})`;

            if (product.condicion) {
                const condition = document.createElement("small");
                condition.textContent = `\u2728 ${product.condicion}`; // Icono de estrella para destacar
                condition.style.color = "#ffc107"; // Color dorado
                condition.style.marginLeft = "10px";
                text.appendChild(condition);
            }

            li.appendChild(img);
            li.appendChild(text);
            li.addEventListener("click", () => addToShoppingList(product));
            suggestions.appendChild(li);
        });
    }
}

// Añadir productos a la lista compras
function addToShoppingList(product) {
    const li = document.createElement("li");
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

    const img = document.createElement("img");
    img.src = product.imagen;
    img.alt = product.nombre;
    img.style.width = "50px";
    img.style.height = "50px";
    img.style.marginRight = "10px";
    li.appendChild(img);

    const text = document.createElement("span");
    text.innerHTML = `${product.nombre} ${formatCurrency(product.precio)} (${product.db})`;

    if (product.condicion) {
        const condition = document.createElement("small");
        condition.textContent = `\u2728 ${product.condicion}`;
        condition.style.color = "#ffc107";
        condition.style.marginLeft = "10px";
        text.appendChild(condition);
    }

    li.appendChild(text);

    // ESTO AGREGA UNA CASILLA DE CANTIDAD
    // Input cantidad
    // const quantityInput = document.createElement("input");
    // quantityInput.type = "number";
    // quantityInput.min = "1";
    // quantityInput.value = 1;
    // // quantityInput.style.width = "60px";
    // // quantityInput.style.marginLeft = "10px";
    // // quantityInput.style.textAlign = "center";
    // quantityInput.className = "w-16 ml-2 text-center border rounded px-1 py-0.5 sm:py-1 sm:w-20";
    // li.appendChild(quantityInput);

    // Manejar las casillas de + y -
    const quantityWrapper = document.createElement("div");
    quantityWrapper.className = "flex items-center gap-1 ml-2";

    // Botón de restar
    const minusBtn = document.createElement("button");
    minusBtn.textContent = "−";
    minusBtn.className = "bg-gray-200 px-2 rounded text-lg";
    quantityWrapper.appendChild(minusBtn);

    // Input cantidad
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.value = 1;
    quantityInput.className = "w-12 text-center border rounded px-1 py-0.5";
    quantityWrapper.appendChild(quantityInput);

    // Botón de sumar
    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.className = "bg-gray-200 px-2 rounded text-lg";
    quantityWrapper.appendChild(plusBtn);

    // Insertar el conjunto en el <li>
    li.appendChild(quantityWrapper);


    minusBtn.addEventListener("click", () => {
        let qty = parseInt(quantityInput.value);
        if (isNaN(qty) || qty <= 1) return;
        qty--;
        quantityInput.value = qty;
        quantityInput.dispatchEvent(new Event("input"));
    });

    plusBtn.addEventListener("click", () => {
        let qty = parseInt(quantityInput.value);
        if (isNaN(qty)) qty = 1;
        qty++;
        quantityInput.value = qty;
        quantityInput.dispatchEvent(new Event("input"));
    });

    // Termina manejo casilla de + y -



    // Precio por unidad (no editable, oculto para cálculo)
    const pricePerUnit = product.precio;

    // Span para mostrar precio total del producto (cantidad * precio unitario)
    const priceTotalSpan = document.createElement("span");
    priceTotalSpan.textContent = formatCurrency(pricePerUnit);
    priceTotalSpan.style.marginLeft = "10px";
    li.appendChild(priceTotalSpan);

    // Actualizar precio total cuando cambie cantidad
    quantityInput.addEventListener("input", () => {
        let qty = parseInt(quantityInput.value);
        if (isNaN(qty) || qty < 1) {
            qty = 1;
            quantityInput.value = qty;
        }
        const totalPrice = pricePerUnit * qty;
        priceTotalSpan.textContent = formatCurrency(totalPrice);
        updateTotal();
    });

    // ACA TERMINA LA PARTE DE CANTIDAD

    const removeButton = document.createElement("button");
    removeButton.classList.add("btn", "btn-danger", "btn-sm");
    removeButton.textContent = "X";
    removeButton.style.marginLeft = "10px";
    removeButton.addEventListener("click", () => {
        shoppingList.removeChild(li);
        updateTotal(); // Actualizar el total al eliminar un producto
    });

    li.appendChild(removeButton);
    shoppingList.appendChild(li);

    suggestions.innerHTML = "";
    search.value = "";

    updateTotal(); // Actualizar el total al añadir un producto
}

// Manejar el evento de clic en el botón "CONFIRMAR"
confirmButton.addEventListener("click", () => {
    const items = shoppingList.querySelectorAll("li");
    const productList = [];
    items.forEach(item => {
        const textSpan = item.querySelector("span");
        if (textSpan) {
            productList.push(textSpan.textContent.trim());
        }
    });

    const blob = new Blob([productList.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Lista compras.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});