const fs = require('fs');
const path = require('path');
const productosFilePath = path.join(__dirname, '../data/productos.json');
const pedidosFilePath = path.join(__dirname, '../data/pedidos.json');

function obtenerProductos() {
    try {
        const data = fs.readFileSync(productosFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function obtenerPedidos() {
    try {
        const data = fs.readFileSync(pedidosFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function guardarPedido(nuevoPedido) {
    const pedidos = obtenerPedidos();
    pedidos.push(nuevoPedido);
    fs.writeFileSync(pedidosFilePath, JSON.stringify(pedidos, null, 2), 'utf8');
    return nuevoPedido;
}

function generarCodigoPedido() {
    const pedidos = obtenerPedidos();
    
    if (pedidos.length === 0) {
        return `HO-2026-0001`;
    }

    let maxNumero = 0;
    for (const pedido of pedidos) {
        const partes = pedido.codigo.split('-');
        if (partes.length === 3) {
            const numeroActual = parseInt(partes[2], 10);
            if (!isNaN(numeroActual) && numeroActual > maxNumero) {
                maxNumero = numeroActual;
            }
        }
    }

    const numeroSiguiente = maxNumero + 1;
    
    return `HO-2026-${String(numeroSiguiente).padStart(4, '0')}`;
}
function eliminarPedido(codigo, telefono) {
    const pedidos = obtenerPedidos();
    const indice = pedidos.findIndex(p => p.codigo.toUpperCase() === codigo.trim().toUpperCase());
    
    if (indice === -1) {
        return { exito: false, error: 'Pedido no encontrado.' };
    }
    const pedidoEncontrado = pedidos[indice];

    if (pedidoEncontrado.telefono !== telefono.trim()) {
        return { exito: false, error: 'El número no coincide con el registrado en el pedido.' };
    }
    if (pedidoEncontrado.estado !== 'Recibido') {
        return { exito: false, error: `No se puede cancelar. El pedido ya se encuentra: ${pedidoEncontrado.estado}. Comunícate con atención al cliente.` };
    }
    pedidos.splice(indice, 1);
    
    const fs = require('fs');
    const path = require('path');
    const pedidosFilePath = path.join(__dirname, '../data/pedidos.json');
    fs.writeFileSync(pedidosFilePath, JSON.stringify(pedidos, null, 2), 'utf8');
    return { exito: true };
}

module.exports = {
    obtenerProductos,
    obtenerPedidos,
    guardarPedido,
    generarCodigoPedido,
    eliminarPedido
};