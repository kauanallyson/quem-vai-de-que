import { describe, expect, test } from "bun:test";
import { ORIGEM, Plano } from "./viagem";

function plano(
	lugares: number[],
	pessoas: string[],
	motoristas: string[] = [],
) {
	let p = Plano.vazio.adicionarPessoas(pessoas);
	lugares.forEach((n, i) => {
		p = p.adicionarVeiculo(`V${i + 1}`, n);
	});
	return Plano.de({ ...p.toJSON(), motoristas });
}

const ids = (p: Plano) => p.veiculos.map((v) => v.id);
const preencher = (p: Plano) =>
	p.planejarEmbarques().reduce((q, passo) => q.aplicar(passo), p);

describe("pessoas", () => {
	test("ignora nomes vazios e repetidos", () => {
		const p = Plano.vazio.adicionarPessoas(["Ana", " Ana ", "", "Bia", "Ana"]);
		expect(p.origem).toEqual(["Ana", "Bia"]);
		expect(p.adicionarPessoas(["Bia"])).toBe(p);
	});

	test("remover tira a pessoa de onde estiver e da lista de motoristas", () => {
		const p = plano([4], ["Ana", "Bia"], ["Ana"]);
		const [carro] = ids(p);
		const depois = p
			.mover("Ana", { id: carro, viagem: 0 })
			.removerPessoa("Ana");
		expect(depois.veiculos[0].viagens).toEqual([[]]);
		expect(depois.motoristas).toEqual([]);
	});
});

describe("mover", () => {
	test("não passa da capacidade", () => {
		const p = plano([1], ["Ana", "Bia"]);
		const para = { id: ids(p)[0], viagem: 0 };
		const depois = p.mover("Ana", para);
		expect(depois.podeMover("Bia", para)).toBe(false);
		expect(depois.mover("Bia", para)).toBe(depois);
	});

	test("nova viagem só com motorista e lugar sobrando", () => {
		const p = plano([3, 1], ["Ana", "Bia"], ["Ana"]);
		const [carro, moto] = ids(p);
		const nova = { id: carro, viagem: 1 };
		expect(p.podeMover("Bia", nova)).toBe(false);
		const comMotorista = p.mover("Ana", { id: carro, viagem: 0 });
		expect(comMotorista.podeMover("Bia", nova)).toBe(true);
		// moto de um lugar: quem dirige não tem como voltar com alguém
		const naMoto = p.mover("Ana", { id: moto, viagem: 0 });
		expect(naMoto.podeMover("Bia", { id: moto, viagem: 1 })).toBe(false);
	});

	test("da 2ª viagem em diante o motorista que volta ocupa um lugar", () => {
		const p = plano([3], ["Ana", "B", "C", "D"], ["Ana"]);
		const [carro] = ids(p);
		let q = p.mover("Ana", { id: carro, viagem: 0 }).adicionarViagem(carro);
		q = q.mover("B", { id: carro, viagem: 1 });
		q = q.mover("C", { id: carro, viagem: 1 });
		expect(q.podeMover("D", { id: carro, viagem: 1 })).toBe(false);
		const segunda = q.ocupacao(q.veiculos[0]).viagens[1];
		expect(segunda).toMatchObject({ ocupados: 3, cheio: true, volta: "Ana" });
	});
});

describe("devolver para a origem", () => {
	test("remover veículo, remover viagem e recomeçar não perdem ninguém", () => {
		let p = plano([2, 2], ["A", "B", "C", "D"], ["A"]);
		const [v1, v2] = ids(p);
		p = preencher(p.adicionarViagem(v1));
		const total = (q: Plano) =>
			q.origem.length + q.veiculos.flatMap((v) => v.viagens.flat()).length;

		expect(total(p.removerViagem(v1, 1))).toBe(4);
		expect(total(p.removerVeiculo(v2))).toBe(4);
		expect(p.voltarTodos().origem.sort()).toEqual(["A", "B", "C", "D"]);
	});

	test("a primeira viagem não pode ser removida", () => {
		const p = plano([2], ["A"]);
		expect(p.removerViagem(ids(p)[0], 0)).toBe(p);
	});
});

describe("editar veículo", () => {
	test("muda nome e lugares; sem mudança devolve o mesmo plano", () => {
		const p = plano([4], []);
		const [carro] = ids(p);
		const depois = p.editarVeiculo(carro, " Gol ", 6);
		expect(depois.veiculos[0]).toMatchObject({ nome: "Gol", limite: 6 });
		expect(depois.editarVeiculo(carro, "Gol", 6)).toBe(depois);
		expect(p.editarVeiculo(carro, "  ", 4)).toBe(p);
	});

	test("com menos lugares, os últimos voltam para a origem e o motorista fica", () => {
		let p = plano([4], ["A", "B", "C", "Dani"], ["Dani"]);
		const [carro] = ids(p);
		for (const n of ["A", "B", "C", "Dani"]) {
			p = p.mover(n, { id: carro, viagem: 0 });
		}
		const depois = p.editarVeiculo(carro, "V1", 2);
		expect(depois.veiculos[0].viagens).toEqual([["A", "Dani"]]);
		expect(depois.origem).toEqual(["B", "C"]);
	});

	test("grupo que não cabe sai inteiro", () => {
		let p = plano([4], ["A", "B", "C"]).agrupar("B", "C");
		const [carro] = ids(p);
		p = p.mover("A", { id: carro, viagem: 0 }).mover("B", {
			id: carro,
			viagem: 0,
		});
		const depois = p.editarVeiculo(carro, "V1", 2);
		expect(depois.veiculos[0].viagens).toEqual([["A"]]);
		expect(depois.origem).toEqual(["B", "C"]);
	});

	test("com um lugar só, as viagens extras somem e ninguém se perde", () => {
		const p = preencher(plano([3], ["Ana", "B", "C", "D", "E"], ["Ana"]));
		const [carro] = ids(p);
		const depois = p.editarVeiculo(carro, "V1", 1);
		expect(depois.veiculos[0].viagens).toEqual([["Ana"]]);
		expect(depois.origem.toSorted()).toEqual(["B", "C", "D", "E"]);
	});
});

describe("excedentes", () => {
	test("diz quem volta para a origem sem mudar o plano", () => {
		let p = plano([4], ["A", "B", "Dani"], ["Dani"]);
		const [carro] = ids(p);
		for (const n of ["A", "B", "Dani"]) {
			p = p.mover(n, { id: carro, viagem: 0 });
		}
		expect(p.excedentes(carro, 2)).toEqual(["B"]);
		expect(p.excedentes(carro, 4)).toEqual([]);
		expect(p.editarVeiculo(carro, "V1", 2).origem).toEqual(["B"]);
	});
});

describe("planejarEmbarques", () => {
	test("cada veículo recebe um motorista e ninguém fica vazio", () => {
		const p = preencher(plano([4, 4], ["P1", "P2", "M1", "M2"], ["M1", "M2"]));
		for (const v of p.veiculos) {
			expect(p.ocupacao(v).aviso).toBeNull();
		}
		expect(p.origem).toEqual([]);
	});

	test("com motorista, faz mais viagens até levar todo mundo", () => {
		const nomes = ["M", "A", "B", "C", "D", "E", "F"];
		const p = preencher(plano([3], nomes, ["M"]));
		// 1ª: 3 lugares; depois 2 por viagem (o motorista volta)
		expect(p.veiculos[0].viagens.map((v) => v.length)).toEqual([3, 2, 2]);
		expect(p.origem).toEqual([]);
		expect(p.faltamLugares).toBe(0);
	});

	test("sem motorista, quem não cabe fica na origem", () => {
		const p = preencher(plano([2], ["A", "B", "C"]));
		expect(p.veiculos[0].viagens).toEqual([["A", "B"]]);
		expect(p.origem).toEqual(["C"]);
	});

	test("quem já está num veículo continua onde está", () => {
		const base = plano([3, 3], ["A", "B", "C"]);
		const [, v2] = ids(base);
		const p = preencher(base.mover("A", { id: v2, viagem: 0 }));
		expect(p.veiculos[1].viagens[0][0]).toBe("A");
	});

	test("os embarques nunca saem da origem para outro lugar", () => {
		const p = plano([2, 5], ["M", "A", "B", "C", "D", "E", "F", "G"], ["M"]);
		for (const passo of p.planejarEmbarques()) {
			expect(passo.para.id).not.toBe(ORIGEM);
			expect(passo.pessoas.every((x) => p.origem.includes(x))).toBe(true);
		}
	});
});

describe("grupos", () => {
	const local = (p: Plano, pessoa: string) =>
		p.veiculos.findIndex((v) => v.viagens.flat().includes(pessoa));

	test("quem entra no grupo vai para onde a outra pessoa está", () => {
		let p = plano([4], ["Ana", "Bia"]);
		p = p.mover("Ana", { id: ids(p)[0], viagem: 0 });
		p = p.agrupar("Ana", "Bia");
		expect(p.veiculos[0].viagens[0]).toEqual(["Ana", "Bia"]);
	});

	test("se não couber, o grupo inteiro volta para a origem", () => {
		let p = plano([1], ["Ana", "Bia"]);
		p = p.mover("Ana", { id: ids(p)[0], viagem: 0 }).agrupar("Ana", "Bia");
		expect(p.origem.sort()).toEqual(["Ana", "Bia"]);
	});

	test("mover um leva o grupo; se o grupo não cabe, ninguém se move", () => {
		let p = plano([2, 1], ["Ana", "Bia", "Caio"]).agrupar("Ana", "Bia");
		const [carro, moto] = ids(p);
		expect(p.podeMover("Bia", { id: moto, viagem: 0 })).toBe(false);
		p = p.mover("Bia", { id: carro, viagem: 0 });
		expect(p.veiculos[0].viagens[0].sort()).toEqual(["Ana", "Bia"]);
		expect(
			p.aplicar({ pessoas: ["Ana"], para: { id: ORIGEM, viagem: 0 } }),
		).toBe(p);
	});

	test("+ no formulário cria grupo, inclusive com quem já estava", () => {
		let p = Plano.vazio.executar({
			tipo: "adicionarPessoas",
			unidades: [["Ana"]],
		});
		p = p.executar({
			tipo: "adicionarPessoas",
			unidades: [["Bia", "Ana"], ["Caio"]],
		});
		expect(p.grupos).toEqual([["Bia", "Ana"]]);
		expect(p.origem).toEqual(["Ana", "Bia", "Caio"]);
	});

	test("remover alguém de um grupo de dois desfaz o grupo", () => {
		const p = plano([3], ["Ana", "Bia"]).agrupar("Ana", "Bia");
		expect(p.removerPessoa("Ana").grupos).toEqual([]);
	});

	test("sair do grupo leva só a pessoa; quem fica continua junto", () => {
		let p = plano([4, 4], ["Ana", "Bia", "Caio"]);
		p = p.agrupar("Ana", "Bia").agrupar("Ana", "Caio");
		const [, outro] = ids(p);
		const para = { id: outro, viagem: 0 };
		expect(p.podeLevar(["Caio"], para)).toBe(true);
		const depois = p.levar(["Caio"], para);
		expect(depois.grupos).toEqual([["Ana", "Bia"]]);
		expect(depois.veiculos[1].viagens[0]).toEqual(["Caio"]);
		expect(depois.origem).toEqual(["Ana", "Bia"]);
	});

	test("sair de um grupo de dois desfaz o grupo; soltar no mesmo lugar só desagrupa", () => {
		const p = plano([4], ["Ana", "Bia"]).agrupar("Ana", "Bia");
		const origem = { id: ORIGEM, viagem: 0 };
		expect(p.podeLevar(["Bia"], origem)).toBe(true);
		const depois = p.levar(["Bia"], origem);
		expect(depois.grupos).toEqual([]);
		expect(depois.origem).toEqual(["Ana", "Bia"]);
		expect(p.sairDoGrupo("Bia")).toMatchObject({ grupos: [] });
		expect(depois.sairDoGrupo("Bia")).toBe(depois);
		// o grupo inteiro no mesmo lugar não muda nada
		expect(p.podeLevar(["Ana", "Bia"], origem)).toBe(false);
	});

	test("soltar alguém do grupo em cima de outra pessoa troca de grupo", () => {
		let p = plano([4], ["Ana", "Bia", "Caio"]).agrupar("Ana", "Bia");
		p = p.executar({ tipo: "agrupar", a: "Caio", pessoas: ["Bia"] });
		expect(p.grupos).toEqual([["Caio", "Bia"]]);
	});

	test("preencher nunca separa um grupo", () => {
		let p = plano([4, 3], ["M1", "A", "B", "C", "D", "M2"], ["M1", "M2"]);
		p = p.agrupar("B", "C").agrupar("B", "D");
		const final = preencher(p);
		expect(new Set(["B", "C", "D"].map((x) => local(final, x))).size).toBe(1);
		expect(final.origem).toEqual([]);
		// o grupo grande entra primeiro e ninguém precisa de 2ª viagem
		expect(final.veiculos.map((v) => v.viagens.length)).toEqual([1, 1]);
	});

	test("grupo maior que qualquer viagem fica na origem e o algoritmo termina", () => {
		let p = plano([2], ["M", "A", "B", "C"], ["M"]);
		p = p.agrupar("A", "B").agrupar("A", "C");
		expect(preencher(p).origem.sort()).toEqual(["A", "B", "C"]);
	});
});
