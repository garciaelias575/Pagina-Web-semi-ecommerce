'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // ---------- REFERENCIAS PRINCIPALES DEL DOM ----------
    const categorias = document.getElementById('categorias');
    const buscarProducto = document.getElementById('buscarProducto');
    const listaProductos = document.getElementById('listaProductos');
    const resultadoCatalogo = document.getElementById('resultadoCatalogo');
    const contadorPedido = document.getElementById('contadorPedido');
    const resumenConteo = document.getElementById('resumenConteo');
    const totalUnidades = document.getElementById('totalUnidades');
    const pedidoVacio = document.getElementById('pedidoVacio');
    const formPedido = document.getElementById('formPedido');
    const formSeguimiento = document.getElementById('formSeguimiento');
    const volverArriba = document.getElementById('volverArriba');
    const catalogo = document.getElementById('catalogo');

    // URL base de la API de Node.js / Express
    const API_URL = '/api';
    const MAX_CANTIDAD = 50;

    let categoriaActiva = 'Todas';
    let pedido = [];
    try {
        const carritoGuardado = localStorage.getItem('ho_carrito_v1');
        if (carritoGuardado) {
            // Decodificamos de Base64, manejamos caracteres especiales y convertimos a JSON
            pedido = JSON.parse(decodeURIComponent(atob(carritoGuardado)));
        }
    } catch (error) {
        console.warn('El carrito guardado fue alterado o es inválido. Se iniciará vacío.');
        pedido = [];
    }
    let catalogoProductos = [];

    const normalizar = texto => String(texto || '').trim().toLowerCase();

    function crearNotificacion() {
        let notificacion = document.getElementById('notificacionJS');
        if (!notificacion) {
            notificacion = document.createElement('div');
            notificacion.id = 'notificacionJS';
            notificacion.className = 'position-fixed start-50 translate-middle-x p-3 w-100';
            notificacion.style.zIndex = '1070'; 
            notificacion.style.top = '75px'; 
            notificacion.style.maxWidth = '380px';
            notificacion.setAttribute('aria-live', 'polite');
            document.body.append(notificacion);
        }
        return notificacion;
    }

    function mostrarNotificacion(texto, tipo = 'success') {
        const contenedor = crearNotificacion();
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} shadow mb-0`;
        alerta.setAttribute('role', 'status');
        alerta.textContent = texto;

        alerta.style.opacity = '0';
        alerta.style.transform = 'translateY(-30px)';
        alerta.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        contenedor.replaceChildren(alerta);

        void alerta.offsetWidth; 

        alerta.style.opacity = '1';
        alerta.style.transform = 'translateY(0)';

        clearTimeout(mostrarNotificacion.temporizador);
        clearTimeout(mostrarNotificacion.animacionSalida);

        mostrarNotificacion.temporizador = setTimeout(() => {
            alerta.style.opacity = '0';
            alerta.style.transform = 'translateY(-15px)';
            mostrarNotificacion.animacionSalida = setTimeout(() => alerta.remove(), 300);
        }, 2000);
    }

    function mostrarMensaje(contenedor, texto, tipo = 'success') {
        let mensaje = contenedor.querySelector('.mensaje-js');
        if (!mensaje) {
            mensaje = document.createElement('div');
            mensaje.className = 'mensaje-js alert mt-3 mb-0';
            mensaje.setAttribute('role', 'status');
            mensaje.setAttribute('aria-live', 'polite');
            contenedor.append(mensaje);
        }
        mensaje.className = `mensaje-js alert alert-${tipo} mt-3 mb-0`;
        mensaje.innerHTML = texto;
    }

    function limpiarMensajes(contenedor) {
        const mensaje = contenedor.querySelector('.mensaje-js');
        if (mensaje) {
            mensaje.remove();
        }
    }

    // ---------- CARGAR CATÁLOGO DESDE EL BACKEND (GET /api/productos) ----------
    async function cargarProductosDesdeBackend() {
        listaProductos.innerHTML = `
            <div class="col-12 text-center py-5 w-100">
                <div class="spinner-border text-warning" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Cargando catálogo...</span>
                </div>
                <p class="mt-3 text-muted fw-semibold">Cargando productos...</p>
            </div>
        `;
        resultadoCatalogo.textContent = 'Actualizando catálogo...';

        try {
            const respuesta = await fetch(`${API_URL}/productos`);
            if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo');
            
            catalogoProductos = await respuesta.json();
            renderizarCatalogo(catalogoProductos);
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
            listaProductos.innerHTML = `
                <div class="col-12 text-center py-5 text-danger w-100">
                    <i class="bi bi-exclamation-triangle fs-1"></i>
                    <p class="mt-2 fw-semibold">No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.</p>
                </div>
            `;
            resultadoCatalogo.textContent = 'Error al cargar productos.';
        }
    }

    function renderizarCatalogo(productos) {
        listaProductos.replaceChildren();
        const fragmento = document.createDocumentFragment();

        productos.forEach(producto => {
            const articulo = document.createElement('article');
            articulo.className = 'tarjeta-producto';
            articulo.dataset.categoria = producto.categoria;
            articulo.dataset.disponible = producto.disponible ? 'true' : 'false';

            const contenedorImagen = document.createElement('div');
            contenedorImagen.className = 'contenedor-imagen-producto';

            const imagen = document.createElement('img');
            imagen.className = 'imagen-producto';
            imagen.src = producto.imagen;
            imagen.alt = `Imagen referencial de ${producto.nombre}`;
            imagen.loading = 'lazy';
            contenedorImagen.append(imagen);

            if (producto.destacado) {
                const etiqueta = document.createElement('span');
                etiqueta.className = 'etiqueta-producto';
                etiqueta.textContent = 'Destacado';
                contenedorImagen.append(etiqueta);
            }

            const cuerpo = document.createElement('div');
            cuerpo.className = 'cuerpo-producto';

            const categoria = document.createElement('span');
            categoria.className = 'categoria-producto';
            categoria.textContent = producto.categoria;

            const titulo = document.createElement('h3');
            titulo.textContent = producto.nombre;

            const descripcion = document.createElement('p');
            descripcion.className = 'descripcion-producto';
            descripcion.textContent = producto.descripcion;

            const contenedorPrecio = document.createElement('div');
            contenedorPrecio.className = 'precio-producto mb-2';
            const textoPrecio = document.createElement('span');
            textoPrecio.className = 'fs-5 fw-bold';
            textoPrecio.dataset.precio = producto.precio;
            textoPrecio.textContent = `S/ ${producto.precio.toFixed(2)}`;
            contenedorPrecio.append(textoPrecio);

            const meta = document.createElement('div');
            meta.className = 'meta-producto';

            const presentacion = document.createElement('span');
            presentacion.className = 'small fw-semibold';
            presentacion.textContent = producto.presentacion;

            const disponibilidad = document.createElement('span');
            disponibilidad.className = producto.disponible ? 'disponibilidad' : 'disponibilidad no-disponible';
            disponibilidad.textContent = producto.disponible ? 'Disponible' : 'Sin stock';
            meta.append(presentacion, disponibilidad);

            const acciones = document.createElement('div');
            acciones.className = 'd-flex gap-2 align-items-center';

            const control = document.createElement('div');
            control.className = 'control-cantidad';

            const menos = document.createElement('button');
            menos.type = 'button';
            menos.textContent = '−';
            menos.setAttribute('aria-label', `Disminuir cantidad de ${producto.nombre}`);

            const cantidad = document.createElement('input');
            cantidad.type = 'number';
            cantidad.min = '1';
            cantidad.max = String(MAX_CANTIDAD);
            cantidad.value = '1';
            cantidad.setAttribute('aria-label', `Cantidad de ${producto.nombre}`);

            const mas = document.createElement('button');
            mas.type = 'button';
            mas.textContent = '+';
            mas.setAttribute('aria-label', `Aumentar cantidad de ${producto.nombre}`);
            control.append(menos, cantidad, mas);

            const agregar = document.createElement('button');
            agregar.type = 'button';
            agregar.className = 'btn btn-primary flex-grow-1 agregar-producto';
            agregar.textContent = producto.disponible ? 'Agregar al pedido' : 'No disponible';
            agregar.disabled = !producto.disponible;

            if (!producto.disponible) {
                menos.disabled = true;
                mas.disabled = true;
                cantidad.disabled = true;
            }

            acciones.append(control, agregar);
            cuerpo.append(categoria, titulo, descripcion, contenedorPrecio, meta, acciones);
            articulo.append(contenedorImagen, cuerpo);
            fragmento.append(articulo);
        });

        listaProductos.append(fragmento);
        filtrarCatalogo();
    }

    function obtenerDatosProducto(tarjeta) {
        const precioElemento = tarjeta.querySelector('[data-precio]');
        return {
            nombre: tarjeta.querySelector('h3').textContent.trim(),
            categoria: tarjeta.querySelector('.categoria-producto').textContent.trim(),
            presentacion: tarjeta.querySelector('.meta-producto .small').textContent.trim(),
            cantidad: Number(tarjeta.querySelector('.control-cantidad input').value),
            precio: precioElemento ? Number(precioElemento.dataset.precio) : 0,
            imagen: tarjeta.querySelector('.imagen-producto')?.getAttribute('src') || ''
        };
    }

    function filtrarCatalogo() {
        const texto = normalizar(buscarProducto.value);
        let visibles = 0;
        const tarjetas = listaProductos.querySelectorAll('.tarjeta-producto');

        tarjetas.forEach(tarjeta => {
            const nombre = normalizar(tarjeta.querySelector('h3').textContent);
            const categoria = tarjeta.querySelector('.categoria-producto').textContent.trim();
            const coincideTexto = !texto || nombre.includes(texto) || normalizar(categoria).includes(texto);
            const coincideCategoria = categoriaActiva === 'Todas' || categoria === categoriaActiva;            
            const mostrar = coincideTexto && coincideCategoria;
            tarjeta.hidden = !mostrar;
            if (mostrar) visibles++;
        });

        resultadoCatalogo.textContent = visibles === 1 ? '1 producto encontrado' : `${visibles} productos encontrados`;
    }

    buscarProducto.addEventListener('input', filtrarCatalogo);

    categorias.addEventListener('click', evento => {
        const boton = evento.target.closest('.tarjeta-categoria');
        if (!boton) return;

        document.querySelectorAll('.tarjeta-categoria').forEach(item => {
            item.classList.remove('activa');
            item.setAttribute('aria-pressed', 'false');
        });

        boton.classList.add('activa');
        boton.setAttribute('aria-pressed', 'true');
        categoriaActiva = boton.querySelector('span:last-child').textContent.trim();

        if (categoriaActiva === 'Todas') buscarProducto.value = '';

        filtrarCatalogo();

        setTimeout(() => {
            const destino = catalogo.getBoundingClientRect().top + window.scrollY - 88;
            window.scrollTo({ top: destino, behavior: 'smooth' });
        }, 80);
    });

    listaProductos.addEventListener('click', evento => {
        const boton = evento.target.closest('button');
        if (!boton || boton.disabled) return;

        const tarjeta = boton.closest('.tarjeta-producto');
        if (!tarjeta) return;

        const control = boton.closest('.control-cantidad');
        if (control) {
            const input = control.querySelector('input');
            let cantidad = Number(input.value) || 1;
            if (boton.textContent.trim() === '+') cantidad++;
            if (boton.textContent.trim() === '−') cantidad--;
            input.value = Math.min(MAX_CANTIDAD, Math.max(1, cantidad));
            return;
        }

        if (boton.classList.contains('agregar-producto')) {
            const producto = obtenerDatosProducto(tarjeta);
            agregarAlPedido(producto);
            boton.textContent = 'Agregado ✓';
            mostrarNotificacion(`${producto.nombre} agregado al pedido.`);
            setTimeout(() => boton.textContent = 'Agregar al pedido', 900);
        }
    });

    listaProductos.addEventListener('input', evento => {
        if (!evento.target.matches('.control-cantidad input')) return;
        const valor = Number(evento.target.value) || 1;
        evento.target.value = Math.min(MAX_CANTIDAD, Math.max(1, valor));
    });

    function agregarAlPedido(producto) {
        const existente = pedido.find(item => item.nombre === producto.nombre);
        if (existente) existente.cantidad = Math.min(MAX_CANTIDAD, existente.cantidad + producto.cantidad);
        else pedido.push(producto);
        actualizarResumenPedido();
    }

    function actualizarResumenPedido() {
        const total = pedido.reduce((suma, item) => suma + item.cantidad, 0);
        const montoTotal = pedido.reduce((suma, item) => suma + (item.cantidad * item.precio), 0);

        try {
            const carritoString = JSON.stringify(pedido);
            const carritoBase64 = btoa(encodeURIComponent(carritoString));
            localStorage.setItem('ho_carrito_v1', carritoBase64);
        } catch (error) {
            console.error('Error al guardar el carrito:', error);
        }

        contadorPedido.textContent = total;
        resumenConteo.textContent = pedido.length === 1 ? '1 producto' : `${pedido.length} productos`;
        totalUnidades.textContent = total;
        
        const totalMontoDOM = document.getElementById('totalMonto');
        if(totalMontoDOM) totalMontoDOM.textContent = `S/ ${montoTotal.toFixed(2)}`;
        
        const flotanteConteo = document.getElementById('flotanteConteo');
        if(flotanteConteo) {
            flotanteConteo.textContent = total;
        }
        
        const totalMontoModal = document.getElementById('totalMontoModal');
        if(totalMontoModal) totalMontoModal.textContent = `S/ ${montoTotal.toFixed(2)}`;

        pedidoVacio.hidden = pedido.length > 0;

        const btnVaciarPedido = document.getElementById('btnVaciarPedido');
        if (btnVaciarPedido) {
            btnVaciarPedido.classList.toggle('d-none', pedido.length === 0);
        }

        let listaSidebar = document.getElementById('listaPedidoJS');
        if (!listaSidebar) {
            listaSidebar = document.createElement('div');
            listaSidebar.id = 'listaPedidoJS';
            listaSidebar.className = 'articulos-pedido';
            pedidoVacio.insertAdjacentElement('afterend', listaSidebar);
        }
        
        const listaModal = document.getElementById('cuerpoModalCarrito');
        
        listaSidebar.replaceChildren();
        if(listaModal) listaModal.replaceChildren();
        
        listaSidebar.hidden = pedido.length === 0;

        if(pedido.length === 0 && listaModal) {
            listaModal.innerHTML = '<div class="estado-vacio"><span aria-hidden="true"><i class="bi bi-cart-x fs-1 text-muted"></i></span><strong>Tu carrito está vacío</strong><p>Explora el catálogo y agrega productos.</p></div>';
        }

        pedido.forEach((item, indice) => {
            const generarFilaHTML = () => {
                const fila = document.createElement('div');
                fila.className = 'articulo-pedido';

                const info = document.createElement('div');
                const nombre = document.createElement('div');
                nombre.className = 'nombre-articulo-pedido';
                nombre.textContent = item.nombre;
                const detalle = document.createElement('div');
                detalle.className = 'meta-articulo-pedido';
                detalle.textContent = `${item.presentacion} · ${item.cantidad} uni. · S/ ${(item.precio * item.cantidad).toFixed(2)}`;
                info.append(nombre, detalle);

                const acciones = document.createElement('div');
                acciones.className = 'acciones-articulo-pedido';

                const menos = document.createElement('button');
                menos.type = 'button';
                menos.className = 'mini-boton';
                menos.textContent = '−';

                const cantidad = document.createElement('span');
                cantidad.className = 'fw-bold px-2';
                cantidad.textContent = item.cantidad;

                const mas = document.createElement('button');
                mas.type = 'button';
                mas.className = 'mini-boton';
                mas.textContent = '+';

                const eliminar = document.createElement('button');
                eliminar.type = 'button';
                eliminar.className = 'boton-eliminar';
                eliminar.textContent = 'Eliminar';

                menos.addEventListener('click', () => {
                    item.cantidad = Math.max(1, item.cantidad - 1);
                    actualizarResumenPedido();
                });
                mas.addEventListener('click', () => {
                    item.cantidad = Math.min(MAX_CANTIDAD, item.cantidad + 1);
                    actualizarResumenPedido();
                });
                eliminar.addEventListener('click', () => {
                    pedido.splice(indice, 1);
                    actualizarResumenPedido();
                    mostrarNotificacion(`${item.nombre} eliminado.`, 'secondary');
                });

                acciones.append(menos, cantidad, mas, eliminar);
                fila.append(info, acciones);
                return fila;
            };

            listaSidebar.append(generarFilaHTML());
            if(listaModal) {
                listaModal.append(generarFilaHTML());
            }
        });
    }

    // VALIDACIÓN DE CAMPOS DEL FORMULARIO
    const telefono = document.getElementById('telefono');
    const negocio = document.getElementById('negocio');
    const contactoNombre = document.getElementById('contactoNombre');
    const zona = document.getElementById('zona');

    function validarTelefono() {
        const valor = telefono.value.trim();
        const valido = /^\d{9}$/.test(valor);
        if (valor.length > 0) {
            telefono.classList.toggle('is-valid', valido);
            telefono.classList.toggle('is-invalid', !valido);
        } else {
            telefono.classList.remove('is-valid', 'is-invalid');
        }
        telefono.setCustomValidity(valido || !valor ? '' : 'Ingresa un teléfono válido de 9 dígitos.');
        return valido;
    }

    function validarTextoMinimo(campo, mensaje) {
        const valido = campo.value.trim().length >= 3;
        if (campo.value.trim().length > 0) {
            campo.classList.toggle('is-valid', valido);
            campo.classList.toggle('is-invalid', !valido);
        } else {
            campo.classList.remove('is-valid', 'is-invalid');
        }
        campo.setCustomValidity(valido || !campo.value ? '' : mensaje);
        return valido;
    }

    telefono.addEventListener('input', validarTelefono);
    negocio.addEventListener('input', () => validarTextoMinimo(negocio, 'Escribe al menos 3 caracteres.'));
    contactoNombre.addEventListener('input', () => validarTextoMinimo(contactoNombre, 'Escribe al menos 3 caracteres.'));
    zona.addEventListener('input', () => validarTextoMinimo(zona, 'Escribe al menos 3 caracteres.'));

    // ---------- ENVÍO DEL PEDIDO AL BACKEND (POST /api/pedidos) ----------
    const botonEnviarPedido = document.getElementById('btnEnviarPedido');
    formPedido.addEventListener('submit', e => e.preventDefault());

    if (botonEnviarPedido) {
        botonEnviarPedido.addEventListener('click', async (evento) => {
            evento.preventDefault();

            limpiarMensajes(formPedido);

            validarTelefono();
            validarTextoMinimo(negocio, 'Escribe al menos 3 caracteres.');
            validarTextoMinimo(contactoNombre, 'Escribe al menos 3 caracteres.');
            validarTextoMinimo(zona, 'Escribe al menos 3 caracteres.');

            if (!formPedido.reportValidity()) {
                mostrarMensaje(formPedido, 'Revisa los campos marcados en rojo antes de continuar.', 'warning');
                return;
            }

            if (pedido.length === 0) {
                mostrarMensaje(formPedido, 'Agrega al menos un producto antes de enviar el pedido.', 'warning');
                return;
            }

            const textoOriginal = botonEnviarPedido.textContent;
            botonEnviarPedido.disabled = true;
            botonEnviarPedido.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Procesando solicitud...';

            try {
                const datosPedido = {
                    negocio: negocio.value.trim(),
                    contacto: contactoNombre.value.trim(),
                    telefono: telefono.value.trim(),
                    zona: zona.value.trim(),
                    observaciones: document.getElementById('observaciones').value.trim(),
                    productos: pedido
                };

                const respuesta = await fetch(`${API_URL}/pedidos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosPedido)
                });

                const resultado = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(resultado.error || 'Error al registrar el pedido en el servidor');
                }

                limpiarMensajes(formPedido);

                const codigoGenerado = resultado.codigo;

                pedido = [];
                localStorage.removeItem('ho_carrito_v1');
                actualizarResumenPedido();
                formPedido.reset();
                
                [telefono, negocio, contactoNombre, zona].forEach(campo => {
                    campo.classList.remove('is-valid', 'is-invalid');
                });

                const inputSeguimiento = document.getElementById('codigoPedido');
                if (inputSeguimiento) inputSeguimiento.value = codigoGenerado;

                let contenedorResultado = document.getElementById('resultadoEnvioPedidoJS');
                if (!contenedorResultado) {
                    contenedorResultado = document.createElement('div');
                    contenedorResultado.id = 'resultadoEnvioPedidoJS';
                    contenedorResultado.className = 'alert alert-success mt-4 shadow-sm p-3 border-2 text-center';
                    formPedido.insertAdjacentElement('afterend', contenedorResultado);
                }

                contenedorResultado.innerHTML = `
                    <h5 class="fw-bold text-success mb-2"><i class="bi bi-check-circle-fill"></i> ¡Pedido registrado con éxito!</h5>
                    <p class="mb-1">Tu código de seguimiento es:</p>
                    <div class="d-flex justify-content-center align-items-center gap-2 mb-2">
                        <span class="fs-3 fw-bold font-monospace text-dark mb-0">${codigoGenerado}</span>
                        <button class="btn btn-outline-dark btn-sm" type="button" id="btnCopiarCodigo" title="Copiar código" aria-label="Copiar código">
                            <i class="bi bi-copy"></i>
                        </button>
                    </div>
                    <p class="small text-muted mb-0">Guárdalo para consultar el estado de tu pedido.</p>
                `;

                const btnCopiar = document.getElementById('btnCopiarCodigo');
                if (btnCopiar) {
                    btnCopiar.addEventListener('click', () => {
                        const mostrarExito = () => {
                            btnCopiar.innerHTML = '<i class="bi bi-check-lg text-white"></i>';
                            btnCopiar.classList.replace('btn-outline-dark', 'btn-success');
                            setTimeout(() => {
                                btnCopiar.innerHTML = '<i class="bi bi-copy"></i>';
                                btnCopiar.classList.replace('btn-success', 'btn-outline-dark');
                            }, 2000);
                        };
                        if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(codigoGenerado)
                                .then(mostrarExito)
                                .catch(err => console.error('Error al copiar: ', err));
                        } 
                        else {
                            const textArea = document.createElement("textarea");
                            textArea.value = codigoGenerado;
                            textArea.style.position = "fixed";
                            textArea.style.left = "-999999px";
                            textArea.style.top = "-999999px";
                            document.body.appendChild(textArea);
                            
                            textArea.focus();
                            textArea.select();
                            
                            try {
                                document.execCommand('copy');
                                mostrarExito();
                            } catch (err) {
                                console.error('Error en el fallback de copiado: ', err);
                            }
                            
                            document.body.removeChild(textArea);
                        }
                    });
                }

            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje(formPedido, 'No se pudo conectar con el servidor para registrar el pedido.', 'danger');
            } finally {
                botonEnviarPedido.disabled = false;
                botonEnviarPedido.textContent = textoOriginal;
            }
        });
    }

    // ---------- CONSULTAR PEDIDO EN EL BACKEND (POST /api/pedidos/consultar) ----------
    const botonConsultar = formSeguimiento.querySelector('button[type="button"]');
    
    async function consultarPedido() {
        const input = document.getElementById('codigoPedido');
        const codigo = input.value.trim().toUpperCase();

        if (!codigo) {
            mostrarMensaje(formSeguimiento.parentElement, 'Ingresa un código de pedido.', 'warning');
            input.focus();
            return;
        }
        try {
            const respuesta = await fetch(`${API_URL}/pedidos/consultar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo })
            });

            const resultado = await respuesta.json();

            if (resultado.encontrado) {
                const pedidoData = resultado.pedido;
                let htmlBotones = '';

                if (pedidoData.estado === 'Recibido') {
                    htmlBotones = `
                        <hr class="opacity-25 my-3">
                        <div class="mt-2">
                            <p class="text-muted small mb-2">Como tu pedido acaba de ser recibido, aún estás a tiempo de cancelarlo. Confírmanos el teléfono con el que lo registraste.</p>
                            
                            <div class="input-group has-validation mb-1">
                                <input type="tel" inputmode="numeric" id="telefonoCancelacion" class="form-control" placeholder="Ej: 987654321" maxlength="9" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9);">
                                <button type="button" class="btn btn-warning fw-bold" id="btnCancelarPedidoSeguimiento">Cancelar pedido</button>
                            </div>
                            
                            <!-- El mensaje de error, inicializado sin d-none para probar -->
                            <div id="mensajeErrorCancelacion" class="text-danger small fw-medium mt-1" style="display: none;"></div>
                        </div>
                    `;
                }

                const mensajeExito = `
                    <div class="text-start">
                        <strong>Pedido:</strong> <span class="font-monospace">${pedidoData.codigo}</span> <br>
                        <strong>Negocio:</strong> ${pedidoData.negocio} <br>
                        <strong>Estado actual:</strong> <span class="badge bg-success fs-6 mt-1">${pedidoData.estado}</span>
                        ${htmlBotones}
                    </div>
                `;
                
                let mensajeContenedor = formSeguimiento.parentElement.querySelector('.mensaje-js');
                if (!mensajeContenedor) {
                    mensajeContenedor = document.createElement('div');
                    mensajeContenedor.className = 'mensaje-js alert mt-3 mb-0';
                    mensajeContenedor.setAttribute('role', 'status');
                    mensajeContenedor.setAttribute('aria-live', 'polite');
                    formSeguimiento.parentElement.append(mensajeContenedor);
                }
                mensajeContenedor.className = `mensaje-js alert alert-success mt-3 mb-0 shadow-sm`;
                mensajeContenedor.innerHTML = mensajeExito;

                const btnCancelar = document.getElementById('btnCancelarPedidoSeguimiento');
                if (btnCancelar) {
                    btnCancelar.addEventListener('click', async (e) => {
                        e.preventDefault();

                        const telInput = document.getElementById('telefonoCancelacion');
                        const telConfirma = telInput.value.trim();
                        const contenedorError = document.getElementById('mensajeErrorCancelacion');
                        
                        telInput.classList.remove('is-invalid');
                        contenedorError.style.display = 'none';
                        contenedorError.textContent = '';

                        if(!telConfirma || telConfirma.length !== 9) {
                            contenedorError.textContent = 'Debe ingresar el número exacto de 9 dígitos.';
                            telInput.classList.add('is-invalid');
                            contenedorError.style.display = 'block';
                            return;
                        }

                        const textoOriginal = btnCancelar.innerHTML;
                        btnCancelar.disabled = true;
                        btnCancelar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Procesando...';

                        try {
                            const resCancel = await fetch(`${API_URL}/pedidos/${pedidoData.codigo}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ telefono: telConfirma })
                            });
                            
                            const dataCancel = await resCancel.json();
                            
                            btnCancelar.disabled = false;
                            btnCancelar.innerHTML = textoOriginal;
                            
                            if (resCancel.ok) {
                                mensajeContenedor.className = `mensaje-js alert alert-warning mt-3 mb-0 text-center`;
                                mensajeContenedor.innerHTML = `<strong>Pedido cancelado:</strong> ${dataCancel.mensaje}`;
                                input.value = ''; 
                                mostrarNotificacion('Tu pedido ha sido cancelado.', 'secondary');
                            } else {
                                contenedorError.textContent = dataCancel.error;
                                telInput.classList.add('is-invalid');
                                contenedorError.style.display = 'block';
                            }
                        } catch(error) {
                            console.error('Error:', error);
                            btnCancelar.disabled = false;
                            btnCancelar.innerHTML = textoOriginal;
                            
                            contenedorError.textContent = "Error de conexión al intentar cancelar.";
                            telInput.classList.add('is-invalid');
                            contenedorError.style.display = 'block';
                        }
                    });
                }

            } else {
                mostrarMensaje(formSeguimiento.parentElement, resultado.mensaje || 'No se encontró un pedido con ese código.', 'danger');
            }
        } catch (error) {
            console.error('Error al consultar:', error);
            mostrarMensaje(formSeguimiento.parentElement, 'Error de conexión al consultar el pedido.', 'danger');
        }
    }
    
    botonConsultar.addEventListener('click', consultarPedido);
    formSeguimiento.addEventListener('submit', evento => {
        evento.preventDefault();
        consultarPedido();
    });

    // BOTÓN VOLVER ARRIBA
    function controlarBotonArriba() {
        volverArriba.classList.toggle('visible', window.scrollY > 500);
    }

    window.addEventListener('scroll', controlarBotonArriba);
    volverArriba.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // CERRAR MENÚ MÓVIL AL NAVEGAR
    document.querySelectorAll('#navPrincipal .nav-link, #navPrincipal .btn').forEach(elemento => {
        elemento.addEventListener('click', function (evento) {
            const menu = document.getElementById('navPrincipal');
            let tiempoEspera = 0;

            if (menu && menu.classList.contains('show') && window.bootstrap) {
                bootstrap.Collapse.getOrCreateInstance(menu).hide();
                tiempoEspera = 350;
            }

            const destinoID = this.getAttribute('href');
            if (destinoID && destinoID.startsWith('#') && destinoID.length > 1) {
                evento.preventDefault();

                const seccion = document.querySelector(destinoID);
                if (seccion) {
                    setTimeout(() => {
                        const posicionY = seccion.getBoundingClientRect().top + window.scrollY - 88;
                        window.scrollTo({
                            top: posicionY,
                            behavior: 'smooth'
                        });
                    }, tiempoEspera);
                }
            }
        });
    });

    const botonTodas = categorias.querySelector('.tarjeta-categoria');
    if (botonTodas) botonTodas.setAttribute('aria-pressed', 'true');

    // Inicializar llamando al backend para obtener los productos
    cargarProductosDesdeBackend();
    actualizarResumenPedido();
    controlarBotonArriba();

    const btnConfirmarVaciar = document.getElementById('btnConfirmarVaciar');
    if (btnConfirmarVaciar) {
        btnConfirmarVaciar.addEventListener('click', () => {
            pedido = [];
            localStorage.removeItem('ho_carrito_v1');
            actualizarResumenPedido();
            mostrarNotificacion('El carrito ha sido vaciado.', 'secondary');

            const modalEl = document.getElementById('modalConfirmarVaciar');
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
        });
    }
});