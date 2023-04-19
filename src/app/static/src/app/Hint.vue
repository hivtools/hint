<template>
    <div id="app">
        <user-header/>
        <errors/>
        <main>
        <router-view />
        </main>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import UserHeader from "./components/header/UserHeader.vue";
import Errors from "./components/Errors.vue";
import {mapActions, mapState} from "vuex";
import { RootState } from './root';
import { Language } from './store/translations/locales';

    export default defineComponent({
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
        },
        watch: {
            language(newVal: Language) {
                document.documentElement.lang = newVal
            }
        }
    })
</script>