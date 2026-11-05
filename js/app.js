const API_URL = "https://69f225e3b15130b973529e63.mockapi.io/v1";
async function peticion(ruta, opciones = {}) {
    const respuesta = await fetch(`${API_URL}/${ruta}`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        ...opciones
    });

    if (!respuesta.ok) {
        throw new Error(`Error ${respuesta.status} en /${ruta}`);
    }
    return respuesta.json();
}
async function listar(ruta) {
    try {
        return await peticion(ruta);
    } catch (error) {
        if (error.message.startsWith("Error 404")) return [];
        throw error;
    }
}

function getEstudiantes() {
    return listar("estudiantes");
}

function createEstudiante(datos) {
    return peticion("estudiantes", { method: "POST", body: JSON.stringify(datos) });
}

function updateEstudiante(id, datos) {
    return peticion(`estudiantes/${id}`, { method: "PUT", body: JSON.stringify(datos) });
}

function deleteEstudiante(id) {
    return peticion(`estudiantes/${id}`, { method: "DELETE" });
}

// --- Cursos ---
function getCursos() {
    return listar("cursos");
}

function createCurso(datos) {
    return peticion("cursos", { method: "POST", body: JSON.stringify(datos) });
}

function updateCurso(id, datos) {
    return peticion(`cursos/${id}`, { method: "PUT", body: JSON.stringify(datos) });
}

function deleteCurso(id) {
    return peticion(`cursos/${id}`, { method: "DELETE" });
}

function mostrarAviso(icono, texto) {
    Swal.fire({
        toast: true,
        position: "top-end",
        icon: icono,
        title: texto,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
    });
}

function mostrarError(texto) {
    Swal.fire({
        icon: "error",
        title: "Ocurrió un problema",
        text: texto,
        confirmButtonText: "Entendido"
    });
}

function esc(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatearFecha(iso) {
    const fecha = new Date(iso);
    if (isNaN(fecha)) return "—";
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}/${fecha.getFullYear()}`;
}

function marcarMenu() {
    const archivo = location.pathname.split("/").pop() || "index.html.html";

    document.querySelectorAll("a[data-nav]").forEach(enlace => {
        const href = enlace.getAttribute("href");
        const esDeEstaPagina = href.split("#")[0] === archivo;
        const esAtajoNuevo = href.includes("#"); // los de "Registrar..." no se marcan
        enlace.classList.toggle("activo", esDeEstaPagina && !esAtajoNuevo);
    });
}
function iniciarPagina() {
    marcarMenu();

    const pagina = document.body.dataset.pagina;
    if (pagina === "estudiantes") iniciarEstudiantes();
    if (pagina === "cursos") iniciarCursos();
    if (pagina === "reporte") iniciarReporte();
}
async function irA(url, guardarHistorial = true) {
    try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("No se pudo cargar la página");

        const texto = await respuesta.text();
        const doc = new DOMParser().parseFromString(texto, "text/html");

        document.getElementById("contenido").innerHTML = doc.getElementById("contenido").innerHTML;
        document.title = doc.title;
        document.body.dataset.pagina = doc.body.dataset.pagina;

        if (guardarHistorial) history.pushState({}, "", url);
        iniciarPagina();
    } catch (error) {
        window.location.href = url;
    }
}

document.addEventListener("click", evento => {
    const enlace = evento.target.closest("a[data-nav]");
    if (!enlace) return;
    evento.preventDefault();
    irA(enlace.getAttribute("href"));
});

window.addEventListener("popstate", () => irA(location.href, false));

document.addEventListener("DOMContentLoaded", iniciarPagina);