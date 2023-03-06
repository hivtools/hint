// src/vue-shims.d.ts

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}

// declare module "@vue/runtime-core" {
//   interface ComponentCustomProperties {
//     $store: Store<State>;
//   }
// }

// declare module "vue3-treeselect";
// declare module 'chartjs-plugin-error-bars';
declare module '@reside-ic/vue-charts';
