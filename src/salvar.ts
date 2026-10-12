import { Plano } from "./viagem";

const CHAVE = "viagens:estado";

type ListaAntiga = {
	id: string;
	tipo: string;
	nome: string;
	limite: number;
	viagens: string[][];
};

// versões antigas guardavam { listas, motoristas }: a origem era uma lista como os veículos,
// e às vezes havia uma lista "chegada"; quem estava nela volta para a origem
function migrar(salvo: { listas: ListaAntiga[]; motoristas: string[] }): Plano {
	const de = (tipo: string) => salvo.listas.filter((l) => l.tipo === tipo);
	return Plano.de({
		origem: [...de("origem"), ...de("chegada")].flatMap((l) =>
			l.viagens.flat(),
		),
		veiculos: de("veiculo").map(({ id, nome, limite, viagens }) => ({
			id,
			nome,
			limite,
			viagens,
		})),
		motoristas: salvo.motoristas,
		grupos: [],
	});
}

export function carregar(): Plano | null {
	try {
		const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "null");
		if (
			Array.isArray(salvo?.origem) &&
			Array.isArray(salvo?.veiculos) &&
			Array.isArray(salvo?.motoristas)
		) {
			// grupos vieram depois
			return Plano.de({
				origem: salvo.origem,
				veiculos: salvo.veiculos,
				motoristas: salvo.motoristas,
				grupos: Array.isArray(salvo.grupos) ? salvo.grupos : [],
			});
		}
		if (Array.isArray(salvo?.listas) && Array.isArray(salvo?.motoristas)) {
			return migrar(salvo);
		}
		return null;
	} catch {
		return null;
	}
}

export function salvar(plano: Plano) {
	localStorage.setItem(CHAVE, JSON.stringify(plano));
}
