let listaCursosTabla = []; 
let busquedaCursos = "";    
let modalCurso = null;       

async function iniciarCursos() {
    busquedaCursos = "";

    modalCurso = new bootstrap.Modal(document.getElementById("modalCurso"));

    document.getElementById("formCurso").addEventListener("submit", guardarCurso);
    document.getElementById("btnNuevoCurso").addEventListener("click", () => abrirFormularioCurso());
    document.getElementById("btnBuscarCurso").addEventListener("click", buscarCursos);
    document.getElementById("buscadorCursos").addEventListener("input", buscarCursos);

    document.getElementById("tablaCursos").addEventListener("click", evento => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const curso = listaCursosTabla.find(c => c.id === boton.dataset.id);
        if (!curso) return;

        if (boton.dataset.accion === "editar") abrirFormularioCurso(curso);
        if (boton.dataset.accion === "eliminar") confirmarEliminarCurso(curso);
    });

    await cargarCursos();

    if (location.hash === "#nuevo") {
        history.replaceState(null, "", location.pathname);
        abrirFormularioCurso();
    }
}

async function cargarCursos() {
    try {
        listaCursosTabla = await getCursos();
        pintarCursos();
    } catch (error) {
        console.error(error);
        document.getElementById("tablaCursos").innerHTML =
            `<tr><td colspan="7" class="text-center text-danger py-4">No se pudieron cargar los cursos</td></tr>`;
        mostrarError("No se pudo conectar con la API. Revisa tu conexión e intenta de nuevo.");
    }
}

function cursosFiltrados() {
    const texto = busquedaCursos.trim().toLowerCase();
    if (!texto) return listaCursosTabla;

    return listaCursosTabla.filter(c =>
        `${c.cnombre} ${c.codigo} ${c.docente}`.toLowerCase().includes(texto)
    );
}

function buscarCursos() {
    busquedaCursos = document.getElementById("buscadorCursos").value;
    pintarCursos();
}

function pintarCursos() {
    const filtrados = cursosFiltrados();
    const tbody = document.getElementById("tablaCursos");

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay cursos para mostrar</td></tr>`;
    } else {
        tbody.innerHTML = filtrados.map(c => `
            <tr>
                <td>${esc(c.id)}</td>
                <td class="fw-semibold">${esc(c.cnombre)}</td>
                <td>${esc(c.codigo)}</td>
                <td>${esc(c.creditos)}</td>
                <td>${esc(c.docente)}</td>
                <td>${esc(c.descripcion)}</td>
                <td class="text-nowrap">
                    <button class="btn btn-outline-secondary btn-sm" data-accion="editar" data-id="${esc(c.id)}" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" data-accion="eliminar" data-id="${esc(c.id)}" title="Eliminar">
                        <i class="bi bi-trash3"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    }

    const total = filtrados.length;
    document.getElementById("infoCursos").textContent =
        `Mostrando ${total === 0 ? 0 : 1} a ${total} de ${total} registros`;
}

function abrirFormularioCurso(curso = null) {
    const form = document.getElementById("formCurso");
    form.reset();
    form.classList.remove("was-validated");

    if (curso) {
        document.getElementById("tituloModalCurso").textContent = "Actualizar curso";
        document.getElementById("btnGuardarCurso").innerHTML = `<i class="bi bi-arrow-repeat"></i> Actualizar datos`;
        document.getElementById("cursoId").value = curso.id;
        document.getElementById("cursoIdVisible").value = curso.id;
        document.getElementById("cnombre").value = curso.cnombre;
        document.getElementById("codigo").value = curso.codigo;
        document.getElementById("creditos").value = curso.creditos;
        document.getElementById("docente").value = curso.docente;
        document.getElementById("descripcion").value = curso.descripcion;
    } else {
        document.getElementById("tituloModalCurso").textContent = "Registrar curso";
        document.getElementById("btnGuardarCurso").innerHTML = `<i class="bi bi-check-lg"></i> Guardar curso`;
        document.getElementById("cursoId").value = "";
        document.getElementById("cursoIdVisible").value = "(se genera automáticamente al guardar)";
    }

    modalCurso.show();
}

async function guardarCurso(evento) {
    evento.preventDefault();
    const form = evento.target;

    ["cnombre", "codigo", "docente", "descripcion"].forEach(campo => {
        const input = document.getElementById(campo);
        input.value = input.value.trim();
    });

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const id = document.getElementById("cursoId").value;
    const datos = {
        cnombre: document.getElementById("cnombre").value,
        codigo: document.getElementById("codigo").value,
        creditos: Number(document.getElementById("creditos").value),
        docente: document.getElementById("docente").value,
        descripcion: document.getElementById("descripcion").value
    };

    const boton = document.getElementById("btnGuardarCurso");
    boton.disabled = true;

    try {
        if (id) {
            const actualizado = await updateCurso(id, datos);
            listaCursosTabla = listaCursosTabla.map(c => c.id === id ? actualizado : c);
            mostrarAviso("success", "Curso actualizado");
        } else {
            const nuevo = await createCurso(datos);
            listaCursosTabla.push(nuevo);
            mostrarAviso("success", "Curso guardado");
        }

        modalCurso.hide();
        pintarCursos(); 
        cargarCursos();     
    } catch (error) {
        console.error(error);
        mostrarError("No se pudo guardar el curso. Intenta de nuevo.");
    } finally {
        boton.disabled = false;
    }
}

async function confirmarEliminarCurso(curso) {
    let asociados = 0;
    try {
        const estudiantes = await getEstudiantes();
        asociados = estudiantes.filter(e => String(e.idCurso) === String(curso.id)).length;
    } catch (error) {
        console.error(error);
        mostrarError("No se pudo verificar si el curso tiene estudiantes asociados.");
        return;
    }

    if (asociados > 0) {
        Swal.fire({
            icon: "error",
            title: "No se puede eliminar el curso",
            html: `«${esc(curso.cnombre)}» tiene ${asociados} estudiante${asociados === 1 ? "" : "s"} asociado${asociados === 1 ? "" : "s"}.<br>Reasigna o elimina esos estudiantes primero.`,
            confirmButtonText: "Entendido"
        });
        return;
    }

    const resultado = await Swal.fire({
        title: "¿Eliminar curso?",
        html: `Se eliminará el curso «${esc(curso.cnombre)}» (ID ${esc(curso.id)}).<br>Esta acción no se puede deshacer.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (!resultado.isConfirmed) return;

    try {
        await deleteCurso(curso.id);
        listaCursosTabla = listaCursosTabla.filter(c => c.id !== curso.id);
        pintarCursos();
        mostrarAviso("success", "Curso eliminado");
        cargarCursos();
    } catch (error) {
        console.error(error);
        mostrarError("No se pudo eliminar el curso.");
    }
}
