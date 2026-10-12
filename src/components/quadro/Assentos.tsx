import { SteeringWheel } from "../ui/SteeringWheel";

type AssentosProps = {
	limite: number;
	ocupados: number;
	cheio: boolean;
	primeiro: "motorista" | "volta" | null;
};

// os lugares da viagem, como no mapa de assentos de um veículo.
// o primeiro é do motorista: na 1ª viagem, se houver; nas outras, de quem volta para buscar
export function Assentos({ limite, ocupados, cheio, primeiro }: AssentosProps) {
	const cheios = cheio ? "bg-faixa" : "bg-tinta/80";
	if (limite > 16) {
		return (
			<div
				aria-hidden
				className="h-2.5 overflow-hidden rounded-full bg-tinta/10"
			>
				<div
					className={`h-full rounded-full transition-[width] ${cheios}`}
					style={{ width: `${(ocupados / limite) * 100}%` }}
				/>
			</div>
		);
	}
	return (
		<div aria-hidden className="flex flex-wrap gap-1">
			{Array.from({ length: limite }, (_, i) => {
				const volante = i === 0 && primeiro;
				const estilo =
					volante === "volta"
						? "border-[1.5px] border-dashed border-tinta/50 text-tinta/60"
						: i < ocupados
							? `${cheios} text-white`
							: "border-[1.5px] border-tinta/20";
				return (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: assentos não têm outra identidade
						key={i}
						className={`grid size-4 place-items-center rounded-[4px] transition-colors ${estilo}`}
					>
						{volante && (
							<SteeringWheel
								size={11}
								strokeWidth={3}
								className={cheio && volante === "motorista" ? "text-tinta" : ""}
							/>
						)}
					</span>
				);
			})}
		</div>
	);
}
