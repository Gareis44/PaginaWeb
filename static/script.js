const search = document.getElementById("search");
const suggestions = document.getElementById("suggestions");
const shoppingList = document.getElementById("shopping-list");
const confirmButton = document.getElementById("confirm-button");

let products = [];
let productMap = new Map();
let productNames = [];

// Función para normalizar cadenas de texto eliminando acentos
function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Función para convertir el string de precio a número
function parsePrice(priceStr) {
    let normalized = priceStr.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized);
}

// Función para crear una imagen con reintentos de carga
function createImageElement(src, alt, maxRetries = 3) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.style.width = "100px";
    img.style.height = "100px";
    img.style.marginRight = "10px";

    let retries = 0;
    img.onerror = function () {
        if (retries < maxRetries) {
            console.warn(`Error cargando ${src}, reintentando (${retries + 1}/${maxRetries})`);
            retries++;
            setTimeout(() => {
                img.src = src + "?retry=" + retries;
            }, 1000 * retries);
        } else {
            img.src = "fallback.jpg";
        }
    };

    return img;
}

// Precarga de imágenes con múltiples intentos
function preloadImages(maxRetries = 3) {
    products.forEach(product => {
        if (product.imagen) {
            let retries = 0;
            function loadImage() {
                const img = new Image();
                img.src = product.imagen;

                img.onload = function () {
                    console.log(`Imagen cargada: ${product.imagen}`);
                };

                img.onerror = function () {
                    if (retries < maxRetries) {
                        console.warn(`Fallo en ${product.imagen}, reintentando (${retries + 1}/${maxRetries})`);
                        retries++;
                        setTimeout(loadImage, 1000 * retries);
                    } else {
                        console.error(`No se pudo cargar ${product.imagen} después de ${maxRetries} intentos`);
                    }
                };
            }
            loadImage();
        }
    });
}

// Cargar productos y llenar el mapa
fetch('https://ultra-mercado.onrender.com/productos')
    .then(response => response.json())
    .then(data => {
        products = data;

        products.forEach(product => {
            const normalized = normalizeString(product.nombre);
            productMap.set(normalized, product);
            productNames.push(normalized);
        });

        preloadImages();
    })
    .catch(error => console.error("Error al cargar productos:", error));

// Manejar entrada del usuario con debounce
let searchTimeout;
search.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        requestAnimationFrame(mostrarSugerencias);
    }, 300);
});

function mostrarSugerencias() {
    const query = normalizeString(search.value);
    suggestions.innerHTML = "";

    if (query) {
        const queryWords = query.split(" ").filter(Boolean);

        const filtered = productNames
            .filter(name => queryWords.every(word => name.includes(word)))
            .map(name => productMap.get(name));

        filtered.sort((a, b) => parsePrice(a.precio) - parsePrice(b.precio));

        filtered.forEach(product => {
            const li = document.createElement("li");
            li.classList.add("list-group-item", "list-group-item-action", "d-flex", "align-items-center");
            li.style.cursor = "pointer";

            const img = createImageElement(product.imagen, product.nombre);

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

    const img = createImageElement(product.imagen, product.nombre, 3);
    img.style.width = "50px";
    img.style.height = "50px";

    li.appendChild(img);

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

// Confirmar la lista de compras y descargarla
confirmButton.addEventListener("click", () => {
    const items = shoppingList.querySelectorAll("li");
    const productList = [];
    items.forEach(item => {
        productList.push(item.textContent.replace(" X", ""));
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