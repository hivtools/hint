<template>
    <span>{{text}}</span>
</template>

<script lang="ts">
    import Vue from "vue";
    import i18next from "i18next";
    import {mapState} from "vuex";
    import {RootState} from "../root";

    export default Vue.extend({
        name: "Translated",
        props: ["textKey"],
        data() {
            return {
                text: i18next.t(this.textKey)
            }
        },
        computed: mapState<RootState>({
            lang: state => state.language
        }),
        watch: {
            lang() {
                this.text = i18next.t(this.textKey);
            }
        }
    })

</script>
