import {createRouter, createWebHistory, type RouteLocationNormalized, type Router} from "vue-router";
import type {Store} from "vuex";
import Stepper from "./components/Stepper.vue";
import Projects from "./components/projects/Projects.vue";
import type {RootState} from "./root";

// The store is made after the router (it needs the user from GET /me), so the guard gets it when the app starts
let guardStore: Store<RootState> | null = null;

// A guest who has not chosen "Continue as guest" in this tab goes to the login page
export const beforeEnter = (_to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
    if (guardStore?.state.currentUser === "guest" && !sessionStorage.getItem("asGuest")) {
        window.location.assign("/login");
    }
}

export const guardAgainstGuests = (store: Store<RootState>) => {
    guardStore = store;
};

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

export const router: Router = createRouter({
    history: createWebHistory(),
    routes,
});
