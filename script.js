//Variables a actualizar
Precio_simple=4485
Precio_simple_calada=5655
Precio_simple_sinsoga=3927
Precio_doble=6830
Precio_triple=9280
Precio_cuadruple=11590
Precio_sextuple=17383
Precio_gin=8640
Precio_magnum_x3L=9350
Precio_magnum=6485
// Define el precio base por mm² del logo
const Precio_Logo = 0.3540 * 1.1

// Opciones de cajas según el material
//Las cajas ranuradas y acrilicas hay que habilitarlas
const opcionesCajas = {
   acrilico: [
       // { value: 'simple', label: 'Simple' },
       // { value: 'doble', label: 'Doble' }
    ],
    enchapado_pino: [
        { value: 'simple', label: 'Simple' },
    //    { value: 'simple_calada', label: 'Simple Calada' },
        { value: 'simple_sinsoga', label: 'Simple Sin Soga' },
        { value: 'doble', label: 'Doble' },
        { value: 'triple', label: 'Triple' },
        { value: 'cuadruple', label: 'Cuádruple' },
        { value: 'cuadruple', label: 'Quintuple' },
        { value: 'sextuple', label: 'Séxtuple' },
        { value: 'gin', label: 'Gin' },
        { value: 'magnum_x3L', label: 'Magnum x3L' },
        { value: 'magnum', label: 'Magnum x1.5L' }
    ]
};

const limitesAnchoLogo = {
    simple: 80,
    doble: 160,
    triple: 210,
    cuadruple: 210,
    quintuple:210,
    sextuple: 210,
    gin: 160,
    magnum_x3L: 210,
    magnum: 80,
    simple_sinsoga: 80
};

// Función para actualizar las opciones del tipo de caja según el tipo de material
function actualizarOpcionesCajas(index) {
    const tipoMaterial = document.getElementById(`tipoMaterial-${index}`).value;
    const tipoCaja = document.getElementById(`tipoCaja-${index}`);

    // Limpiar opciones actuales
    tipoCaja.innerHTML = '<option value="" disabled selected>Selecciona un tipo de caja</option>';

    // Agregar las nuevas opciones según el material
    if (opcionesCajas[tipoMaterial]) {
        opcionesCajas[tipoMaterial].forEach(opcion => {
            const nuevaOpcion = document.createElement('option');
            nuevaOpcion.value = opcion.value;
            nuevaOpcion.textContent = opcion.label;
            tipoCaja.appendChild(nuevaOpcion);
        });
    }
}

// Función para mostrar u ocultar los campos de medidas del logo
function toggleLogoFields(index) {
    const conLogo = document.getElementById(`conLogo-${index}`).value;
    const logoFields = document.getElementById(`logoFields-${index}`);
    logoFields.style.display = conLogo === 'si' ? 'block' : 'none';
}

// Agregar sugerencias para la siguiente escala de precios
function generarSugerenciasPrecios(logosAgrupados) {
    const escalas = [
        { limite: 1, factor: 1.6 },
        { limite: 10, factor: 1.3 },
        { limite: 20, factor: 1.05 },
        { limite: 50, factor: 1 },
        { limite: 100, factor: 0.95 },
        { limite: 500, factor: 0.9 },
        { limite: 1000, factor: 0.85 },
        { limite: Infinity, factor: 0.8 }
    ];

    let mensajes = [];
    let medidas = Object.keys(logosAgrupados); // Obtener todas las medidas

    // Mensajes relacionados con los logos
    for (const medida in logosAgrupados) {
        const { areaLogo, cantidad } = logosAgrupados[medida];

        let siguienteEscalaMensaje = '';
        for (let i = 0; i < escalas.length; i++) {
            if (cantidad <= escalas[i].limite) {
                const siguienteEscala = escalas[i + 1];
                if (siguienteEscala) {
                    const nuevoPrecioLogoUnitario = Math.round((areaLogo * Precio_Logo) * siguienteEscala.factor);
                    siguienteEscalaMensaje = `
                        Si pides más de ${escalas[i].limite}, 
                        el precio por logo será de 
                        <strong>$${nuevoPrecioLogoUnitario.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</strong>.
                    `;
                }
                break;
            }
        }

        // Crear un mensaje consolidado para cada medida de logo
        mensajes.push(`
            Actualmente has pedido ${cantidad} logos de medida ${medida}. 
            
            ${siguienteEscalaMensaje}
        `);
    }

    // Mensaje adicional si hay más de una medida
    if (medidas.length > 1) {
        mensajes.push(`
            Actualmente has seleccionado logos de distintas medidas. 
            Podrías obtener un mejor precio si eliges logos de la misma medida.
        `);
    }

    if (mensajes.length === 0) {
        mensajes.push('');
    }

    // Mostrar todos los mensajes en el contenedor
    document.getElementById('sugerenciaEscalas').innerHTML = `
        <p style="font-size: 14px; color: #555; margin-top: 10px;">
            ${mensajes.join('<br><br>')}
        </p>
    `;
}

// Actualización de la función calcularPrecioTotal para incluir la sugerencia
function calcularPrecioTotal(cantidadPestanas) {
    let totalCajas = 0;
    let totalLogos = 0;
    let detallePrecios = '';
    const logosAgrupados = {};

    for (let i = 1; i <= cantidadPestanas; i++) {
        const tipoMaterial = document.getElementById(`tipoMaterial-${i}`).value;
        const tipoCaja = document.getElementById(`tipoCaja-${i}`).value;
        const cantidad = parseInt(document.getElementById(`cantidad-${i}`).value);
        const conLogo1 = document.getElementById(`conLogo-1-${i}`).value === 'si';
        const conLogo2 = document.getElementById(`conLogo-2-${i}`).value === 'si';

        if (!tipoMaterial || !tipoCaja || !cantidad || 
            (conLogo1 && (!document.getElementById(`altoLogo-1-${i}`).value || !document.getElementById(`anchoLogo-1-${i}`).value)) || 
            (conLogo2 && (!document.getElementById(`altoLogo-2-${i}`).value || !document.getElementById(`anchoLogo-2-${i}`).value))) {
            alert('Por favor, completa todos los campos en la pestaña Medida ' + i);
            return;
        }


        // Calcular el precio de las cajas
        let precioCajaUnitario = 0;
        switch (tipoCaja) {
            case 'simple': precioCajaUnitario = Precio_simple; break;
            case 'simple_sinsoga': precioCajaUnitario= Precio_simple_sinsoga; break;
            case 'simple_calada': precioCajaUnitario = Precio_simple_calada; break;
            case 'doble': precioCajaUnitario = Precio_doble; break;
            case 'triple': precioCajaUnitario = Precio_triple; break;
            case 'cuadruple': precioCajaUnitario = Precio_cuadruple; break;
            case 'quintuple': precioCajaUnitario = Precio_quintuple; break;
            case 'sextuple': precioCajaUnitario = Precio_sextuple; break;
            case 'gin': precioCajaUnitario =Precio_gin; break;
            case 'magnum_x3L': precioCajaUnitario = Precio_magnum_x3L; break;
            case 'magnum_x1.5L': precioCajaUnitario = Precio_magnum; break;
            default:
                alert('El tipo de caja seleccionado no es válido en la pestaña Medida ' + i);
                return;
        }

        let precioCajaTotal = precioCajaUnitario * cantidad;
        if (cantidad > 50) {
            precioCajaTotal *= 0.9; // Descuento del 10%
        }
        totalCajas += precioCajaTotal;

        // Manejo del primer logo
        if (conLogo1) {
            const altoLogo1 = parseFloat(document.getElementById(`altoLogo-1-${i}`).value);
            const anchoLogo1 = parseFloat(document.getElementById(`anchoLogo-1-${i}`).value);
            const areaLogo1 = Math.max(altoLogo1 * anchoLogo1, 2700);
            const medidaLogo1 = `${altoLogo1}x${anchoLogo1}`;

            if (!logosAgrupados[medidaLogo1]) {
                logosAgrupados[medidaLogo1] = { areaLogo: areaLogo1, cantidad: 0 };
            }
            logosAgrupados[medidaLogo1].cantidad += cantidad;
        }

        // Manejo del segundo logo
        if (conLogo2) {
            const altoLogo2 = parseFloat(document.getElementById(`altoLogo-2-${i}`).value);
            const anchoLogo2 = parseFloat(document.getElementById(`anchoLogo-2-${i}`).value);
            const areaLogo2 = Math.max(altoLogo2 * anchoLogo2, 2700);
            const medidaLogo2 = `${altoLogo2}x${anchoLogo2}`;

            if (!logosAgrupados[medidaLogo2]) {
                logosAgrupados[medidaLogo2] = { areaLogo: areaLogo2, cantidad: 0 };
            }
            logosAgrupados[medidaLogo2].cantidad += cantidad;
        }

        // Agregar detalle de precios para cajas
        detallePrecios += `
        <tr>
            <td style="text-align: center;">Caja ${tipoCaja.charAt(0).toUpperCase() + tipoCaja.slice(1).replace('_', ' ')}</td>
            <td style="text-align: center;">${tipoMaterial.charAt(0).toUpperCase() + tipoMaterial.slice(1).replace('_', ' ')}</td>
            <td style="text-align: center;">${cantidad}</td>
            <td style="text-align: center;">$${precioCajaUnitario.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</td>
            <td style="text-align: right;">$${precioCajaTotal.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</td>
        </tr>
        `;
    }

    // Calcular precios de los logos agrupados
    for (const medida in logosAgrupados) {
        const { areaLogo, cantidad } = logosAgrupados[medida];
        let precioLogoBase = areaLogo * Precio_Logo;

        // Determinar el factor de escala según la cantidad agrupada
        let factorEscala = 1;
        if (cantidad === 1) {
            factorEscala = 1.6;
        } else if (cantidad >= 2 && cantidad <= 10) {
            factorEscala = 1.3;
        } else if (cantidad >= 11 && cantidad <= 20) {
            factorEscala = 1.05;
        } else if (cantidad >= 21 && cantidad <= 50) {
            factorEscala = 1;
        } else if (cantidad >= 51 && cantidad <= 100) {
            factorEscala = 0.95;
        } else if (cantidad >= 101 && cantidad <= 500) {
            factorEscala = 0.9;
        } else if (cantidad > 500) {
            factorEscala = 0.85;
        }

        const costoLogoUnitario = precioLogoBase * factorEscala;
        const totalLogoMedida = costoLogoUnitario * cantidad;
        totalLogos += totalLogoMedida;

        detallePrecios += `
        <tr>
            <td style="text-align: center;">Logo ${medida}</td>
            <td style="text-align: center;">N/A</td>
            <td style="text-align: center;">${cantidad}</td>
            <td style="text-align: center;">$${costoLogoUnitario.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</td>
            <td style="text-align: right;">$${totalLogoMedida.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</td>
        </tr>
        `;
    }

    const precioTotal = totalCajas + totalLogos;

    // Mostrar el desglose de precios
    document.getElementById('resultadoFinal').innerHTML = `
    <table>
        <thead>
            <tr>
                <th>Concepto</th>
                <th>Tipo de Tapa</th>
                <th>Cantidad</th>
                <th>Unitario</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${detallePrecios}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4" style="text-align: right; padding-top: 14px;">Total</td>
                <td class="total-cell" style="padding-top: 14px;">$${precioTotal.toLocaleString('es-AR', { minimumFractionDigits: 0 })} + IVA</td>
            </tr>
        </tfoot>
    </table>
    `;

    // Mostrar el botón para exportar PDF
    const botonExportar = document.getElementById('exportarJPG');
    botonExportar.style.display = 'block';

        // Llamar a la función para generar sugerencias
    generarSugerenciasPrecios(logosAgrupados, cantidadPestanas);
}

// Función para generar dinámicamente las pestañas según la cantidad seleccionada
//AGREGAR MAS TARDE cuando se incorpore acrilico, poner option value acrilico en el hueco del codigo
//<option value="" disabled selected>Selecciona un material</option>Linea 280
//<option value="acrilico">Acrílico</option>Linea 281
//<option value="enchapado_pino">Enchapado de Pino</option>Linea282
function generarPestanas(cantidad) {
    const contenedorPestanas = document.getElementById('contenedorPestanas');
    contenedorPestanas.innerHTML = ''; // Limpia el contenedor

    for (let i = 1; i <= cantidad; i++) {
        const pestana = document.createElement('div');
        pestana.className = 'pestana';
        pestana.innerHTML = `
            <div style="padding: 10px; background-color: #f7f7f7; cursor: pointer;" onclick="togglePestana(${i})">
                <strong>Medida ${i}</strong>
            </div>
            <div id="contenido-${i}" style="display: none; padding: 10px;">
                <form>
                    <label for="tipoMaterial-${i}">Tipo de Material para la Tapa:</label>
                    <select id="tipoMaterial-${i}" required onchange="actualizarOpcionesCajas(${i})">
                        <option value="" disabled selected>Selecciona un material</option>
                        
                        <option value="enchapado_pino">Enchapado de Pino</option>
                    </select>

                    <label for="tipoCaja-${i}">Tipo de Caja:</label>
                    <select id="tipoCaja-${i}" required>
                        <option value="" disabled selected>Selecciona un tipo de caja</option>
                    </select>

                    <label for="cantidad-${i}">Cantidad (unidades):</label>
                    <input type="number" id="cantidad-${i}" min="1" required placeholder="Introduce la cantidad">

                    <!-- Mensaje de descuento -->
                    <p style="font-size: 14px; color: #555; margin-top: 10px;">
                        Llevando más de <strong>50 cajas</strong>, obtienes un <strong>descuento del 10%</strong> en las cajas.
                    </p>

                    <div>
                        <label for="conLogo-1-${i}">¿Deseas incluir un logo?</label>
                        <select id="conLogo-1-${i}" onchange="toggleLogoFields(${i}, 1)">
                            <option value="no" selected>No</option>
                            <option value="si">Sí</option>
                        </select>
                    </div>

                    <!-- Campos para el primer logo -->
                    <div id="logoFields-1-${i}" style="display: none;">
                        <label for="altoLogo-1-${i}">Altura del Logo (mm):</label>
                        <input type="number" id="altoLogo-1-${i}" min="1" placeholder="Introduce la altura del logo">

                        <label for="anchoLogo-1-${i}">Ancho del Logo (mm):</label>
                        <input type="number" id="anchoLogo-1-${i}" min="1" placeholder="Introduce el ancho del logo">
                    </div>

                    <div>
                        <label for="conLogo-2-${i}">¿Deseas incluir otro logo?</label>
                        <select id="conLogo-2-${i}" onchange="toggleLogoFields(${i}, 2)">
                            <option value="no" selected>No</option>
                            <option value="si">Sí</option>
                        </select>
                    </div>

                    <!-- Campos para el segundo logo -->
                    <div id="logoFields-2-${i}" style="display: none;">
                        <label for="altoLogo-2-${i}">Altura del Segundo Logo (mm):</label>
                        <input type="number" id="altoLogo-2-${i}" min="1" placeholder="Introduce la altura del logo">

                        <label for="anchoLogo-2-${i}">Ancho del Segundo Logo (mm):</label>
                        <input type="number" id="anchoLogo-2-${i}" min="1" placeholder="Introduce el ancho del logo">
                    </div>
                </form>
            </div>
        `;
        contenedorPestanas.appendChild(pestana);
    }

    // Botón para calcular precio
    const botonCalcular = document.createElement('button');
    botonCalcular.textContent = 'Calcular Precio Total';
    botonCalcular.style.marginTop = '20px';
    botonCalcular.onclick = () => calcularPrecioTotal(cantidad);
    contenedorPestanas.appendChild(botonCalcular);

    // Contenedor para mostrar el resultado final
    const resultadoFinal = document.createElement('div');
    resultadoFinal.id = 'resultadoFinal';
    resultadoFinal.className = 'result';
    contenedorPestanas.appendChild(resultadoFinal);

    // Botón para exportar PDF
    const botonExportarJPG = document.createElement('button');
    botonExportarJPG.textContent = 'Exportar a JPG';
    botonExportarJPG.id = 'exportarJPG';
    botonExportarJPG.style.marginTop = '10px';
    botonExportarJPG.style.display = 'none'; // Oculto inicialmente
    botonExportarJPG.onclick = exportarJPG;
    contenedorPestanas.appendChild(botonExportarJPG);
}

//menu desplegable logos
function toggleLogoFields(index, logoNumber) {
    const conLogo = document.getElementById(`conLogo-${logoNumber}-${index}`).value;
    const logoFields = document.getElementById(`logoFields-${logoNumber}-${index}`);

    if (conLogo === 'si') {
        logoFields.style.display = 'block';

        // Crear un contenedor para el mensaje de error si no existe
        if (!document.getElementById(`mensajeError-${logoNumber}-${index}`)) {
            const nuevoMensajeError = document.createElement('p');
            nuevoMensajeError.id = `mensajeError-${logoNumber}-${index}`;
            logoFields.appendChild(nuevoMensajeError);
        }
    } else {
        logoFields.style.display = 'none';
        const mensajeError = document.getElementById(`mensajeError-${logoNumber}-${index}`);
        if (mensajeError) mensajeError.textContent = ''; // Limpiar el mensaje de error si el logo no se incluye
    }
}

// Función para alternar la visibilidad de las pestañas
function togglePestana(index) {
    const contenido = document.getElementById(`contenido-${index}`);
    contenido.style.display = contenido.style.display === 'none' ? 'block' : 'none';
}

function exportarJPG() {
    // Seleccionar el cuadro de resumen
    const elemento = document.getElementById('resultadoFinal');

    // Usar html2canvas para capturar el elemento
    html2canvas(elemento, { scale: 2 }).then(canvas => {
        // Convertir el canvas a una URL en formato JPG
        const link = document.createElement('a');
        link.download = 'Resumen_Cotizacion.jpg'; // Nombre del archivo
        link.href = canvas.toDataURL('image/jpeg', 1.0); // Calidad máxima
        link.click(); // Simular clic para descargar
    }).catch(error => {
        console.error('Error al exportar a JPG:', error);
    });
}

// Validar dimensiones del logo
function validarAnchoLogo(index, logoNumber) {
    const tipoCaja = document.getElementById(`tipoCaja-${index}`).value;
    const anchoLogo = parseFloat(document.getElementById(`anchoLogo-${logoNumber}-${index}`).value);
    const mensajeError = document.getElementById(`mensajeError-${logoNumber}-${index}`);

    if (tipoCaja && limitesAnchoLogo[tipoCaja] && anchoLogo > limitesAnchoLogo[tipoCaja]) {
        mensajeError.textContent = `El ancho del logo supera el máximo permitido para una caja de tipo ${tipoCaja} (${limitesAnchoLogo[tipoCaja]} mm).`;
        mensajeError.style.color = 'red';
    } else {
        mensajeError.textContent = ''; // Limpiar el mensaje si no hay error
    }
}

function validarAnchoAlturaLogo(index, logoNumber) {
    const tipoCaja = document.getElementById(`tipoCaja-${index}`).value;
    const alturaLogo = parseFloat(document.getElementById(`altoLogo-${logoNumber}-${index}`).value);
    const mensajeError = document.getElementById(`mensajeError-${logoNumber}-${index}`);

    // Validar altura
    if (alturaLogo > 210) {
        mensajeError.textContent = `La altura del logo no puede superar los 210 mm.`;
        mensajeError.style.color = 'red';
    } else {
        mensajeError.textContent = ''; // Limpiar el mensaje si no hay error
    }
}

// Agregar validación al evento `input` de los campos de ancho de ambos logos
document.addEventListener('input', (event) => {
    const element = event.target;
    const matchAncho = element.id.match(/^anchoLogo-(\d+)-(\d+)$/);
    const matchAlto = element.id.match(/^altoLogo-(\d+)-(\d+)$/);

    if (matchAncho) {
        const index = matchAncho[2];
        const logoNumber = matchAncho[1];
        validarAnchoLogo(index, logoNumber);
    }

    if (matchAlto) {
        const index = matchAlto[2];
        const logoNumber = matchAlto[1];
        validarAnchoAlturaLogo(index, logoNumber);
    }
});
