<template>
    <div @mouseover="showReset = true" @mouseleave="showReset = false">
        <span class="d-flex justify-content-between">
            <slot name="label">
                <h4 v-translate="'filters'"/>
            </slot>
            <vue-feather v-show="showReset"
                        type="refresh-cw"
                        class="filter-reset-icon"
                        size="20"
                        @click="resetFilters"></vue-feather>
        </span>
        <slot name="filter"></slot>
    </div>
</template>

<script setup lang="ts">
import VueFeather from "vue-feather";
import { useStore } from "vuex";
import { RootState } from "../../root";
import { computed, PropType, ref } from "vue";
import { PlotName } from "../../store/plotSelections/plotSelections";
import { getDefaultFilterSelections, PlotSelectionActionUpdate } from "../../store/plotSelections/actions";

const props = defineProps({
    plot: { type: String as PropType<PlotName>, required: true },
    stateFilterId: { type: String, required: false }
});

const store = useStore<RootState>();
const rootState = computed(() => store.state);
const controls = computed(() => store.state.plotSelections[props.plot].controls);
const resetFilters = () => {
    let defaultFilterSelections = getDefaultFilterSelections(rootState.value, props.plot, controls.value);
    if (props.stateFilterId) {
        defaultFilterSelections = defaultFilterSelections.filter(f => f.stateFilterId === props.stateFilterId);
    }
    store.dispatch("plotSelections/updateSelections", {
        payload: {
            plot: props.plot,
            selection: {
                filters: defaultFilterSelections.map(f => ({
                    id: f.stateFilterId,
                    options: f.selection
                }))
            }
        } as PlotSelectionActionUpdate
    }, { root: true });
};

const showReset = ref(false);
</script>