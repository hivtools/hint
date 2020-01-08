<template>
    <div>
        <label :class="'font-weight-bold' + (disabled ? ' disabled-label' : '')" v-translate="label"></label>
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
    import i18next from "i18next";
    import Vue from "vue";
    import Treeselect from '@riophae/vue-treeselect';
    import {mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";

    interface Methods {
        select: (value: string[]) => void
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
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            placeholder() {
                const key = this.disabled ? "notUsed" : "select";
                return i18next.t(key, this.currentLanguage)
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

