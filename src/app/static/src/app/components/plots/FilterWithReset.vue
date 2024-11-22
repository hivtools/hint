<template>
    <div @mouseover="showReset = true" @mouseleave="showReset = false">
        <div class="d-flex align-items-center mb-2">
            <div class="flex-grow-1">
                <slot name="label">
                    <h4 class="mb-0 mt-0" v-translate="'filters'"/>
                </slot>
            </div>
            <!-- boostrap d-flex sets display: flex !important, so we can't use v-show here
             instead we have to manually control visibility by switching the class :( -->
            <div :class="showReset ? 'filter-reset d-flex align-items-center' : 'filter-reset d-none'"
                 @click="resetFilters">
                <span class="text-muted small mr-1">{{tooltipContent}}</span>
                <vue-feather type="refresh-cw"
                             size="20"/>
            </div>
        </div>
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
import i18next from "i18next";

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
const currentLanguage = computed(() => store.state.language);
const tooltipContent = computed(() => {
    return i18next.t(
        props.stateFilterId ? "resetSingleFilter" : "resetAllFilters",
        { lng: currentLanguage.value }
    )
})
</script>

<style scoped>
.filter-reset {
    cursor: pointer;
}

/*
    Set highlight colour when text or parent is hovered
    !important to override bootstrap text-muted
 */
.filter-reset span:hover,
.filter-reset:hover span {
    color: red !important;
}

.filter-reset:hover {
    color: red;
}
</style>
