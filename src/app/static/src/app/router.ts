import {createRouter, createWebHashHistory, RouteLocationNormalized} from "vue-router";
import Stepper from "./components/Stepper.vue";
import Accessibility from "./components/Accessibility.vue";
import Privacy from "./components/Privacy.vue";
import Projects from "./components/projects/Projects.vue";
import {store} from "./main";

export const beforeEnter = (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    if (store.state.currentUser === "guest" && !sessionStorage.getItem("asGuest")) {
        return {name: 'login'};
        // window.location.assign("/login");
    }
    return true;
}

const routes = [
    {
        path: "/",
        component: Stepper,
        beforeEnter
    },
    {path: "/accessibility", component: Accessibility},
    {path: "/privacy", component: Privacy},
    {path: "/projects", component: Projects}
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
});
