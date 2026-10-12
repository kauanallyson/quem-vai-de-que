import { House } from "lucide-react";
import { plural } from "../../texto";
import { naOrigem } from "../../viagem";
import { CabecalhoPainel } from "./CabecalhoPainel";
import { alvo, apagado, type Comum, contorno } from "./contexto";
import { Nomes } from "./Nomes";

// quem ainda não tem lugar. no computador fica ao lado dos veículos e rola por dentro se a lista crescer
export function PainelOrigem(comum: Comum) {
	const { plano } = comum;
	const { aceita, props } = alvo(comum, naOrigem);
	const esperando = plano.origem.length;

	return (
		<section
			aria-label="Origem"
			className={`rounded-2xl bg-tinta/5 p-4 transition-opacity lg:max-h-full lg:overflow-y-auto ${apagado(comum, aceita)} ${aceita ? contorno : ""}`}
			{...props}
		>
			<CabecalhoPainel icone={House} cor="bg-tinta" titulo="Origem">
				<span className="text-tinta/60">
					{esperando === 0
						? "Ninguém esperando"
						: `${esperando} ${plural(esperando, "pessoa esperando", "pessoas esperando")}`}
				</span>
			</CabecalhoPainel>
			<div className="mt-4">
				{esperando > 0 ? (
					<Nomes pessoas={plano.origem} {...comum} />
				) : (
					<p className="text-pretty text-tinta/60">
						{plano.pessoas.length === 0
							? "Escreva os nomes no campo acima, separados por vírgula. Quem tem que ir junto vai com +."
							: "Todo mundo já tem lugar."}
					</p>
				)}
			</div>
		</section>
	);
}
