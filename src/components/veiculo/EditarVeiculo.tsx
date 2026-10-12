import { Pencil } from "lucide-react";
import { juntar, plural } from "../../texto";
import type { Acao, Plano, Veiculo } from "../../viagem";
import { Aviso } from "../ui/Aviso";
import { BotaoIcone } from "../ui/BotaoIcone";
import { DialogoVeiculo } from "./DialogoVeiculo";

type EditarVeiculoProps = {
	veiculo: Veiculo;
	plano: Plano;
	onAcao: (acao: Acao) => void;
};

// muda nome e lugares; antes de salvar, mostra quem volta para a origem se faltar lugar
export function EditarVeiculo({
	veiculo: v,
	plano,
	onAcao,
}: EditarVeiculoProps) {
	return (
		<DialogoVeiculo
			titulo="Editar veículo"
			nome={v.nome}
			lugares={v.limite}
			nomePadrao={() => v.nome}
			confirmar={() => "Salvar"}
			aviso={(lugares) => {
				const nomes = plano.excedentes(v.id, lugares);
				return (
					nomes.length > 0 && (
						<Aviso pequeno>
							{juntar(nomes)} {plural(nomes.length, "volta", "voltam")} para a
							origem.
						</Aviso>
					)
				);
			}}
			onSalvar={(nome, lugares) =>
				onAcao({ tipo: "editarVeiculo", id: v.id, nome, lugares })
			}
		>
			{(abrir) => (
				<BotaoIcone
					icone={Pencil}
					rotulo={`Editar ${v.nome}`}
					onClick={abrir}
				/>
			)}
		</DialogoVeiculo>
	);
}
