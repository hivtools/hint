<template>
    <div  v-if="!disabled">
        <label :class="'font-weight-bold' + (disabled ? ' disabled-label' : '')" v-translate="label"></label>
        <treeselect id="survey-filters" :multiple=multiple
                    :clearable="false"
                    :options=options
                    :value=treeselectValue
                    :disabled=disabled
                    :placeholder=placeholder
                    @input="input"
                    @select="select"
                    @deselect="deselect"></treeselect>
    </div>
</template>

<script lang="ts">
    import i18next from "i18next";
    import Vue from "vue";
    import Treeselect from '@riophae/vue-treeselect';
    import {mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import {FilterOption} from "../../generated";
    import {flattenOptions} from "../../utils";

    interface Methods {
        input: (value: string[]) => void
        select: (node: FilterOption) => void
        deselect: (node: FilterOption) => void
    }

    interface Computed {
        treeselectValue: string[] | string | null
        currentLanguage: Language
        placeholder: string
    }

    interface Props {
        multiple: boolean,
        label: string,
        disabled: boolean,
        options: any[],
        value: string[] | string
    }

    interface Data {
        selectedOptions: any
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "FilterSelect",
        props: {
            multiple: Boolean,
            label: String,
            disabled: Boolean,
            options: Array,
            value: [Array, String]
        },
        data() {
            const idArray = Array.isArray(this.value) ? this.value : [this.value];
            const flatOptions = Object.values(flattenOptions(this.options));
            const selected = flatOptions.filter((o: FilterOption) => idArray.includes(o.id));
            return {
                selectedOptions: selected
            }
        },
        computed: {
            treeselectValue() {
                return this.disabled ? null : this.value;
            },
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            placeholder() {
                const key = this.disabled ? "notUsed" : "select";
                return i18next.t(key, this.currentLanguage)
            }
        },
        methods: {
            input(value: string[]) {
                if (!this.disabled && value != this.value) {
                    this.$emit("input", value);
                }
            },
            select(node: FilterOption) {
                if (!this.multiple) {
                    this.selectedOptions = [node]
                } else {
                    this.selectedOptions.push(node);
                }
                this.$emit("select", this.selectedOptions);
            },
            deselect(node: FilterOption) {
                this.selectedOptions = this.selectedOptions.filter((n: any) => n.id != node.id);
                this.$emit("select", this.selectedOptions);
            }
        },
        components: {Treeselect}
    });
</script>

