<template>
    <div v-if="showAlert">
        <div class="content alert alert-warning pt-0">
            <!-- <div :style="{ overflowY: 'hidden', height: `${this.renderedContentHeight}px` }">
                <div ref="content"> -->
                    <warning v-for="(value, key) in filteredWarnings" :key="key" :origin="key" :warnings="value" :max-lines="maxLines"></warning>
                    <!-- <p ref="line" class="mb-0 invisible">...</p> -->
                <!-- </div>
            </div> -->
            <!-- The outer styled divs are the visible window of warnings and inside them are the 
            full window of warnings (the warningBox), which is always rendered as html but with 
            its overflow hidden by the outer box. The size of the outer box dynamically adjusts 
            depending on the size of the warningBox and whether the user has clicked show more or less. -->
                <!-- The below html wrapped in invisible divs will never be shown to the user but is used as
                a proxy to dynamically determine the height in pixels the warnings window should have.  -->
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { Warning as WarningType } from "../generated";
    import { Dict } from "../types";
    import Warning from "./Warning.vue"

    interface Props {
        warnings: Dict<WarningType[]>;
        maxLines: number;
    }

    interface Data {
        // lineHeight: number;
        // contentHeight: number;
    }

    interface Methods {
        // updateDimensions: () => void;
        // quickUpdate: () => void;
    }

    interface Computed  {
        // maxBoxHeight: number;
        filteredWarnings: Dict<WarningType[]>;
        showAlert: boolean;
        // renderedContentHeight: number;
    }

    export default Vue.extend<unknown, unknown, Computed, Props>({
        name: "WarningAlert",
        props: {
            warnings: Object,
            // The user has the option to configure the number of lines (after the first warning 
            // header) that will be displayed. If the height of the warnings are more than this 
            // number, the last line will be replaced with an ellipsis and the show more button 
            // will appear.
            maxLines: {
                default: 2,
                required: false,
                type: Number
            }
        },
        // data() {
        //     return {
        //         lineHeight: 0,
        //         contentHeight: 0
        //     };
        // },
        computed: {
            // maxBoxHeight(){
            //     return this.maxLines * this.lineHeight
            // },
            // renderedContentHeight(){
            //     return this.contentHeight - this.lineHeight
            // },
            filteredWarnings(){
                const anObject: Dict<WarningType[]> = {}
                Object.keys(this.warnings).forEach((k) => {
                    if (this.warnings[k].length > 0){
                        anObject[k] = this.warnings[k]
                    }
                });
                return anObject
            },
            showAlert(){
                return Object.keys(this.warnings).some(key => this.warnings[key].length > 0)
            }
        },
        // methods: {
        //     updateDimensions(){
        //         if (this.showAlert){
        //             const id = setInterval(() => {
        //                 if (this.$refs.line){
        //                     this.lineHeight = (this.$refs.line as HTMLElement).clientHeight;
        //                     this.contentHeight = (this.$refs.content as HTMLElement).clientHeight;
        //                     clearInterval(id)
        //                 }
        //             }, 100)
        //         }
        //     },
        //     quickUpdate(){
        //         if (this.$refs.content){
        //             this.contentHeight = (this.$refs.content as HTMLElement).clientHeight;
        //         }
        //     }
        // },
        // watch: {
        //     warnings(){
        //         this.updateDimensions()
        //     }
        // },
        // mounted(){
        //     this.updateDimensions()
        // },
        components: {
            Warning
        }
    })
</script>



