<template>

    <single-select :options="controlOptions"
                   :model-value="selected"
                   :placeholder="placeholder"
                   @update:model-value="updateControlSelection"/>

</template>

<script lang="ts">
import { SingleSelect } from "@reside-ic/vue-nested-multiselect";
import {computed, defineComponent, PropType, ref} from 'vue';
import i18next from "i18next";
import {useStore} from "vuex";
import {RootState} from "../../root";
import {FilterOption} from "../../generated";
import {PlotName} from "../../store/plotSelections/plotSelections";

export default defineComponent({
    props: {
        plotControlId: String,
        activePlot: String as PropType<PlotName>,
        selectedControl: Object as PropType<FilterOption[]>
    },
    setup(props) {
        const store = useStore<RootState>();

        const controlOptions = computed(() => {
            return store.getters["modelCalibrate/plotControlOptions"](props.activePlot, props.plotControlId);
        });

        const selected = ref<string>(props.selectedControl[0]?.id);
        const updateControlSelection = (newSelection: FilterOption) => {
            // TODO: dispatch action to run the effects
            console.log("Running effects for plot control " + newSelection.id);
            selected.value = newSelection.id;
        };

        const placeholder = computed(() => {
            return i18next.t("select", "en");
        });

        return {
            controlOptions,
            selected,
            updateControlSelection,
            placeholder
        }
    },

    components: {
        SingleSelect
    }
})

</script>

<style scoped>

</style>
