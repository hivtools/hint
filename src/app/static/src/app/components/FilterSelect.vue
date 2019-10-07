<template>
    <div>
        <label class="font-weight-bold">{{label}}</label>
        <treeselect id="survey-filters" :multiple=multiple
                    :clearable="false"
                    :options=options
                    :value=value
                    :disabled=disabled
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
        methods: {
            treeselectNormalizer(anyNode: any) {
                //In the nested case, this gets called for the child nodes we add in below - just return these unchanged
                if (anyNode.label) {
                    return anyNode;
                }

                const node = anyNode as NestedFilterOption;
                const result = {id: node.id, label: node.name};
                if (node.options && node.options.length > 0) {
                    (result as any).children = node.options.map(o => this.treeselectNormalizer(o));
                }

                return result;
            },
            select(value: string[]) {
                this.$emit("select", value);
            }
        },
        components: {Treeselect}
    });
</script>

