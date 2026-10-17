
const campoDescricao = document.getElementById("descricao");
const campoValor = document.getElementById("valor");
const campoTipo = document.getElementById("tipo");
const filtroPeriodo = document.getElementById("filtroPeriodo");

const botaoAdicionar = document.getElementById("adicionar");
const listaMovimentacoes = document.getElementById("listaMovimentacoes");

const elementoSaldo = document.getElementById("valorSaldo");
const elementoReceitas = document.getElementById("valorReceitas");
const elementoDespesas = document.getElementById("valorDespesas");

let movimentacoes =
    JSON.parse(localStorage.getItem("movimentacoes")) || [];

let saldo = 0;
let totalReceitas = 0;
let totalDespesas = 0;
let indiceEdicao = null;

let graficoComparativo;
let graficoDistribuicao;

const botaoCancelar = document.createElement("button");
botaoCancelar.id = "botaoCancelar";
botaoCancelar.textContent = "Cancelar edição";
botaoCancelar.hidden = true;
botaoAdicionar.insertAdjacentElement("afterend", botaoCancelar);

Chart.register(ChartDataLabels);

function dataLocalHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function obterMovimentacoesDoPeriodo() {
    const periodo = filtroPeriodo.value;
    const hoje = dataLocalHoje();

    return movimentacoes.filter(function (item) {
        if (periodo === "todos") {
            return true;
        }

        if (!item.data) {
            return false;
        }

        if (periodo === "hoje") {
            return item.data === hoje;
        }

        if (periodo === "mes") {
            return item.data.slice(0, 7) === hoje.slice(0, 7);
        }

        if (periodo === "ano") {
            return item.data.slice(0, 4) === hoje.slice(0, 4);
        }

        return true;
    });
}

function salvarMovimentacoes() {
    localStorage.setItem(
        "movimentacoes",
        JSON.stringify(movimentacoes)
    );
}

function atualizarTotais() {
    totalReceitas = 0;
    totalDespesas = 0;

    const listaFiltrada = obterMovimentacoesDoPeriodo();

    listaFiltrada.forEach(function (movimentacao) {
        if (movimentacao.tipo === "receita") {
            totalReceitas += movimentacao.valor;
        } else if (movimentacao.tipo === "despesa") {
            totalDespesas += movimentacao.valor;
        }
    });

    saldo = totalReceitas - totalDespesas;

    elementoSaldo.textContent =
        `R$ ${saldo.toFixed(2).replace(".", ",")}`;

    elementoReceitas.textContent =
        `R$ ${totalReceitas.toFixed(2).replace(".", ",")}`;

    elementoDespesas.textContent =
        `R$ ${totalDespesas.toFixed(2).replace(".", ",")}`;
}

function atualizarGraficos() {
    const listaFiltrada = obterMovimentacoesDoPeriodo();

    const receitas = listaFiltrada
        .filter(function (item) {
            return item.tipo === "receita";
        })
        .reduce(function (total, item) {
            return total + item.valor;
        }, 0);

    const despesas = listaFiltrada
        .filter(function (item) {
            return item.tipo === "despesa";
        })
        .reduce(function (total, item) {
            return total + item.valor;
        }, 0);

    if (graficoComparativo) {
        graficoComparativo.destroy();
    }

    if (graficoDistribuicao) {
        graficoDistribuicao.destroy();
    }

    graficoComparativo = new Chart(
        document.getElementById("graficoComparativo"),
        {
            type: "bar",
            data: {
                labels: ["Receitas", "Despesas"],
                datasets: [{
                    data: [receitas, despesas],
                    backgroundColor: ["#39FF88", "#FF5263"],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        color: "#E5FFED",
                        anchor: "end",
                        align: "top",
                        font: {
                            weight: "bold"
                        },
                        formatter: function (valor) {
                            return valor > 0
                                ? "R$ " + valor.toFixed(2).replace(".", ",")
                                : "";
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (contexto) {
                                return "R$ " +
                                    contexto.raw.toFixed(2).replace(".", ",");
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: "#A9C8B3"
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grace: "15%",
                        ticks: {
                            color: "#A9C8B3",
                            callback: function (valor) {
                                return "R$ " + valor;
                            }
                        },
                        grid: {
                            color: "#1C3524"
                        }
                    }
                }
            }
        }
    );

    graficoDistribuicao = new Chart(
        document.getElementById("graficoDistribuicao"),
        {
            type: "doughnut",
            data: {
                labels: ["Receitas", "Despesas"],
                datasets: [{
                    data: [receitas, despesas],
                    backgroundColor: ["#39FF88", "#FF5263"],
                    borderColor: "#080E0A",
                    borderWidth: 4,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#A9C8B3",
                            padding: 18
                        }
                    },
                    datalabels: {
                        color: "#070A08",
                        font: {
                            weight: "bold"
                        },
                        formatter: function (valor) {
                            return valor > 0
                                ? "R$ " + valor.toFixed(2).replace(".", ",")
                                : "";
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (contexto) {
                                return contexto.label + ": R$ " +
                                    contexto.raw.toFixed(2).replace(".", ",");
                            }
                        }
                    }
                }
            }
        }
    );
}

function adicionarAoHistorico(movimentacao, indice) {
    const item = document.createElement("li");
    const texto = document.createElement("span");
    const botoes = document.createElement("div");
    const botaoEditar = document.createElement("button");
    const botaoExcluir = document.createElement("button");

    const dataFormatada = movimentacao.data
        ? movimentacao.data.split("-").reverse().join("/")
        : "Sem data";

    texto.textContent =
        `${movimentacao.descricao} — R$ ${movimentacao.valor.toFixed(2).replace(".", ",")} — ${movimentacao.tipo} — ${dataFormatada}`;

    texto.classList.add(
        movimentacao.tipo === "receita"
            ? "texto-receita"
            : "texto-despesa"
    );

    botaoEditar.textContent = "Editar";
    botaoExcluir.textContent = "Excluir";

    botaoEditar.addEventListener("click", function () {
        campoDescricao.value = movimentacao.descricao;
        campoValor.value = movimentacao.valor;
        campoTipo.value = movimentacao.tipo;

        indiceEdicao = indice;
        botaoAdicionar.textContent = "Salvar alterações";
        botaoCancelar.hidden = false;

        campoDescricao.focus();
    });

    botaoExcluir.addEventListener("click", function () {
        if (indiceEdicao === indice) {
            cancelarEdicao();
        }

        movimentacoes.splice(indice, 1);

        salvarMovimentacoes();
        renderizarHistorico();
        atualizarTotais();
        atualizarGraficos();
    });

    botoes.appendChild(botaoEditar);
    botoes.appendChild(botaoExcluir);

    item.appendChild(texto);
    item.appendChild(botoes);

    listaMovimentacoes.appendChild(item);
}

function renderizarHistorico() {
    listaMovimentacoes.innerHTML = "";

    movimentacoes.forEach(function (movimentacao, indice) {
        adicionarAoHistorico(movimentacao, indice);
    });
}

function cancelarEdicao() {
    indiceEdicao = null;
    botaoAdicionar.textContent = "Adicionar movimentação";
    botaoCancelar.hidden = true;
    campoDescricao.value = "";
    campoValor.value = "";
}

botaoCancelar.addEventListener("click", cancelarEdicao);

botaoAdicionar.addEventListener("click", function () {
    const descricao = campoDescricao.value.trim();
    const valor = Number(campoValor.value);
    const tipo = campoTipo.value;

    if (descricao === "") {
        alert("Digite uma descrição!");
        return;
    }

    if (
        campoValor.value === "" ||
        !Number.isFinite(valor) ||
        valor <= 0
    ) {
        alert("Digite um valor válido!");
        return;
    }

    const movimentacao = {
        descricao: descricao,
        valor: valor,
        tipo: tipo,
        data: dataLocalHoje()
    };

    if (indiceEdicao !== null) {
        movimentacao.data =
            movimentacoes[indiceEdicao].data || dataLocalHoje();

        movimentacoes[indiceEdicao] = movimentacao;
    } else {
        movimentacoes.push(movimentacao);
    }

    salvarMovimentacoes();
    cancelarEdicao();
    renderizarHistorico();
    atualizarTotais();
    atualizarGraficos();
    campoDescricao.focus();
});

filtroPeriodo.addEventListener("change", function () {
    atualizarTotais();
    atualizarGraficos();
});

renderizarHistorico();
atualizarTotais();
atualizarGraficos();
