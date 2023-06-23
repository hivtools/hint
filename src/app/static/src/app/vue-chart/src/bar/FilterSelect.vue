<template>
    <div>
        <label class="font-weight-bold">{{label}}</label>
        <hint-tree-select :instanceId="id"
                     :multiple=isXAxisOrDisagg
                     :clearable="false"
                     :flat=isXAxisOrDisagg
                     :options="options"
                     :model-value="selectedValues"
                     @select="select"
                     @deselect="deselect"></hint-tree-select>
        <span v-if="isXAxisOrDisagg" class="text-muted">
                        <small>{{badge}}</small>
                    </span>
    </div>
</template>

<script lang="ts">
    import {defineComponent, Prop, PropType} from "vue";
    import {FilterOption} from "./types";
    import HintTreeSelect from "../../../components/HintTreeSelect.vue";

    interface Props {
        id?: string
        options: FilterOption[]
        isXAxis: boolean
        isDisaggregateBy: boolean
        value: any[]
        label: string
    }

    interface Data {
        selected: any
    }

    interface Computed {
        [key:string]: any
        isXAxisOrDisagg(): boolean,
        selectedValues(): any[]
        badge(): string
    }

    interface Methods {
        [key:string]: any
        select: (node: FilterOption) => void
        deselect: (node: FilterOption) => void
    }

    export default defineComponent({
        props: {
            id: {
                type: String,
                required: false
            },
            options: {
                type: Array as PropType<FilterOption[]>,
                required: true
            },
            isXAxis: {
                type: Boolean,
                required: true
            },
            isDisaggregateBy: {
                type: Boolean,
                required: true
            },
            value: {
                type: Array as PropType<any[]>,
                required: true
            },
            label: {
                type: String,
                required: true
            }
        },
        data() {
            return {
                selected: (this.isXAxis || this.isDisaggregateBy) ? this.value : [this.value[0]]
            }
        },
        methods: {
            select(node: FilterOption) {
                if (!this.isXAxisOrDisagg) {
                    this.selected = [node]
                } else {
                    this.selected.push(node);
                }
                this.$emit("input", this.selected);
            },
            deselect(node: FilterOption) {
                this.selected = this.selected.filter((n: any) => n.id != node.id);
                this.$emit("input", this.selected);
            }
        },
        computed: {
            isXAxisOrDisagg() {
                return this.isXAxis || this.isDisaggregateBy
            },
            selectedValues() {
                return this.value.map((v: any) => v.id);
            },
            badge() {
                if (this.isXAxis) {
                    return ("x axis");
                } else {
                    return "disaggregate by"
                }
            }
        },
        watch: {
            value() {
                this.selected = (this.isXAxis || this.isDisaggregateBy) ? this.value : [this.value[0]]
            },
            isXAxisOrDisagg() {
                if (!this.isXAxisOrDisagg) {
                    //When we go from multi-select to single-select, update 'selected'
                    if (this.selected.length > 1) {
                        this.selected = [this.selected[0]];
                    }
                    if (this.selected.length == 0) {
                        this.selected.push(this.options[0]);
                    }
                    this.$emit("input", this.selected);
                }
            }
        },
        components: {
            HintTreeSelect
        }
    })
</script>