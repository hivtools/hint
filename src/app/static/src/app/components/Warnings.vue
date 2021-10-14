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
    <div v-if="warnings.length">
        <div class="content alert alert-warning">
            <h4 class="alert-heading"><alert-triangle-icon size="1.5x" class="custom-class mr-1 mb-1"></alert-triangle-icon>The following issues were reported for this {{ location }}.</h4>
            <!-- <ul v-if="warnings.length > 3">
                <li v-for="warning in warnings" :key="warning">{{ warning}}</li>
            </ul> -->
            <ul>
                <li v-for="warning in filteredWarnings" :key="warning">{{ warning}}</li>
            </ul>
            <button @click="toggleShowAllWarnings" v-if="warnings.length > 2">Toggle length</button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    // import {ErrorsState} from "../store/errors/errors";
    import {mapMutationByName, mapStateProps} from "../utils";
    // import {ErrorsMutation} from "../store/errors/mutations";
    // import {Error} from "../generated"
    import { AlertTriangleIcon } from "vue-feather-icons";

    const namespace = "warnings";

    interface Props {
        // title: string
        location: string | null
        warnings: string[]
    }

    interface Data {
        showAllWarnings: boolean
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

    export default Vue.extend<Data, unknown, unknown, Props>({
        name: "Warnings",
        // props: ["location", "warnings"]
        props: {
            // title: String
            location: String,
            warnings: Array
        },
        data() {
            return {
                showAllWarnings: false
            };
        },
        computed: {
            filteredWarnings(){
                return this.showAllWarnings ? this.warnings : this.warnings.slice(0,2)
            }
        //     ...mapStateProps<ErrorsState, keyof ComputedState>(namespace, {
        //         errors: state => {
        //             const messages = state.errors.map(e => e.detail ? e.detail : e.error);
        //             return Array.from(new Set(messages))
        //         }
        //     }),
        //     hasErrors: function () {
        //         return this.errors.length > 0
        //     }
        },
        methods: {
            toggleShowAllWarnings(){
                this.showAllWarnings = !this.showAllWarnings;
            }
        //     dismissAll: mapMutationByName(namespace, ErrorsMutation.DismissAll)
        },
        components: {
            AlertTriangleIcon
        }
    })
</script>



