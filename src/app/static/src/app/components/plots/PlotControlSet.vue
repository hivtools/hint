<template>

    <div class="form-group" v-for="control of plotControls" :key="control.id">
        <label class="font-weight-bold">{{control.label}}</label>
        <PlotControl :active-plot="activePlot"
                     :plot-control-id="control.id"
                     :selected-control="control.selection"/>
    </div>
    <hr v-if="plotControls.length > 0" class="mt-1 mb-2"/>

</template>

<script lang="ts">
import {computed, defineComponent, PropType} from 'vue';
import {useStore} from "vuex";
import {RootState} from "../../root";
import PlotControl from "./PlotControl.vue";
import {PlotName} from "../../store/plotSelections/plotSelections";

export default defineComponent({
    props: {
        activePlot: {
            type: String as PropType<PlotName>
        }
    },
    setup(props) {
        const store = useStore<RootState>();
        const plotControls = computed(() => {
            return store.getters["plotSelections/plotControls"](props.activePlot);
        });

        return {
            plotControls
        }
    },

    components: {
        PlotControl
    }
})

</script>

<style scoped>

</style>
