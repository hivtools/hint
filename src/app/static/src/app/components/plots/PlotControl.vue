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
import { PlotSelectionActionUpdate } from "../../store/plotSelections/actions";

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

        const selected = computed(() => props.selectedControl![0].id);
        const updateControlSelection = (newSelection: FilterOption) => {
            store.dispatch("plotSelections/updateSelections", {
                payload: {
                    plot: props.activePlot,
                    selection: {
                        plotSetting: {
                            id: props.plotControlId,
                            options: [newSelection]
                        }
                    }
                } as PlotSelectionActionUpdate
            });
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
