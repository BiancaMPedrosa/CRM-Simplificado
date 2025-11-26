import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// verifica login ao carregar qualquer página protegida
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  console.log("Usuário logado:", user.email);

  // carregar dados do Firestore
  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const dados = snap.data();

    // se tiver um elemento com id="nomeUsuario", preencher
    const nomeElemento = document.getElementById("nomeUsuario");
    if (nomeElemento) {
      nomeElemento.innerText = dados.nome || user.email;
    }

    console.log("Dados carregados:", dados);
  }
});

// evento do botão de logout
const btnLogout = document.getElementById("logoutBtn");

if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}
