<template>
    <div class="container mt-5">
        <div class="row">
            <div id="accessibility-content" class="col">
                <h1 v-translate="'axeOnNaomiHeading'"></h1>
                <p v-translate="'axeOnNaomiParagraph1'"></p>
                <p v-translate="'axeOnNaomiParagraph2'"></p>
                <ul id="purpose" v-translate="'axeOnNaomiPurposeList'"></ul>
                <p v-translate="'axeOnNaomiParagraph3'"></p>
                <h2 v-translate="'axeHowHeading'"></h2>
                <p v-translate="'axeHowContent'"></p>
                <ul id="example" v-translate="'axeHowExampleList'"></ul>
                <h2 v-translate="'axeWhatHeading'"></h2>
                <p v-translate="'axeWhatContent'"></p>
                <h2 v-translate="'axeTechnicalHeading'"></h2>
                <p v-translate="'axeTechnicalParagraph1'"></p>
                <p v-translate="'axeTechnicalParagraph2'"></p>
                <h2 v-translate="'axeReportingHeading'"></h2>
                <p v-translate="'axeReportingParagraph1'"></p>
                <p v-translate="'axeReportingParagraph2'"></p>
                <h2 v-translate="'axeEnforcementHeading'"></h2>
                <p v-translate="'axeEnforcementParagraph'"></p>
                <h2 v-translate="'axeTestHeading'"></h2>
                <p v-translate="'axeTestParagraph'"></p>
                <h2 v-translate="'axeUpdateHeading'"></h2>
                <p v-translate="'axeUpdateParagraph'"></p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    export default {
        name: "Accessibility"
    }
</script>