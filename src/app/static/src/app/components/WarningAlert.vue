<template>
    <div v-if="showAlert">
        <div class="content alert alert-warning">
            <h4 class="alert-heading"><alert-triangle-icon size="1.5x" class="custom-class mr-1 mb-1"></alert-triangle-icon>The following issues were reported for this {{ step }}.</h4>
            <ul class="mb-0">
                <li v-for="warning in filteredWarnings" :key="warning">{{ warning}}</li>
            </ul>
            <!-- <transition-group name="warning-list" tag="ul" class="mb-0">
                <li class="warning-list-item" v-for="warning in filteredWarnings" :key="warning">
                    {{ warning }}
                </li>
            </transition-group> -->
            <!-- <ul class="mb-0">
                <li v-for="warning in firstWarnings" :key="warning">{{ warning}}</li>
                <b-collapse id="collapse-1">
                    <li v-for="warning in remainingWarnings" :key="warning">{{ warning}}</li>
                </b-collapse>
            </ul> -->
            <div v-if="warnings.length > maxWarnings">
                <p v-if="!showAllWarnings" class="ml-4 mb-0">...</p>
                <button @click="toggleShowAllWarnings" class="btn btn-link alert-link">{{ buttonText }}</button>
                <!-- <b-button v-b-toggle.collapse-1 class="btn btn-link alert-link">{{ buttonText }}</b-button> -->
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { AlertTriangleIcon } from "vue-feather-icons";
    // import { BCollapse, BButton } from 'bootstrap-vue'

    interface Props {
        step: number
        warnings: string[]
        maxWarnings: number
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
        name: "WarningAlert",
        props: {
            step: Number,
            warnings: Array,
            maxWarnings: {
                default: 3,
                required: false,
                type: Number
            }
        },
        data() {
            return {
                showAllWarnings: false
            };
        },
        computed: {
            filteredWarnings(){
                if (this.warnings.length <= this.maxWarnings){
                    return this.warnings
                } else {
                    return this.showAllWarnings ? this.warnings : this.warnings.slice(0,this.maxWarnings - 1)
                }
            },
            // firstWarnings(){
            //     return this.warnings.length > 3 ? this.warnings.slice(0,2) : this.warnings
            // },
            // remainingWarnings(){
            //     return this.warnings.length > 3 ? this.warnings.slice(2) : []
            // },
            showAlert(){
                return this.step > 2 && this.warnings.length
            },
            buttonText(){
                return this.showAllWarnings ? 'Show less' : 'Show more'
            }
        },
        methods: {
            toggleShowAllWarnings(){
                this.showAllWarnings = !this.showAllWarnings;
            }
        },
        components: {
            AlertTriangleIcon,
            // BCollapse,
            // BButton

        }
    })
</script>



