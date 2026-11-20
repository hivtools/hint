import {AsyncComponentLoader, defineAsyncComponent, h} from "vue";
import LoadingSpinner from "./LoadingSpinner.vue";

// Makes a component that the build puts in a separate file, with the large libraries that only it uses
// (for example Plotly or Leaflet). The browser gets the file when Vue first shows the component.
// If the file takes more than 200 ms to load, a spinner shows until it is loaded.
export const lazyComponent = (loader: AsyncComponentLoader) => defineAsyncComponent({
    loader,
    loadingComponent: {
        name: "LazyComponentLoading",
        render: () => h("div", {class: "text-center"}, h(LoadingSpinner, {size: "sm"}))
    },
    delay: 200
});
