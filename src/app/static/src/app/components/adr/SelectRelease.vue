<template>
    <div id="selectRelease"></div>
</template>
<script lang="ts">
    import Vue from "vue";
    import { mapActionByName } from "../../utils";

    export default Vue.extend({
        props: ["selectedDataset"],
        methods: {
            getReleases: mapActionByName("adr", "getReleases"),
        },
        watch: {
            selectedDataset(id) {
                this.getReleases(id);
            },
        }
    });
</script>