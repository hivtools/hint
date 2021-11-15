<template>
    <div class="content">
        <div class="pt-4">
            <adr-integration></adr-integration>
            <upload-inputs v-if="step === 1"></upload-inputs>
            <review-inputs v-if="step === 2"></review-inputs>
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
    import UploadInputs from "../uploadInputs/UploadInputs.vue";
    import ReviewInputs from "../reviewInputs/ReviewInputs.vue";

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
            UploadInputs,
            ReviewInputs
        }
    })
</script>