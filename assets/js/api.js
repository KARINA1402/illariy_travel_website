/**
 * api.js — IGUAZÚ Tours Express
 * Consume /api/Paquete y renderiza las tarjetas en destinos.html
 *
 * NOTA: Ajusta los nombres de campo al JSON real que devuelve tu PaqueteModel.
 * Por defecto .NET Core serializa en camelCase, ej: iD_Paquete → iD_Paquete
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'https://localhost:7047/api';
  const grid = document.getElementById('paquetes-grid');
  const searchInput = document.getElementById('search-input');
  const filterTipo = document.getElementById('filter-tipo');
  const filterSort = document.getElementById('filter-sort');
  const filterDuracion = document.getElementById('filter-duracion');
  const contadorEl = document.getElementById('paquetes-count');
  const skeletonEl = document.getElementById('paquetes-skeleton');

  let todosLosPaquetes = [];

  // ─── CARGA INICIAL ────────────────────────────────────────────────────────
  fetch(`${API_BASE}/Paquete`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(paquetes => {
      todosLosPaquetes = paquetes;
      ocultarSkeleton();
      renderPaquetes(todosLosPaquetes);
      poblarFiltros(todosLosPaquetes);
    })
    .catch(err => {
      console.error('Error al cargar paquetes:', err);
      ocultarSkeleton();
      grid.innerHTML = `
        <div class="col-span-full text-center py-20 text-gray-500">
          <i class="fas fa-exclamation-triangle text-4xl mb-4 text-yellow-400"></i>
          <p class="font-semibold text-lg">No se pudieron cargar los paquetes</p>
          <p class="text-sm mt-1">Verifica que el servidor esté en ejecución en ${API_BASE}</p>
        </div>
      `;
    });

  // ─── RENDER DE TARJETAS ───────────────────────────────────────────────────
  function renderPaquetes(lista) {
    grid.innerHTML = '';

    if (lista.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16 text-gray-500">
          <i class="fas fa-search text-4xl mb-3 text-gray-300"></i>
          <p class="font-semibold">Sin resultados para tu búsqueda</p>
          <p class="text-sm mt-1">Intenta con otros filtros</p>
        </div>
      `;
      if (contadorEl) contadorEl.innerText = '0 paquetes';
      return;
    }

    if (contadorEl) contadorEl.innerText = `${lista.length} paquete${lista.length > 1 ? 's' : ''}`;

    lista.forEach(pkg => {
      // ── Normaliza nombres de campo (acepta camelCase y PascalCase) ──
      const id         = pkg.iD_Paquete  || pkg.ID_Paquete  || pkg.id       || 0;
      const nombre     = pkg.nombre      || pkg.Nombre      || 'Sin nombre';
      const descripcion= pkg.descripcion || pkg.Descripcion || '';
      const precio     = parseFloat(pkg.precio || pkg.Precio || 0);
      const duracion   = pkg.duracion    || pkg.Duracion    || '';
      const destinos   = pkg.destinos    || pkg.Destinos    || '';
      const imagen     = pkg.imagen      || pkg.Imagen      || 'assets/img/viaje.jpeg';
      const tipo       = pkg.tipo        || pkg.Tipo        || 'Tour';
      const disponib   = pkg.disponibilidad || pkg.Disponibilidad || 'Diario';

      // Badge color por tipo
      const tipoBadge = {
        'Aventura': 'bg-orange-500',
        'Cultural': 'bg-purple-500',
        'Naturaleza': 'bg-green-500',
        'Relax': 'bg-blue-400',
        'Tour': 'bg-green-600',
      };
      const badgeColor = tipoBadge[tipo] || 'bg-green-600';

      const card = document.createElement('div');
      card.className = 'grupo-card bg-white dark:bg-zinc-800 rounded-2xl shadow-md overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100 dark:border-zinc-700';
      card.dataset.nombre = nombre.toLowerCase();
      card.dataset.tipo = tipo.toLowerCase();
      card.dataset.precio = precio;
      card.dataset.duracion = duracion;

      card.innerHTML = `
        <div class="relative overflow-hidden h-52">
          <img src="${imagen}" alt="${nombre}"
               class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
               onerror="this.src='assets/img/viaje.jpeg'">
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <span class="absolute top-3 left-3 ${badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            ${tipo}
          </span>
          <span class="absolute top-3 right-3 bg-white/90 dark:bg-zinc-800/90 text-green-700 text-sm font-extrabold px-3 py-1 rounded-full">
            S/ ${precio.toFixed(2)}
          </span>
        </div>

        <div class="p-5 flex flex-col flex-grow">
          <h2 class="text-lg font-bold mb-1 text-zinc-800 dark:text-white leading-tight">${nombre}</h2>
          ${destinos ? `<p class="text-xs text-green-600 font-medium mb-2"><i class="fas fa-map-marker-alt mr-1"></i>${destinos}</p>` : ''}
          <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-grow">${descripcion}</p>

          <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
            ${duracion ? `<span><i class="fas fa-clock text-green-500 mr-1"></i>${duracion}</span>` : ''}
            <span><i class="fas fa-calendar-check text-green-500 mr-1"></i>${disponib}</span>
          </div>

          <div class="flex items-center justify-between gap-2 mt-auto">
            <div>
              <p class="text-xs text-gray-400">Precio por persona</p>
              <p class="text-xl font-black text-green-600">S/ ${precio.toFixed(2)}</p>
            </div>
            <a href="destino-single.html?iD_Paquete=${id}"
               class="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 text-sm">
              <i class="fas fa-shopping-cart"></i> Reservar
            </a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // ─── POBLAR FILTRO DE TIPOS DINÁMICAMENTE ────────────────────────────────
  function poblarFiltros(paquetes) {
    if (!filterTipo) return;
    const tipos = [...new Set(paquetes.map(p => p.tipo || p.Tipo).filter(Boolean))];
    tipos.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.toLowerCase();
      opt.innerText = t;
      filterTipo.appendChild(opt);
    });
  }

  // ─── APLICAR FILTROS ──────────────────────────────────────────────────────
  function aplicarFiltros() {
    const textoBusqueda = searchInput?.value?.toLowerCase().trim() || '';
    const tipoSelec     = filterTipo?.value     || 'todos';
    const sortSelec     = filterSort?.value     || 'default';
    const durSelec      = filterDuracion?.value || 'todos';

    let resultado = todosLosPaquetes.filter(p => {
      const nombre    = (p.nombre || p.Nombre || '').toLowerCase();
      const destinos  = (p.destinos || p.Destinos || '').toLowerCase();
      const tipo      = (p.tipo || p.Tipo || '').toLowerCase();
      const duracion  = (p.duracion || p.Duracion || '').toLowerCase();

      const matchSearch = !textoBusqueda || nombre.includes(textoBusqueda) || destinos.includes(textoBusqueda);
      const matchTipo   = tipoSelec === 'todos' || tipo === tipoSelec;
      const matchDur    = durSelec === 'todos' ||
                          (durSelec === 'medio-dia' && (duracion.includes('h') && !duracion.includes('d'))) ||
                          (durSelec === '1-dia'     && duracion.includes('1 d')) ||
                          (durSelec === 'varios'    && /[2-9]\s*d/.test(duracion));
      return matchSearch && matchTipo && matchDur;
    });

    // Ordenamiento
    switch (sortSelec) {
      case 'precio-asc':  resultado.sort((a,b) => parseFloat(a.precio||0) - parseFloat(b.precio||0)); break;
      case 'precio-desc': resultado.sort((a,b) => parseFloat(b.precio||0) - parseFloat(a.precio||0)); break;
      case 'nombre-asc':  resultado.sort((a,b) => (a.nombre||'').localeCompare(b.nombre||'')); break;
      case 'nombre-desc': resultado.sort((a,b) => (b.nombre||'').localeCompare(a.nombre||'')); break;
    }

    renderPaquetes(resultado);
  }

  // ─── EVENTOS ──────────────────────────────────────────────────────────────
  searchInput?.addEventListener('input', aplicarFiltros);
  filterTipo?.addEventListener('change', aplicarFiltros);
  filterSort?.addEventListener('change', aplicarFiltros);
  filterDuracion?.addEventListener('change', aplicarFiltros);

  // ─── SKELETON ─────────────────────────────────────────────────────────────
  function ocultarSkeleton() {
    if (skeletonEl) skeletonEl.style.display = 'none';
    if (grid) grid.style.display = 'grid';
  }
});