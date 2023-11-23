<template>
    <table-display :data="filteredData"/>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { RootState } from '../../root';
import { useStore } from 'vuex';
import TableDisplay from './TableDisplay.vue';

const metadataToData = {
    age: "age_group",
    area: "area_id",
    quarter: "calendar_quarter",
    sex: "sex",
    area_level: "area_level"
}

export default defineComponent({
    components: {
        TableDisplay
    },
    setup() {
        const store = useStore<RootState>();
        const selections = computed(() => store.state.plottingSelections.table);

        const filteredData = computed(() => {
            const result = store.state.modelCalibrate.result;
            if (!result) {
                return []
            } else {
                const data = result.data;
                const selectedOptions = selections.value.selectedFilterOptions;
                const filterKeys = Object.keys(selectedOptions) as (keyof typeof metadataToData)[];
                const selectedOptionIds: Record<string, (string | number)[]> = {};
                for (const k in selectedOptions) {
                    selectedOptionIds[k] = selectedOptions[k].map(op => {
                        if (k === "area_level") {
                            return parseInt(op.id);
                        }
                        return op.id
                    });
                }
                const filteredData = [];
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (row.indicator !== "prevalence") continue;
                    const valid = filterKeys.every(key => {
                        return selectedOptionIds[key].includes(row[metadataToData[key]]);
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