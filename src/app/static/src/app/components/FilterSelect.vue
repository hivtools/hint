<template>
    <div>
        <label :class="'font-weight-bold' + (disabled ? ' disabled-label' : '')">{{label}}</label>
        <treeselect id="survey-filters" :multiple=multiple
                    :clearable="false"
                    :options=options
                    :value=treeselectValue
                    :disabled=disabled
                    :placeholder=placeholder
                    :normalizer="treeselectNormalizer"
                    @input="select"></treeselect>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Treeselect from '@riophae/vue-treeselect';
    import {NestedFilterOption} from "../generated";

    export default Vue.extend({
        name: "FilterSelect",
        props: {
            multiple: Boolean,
            label: String,
            disabled: Boolean,
            options: Array,
            value: [Array, String]
        },
        computed: {
            treeselectValue() {
                return this.disabled ? null : this.value;
            },
            placeholder() {
                return this.disabled ? "Not used" : "Select...";
            }
        },
        methods: {
            treeselectNormalizer(anyNode: any) {
                const normalize = (anyNode: any) => {
                    //In the nested case, this gets called for the child nodes we add in below - just return these unchanged
                    if (anyNode.label) {
                        return anyNode;
                    }

                    const node = anyNode as NestedFilterOption;
                    const result = {id: node.id, label: node.name};
                    if (node.options && node.options.length > 0) {
                        (result as any).children = node.options.map(o => normalize(o));
                    }

                    return result;
                };

                return normalize(anyNode);
            },
            select(value: string[]) {
                if (!this.disabled) {
                    this.$emit("select", value);
                }
            },
        },
        components: {Treeselect}
    });
</script>

