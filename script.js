(() => {
  const STORAGE_KEY = "tola_pricing_v1";
  const PRICE_PASSWORD = "Tola1234";
  const PHOTO_PRICING_PASSWORD = "Pablo.4268";

  const DEFAULT_PRICING = {
    valor_mm2: 0.41668,
    area_min_mm2: 2700,
    factor_qr: 1.2,
    margen_cliente_pct: 10,
    descuento_caja_mas_50_pct: 6,
    modelos_precio: {
      simple: 4755,
      simple_sinsoga: 4162,
      doble: 7240,
      triple: 9836,
      cuadruple: 12286,
      quintuple: 15000,
      sextuple: 18430,
      gin: 9160,
      magnum_x3l: 9911,
      magnum: 6875
    },
    escalas: [
      { min: 1, max: 1, factor: 1.6 },
      { min: 2, max: 10, factor: 1.3 },
      { min: 11, max: 20, factor: 1.05 },
      { min: 21, max: 50, factor: 1.0 },
      { min: 51, max: 100, factor: 0.95 },
      { min: 101, max: 500, factor: 0.9 },
      { min: 501, max: 1000, factor: 0.85 },
      { min: 1001, max: Infinity, factor: 0.8 }
    ]
  };

  const MODEL_OPTIONS = [
    { value: "simple", label: "Simple" },
    { value: "simple_sinsoga", label: "Simple Sin Soga" },
    { value: "doble", label: "Doble" },
    { value: "triple", label: "Triple" },
    { value: "cuadruple", label: "Cuadruple" },
    { value: "quintuple", label: "Quintuple" },
    { value: "sextuple", label: "Sextuple" },
    { value: "gin", label: "Gin" },
    { value: "magnum_x3l", label: "Magnum x3L" },
    { value: "magnum", label: "Magnum x1.5L" }
  ];
  const MAX_LOGO_WIDTH_BY_MODEL = {
    simple: 80,
    simple_sinsoga: 80,
    doble: 160,
    triple: 210,
    cuadruple: 210,
    quintuple: 210,
    sextuple: 210,
    gin: 160,
    magnum_x3l: 210,
    magnum: 80
  };
  const MAX_LOGO_HEIGHT = 210;

  const parseNumber = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (value === null || value === undefined) return 0;
    const raw = String(value).trim().replace(",", ".");
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const fmtARS = (value) => new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(parseNumber(value));

  const round2 = (value) => Math.round((parseNumber(value) + Number.EPSILON) * 100) / 100;

  const cloneDefaultPricing = () => ({
    ...DEFAULT_PRICING,
    modelos_precio: { ...DEFAULT_PRICING.modelos_precio },
    escalas: DEFAULT_PRICING.escalas.map((e) => ({ ...e }))
  });

  function loadPricing() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneDefaultPricing();
      const parsed = JSON.parse(raw);
      return {
        ...cloneDefaultPricing(),
        ...parsed,
        modelos_precio: {
          ...DEFAULT_PRICING.modelos_precio,
          ...(parsed?.modelos_precio || {})
        },
        escalas: Array.isArray(parsed?.escalas) && parsed.escalas.length ? parsed.escalas : cloneDefaultPricing().escalas
      };
    } catch {
      return cloneDefaultPricing();
    }
  }

  function savePricing(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  let PRICING = loadPricing();
  let modelIndex = 0;
  let LAST_SUMMARY = {
    detail: [],
    costoTotal: 0,
    finalTotal: 0
  };
  let photoPricingUnlocked = false;

  function factorPorCantidad(total) {
    const n = Math.max(1, parseNumber(total));
    const escala = PRICING.escalas.find((e) => n >= e.min && n <= e.max) || PRICING.escalas[PRICING.escalas.length - 1];
    return parseNumber(escala?.factor || 1);
  }

  function precioCajaUnitario(modelo, cantidad) {
    const base = parseNumber(PRICING.modelos_precio?.[modelo] || 0);
    const qty = Math.max(1, parseNumber(cantidad));
    if (qty > 50) {
      return base * (1 - parseNumber(PRICING.descuento_caja_mas_50_pct) / 100);
    }
    return base;
  }

  function precioLogoUnitario(logo, factorEmpresa) {
    const ancho = Math.max(0, parseNumber(logo.ancho_mm));
    const alto = Math.max(0, parseNumber(logo.alto_mm));
    const area = Math.max(ancho * alto, parseNumber(PRICING.area_min_mm2));
    let unit = area * parseNumber(PRICING.valor_mm2) * parseNumber(factorEmpresa || 1);
    if (logo.es_qr) unit *= parseNumber(PRICING.factor_qr);
    return round2(unit);
  }

  function modelLabel(modelValue) {
    return MODEL_OPTIONS.find((m) => m.value === modelValue)?.label || modelValue;
  }

  function createModelOptionsHtml() {
    return MODEL_OPTIONS.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join("");
  }

  function getLogoValidationError(modelo, ancho, alto) {
    if (ancho <= 0 || alto <= 0) return "";
    const anchoMax = parseNumber(MAX_LOGO_WIDTH_BY_MODEL[modelo] || 210);
    if (ancho > anchoMax) {
      return `El ancho supera el máximo para ${modelLabel(modelo)} (${anchoMax} mm).`;
    }
    if (alto > MAX_LOGO_HEIGHT) {
      return `La altura no puede superar ${MAX_LOGO_HEIGHT} mm.`;
    }
    return "";
  }

  function updateLogoLimitsForCard(card) {
    const modelo = (card?.dataset?.modelo || "").trim();
    const anchoMax = parseNumber(MAX_LOGO_WIDTH_BY_MODEL[modelo] || 210);
    card?.querySelectorAll(".logo-block").forEach((block) => {
      const anchoInput = block.querySelector(".logo-ancho");
      const altoInput = block.querySelector(".logo-alto");
      if (anchoInput) anchoInput.max = String(anchoMax);
      if (altoInput) altoInput.max = String(MAX_LOGO_HEIGHT);
    });
  }

  function validateLogoBlock(logoBlock) {
    const card = logoBlock.closest(".modelo-card");
    const modelo = (card?.dataset?.modelo || "").trim();
    const anchoInput = logoBlock.querySelector(".logo-ancho");
    const altoInput = logoBlock.querySelector(".logo-alto");
    const errorNode = logoBlock.querySelector(".logo-error");
    const ancho = parseNumber(anchoInput?.value);
    const alto = parseNumber(altoInput?.value);
    const msg = getLogoValidationError(modelo, ancho, alto);
    if (errorNode) {
      errorNode.textContent = msg;
      errorNode.classList.toggle("hidden", !msg);
    }
    if (anchoInput) anchoInput.classList.toggle("border-red-500", Boolean(msg));
    if (altoInput) altoInput.classList.toggle("border-red-500", Boolean(msg));
    return !msg;
  }

  function setLogoPhotoPreview(block, dataUrl, fileName = "") {
    const img = block.querySelector(".logo-photo-preview");
    const ph = block.querySelector(".logo-photo-ph");
    block.dataset.fotoData = dataUrl || "";
    block.dataset.fotoName = fileName || "";
    if (img) {
      img.src = dataUrl || "";
      img.classList.toggle("hidden", !dataUrl);
    }
    if (ph) ph.classList.toggle("hidden", !!dataUrl);
  }

  function createLogoBlock(modelo = "") {
    const anchoMax = parseNumber(MAX_LOGO_WIDTH_BY_MODEL[modelo] || 210);
    const block = document.createElement("div");
    block.className = "rounded-lg border border-gray-700 p-3 bg-gray-800/70 logo-block";
    block.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div class="lg:col-span-8 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="text-xs text-gray-300">Ancho (mm)
              <input type="number" min="0" max="${anchoMax}" class="logo-ancho mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-2 h-10 text-sm"/>
            </label>
            <label class="text-xs text-gray-300">Alto (mm)
              <input type="number" min="0" max="${MAX_LOGO_HEIGHT}" class="logo-alto mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-2 h-10 text-sm"/>
            </label>
          </div>
          <label class="text-xs text-gray-300">Observación
            <input type="text" class="logo-obs mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-2 h-10 text-sm" placeholder="Ej: Centrado, dorado, frente..."/>
          </label>
          <label class="text-xs text-gray-300 flex items-center gap-2">
            <input type="checkbox" class="logo-qr h-4 w-4"/>
            Es QR
          </label>
        </div>
        <div class="lg:col-span-4">
          <div tabindex="0" role="button" aria-label="Pegar o seleccionar foto del logo" class="logo-preview-box h-32 max-h-32 rounded-md border border-gray-700 bg-black/20 flex items-center justify-center overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40">
            <span class="logo-photo-ph text-[10px] text-gray-500">Sin imagen</span>
            <img class="logo-photo-preview hidden max-h-full max-w-full object-contain" alt="Foto logo"/>
          </div>
          <input type="file" accept="image/*" class="logo-foto hidden"/>
        </div>
      </div>
      <p class="logo-error hidden mt-2 text-xs text-red-300"></p>
      <div class="mt-2 flex justify-end">
        <button type="button" class="btn-del-logo text-xs text-red-300 hover:text-red-200">Eliminar logo</button>
      </div>
    `;
    setLogoPhotoPreview(block, "", "");

    const fireRefresh = () => {
      validateLogoBlock(block);
      refreshSummary();
    };
    const fotoInput = block.querySelector(".logo-foto");
    const previewBox = block.querySelector(".logo-preview-box");
    const loadPhotoFile = (file) => {
      if (!file) {
        setLogoPhotoPreview(block, "", "");
        refreshSummary();
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPhotoPreview(block, String(reader.result || ""), file.name || "");
        refreshSummary();
      };
      reader.readAsDataURL(file);
    };

    block.querySelectorAll("input").forEach((el) => el.addEventListener("input", fireRefresh));
    block.querySelector(".logo-qr")?.addEventListener("change", fireRefresh);
    fotoInput?.addEventListener("change", (event) => loadPhotoFile(event.target?.files?.[0]));
    previewBox?.addEventListener("click", () => fotoInput?.click());
    previewBox?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fotoInput?.click();
      }
    });
    previewBox?.addEventListener("paste", (event) => {
      const items = Array.from(event.clipboardData?.items || []);
      const imgItem = items.find((it) => it.type && it.type.startsWith("image/"));
      if (!imgItem) return;
      event.preventDefault();
      const file = imgItem.getAsFile();
      if (file) loadPhotoFile(file);
    });
    block.querySelector(".btn-del-logo")?.addEventListener("click", () => {
      const parent = block.closest(".logos-container");
      block.remove();
      if (parent && !parent.querySelector(".logo-block")) {
        parent.appendChild(createLogoBlock(modelo));
      }
      refreshSummary();
    });
    validateLogoBlock(block);
    return block;
  }

  function addModelCard(empresa, modelo, cantidad) {
    const list = document.getElementById("lista-modelos");
    if (!list) return;

    const card = document.createElement("div");
    card.className = "rounded-xl border border-gray-700 bg-gray-800/60 p-4 modelo-card space-y-3";
    card.dataset.modelIndex = String(modelIndex++);

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-white font-semibold">${modelLabel(modelo)}</p>
          <p class="text-xs text-gray-400">Empresa: ${empresa}</p>
        </div>
        <div class="flex items-center gap-3">
          <label class="text-xs text-gray-300">Cantidad
            <input type="number" min="1" value="${Math.max(1, parseNumber(cantidad))}" class="modelo-cantidad mt-1 w-24 rounded-md border border-gray-600 bg-gray-900 px-2 h-9 text-sm"/>
          </label>
          <button type="button" class="btn-del-model text-xs text-red-300 hover:text-red-200">Eliminar</button>
        </div>
      </div>
      <div class="text-xs text-gray-400">Logos del modelo</div>
      <div class="logos-container space-y-2"></div>
      <div>
        <button type="button" class="btn-add-logo rounded-md border border-gray-600 px-3 h-9 text-xs hover:bg-gray-700">Agregar logo</button>
      </div>
    `;

    card.dataset.empresa = empresa;
    card.dataset.modelo = modelo;

    const logosContainer = card.querySelector(".logos-container");
    logosContainer.appendChild(createLogoBlock(modelo));

    card.querySelector(".btn-add-logo")?.addEventListener("click", () => {
      logosContainer.appendChild(createLogoBlock(modelo));
      refreshSummary();
    });
    card.querySelector(".btn-del-model")?.addEventListener("click", () => {
      card.remove();
      refreshSummary();
    });
    card.querySelector(".modelo-cantidad")?.addEventListener("input", refreshSummary);

    list.appendChild(card);
    updateLogoLimitsForCard(card);
    refreshSummary();
  }

  function readItems() {
    const cards = Array.from(document.querySelectorAll(".modelo-card"));
    return cards.map((card) => {
      const empresa = (card.dataset.empresa || "").trim();
      const modelo = (card.dataset.modelo || "").trim();
      const cantidad = Math.max(1, parseNumber(card.querySelector(".modelo-cantidad")?.value));
      const logos = Array.from(card.querySelectorAll(".logo-block")).map((logoNode) => {
        const ancho_mm = parseNumber(logoNode.querySelector(".logo-ancho")?.value);
      const alto_mm = parseNumber(logoNode.querySelector(".logo-alto")?.value);
      const es_qr = Boolean(logoNode.querySelector(".logo-qr")?.checked);
      const observacion = (logoNode.querySelector(".logo-obs")?.value || "").trim();
      const foto_data = logoNode.dataset.fotoData || "";
      const foto_name = logoNode.dataset.fotoName || "";
      const error = getLogoValidationError(modelo, ancho_mm, alto_mm);
      return {
        ancho_mm,
        alto_mm,
        es_qr,
        observacion,
        foto_data,
        foto_name,
        valido: !error,
        error
      };
      }).filter((l) => l.ancho_mm > 0 && l.alto_mm > 0);

      return { empresa, modelo, cantidad, logos };
    }).filter((item) => item.empresa && item.modelo && item.cantidad > 0);
  }

  function renderSummary(itemsDetail, costoTotal, finalTotal) {
    const costoItems = document.getElementById("resumen-items-costo");
    const finalItems = document.getElementById("resumen-items-final");
    const costoTotalEl = document.getElementById("total-costo");
    const finalTotalEl = document.getElementById("total-final");
    const marginLabel = document.getElementById("lbl-margen");
    const warningBox = document.getElementById("validation-warning");

    if (!costoItems || !finalItems || !costoTotalEl || !finalTotalEl || !marginLabel) return;

    const costoRows = itemsDetail.map((it) => `
      <div class="rounded-lg border border-gray-700/50 p-3 space-y-1">
        <div class="flex justify-between text-sm">
          <span class="font-semibold">${it.empresa} - ${modelLabel(it.modelo)} (${it.cantidad})</span>
          <span class="font-semibold">${fmtARS(it.costoTotal)}</span>
        </div>
        <div class="flex justify-between text-xs text-gray-300">
          <span>Cajas: ${fmtARS(it.cajaUnit)} x ${it.cantidad}</span>
          <span>${fmtARS(it.cajaTotal)}</span>
        </div>
        <div class="flex justify-between text-xs text-gray-300">
          <span>Logos: ${fmtARS(it.logosUnit)} x ${it.cantidad}</span>
          <span>${fmtARS(it.logosTotal)}</span>
        </div>
        ${it.logosDetalle.map((logo, idx) => `
          <div class="flex justify-between text-[11px] text-gray-400 pl-2">
            <span>Logo ${idx + 1}${logo.es_qr ? " (QR)" : ""} ${logo.ancho_mm}x${logo.alto_mm}${logo.foto_name ? ` [${logo.foto_name}]` : ""}: ${fmtARS(logo.unit)}</span>
            <span>${fmtARS(logo.total)}</span>
          </div>
        `).join("")}
      </div>
    `).join("");

    const finalRows = itemsDetail.map((it) => `
      <div class="rounded-lg border border-gray-700/50 p-3 space-y-1">
        <div class="flex justify-between text-sm">
          <span class="font-semibold">${it.empresa} - ${modelLabel(it.modelo)} (${it.cantidad})</span>
          <span class="font-semibold">${fmtARS(it.finalTotal)}</span>
        </div>
        <div class="flex justify-between text-xs text-gray-300">
          <span>Cajas final: ${fmtARS(it.cajaUnitFinal)} x ${it.cantidad}</span>
          <span>${fmtARS(it.cajaTotalFinal)}</span>
        </div>
        <div class="flex justify-between text-xs text-gray-300">
          <span>Logos final: ${fmtARS(it.logosUnitFinal)} x ${it.cantidad}</span>
          <span>${fmtARS(it.logosTotalFinal)}</span>
        </div>
        ${it.logosDetalleFinal.map((logo, idx) => `
          <div class="flex justify-between text-[11px] text-gray-400 pl-2">
            <span>Logo ${idx + 1}${logo.es_qr ? " (QR)" : ""} ${logo.ancho_mm}x${logo.alto_mm}${logo.foto_name ? ` [${logo.foto_name}]` : ""}: ${fmtARS(logo.unitFinal)}</span>
            <span>${fmtARS(logo.totalFinal)}</span>
          </div>
        `).join("")}
      </div>
    `).join("");

    costoItems.innerHTML = costoRows || '<p class="text-sm text-gray-400">Sin items cargados.</p>';
    finalItems.innerHTML = finalRows || '<p class="text-sm text-gray-400">Sin items cargados.</p>';
    costoTotalEl.textContent = fmtARS(costoTotal);
    finalTotalEl.textContent = fmtARS(finalTotal);
    marginLabel.textContent = String(parseNumber(PRICING.margen_cliente_pct));
    const invalidCount = itemsDetail.reduce((acc, it) => acc + parseNumber(it.invalidLogos || 0), 0);
    if (warningBox) {
      warningBox.classList.toggle("hidden", invalidCount === 0);
      warningBox.textContent = invalidCount > 0
        ? `Hay ${invalidCount} logo(s) fuera de límite. Esos logos no se incluyeron en el cálculo hasta corregir medidas.`
        : "";
    }
  }

  function refreshSummary() {
    const items = readItems();
    const totalEmpresa = {};
    items.forEach((it) => {
      totalEmpresa[it.empresa] = (totalEmpresa[it.empresa] || 0) + it.cantidad;
    });

    const factorCliente = 1 + parseNumber(PRICING.margen_cliente_pct) / 100;
    let costoTotal = 0;
    let finalTotal = 0;
    const detail = items.map((it) => {
      const cajaUnit = precioCajaUnitario(it.modelo, it.cantidad);
      const cajaTotal = round2(cajaUnit * it.cantidad);
      const factorEmpresa = factorPorCantidad(totalEmpresa[it.empresa] || it.cantidad);
      const logosValidos = it.logos.filter((logo) => logo.valido);
      const invalidLogos = it.logos.length - logosValidos.length;
      const logosDetalle = logosValidos.map((logo) => {
        const unit = precioLogoUnitario(logo, factorEmpresa);
        return {
          ...logo,
          unit,
          total: round2(unit * it.cantidad)
        };
      });
      const logosUnit = round2(logosDetalle.reduce((acc, logo) => acc + logo.unit, 0));
      const logosTotal = round2(logosUnit * it.cantidad);
      const costoItem = round2(cajaTotal + logosTotal);
      const cajaUnitFinal = cajaUnit;
      const cajaTotalFinal = cajaTotal;
      const logosUnitFinal = round2(logosUnit * factorCliente);
      const logosTotalFinal = round2(logosTotal * factorCliente);
      const finalItem = round2(cajaTotalFinal + logosTotalFinal);
      const logosDetalleFinal = logosDetalle.map((logo) => ({
        ...logo,
        unitFinal: round2(logo.unit * factorCliente),
        totalFinal: round2(logo.total * factorCliente)
      }));
      costoTotal += costoItem;
      finalTotal += finalItem;
      return {
        ...it,
        invalidLogos,
        cajaUnit,
        cajaTotal,
        cajaUnitFinal,
        cajaTotalFinal,
        logosUnit,
        logosTotal,
        logosUnitFinal,
        logosTotalFinal,
        logosDetalle,
        logosDetalleFinal,
        costoTotal: costoItem,
        finalTotal: finalItem
      };
    });

    costoTotal = round2(costoTotal);
    finalTotal = round2(finalTotal);
    LAST_SUMMARY = {
      detail,
      costoTotal,
      finalTotal
    };
    renderSummary(detail, costoTotal, finalTotal);
  }

  function getHeaderBaseLines() {
    const cliente = (document.getElementById("inp-cliente")?.value || "").trim() || "Sin cliente";
    const fecha = (document.getElementById("inp-fecha")?.value || "").trim() || new Date().toISOString().slice(0, 10);
    return { cliente, fecha };
  }

  function fmtFechaDMY(iso) {
    if (!iso || typeof iso !== "string" || !iso.includes("-")) return iso || "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  async function createResumenPdf(mode = "costo") {
    refreshSummary();
    if (!LAST_SUMMARY.detail.length) {
      alert("No hay items para generar etiqueta.");
      return;
    }
    const { cliente, fecha } = getHeaderBaseLines();
    const fechaDMY = fmtFechaDMY(fecha);
    const css = `
      @page { size: A4; margin: 10mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body { background: #fff; font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
      .sheet {
        width: calc(210mm - 20mm);
        height: calc(297mm - 20mm);
        display: grid;
        grid-template-columns: 92mm 92mm;
        grid-auto-rows: 135.5mm;
        gap: 6mm;
        page-break-after: always;
        margin: 0 auto;
      }
      .etq {
        width: 100%; height: 100%;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 5mm;
        display: grid;
        grid-template-rows: auto auto 1fr;
        row-gap: 3mm;
      }
      .etq-hdr { border-bottom: 1px solid #e2e8f0; padding-bottom: 2mm; }
      .etq-empresa {
        color: #111518; font-weight: 900; font-size: 16px; line-height: 1.1; letter-spacing: -0.02em;
        text-align: left; margin: 0;
      }
      .datos { display: grid; gap: 2mm; }
      .item { display: grid; grid-template-columns: auto 1fr; gap: 3mm; align-items: baseline; }
      .label { color: #637a88; font-size: 11px; }
      .valor { color: #111518; font-size: 12px; font-weight: 600; }
      .foto {
        border: 2px dashed #94a3b8; background: #f8fafc;
        border-radius: 8px; width: 100%; height: 100%;
        min-height: 60mm;
        display: flex; align-items: center; justify-content: center;
        padding: 3mm;
        overflow: hidden;
      }
      .foto img { width: 100%; height: 100%; object-fit: contain; border-radius: 6px; }
      .ph { color: #94a3b8; font-size: 11px; }
      @media print { .etq { box-shadow: none; } }
    `;

    const items = LAST_SUMMARY.detail;
    const grupos = [];
    for (let i = 0; i < items.length; i += 4) grupos.push(items.slice(i, i + 4));

    let html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/>
      <title>Etiquetas 2x2</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet"/>
      <style>${css}</style></head><body>`;

    grupos.forEach((grupo) => {
      html += `<section class="sheet">`;
      grupo.forEach((it) => {
        const primerLogo = (it.logosDetalle && it.logosDetalle.length) ? it.logosDetalle[0] : null;
        const alto = primerLogo ? primerLogo.alto_mm : 0;
        const ancho = primerLogo ? primerLogo.ancho_mm : 0;
        const logoNombre = primerLogo?.foto_name || "Sin nombre";
        const fotoSrc = primerLogo?.foto_data || "";
        const totalModelo = mode === "costo" ? it.costoTotal : it.finalTotal;
        const tituloPrecio = mode === "costo" ? "Total costo" : "Total final";

        html += `
          <article class="etq">
            <header class="etq-hdr">
              <h3 class="etq-empresa">${it.empresa || "Empresa"}</h3>
            </header>
            <section class="datos">
              <div class="item"><span class="label">Fecha</span><span class="valor">${fechaDMY}</span></div>
              <div class="item"><span class="label">Cliente</span><span class="valor">${cliente}</span></div>
              <div class="item"><span class="label">Modelo de caja</span><span class="valor">${modelLabel(it.modelo)}</span></div>
              <div class="item"><span class="label">Cantidad</span><span class="valor">${it.cantidad}</span></div>
              <div class="item"><span class="label">Obs</span><span class="valor">${(it.logosDetalle || []).map(l => l.observacion).filter(Boolean).join(" | ") || "-"}</span></div>
              <div class="item"><span class="label">Alto</span><span class="valor">${alto} mm</span></div>
              <div class="item"><span class="label">Ancho</span><span class="valor">${ancho} mm</span></div>
              <div class="item"><span class="label">${tituloPrecio}</span><span class="valor">${fmtARS(totalModelo)}</span></div>
            </section>
            <section class="foto">
              ${fotoSrc ? `<img src="${fotoSrc}" alt="Referencia">` : `<span class="ph">Sin imagen de referencia</span>`}
            </section>
          </article>
        `;
      });
      html += `</section>`;
    });

    html += `</body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      alert("No se pudo abrir la ventana de impresión (revisá bloqueadores).");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  function renderPriceRows() {
    const tbody = document.getElementById("precios-modelos-rows");
    if (!tbody) return;
    const rows = Object.entries(PRICING.modelos_precio)
      .sort((a, b) => a[0].localeCompare(b[0], "es"))
      .map(([modelo, precio]) => `
        <tr data-model="${modelo}">
          <td class="px-2 py-2 text-xs">${modelLabel(modelo)}</td>
          <td class="px-2 py-2"><input type="number" min="0" step="1" class="precio-modelo w-full rounded-md border border-gray-600 bg-gray-900 px-2 h-9 text-sm" value="${parseNumber(precio)}"></td>
          <td class="px-2 py-2 text-right"><button type="button" class="btn-del-precio text-red-300 text-xs">Quitar</button></td>
        </tr>
      `).join("");

    tbody.innerHTML = rows || '<tr><td colspan="3" class="px-2 py-3 text-xs text-gray-400">Sin modelos.</td></tr>';

    tbody.querySelectorAll(".btn-del-precio").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tr = btn.closest("tr");
        const key = tr?.dataset.model || "";
        if (!key) return;
        delete PRICING.modelos_precio[key];
        renderPriceRows();
      });
    });
  }

  function applyPhotoPricingLockState() {
    const locked = !photoPricingUnlocked;
    const mm2 = document.getElementById("inp-precio-mm2");
    const area = document.getElementById("inp-area-min");
    const qr = document.getElementById("inp-factor-qr");
    const lbl = document.getElementById("lbl-foto-pricing-lock");
    if (mm2) mm2.disabled = locked;
    if (area) area.disabled = locked;
    if (qr) qr.disabled = locked;
    if (lbl) {
      lbl.textContent = locked ? "Bloqueado: precios de foto" : "Desbloqueado: precios de foto";
      lbl.className = locked ? "text-xs text-amber-300" : "text-xs text-emerald-300";
    }
  }

  function syncPriceModalFromConfig() {
    const mm2 = document.getElementById("inp-precio-mm2");
    const area = document.getElementById("inp-area-min");
    const qr = document.getElementById("inp-factor-qr");
    const margin = document.getElementById("inp-margen");
    const desc = document.getElementById("inp-desc-mas50");

    if (mm2) mm2.value = String(parseNumber(PRICING.valor_mm2));
    if (area) area.value = String(parseNumber(PRICING.area_min_mm2));
    if (qr) qr.value = String(parseNumber(PRICING.factor_qr));
    if (margin) margin.value = String(parseNumber(PRICING.margen_cliente_pct));
    if (desc) desc.value = String(parseNumber(PRICING.descuento_caja_mas_50_pct));
    applyPhotoPricingLockState();
    renderPriceRows();
  }

  function savePriceModalToConfig() {
    if (photoPricingUnlocked) {
      PRICING.valor_mm2 = parseNumber(document.getElementById("inp-precio-mm2")?.value);
      PRICING.area_min_mm2 = Math.max(0, parseNumber(document.getElementById("inp-area-min")?.value));
      PRICING.factor_qr = Math.max(0, parseNumber(document.getElementById("inp-factor-qr")?.value));
    }
    PRICING.margen_cliente_pct = parseNumber(document.getElementById("inp-margen")?.value);
    PRICING.descuento_caja_mas_50_pct = Math.max(0, parseNumber(document.getElementById("inp-desc-mas50")?.value));

    const rows = Array.from(document.querySelectorAll("#precios-modelos-rows tr[data-model]"));
    const modelos = {};
    rows.forEach((row) => {
      const key = row.dataset.model || "";
      const val = parseNumber(row.querySelector(".precio-modelo")?.value);
      if (key) modelos[key] = val;
    });
    PRICING.modelos_precio = modelos;

    savePricing(PRICING);
    refreshSummary();
  }

  function toggleModal(show) {
    const modal = document.getElementById("modal-precios");
    if (!modal) return;
    modal.classList.toggle("hidden", !show);
  }

  function setToday() {
    const inp = document.getElementById("inp-fecha");
    if (!inp) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    inp.value = now.toISOString().slice(0, 10);
  }

  function init() {
    setToday();

    const modelSelect = document.getElementById("sel-modelo");
    if (modelSelect) {
      modelSelect.innerHTML = '<option value="">Elegi un modelo...</option>' + createModelOptionsHtml();
    }

    document.getElementById("btn-add-modelo")?.addEventListener("click", () => {
      const empresa = (document.getElementById("inp-empresa")?.value || "").trim();
      const modelo = (document.getElementById("sel-modelo")?.value || "").trim();
      const cantidad = parseNumber(document.getElementById("inp-cantidad")?.value);

      if (!empresa) {
        alert("Ingresá la empresa del logo.");
        return;
      }
      if (!modelo) {
        alert("Elegí un tipo de caja.");
        return;
      }
      if (cantidad < 1) {
        alert("La cantidad debe ser mayor o igual a 1.");
        return;
      }

      addModelCard(empresa, modelo, cantidad);
      const qtyInput = document.getElementById("inp-cantidad");
      if (qtyInput) qtyInput.value = "1";
    });

    document.getElementById("btn-precios")?.addEventListener("click", () => {
      const pass = window.prompt("Ingresá contraseña de precios:");
      if (pass === null) return;
      if (pass !== PRICE_PASSWORD && pass !== PHOTO_PRICING_PASSWORD) {
        alert("Contraseña incorrecta.");
        return;
      }
      photoPricingUnlocked = (pass === PHOTO_PRICING_PASSWORD);
      syncPriceModalFromConfig();
      toggleModal(true);
    });

    document.getElementById("btn-cerrar-precios")?.addEventListener("click", () => toggleModal(false));
    document.getElementById("btn-cancelar-precios")?.addEventListener("click", () => toggleModal(false));

    document.getElementById("btn-guardar-precios")?.addEventListener("click", () => {
      savePriceModalToConfig();
      toggleModal(false);
    });

    document.getElementById("btn-add-precio-modelo")?.addEventListener("click", () => {
      const keyRaw = (document.getElementById("inp-nuevo-modelo")?.value || "").trim().toLowerCase();
      const val = parseNumber(document.getElementById("inp-nuevo-precio")?.value);
      if (!keyRaw) {
        alert("Ingresá el nombre/código del modelo.");
        return;
      }
      PRICING.modelos_precio[keyRaw] = val;
      const nModel = document.getElementById("inp-nuevo-modelo");
      const nPrice = document.getElementById("inp-nuevo-precio");
      if (nModel) nModel.value = "";
      if (nPrice) nPrice.value = "";
      renderPriceRows();
    });

    document.getElementById("btn-limpiar")?.addEventListener("click", () => {
      const list = document.getElementById("lista-modelos");
      if (list) list.innerHTML = "";
      refreshSummary();
    });

    document.getElementById("btn-pdf-costo")?.addEventListener("click", () => createResumenPdf("costo"));
    document.getElementById("btn-pdf-final")?.addEventListener("click", () => createResumenPdf("final"));

    refreshSummary();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
