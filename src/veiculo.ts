import { Bus, Car, type LucideIcon, Motorbike } from "lucide-react";

export type TipoVeiculo = "moto" | "carro" | "onibus";

export const LIMITE_PADRAO = 5;

// em ordem de tamanho; `ate` é o máximo de lugares de cada tipo e `padrao`, o que se usa ao escolher o tipo
export const tiposDeVeiculo: {
	tipo: TipoVeiculo;
	rotulo: string;
	ate: number;
	padrao: number;
	icone: LucideIcon;
	cor: string;
	// fundo do painel, a mesma cor bem clara
	fundo: string;
}[] = [
	{
		tipo: "moto",
		rotulo: "Moto",
		ate: 2,
		padrao: 2,
		icone: Motorbike,
		cor: "bg-moto",
		fundo: "bg-moto/10",
	},
	{
		tipo: "carro",
		rotulo: "Carro",
		ate: 7,
		padrao: LIMITE_PADRAO,
		icone: Car,
		cor: "bg-fusca",
		fundo: "bg-fusca/10",
	},
	{
		tipo: "onibus",
		rotulo: "Ônibus",
		ate: Infinity,
		padrao: 40,
		icone: Bus,
		cor: "bg-onibus",
		fundo: "bg-onibus/10",
	},
];

export function dadosDoTipo(lugares: number) {
	return (
		tiposDeVeiculo.find((t) => lugares <= t.ate) ??
		tiposDeVeiculo[tiposDeVeiculo.length - 1]
	);
}

// "1–2 lugares", "3–7 lugares", "8 ou mais"
export function faixaDeLugares(tipo: TipoVeiculo) {
	const i = tiposDeVeiculo.findIndex((t) => t.tipo === tipo);
	const de = i === 0 ? 1 : tiposDeVeiculo[i - 1].ate + 1;
	const ate = tiposDeVeiculo[i].ate;
	return ate === Infinity ? `${de} ou mais` : `${de}-${ate} lugares`;
}
