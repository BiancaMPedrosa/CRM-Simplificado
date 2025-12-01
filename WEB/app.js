// ---------- IMPORTAÇÕES ----------
import { db, auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const publicPages = ["login.html", "registro.html"];
const currentPage = window.location.pathname.split("/").pop() || "clientes.html";

function highlightSidebar() {
  try {
    document.querySelectorAll(".menu-item").forEach(li => li.classList.remove("active"));
    const link = document.querySelector(`.menu-item a[href="${currentPage}"]`);
    if (link?.parentElement) link.parentElement.classList.add("active");
  } catch (e) {}
}

onAuthStateChanged(auth, async (user) => {

  const isPublicPage = publicPages.includes(currentPage);

  if (!user) {
    if (!isPublicPage) {
      window.location.replace("login.html");
    }
    return;
  }

  if (currentPage === "login.html") {
    window.location.replace("dashboard.html");
    return;
  }

  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);
  const dados = snap.data();

  if (dados?.bloqueado === true) {
    alert("Sua conta foi bloqueada por um administrador.");
    await signOut(auth);
    window.location.href = "login.html";
    return;
  }

  highlightSidebar();
});

try {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth);
    });
  }
} catch (e) {}
