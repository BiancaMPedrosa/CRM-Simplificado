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

// botoes
const registroBtn = document.getElementById("registrobtn");
const googleBtn    = document.getElementById("googlebtn");

// registro com email e senha
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

        // salva dados no Firestore
        await setDoc(doc(db, "usuarios", cred.user.uid), {
            nome: nome,
            email: email,
            criadoEm: new Date(),
        });

        alert("Conta criada com sucesso!");

        window.location.href = "dashboard.html";

    } catch (error) {
        alert("Erro ao registrar: " + error.message);
    }
});

// registro / login com google
googleBtn.addEventListener("click", async () => {

    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);

        // salva no Firestore apenas a primeira vez
        await setDoc(doc(db, "usuarios", result.user.uid), {
            nome: result.user.displayName,
            email: result.user.email,
            criadoEm: new Date(),
        }, { merge: true }); // não sobrescreve dados existentes

        alert("Conta criada com Google!");

        window.location.href = "dashboard.html";

    } catch (error) {
        alert("Erro ao registrar com Google: " + error.message);
    }
});
