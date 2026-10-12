import { Undo2, X } from "lucide-react";

type AvisoDesfazerProps = {
	texto: string | null;
	onDesfazer: () => void;
	onFechar: () => void;
};

// aparece embaixo depois de uma ação que tira alguém ou algo do lugar
export function AvisoDesfazer({
	texto,
	onDesfazer,
	onFechar,
}: AvisoDesfazerProps) {
	return (
		<div
			role="status"
			className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--altura-estrada)+1rem+env(safe-area-inset-bottom))] flex justify-center px-4"
		>
			{texto && (
				<div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-xl bg-asfalto py-2 pr-2 pl-4 text-ceu shadow-xl motion-safe:animate-entrar">
					<span className="min-w-0">{texto}</span>
					<button
						type="button"
						onClick={onDesfazer}
						title="Ctrl+Z"
						className="flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-faixa px-3 font-semibold text-tinta hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceu"
					>
						<Undo2 aria-hidden size={16} />
						Desfazer
					</button>
					<button
						type="button"
						aria-label="Fechar"
						onClick={onFechar}
						className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ceu/70 hover:bg-ceu/10 hover:text-ceu focus-visible:outline-2 focus-visible:outline-ceu"
					>
						<X aria-hidden size={16} />
					</button>
				</div>
			)}
		</div>
	);
}
