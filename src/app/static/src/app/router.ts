import {createRouter, createWebHistory, type RouteLocationNormalized} from "vue-router";
import Stepper from "./components/Stepper.vue";
import Projects from "./components/projects/Projects.vue";
import {store} from "./main";

export const beforeEnter = (_to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
    if (store.state.currentUser === "guest" && !sessionStorage.getItem("asGuest")) {
        window.location.assign("/login");
    }
}

const routes = [
    {
        path: "/",
        component: Stepper,
        beforeEnter
    },
    // Users open these pages from the "Online support" menu. The browser gets them only when it needs them.
    // Stepper and Projects are start pages (Stepper sends a logged-in user with no project to Projects),
    // so they are not lazy.
    {path: "/accessibility", component: () => import("./components/Accessibility.vue")},
    {path: "/privacy", component: () => import("./components/Privacy.vue")},
    {path: "/projects", component: Projects}
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
