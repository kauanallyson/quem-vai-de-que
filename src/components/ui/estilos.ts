// alvos de toque com pelo menos 40px de altura; o foco é sempre visível
const base =
	"inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export const campo =
	"min-h-10 rounded-lg border-2 border-tinta/15 bg-white px-3 outline-none placeholder:text-tinta/45 focus-visible:border-fusca";

export const botaoPrimario = `${base} bg-tinta text-ceu hover:bg-fusca focus-visible:outline-faixa disabled:hover:bg-tinta`;

// a ação principal da página: preencher os veículos
export const botaoDestaque = `${base} bg-faixa text-tinta hover:brightness-95 focus-visible:outline-tinta`;

export const botaoContorno = `${base} border-2 border-tinta/80 hover:bg-tinta hover:text-ceu focus-visible:outline-faixa disabled:hover:bg-transparent disabled:hover:text-tinta`;

export const botaoDiscreto = `${base} hover:bg-tinta/5 focus-visible:outline-faixa`;

// fundo, cor e sombra comuns aos diálogos; a posição e o tamanho ficam com cada um
export const dialogo = "bg-ceu text-tinta shadow-2xl backdrop:bg-tinta/50";
