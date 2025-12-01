// -------------------------------
// IMPORTAÇÕES
// -------------------------------
import { db, auth } from "../firebase.js";
import {
  collection,
  updateDoc,
  doc,
  deleteDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const snap = await getDocs(collection(db, "usuarios"));

  let usuarioAtual = null;
  snap.forEach((d) => {
    if (d.id === user.uid) usuarioAtual = d.data();
  });

  if (!usuarioAtual || usuarioAtual.cargo !== "admin") {
    alert("Acesso negado. Apenas administradores podem acessar esta página.");
    window.location.href = "dashboard.html";
    return;
  }

  carregarUsuarios();
});

async function carregarUsuarios() {
  const snap = await getDocs(collection(db, "usuarios"));
  const tabela = document.getElementById("listaUsuarios");
  tabela.innerHTML = "";

  snap.forEach((docSnap) => {
    const u = docSnap.data();

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td>${u.cargo}</td>
      <td>${u.bloqueado ? "🛑 Bloqueado" : "🟢 Ativo"}</td>
      <td>
          <button class="acao-btn editar" data-id="${docSnap.id}">✏️</button>
          <button class="acao-btn status" data-id="${docSnap.id}">
            ${u.bloqueado ? "Desbloquear" : "Bloquear"}
          </button>
          <button class="acao-btn deletar" data-id="${docSnap.id}">🗑️</button>
      </td>
    `;

    tabela.appendChild(tr);
  });

  registrarEventos();
}

function registrarEventos() {

  document.querySelectorAll(".editar").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;

      const novoNome = prompt("Novo nome:");
      const novoCargo = prompt("Cargo (admin ou vendedor):");

      if (!novoNome || !novoCargo) return;

      await updateDoc(doc(db, "usuarios", id), {
        nome: novoNome,
        cargo: novoCargo
      });

      carregarUsuarios();
    };
  });

  document.querySelectorAll(".status").forEach((btn) => {
    btn.onclick = async () => {

      const id = btn.dataset.id;
      const ref = doc(db, "usuarios", id);

      const snap = await getDocs(collection(db, "usuarios"));
      let usuario;

      snap.forEach((d) => {
        if (d.id === id) usuario = d.data();
      });

      await updateDoc(ref, {
        bloqueado: !usuario.bloqueado
      });

      carregarUsuarios();
    };
  });

  document.querySelectorAll(".deletar").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;

      if (confirm("Tem certeza que deseja excluir este usuário?")) {
        await deleteDoc(doc(db, "usuarios", id));
        carregarUsuarios();
      }
    };
  });
}
