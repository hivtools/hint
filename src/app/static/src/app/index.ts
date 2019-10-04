import Vue from "vue";
import {store} from "./main"
import Stepper from "./components/Stepper.vue";
import {mapActions} from "vuex";

export const app = new Vue({
    el: "#app",
    store,
    components: {
        Stepper
    },
    render: h => h(Stepper),
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


