<template>
    <div>
        <label :class="['font-weight-bold', { 'disabled-label': disabled }]" v-translate="label"></label>
        <span v-if="labelTooltip"
              v-tooltip="{
                    content: `<dl>${labelTooltip}</dl>`,
                    classes: 'filter-select',
                    autoHide: false
                }"
              class="icon-small">
            <vue-feather type="help-circle"></vue-feather>
        </span>
        <treeselect :multiple="multiple"
                    :clearable="false"
                    :options="options"
                    :disabled="disabled"
                    v-model="treeselectValue"
                    :key="treeselectValue"
                    :placeholder="placeholder"
                    @select="select"
                    @deselect="deselect"></treeselect>
    </div>
</template>

<script lang="ts">
import {
  defineComponentVue2GetSetWithProps
} from "../../defineComponentVue2/defineComponentVue2"
    import i18next from "i18next";
    import Treeselect from "vue3-treeselect";
    import {flattenOptions, mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import {FilterOption} from "../../generated";
    import VueFeather from "vue-feather";
    import {ComputedGetter} from "vue";

    interface Methods {
        input: (value: string[] | string | null) => void
        select: (node: FilterOption) => void
        deselect: (node: FilterOption) => void
    }

    interface Computed extends Record<string, any> {
        treeselectValue: {
          get: ComputedGetter<string[] | string | null>,
          set: (newVal: string[] | string | null) => void
        },
        currentLanguage: ComputedGetter<Language>
        placeholder: ComputedGetter<string>,
        labelTooltip: ComputedGetter<string>
    }

    interface Props {
        multiple?: boolean,
        label: string,
        disabled: boolean,
        options: FilterOption[],
        value: string[] | string
    }

    interface Data {
        selectedOptions: any
    }

    export default defineComponentVue2GetSetWithProps<Data, Methods, Computed, Props>({
        name: "FilterSelect",
        props: {
            multiple: {
                type: Boolean,
                required: false
            },
            label: {
                type: String,
                required: true
            },
            disabled: {
                type: Boolean,
                required: true
            },
            options: {
                type: Array,
                required: true
            },
            value: {
                type: [Array, String],
                required: true
            }
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
            treeselectValue: {
                get() {
                  return this.disabled ? null : this.value;
                },
                set(newValue: string[] | string | null) {
                  this.input(newValue)
                }
            },
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            placeholder() {
                const key = this.disabled ? "notUsed" : "select";
                return i18next.t(key, this.currentLanguage)
            },
            labelTooltip() {
                return this.options.reduce(
                    (lines, option) => lines.concat(option.description ? `<dt>${option.label}</dt><dd>${option.description}</dd>` : []),
                    [] as string[]
                ).join('');
            }
        },
        methods: {
            input(value: string[] | string | null) {
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
        components: {
            Treeselect,
            VueFeather
        }
    });
</script>

