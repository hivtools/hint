import Vue from "vue";
import {store} from "./main"
import Stepper from "./components/Stepper.vue";
import UserHeader from "./components/UserHeader.vue";
import {mapActions} from "vuex";

export const app = new Vue({
    el: "#app",
    store,
    components: {
        Stepper,
        UserHeader
    },
    methods: {
        ...mapActions({loadBaseline: 'baseline/getBaselineData'}),
        ...mapActions({loadSurveyAndProgram: 'surveyAndProgram/getSurveyAndProgramData'}),
        ...mapActions({loadModelRun: 'modelRun/getResult'})
    },
    beforeMount: function () {
        this.loadBaseline();
        this.loadSurveyAndProgram();
        this.loadModelRun();
    }
});


