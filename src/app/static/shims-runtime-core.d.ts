// src/shims-runtime-core.d.ts

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $refs: {
      [key: string]: HTMLElement|any,
    },
    // ... more stuff
  }
}