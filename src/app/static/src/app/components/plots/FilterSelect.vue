<template>
    <div>
        <label :class="'font-weight-bold' + (disabled ? ' disabled-label' : '')">{{label}}</label>
        <treeselect id="survey-filters" :multiple=multiple
                    :clearable="false"
                    :options=options
                    :value=treeselectValue
                    :disabled=disabled
                    :placeholder=placeholder
                    @input="select"></treeselect>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Treeselect from '@riophae/vue-treeselect';

    interface Methods {
        select: (value: string[]) => void
    }

    interface Computed {
        treeselectValue: string[] | string | null
        placeholder: string
    }

    interface Props {
        multiple: boolean,
        label: string,
        disabled: boolean,
        options: any[],
        value: string[] | string
    }

    export default Vue.extend<{}, Methods, Computed, Props>({
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
            select(value: string[]) {
                if (!this.disabled) {
                    this.$emit("select", value);
                }
            },
        },
        components: {Treeselect}
    });
</script>

