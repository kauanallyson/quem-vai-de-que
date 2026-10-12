import type { LucideIcon } from "lucide-react";

type CabecalhoPainelProps = {
	icone: LucideIcon;
	cor: string;
	titulo: string;
	// contagem ou resumo embaixo do nome, como numa placa
	children: React.ReactNode;
	// botões à direita (editar, remover)
	acoes?: React.ReactNode;
};

export function CabecalhoPainel({
	icone: Icone,
	cor,
	titulo,
	children,
	acoes,
}: CabecalhoPainelProps) {
	return (
		<div className="flex items-start gap-3">
			<span
				aria-hidden
				className={`grid size-10 shrink-0 place-items-center rounded-xl text-white ${cor}`}
			>
				<Icone size={22} strokeWidth={2.25} />
			</span>
			<div className="min-w-0 flex-1">
				<h2 className="text-xl leading-tight font-extrabold break-words">
					{titulo}
				</h2>
				<p className="mt-0.5 text-sm">{children}</p>
			</div>
			{acoes && <div className="-mt-1 -mr-1 flex shrink-0">{acoes}</div>}
		</div>
	);
}
