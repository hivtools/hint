import {ColourScaleType} from "../../store/colourScales/colourScales";
<template>
    <div v-if="show" class="pt-2 pl-3">
        <div class="form-check">
            <label class="form-check-label">
                <input id="type-input-default" class="form-check-input" type="radio" name="scaleType" :value="ColourScaleType.Default"
                       v-model="colourScaleToAdjust.type" @change="update">
                Default
            </label>
        </div>
        <div class="form-check mt-1">
            <label class="form-check-label">
                <input id="type-input-custom" class="form-check-input" type="radio" name="scaleType" :value="ColourScaleType.Custom"
                       v-model="colourScaleToAdjust.type" @change="update">
                Custom
            </label>
        </div>

        <div class="mt-2 ml-2">
            <div class="row p-0 mb-2">
                <label for="custom-min-input" class="col col-form-label col-2">Min</label>
                <div class="col pt-1">
                    <input id="custom-min-input" type="number" step="any" v-model.number="colourScaleToAdjust.customMin"
                           @change="update" @keyup="update" :disabled="disableCustom">
                </div>
            </div>
            <div class="row">
                <label class="col col-form-label col-2" for="custom-max-input">Max</label>
                <div class="col pt-1">
                    <input id="custom-max-input" type="number" step="any" v-model.number="colourScaleToAdjust.customMax"
                           @change="update" @keyup="update" :disabled="disableCustom">
                </div>
            </div>
        </div>
        <div class="scale-error">{{invalidMsg}}</div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ColourScaleSettings, ColourScaleType} from "../../store/plottingSelections/plottingSelections";

    interface Props {
        show: Boolean,
        colourScale: ColourScaleSettings
    }

    interface Computed {
        disableCustom: Boolean,
        invalidMsg: String | null
    }

    interface Data {
        colourScaleToAdjust: ColourScaleSettings
    }

    interface Methods {
        update: () => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "MapAdjustScale",
        props: {
           show: Boolean,
           colourScale: Object,
        },
        data(): any {
            return {
                colourScaleToAdjust:  {...this.colourScale},
                ColourScaleType
            };
        },
        computed: {
            invalidMsg() {
                let result = null;
                if (this.colourScaleToAdjust.type == ColourScaleType.Custom) {
                    if (this.colourScaleToAdjust.customMin >= this.colourScaleToAdjust.customMax) {
                        result = `Max must be greater than min`;
                    }
                }

                return result;
            },
            disableCustom() {
                return this.colourScaleToAdjust.type != ColourScaleType.Custom;
            }
        },
        methods: {
            update: function(){
                if (this.invalidMsg == null) {
                    this.$emit("update", this.colourScaleToAdjust)
                }
            }
        },
        watch: {
            colourScale: function(){
                this.colourScaleToAdjust = {...this.colourScale};
            }
        }
    });
</script>
