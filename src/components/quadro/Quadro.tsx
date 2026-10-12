import { useState } from "react";
import type { Acao, Plano } from "../../viagem";
import { NovoVeiculo } from "../veiculo/NovoVeiculo";
import type { Arrasto, Comum } from "./contexto";
import { MenuPessoa } from "./MenuPessoa";
import { PainelOrigem } from "./PainelOrigem";
import { PainelVeiculo } from "./PainelVeiculo";

type QuadroProps = { plano: Plano; onAcao: (acao: Acao) => void };

// a origem ao lado (no celular, em cima) e os veículos numa grade que ocupa o resto da largura.
// arrastar um nome muda a pessoa de lugar; tocar abre o menu dela
export function Quadro({ plano, onAcao }: QuadroProps) {
	const [arrastando, setArrastando] = useState<string[] | null>(null);
	const [menu, setMenu] = useState<string | null>(null);

	// soltar encerra o arraste, fazendo a ação se havia alguém sendo arrastado
	function terminarCom(acao: (pessoas: string[]) => Acao) {
		if (arrastando) {
			onAcao(acao(arrastando));
		}
		setArrastando(null);
	}

	const arrasto: Arrasto = {
		pessoas: arrastando,
		comecar: setArrastando,
		terminar: () => setArrastando(null),
		soltar: (para) =>
			terminarCom((pessoas) => ({ tipo: "mover", pessoas, para })),
		juntar: (com) =>
			terminarCom((pessoas) => ({ tipo: "agrupar", a: com, pessoas })),
	};
	const comum: Comum = { plano, arrasto, onAcao, abrirMenu: setMenu };

	return (
		<>
			{/* no computador ocupa a altura que sobra; a origem e a grade de veículos rolam por dentro */}
			<div className="mt-4 grid items-start gap-4 sm:mt-5 sm:gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[20rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
				<PainelOrigem {...comum} />
				{/* colunas iguais que esticam até a borda; o cartão de novo veículo ocupa a próxima vaga */}
				{/* o p-1 deixa o contorno de soltar visível dentro da área que rola */}
				<div className="lg:-m-1 lg:max-h-full lg:overflow-y-auto lg:p-1">
					<div className="grid grid-cols-[repeat(auto-fit,minmax(min(19rem,100%),1fr))] content-start items-start gap-4 sm:gap-6">
						{plano.veiculos.map((v) => (
							<PainelVeiculo key={v.id} veiculo={v} {...comum} />
						))}
						<NovoVeiculo
							numero={plano.veiculos.length + 1}
							onAdicionar={(nome, lugares) =>
								onAcao({ tipo: "adicionarVeiculo", nome, lugares })
							}
						/>
					</div>
				</div>
			</div>
			<MenuPessoa
				plano={plano}
				pessoa={menu}
				onAcao={onAcao}
				onFechar={() => setMenu(null)}
			/>
		</>
	);
}
