import { db, auth } from "../firebase.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let idEdicao = null;

const modal = document.getElementById("modalInteracao");
const btnNova = document.getElementById("btnNovaInteracao");
const btnCancelar = document.getElementById("cancelarInteracao");
const btnSalvar = document.getElementById("salvarInteracao");

const inputCliente = document.getElementById("intCliente");
const inputOportunidade = document.getElementById("intOportunidade");
const inputTipo = document.getElementById("intTipo");
const inputDesc = document.getElementById("intDesc");
const inputProx = document.getElementById("intProx");

const tabela = document.querySelector("#tabelaInteracoes tbody");
const searchCliente = document.getElementById("searchCliente");

onSnapshot(collection(db, "clientes"), snapshot => {
    inputCliente.innerHTML = "";

    snapshot.forEach(docSnap => {
        const c = docSnap.data();
        inputCliente.innerHTML += `<option value="${docSnap.id}">${c.nome}</option>`;
    });
});

onSnapshot(collection(db, "oportunidades"), snapshot => {
    inputOportunidade.innerHTML = `<option value="">Nenhuma</option>`;

    snapshot.forEach(docSnap => {
        const op = docSnap.data();

        inputOportunidade.innerHTML += `
            <option value="${docSnap.id}">
                ${op.nome} — ${op.clienteNome}
            </option>`;
    });
});

btnNova.addEventListener("click", () => {
    idEdicao = null;

    document.getElementById("tituloModal").innerText = "Nova Interação";

    inputCliente.value = "";
    inputOportunidade.value = "";
    inputTipo.value = "Ligação";
    inputDesc.value = "";
    inputProx.value = "";

    modal.classList.remove("hidden");
});

btnCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
});

btnSalvar.addEventListener("click", async () => {

    const clienteId = inputCliente.value;
    const cliSnap = await getDoc(doc(db, "clientes", clienteId));
    const clienteNome = cliSnap.exists() ? cliSnap.data().nome : "";

    const oportunidadeId = inputOportunidade.value || null;
    let oportunidadeNome = "";

    if (oportunidadeId) {
        const opSnap = await getDoc(doc(db, "oportunidades", oportunidadeId));
        if (opSnap.exists()) oportunidadeNome = opSnap.data().nome;
    }

    const data = {
        clienteId,
        clienteNome,
        oportunidadeId,
        oportunidadeNome,
        tipo: inputTipo.value,
        descricao: inputDesc.value,
        proximaAcao: inputProx.value || "",
        data: new Date(),
        criadoPor: auth.currentUser.uid
    };

    if (idEdicao) {
        await updateDoc(doc(db, "interacoes", idEdicao), data);
    } else {
        await addDoc(collection(db, "interacoes"), data);
    }

    modal.classList.add("hidden");
});

onSnapshot(
    query(collection(db, "interacoes")),
    snapshot => {

        tabela.innerHTML = "";

        snapshot.forEach(docSnap => {
            const inter = docSnap.data();

            const desc = inter.descricao || "";

            const dt = inter.data?.toDate
                ? inter.data.toDate().toLocaleString("pt-BR")
                : "-";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td title="${inter.clienteNome}">${inter.clienteNome}</td>
                <td>${inter.tipo}</td>
                <td>${desc.slice(0, 40)}${desc.length > 40 ? "..." : ""}</td>
                <td>${dt}</td>
                <td>
                    <button class="action edit" data-id="${docSnap.id}">Ver</button>
                    <button class="action delete" data-del="${docSnap.id}">Excluir</button>
                </td>
            `;

            tabela.appendChild(row);
        });

        aplicarFiltro();
    }
);

tabela.addEventListener("click", async (e) => {

    if (e.target.classList.contains("edit")) {

        const id = e.target.getAttribute("data-id");
        idEdicao = id;

        const snap = await getDoc(doc(db, "interacoes", id));
        if (!snap.exists()) return;

        const inter = snap.data();

        document.getElementById("tituloModal").innerText = "Editar Interação";

        inputCliente.value = inter.clienteId;
        inputOportunidade.value = inter.oportunidadeId || "";
        inputTipo.value = inter.tipo;
        inputDesc.value = inter.descricao;
        inputProx.value = inter.proximaAcao || "";

        modal.classList.remove("hidden");
    }

    if (e.target.classList.contains("delete")) {
        const id = e.target.getAttribute("data-del");

        if (confirm("Excluir esta interação?")) {
            await deleteDoc(doc(db, "interacoes", id));
        }
    }
});

function aplicarFiltro() {
    const q = searchCliente.value.trim().toLowerCase();

    tabela.querySelectorAll("tr").forEach(tr => {
        const cliente = tr.children[0]?.textContent.toLowerCase() || "";
        tr.style.display = cliente.includes(q) ? "" : "none";
    });
}

searchCliente.addEventListener("input", aplicarFiltro);
