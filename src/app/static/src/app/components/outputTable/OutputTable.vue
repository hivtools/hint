<template>
    <div class="row">
        <div class="col-md-3">
            <filters></filters>
        </div>
        <div id="chart" class="col-md-9">
            <table-comp></table-comp>
        </div>
    </div>
</template>

<script setup lang="ts">
    import Filters from "./Filters.vue"
    import TableComp from "./Table.vue"
</script>