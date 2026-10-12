import { GripVertical } from "lucide-react";
import { Fragment, useState } from "react";
import { Cartao } from "./Cartao";
import type { Comum } from "./contexto";

// uma pessoa sozinha ou um grupo que vai junto. num grupo, arrastar um nome leva só essa
// pessoa (e a tira do grupo); arrastar pela alça leva o grupo inteiro.
// soltar alguém em cima de uma unidade junta os dois
export function Unidade({
	unidade,
	plano,
	arrasto,
	abrirMenu,
}: Comum & { unidade: string[] }) {
	const [sobre, setSobre] = useState(false);
	const junta = !!arrasto.pessoas && !unidade.includes(arrasto.pessoas[0]);
	const grupo = unidade.length > 1;

	function comecar(e: React.DragEvent, pessoas: string[]) {
		// o nome de dentro do grupo não deixa o grupo inteiro começar a ser arrastado
		e.stopPropagation();
		e.dataTransfer.setData("text/plain", pessoas.join(" + "));
		e.dataTransfer.effectAllowed = "move";
		arrasto.comecar(pessoas);
	}

	return (
		<li
			draggable
			onDragStart={(e) => comecar(e, unidade)}
			onDragEnd={arrasto.terminar}
			onDragEnter={() => setSobre(junta)}
			onDragLeave={() => setSobre(false)}
			onDragOver={(e) => {
				if (junta) {
					e.preventDefault();
				}
			}}
			onDrop={(e) => {
				setSobre(false);
				if (junta) {
					e.preventDefault();
					e.stopPropagation();
					arrasto.juntar(unidade[0]);
				}
			}}
			title={junta ? "Soltar aqui para irem juntos" : undefined}
			aria-label={grupo ? `Vão juntos: ${unidade.join(", ")}` : undefined}
			className={`flex cursor-grab flex-wrap items-center gap-1 rounded-xl active:cursor-grabbing ${
				grupo ? "bg-tinta/10 p-1" : ""
			} ${sobre ? "outline-2 outline-offset-2 outline-faixa" : ""} ${
				// durante o arraste só o card recebe os eventos, para não piscar entre os filhos
				arrasto.pessoas ? "[&_*]:pointer-events-none" : ""
			}`}
		>
			{grupo && (
				<span
					aria-hidden
					title="Arraste por aqui para levar o grupo inteiro"
					className="grid h-9 w-5 place-items-center text-tinta/45"
				>
					<GripVertical size={16} />
				</span>
			)}
			{unidade.map((p, i) => (
				<Fragment key={p}>
					{i > 0 && (
						<span aria-hidden className="font-extrabold text-tinta/40">
							+
						</span>
					)}
					<Cartao
						pessoa={p}
						dirige={plano.motoristas.includes(p)}
						onAbrir={() => abrirMenu(p)}
						onArrastar={grupo ? (e) => comecar(e, [p]) : undefined}
					/>
				</Fragment>
			))}
		</li>
	);
}
