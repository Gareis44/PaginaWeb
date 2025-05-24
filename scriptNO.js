function addToShoppingList(product) {
    const li = document.createElement("li");
    li.className = "flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg shadow-sm bg-white";

    // Imagen
    const img = document.createElement("img");
    img.src = product.imagen;
    img.alt = product.nombre;
    img.className = "w-12 h-12 object-cover rounded";
    li.appendChild(img);

    // Info del producto (nombre, precio, db)
    const infoDiv = document.createElement("div");
    infoDiv.className = "flex-1 min-w-[150px]";
    infoDiv.innerHTML = `
        <p class="font-semibold text-sm">${product.nombre}</p>
        <p class="text-gray-600 text-sm">${formatCurrency(product.precio)} <span class="text-xs">(${product.db})</span></p>
    `;

    // Condición especial
    if (product.condicion) {
        const condition = document.createElement("p");
        condition.className = "text-yellow-500 text-xs mt-1";
        condition.textContent = `✨ ${product.condicion}`;
        infoDiv.appendChild(condition);
    }

    li.appendChild(infoDiv);

    // Controles de cantidad
    let cantidad = 1;

    const controlsDiv = document.createElement("div");
    controlsDiv.className = "flex items-center gap-2";

    const btnMenos = document.createElement("button");
    btnMenos.className = "w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 text-xl font-bold";
    btnMenos.textContent = "−";

    const cantidadSpan = document.createElement("span");
    cantidadSpan.className = "w-6 text-center text-sm";
    cantidadSpan.textContent = cantidad;

    const btnMas = document.createElement("button");
    btnMas.className = "w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 text-xl font-bold";
    btnMas.textContent = "+";

    controlsDiv.appendChild(btnMenos);
    controlsDiv.appendChild(cantidadSpan);
    controlsDiv.appendChild(btnMas);

    li.appendChild(controlsDiv);

    // Precio total
    const priceTotalSpan = document.createElement("span");
    priceTotalSpan.className = "text-sm font-semibold text-right min-w-[70px]";
    priceTotalSpan.textContent = formatCurrency(product.precio);
    li.appendChild(priceTotalSpan);

    // Actualizar precio total
    function actualizarPrecio() {
        const total = product.precio * cantidad;
        priceTotalSpan.textContent = formatCurrency(total);
        updateTotal();
    }

    // Eventos de los botones
    btnMenos.addEventListener("click", () => {
        if (cantidad > 1) {
            cantidad--;
            cantidadSpan.textContent = cantidad;
            actualizarPrecio();
        }
    });

    btnMas.addEventListener("click", () => {
        cantidad++;
        cantidadSpan.textContent = cantidad;
        actualizarPrecio();
    });

    // Agregar a la lista
    document.getElementById("shopping-list").appendChild(li);
}