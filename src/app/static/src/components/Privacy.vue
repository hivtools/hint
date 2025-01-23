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
                <h2 v-translate="'privacyThirdPartyHeading'"></h2>
                <ul id="third-party" v-translate="'privacyThirdPartyList'"></ul>
                <h2 v-translate="'privacyUseHeading'"></h2>
                <p v-translate="'privacyUseBody'"></p>
                <ul id="use" v-translate="'privacyUseList'"></ul>
                <h2 v-translate="'privacyStoreHeading'"></h2>
                <p v-translate="'privacyStoreBody'"></p>
                <h2 v-translate="'privacySecureHeading'"></h2>
                <p v-translate="'privacySecureBody'"></p>
                <h2 v-translate="'privacyLengthHeading'"></h2>
                <ul id="use" v-translate="'privacyLengthList'"></ul>
                <h2 v-translate="'privacyDiscloseHeading'"></h2>
                <ul id="use" v-translate="'privacyDiscloseList'"></ul>
                <h2 v-translate="'privacyRightsHeading'"></h2>
                <ul id="use" v-translate="'privacyRightsList'"></ul>
                <h2 v-translate="'privacyLinksHeading'"></h2>
                <p id="use" v-translate="'privacyLinksBody'"></p>
            </section>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'Privacy',
    });
</script>