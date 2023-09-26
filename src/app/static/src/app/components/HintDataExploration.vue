<template>
    <data-exploration-header :title="title" :user="user"></data-exploration-header>
    <div class="container mb-5">
        <router-view></router-view>
    </div>
    <errors :title="title"></errors>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    import DataExplorationHeader from './header/DataExplorationHeader.vue';
    import Errors from './Errors.vue';
    import { mapActions, mapState } from 'vuex';
    import { DataExplorationState } from '../store/dataExploration/dataExploration';
    import { Language } from '../store/translations/locales';

    export default defineComponent({
        props: {
            title: {
                type: String,
                required: true
            },
            user: {
                type: String,
                required: true
            }
        },
        components: {
            DataExplorationHeader,
            Errors
        },
        computed: mapState<DataExplorationState>({
            language: (state: DataExplorationState) => state.language
        }),
        methods: {
            ...mapActions({loadBaseline: 'baseline/getBaselineData'}),
            ...mapActions({loadSurveyAndProgram: 'surveyAndProgram/getSurveyAndProgramData'}),
            ...mapActions({getADRSchemas: 'adr/getSchemas'}),
            ...mapActions({getGenericChartMetadata: 'genericChart/getGenericChartMetadata'})
        },
        beforeMount: function () {
            this.loadBaseline();
            this.loadSurveyAndProgram();
            this.getADRSchemas();
            this.getGenericChartMetadata();
        },
        watch: {
            language(newVal: Language) {
                document.documentElement.lang = newVal
            }
        }
})
</script>