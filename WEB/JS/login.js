import { auth, db } from "../firebase.js";

import { 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  setDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


const loginBtn = document.getElementById("loginbtn");

loginBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        clearInputs();
        window.location = "dashboard.html"; 
      })
      .catch((error) => {
        alert("Erro: " + error.message);
      });
});

const googleBtn = document.getElementById("googlebtn");
const provider = new GoogleAuthProvider();

googleBtn.addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);

        const user = result.user;
    
        await setDoc(doc(db, "usuarios", user.uid), {
            nome: user.displayName,
            email: user.email,
            foto: user.photoURL,
            logadoVia: "google"
        }, { merge: true });

        clearInputs();
        window.location = "dashboard.html";

    } catch (error) {
        console.error(error);
        alert("Erro ao fazer login com Google: " + error.message);
    }
});

function clearInputs() {
    const el = id => document.getElementById(id);
    const email = el("email");
    const senha = el("senha");
    if (email) email.value = "";
    if (senha) senha.value = "";
}

window.addEventListener("pagehide", clearInputs);
window.addEventListener("beforeunload", clearInputs);