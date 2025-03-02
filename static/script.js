// const search = document.getElementById("search");
// const suggestions = document.getElementById("suggestions");
// const shoppingList = document.getElementById("shopping-list");
// const confirmButton = document.getElementById("confirm-button");

// let products = [];
// let productMap = new Map(); // Estructura optimizada para búsqueda rápida

// // Función para normalizar cadenas de texto eliminando acentos
// function normalizeString(str) {
//     return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
// }

// // Función para convertir el string de precio a número, eliminando el separador de miles,
// // el símbolo de moneda y convirtiendo la coma a punto
// function parsePrice(priceStr) {
//     // 1) Quitar todo lo que NO sea dígito, punto o coma (ej. $, espacios, etc.)
//     let normalized = priceStr.replace(/[^\d.,]/g, "");

//     // 2) Eliminar los puntos (asumiendo que son separadores de miles)
//     //    Nota: si tienes un caso raro donde el punto es separador decimal
//     //    y no usas coma, deberías ajustarlo. Aquí asumimos que la coma es el decimal.
//     normalized = normalized.replace(/\./g, "");

//     // 3) Reemplazar la coma (decimal) por punto
//     normalized = normalized.replace(",", ".");

//     // 4) Convertir a número
//     return parseFloat(normalized);
// }

// // Cargar imágenes en segundo plano para acelerar la visualización
// function preloadImages() {
//     products.forEach(product => {
//         if (product.imagen) {
//             const img = new Image();
//             img.src = product.imagen;
//         }
//     });
// }

// // Ejecutar la pre-carga cuando los datos estén listos y llenar el mapa
// let productNames = []; // Guardará los nombres normalizados para búsqueda rápida

// fetch('https://ultra-mercado.onrender.com/productos')
//     .then(response => response.json())
//     .then(data => {
//         products = data;

//         products.forEach(product => {
//             const normalized = normalizeString(product.nombre);
//             productMap.set(normalized, product);
//             productNames.push(normalized); // Guardar nombres normalizados en un array
//         });

//         preloadImages();
//     })
//     .catch(error => console.error("Error al cargar productos:", error));

// // Manejar entrada del usuario con debounce
// let searchTimeout;

// search.addEventListener("input", () => {
//     clearTimeout(searchTimeout);
//     searchTimeout = setTimeout(() => {
//         requestAnimationFrame(mostrarSugerencias);
//     }, 300);
// });

// function mostrarSugerencias() {
//     const query = normalizeString(search.value);
//     suggestions.innerHTML = "";

//     if (query) {
//         // Se separa la consulta en palabras, eliminando posibles entradas vacías
//         const queryWords = query.split(" ").filter(Boolean);

//         // Se filtran los nombres de productos normalizados comprobando que cada palabra esté contenida en el nombre
//         const filtered = productNames
//             .filter(name => queryWords.every(word => name.includes(word)))
//             .map(name => productMap.get(name));

//         // Ordenar por precio usando parsePrice
//         filtered.sort((a, b) => parsePrice(a.precio) - parsePrice(b.precio));

//         // Renderizar sugerencias
//         filtered.forEach(product => {
//             const li = document.createElement("li");
//             li.classList.add("list-group-item", "list-group-item-action", "d-flex", "align-items-center");
//             li.style.cursor = "pointer";

//             const img = document.createElement("img");
//             img.src = product.imagen;
//             img.alt = product.nombre;
//             img.style.width = "100px";
//             img.style.height = "100px";
//             img.style.marginRight = "10px";

//             const text = document.createElement("span");
//             text.textContent = `${product.nombre} - ${product.precio} (${product.db})`;

//             li.appendChild(img);
//             li.appendChild(text);
//             li.addEventListener("click", () => addToShoppingList(product));
//             suggestions.appendChild(li);
//         });
//     }
// }

// // Añadir productos a la lista de compras
// function addToShoppingList(product) {
//     const li = document.createElement("li");
//     li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

//     const img = document.createElement("img"); // Crear elemento imagen
//     img.src = product.imagen; // Asignar la url de la imagen
//     img.alt = product.nombre;
//     img.style.width = "50px"; // Ajustar el tamaño de la imagen
//     img.style.height = "50px";
//     img.style.marginRight = "10px";
//     li.appendChild(img); // Agregar la imagen al elemento li

//     const text = document.createElement("span");
//     text.textContent = `${product.nombre} - ${product.precio} (${product.db})`;
//     li.appendChild(text);

//     const removeButton = document.createElement("button");
//     removeButton.classList.add("btn", "btn-danger", "btn-sm");
//     removeButton.textContent = "X";
//     removeButton.style.marginLeft = "10px";
//     removeButton.addEventListener("click", () => {
//         shoppingList.removeChild(li);
//     });

//     li.appendChild(removeButton);
//     shoppingList.appendChild(li);

//     suggestions.innerHTML = "";
//     search.value = "";
// }

// // Manejar el evento de clic en el botón "CONFIRMAR"
// confirmButton.addEventListener("click", () => {
//     const items = shoppingList.querySelectorAll("li");
//     const productList = [];
//     items.forEach(item => {
//         productList.push(item.textContent.replace(" X", ""));
//     });

//     const blob = new Blob([productList.join("\n")], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "Lista compras.txt";
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
// });

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
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
                    keywordIndex.set(word, []);
                }
                keywordIndex.get(word).push(product);
            });
        });
    })
    .catch(error => console.error("Error al cargar productos:", error));

// Función mejorada de búsqueda con índice de palabras clave
function searchProducts(query) {
    const queryWords = extractKeywords(query);
    let matchedProducts = new Set();

    queryWords.forEach(word => {
        if (keywordIndex.has(word)) {
            keywordIndex.get(word).forEach(product => matchedProducts.add(product));
        }
    });

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

