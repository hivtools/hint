<template>

    <multi-select v-if="multiple"
                  :options="options"
                  :model-value="selected"
                  :placeholder="placeholder"
                  @update:model-value="updateSelection"/>
    <single-select v-else
                   :options="options"
                   :model-value="selected[0]"
                   :placeholder="placeholder"
                   @update:model-value="updateSelection"/>

</template>

<script lang="ts">
import { SingleSelect, MultiSelect } from "@reside-ic/vue-nested-multiselect";
import {computed, defineComponent, PropType, ref} from 'vue';
import i18next from "i18next";
import {useStore} from "vuex";
import {RootState} from "../../root";
import {FilterOption} from "../../generated";

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

        const selected = ref<string[]>(props.selectedOptions?.map(option => option.id));
        const updateSelection = (newSelection: FilterOption | FilterOption[]) => {
            // TODO: dispatch event and update the selectedOptions in state
            console.log("Updating selection to " + JSON.stringify(newSelection));
            if (Array.isArray(newSelection)) {
                selected.value = newSelection.map(newOption => newOption.id);
            } else {
                selected.value = [newSelection.id];
            }
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
