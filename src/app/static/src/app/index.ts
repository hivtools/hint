import { createApp } from "vue";
import {store} from "./main"
// import {router} from "./router";
// import UserHeader from "./components/header/UserHeader.vue";
// import Errors from "./components/Errors.vue";
import Stepper from "./components/Stepper.vue";
import Projects from "./components/projects/Projects.vue";
import Accessibility from "./components/Accessibility.vue";
import Privacy from "./components/Privacy.vue";
// import {mapActions, mapState} from "vuex";
// import {RootState} from "./root";
import {createRouter, createWebHashHistory, NavigationGuardNext} from "vue-router";
// import {Route} from "vue-router/types/router";
// import {Language} from "./store/translations/locales";
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

const app = createApp(Hint);

// TODO dis-disable warnings after most of the warnings have been fixed
// TODO comment this warn handler out if you dare
app.config.warnHandler = () => null;

app.use(store);
app.use(router);

const options = {
    distance: 12,
    themes: {
        'tooltip': {
            html: true,
            delay: {
                show: 0,
                hide: 0,
            },
        },
    }
}

app.use(FloatingVue, options);

app.directive("translate", translate(store));
app.config.globalProperties.$store = store;

app.mount('#app');

export default app;
