<template>
    <!-- <div v-if="hasErrors" class="container">
        <div class="content">
            <div class="alert alert-danger alert-dismissible fade-show" role="alert">
                <p v-for="(error, index) in errors" :key="index">
                    {{ error }}
                </p>
                <button type="button" class="close" @click="dismissAll">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </div>
    </div> -->
    <div>
        <div class="content"></div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    // import {ErrorsState} from "../store/errors/errors";
    import {mapMutationByName, mapStateProps} from "../utils";
    // import {ErrorsMutation} from "../store/errors/mutations";
    // import {Error} from "../generated"

    const namespace = "warnings";

    interface Props {
        // title: string
        location: number | null
        warnings: Warning[]
    }

    // interface Methods {
    //     dismissAll: () => void
    // }

    // interface ComputedState {
    //     errors: Error[]
    // }

    // interface Computed extends ComputedState {
    //     hasErrors: boolean

    // }

    interface Warning {
        text: string;
        locations: ("model_options" | "model_fit" | "model_calibrate" | "review_output" | "download_results")[];
    };

    export default Vue.extend<unknown, unknown, unknown, Props>({
        name: "Warnings",
        // props: ["location", "warnings"]
        // props: {
        //     // title: String
        //     location: null,
        //     warnings: []
        // },
        // computed: {
        //     ...mapStateProps<ErrorsState, keyof ComputedState>(namespace, {
        //         errors: state => {
        //             const messages = state.errors.map(e => e.detail ? e.detail : e.error);
        //             return Array.from(new Set(messages))
        //         }
        //     }),
        //     hasErrors: function () {
        //         return this.errors.length > 0
        //     }
        // },
        // methods: {
        //     dismissAll: mapMutationByName(namespace, ErrorsMutation.DismissAll)
        // }
    })
</script>



