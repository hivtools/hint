<template>
    <user-header :title="title" :user="user"></user-header>
    <div class="container mb-5" v-if="baselineReady">
        <router-view></router-view>
    </div>
    <div v-else class="text-center">
        <loading-spinner size="lg"></loading-spinner>
        <h2 id="loading-message" v-translate="'loadingData'"></h2>
    </div>
    <errors title="title"></errors>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import UserHeader from "./header/UserHeader.vue";
import Errors from "./Errors.vue";
import {mapActions, mapState} from "vuex";
import { RootState } from '../root';
import { Language } from '../store/translations/locales';
import LoadingSpinner from './LoadingSpinner.vue';

type Computed = {
    language: (state: RootState) => string,
    baselineReady: (state: RootState) => boolean
}

declare const currentUser: string;
declare const titleGlobal: string;

export default defineComponent({
    data() {
        return {
            title: titleGlobal,
            user: currentUser
        }
    },
    components: {
        UserHeader,
        Errors,
        LoadingSpinner
    },
    computed: mapState<RootState, Computed>({
        language: (state: RootState) => state.language,
        baselineReady: (state: RootState) => state.baseline.ready
    }),
    methods: {
    ...mapActions({loadBaseline: 'baseline/getBaselineData'}),
    ...mapActions({loadSurveyAndProgram: 'surveyAndProgram/getSurveyAndProgramData'}),
    ...mapActions({loadModelRun: 'modelRun/getResult'}),
    ...mapActions({loadModelCalibrate: 'modelCalibrate/getResult'}),
    ...mapActions({getADRSchemas: 'adr/getSchemas'}),
    ...mapActions({getCurrentProject: 'projects/getCurrentProject'}),
    },
    beforeMount: function () {
        this.loadBaseline();
    },
    watch: {
        language(newVal: Language) {
            document.documentElement.lang = newVal
        },
        baselineReady(newVal: boolean) {
            if (!newVal) return;
            this.loadSurveyAndProgram();
            this.loadModelRun();
            this.loadModelCalibrate();
            this.getADRSchemas();
            this.getCurrentProject();
        }
    }
})
</script>
