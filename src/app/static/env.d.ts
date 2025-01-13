/// <reference types="vite/client" />

declare module "vuex" {
  export * from "vuex/types/index.d.ts";
  export * from "vuex/types/helpers.d.ts";
  export * from "vuex/types/logger.d.ts";
  export * from "vuex/types/vue.d.ts";
}

// modules without typings are added here
declare module "vue3-treeselect"
declare module "@reside-ic/vue3-treeselect"
declare module "vue-feather";
declare module "floating-vue";
declare module "@reside-ic/vue-nested-multiselect"
declare module 'zoo-ids';
