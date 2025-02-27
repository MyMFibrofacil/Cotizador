//Variables a actualizar
Precio_simple=4485
Precio_simple_calada=5655
Precio_simple_sinsoga=3927
Precio_doble=6830
Precio_triple=9280
Precio_cuadruple=11590
Precio_quintuple=14641
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

    // Generar un mensaje único para cada grupo de logos agrupados
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

        // Crear un mensaje consolidado para el grupo de logos con la misma medida
        mensajes.push(`Actualmente has pedido ${cantidad} logos de medida ${medida}. ${siguienteEscalaMensaje}`);
    }

    // Mostrar todos los mensajes en el contenedor
    if (mensajes.length === 0) {
        mensajes.push('No hay logos para mostrar sugerencias.');
    }

    document.getElementById('sugerenciaEscalas').innerHTML = `
        <p style="font-size: 14px; color: white; margin-top: 10px;">
            ${mensajes.join('<br><br>')}
        </p>
    `;
}


// Actualización de la función calcularPrecioTotal para incluir la sugerencia
function calcularPrecioTotal(cantidadPestanas) {
    let totalCajas = 0;
    let totalLogos = 0;
    let detallePrecios = '';
    // Declaramos el objeto para agrupar los logos según sus dimensiones
    let logosAgrupados = {};
  
    // Recorremos cada pestaña (cada medida)
    for (let i = 1; i <= cantidadPestanas; i++) {
      // Obtener valores de la caja
      const tipoMaterial = document.getElementById(`tipoMaterial-${i}`).value;
      const tipoCaja = document.getElementById(`tipoCaja-${i}`).value;
      const cantidad = parseInt(document.getElementById(`cantidad-${i}`).value, 10);
  
      // Recuperar el precio unitario de la caja desde los parámetros cargados (Hoja 1 del Excel)
      const precioCajaUnitarioOriginal =
        window.parametrosPrecios &&
        window.parametrosPrecios[tipoMaterial] &&
        window.parametrosPrecios[tipoMaterial][tipoCaja]
          ? window.parametrosPrecios[tipoMaterial][tipoCaja]
          : 0;
  
      if (!precioCajaUnitarioOriginal) {
        alert(
          `No se encontró precio para ${tipoMaterial} y ${tipoCaja} en los parámetros.`
        );
        return;
      }
  
      // Aplicar descuento del 6% si la cantidad es mayor a 50
      const precioCajaUnitario =
        cantidad > 50 ? precioCajaUnitarioOriginal * 0.94 : precioCajaUnitarioOriginal;
      const precioCajaTotal = precioCajaUnitario * cantidad;
      totalCajas += precioCajaTotal;
  
      detallePrecios += `
        <tr>
          <td>Caja ${tipoCaja.charAt(0).toUpperCase() + tipoCaja.slice(1)}</td>
          <td>${tipoMaterial}</td>
          <td>${cantidad}</td>
          <td>$${precioCajaUnitario.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
          <td>$${precioCajaTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
        </tr>
      `;
  
      // Procesar el logo (se asume un solo logo por pestaña)
      const conLogo = document.getElementById(`conLogo-1-${i}`).value === 'si';
      if (conLogo) {
        let altoLogo = parseFloat(document.getElementById(`altoLogo-1-${i}`).value);
        let anchoLogo = parseFloat(document.getElementById(`anchoLogo-1-${i}`).value);
        if (!altoLogo || !anchoLogo) {
          alert(`Faltan dimensiones para el logo en la pestaña ${i}`);
          return;
        }
  
        // Calcular el área (mínimo 2700 mm²)
        const areaLogo = Math.max(altoLogo * anchoLogo, 2700);
        // Crear una clave única para agrupar logos con las mismas dimensiones
        const medidaLogo = `Logo (${altoLogo}x${anchoLogo})`;
  
        // Si el grupo no existe, se crea; si existe, se suma la cantidad
        if (!logosAgrupados[medidaLogo]) {
          logosAgrupados[medidaLogo] = { areaLogo: areaLogo, cantidad: 0 };
        }
        logosAgrupados[medidaLogo].cantidad += cantidad;
      }
    }
  
    // Calcular precios para cada grupo de logos
    for (const medida in logosAgrupados) {
      const { areaLogo, cantidad } = logosAgrupados[medida];
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
      // Recuperar el precio base para los logos desde los parámetros (Hoja 2 del Excel)
      const precioLogoBase = window.parametrosLogos ? window.parametrosLogos.precioLogoBase : 0;
      const costoLogoUnitario = areaLogo * precioLogoBase * factorEscala;
      const totalLogoMedida = costoLogoUnitario * cantidad;
      totalLogos += totalLogoMedida;
  
      detallePrecios += `
        <tr>
          <td style="text-align: center;">${medida}</td>
          <td style="text-align: center;">N/A</td>
          <td style="text-align: center;">${cantidad}</td>
          <td style="text-align: center;">$${costoLogoUnitario.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</td>
          <td style="text-align: right;">$${totalLogoMedida.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</td>
        </tr>
      `;
    }
  
    const precioTotal = totalCajas + totalLogos;
  
    // Mostrar el detalle y el total en el elemento con id "resultadoFinal"
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
            <td class="total-cell" style="padding-top: 14px;">$${precioTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })} + IVA</td>
          </tr>
        </tfoot>
      </table>
    `;
  
    // Mostrar el botón de exportar PDF
    const botonExportar = document.getElementById('exportarPDF');
    if (botonExportar) {
      botonExportar.style.display = 'block';
    }
  
    // Generar las sugerencias de precios para los logos agrupados
    generarSugerenciasPrecios(logosAgrupados);
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
        // Aquí armamos la pestaña entera en `innerHTML`.
        // Notar que para i=2, agregamos un bloque extra en los logoFields.
        pestana.innerHTML = `
            <div class="tab-header" onclick="togglePestana(${i})">
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

                    <p style="font-size: 14px; color: #fff; margin-top: 10px;">
                        Llevando más de <strong>50 cajas</strong>, obtienes un <strong>descuento del 6%</strong> en las cajas.
                    </p>

                    <!-- Primer Logo -->
                    <div>
                        <label for="conLogo-1-${i}">¿Deseas incluir un logo?</label>
                        <select id="conLogo-1-${i}" onchange="toggleLogoFields(${i}, 1)">
                            <option value="no" selected>No</option>
                            <option value="si">Sí</option>
                        </select>
                    </div>

                    <div id="logoFields-1-${i}" class="logo-fields" style="display: none;">

                    ${
                        i > 1
                        ? `
                          <!-- SOLO se muestra en la Medida 2 en adelante -->
                          <label for="igualLogo1Medida1-${i}">¿Es igual al primer logo de la Medida 1?</label>
                          <select id="igualLogo1Medida1-${i}" onchange="copiarLogoMedida1(${i})">
                              <option value="no" selected>No</option>
                              <option value="si">Sí</option>
                          </select>
                          `
                        : ''
                      }

                        <label for="altoLogo-1-${i}">Altura del Logo (mm):</label>
                        <input type="number" id="altoLogo-1-${i}" min="1" placeholder="Introduce la altura del logo">

                        <label for="anchoLogo-1-${i}">Ancho del Logo (mm):</label>
                        <input type="number" id="anchoLogo-1-${i}" min="1" placeholder="Introduce el ancho del logo">

                        
                    </div>

                    <!-- Segundo Logo -->
                    <div>
                        <label for="conLogo-2-${i}">¿Deseas incluir otro logo?</label>
                        <select id="conLogo-2-${i}" onchange="toggleLogoFields(${i}, 2)">
                            <option value="no" selected>No</option>
                            <option value="si">Sí</option>
                        </select>
                    </div>

                    <div id="logoFields-2-${i}" class="logo-fields" style="display: none;">
                        ${
                            i > 1
                            ? `
                                <label for="igualLogo2Medida1-${i}">¿Es igual al segundo logo de la Medida 1?</label>
                                <select id="igualLogo2Medida1-${i}" onchange="copiarLogo2Medida1(${i})">
                                    <option value="no" selected>No</option>
                                    <option value="si">Sí</option>
                                </select>
                            `
                            : ''
                        }

                        <label for="altoLogo-2-${i}">Altura del Segundo Logo (mm):</label>
                        <input type="number" id="altoLogo-2-${i}" min="1" placeholder="Introduce la altura del logo">

                        <label for="anchoLogo-2-${i}">Ancho del Segundo Logo (mm):</label>
                        <input type="number" id="anchoLogo-2-${i}" min="1" placeholder="Introduce el ancho del logo">
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
    const botonExportarPDF = document.createElement('button');
    botonExportarPDF.textContent = 'Exportar a PDF';
    botonExportarPDF.id = 'exportarPDF';
    botonExportarPDF.style.marginTop = '10px';
    botonExportarPDF.style.display = 'none'; // Oculto inicialmente
    botonExportarPDF.addEventListener("click", exportarPDF);
    contenedorPestanas.appendChild(botonExportarPDF);

    }

//menu desplegable logos
// Menú desplegable logos
function toggleLogoFields(index, logoNumber) {
    const conLogo = document.getElementById(`conLogo-${logoNumber}-${index}`).value;
    const logoFields = document.getElementById(`logoFields-${logoNumber}-${index}`);

    if (conLogo === 'si') {
        logoFields.style.display = 'block';

        // Crear un contenedor para el mensaje de error (control de ancho) si no existe
        if (!document.getElementById(`mensajeError-${logoNumber}-${index}`)) {
            const nuevoMensajeError = document.createElement('p');
            nuevoMensajeError.id = `mensajeError-${logoNumber}-${index}`;
            nuevoMensajeError.style.color = 'red';
            nuevoMensajeError.style.fontSize = '12px';
            nuevoMensajeError.style.marginTop = '5px';
            logoFields.appendChild(nuevoMensajeError);
        }

        // Crear un contenedor para el mensaje apaisado si no existe
        if (!document.getElementById(`mensajeApaisado-${logoNumber}-${index}`)) {
            const mensajeApaisado = document.createElement('p');
            mensajeApaisado.id = `mensajeApaisado-${logoNumber}-${index}`;
            mensajeApaisado.textContent = 'Si quiere logo apaisado poner el lado de mayor longitud en altura.';
            mensajeApaisado.style.color = 'white';
            mensajeApaisado.style.fontSize = '12px';
            mensajeApaisado.style.marginTop = '5px';
            logoFields.appendChild(mensajeApaisado);
        }

        // Validar el ancho del logo en tiempo real
        const anchoLogo = document.getElementById(`anchoLogo-${logoNumber}-${index}`);
        anchoLogo.addEventListener('input', () => validarAnchoLogo(index, logoNumber));
    } else {
        logoFields.style.display = 'none';

        // Limpiar el mensaje de error si el logo no se incluye
        const mensajeError = document.getElementById(`mensajeError-${logoNumber}-${index}`);
        if (mensajeError) mensajeError.textContent = '';

        // Ocultar el mensaje apaisado si el logo no se incluye
        const mensajeApaisado = document.getElementById(`mensajeApaisado-${logoNumber}-${index}`);
        if (mensajeApaisado) mensajeApaisado.style.display = 'none';
    }
}

// Función para alternar la visibilidad de las pestañas
function togglePestana(index) {
    const contenido = document.getElementById(`contenido-${index}`);
    contenido.style.display = contenido.style.display === 'none' ? 'block' : 'none';
}

async function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // ===== 1) TÍTULO EN NEGRO, SIN FONDO =====
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    const fechaFormateada = `${dia}/${mes}/${anio}`;

    const margin = 20;      // Margen lateral
    let y = 20;             // Coordenada vertical para imprimir

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Negro
    doc.text(`Resumen de Cotización - Fecha: ${fechaFormateada}`, margin, y);

    // ===== 2) OBTENER TABLA DEL DOM =====
    const tabla = document.querySelector('#resultadoFinal table');
    if (!tabla) {
        alert("No hay datos para exportar.");
        return;
    }

    // Configuraciones de tamaño
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - 2 * margin;
    const rowHeight = 10;
    const cellPadding = 3;

    // 5 columnas: Concepto(20%), Tapa(30%), Cantidad(20%), Unitario(15%), Total(15%)
    const columnWidths = [
      usableWidth * 0.20,
      usableWidth * 0.30,
      usableWidth * 0.20,
      usableWidth * 0.15,
      usableWidth * 0.15
    ];

    // Avanzamos un poco la Y para la tabla
    y += 10;
    let x = margin;

    // ===== 3) ENCABEZADO (THEAD) CON FONDO OSCURO Y TEXTO BLANCO =====
    const theadRow = tabla.querySelector('thead tr');
    if (!theadRow) {
        alert("La tabla no tiene <thead>.");
        return;
    }
    const headers = Array.from(theadRow.querySelectorAll('th')).map(th => th.textContent.trim());

    // Fondo oscuro para encabezado
    doc.setFillColor(45, 45, 45);    // Gris oscuro
    doc.setDrawColor(255, 255, 255); // Bordes blancos (opcional)
    doc.rect(x, y, usableWidth, rowHeight, 'FD');

    // Texto en blanco
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);

    let tmpX = x;
    headers.forEach((header, i) => {
        doc.text(header, tmpX + cellPadding, y + rowHeight - 3);
        tmpX += columnWidths[i];
    });
    y += rowHeight;

    // ===== 4) CUERPO (TBODY) CON FONDO BLANCO Y TEXTO NEGRO =====
    const tbodyRows = tabla.querySelectorAll('tbody tr');
    tbodyRows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());

        // Fondo blanco
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(200, 200, 200); // Bordes gris claro
        doc.rect(x, y, usableWidth, rowHeight, 'FD');

        // Texto negro
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        tmpX = x;
        cells.forEach((cell, i) => {
            // Alinear la última columna (Total) a la derecha
            if (i === 4) {
                const textWidth = doc.getTextWidth(cell);
                doc.text(cell, tmpX + columnWidths[i] - textWidth - cellPadding, y + rowHeight - 3);
            } else {
                doc.text(cell, tmpX + cellPadding, y + rowHeight - 3);
            }
            tmpX += columnWidths[i];
        });
        y += rowHeight;
    });

    // ===== 5) PIE (TFOOT) PARA MOSTRAR "TOTAL" EN FONDO OSCURO =====
    const tfootRows = tabla.querySelectorAll('tfoot tr');
    tfootRows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());

        // Supongamos que la fila de total tiene 2 celdas: "Total" y "$XX.XXX + IVA"
        if (cells.length === 2) {
            const textoTotal = cells[0]; // "Total"
            const importe = cells[1];    // "$63.073,92 + IVA", p.ej.

            // Fondo oscuro
            doc.setFillColor(45, 45, 45);
            doc.setDrawColor(80, 80, 80);
            doc.rect(x, y, usableWidth, rowHeight, 'FD');

            // Texto blanco y en negrita
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);

            tmpX = x;
            // Dejar en blanco las 3 primeras columnas
            for (let i = 0; i < 3; i++) {
                tmpX += columnWidths[i];
            }

            // Columna 4 => la palabra "Total"
            doc.text(textoTotal, tmpX + cellPadding, y + rowHeight - 3);
            tmpX += columnWidths[3];

            // Columna 5 => importe (alineado a la derecha)
            const textWidth = doc.getTextWidth(importe);
            doc.text(importe, tmpX + columnWidths[4] - textWidth - cellPadding, y + rowHeight - 3);

            y += rowHeight;
        }
    });

    // ===== 6) AGREGAR SUGERENCIAS DEBAJO DE LA TABLA =====
    const sugerenciasElement = document.getElementById('sugerenciaEscalas');
    if (sugerenciasElement) {
        // Tomamos el texto sin etiquetas HTML (o con innerText).
        let sugerenciasTexto = sugerenciasElement.innerText || sugerenciasElement.textContent;
        sugerenciasTexto = sugerenciasTexto.trim();

        if (sugerenciasTexto) {
            // Ajustamos tipografía y color
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);

            // Preparamos las líneas para no pasarnos de margen
            const lineas = doc.splitTextToSize(sugerenciasTexto, usableWidth);

            // Damos un pequeño salto de línea antes de las sugerencias
            y += 10;

            // Si ya estamos cerca del final de la hoja, pasamos a otra
            if (y + lineas.length * 6 > doc.internal.pageSize.height - margin) {
                doc.addPage();
                y = margin;
            }

            // Imprimimos cada línea
            lineas.forEach(linea => {
                doc.text(linea, margin, y);
                y += 6; // Separación entre líneas
            });
        }
    }

    // ===== 7) GUARDAR PDF =====
    doc.save('Resumen_Cotizacion.pdf');
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
//eliminar en caso de querer sacar el catalogo

function irACatalogo() {
    const urlCatalogo = "https://drive.google.com/open?id=1rcCjQ0zCi5gnys0-21lMRngtxc4lfoly&usp=drive_fs"; // Cambia este enlace por la URL real
    window.open(urlCatalogo, "_blank");
}

function manejarCambioMedidas() {
    const select = document.getElementById('opcionesMedidas');
    const valor = parseInt(select.value, 10);
  
    // Si el usuario eligió una opción válida (1, 2 o 3), se generan las pestañas
    if (!isNaN(valor)) {
      generarPestanas(valor);
    }
  }

function copiarLogoMedida1(index) {
    const selectIgual = document.getElementById(`igualLogo1Medida1-${index}`);
    const inputAlto = document.getElementById(`altoLogo-1-${index}`);
    const inputAncho = document.getElementById(`anchoLogo-1-${index}`);
  
    if (selectIgual.value === 'si') {
      // Obtener los valores del primer logo en la Medida 1
      const altoMedida1 = document.getElementById('altoLogo-1-1').value;
      const anchoMedida1 = document.getElementById('anchoLogo-1-1').value;
  
      // Si ya se completó la Medida 1
      if (altoMedida1 && anchoMedida1) {
        inputAlto.value = altoMedida1;
        inputAncho.value = anchoMedida1;
        // Deshabilitar los inputs para evitar modificaciones
        inputAlto.disabled = true;
        inputAncho.disabled = true;
      } else {
        alert('Primero completa los datos del primer logo en la Medida 1.');
        // Restablecer la selección a "no"
        selectIgual.value = 'no';
      }
    } else {
      // Si se selecciona "no", habilitar y limpiar los campos
      inputAlto.disabled = false;
      inputAncho.disabled = false;
      inputAlto.value = '';
      inputAncho.value = '';
    }
  }
  
  function copiarLogo2Medida1(index) {
    // Select que indica si es igual al logo 2 de la Medida 1
    const selectIgual = document.getElementById(`igualLogo2Medida1-${index}`);

    // Inputs del segundo logo de la Medida "index"
    const inputAlto = document.getElementById(`altoLogo-2-${index}`);
    const inputAncho = document.getElementById(`anchoLogo-2-${index}`);

    if (selectIgual && selectIgual.value === 'si') {
        // Tomar dimensiones del logo 2 de la Medida 1
        const altoMedida1 = document.getElementById('altoLogo-2-1')?.value;
        const anchoMedida1 = document.getElementById('anchoLogo-2-1')?.value;

        // Verificar que la Medida 1 tenga datos en el segundo logo
        if (altoMedida1 && anchoMedida1) {
            inputAlto.value = altoMedida1;
            inputAncho.value = anchoMedida1;
            // Deshabilitar para evitar modificaciones
            inputAlto.disabled = true;
            inputAncho.disabled = true;
        } else {
            alert('Primero completa los datos del segundo logo en la Medida 1.');
            // Volver a "No" si no existen datos en la Medida 1
            selectIgual.value = 'no';
        }
    } else {
        // Si se vuelve a "No", habilitar y limpiar los campos
        inputAlto.disabled = false;
        inputAncho.disabled = false;
        inputAlto.value = '';
        inputAncho.value = '';
    }
}

//Carga de Datos a traves de hoja Parametros//

function cargarParametrosExcel() {
    fetch('https://raw.githubusercontent.com/MyMFibrofacil/Cotizador/main/Parametros.xlsx')
      .then(response => response.arrayBuffer())
      .then(data => {
        const workbook = XLSX.read(data, { type: 'array' });
  
        // Procesar la Hoja 1: Precios de cajas
        const hoja1 = workbook.Sheets[workbook.SheetNames[0]];
        // Convertimos la hoja a un arreglo de arreglos
        const datosHoja1 = XLSX.utils.sheet_to_json(hoja1, { header: 1 });
        
        // Procesar la Hoja 2: Parámetros de logos
        const hoja2 = workbook.Sheets[workbook.SheetNames[1]];
        // Extraer valores de celdas específicas:
        const valor1mm2 = hoja2["C3"] ? hoja2["C3"].v : null;
        const precioMarceloTola = hoja2["D3"] ? hoja2["D3"].v : null;
        const precioLogoBase = hoja2["E3"] ? hoja2["E3"].v : null;
  
        // Puedes almacenar estos datos en variables globales o en un objeto para usarlos luego
        window.parametrosPrecios = procesarDatosHoja1(datosHoja1);
        window.parametrosLogos = {
          valor1mm2: valor1mm2,
          precioMarceloTola: precioMarceloTola,
          precioLogoBase: precioLogoBase
        };
  
        console.log('Parámetros de cajas:', window.parametrosPrecios);
        console.log('Parámetros de logos:', window.parametrosLogos);
        
        // Aquí podrías llamar a una función de inicialización para habilitar el resto de la app
        inicializarCotizador();
      })
      .catch(error => {
        console.error('Error al cargar el Excel:', error);
      });
  }
  
  function procesarDatosHoja1(datos) {
    // Asumimos que la primera fila es el encabezado, por lo que se comienza en la segunda fila
    const preciosCajas = {};
  
    // Recorremos cada fila (a partir de la fila 1, si la fila 0 es el encabezado)
    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      // Recordar que los índices son 0: A, 1: B, 2: C, 3: D...
      const tipoMaterial = fila[1]; // Columna B
      const medidaCaja = fila[2];   // Columna C
      const precio = fila[3];       // Columna D
  
      // Puedes organizar los datos en un objeto, por ejemplo:
      if (!preciosCajas[tipoMaterial]) {
        preciosCajas[tipoMaterial] = {};
      }
      preciosCajas[tipoMaterial][medidaCaja] = precio;
    }
    return preciosCajas;
  }