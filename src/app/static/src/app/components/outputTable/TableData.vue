<template>
    <table-display :data="filteredData"/>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { RootState } from '../../root';
import { useStore } from 'vuex';
import { Filter } from '../../generated';
import TableDisplay from './TableDisplay.vue';

export default defineComponent({
    components: {
        TableDisplay
    },
    setup() {
        const store = useStore<RootState>();
        const selections = computed(() => store.state.plottingSelections.table);
        // this is necessary because filters are called
        // "age" for example on the filter selections when
        // the id in the data array is "age_group"
        const filtersIdToDataId = computed(() => {
            const filters: Filter[] = store.getters["modelOutput/tableFilters"] || [];
            const idToDataId: Record<string, string> = {};
            filters.forEach(f => {
                idToDataId[f.id] = f.column_id;
            });
            return idToDataId;
        });

        const filteredData = computed(() => {
            const result = store.state.modelCalibrate.result;
            if (!result) {
                return []
            } else {
                const data = result.data;
                const selectedOptions = selections.value.selectedFilterOptions;
                const filterKeys = Object.keys(selectedOptions);
                const selectedOptionIds: Record<string, (string | number)[]> = {};
                for (const k in selectedOptions) {
                    if (k === "area_level") {
                        selectedOptionIds[k] = selectedOptions[k].map(op => parseInt(op.id));
                    } else {
                        selectedOptionIds[k] = selectedOptions[k].map(op => op.id);
                    }
                }
                const filteredData = [];
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (row.indicator !== selections.value.indicator) continue;
                    const valid = filterKeys.every(key => {
                        return selectedOptionIds[key].includes(row[filtersIdToDataId.value[key]]);
                    })
                    if (!valid) continue;
                    filteredData.push(row);
                }
                return filteredData
            }
        });
        return {
            filteredData
        } 
    }
});
</script>