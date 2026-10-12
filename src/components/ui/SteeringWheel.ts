import { createLucideIcon } from "lucide-react";

// o lucide não tem volante; este segue o mesmo traço dos outros ícones
export const SteeringWheel = createLucideIcon("steering-wheel", [
	["circle", { cx: "12", cy: "12", r: "10", key: "aro" }],
	["circle", { cx: "12", cy: "12", r: "3", key: "centro" }],
	["path", { d: "M12 15v7", key: "raio-baixo" }],
	["path", { d: "M9 12H2", key: "raio-esquerda" }],
	["path", { d: "M15 12h7", key: "raio-direita" }],
]);
