import { SteeringWheel } from "../ui/SteeringWheel";
import type { Comum } from "./contexto";
import { Unidade } from "./Unidade";

type NomesProps = Comum & {
	pessoas: string[];
	// motorista da 1ª viagem, que volta para buscar quem está nesta
	volta?: string | null;
};

export function Nomes({ pessoas, volta = null, ...comum }: NomesProps) {
	return (
		<ul className="flex flex-wrap gap-2">
			{volta && (
				<li
					title={`${volta} dirige de volta para buscar esta viagem`}
					className="flex min-h-9 items-center gap-1.5 rounded-lg border border-dashed border-tinta/30 px-3 text-tinta/70"
				>
					<SteeringWheel aria-hidden size={14} strokeWidth={2.5} />
					{volta} volta
				</li>
			)}
			{comum.plano.unidades(pessoas).map((unidade) => (
				<Unidade key={unidade[0]} unidade={unidade} {...comum} />
			))}
		</ul>
	);
}
