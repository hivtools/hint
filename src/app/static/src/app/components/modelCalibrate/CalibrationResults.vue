<template>
    <hr />
    <h3 v-translate="'calibrateResultsHeader'"></h3>
    <p class="text-muted" v-translate="'calibrateResultsDesc'"></p>
    <div id="calibration-plot" class="row">
        <div class="mt-2 col-md-3">
            <filter-with-reset :plot="calibratePlotName"></filter-with-reset>
            <filter-set :plot="calibratePlotName"/>
        </div>
        <barchart class="col-md-9"
                  :plot="calibratePlotName"
                  :show-error-bars="false"/>
    </div>
</template>

<script setup lang="ts">
import {lazyComponent} from "../lazyComponent";
import {calibratePlotName} from "../../store/plotSelections/plotSelections";
import FilterSet from "../plots/FilterSet.vue";
import FilterWithReset from "../plots/FilterWithReset.vue";

// The bar chart uses Chart.js, which is large, so it loads only when the user sees it.
const Barchart = lazyComponent(() => import("../plots/bar/Barchart.vue"));
</script>
