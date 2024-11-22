<template>
    <div class="form-group" v-for="f of filters" :key="f.stateFilterId">
        <div v-if="!f.hidden">
            <filter-with-reset :plot="plot" :state-filter-id="f.stateFilterId">
                <template v-slot:label>
                    <span class="font-weight-bold">{{f.label}}</span>
                </template>
                <template v-slot:filter>
                    <!-- For some reason using filter is saying no component registered
                    with this name, no idea why so using capital Filter -->
                    <Filter :state-filter-id="f.stateFilterId" :plot="plot"/>
                </template>
            </filter-with-reset>
        </div>
    </div>
</template>

<script lang="ts">
import {PropType, computed, defineComponent} from 'vue';
import {useStore} from "vuex";
import {RootState} from "../../root";
import Filter from "./Filter.vue";
import {PlotName} from "../../store/plotSelections/plotSelections";
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

        return {
            filters
        }
    }
})

</script>
