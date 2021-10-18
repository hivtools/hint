<template>
    <div v-if="showAlert">
        <div class="content alert alert-warning">
            <h4 class="alert-heading"><alert-triangle-icon size="1.5x" class="custom-class mr-1 mb-1"></alert-triangle-icon>The following issues were reported for this {{ step }}.</h4>
            <div :style="containerBox">
                <ul class="mb-0" ref="warningBox">
                    <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
                </ul>
                <p ref="line">...</p>
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

    interface Props {
        step: number,
        warnings: string[],
        maxLines: number
    }

    interface Data {
        showFullBox: boolean,
        fullBoxHeight: number,
        lineHeight: number
    }

    interface Methods {
        toggleShowFullBox: () => void
    }

    interface Computed  {
        currentLanguage: Language,
        renderedBoxHeight: number,
        maxBoxHeight: number,
        containerBox: {
            height: string,
            overflowY: string
        },
        warningsLengthy: boolean,
        showAlert: boolean,
        buttonText: string
    }

    interface Warning {
        text: string,
        locations: ("model_options" | "model_fit" | "model_calibrate" | "review_output" | "download_results")[]
    };

    export default Vue.extend<Data, unknown, Computed, Props>({
        name: "WarningAlert",
        props: {
            step: Number,
            warnings: Array,
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
                lineHeight: 0
            };
        },
        computed: {
            renderedBoxHeight(){
                // if (!this.fullBoxHeight){
                //     return 0
                // }
                if (!this.warningsLengthy){
                    return this.fullBoxHeight
                } else {
                    return this.showFullBox ? this.fullBoxHeight : this.maxBoxHeight - this.lineHeight
                }
            },
            maxBoxHeight(){
                return this.maxLines * this.lineHeight
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
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
            showAlert(){
                return this.step > 2 && this.warnings.length > 0
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
            }
        },
        watch: {
            warnings(){
                this.fullBoxHeight = (this.$refs.warningBox as HTMLElement).clientHeight;
            }
        },
        mounted(){
            this.lineHeight = (this.$refs.line as HTMLElement).clientHeight;
            this.fullBoxHeight = (this.$refs.warningBox as HTMLElement).clientHeight;
            // console.log('heights', this.lineHeight, this.fullBoxHeight)
        },
        components: {
            AlertTriangleIcon
        }
    })
</script>



