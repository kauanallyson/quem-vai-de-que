// a faixa de asfalto, sempre visível no pé da tela, como o chão da página
export function Estrada() {
	return (
		<div
			aria-hidden
			className="pointer-events-none fixed inset-x-0 bottom-0 flex h-[calc(var(--altura-estrada)+env(safe-area-inset-bottom))] items-center bg-asfalto pb-[env(safe-area-inset-bottom)]"
		>
			<div className="h-1 w-full bg-[repeating-linear-gradient(90deg,var(--color-faixa)_0_2rem,transparent_2rem_3.5rem)] sm:h-1.5 sm:bg-[repeating-linear-gradient(90deg,var(--color-faixa)_0_2.5rem,transparent_2.5rem_4.5rem)]" />
		</div>
	);
}
