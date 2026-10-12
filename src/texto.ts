export const ordinal = (viagem: number) => `${viagem + 1}ª viagem`;

// "Fulano", "Fulano e Ciclano", "Fulano, Ciclano e Beltrano"
export function juntar(nomes: string[]) {
	return nomes.length < 2
		? nomes.join("")
		: `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

// "1 pessoa", "3 pessoas"; sem número, só escolhe a forma: plural(n, "volta", "voltam")
export function plural(n: number, um: string, varios: string) {
	return n === 1 ? um : varios;
}
