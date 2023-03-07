// src/vue-shims.d.ts
// import * as runtimeCore from '@vue/runtime-core'

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}
// src/shims-runtime-core.d.ts

// declare module '@vue/runtime-core' {
//   interface ComponentCustomProperties {
//     $refs: {
//       [key: string]: HTMLElement|any,
//     },
//     // ... more stuff
//   }
// }
// declare module "@vue/runtime-core" {
//   interface ComponentCustomProperties {
//     $store: Store<State>;
//   }
// }

// declare module "vue3-treeselect";
// declare module 'chartjs-plugin-error-bars';
declare module '@reside-ic/vue-charts';
