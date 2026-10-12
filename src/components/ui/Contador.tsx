// ocupação de um veículo ou viagem; cheio ganha a cor da faixa
export function Contador({ texto, cheio }: { texto: string; cheio?: boolean }) {
	return (
		<span
			className={`font-semibold tabular-nums ${cheio ? "rounded-md bg-faixa px-1.5 text-tinta" : "text-tinta/60"}`}
		>
			{texto}
			{cheio && <span className="sr-only"> (cheio)</span>}
		</span>
	);
}
