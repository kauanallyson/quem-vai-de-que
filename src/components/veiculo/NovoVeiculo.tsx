import { Plus } from "lucide-react";
import { LIMITE_PADRAO } from "../../veiculo";
import { DialogoVeiculo } from "./DialogoVeiculo";

type NovoVeiculoProps = {
	numero: number;
	onAdicionar: (nome: string, lugares: number) => void;
};

// fica no fim da grade de veículos, ocupando a próxima vaga com a ação de criar outro
export function NovoVeiculo({ numero, onAdicionar }: NovoVeiculoProps) {
	return (
		<DialogoVeiculo
			titulo="Novo veículo"
			nome=""
			lugares={LIMITE_PADRAO}
			nomePadrao={(tipo) => `${tipo.rotulo} ${numero}`}
			confirmar={(tipo) => `Adicionar ${tipo.rotulo.toLowerCase()}`}
			onSalvar={onAdicionar}
		>
			{(abrir) => (
				<button
					type="button"
					onClick={abrir}
					className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 sm:min-h-24 sm:flex-col rounded-2xl border-2 border-dashed border-tinta/20 font-semibold text-tinta/60 transition-colors hover:border-fusca hover:bg-fusca/5 hover:text-fusca focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-faixa"
				>
					<Plus aria-hidden size={24} />
					Novo veículo
				</button>
			)}
		</DialogoVeiculo>
	);
}
