// ---------- IMPORTAÇÕES ----------
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// ---------- CONFIGURAÇÃO ----------
const publicPages = ["login.html", "registro.html"];
const currentPage = window.location.pathname.split("/").pop() || "clientes.html";


// ---------- FUNÇÃO: DESTACAR ITEM DA SIDEBAR ----------
function highlightSidebar() {
  try {
    document.querySelectorAll(".menu-item").forEach(li => li.classList.remove("active"));
    const link = document.querySelector(`.menu-item a[href="${currentPage}"]`);
    if (link?.parentElement) link.parentElement.classList.add("active");
  } catch (e) {
    // página sem sidebar (login/registro)
  }
}


// ---------- VERIFICAÇÃO DE LOGIN ----------
onAuthStateChanged(auth, user => {
  const isPublicPage = publicPages.includes(currentPage);

  if (!user) {
    // usuário não logado
    if (!isPublicPage) {
      window.location.replace("login.html");
    }
    return;
  }

  // usuário logado
  if (isPublicPage) {
    // acessando login/registro enquanto logado
    window.location.replace("clientes.html");
    return;
  }

  // para páginas normais com sidebar
  highlightSidebar();
});


// ---------- FUNÇÃO DE LOGOUT ----------
try {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth);
    });
  }
} catch (e) {
  // página não possui botão de logout (login/registro)
}
