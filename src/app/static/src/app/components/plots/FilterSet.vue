<template>

    <div class="form-group" v-for="filter of filters" :key="filter.stateFilterId">
        <label class="font-weight-bold">{{filter.label}}</label>
        <Filter :filter-id="filter.filterId"
                :multiple="filter.multiple"
                :selected-options="filter.selection"/>
    </div>

</template>

<script lang="ts">
import {computed, defineComponent, PropType} from 'vue';
import {useStore} from "vuex";
import {RootState} from "../../root";
import Filter from "./Filter.vue";
import {PlotName} from "../../store/plotSelections/plotSelections";

export default defineComponent({
    props: {
        activePlot: {
            type: String as PropType<PlotName>
        }
    },
    setup(props) {
        const store = useStore<RootState>();
        const filters = computed(() => {
            return store.getters["plotSelections/outputFilters"](props.activePlot);
        });

        return {
            filters
        }
    },

    components: {
        Filter
    }
})

</script>

<style scoped>

</style>
