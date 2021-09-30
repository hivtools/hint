import Vue from "vue";
import {store} from "./main"
import {router} from "./router";
import UserHeader from "./components/header/UserHeader.vue";
import Errors from "./components/Errors.vue";
import Stepper from "./components/Stepper.vue";
import Projects from "./components/projects/Projects.vue";
import Accessibility from "./components/Accessibility.vue";
import {mapActions, mapState} from "vuex";
import {RootState} from "./root";
import VueRouter, {NavigationGuardNext} from "vue-router";
import {Route} from "vue-router/types/router";

Vue.use(VueRouter);

export const beforeEnter = (to: Route, from: Route, next: NavigationGuardNext) => {
    if (store.state.currentUser === "guest" && !sessionStorage.getItem("asGuest")) {
        window.location.assign("/login");
    } else {
        next();
    }
}

router.addRoutes([
    {
        path: "/",
        component: Stepper,
        beforeEnter
    },
    {path: "/accessibility", component: Accessibility},
    {path: "/projects", component: Projects}
]);

export const app = new Vue({
    el: "#app",
    store,
    router,
    components: {
        UserHeader,
        Errors
    },
    computed: mapState<RootState>({
        language: (state: RootState) => state.language
    }),
    methods: {
        ...mapActions({loadBaseline: 'baseline/getBaselineData'}),
        ...mapActions({loadSurveyAndProgram: 'surveyAndProgram/getSurveyAndProgramData'}),
        ...mapActions({loadModelRun: 'modelRun/getResult'}),
        ...mapActions({loadModelCalibrate: 'modelCalibrate/getResult'}),
        ...mapActions({getADRSchemas: 'adr/getSchemas'}),
        ...mapActions({getCurrentProject: 'projects/getCurrentProject'}),
        ...mapActions({getGenericChartMetadata: 'genericChart/getGenericChartMetadata'})
    },
    beforeMount: function () {
        this.loadBaseline();
        this.loadSurveyAndProgram();
        this.loadModelRun();
        this.loadModelCalibrate();
        this.getADRSchemas();
        this.getGenericChartMetadata();
        this.getCurrentProject();
    }
});
