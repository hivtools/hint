import {ColourScaleType} from "../../store/colourScales/colourScales";
<template>
    <div v-if="show" class="p-3">
        <div class="form-check">
            <label class="form-check-label">
                <input id="type-input-default" class="form-check-input" type="radio" name="scaleType" :value="ColourScaleType.Default"
                       v-model="colourScaleToAdjust.type" @change="update">
                Default
            </label>
        </div>

        <div class="form-check">
            <label class="form-check-label">
                <input id="type-input-custom" class="form-check-input" type="radio" name="scaleType" :value="ColourScaleType.Custom"
                       v-model="colourScaleToAdjust.type" @change="update">
                Custom
            </label>
        </div>
        <div class="ml-2">
            <div class="mt-2">
                <label for="custom-min-input">Min</label>
                <input id="custom-min-input" type="number" v-model.number="colourScaleToAdjust.customMin" @change="update" @keyup="update"
                       :disabled="disableCustom">
            </div>
            <div class="mt-2">
                <label for="custom-max-input">Max</label>
                <input id="custom-max-input" type="number" v-model.number="colourScaleToAdjust.customMax" @change="update" @keyup="update"
                       :disabled="disableCustom">
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ColourScaleSettings, ColourScaleType} from "../../store/colourScales/colourScales";

    interface Props {
        show: Boolean,
        colourScale: ColourScaleSettings
    }

    interface Computed {
        disableCustom: Boolean,
        invalidMsg: String | null //TODO: show this in the UI
    }

    interface Data {
        colourScaleToAdjust: ColourScaleSettings
    }

    export default Vue.extend<Data, {}, Computed, Props>({
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
