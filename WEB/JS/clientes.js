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

// ELEMENTOS
const modal = document.getElementById("modalCliente");
const btnNovoCliente = document.getElementById("btnNovoCliente");
const btnCancelar = document.getElementById("cancelarCliente");
const btnSalvar = document.getElementById("salvarCliente");
const tabela = document.querySelector("#listaClientes");
const searchInput = document.getElementById("searchNome");

// CAMPOS DO MODAL
const campoNome = document.getElementById("clienteNome");
const campoEmpresa = document.getElementById("clienteEmpresa");
const campoEmail = document.getElementById("clienteEmail");
const campoTelefone = document.getElementById("clienteTelefone");
const campoCategoria = document.getElementById("clienteCategoria");
const campoAnotacoes = document.getElementById("clienteAnotacoes");

// ----------------------------
//  ABRIR MODAL
// ----------------------------

btnNovoCliente.addEventListener("click", () => {
    idEdicao = null;

    document.getElementById("tituloModal").innerText = "Novo Cliente";

    // limpa campos
    campoNome.value = "";
    campoEmpresa.value = "";
    campoEmail.value = "";
    campoTelefone.value = "";
    campoCategoria.value = "lead";
    campoAnotacoes.value = "";

    modal.classList.remove("hidden");
});

// ----------------------------
//  CANCELAR / FECHAR MODAL
// ----------------------------

btnCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
});

// ----------------------------
//  SALVAR (CRIAR OU EDITAR)
// ----------------------------

btnSalvar.addEventListener("click", async () => {

    const data = {
        nome: campoNome.value,
        empresa: campoEmpresa.value,
        email: campoEmail.value,
        telefone: campoTelefone.value,
        categoria: campoCategoria.value,
        anotacoes: campoAnotacoes.value,
    };

    if (idEdicao) {
        await updateDoc(doc(db, "clientes", idEdicao), data);
    } else {
        data.criadoEm = new Date();
        data.criadoPor = auth.currentUser.uid;

        await addDoc(collection(db, "clientes"), data);
    }

    modal.classList.add("hidden");
});

// ----------------------------
//  LISTAR CLIENTES EM TEMPO REAL
// ----------------------------

onAuthStateChanged(auth, (user) => {
    // se não estiver logado, manda para login e não conecta ao Firestore
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    // usuário autenticado -> conecta o onSnapshot
    const unsubscribe = onSnapshot(collection(db, "clientes"),
        (snapshot) => {
            tabela.innerHTML = "";

            snapshot.forEach(docSnap => {
                const cli = docSnap.data();

                tabela.innerHTML += `
                    <tr>
                        <td>${cli.nome}</td>
                        <td>${cli.empresa}</td>
                        <td>${cli.email}</td>
                        <td>${cli.telefone}</td>
                        <td>
                            <button class="action edit" data-id="${docSnap.id}">Editar</button>
                            <button class="action delete" data-id="${docSnap.id}">Excluir</button>
                        </td>
                    </tr>
                `;
            });
        },
        (error) => {
            console.error("Erro no listener de clientes:", error);
            if (error && error.code === "permission-denied") {
                // possível sessão inválida / regras do Firestore
                alert("Permissão negada. Faça login novamente.");
                auth.signOut().catch(()=>{}).finally(()=> window.location.replace("login.html"));
            }
        }
    );

    // opcional: se quiser cancelar o listener quando o usuário fizer sign-out
    // onAuthStateChanged irá chamar novamente com user=null e você pode usar unsubscribe() se necessário.
});

// ----------------------------
//  EVENT DELEGATION para Editar/Excluir
// ----------------------------

tabela.addEventListener("click", (e) => {
    const btn = e.target;

    if (btn.classList.contains("edit")) {
        editar(btn.dataset.id);
    }

    if (btn.classList.contains("delete")) {
        excluir(btn.dataset.id);
    }
});

// ----------------------------
//  EDITAR CLIENTE
// ----------------------------

async function editar(id) {
    idEdicao = id;

    const ref = doc(db, "clientes", id);
    const snap = await getDoc(ref);
    const cli = snap.data();

    document.getElementById("tituloModal").innerText = "Editar Cliente";

    campoNome.value = cli.nome;
    campoEmpresa.value = cli.empresa;
    campoEmail.value = cli.email;
    campoTelefone.value = cli.telefone;
    campoCategoria.value = cli.categoria || "lead";
    campoAnotacoes.value = cli.anotacoes || "";

    modal.classList.remove("hidden");
}

// ----------------------------
//  EXCLUIR CLIENTE
// ----------------------------

async function excluir(id) {
    if (confirm("Deseja excluir este cliente?")) {
        await deleteDoc(doc(db, "clientes", id));
    }
}

// ----------------------------
//  FILTRO DE BUSCA
// ----------------------------

searchInput.addEventListener("input", () => {
    const termo = searchInput.value.toLowerCase();

    tabela.querySelectorAll("tr").forEach(tr => {
        const nome = tr.querySelector("td").textContent.toLowerCase();
        tr.style.display = nome.includes(termo) ? "" : "none";
    });
});
