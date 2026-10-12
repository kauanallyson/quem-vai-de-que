import {
	Check,
	House,
	Link2Off,
	type LucideIcon,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { juntar, ordinal, plural } from "../../texto";
import { dadosDoTipo } from "../../veiculo";
import { type Acao, type Local, naOrigem, Plano } from "../../viagem";
import { BotaoIcone } from "../ui/BotaoIcone";
import { dialogo } from "../ui/estilos";
import { SteeringWheel } from "../ui/SteeringWheel";

type MenuPessoaProps = {
	plano: Plano;
	// quem está com o menu aberto; null fecha
	pessoa: string | null;
	onAcao: (acao: Acao) => void;
	onFechar: () => void;
};

type Destino = {
	para: Local;
	rotulo: string;
	icone: LucideIcon;
	cor: string;
	// lugares livres; na origem não há limite
	livres: number | null;
};

// todos os lugares para onde a pessoa pode ir, na ordem do quadro.
// veículos com motorista também oferecem uma viagem nova
function destinosDe(plano: Plano): Destino[] {
	const origem: Destino = {
		para: naOrigem,
		rotulo: "Origem",
		icone: House,
		cor: "bg-tinta",
		livres: null,
	};
	return [
		origem,
		...plano.veiculos.flatMap((v) => {
			const { icone, cor } = dadosDoTipo(v.limite);
			const varias = v.viagens.length > 1;
			const viagens: Destino[] = v.viagens.map((pessoas, i) => ({
				para: { id: v.id, viagem: i },
				rotulo: varias ? `${v.nome}, ${ordinal(i)}` : v.nome,
				icone,
				cor,
				livres: Plano.capacidade(v, i) - pessoas.length,
			}));
			const nova = v.viagens.length;
			if (plano.podeNovaViagem(v)) {
				viagens.push({
					para: { id: v.id, viagem: nova },
					rotulo: `${v.nome}, ${ordinal(nova)} (nova)`,
					icone,
					cor,
					livres: Plano.capacidade(v, nova),
				});
			}
			return viagens;
		}),
	];
}

// o que aparece à direita de cada destino
function estadoDe(d: Destino, esta: boolean, pode: boolean) {
	if (esta) {
		return "Está aqui";
	}
	if (d.livres === null) {
		return "";
	}
	if (!pode) {
		return d.livres === 0 ? "Cheio" : "Não cabe";
	}
	return `${d.livres} ${plural(d.livres, "livre", "livres")}`;
}

const linha =
	"flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left hover:bg-tinta/5 focus-visible:outline-2 focus-visible:outline-fusca disabled:cursor-default disabled:hover:bg-transparent";

// tudo o que dá para fazer com uma pessoa, num lugar só. no celular abre de baixo para cima
export function MenuPessoa({
	plano,
	pessoa,
	onAcao,
	onFechar,
}: MenuPessoaProps) {
	const dialog = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		if (pessoa && !dialog.current?.open) {
			dialog.current?.showModal();
		}
	}, [pessoa]);

	function fazer(acao: Acao) {
		onAcao(acao);
		dialog.current?.close();
	}

	const p = pessoa ?? "";
	const grupo = plano.grupoDe(p);
	const outros = grupo.filter((x) => x !== p);
	const dirige = plano.motoristas.includes(p);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: o clique é só no fundo; o Esc nativo do dialog cobre o teclado
		<dialog
			ref={dialog}
			aria-labelledby="menu-pessoa-titulo"
			onClose={onFechar}
			// tocar fora fecha; pelo teclado o Esc do próprio dialog já fecha
			onClick={(e) => {
				if (e.target === dialog.current) {
					dialog.current.close();
				}
			}}
			className={`mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-2xl p-0 sm:m-auto sm:w-[min(26rem,calc(100%-2rem))] sm:rounded-2xl ${dialogo}`}
		>
			{pessoa && (
				<div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
					<div className="flex items-start gap-3">
						<div className="min-w-0 flex-1">
							<h2
								id="menu-pessoa-titulo"
								className="text-2xl leading-tight font-extrabold break-words"
							>
								{p}
							</h2>
							{outros.length > 0 && (
								<p className="mt-1 text-tinta/70">
									Vai junto com {juntar(outros)}.
								</p>
							)}
						</div>
						<BotaoIcone
							icone={X}
							rotulo="Fechar"
							onClick={() => dialog.current?.close()}
						/>
					</div>

					<h3 className="mt-5 mb-1 text-sm font-semibold text-tinta/60">
						{outros.length > 0 ? "Levar o grupo para" : "Levar para"}
					</h3>
					<ul>
						{destinosDe(plano).map((d) => {
							const esta = plano.estaEm(p, d.para);
							const pode = plano.podeLevar(grupo, d.para);
							// sem lugar fica apagado; onde a pessoa já está fica normal, só desativado
							const apagado = !esta && !pode;
							return (
								<li key={`${d.para.id}-${d.para.viagem}`}>
									<button
										type="button"
										disabled={!pode}
										onClick={() =>
											fazer({ tipo: "mover", pessoas: grupo, para: d.para })
										}
										className={`${linha} ${apagado ? "text-tinta/40" : ""}`}
									>
										<span
											aria-hidden
											className={`grid size-8 shrink-0 place-items-center rounded-lg text-white ${d.cor} ${apagado ? "opacity-40" : ""}`}
										>
											<d.icone size={17} strokeWidth={2.25} />
										</span>
										<span className="min-w-0 flex-1 font-semibold break-words">
											{d.rotulo}
										</span>
										<span className="flex shrink-0 items-center gap-1 text-sm text-tinta/60">
											{esta && <Check aria-hidden size={16} />}
											{estadoDe(d, esta, pode)}
										</span>
									</button>
								</li>
							);
						})}
					</ul>

					<div className="mt-3 border-t-2 border-tinta/10 pt-3">
						<button
							type="button"
							aria-pressed={dirige}
							onClick={() => fazer({ tipo: "alternarMotorista", pessoa: p })}
							className={linha}
						>
							<SteeringWheel aria-hidden size={20} strokeWidth={2.25} />
							<span className="flex-1 font-semibold">Vai dirigir</span>
							{/* interruptor: mostra o estado atual */}
							<span
								aria-hidden
								className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${dirige ? "bg-tinta" : "bg-tinta/20"}`}
							>
								<span
									className={`size-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${dirige ? "translate-x-4" : ""}`}
								/>
							</span>
						</button>
						{outros.length > 0 && (
							<button
								type="button"
								onClick={() => fazer({ tipo: "sairDoGrupo", pessoa: p })}
								className={linha}
							>
								<Link2Off aria-hidden size={20} />
								<span className="flex-1 font-semibold">Sair do grupo</span>
							</button>
						)}
						<button
							type="button"
							onClick={() => fazer({ tipo: "removerPessoa", pessoa: p })}
							className={`${linha} text-moto`}
						>
							<Trash2 aria-hidden size={20} />
							<span className="flex-1 font-semibold">Remover da lista</span>
						</button>
					</div>
				</div>
			)}
		</dialog>
	);
}
