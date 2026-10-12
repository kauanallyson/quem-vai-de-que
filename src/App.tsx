import { RotateCcw, Route, UserPlus } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { flushSync } from "react-dom";
import { AvisoDesfazer } from "./components/AvisoDesfazer";
import { Estrada } from "./components/Estrada";
import { Quadro } from "./components/quadro/Quadro";
import { Aviso } from "./components/ui/Aviso";
import {
	botaoContorno,
	botaoDestaque,
	botaoPrimario,
	campo,
} from "./components/ui/estilos";
import { carregar, salvar } from "./salvar";
import { juntar, ordinal, plural } from "./texto";
import { LIMITE_PADRAO } from "./veiculo";
import { type Acao, Plano } from "./viagem";

type Desfazer = { texto: string; plano: Plano };

// ações que tiram alguém ou algo do lugar podem ser desfeitas. o texto sai do plano de antes
function textoDesfazer(plano: Plano, acao: Acao) {
	const nome = (id: string) => plano.veiculos.find((v) => v.id === id)?.nome;
	switch (acao.tipo) {
		case "removerPessoa":
			return `${acao.pessoa} saiu da lista.`;
		case "removerVeiculo":
			return `${nome(acao.id)} saiu do plano.`;
		case "removerViagem":
			return `${nome(acao.id)}: ${ordinal(acao.viagem)} removida.`;
		case "voltarTodos":
			return "Todo mundo voltou para a origem.";
		case "agrupar":
			return `${juntar(acao.pessoas)} ${plural(acao.pessoas.length, "vai", "vão")} na mesma viagem que ${acao.a}.`;
		case "sairDoGrupo":
			return `${acao.pessoa} saiu do grupo.`;
		case "mover": {
			// arrastar alguém de dentro de um grupo o tira do grupo
			const parte = plano.grupoDe(acao.pessoas[0]).length > acao.pessoas.length;
			return parte
				? `${juntar(acao.pessoas)} ${plural(acao.pessoas.length, "saiu", "saíram")} do grupo.`
				: null;
		}
		case "editarVeiculo": {
			const voltam = plano.excedentes(acao.id, acao.lugares);
			return voltam.length > 0
				? `${juntar(voltam)} ${plural(voltam.length, "voltou", "voltaram")} para a origem.`
				: null;
		}
		default:
			return null;
	}
}

// anima a mudança de lugar dos cards; sem suporte ou com movimento reduzido, só aplica
function comTransicao(mudar: () => void) {
	const semAnimacao =
		typeof document.startViewTransition !== "function" ||
		matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (semAnimacao) {
		mudar();
		return Promise.resolve();
	}
	return document.startViewTransition(() => flushSync(mudar)).finished;
}

export default function App() {
	const [plano, setPlano] = useState<Plano>(
		() => carregar() ?? Plano.vazio.adicionarVeiculo("Carro 1", LIMITE_PADRAO),
	);
	const [nomes, setNomes] = useState("");
	const [repetidos, setRepetidos] = useState<string[]>([]);
	const [animando, setAnimando] = useState(false);
	const [desfazer, setDesfazer] = useState<Desfazer | null>(null);

	function restaurar(d: Desfazer) {
		comTransicao(() => {
			setPlano(d.plano);
			setDesfazer(null);
		});
	}

	// durante a animação do preenchimento o plano muda a cada embarque; salva só no fim
	useEffect(() => {
		if (!animando) {
			salvar(plano);
		}
	}, [plano, animando]);

	const desfazerPeloTeclado = useEffectEvent(() => {
		if (desfazer) {
			restaurar(desfazer);
		}
	});

	// o aviso de desfazer some sozinho; enquanto aparece, Ctrl+Z também desfaz
	useEffect(() => {
		if (!desfazer) {
			return;
		}
		const tempo = setTimeout(() => setDesfazer(null), 8000);
		function atalho(e: KeyboardEvent) {
			const digitando = e.target instanceof HTMLInputElement;
			if ((e.ctrlKey || e.metaKey) && e.key === "z" && !digitando) {
				e.preventDefault();
				desfazerPeloTeclado();
			}
		}
		addEventListener("keydown", atalho);
		return () => {
			clearTimeout(tempo);
			removeEventListener("keydown", atalho);
		};
	}, [desfazer]);

	const pessoas = plano.pessoas;
	const faltam = plano.faltamLugares;
	const semVeiculo = plano.veiculos.length === 0;

	// devolve se o plano mudou
	function agir(acao: Acao) {
		const novo = plano.executar(acao);
		if (novo === plano) {
			return false;
		}
		const texto = textoDesfazer(plano, acao);
		setPlano(novo);
		setDesfazer(texto ? { texto, plano } : null);
		return true;
	}

	// mostra a solução do algoritmo embarque por embarque, com os cards voando até os veículos
	async function preencher() {
		const antes = plano;
		const passos = plano.planejarEmbarques();
		setDesfazer(null);
		setAnimando(true);
		for (const passo of passos) {
			await comTransicao(() => setPlano((atual) => atual.aplicar(passo)));
		}
		setAnimando(false);
		if (passos.length > 0) {
			setDesfazer({ texto: "Veículos preenchidos.", plano: antes });
		}
	}

	// aceita vários nomes de uma vez, separados por vírgula; quem tem que ir junto vai com +
	// ("Fulano + Ciclano, Beltrano"). com +, quem já está na lista entra no grupo
	function enviarNomes(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();
		const lista = nomes
			.split(/[,;]/)
			.map((u) =>
				u
					.split("+")
					.map((n) => n.trim())
					.filter(Boolean),
			)
			.filter((u) => u.length > 0);
		setRepetidos(
			lista.flatMap((u) => (u.length === 1 && pessoas.includes(u[0]) ? u : [])),
		);
		if (agir({ tipo: "adicionarPessoas", unidades: lista })) {
			setNomes("");
		}
	}

	return (
		// no computador a página tem a altura da tela e não rola; só a área dos veículos rola,
		// quando há muitos. no celular a página rola normalmente
		<main className="flex min-h-dvh flex-col bg-ceu font-sans text-tinta lg:h-dvh lg:overflow-hidden">
			<div
				inert={animando}
				// embaixo, o espaço da estrada fixa
				className="mx-auto flex w-full max-w-[96rem] flex-col px-4 pt-5 pb-[calc(var(--altura-estrada)+0.25rem)] sm:px-6 sm:pt-6 lg:min-h-0 lg:flex-1 lg:px-8 lg:pb-[calc(var(--altura-estrada)+1rem)]"
			>
				<header>
					<h1 className="text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">
						Quem vai de quê?
					</h1>
					<p
						id="instrucoes"
						className="mt-2 max-w-prose text-pretty text-tinta/70 sm:text-lg"
					>
						Escreva os nomes separados por vírgula, com + para quem vai junto.
						Depois toque ou arraste cada nome para um veículo.
					</p>
				</header>

				{/* à esquerda, quem vai; à direita, o que se faz com o plano, terminando na ação principal */}
				<div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
					<form
						onSubmit={enviarNomes}
						className="flex min-w-0 flex-1 basis-full gap-2 sm:max-w-xl sm:basis-80"
					>
						<input
							value={nomes}
							onChange={(e) => {
								setNomes(e.target.value);
								setRepetidos([]);
							}}
							placeholder="Fulano + Ciclano, Beltrano"
							aria-label="Nomes de quem vai"
							aria-describedby="instrucoes nomes-repetidos"
							className={`${campo} min-w-0 flex-1`}
						/>
						<button type="submit" className={botaoPrimario}>
							<UserPlus aria-hidden size={18} />
							<span className="sr-only sm:not-sr-only">Adicionar</span>
						</button>
					</form>
					<div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
						<button
							type="button"
							onClick={() => comTransicao(() => agir({ tipo: "voltarTodos" }))}
							disabled={plano.estaTudoNaOrigem}
							className={`${botaoContorno} flex-1 sm:flex-none`}
						>
							<RotateCcw aria-hidden size={18} />
							Recomeçar
						</button>
						<button
							type="button"
							onClick={preencher}
							disabled={semVeiculo || plano.origem.length === 0}
							className={`${botaoDestaque} flex-1 sm:flex-none`}
						>
							<Route aria-hidden size={18} />
							Preencher veículos
						</button>
					</div>
				</div>

				<div id="nomes-repetidos" aria-live="polite">
					{repetidos.length > 0 && (
						<Aviso>
							{juntar(repetidos)} já {plural(repetidos.length, "está", "estão")}{" "}
							na lista.
						</Aviso>
					)}
				</div>
				{plano.origem.length > 0 && semVeiculo && (
					<Aviso>Adicione um veículo para levar o pessoal.</Aviso>
				)}
				{!semVeiculo && faltam > 0 && (
					<Aviso>
						{plural(faltam, "Falta", "Faltam")} {faltam}{" "}
						{plural(faltam, "lugar", "lugares")} para levar todo mundo.
						{plano.motoristas.length > 0
							? " Preencher veículos planeja mais viagens."
							: " Marque um motorista para os veículos fazerem mais viagens."}
					</Aviso>
				)}

				<Quadro plano={plano} onAcao={agir} />
			</div>

			<Estrada />

			<AvisoDesfazer
				texto={desfazer?.texto ?? null}
				onDesfazer={() => desfazer && restaurar(desfazer)}
				onFechar={() => setDesfazer(null)}
			/>
		</main>
	);
}
