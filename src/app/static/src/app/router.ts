import Vue from "vue";
import VueRouter from "vue-router";
import Stepper from "./components/Stepper.vue";
// @ts-ignore Dynamic imports not supported error
//const regionPage = () => import("./components/regionPage.vue");
import Versions from "./components/versions/Versions.vue";

const routes = [
    {path: "/", component: Stepper},
    {path: "/versions", component: Versions}
];

export const router = new VueRouter({
    mode: "history",
    routes
});

