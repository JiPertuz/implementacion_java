async function iniciarReporte() {
    try {
        const cursos = await getCursos();
        const estudiantes = await getEstudiantes();
        pintarReporte(cursos, estudiantes);
    } catch (error) {
        console.error(error);
        document.getElementById("tablaReporte").innerHTML =
            `<tr><td colspan="7" class="text-center text-danger py-4">No se pudo generar el reporte</td></tr>`;
        mostrarError("No se pudo conectar con la API para armar el reporte.");
    }
}

function promedio(lista) {
    if (lista.length === 0) return 0;
    const suma = lista.reduce((total, e) => total + Number(e.edad), 0);
    return suma / lista.length;
}

function pintarReporte(cursos, estudiantes) {
    const total = estudiantes.length;
    const promedioGlobal = promedio(estudiantes);

    const filas = cursos.map(curso => {
        const suyos = estudiantes.filter(e => String(e.idCurso) === String(curso.id));
        return {
            curso: curso,
            cantidad: suyos.length,
            porcentaje: total === 0 ? 0 : Math.round((suyos.length / total) * 100),
            edadProm: promedio(suyos)
        };
    });

    document.getElementById("totalEstudiantes").textContent = total;
    document.getElementById("totalCursos").textContent = cursos.length;
    document.getElementById("edadGlobal").textContent = promedioGlobal.toFixed(1);

    const tbody = document.getElementById("tablaReporte");

    if (filas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Todavía no hay cursos registrados</td></tr>`;
    } else {
        tbody.innerHTML = filas.map(f => `
            <tr>
                <td class="fw-semibold">${esc(f.curso.cnombre)}</td>
                <td>${esc(f.curso.codigo)}</td>
                <td>${esc(f.curso.docente)}</td>
                <td>${esc(f.curso.creditos)}</td>
                <td class="fw-semibold">${f.cantidad}</td>
                <td>
                    <div class="distribucion">
                        <div class="barra"><div style="width: ${f.porcentaje}%"></div></div>
                        <span>${f.porcentaje}%</span>
                    </div>
                </td>
                <td>${f.cantidad === 0 ? "—" : f.edadProm.toFixed(1) + " años"}</td>
            </tr>
        `).join("");
    }

    document.getElementById("globalEstudiantes").textContent = total;
    document.getElementById("globalBarra").style.width = total === 0 ? "0%" : "100%";
    document.getElementById("globalPorcentaje").textContent = total === 0 ? "0%" : "100%";
    document.getElementById("globalEdad").textContent =
        total === 0 ? "—" : promedioGlobal.toFixed(1) + " años";

    document.getElementById("notaTotal").textContent =
        `La distribución se calcula sobre ${total} estudiantes. El consolidado global corresponde al total de estudiantes y su edad promedio.`;
}
