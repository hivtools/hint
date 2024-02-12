<template>
    <div>
        <ul class="nav nav-tabs">
            <li v-for="plotName of plotNames" :key="plotName">
                <a class="nav-link"
                   :class="selectedPlot === plotName ? 'active': ''"
                   v-translate="plotName"
                   @click="switchTab(plotName)"></a>
            </li>
        </ul>
        <div class="mt-2">
            <PlotControlSet :active-plot="selectedPlot"/>
            <h4 v-translate="'filters'"/>
            <FilterSet :active-plot="selectedPlot"/>
        </div>
    </div>
</template>

<script lang="ts">
import {computed, defineComponent, ref} from "vue";
import FilterSet from "../plots/FilterSet.vue";
import PlotControlSet from "../plots/PlotControlSet.vue";
import {PlotName} from "../../store/plotSelections/plotSelections";
import {useStore} from "vuex";

export default defineComponent({

    setup() {
        const store = useStore()

        const plotNames = computed(() => {
            return Object.keys(store.state.plotSelections) as PlotName[]
        })

        const selectedPlot = ref<PlotName>(plotNames.value[0]);
        const switchTab = (plotName: PlotName) => {
            selectedPlot.value = plotName
        }
        return {
            plotNames,
            selectedPlot,
            switchTab
        }
    },

    components: {
        FilterSet,
        PlotControlSet
    }
})
</script>
