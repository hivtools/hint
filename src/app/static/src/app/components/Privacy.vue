<template>
    <div class="container mt-5">
        <div class="row">
            <section id="privacy-content" class="col">
                <h1 v-translate="'privacyPreambleHeading'"></h1>
                <p v-translate="'privacyPreambleBody'"></p>
                <ul id="preamble" v-translate="'privacyPreambleList'"></ul>
                <p v-translate="'privacyPreambleBody2'"></p>
                <h2 v-translate="'privacyCollectHeading'"></h2>
                <p v-translate="'privacyCollectBody'"></p>
                <ul id="collect" v-translate="'privacyCollectList'"></ul>
                <h2 v-translate="'privacyUseHeader'"></h2>
                <p v-translate="'privacyUseBody'"></p>
                <ul id="use" v-translate="'privacyUseList'"></ul>
                <h2 v-translate="'privacyStoreHeader'"></h2>
                <p v-translate="'privacyStoreBody'"></p>
                <h2 v-translate="'privacySecureHeader'"></h2>
                <p v-translate="'privacySecureBody'"></p>
                <h2 v-translate="'privacyLengthHeader'"></h2>
                <ul id="use" v-translate="'privacyLengthList'"></ul>
                <h2 v-translate="'privacyDiscloseHeader'"></h2>
                <ul id="use" v-translate="'privacyDiscloseList'"></ul>
                <h2 v-translate="'privacyRightsHeader'"></h2>
                <ul id="use" v-translate="'privacyRightsList'"></ul>
                <h2 v-translate="'privacyLinksHeader'"></h2>
                <p id="use" v-translate="'privacyLinksBody'"></p>
            </section>
        </div>
    </div>
</template>

<script lang="ts">
    export default {
        name: "Privacy"
    }
</script>