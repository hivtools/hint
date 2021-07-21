<template></template>
<script lang="ts">
    import Vue from "vue";
    import { mapActionByName, mapStateProp } from "../../utils";
    import SelectDatasetVue from "./SelectDataset.vue";
    import { BaselineState } from "../../store/baseline/baseline";
    import { Dataset } from "../../types";

    export default Vue.extend({
        props: ["selectedDataset"],
        // computed: {
        //     selectedDataset: mapStateProp<BaselineState, Dataset | null>(
        //         "baseline",
        //         (state: BaselineState) => state.selectedDataset
        //     ),
        // },
        methods: {
            getReleases: mapActionByName("adr", "getReleases"),
        },
        watch: {
            selectedDataset(id) {
                console.log("watch method fired", id)
                this.getReleases(id);
            },
        },
        mounted() {
            console.log("select releases mounted", this.selectedDataset);
            // this.getReleases()
        },
    });
</script>