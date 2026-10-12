import { SteeringWheel } from "../ui/SteeringWheel";

type CartaoProps = {
	pessoa: string;
	dirige: boolean;
	onAbrir: () => void;
	// dentro de um grupo, arrastar o nome leva só essa pessoa
	onArrastar?: (e: React.DragEvent) => void;
};

// nome único e válido em CSS para a animação de cada pessoa entre as listas
function nomeDeTransicao(pessoa: string) {
	return `pessoa-${Array.from(pessoa, (c) => c.codePointAt(0)?.toString(36)).join("-")}`;
}

// a pessoa no quadro: um botão só, grande o bastante para o dedo. as ações ficam no menu
export function Cartao({ pessoa, dirige, onAbrir, onArrastar }: CartaoProps) {
	return (
		<button
			type="button"
			onClick={onAbrir}
			draggable={!!onArrastar}
			onDragStart={onArrastar}
			title={onArrastar ? "Arraste para levar só esta pessoa" : undefined}
			aria-haspopup="dialog"
			aria-label={dirige ? `${pessoa}, vai dirigir` : pessoa}
			style={{ viewTransitionName: nomeDeTransicao(pessoa) }}
			className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 text-tinta shadow-[0_1px_0_rgb(0_0_0/0.15)] hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fusca motion-safe:animate-entrar"
		>
			{dirige && (
				<span
					aria-hidden
					className="-ml-1.5 grid size-5 place-items-center rounded-full bg-tinta text-white"
				>
					<SteeringWheel size={13} strokeWidth={2.75} />
				</span>
			)}
			{pessoa}
		</button>
	);
}
