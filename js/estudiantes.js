
let listaEstudiantes = [];
let listaCursos = [];
let textoBusqueda = "";
let paginaActual = 1;
const POR_PAGINA = 10;
let modalEstudiante = null;

async function iniciarEstudiantes() {
    textoBusqueda = "";
    paginaActual = 1;

    modalEstudiante = new bootstrap.Modal(document.getElementById("modalEstudiante"));

    document.getElementById("formEstudiante").addEventListener("submit", guardarEstudiante);
    document.getElementById("btnNuevoEstudiante").addEventListener("click", () => abrirFormulario());
    document.getElementById("btnBuscar").addEventListener("click", buscarEstudiantes);
    document.getElementById("buscador").addEventListener("input", buscarEstudiantes);

    document.getElementById("tablaEstudiantes").addEventListener("click", evento => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const estudiante = listaEstudiantes.find(e => e.id === boton.dataset.id);
        if (!estudiante) return;

        if (boton.dataset.accion === "editar") abrirFormulario(estudiante);
        if (boton.dataset.accion === "eliminar") confirmarEliminar(estudiante);
    });

    document.getElementById("paginacion").addEventListener("click", evento => {
        const enlace = evento.target.closest("a[data-pagina]");
        if (!enlace) return;
        evento.preventDefault();
        paginaActual = Number(enlace.dataset.pagina);
        pintarTabla();
    });

    await cargarEstudiantes();

    if (location.hash === "#nuevo") {
        history.replaceState(null, "", location.pathname);
        abrirFormulario();
    }
}

async function cargarEstudiantes() {
    try {
        listaEstudiantes = await getEstudiantes();
        listaCursos = await getCursos();
        ordenarEstudiantes();
        pintarTabla();
    } catch (error) {
        console.error(error);
        document.getElementById("tablaEstudiantes").innerHTML =
            `<tr><td colspan="9" class="text-center text-danger py-4">No se pudieron cargar los estudiantes</td></tr>`;
        mostrarError("No se pudo conectar con la API. Revisa tu conexión e intenta de nuevo.");
    }
}

function ordenarEstudiantes() {
    listaEstudiantes.sort((a, b) => (Date.parse(b.creado_a) || 0) - (Date.parse(a.creado_a) || 0));
}

function nombreDelCurso(idCurso) {
    const curso = listaCursos.find(c => String(c.id) === String(idCurso));
    return curso ? curso.cnombre : "Sin curso";
}

function estudiantesFiltrados() {
    const texto = textoBusqueda.trim().toLowerCase();
    if (!texto) return listaEstudiantes;

    return listaEstudiantes.filter(e =>
        `${e.nombres} ${e.apellidos} ${e.email}`.toLowerCase().includes(texto)
    );
}

function buscarEstudiantes() {
    textoBusqueda = document.getElementById("buscador").value;
    paginaActual = 1;
    pintarTabla();
}

function pintarTabla() {
    const filtrados = estudiantesFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * POR_PAGINA;
    const visibles = filtrados.slice(inicio, inicio + POR_PAGINA);
    const tbody = document.getElementById("tablaEstudiantes");

    if (visibles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No hay estudiantes para mostrar</td></tr>`;
    } else {
        tbody.innerHTML = visibles.map(e => `
            <tr>
                <td>${esc(e.id)}</td>
                <td>${esc(e.nombres)}</td>
                <td>${esc(e.apellidos)}</td>
                <td>${esc(e.email)}</td>
                <td>${esc(e.edad)}</td>
                <td>${esc(e.programa)}</td>
                <td>${esc(nombreDelCurso(e.idCurso))}</td>
                <td>${formatearFecha(e.creado_a)}</td>
                <td class="text-nowrap">
                    <button class="btn btn-outline-secondary btn-sm" data-accion="editar" data-id="${esc(e.id)}" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" data-accion="eliminar" data-id="${esc(e.id)}" title="Eliminar">
                        <i class="bi bi-trash3"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    }

    const desde = filtrados.length === 0 ? 0 : inicio + 1;
    const hasta = inicio + visibles.length;
    document.getElementById("infoRegistros").textContent =
        `Mostrando ${desde} a ${hasta} de ${filtrados.length} registros`;

    pintarPaginacion(totalPaginas);
}

function pintarPaginacion(totalPaginas) {
    let html = `<li class="page-item ${paginaActual === 1 ? "disabled" : ""}">
                    <a class="page-link" href="#" data-pagina="${paginaActual - 1}">«</a></li>`;

    for (let i = 1; i <= totalPaginas; i++) {
        html += `<li class="page-item ${i === paginaActual ? "active" : ""}">
                    <a class="page-link" href="#" data-pagina="${i}">${i}</a></li>`;
    }

    html += `<li class="page-item ${paginaActual === totalPaginas ? "disabled" : ""}">
                <a class="page-link" href="#" data-pagina="${paginaActual + 1}">»</a></li>`;

    document.getElementById("paginacion").innerHTML = html;
}
function abrirFormulario(estudiante = null) {
    const form = document.getElementById("formEstudiante");
    form.reset();
    form.classList.remove("was-validated");

    const select = document.getElementById("idCurso");
    select.innerHTML = `<option value="">Seleccione un curso...</option>` +
        listaCursos.map(c => `<option value="${esc(c.id)}">${esc(c.cnombre)}</option>`).join("");

    if (estudiante) {
        document.getElementById("tituloModalEstudiante").textContent = "Actualizar estudiante";
        document.getElementById("btnGuardarEstudiante").innerHTML = `<i class="bi bi-arrow-repeat"></i> Actualizar datos`;
        document.getElementById("estudianteId").value = estudiante.id;
        document.getElementById("idVisible").value = estudiante.id;
        document.getElementById("nombres").value = estudiante.nombres;
        document.getElementById("apellidos").value = estudiante.apellidos;
        document.getElementById("email").value = estudiante.email;
        document.getElementById("edad").value = estudiante.edad;
        document.getElementById("programa").value = estudiante.programa;
        select.value = estudiante.idCurso;
    } else {
        document.getElementById("tituloModalEstudiante").textContent = "Registrar estudiante";
        document.getElementById("btnGuardarEstudiante").innerHTML = `<i class="bi bi-check-lg"></i> Guardar estudiante`;
        document.getElementById("estudianteId").value = "";
        document.getElementById("idVisible").value = "(se genera automáticamente al guardar)";
    }

    modalEstudiante.show();
}
async function guardarEstudiante(evento) {
    evento.preventDefault();
    const form = evento.target;

    ["nombres", "apellidos", "email", "programa"].forEach(campo => {
        const input = document.getElementById(campo);
        input.value = input.value.trim();
    });

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const id = document.getElementById("estudianteId").value;
    const datos = {
        nombres: document.getElementById("nombres").value,
        apellidos: document.getElementById("apellidos").value,
        email: document.getElementById("email").value,
        edad: Number(document.getElementById("edad").value),
        programa: document.getElementById("programa").value,
        idCurso: document.getElementById("idCurso").value
    };

    const boton = document.getElementById("btnGuardarEstudiante");
    boton.disabled = true;

    try {
        if (id) {
            const original = listaEstudiantes.find(e => e.id === id);
            datos.creado_a = original ? original.creado_a : new Date().toISOString();

            const actualizado = await updateEstudiante(id, datos);
            listaEstudiantes = listaEstudiantes.map(e => e.id === id ? actualizado : e);
            mostrarAviso("success", "Estudiante actualizado");
        } else {
            datos.creado_a = new Date().toISOString();

            const nuevo = await createEstudiante(datos);
            listaEstudiantes.push(nuevo);
            paginaActual = 1;
            mostrarAviso("success", "Estudiante guardado");
        }

        modalEstudiante.hide();
        ordenarEstudiantes();
        pintarTabla();
        cargarEstudiantes();
    } catch (error) {
        console.error(error);
        mostrarError("No se pudo guardar el estudiante. Intenta de nuevo.");
    } finally {
        boton.disabled = false;
    }
}

async function confirmarEliminar(estudiante) {
    const resultado = await Swal.fire({
        title: "¿Eliminar estudiante?",
        html: `Se eliminará a ${esc(estudiante.nombres)} ${esc(estudiante.apellidos)} (ID ${esc(estudiante.id)}).<br>Esta acción no se puede deshacer.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (!resultado.isConfirmed) return;

    try {
        await deleteEstudiante(estudiante.id);
        listaEstudiantes = listaEstudiantes.filter(e => e.id !== estudiante.id);
        pintarTabla();
        mostrarAviso("success", "Estudiante eliminado");
        cargarEstudiantes();
    } catch (error) {
        console.error(error);
        mostrarError("No se pudo eliminar el estudiante.");
    }
}
