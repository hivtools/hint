<template>
    <div class="pt-1 text-danger">
        {{message}}
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Error} from "../generated.d";

    interface Props {
        error: Error | null
    }

    interface Computed {
        message: String
    }

    export default Vue.extend<{}, {}, Computed, Props>({
        props: {
            "error": Object
        },
        computed: {
            message: function() {
                return this.error ?
                    (this.error.detail ? this.error.detail : this.error.error) :
                    "";
            }
        }
    });
</script>
