import { createApp } from "vue";
import {store} from "./main"
import Stepper from "./components/Stepper.vue";
import Projects from "./components/projects/Projects.vue";
import Accessibility from "./components/Accessibility.vue";
import Privacy from "./components/Privacy.vue";
import {createRouter, createWebHashHistory, NavigationGuardNext} from "vue-router";
import Hint from "./Hint.vue"
import "../scss/style.scss"
import "leaflet/dist/leaflet.css"
import translate from "./directives/translate";
import FloatingVue from "floating-vue";
import 'floating-vue/dist/style.css';

// export const beforeEnter = (to: Route, from: Route, next: NavigationGuardNext) => {
//     if (store.state.currentUser === "guest" && !sessionStorage.getItem("asGuest")) {
//         window.location.assign("/login");
//     } else {
//         next();
//     }
// }

const mountEl = document.querySelector("#app");

const routes = [
    {
        path: "/",
        component: Stepper,
        // beforeEnter
    },
    {path: "/accessibility", component: Accessibility},
    {path: "/privacy", component: Privacy},
    {path: "/projects", component: Projects}
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

const app = createApp(Hint, {...(mountEl as HTMLDivElement).dataset});

// TODO dis-disable warnings after most of the warnings have been fixed
// TODO comment this warn handler out if you dare
app.config.warnHandler = () => null;

app.use(store);
app.use(router);
app.use(FloatingVue);

app.directive("translate", translate(store));
app.config.globalProperties.$store = store;

app.mount('#app');

export default app;
