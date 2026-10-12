import type { Acao, Local, Plano } from "../../viagem";

// quem está sendo arrastado: um grupo inteiro, ou uma pessoa só tirada de dentro dele.
// só existe dentro do quadro
export type Arrasto = {
	pessoas: string[] | null;
	comecar: (pessoas: string[]) => void;
	terminar: () => void;
	soltar: (para: Local) => void;
	// soltar em cima de alguém: quem foi arrastado passa a ir junto com essa pessoa
	juntar: (com: string) => void;
};

// o que todo painel do quadro recebe
export type Comum = {
	plano: Plano;
	arrasto: Arrasto;
	onAcao: (acao: Acao) => void;
	// tocar num nome abre o menu da pessoa; é o caminho que funciona no celular
	abrirMenu: (pessoa: string) => void;
};

export const contorno =
	"outline-2 outline-offset-2 outline-dashed outline-faixa";

// área onde se pode soltar alguém; só aceita se quem é arrastado couber
export function alvo({ plano, arrasto }: Comum, para: Local) {
	const aceita = !!arrasto.pessoas && plano.podeLevar(arrasto.pessoas, para);
	return {
		aceita,
		props: {
			onDragOver: (e: React.DragEvent) => {
				if (aceita) {
					e.preventDefault();
				}
			},
			onDrop: (e: React.DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
				arrasto.soltar(para);
			},
		},
	};
}

// enquanto alguém é arrastado, o que não aceita a pessoa fica apagado
export function apagado({ arrasto }: Comum, aceita: boolean) {
	return arrasto.pessoas && !aceita ? "opacity-50" : "";
}
