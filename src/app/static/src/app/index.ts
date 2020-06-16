import Vue from "vue";
import {store} from "./main"
import UserContent from "./components/UserContent.vue";
import UserHeader from "./components/header/UserHeader.vue";
import Errors from "./components/Errors.vue";
import {mapActions, mapState} from "vuex";
import {RootState} from "./root";

export const app = new Vue({
    el: "#app",
    store,
    components: {
        UserContent,
        UserHeader,
        Errors
    },
    computed: mapState<RootState>({
        language: state => state.language
    }),
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


