import { TriangleAlert } from "lucide-react";

export function Aviso({
	children,
	pequeno = false,
}: {
	children: React.ReactNode;
	pequeno?: boolean;
}) {
	return (
		<p
			className={`mt-3 flex items-center gap-1.5 font-semibold text-moto ${pequeno ? "px-1 text-sm" : ""}`}
		>
			<TriangleAlert aria-hidden size={pequeno ? 16 : 18} />
			{children}
		</p>
	);
}
