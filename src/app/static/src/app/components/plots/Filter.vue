<template>

    <multi-select v-if="multiple"
                  :options="options"
                  :model-value="selected"
                  :placeholder="placeholder"
                  @update:model-value="updateSelection"/>
    <single-select v-else
                   :options="options"
                   :model-value="selected?.at(0)"
                   :placeholder="placeholder"
                   @update:model-value="updateSelection"/>

</template>

<script lang="ts">
import { SingleSelect, MultiSelect } from "@reside-ic/vue-nested-multiselect";
import {computed, defineComponent, PropType} from 'vue';
import i18next from "i18next";
import {useStore} from "vuex";
import {RootState} from "../../root";
import {FilterOption} from "../../generated";
import {PlotSelectionActionUpdate} from "../../store/plotSelections/actions";

export default defineComponent({
    props: {
        filterId: String,
        multiple: Boolean,
        selectedOptions: Object as PropType<FilterOption[]>
    },
    setup(props) {
        const store = useStore<RootState>();

        const options = computed(() => {
            return store.getters["modelCalibrate/outputFilterOptions"](props.filterId)
        });

        const selected = computed(() => {
            return props.selectedOptions?.map(option => option.id);
        })
        const updateSelection = (newSelection: FilterOption | FilterOption[]) => {
            store.dispatch("plotSelections/updateSelections", {
                payload: {
                    plot: "bubble",
                    selection: {
                        filter: {
                            filterId: props.filterId,
                            options: Array.isArray(newSelection) ? newSelection : [newSelection]
                        }
                    }
                } as PlotSelectionActionUpdate
            });
        };

        const placeholder = computed(() => {
            return i18next.t("select", "en");
        });

        return {
            options,
            selected,
            updateSelection,
            placeholder
        }
    },

    components: {
        SingleSelect,
        MultiSelect
    }
})

</script>

<style scoped>

</style>
