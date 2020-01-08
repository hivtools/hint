<template>
    <div>
        <tree-select :multiple="true"
                     :clearable="false"
                     v-model="value"
                     :options="formControl.options"
                     :placeholder="placeholder"></tree-select>
        <input type="hidden" :value="formControl.value" :name="formControl.name"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {MultiSelectControl} from "./types";
    import TreeSelect from '@riophae/vue-treeselect';
    import {mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import i18next from "i18next";

    interface Props {
        formControl: MultiSelectControl
    }

    interface Computed {
        value: string[]
        currentLanguage: Language
        placeholder: string
    }

    export default Vue.extend<{}, {}, Computed, Props>({
        name: "DynamicFormMultiSelect",
        model: {
            prop: "formControl",
            event: "change"
        },
        props: {
            formControl: {
                type: Object
            }
        },
        computed: {
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            placeholder() {
                return i18next.t("select", this.currentLanguage)
            },
            value: {
                get() {
                    if (Array.isArray(this.formControl.value)) {
                        return this.formControl.value
                    }
                    if (typeof this.formControl.value == "string") {
                        return [this.formControl.value]
                    }
                    return []
                },
                set(newVal: string[]) {
                    this.$emit("change", {...this.formControl, value: newVal});
                }
            },
        },
        components: {
            TreeSelect
        }
    })
</script>
