import { Store } from 'vuex';
import { RootState } from './src/app/root';
// declare module '*.vue' {
//     import { DefineComponent } from "vue";
//     const component: DefineComponent;
//     export default component;
// }

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<RootState>;
  }
}
  
  
declare module 'vue3-treeselect';
// declare module 'chartjs-plugin-error-bars';

export {}  // Important! See note.
// declare module '@vue-leaflet/vue-leaflet';