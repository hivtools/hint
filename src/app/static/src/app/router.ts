import {createRouter, createWebHashHistory, RouteLocationNormalized} from "vue-router";
import Stepper from "./components/Stepper.vue";
import Accessibility from "./components/Accessibility.vue";
import Privacy from "./components/Privacy.vue";
import Projects from "./components/projects/Projects.vue";
import {store, storeDataExploration} from "./main";
import DataExploration from "./components/dataExploration/DataExploration.vue";

export const beforeEnter = (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    if (store.state.currentUser === "guest" && !sessionStorage.getItem("asGuest")) {
        window.location.assign("/login");
    }
}

export const beforeEnterDataExploration = (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    if (storeDataExploration.state.currentUser === "guest" && !sessionStorage.getItem("asGuest")) {
        window.location.assign("/login");
    }
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

const routesDataExploration = [
    {
        path: "/",
        component: DataExploration,
        beforeEnter: beforeEnterDataExploration
    },
    {path: "/accessibility", component: Accessibility}
];

export const routerDataExploration = createRouter({
    history: createWebHashHistory("/callback/explore"),
    routes: routesDataExploration
});
