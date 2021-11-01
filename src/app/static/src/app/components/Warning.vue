<template>
    <div>
        <h4 class="alert-heading pt-2">
            <alert-triangle-icon size="1.5x" class="custom-class mr-1 mb-1"></alert-triangle-icon>
            <span v-translate="headerText(origin)"></span>
        </h4>
        <div :style="{ overflowY: 'hidden', height: `${this.renderedBoxHeight}px` }">
            <ul class="mb-0" ref="warningBox" id="warningBox">
                <li v-for="warning in warnings" :key="warning.text"><div :style="lineStyling">{{ warning.text }}</div></li>
            </ul>
            <p ref="line" class="mb-0 invisible">...</p>
        </div>
        <button @click="toggleShowFullBox" v-if="warningsLengthy" class="btn btn-link alert-link">{{ buttonText }}</button>
    </div>                 
</template>

<script lang="ts">
    import Vue from "vue";
    import { AlertTriangleIcon } from "vue-feather-icons";
    import i18next from "i18next";
    import { mapStateProp } from "../utils";
    import { RootState } from "../root";
    import { Language } from "../store/translations/locales";
    import { Warning } from "../generated";
    import { Dict } from "../types";

    interface Props {
        origin: string;
        warnings: Warning[];
        maxLines: number;
    }

    interface Data {
        showFullBox: boolean;
        fullBoxHeight: number;
        lineHeight: number;
    }

    interface Methods {
        toggleShowFullBox: () => void;
        updateDimensions: () => void;
        headerText: (key: string) => string;
    }

    interface Computed  {
        currentLanguage: Language;
        renderedBoxHeight: number;
        warningsLengthy: boolean;
        buttonText: string;
        maxBoxHeight: number;
        // lineStyling: Dict<string>;
        lineStyling: {
            height?: string,
            // whiteSpace?: string,
            // overflow?: string,
            // textOverflow?: string,
            // listStylePosition?: string,
            // marginLeft?: string
        };
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "Warning",
        props: {
            origin: String,
            warnings: Array,
            maxLines: {
                default: 2,
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
                if (!this.warningsLengthy){
                    return this.fullBoxHeight
                } else {
                    return this.showFullBox ? this.fullBoxHeight : this.maxBoxHeight
                }
            },
            maxBoxHeight(){
                return this.maxLines * this.lineHeight
            },
            warningsLengthy(){
                return this.fullBoxHeight > this.maxBoxHeight
            },
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
            buttonText(){
                return i18next.t(this.showFullBox ? "showLess" : "showMore", { lng: this.currentLanguage });
            },
            lineStyling(){
                if (this.warningsLengthy && !this.showFullBox){
                    if (this.warnings.length === 1){
                        return {
                            height: `${this.maxBoxHeight}px`,
                            overflow: "hidden",
                            "display": "-webkit-box",
                            "-webkit-line-clamp": this.maxLines,
                            "-webkit-box-orient": "vertical"
                        }
                    } else {
                        return {
                            height: `${this.lineHeight}px`,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            // listStylePosition: "inside",
                            // marginLeft: "-16px"
                        }

                    }
                } else {
                    return {}
                }
            }
        },
        methods: {
            toggleShowFullBox(){
                this.showFullBox = !this.showFullBox;
                if (this.showFullBox){
                    this.updateDimensions();
                }
            },
            updateDimensions(){
                let counter = 0
                const id = setInterval(() => {
                    counter++
                    if (this.$refs.warningBox){
                        this.lineHeight = (this.$refs.line as HTMLElement).clientHeight;
                        this.fullBoxHeight = (this.$refs.warningBox as HTMLElement).clientHeight;
                        clearInterval(id)
                    } else if (counter > 20){
                        clearInterval(id)
                    }
                }, 100)
            },
            headerText(key){
                const headers: { [key: string]: string } = {
                    modelOptions: "warningsHeaderModelOptions",
                    modelRun: "warningsHeaderModelRun",
                    modelCalibrate: "warningsHeaderModelCalibrate"
                }
                return key in headers ? headers[key] : ""
            }
        },
        watch: {
            warnings(){
                this.updateDimensions()
            }
        },
        mounted(){
            this.updateDimensions()
        },
        components: {
            AlertTriangleIcon
        }
    })
</script>



