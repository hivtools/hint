<template>
    <div class="content">
        <div class="pt-4">
            <adr-integration></adr-integration>
            <baseline v-if="step === 1"></baseline>
            <survey-and-program v-if="step === 2"></survey-and-program>
            <button type="button"
                    class="btn btn-white shadow-none"
                    v-translate="'back'"
                    @click="back">
            </button>
            <button type="button"
                    class="btn btn-red shadow-none"
                    v-translate="'next'"
                    @click="next">
            </button>
        </div>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import AdrIntegration from "../adr/ADRIntegration.vue";
    import Baseline from "../baseline/Baseline.vue";
    import SurveyAndProgram from "../surveyAndProgram/SurveyAndProgram.vue";

    export default Vue.extend({
        data() {
            return {
                step: 1
            }
        },
        methods: {
            next() {
                this.step = 2;
            },
            back() {
                this.step = 1;
            }
        },
        components: {
            AdrIntegration,
            Baseline,
            SurveyAndProgram
        }
    })
</script>