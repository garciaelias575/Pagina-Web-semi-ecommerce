const express = require('express');
const router = express.Router(); 
const { obtenerProductos, obtenerPedidos, guardarPedido, generarCodigoPedido, eliminarPedido } = require('../services/pedidosService'); 

router.get('/productos', (req, res) => {
    const productos = obtenerProductos();
    res.json(productos);
});

router.post('/pedidos', (req, res) => {
    const { negocio, contacto, telefono, zona, observaciones, productos } = req.body; 
    if (!negocio?.trim() || !contacto?.trim() || !telefono?.trim() || !zona?.trim() || !productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: 'Faltan datos obligatorios, los datos son inválidos o el carrito está vacío.' });
    }

    if (!/^\d{9}$/.test(telefono.trim())) {
        return res.status(400).json({ error: 'El formato del teléfono es inválido.' });
    }

    const catalogoReal = obtenerProductos();
    const carritoValidado = [];
    let totalCalculadoEnServidor = 0;

    for (let itemCliente of productos) {
        const productoReal = catalogoReal.find(p => p.nombre.toLowerCase() === itemCliente.nombre?.toLowerCase());

        if (productoReal) {
            const cantidadSolicitada = parseInt(itemCliente.cantidad, 10);
            const cantidadFinal = (!isNaN(cantidadSolicitada) && cantidadSolicitada > 0) ? cantidadSolicitada : 1;

            carritoValidado.push({
                nombre: productoReal.nombre,
                presentacion: productoReal.presentacion,
                categoria: productoReal.categoria,
                cantidad: cantidadFinal,
                precioreal: productoReal.precio,
                subtotal: parseFloat((productoReal.precio * cantidadFinal).toFixed(2))
            });

            totalCalculadoEnServidor += (productoReal.precio * cantidadFinal);
        }
    }

    if (carritoValidado.length === 0) {
         return res.status(400).json({ error: 'Ninguno de los productos enviados existe en nuestro catálogo.' });
    }

    const codigo = generarCodigoPedido();
    const nuevoPedido = { 
        codigo,          
        negocio: negocio.trim(),         
        contacto: contacto.trim(),        
        telefono: telefono.trim(),        
        zona: zona.trim(),            
        observaciones: observaciones?.trim() || '', 
        estado: 'Recibido',
        totalMontoOficial: parseFloat(totalCalculadoEnServidor.toFixed(2)),
        productos: carritoValidado,
        fecha: new Date().toLocaleString('es-PE') 
    };

    guardarPedido(nuevoPedido); 

    res.status(201).json({ 
        mensaje: 'Pedido validado y registrado correctamente',
        codigo: nuevoPedido.codigo,
        pedido: nuevoPedido
    });
});

router.post('/pedidos/consultar', (req, res) => {
    const { codigo } = req.body;
    if (!codigo) {
        return res.status(400).json({ error: 'Se requiere el código del pedido.' });
    }
    const pedidos = obtenerPedidos();
    const encontrado = pedidos.find(p => p.codigo.toUpperCase() === codigo.trim().toUpperCase());
    if (encontrado) {
        res.json({ encontrado: true, pedido: encontrado });
    } else {
        res.json({ encontrado: false, mensaje: 'No se encontró un pedido con ese código.' });
    }
})

router.delete('/pedidos/:codigo', (req, res) => {
    const { codigo } = req.params;
    const { telefono } = req.body;

    if (!telefono) {
        return res.status(400).json({ error: 'Para cancelar el pedido, debe proporcionar el número de teléfono por seguridad.' });
    }

    const resultado = eliminarPedido(codigo, telefono);

    if (resultado.exito) {
        res.json({ mensaje: `El pedido ${codigo} ha sido cancelado y eliminado correctamente.` });
    } else {
        const statusCode = resultado.error.includes('encontrado') ? 404 : 403;
        res.status(statusCode).json({ error: resultado.error });
    }
});

module.exports = router; 