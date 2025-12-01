import { auth, db } from "../firebase.js";

import { 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const registroBtn = document.getElementById("registrobtn");
const googleBtn    = document.getElementById("googlebtn");

registroBtn.addEventListener("click", async () => {

    const nome  = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    if (!nome || !email || !senha) {
        alert("Preencha todos os campos.");
        return;
    }

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, senha);

        await setDoc(doc(db, "usuarios", cred.user.uid), {
            nome: nome,
            email: email,
            criadoEm: new Date(),
            cargo: "user",
            bloqueado: false,
        });

        alert("Conta criada com sucesso!");

        clearInputs();
        window.location.href = "dashboard.html";

    } catch (error) {
        alert("Erro ao registrar: " + error.message);
    }
});

googleBtn.addEventListener("click", async () => {

    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);

        await setDoc(doc(db, "usuarios", result.user.uid), {
            nome: result.user.displayName,
            email: result.user.email,
            criadoEm: new Date(),
            cargo: "user",
            bloqueado: false,
        }, { merge: true });

        alert("Conta criada com Google!");

        clearInputs();
        window.location.href = "dashboard.html";

    } catch (error) {
        alert("Erro ao registrar com Google: " + error.message);
    }
});

function clearInputs() {
    const el = id => document.getElementById(id);
    const nome = el("nome");
    const email = el("email");
    const senha = el("senha");
    if (nome) nome.value = "";
    if (email) email.value = "";
    if (senha) senha.value = "";
}


window.addEventListener("pagehide", clearInputs);
window.addEventListener("beforeunload", clearInputs);