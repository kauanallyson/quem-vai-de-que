// o plano: quem ainda está na origem, os veículos com suas viagens e quem vai dirigir.
// é imutável: todo método que muda algo devolve outro plano; se a mudança não faz sentido,
// devolve o mesmo (o React compara pela referência).
// invariantes: nomes únicos; cada pessoa está num lugar só; motoristas são pessoas do plano;
// todo veículo tem pelo menos uma viagem; quem é do mesmo grupo está sempre na mesma viagem.

export const ORIGEM = "origem";

export type Veiculo = {
	id: string;
	nome: string;
	limite: number;
	viagens: string[][];
};

// o que se guarda; o resto é calculado
export type DadosPlano = {
	origem: string[];
	veiculos: Veiculo[];
	motoristas: string[];
	// pessoas que têm que ir juntas; cada grupo tem duas ou mais
	grupos: string[][];
};

// na origem a viagem é sempre 0
export type Local = { id: string; viagem: number };

// um embarque: um grupo de pessoas vai para um local. é o único jeito de alguém mudar de lugar
export type Passo = { pessoas: string[]; para: Local };

export type Vaga = Local & { pessoas: string[]; total: number; livres: number };

export type Ocupacao = {
	aviso: "vazio" | "semMotorista" | null;
	viagens: {
		pessoas: string[];
		// inclui o lugar do motorista que volta para buscar
		ocupados: number;
		cheio: boolean;
		volta: string | null;
		// de quem é o primeiro lugar: do motorista (1ª viagem) ou de quem volta para buscar
		primeiro: "motorista" | "volta" | null;
	}[];
};

export type Acao =
	// cada unidade é uma pessoa ou um grupo que vai junto
	| { tipo: "adicionarPessoas"; unidades: string[][] }
	| { tipo: "removerPessoa"; pessoa: string }
	| { tipo: "alternarMotorista"; pessoa: string }
	// pessoas: um grupo inteiro, ou só parte dele (aí elas saem do grupo)
	| { tipo: "mover"; pessoas: string[]; para: Local }
	| { tipo: "adicionarVeiculo"; nome: string; lugares: number }
	| { tipo: "editarVeiculo"; id: string; nome: string; lugares: number }
	| { tipo: "removerVeiculo"; id: string }
	| { tipo: "adicionarViagem"; id: string }
	| { tipo: "removerViagem"; id: string; viagem: number }
	| { tipo: "voltarTodos" }
	// as pessoas passam a ir junto com a; se eram só parte de um grupo, saem dele
	| { tipo: "agrupar"; a: string; pessoas: string[] }
	| { tipo: "sairDoGrupo"; pessoa: string };

export const naOrigem: Local = { id: ORIGEM, viagem: 0 };

// número de lugares digitado: inteiro, pelo menos 1; vazio ou inválido vira o padrão
export const lugaresValidos = (lugares: number, padrao = 1) =>
	Math.max(1, Math.floor(lugares) || padrao);

function mesmoLugar(a: Local | null, b: Local) {
	return a?.id === b.id && (b.id === ORIGEM || a.viagem === b.viagem);
}

export class Plano implements DadosPlano {
	static readonly vazio = new Plano({
		origem: [],
		veiculos: [],
		motoristas: [],
		grupos: [],
	});

	readonly origem: string[];
	readonly veiculos: Veiculo[];
	readonly motoristas: string[];
	readonly grupos: string[][];

	// o plano não muda, então o que é caro de calcular pode ficar guardado
	private cachePessoas?: string[];
	private cacheVagas?: Vaga[];

	private constructor(dados: DadosPlano) {
		this.origem = dados.origem;
		this.veiculos = dados.veiculos;
		this.motoristas = dados.motoristas;
		this.grupos = dados.grupos;
	}

	static de(dados: DadosPlano) {
		return new Plano(dados);
	}

	toJSON(): DadosPlano {
		const { origem, veiculos, motoristas, grupos } = this;
		return { origem, veiculos, motoristas, grupos };
	}

	private com(mudanca: Partial<DadosPlano>) {
		return new Plano({ ...this.toJSON(), ...mudanca });
	}

	private veiculo(id: string) {
		return this.veiculos.find((v) => v.id === id);
	}

	private atualizar(id: string, mudar: (v: Veiculo) => Veiculo) {
		return this.com({
			veiculos: this.veiculos.map((v) => (v.id === id ? mudar(v) : v)),
		});
	}

	// --- consultas ---

	get pessoas() {
		this.cachePessoas ??= [
			...this.origem,
			...this.veiculos.flatMap((v) => v.viagens.flat()),
		];
		return this.cachePessoas;
	}

	// quem vai sempre junto com a pessoa, incluindo ela
	grupoDe(pessoa: string) {
		return this.grupos.find((g) => g.includes(pessoa)) ?? [pessoa];
	}

	// divide as pessoas em unidades que se movem juntas, na ordem em que aparecem
	unidades(pessoas: string[]) {
		const vistas = new Set<string>();
		const lista: string[][] = [];
		for (const p of pessoas) {
			if (!vistas.has(p)) {
				const unidade = this.grupoDe(p).filter((x) => pessoas.includes(x));
				for (const x of unidade) {
					vistas.add(x);
				}
				lista.push(unidade);
			}
		}
		return lista;
	}

	estaEm(pessoa: string, local: Local) {
		return mesmoLugar(this.ondeEsta(pessoa), local);
	}

	ondeEsta(pessoa: string): Local | null {
		if (this.origem.includes(pessoa)) {
			return naOrigem;
		}
		for (const v of this.veiculos) {
			const viagem = v.viagens.findIndex((g) => g.includes(pessoa));
			if (viagem >= 0) {
				return { id: v.id, viagem };
			}
		}
		return null;
	}

	// da segunda viagem em diante o motorista volta para buscar e ocupa um lugar
	static capacidade(v: Pick<Veiculo, "limite">, viagem: number) {
		return viagem === 0 ? v.limite : v.limite - 1;
	}

	// num veículo, basta um motorista estar na primeira viagem
	motoristaDe(v: Veiculo) {
		return v.viagens[0]?.find((p) => this.motoristas.includes(p)) ?? null;
	}

	// mais uma viagem só existe se alguém dirige e volta, e se sobra lugar além do dele
	podeNovaViagem(v: Veiculo) {
		return !!this.motoristaDe(v) && Plano.capacidade(v, 1) > 0;
	}

	// todas as viagens de veículo com lugar sobrando, na ordem: 1ª viagem de todos, depois 2ª...
	get vagas(): Vaga[] {
		this.cacheVagas ??= this.veiculos
			.flatMap((v) =>
				v.viagens.map((pessoas, viagem) => {
					const total = Plano.capacidade(v, viagem);
					return {
						id: v.id,
						viagem,
						pessoas,
						total,
						livres: total - pessoas.length,
					};
				}),
			)
			.filter((vaga) => vaga.livres > 0)
			.sort((a, b) => a.viagem - b.viagem);
		return this.cacheVagas;
	}

	get lugaresLivres() {
		return this.vagas.reduce((soma, vaga) => soma + vaga.livres, 0);
	}

	get faltamLugares() {
		return Math.max(0, this.origem.length - this.lugaresLivres);
	}

	get estaTudoNaOrigem() {
		return this.veiculos.every(
			(v) => v.viagens.length === 1 && v.viagens[0].length === 0,
		);
	}

	ocupacao(v: Veiculo): Ocupacao {
		const motorista = this.motoristaDe(v);
		return {
			aviso:
				v.viagens[0].length === 0 ? "vazio" : motorista ? null : "semMotorista",
			viagens: v.viagens.map((pessoas, i) => ({
				pessoas,
				ocupados: pessoas.length + v.limite - Plano.capacidade(v, i),
				cheio: pessoas.length >= Plano.capacidade(v, i),
				volta: i > 0 ? motorista : null,
				primeiro: i > 0 ? "volta" : motorista ? "motorista" : null,
			})),
		};
	}

	// a viagem de destino pode ser uma que ainda não existe, logo depois da última,
	// se o veículo puder fazer mais uma. um grupo só se move inteiro
	private cabe({ pessoas, para }: Passo) {
		const todos = this.pessoas;
		const inteiros = pessoas.every((p) =>
			this.grupoDe(p).every((x) => pessoas.includes(x)),
		);
		if (
			pessoas.length === 0 ||
			!inteiros ||
			!pessoas.every((p) => todos.includes(p))
		) {
			return false;
		}
		if (para.id === ORIGEM) {
			return true;
		}
		const v = this.veiculo(para.id);
		if (!v || para.viagem < 0 || para.viagem > v.viagens.length) {
			return false;
		}
		if (para.viagem === v.viagens.length && !this.podeNovaViagem(v)) {
			return false;
		}
		const ficam = (v.viagens[para.viagem] ?? []).filter(
			(p) => !pessoas.includes(p),
		);
		return ficam.length + pessoas.length <= Plano.capacidade(v, para.viagem);
	}

	// levar pessoas para um lugar. se forem só parte de um grupo, elas saem dele; aí soltar
	// no mesmo lugar vale, porque só desfaz a ligação
	podeLevar(pessoas: string[], para: Local) {
		if (pessoas.length === 0) {
			return false;
		}
		const solto = this.tirarDoGrupo(pessoas);
		if (this.estaEm(pessoas[0], para)) {
			return solto !== this;
		}
		return solto.cabe({ pessoas, para });
	}

	// mover alguém leva junto o grupo inteiro
	podeMover(pessoa: string, para: Local) {
		return this.podeLevar(this.grupoDe(pessoa), para);
	}

	// --- mudanças ---

	aplicar(passo: Passo): Plano {
		if (!this.cabe(passo)) {
			return this;
		}
		const { pessoas, para } = passo;
		const sem = (grupo: string[]) => grupo.filter((p) => !pessoas.includes(p));
		const origem = sem(this.origem);
		return this.com({
			origem: para.id === ORIGEM ? [...origem, ...pessoas] : origem,
			veiculos: this.veiculos.map((v) => {
				const viagens = v.viagens.map(sem);
				if (v.id !== para.id) {
					return { ...v, viagens };
				}
				if (para.viagem === viagens.length) {
					viagens.push([]);
				}
				viagens[para.viagem] = [...viagens[para.viagem], ...pessoas];
				return { ...v, viagens };
			}),
		});
	}

	levar(pessoas: string[], para: Local) {
		if (!this.podeLevar(pessoas, para)) {
			return this;
		}
		const solto = this.tirarDoGrupo(pessoas);
		return this.estaEm(pessoas[0], para)
			? solto
			: solto.aplicar({ pessoas, para });
	}

	mover(pessoa: string, para: Local) {
		return this.levar(this.grupoDe(pessoa), para);
	}

	// nomes vazios ou repetidos são ignorados
	adicionarPessoas(nomes: string[]) {
		const existentes = this.pessoas;
		const novos: string[] = [];
		for (const nome of nomes.map((n) => n.trim())) {
			if (nome && !existentes.includes(nome) && !novos.includes(nome)) {
				novos.push(nome);
			}
		}
		return novos.length > 0
			? this.com({ origem: [...this.origem, ...novos] })
			: this;
	}

	removerPessoa(pessoa: string) {
		const sem = (grupo: string[]) => grupo.filter((p) => p !== pessoa);
		return this.com({
			origem: sem(this.origem),
			veiculos: this.veiculos.map((v) => ({
				...v,
				viagens: v.viagens.map(sem),
			})),
			motoristas: sem(this.motoristas),
			grupos: this.grupos.map(sem).filter((g) => g.length > 1),
		});
	}

	// b passa a ir sempre junto com a: o grupo de b vai para onde a está, se couber;
	// se não couber, os dois grupos voltam juntos para a origem
	agrupar(a: string, b: string) {
		const todos = this.pessoas;
		const doA = this.grupoDe(a);
		if (!todos.includes(a) || !todos.includes(b) || doA.includes(b)) {
			return this;
		}
		const doB = this.grupoDe(b);
		const junto = [...doA, ...doB];
		const para = this.ondeEsta(a) as Local;
		let lugar: Plano = this;
		if (!mesmoLugar(this.ondeEsta(b), para)) {
			lugar = this.aplicar({ pessoas: doB, para });
			if (lugar === this) {
				lugar = this.aplicar({ pessoas: junto, para: naOrigem });
			}
		}
		return lugar.com({
			grupos: [
				...this.grupos.filter((g) => !g.includes(a) && !g.includes(b)),
				junto,
			],
		});
	}

	// as pessoas deixam os grupos dos quais são só uma parte; quem fica continua junto.
	// um grupo levado inteiro não muda. grupo de um deixa de ser grupo
	private tirarDoGrupo(pessoas: string[]) {
		const parte = (g: string[]) =>
			g.some((p) => pessoas.includes(p)) &&
			!g.every((p) => pessoas.includes(p));
		if (!this.grupos.some(parte)) {
			return this;
		}
		return this.com({
			grupos: this.grupos
				.map((g) => (parte(g) ? g.filter((p) => !pessoas.includes(p)) : g))
				.filter((g) => g.length > 1),
		});
	}

	sairDoGrupo(pessoa: string) {
		return this.tirarDoGrupo([pessoa]);
	}

	alternarMotorista(pessoa: string) {
		if (!this.pessoas.includes(pessoa)) {
			return this;
		}
		return this.com({
			motoristas: this.motoristas.includes(pessoa)
				? this.motoristas.filter((p) => p !== pessoa)
				: [...this.motoristas, pessoa],
		});
	}

	// todo mundo volta para a origem; os veículos ficam, com uma viagem vazia
	voltarTodos() {
		return this.com({
			origem: this.pessoas,
			veiculos: this.veiculos.map((v) => ({ ...v, viagens: [[]] })),
		});
	}

	adicionarVeiculo(nome: string, lugares: number) {
		return this.com({
			veiculos: [
				...this.veiculos,
				{
					id: crypto.randomUUID(),
					nome: nome.trim(),
					limite: lugaresValidos(lugares),
					viagens: [[]],
				},
			],
		});
	}

	// com esses lugares, como ficam as viagens do veículo e quem não cabe mais:
	// quem entrou por último sai primeiro, motorista fica, grupos saem inteiros.
	// com um lugar só não há como voltar para buscar, então as viagens extras somem
	private reacomodar(v: Veiculo, limite: number) {
		const novo = { ...v, limite };
		const dirige = (u: string[]) => u.some((p) => this.motoristas.includes(p));
		const voltam: string[] = [];
		const viagens = v.viagens
			.map((pessoas, i) => {
				const ficam: string[] = [];
				const fila = this.unidades(pessoas);
				// motorista primeiro; o resto na ordem em que entrou
				for (const u of [
					...fila.filter(dirige),
					...fila.filter((u) => !dirige(u)),
				]) {
					if (ficam.length + u.length <= Plano.capacidade(novo, i)) {
						ficam.push(...u);
					} else {
						voltam.push(...u);
					}
				}
				return pessoas.filter((p) => ficam.includes(p));
			})
			.filter((_, i) => i === 0 || Plano.capacidade(novo, i) > 0);
		return { viagens, voltam };
	}

	// quem volta para a origem se o veículo passar a ter esses lugares
	excedentes(id: string, lugares: number) {
		const v = this.veiculo(id);
		return v ? this.reacomodar(v, lugaresValidos(lugares)).voltam : [];
	}

	// muda o nome e os lugares; com menos lugares, quem não cabe mais volta para a origem
	editarVeiculo(id: string, nome: string, lugares: number) {
		const v = this.veiculo(id);
		if (!v) {
			return this;
		}
		const limpo = nome.trim() || v.nome;
		const limite = lugaresValidos(lugares);
		if (limpo === v.nome && limite === v.limite) {
			return this;
		}
		const { viagens, voltam } = this.reacomodar(v, limite);
		return this.atualizar(id, () => ({
			...v,
			nome: limpo,
			limite,
			viagens,
		})).com({ origem: [...this.origem, ...voltam] });
	}

	// quem estava no veículo volta para a origem
	removerVeiculo(id: string) {
		const v = this.veiculo(id);
		if (!v) {
			return this;
		}
		return this.com({
			origem: [...this.origem, ...v.viagens.flat()],
			veiculos: this.veiculos.filter((outro) => outro.id !== id),
		});
	}

	adicionarViagem(id: string) {
		return this.atualizar(id, (v) => ({ ...v, viagens: [...v.viagens, []] }));
	}

	// quem estava nessa viagem volta para a origem; a primeira viagem não sai
	removerViagem(id: string, viagem: number) {
		const v = this.veiculo(id);
		if (!v || viagem <= 0 || viagem >= v.viagens.length) {
			return this;
		}
		return this.atualizar(id, (v) => ({
			...v,
			viagens: v.viagens.filter((_, i) => i !== viagem),
		})).com({ origem: [...this.origem, ...v.viagens[viagem]] });
	}

	// distribui quem está na origem pelos veículos, de forma gulosa (greedy):
	// 1. cada veículo sem motorista recebe um motorista;
	// 2. nenhum veículo fica sem ninguém;
	// 3. as vagas que já existem são enchidas ao máximo, começando pela que tem mais lugares livres
	//    e pelos grupos maiores;
	// 4. se ainda sobrar gente, veículos com motorista fazem mais viagens em rodadas,
	//    do maior para o menor, cada um levando o máximo que cabe.
	// grupos nunca são separados: entram inteiros ou esperam uma vaga onde caibam.
	// quem já está num veículo continua onde está.
	// devolve os embarques na ordem em que o algoritmo decidiu; aplicados em sequência, dão o plano final.
	planejarEmbarques(): Passo[] {
		let atual: Plano = this;
		const passos: Passo[] = [];
		const comMotorista = (u: string[]) =>
			u.some((p) => this.motoristas.includes(p));
		const fila = this.unidades(this.origem);
		const condutores = fila.filter(comMotorista);
		const passageiros = fila.filter((u) => !comMotorista(u));
		const ids = this.veiculos.map((v) => v.id);
		const veiculo = (id: string) => atual.veiculo(id) as Veiculo;

		// tira da fila, na ordem, as unidades que cabem nos lugares (no máximo `quantas`)
		function tirar(fila: string[][], lugares: number, quantas = Infinity) {
			const levadas: string[] = [];
			for (let i = 0, n = 0; i < fila.length && n < quantas; ) {
				if (levadas.length + fila[i].length <= lugares) {
					levadas.push(...fila.splice(i, 1)[0]);
					n++;
				} else {
					i++;
				}
			}
			return levadas;
		}

		function embarcar(id: string, viagem: number, pessoas: string[]) {
			const passo = { pessoas, para: { id, viagem } };
			const depois = atual.aplicar(passo);
			if (depois !== atual) {
				atual = depois;
				passos.push(passo);
			}
		}

		for (const id of ids) {
			const v = veiculo(id);
			if (!atual.motoristaDe(v)) {
				const livres = Plano.capacidade(v, 0) - v.viagens[0].length;
				embarcar(id, 0, tirar(condutores, livres, 1));
			}
		}

		// grupos maiores primeiro: encaixam enquanto há espaço; quem vai sozinho preenche as sobras
		const resto = [...passageiros, ...condutores].sort(
			(a, b) => b.length - a.length,
		);

		for (const id of ids) {
			const v = veiculo(id);
			if (v.viagens[0].length === 0) {
				embarcar(id, 0, tirar(resto, Plano.capacidade(v, 0), 1));
			}
		}

		for (const vaga of atual.vagas.toSorted((a, b) => b.livres - a.livres)) {
			embarcar(vaga.id, vaga.viagem, tirar(resto, vaga.livres));
		}

		const aptos = ids
			.map(veiculo)
			.filter((v) => atual.podeNovaViagem(v))
			.sort((a, b) => Plano.capacidade(b, 1) - Plano.capacidade(a, 1))
			.map((v) => v.id);
		// para quando ninguém mais cabe: um grupo maior que qualquer viagem fica na origem
		let andou = true;
		while (resto.length > 0 && andou) {
			andou = false;
			for (const id of aptos) {
				const nova = veiculo(id).viagens.length;
				const levadas = tirar(resto, Plano.capacidade(veiculo(id), nova));
				if (levadas.length > 0) {
					embarcar(id, nova, levadas);
					andou = true;
				}
			}
		}

		return passos;
	}

	executar(acao: Acao): Plano {
		switch (acao.tipo) {
			case "adicionarPessoas": {
				// nomes que já estão no plano podem entrar num grupo novo
				let novo = this.adicionarPessoas(acao.unidades.flat());
				for (const [primeiro, ...outros] of acao.unidades) {
					for (const outro of outros) {
						novo = novo.agrupar(primeiro, outro);
					}
				}
				return novo;
			}
			case "removerPessoa":
				return this.removerPessoa(acao.pessoa);
			case "alternarMotorista":
				return this.alternarMotorista(acao.pessoa);
			case "mover":
				return this.levar(acao.pessoas, acao.para);
			case "adicionarVeiculo":
				return this.adicionarVeiculo(acao.nome, acao.lugares);
			case "editarVeiculo":
				return this.editarVeiculo(acao.id, acao.nome, acao.lugares);
			case "removerVeiculo":
				return this.removerVeiculo(acao.id);
			case "adicionarViagem":
				return this.adicionarViagem(acao.id);
			case "removerViagem":
				return this.removerViagem(acao.id, acao.viagem);
			case "voltarTodos":
				return this.voltarTodos();
			case "agrupar": {
				// um grupo inteiro entra com a primeira pessoa; quem era só parte entra um a um
				let novo = this.tirarDoGrupo(acao.pessoas);
				for (const p of acao.pessoas) {
					novo = novo.agrupar(acao.a, p);
				}
				return novo;
			}
			case "sairDoGrupo":
				return this.sairDoGrupo(acao.pessoa);
		}
	}
}
