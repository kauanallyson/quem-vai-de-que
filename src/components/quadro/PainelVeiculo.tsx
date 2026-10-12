import { Plus, X } from "lucide-react";
import { ordinal } from "../../texto";
import { dadosDoTipo } from "../../veiculo";
import type { Veiculo } from "../../viagem";
import { Aviso } from "../ui/Aviso";
import { BotaoIcone, tamanhoPequeno } from "../ui/BotaoIcone";
import { Contador } from "../ui/Contador";
import { EditarVeiculo } from "../veiculo/EditarVeiculo";
import { Assentos } from "./Assentos";
import { CabecalhoPainel } from "./CabecalhoPainel";
import { alvo, apagado, type Comum, contorno } from "./contexto";
import { Nomes } from "./Nomes";

export function PainelVeiculo({
	veiculo: v,
	...comum
}: Comum & { veiculo: Veiculo }) {
	const { plano, onAcao } = comum;
	const tipo = dadosDoTipo(v.limite);
	const { aviso, viagens } = plano.ocupacao(v);
	const varias = viagens.length > 1;
	const alvos = viagens.map((_, i) => alvo(comum, { id: v.id, viagem: i }));
	// com uma viagem só, o painel inteiro aceita soltar; com várias, cada viagem é uma área
	const doPainel = varias ? null : alvos[0];

	return (
		<section
			aria-label={v.nome}
			className={`rounded-2xl p-4 transition-opacity ${tipo.fundo} ${apagado(
				comum,
				alvos.some((a) => a.aceita),
			)} ${doPainel?.aceita ? contorno : ""}`}
			{...doPainel?.props}
		>
			<CabecalhoPainel
				icone={tipo.icone}
				cor={tipo.cor}
				titulo={v.nome}
				acoes={
					<>
						<EditarVeiculo veiculo={v} plano={plano} onAcao={onAcao} />
						<BotaoIcone
							icone={X}
							rotulo={`Remover ${v.nome}`}
							onClick={() => onAcao({ tipo: "removerVeiculo", id: v.id })}
						/>
					</>
				}
			>
				{varias ? (
					<span className="text-tinta/60">
						{viagens.length} viagens, {v.limite} lugares
					</span>
				) : (
					<>
						<Contador
							texto={`${viagens[0].ocupados}/${v.limite}`}
							cheio={viagens[0].cheio}
						/>{" "}
						<span className="text-tinta/60">lugares</span>
					</>
				)}
			</CabecalhoPainel>

			{aviso && plano.pessoas.length > 0 && (
				<Aviso pequeno>
					{aviso === "vazio"
						? "Precisa de pelo menos uma pessoa."
						: varias
							? "Ninguém na 1ª viagem vai dirigir e voltar."
							: "Ninguém aqui vai dirigir."}
				</Aviso>
			)}

			{/* as viagens uma embaixo da outra, na ordem em que acontecem. com várias, cada caixa
			    é compacta: o mapa de assentos vai na linha do título */}
			<div className={`grid ${varias ? "mt-2.5 gap-2" : "mt-4"}`}>
				{viagens.map((o, i) => {
					const assentos = (
						<Assentos
							limite={v.limite}
							ocupados={o.ocupados}
							cheio={o.cheio}
							primeiro={o.primeiro}
						/>
					);
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: a posição é a identidade da viagem (1ª, 2ª...)
							key={i}
							className={`rounded-xl ${varias ? "bg-white/60 px-2.5 py-2" : ""} ${varias && alvos[i].aceita ? contorno : ""}`}
							{...(varias ? alvos[i].props : {})}
						>
							{varias ? (
								<div className="flex min-h-7 items-center gap-2 text-sm font-bold">
									<span className="shrink-0">{ordinal(i)}</span>
									<div className="min-w-0 flex-1">{assentos}</div>
									<Contador
										texto={`${o.ocupados}/${v.limite}`}
										cheio={o.cheio}
									/>
									{i > 0 ? (
										<BotaoIcone
											icone={X}
											pequeno
											rotulo={`Remover ${ordinal(i)} de ${v.nome}`}
											onClick={() =>
												onAcao({ tipo: "removerViagem", id: v.id, viagem: i })
											}
										/>
									) : (
										// mantém os contadores alinhados com os das viagens que têm o X
										<span
											aria-hidden
											className={`shrink-0 ${tamanhoPequeno}`}
										/>
									)}
								</div>
							) : (
								assentos
							)}
							<div className={varias ? "mt-1.5" : "mt-3"}>
								{o.pessoas.length === 0 && !o.volta ? (
									<p className="flex min-h-9 items-center text-sm text-tinta/60">
										Toque num nome na origem ou arraste para cá.
									</p>
								) : (
									<Nomes pessoas={o.pessoas} volta={o.volta} {...comum} />
								)}
							</div>
						</div>
					);
				})}
			</div>

			<button
				type="button"
				onClick={() => onAcao({ tipo: "adicionarViagem", id: v.id })}
				className="-ml-2 flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-tinta/60 hover:bg-tinta/5 hover:text-tinta focus-visible:outline-2 focus-visible:outline-faixa"
			>
				<Plus aria-hidden size={16} />
				Adicionar viagem
			</button>
		</section>
	);
}
