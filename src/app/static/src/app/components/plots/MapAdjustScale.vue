import {ScaleType} from "../../store/colourScales/colourScales";
<template>
    <div v-if="show" class="pt-2 pl-3">
        <div v-if="!(hideStaticCustom && hideStaticDefault)" class="static-container">
            <div><span v-translate="'static'"></span></div>
            <div class="ml-2">
                <div v-if="!hideStaticDefault" class="form-check static-default">
                    <label class="form-check-label">
                        <input id="type-input-default" class="form-check-input" type="radio" name="scaleType"
                               :value="ColourScaleType.Default"
                               v-model="colourScaleToAdjust.type" @change="update">
                        <span v-translate="'default'"></span>
                    </label>
                </div>
                <div v-if="!hideStaticCustom" class="form-check mt-1 static-custom">
                    <label class="form-check-label">
                        <input id="type-input-custom" class="form-check-input" type="radio" name="scaleType"
                               :value="ColourScaleType.Custom"
                               v-model="colourScaleToAdjust.type" @change="update">
                        <span v-translate="'custom'"></span>
                    </label>
                </div>

                <div v-if="!hideStaticCustom" class="mt-2 ml-2 static-custom-values">
                    <form novalidate>
                        <div class="row p-0 mb-2">
                            <label for="custom-min-input" class="col col-form-label col-2"><span v-translate="'min'"></span></label>
                            <div class="col pt-1 pr-1">
                                <input id="custom-min-input" type="number" :step="step"
                                       v-model.number="colourScaleToAdjust.customMin"
                                       :max="colourScaleToAdjust.customMax"
                                       @change="update" @keyup="update" :disabled="disableCustom">
                            </div>
                            <p v-if="colourScaleToAdjust.customMin" class="col col-form-label pl-0">{{ scaleText}}</p>
                        </div>
                        <div class="row">
                            <label class="col col-form-label col-2" for="custom-max-input"><span v-translate="'max'"></span></label>
                            <div class="col pt-1 pr-1">
                                <input id="custom-max-input" type="number" :step="step"
                                       v-model.number="colourScaleToAdjust.customMax"
                                       :min="colourScaleToAdjust.customMin"
                                       @change="update" @keyup="update" :disabled="disableCustom">
                            </div>
                            <p v-if="colourScaleToAdjust.customMax" class="col col-form-label pl-0">{{ scaleText}}</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="mt-1"><span v-translate="'fitToCurrentDataset'"></span></div>
        <div class="ml-2">
            <div class="form-check mt-1">
                <label class="form-check-label">
                    <input id="type-input-dynamic-full" class="form-check-input" type="radio" name="scaleType"
                           :value="ColourScaleType.DynamicFull"
                           v-model="colourScaleToAdjust.type" @change="update">
                    <span v-translate="'entireDataset'"></span>
                </label>
            </div>
        </div>
        <div class="ml-2">
            <div class="form-check mt-1">
                <label class="form-check-label">
                    <input id="type-input-dynamic-filtered" class="form-check-input" type="radio" name="scaleType"
                           :value="ColourScaleType.DynamicFiltered"
                           v-model="colourScaleToAdjust.type" @change="update">
                    <span v-translate="'filteredDataset'"></span>
                </label>
            </div>
        </div>

        <div class="text-danger">{{ invalidMsg }}</div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ScaleSettings, ScaleType} from "../../store/plottingSelections/plottingSelections";
    import i18next from "i18next";

    interface Props {
        show: boolean,
        scale: ScaleSettings,
        step: number,
        metadata: any,
        hideStaticDefault: boolean,
        hideStaticCustom: boolean
    }

    interface Computed {
        disableCustom: boolean,
        invalidMsg: string | null,
        scaleText: string
    }

    interface Data {
        scaleToAdjust: ScaleSettings
    }

    interface Methods {
        update: () => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "MapAdjustScale",
        props: {
            show: Boolean,
            scale: Object,
            step: Number,
            metadata: Object,
            hideStaticDefault: Boolean,
            hideStaticCustom: Boolean
        },
        data(): any {
            return {
                colourScaleToAdjust: {...this.scale},
                ColourScaleType: ScaleType
            };
        },
        computed: {
            invalidMsg() {
                let result = null;
                if (this.scaleToAdjust.type == ScaleType.Custom) {
                    if (this.scaleToAdjust.customMin >= this.sScaleToAdjust.customMax) {
                        result = i18next.t("maxMustBeGreaterThanMin");
                    }
                }

                return result;
            },
            disableCustom() {
                return this.scaleToAdjust.type != ScaleType.Custom;
            },
            scaleText(){
                const { format, scale, accuracy} = this.metadata
                if (!format.includes('%') && scale !== 1){
                    return `x ${scale}`
                } else return ''
            }
        },
        methods: {
            update: function () {
                if (this.invalidMsg == null) {
                    this.$emit("update", this.scaleToAdjust)
                }
            }
        },
        watch: {
            colourScale: function () {
                this.scaleToAdjust = {...this.scale};
            }
        }
    });
</script>
