import Vue from "vue";
import {store} from "./main"
import {router} from "./router";
import UserHeader from "./components/header/UserHeader.vue";
import Errors from "./components/Errors.vue";
import Stepper from "./components/Stepper.vue";
import Versions from "./components/versions/Versions.vue";
import {mapActions, mapState} from "vuex";
import {RootState} from "./root";
import VueRouter from "vue-router";

Vue.use(VueRouter);

router.addRoutes( [
    {path: "/", component: Stepper},
    {path: "/versions", component: Versions}
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
        language: state => state.language
    }),
    methods: {
        ...mapActions({loadBaseline: 'baseline/getBaselineData'}),
        ...mapActions({loadSurveyAndProgram: 'surveyAndProgram/getSurveyAndProgramData'}),
        ...mapActions({loadModelRun: 'modelRun/getResult'}),
        ...mapActions({getADRSchemas: 'getADRSchemas'})
    },
    beforeMount: function () {
        this.loadBaseline();
        this.loadSurveyAndProgram();
        this.loadModelRun();
        this.getADRSchemas();
    }
});
