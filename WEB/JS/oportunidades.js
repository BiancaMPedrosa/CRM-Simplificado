import { db, auth } from "../firebase.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let idEdicao = null;

const modal = document.getElementById("modalOportunidade");
const btnNova = document.getElementById("btnNovaOportunidade");
const btnCancelar = document.getElementById("cancelarOportunidade");
const btnSalvar = document.getElementById("salvarOportunidade");
const searchInput = document.getElementById("searchOportunidade");

const inputNome = document.getElementById("opNome");
const inputCliente = document.getElementById("opCliente");
const inputValor = document.getElementById("opValor");
const inputEtapa = document.getElementById("opEtapa");
const inputAnot = document.getElementById("opAnotacoes");

onSnapshot(collection(db, "clientes"), snapshot => {
    inputCliente.innerHTML = "";
    snapshot.forEach(docSnap => {
        const c = docSnap.data();
        inputCliente.innerHTML += `<option value="${docSnap.id}">${c.nome}</option>`;
    });
});

btnNova.addEventListener("click", () => {
    idEdicao = null;
    document.getElementById("tituloModal").innerText = "Nova Oportunidade";
    modal.classList.remove("hidden");

    inputNome.value = "";
    inputValor.value = "";
    inputEtapa.value = "Contato";
    inputAnot.value = "";
    
});

btnCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
});

btnSalvar.addEventListener("click", async () => {
    const nome = inputNome.value.trim();
    const clienteId = inputCliente.value;
    const valorRaw = (inputValor.value || "").toString().trim();
    const etapa = inputEtapa.value;

    if (!nome) {
        alert("Preencha o nome da oportunidade.");
        inputNome.focus();
        return;
    }

    if (!clienteId) {
        alert("Selecione um cliente.");
        inputCliente.focus();
        return;
    }

    if (!valorRaw) {
        alert("Preencha o valor da oportunidade.");
        inputValor.focus();
        return;
    }

    const valor = Number(valorRaw.replace(",", "."));
    if (Number.isNaN(valor)) {
        alert("Valor inválido. Use apenas números (ex: 1000.50).");
        inputValor.focus();
        return;
    }

    if (!etapa) {
        alert("Selecione a etapa da oportunidade.");
        inputEtapa.focus();
        return;
    }

    try {
        const clienteDoc = await getDoc(doc(db, "clientes", clienteId));
        const clienteNome = clienteDoc.exists() ? clienteDoc.data().nome : "";

        const data = {
            nome,
            clienteId,
            clienteNome,
            valor,
            etapa,
            anotacoes: inputAnot.value || "",
            criadoPor: auth.currentUser?.uid
        };

        if (idEdicao) {
            await updateDoc(doc(db, "oportunidades", idEdicao), data);
        } else {
            data.criadoEm = new Date();
            await addDoc(collection(db, "oportunidades"), data);
        }

        modal.classList.add("hidden");
    } catch (err) {
        console.error("Erro ao salvar oportunidade:", err);
        if (err && err.code === "permission-denied") {
            alert("Permissão negada. Faça login novamente.");
            auth.signOut?.().catch(()=>{}).finally(()=> window.location.replace("login.html"));
            return;
        }
        alert("Erro ao salvar. Veja o console para mais detalhes.");
    }
});

const tabela = document.querySelector("#tabelaOportunidades tbody");

onSnapshot(collection(db, "oportunidades"), snapshot => {
    if (!tabela) return;
    tabela.innerHTML = "";

    snapshot.forEach(docSnap => {
        const op = docSnap.data();

        const valorNum = (typeof op.valor === "number") ? op.valor : (Number(op.valor) || 0);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${op.nome}</td>
            <td>${op.clienteNome}</td>
            <td>R$${valorNum.toFixed(2)}</td>
            <td>${op.etapa}</td>
            <td>
                <button class="action edit" data-id="${docSnap.id}">Editar</button>
                <button class="action delete" data-id="${docSnap.id}">Excluir</button>
            </td>
        `;

        tabela.appendChild(row);
    });
});

tabela.addEventListener("click", async (e) => {
    const target = e.target;

    if (target.classList.contains("edit")) {
        const id = target.getAttribute("data-id");
        const snap = await getDoc(doc(db, "oportunidades", id));

        if (!snap.exists()) return;

        const op = snap.data();

        idEdicao = id;

        document.getElementById("tituloModal").innerText = "Editar Oportunidade";

        inputNome.value = op.nome;
        inputCliente.value = op.clienteId;
        inputValor.value = op.valor ?? "";
        inputEtapa.value = op.etapa;
        inputAnot.value = op.anotacoes || "";

        modal.classList.remove("hidden");
        return;
    }

    if (target.classList.contains("delete")) {
        const id = target.getAttribute("data-id");

        if (!confirm("Deseja excluir esta oportunidade?")) return;

        if (!auth.currentUser) {
            alert("Usuário não autenticado. Faça login novamente.");
            window.location.replace("login.html");
            return;
        }

        try {
            await deleteDoc(doc(db, "oportunidades", id));
        } catch (err) {
            console.error("Erro ao excluir oportunidade:", err);
            if (err && err.code === "permission-denied") {
                alert("Permissão negada. Faça login novamente.");
                auth.signOut?.().catch(()=>{}).finally(()=> window.location.replace("login.html"));
                return;
            }
            alert("Erro ao excluir. Veja o console para mais detalhes.");
        }
    }
});


searchInput.addEventListener("input", () => {
    const termo = searchInput.value.toLowerCase();

    tabela.querySelectorAll("tr").forEach(tr => {
        const nome = tr.querySelector("td").textContent.toLowerCase();
        tr.style.display = nome.includes(termo) ? "" : "none";
    });
});
