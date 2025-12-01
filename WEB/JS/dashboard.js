// -------------------------------
// IMPORTAÇÕES
// -------------------------------
import { db, auth } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  carregarDashboard();
});

async function carregarDashboard() {
  await Promise.all([
    carregarContadores(),
    carregarUltimosClientes(),
    gerarGraficoInteracoes(),
    gerarGraficoOportunidades()
  ]);
}

async function carregarContadores() {
  const snapClientes = await getDocs(collection(db, "clientes"));
  document.getElementById("totalClientes").innerText = snapClientes.size;

  const snapOp = await getDocs(
    query(collection(db, "oportunidades"), where("etapa", "!=", "Fechado"))
  );
  document.getElementById("totalOportunidades").innerText = snapOp.size;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const snapInt = await getDocs(
    query(
      collection(db, "interacoes"),
      where("data", ">=", hoje)
    )
  );
  document.getElementById("interacoesHoje").innerText = snapInt.size;
}

async function carregarUltimosClientes() {
  const snap = await getDocs(
    query(
      collection(db, "clientes"),
      orderBy("criadoEm", "desc"),
      limit(5)
    )
  );

  const lista = document.getElementById("listaUltimosClientes");
  lista.innerHTML = "";

  snap.forEach(doc => {
    const c = doc.data();
    const li = document.createElement("li");
    li.textContent = c.nome;
    lista.appendChild(li);
    li.innerHTML = `
    <div class="avatar">${c.nome[0].toUpperCase()}</div>
    <span>${c.nome}</span>`;
  });
}

async function gerarGraficoInteracoes() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 6);

  const snap = await getDocs(
    query(
      collection(db, "interacoes"),
      where("data", ">=", seteDiasAtras)
    )
  );

  const contagem = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - (6 - i));
    contagem[d.toDateString()] = 0;
  }

  snap.forEach(doc => {
    const data = doc.data().data.toDate();
    const chave = new Date(
      data.getFullYear(),
      data.getMonth(),
      data.getDate()
    ).toDateString();

    if (contagem[chave] !== undefined) contagem[chave]++;
  });

  const labels = Object.keys(contagem).map(d =>
    new Date(d).toLocaleDateString("pt-BR")
  );

  const valores = Object.values(contagem);

  new Chart(document.getElementById("graficoInteracoes"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: valores,
        borderColor: "#00b3a4",
        backgroundColor: "rgba(0,179,164,0.2)",
        tension: 0.4
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

async function gerarGraficoOportunidades() {
  const snap = await getDocs(collection(db, "oportunidades"));

  const etapas = ["Contato", "Proposta", "Negociação", "Fechamento", "Perdida"];
  const valores = { Contato: 0, Proposta: 0, Negociação: 0, Fechamento: 0, Perdida: 0 };

  snap.forEach(doc => {
    const etapa = doc.data().etapa;
    if (valores[etapa] !== undefined) valores[etapa]++;
  });

  new Chart(document.getElementById("graficoEtapas"), {
    type: "doughnut",
    data: {
      labels: etapas,
      datasets: [{
        data: etapas.map(e => valores[e]),
        backgroundColor: ["#00b3a4", "#007acc", "#ffb800", "#ff5555", "#888888"]
      }]
    },
    options: { cutout: "60%", responsive: true }
  });
}
