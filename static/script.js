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

// Función para convertir el string de precio a número
function parsePrice(priceStr) {
    let normalized = priceStr.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized);
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
    
    return Array.from(matchedProducts).sort((a, b) => parsePrice(a.precio) - parsePrice(b.precio));
}

// Evento de entrada con debounce mejorado (500ms)
search.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        requestAnimationFrame(mostrarSugerencias);
    }, 500);
});

// Mostrar sugerencias optimizadas
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
            img.loading = "lazy"; // Optimización de carga de imágenes
            img.style.width = "100px";
            img.style.height = "100px";
            img.style.marginRight = "10px";

            const text = document.createElement("span");
            text.textContent = `${product.nombre} - ${product.precio} (${product.db})`;

            li.appendChild(img);
            li.appendChild(text);
            li.addEventListener("click", () => addToShoppingList(product));
            suggestions.appendChild(li);
        });
    }
}

// Añadir productos a la lista de compras
function addToShoppingList(product) {
    const li = document.createElement("li");
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

    const img = document.createElement("img"); // Crear elemento imagen
    img.src = product.imagen; // Asignar la url de la imagen
    img.alt = product.nombre;
    img.style.width = "50px"; // Ajustar el tamaño de la imagen
    img.style.height = "50px";
    img.style.marginRight = "10px";
    li.appendChild(img); // Agregar la imagen al elemento li

    const text = document.createElement("span");
    text.textContent = `${product.nombre} - ${product.precio} (${product.db})`;
    li.appendChild(text);

    const removeButton = document.createElement("button");
    removeButton.classList.add("btn", "btn-danger", "btn-sm");
    removeButton.textContent = "X";
    removeButton.style.marginLeft = "10px";
    removeButton.addEventListener("click", () => {
        shoppingList.removeChild(li);
    });

    li.appendChild(removeButton);
    shoppingList.appendChild(li);

    suggestions.innerHTML = "";
    search.value = "";
}

// Manejar el evento de clic en el botón "CONFIRMAR"
confirmButton.addEventListener("click", () => {
    const items = shoppingList.querySelectorAll("li");
    const productList = [];
    items.forEach(item => {
        const textSpan = item.querySelector("span"); // Selecciona solo el texto del producto
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
