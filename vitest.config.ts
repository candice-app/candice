import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// POURQUOI CE FICHIER EXISTE.
//
// Il n'y en avait pas. `tsconfig.json` déclare l'alias `@/*` → `./src/*`, Next le résout,
// et `tsc` le vérifie — mais vitest, lui, ne le connaissait pas. Conséquence silencieuse :
// tout module de `src/lib` important par `@/` était IMPOSSIBLE à tester. Treize modules
// étaient dans ce cas, dont le lecteur d'entités du journal et le service Discovery. Ils
// compilaient, ils passaient `tsc`, et aucun test ne pouvait les charger : leur absence de
// couverture ne ressemblait pas à un trou, elle ressemblait à un choix.
//
// L'alias est donc déclaré ici, dérivé du MÊME dossier que dans tsconfig, pour que ce qui
// compile soit aussi ce qui s'éprouve.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
