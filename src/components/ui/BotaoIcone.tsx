import type { LucideIcon } from "lucide-react";

// tamanho do botão pequeno; quem precisa ocupar o mesmo espaço sem botão usa este também
export const tamanhoPequeno = "size-9 sm:size-7";

type BotaoIconeProps = {
	icone: LucideIcon;
	// lido pelo leitor de tela e mostrado ao passar o mouse
	rotulo: string;
	onClick: () => void;
	pequeno?: boolean;
};

// botão só com ícone; no celular a área de toque é maior que o desenho
export function BotaoIcone({
	icone: Icone,
	rotulo,
	onClick,
	pequeno = false,
}: BotaoIconeProps) {
	return (
		<button
			type="button"
			aria-label={rotulo}
			title={rotulo}
			onClick={onClick}
			className={`grid shrink-0 cursor-pointer place-items-center rounded-lg text-tinta/55 hover:bg-tinta/10 hover:text-tinta focus-visible:text-tinta focus-visible:outline-2 focus-visible:outline-fusca ${
				pequeno ? tamanhoPequeno : "size-10 sm:size-8"
			}`}
		>
			<Icone aria-hidden size={pequeno ? 15 : 18} />
		</button>
	);
}
