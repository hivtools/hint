<template>
    <div v-if="showAlert">
        <div class="content alert alert-warning pt-0">
            <!-- The outer styled divs are the visible window of warnings and inside them are the 
            full window of warnings (the warningBox), which is always rendered as html but with 
            its overflow hidden by the outer box. The size of the outer box dynamically adjusts 
            depending on the size of the warningBox and whether the user has clicked show more or less. -->
            <!-- <div :style="{ overflowY: 'hidden', height: `${this.renderedBoxHeight}px` }">
                <div ref="warningBox" id="warningBox">
                    <div v-for="(value, key) in filteredWarnings" :key="key">
                        <h4 class="alert-heading pt-2">
                            <alert-triangle-icon size="1.5x" class="custom-class mr-1 mb-1"></alert-triangle-icon>
                            <span v-translate="headerText(key)"></span>
                        </h4>
                        <ul class="mb-0">
                            <li v-for="warning in value" :key="warning.text">{{ warning.text }}</li>
                        </ul>
                    </div>
                </div> -->
                <!-- The below html wrapped in invisible divs will never be shown to the user but is used as
                a proxy to dynamically determine the height in pixels the warnings window should have.  -->
                <!-- <div ref="headerPlusLine" class="invisible">
                    <h4 class="alert-heading pt-2">
                        <alert-triangle-icon size="1.5x" class="custom-class mr-1 mb-1"></alert-triangle-icon>
                        <span>Hidden header</span>
                    </h4>
                    <p ref="line" class="mb-0">...</p>
                </div>
            </div>
            <div v-if="warningsLengthy" id="showToggle">
                <p v-if="!showFullBox" class="ml-4 mb-0">...</p>
                <button @click="toggleShowFullBox" class="btn btn-link alert-link pl-0">{{ buttonText }}</button>
            </div> -->


            <warning v-for="(value, key) in filteredWarnings" :key="key" :origin="key" :warnings="value" :max-box-height="maxBoxHeight"></warning>
            <p ref="line" class="mb-0 invisible">...</p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    // import { AlertTriangleIcon } from "vue-feather-icons";
    // import i18next from "i18next";
    // import { mapStateProp } from "../utils";
    // import { RootState } from "../root";
    // import { Language } from "../store/translations/locales";
    import { Warning as WarningType } from "../generated";
    import { Dict } from "../types";
    import Warning from "./Warning.vue"

    interface Props {
        warnings: Dict<WarningType[]>;
        maxLines: number;
    }

    interface Data {
        // showFullBox: boolean;
        // fullBoxHeight: number;
        lineHeight: number;
        // headerHeight: number;
    }

    interface Methods {
        // toggleShowFullBox: () => void;
        updateLineHeight: () => void;
        // headerText: (key: string) => string;
    }

    interface Computed  {
        // currentLanguage: Language;
        // renderedBoxHeight: number;
        maxBoxHeight: number;
        filteredWarnings: Dict<WarningType[]>;
        // warningsLengthy: boolean;
        showAlert: boolean;
        // buttonText: string;
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
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
        data() {
            return {
                lineHeight: 0
            };
        },
        computed: {
            maxBoxHeight(){
                return this.maxLines * this.lineHeight
            },
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
        methods: {
            updateLineHeight(){
                if (this.showAlert){
                    const id = setInterval(() => {
                        if (this.$refs.line){
                            this.lineHeight = (this.$refs.line as HTMLElement).clientHeight;
                            clearInterval(id)
                        }
                    }, 100)
                }
            }
        },
        watch: {
            warnings(){
                this.updateLineHeight()
            }
        },
        mounted(){
            this.updateLineHeight()
        },
        components: {
            Warning
        }
    })
</script>



