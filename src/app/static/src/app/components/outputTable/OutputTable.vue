<template>
    <div class="row">
        <div class="col-md-3">
            <table-filters></table-filters>
        </div>
        <div id="chart" class="col-md-9">
            <table-data></table-data>
        </div>
    </div>
</template>

<script setup lang="ts">
    import TableFilters from "./TableFilters.vue";
    import TableData from "./TableData.vue"
</script>