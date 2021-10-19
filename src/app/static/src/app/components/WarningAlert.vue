<template>
    <div v-if="showAlert">
        <div class="content alert alert-warning pt-0">
            <div :style="containerBox">
                <div ref="warningBox">
                    <div v-for="(value, key) in filteredWarnings" :key="key">
                        <h4 class="alert-heading pt-2">
                            <alert-triangle-icon size="1.5x" class="custom-class mr-1 mb-1"></alert-triangle-icon>
                            {{ headerText(key) }}
                        </h4>
                        <ul class="mb-0">
                            <li v-for="warning in value" :key="warning">{{ warning }}</li>
                        </ul>
                    </div>
                </div>
                <div ref="incHeader" class="invisible">
                    <h4 class="alert-heading pt-2">
                        <alert-triangle-icon size="1.5x" class="custom-class mr-1 mb-1"></alert-triangle-icon>
                        Hidden header
                    </h4>
                    <p ref="line" class="mb-0">...</p>
                </div>
            </div>
            <div v-if="warningsLengthy">
                <p v-if="!showFullBox" class="ml-4 mb-0">...</p>
                <button @click="toggleShowFullBox" class="btn btn-link alert-link">{{ buttonText }}</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { AlertTriangleIcon } from "vue-feather-icons";
    import i18next from "i18next";
    import { mapStateProp } from "../utils";
    import { RootState } from "../root";
    import { Language } from "../store/translations/locales";
import { switches } from "../featureSwitches";

    interface Props {
        step: number;
        warnings: Warnings;
        maxLines: number;
    }

    interface Data {
        showFullBox: boolean;
        fullBoxHeight: number;
        lineHeight: number;
        headerHeight: number;
    }

    interface Methods {
        toggleShowFullBox: () => void;
        updateDimensions: () => void;
        headerText: (key: string) => string;
    }

    interface Computed  {
        currentLanguage: Language;
        renderedBoxHeight: number;
        maxBoxHeight: number;
        containerBox: {
            height: string,
            overflowY: string
        };
        filteredWarnings: Warnings;
        warningsLengthy: boolean;
        showAlert: boolean;
        buttonText: string;
    }

    interface Warning {
        text: string;
        locations: ("model_options" | "model_fit" | "model_calibrate" | "review_output" | "download_results")[];
    };

    // interface Warnings {
    //     modelOptions: string[];
    //     modelRun: string[];
    //     modelCalibrate: string[];
    // }

    interface Warnings {
        [key: string]: string[];
    }

    // interface FilteredWarnings {
    //     modelOptions?: string[];
    //     modelRun?: string[];
    //     modelCalibrate?: string[];
    // }

    // type WarningOrigin = "modelOptions" | "modelRun" | "modelCalibrate"

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "WarningAlert",
        props: {
            step: Number,
            warnings: Object,
            maxLines: {
                default: 3,
                required: false,
                type: Number
            }
        },
        data() {
            return {
                showFullBox: false,
                fullBoxHeight: 0,
                lineHeight: 0,
                headerHeight: 0
            };
        },
        computed: {
            renderedBoxHeight(){
                if (!this.warningsLengthy){
                    return this.fullBoxHeight
                } else {
                    return this.showFullBox ? this.fullBoxHeight : this.maxBoxHeight - this.lineHeight
                }
            },
            maxBoxHeight(){
                return (this.maxLines * this.lineHeight) + this.headerHeight
            },
            warningsLengthy(){
                return this.fullBoxHeight > this.maxBoxHeight
            },
            containerBox(){
                return {
                    height: `${this.renderedBoxHeight}px`,
                    overflowY: "hidden"
                }
            },
            filteredWarnings(){
                const anObject: Warnings = {}
                Object.keys(this.warnings).forEach((k) => {
                    if (this.warnings[k].length > 0){
                        anObject[k] = this.warnings[k]
                    }
                });
                return anObject
            },
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
            showAlert(){
                return this.step > 2 && (!!this.warnings?.modelOptions.length || !!this.warnings?.modelRun.length || !!this.warnings?.modelCalibrate.length)
            },
            buttonText(){
                if (this.showFullBox) {
                    return i18next.t("showLess", { lng: this.currentLanguage });
                } else {
                    return i18next.t("showMore", { lng: this.currentLanguage });
                }
            }
        },
        methods: {
            toggleShowFullBox(){
                this.showFullBox = !this.showFullBox;
            },
            updateDimensions(){
                this.lineHeight = (this.$refs.line as HTMLElement).clientHeight;
                this.headerHeight = (this.$refs.incHeader as HTMLElement).clientHeight - this.lineHeight;
                this.fullBoxHeight = (this.$refs.warningBox as HTMLElement).clientHeight;
            },
            headerText(key){
                const headers: { [key: string]: string } = {
                    modelOptions: "warningsHeaderModelOptions",
                    modelRun: "warningsHeaderModelRun",
                    modelCalibrate: "warningsHeaderModelCalibrate"
                }
                return key in headers ? i18next.t(headers[key], { lng: this.currentLanguage }) : ""
            }
        },
        watch: {
            warnings(){
                this.updateDimensions()
            }
        },
        mounted(){
            this.updateDimensions()
            // console.log('heights', this.lineHeight, this.fullBoxHeight)
            console.log('filteredWarnings', this.filteredWarnings)
        },
        components: {
            AlertTriangleIcon
        }
    })
</script>



