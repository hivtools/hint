<template>
    <user-header :title="title" :user="user"></user-header>
    <div id="app" class="container mb-5">
        <router-view></router-view>
    </div>
    <errors title="title"></errors>
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue';
import UserHeader from "./header/UserHeader.vue";
import Errors from "./Errors.vue";
import {mapActions, mapState} from "vuex";
import { RootState } from '../root';
import { Language } from '../store/translations/locales';

    export default defineComponent({
        props: {
            title: {
                type: String
            },
            user: {
                type: String
            }
        },
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