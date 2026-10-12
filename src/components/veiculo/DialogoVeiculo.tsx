import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { dadosDoTipo, faixaDeLugares, tiposDeVeiculo } from "../../veiculo";
import { lugaresValidos } from "../../viagem";
import { botaoDiscreto, botaoPrimario, campo, dialogo } from "../ui/estilos";

type Tipo = ReturnType<typeof dadosDoTipo>;

type DialogoVeiculoProps = {
	titulo: string;
	nome: string;
	lugares: number;
	// nome usado se o campo ficar vazio
	nomePadrao: (tipo: Tipo) => string;
	confirmar: (tipo: Tipo) => string;
	// o que muda no plano com esses lugares, mostrado antes de salvar
	aviso?: (lugares: number) => React.ReactNode;
	onSalvar: (nome: string, lugares: number) => void;
	// o botão que abre o diálogo
	children: (abrir: () => void) => React.ReactNode;
};

// o formulário de veículo: nome, lugares e tipo. abrir recomeça dos valores recebidos
export function DialogoVeiculo({
	titulo,
	nome: nomeInicial,
	lugares: lugaresIniciais,
	nomePadrao,
	confirmar,
	aviso,
	onSalvar,
	children,
}: DialogoVeiculoProps) {
	const dialog = useRef<HTMLDialogElement>(null);
	const idAviso = useId();
	const [nome, setNome] = useState(nomeInicial);
	const [lugares, setLugares] = useState(lugaresIniciais);
	// o aviso só é calculado com o diálogo aberto
	const [aberto, setAberto] = useState(false);

	const validos = lugaresValidos(lugares, lugaresIniciais);
	const tipo = dadosDoTipo(validos);
	const padrao = nomePadrao(tipo);

	function abrir() {
		setNome(nomeInicial);
		setLugares(lugaresIniciais);
		setAberto(true);
		dialog.current?.showModal();
	}

	function salvar(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();
		onSalvar(nome.trim() || padrao, validos);
		dialog.current?.close();
	}

	return (
		<>
			{children(abrir)}

			{/* no body, para o diálogo não ficar dentro do cabeçalho de quem o abre */}
			{createPortal(
				<dialog
					ref={dialog}
					aria-label={titulo}
					onClose={() => setAberto(false)}
					className={`m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl p-6 ${dialogo}`}
				>
					<form onSubmit={salvar} className="flex flex-col gap-5">
						<h2 className="text-3xl font-extrabold">{titulo}</h2>

						<label className="flex flex-col gap-1.5 text-sm font-semibold">
							Nome
							<input
								value={nome}
								onChange={(e) => setNome(e.target.value)}
								placeholder={padrao}
								className={`${campo} text-base`}
							/>
						</label>

						<label className="flex flex-col gap-1.5 text-sm font-semibold">
							Lugares
							<input
								type="number"
								min={1}
								value={lugares}
								onChange={(e) => setLugares(e.target.valueAsNumber)}
								aria-describedby={idAviso}
								className={`${campo} text-base`}
							/>
						</label>

						{/* escolher o tipo preenche os lugares; digitar os lugares escolhe o tipo */}
						<fieldset className="grid grid-cols-3 gap-2">
							<legend className="sr-only">Tipo de veículo</legend>
							{tiposDeVeiculo.map((t) => (
								<button
									key={t.tipo}
									type="button"
									aria-pressed={t === tipo}
									onClick={() => setLugares(t.padrao)}
									className={`cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-faixa ${
										t === tipo
											? `${t.cor} text-white`
											: "bg-tinta/5 text-tinta/50 hover:bg-tinta/10 hover:text-tinta/80"
									}`}
								>
									<t.icone aria-hidden size={22} className="mb-1" />
									<span className="block font-extrabold">{t.rotulo}</span>
									<span className="text-sm">{faixaDeLugares(t.tipo)}</span>
								</button>
							))}
						</fieldset>

						<div id={idAviso} aria-live="polite" className="-mt-3 empty:hidden">
							{aberto && aviso?.(validos)}
						</div>

						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => dialog.current?.close()}
								className={botaoDiscreto}
							>
								Cancelar
							</button>
							<button type="submit" className={botaoPrimario}>
								{confirmar(tipo)}
							</button>
						</div>
					</form>
				</dialog>,
				document.body,
			)}
		</>
	);
}
