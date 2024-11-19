<template>
    <div class="form-group" v-for="f of filters" :key="f.stateFilterId">
        <div v-if="!f.hidden"
             @mouseover="showReset[f.stateFilterId] = true"
             @mouseleave="showReset[f.stateFilterId] = false">
            <filter-with-reset @reset="() => resetFilter(f.stateFilterId)"
                               :show-reset="showReset[f.stateFilterId]"
                               :icon-type="'corner-down-left'">
                <label class="font-weight-bold">{{f.label}}</label>
            </filter-with-reset>
            <!-- For some reason using filter is saying no component registered
            with this name, no idea why so using capital Filter -->
            <Filter :state-filter-id="f.stateFilterId" :plot="plot"/>
        </div>
    </div>
</template>

<script lang="ts">
import {PropType, computed, defineComponent, ref} from 'vue';
import {useStore} from "vuex";
import {RootState} from "../../root";
import Filter from "./Filter.vue";
import {PlotName} from "../../store/plotSelections/plotSelections";
import { getDefaultFilterSelections, PlotSelectionActionUpdate } from '../../store/plotSelections/actions';
import FilterWithReset from './FilterWithReset.vue';

export default defineComponent({
    components: {
        Filter,
        FilterWithReset
    },
    props: {
        plot:{
            type: String as PropType<PlotName>,
            required: true
        }
    },
    setup(props) {
        const store = useStore<RootState>();
        const filters = computed(() => {
            return store.state.plotSelections[props.plot].filters;
        });

        const controls = computed(() => {
            return store.state.plotSelections[props.plot].controls
        })

        const rootState = computed(() => store.state);

        const resetFilter = (stateFilterId: string) => {
            const defaultFilterSelections = getDefaultFilterSelections(rootState.value, props.plot, controls.value);
            const newOptions = defaultFilterSelections.find(f => f.stateFilterId === stateFilterId)!.selection!;
            store.dispatch("plotSelections/updateSelections", {
                payload: {
                    plot: props.plot,
                    selection: {
                        filter: {
                            id: stateFilterId,
                            options: newOptions
                        }
                    }
                } as PlotSelectionActionUpdate
            }, { root: true });
        };

        const showReset = ref<Record<string, boolean>>(Object.fromEntries(filters.value.map(f => [f.stateFilterId, false])));

        return {
            filters,
            resetFilter,
            showReset
        }
    }
})

</script>
