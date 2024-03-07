<template>
    <div v-if="show" class="pt-2 pl-3">
        <div class="static-container">
            <div><span v-translate="'static'"></span></div>
            <div class="ml-2">
                <div class="form-check static-default">
                    <label class="form-check-label">
                        <input id="type-input-default" class="form-check-input" type="radio" :name="scaleTypeGroup"
                               :value="scaleType.Default"
                               v-model="scaleToAdjustM" @change="update">
                        <span v-translate="'default'"></span>
                    </label>
                </div>
                <div class="form-check mt-1 static-custom">
                    <label class="form-check-label">
                        <input id="type-input-custom" class="form-check-input" type="radio" :name="scaleTypeGroup"
                               :value="scaleType.Custom"
                               v-model="scaleToAdjustM" @change="update">
                        <span v-translate="'custom'"></span>
                    </label>
                </div>

                <div class="mt-2 ml-2 static-custom-values">
                    <form novalidate>
                        <div class="row p-0 mb-2">
                            <label for="custom-min-input" class="col col-form-label col-2"><span v-translate="'min'"></span></label>
                            <div class="col pt-1 pr-1">
<!--                                <input id="custom-min-input" type="number" :step="colourScaleStep"-->
<!--                                       v-model.number="scaleToAdjust.customMin"-->
<!--                                       :max="scaleToAdjust.customMax"-->
<!--                                       @change="update" @keyup="update" :disabled="disableCustom">-->
                            </div>
                            <p v-if="scaleToAdjust.customMin" class="col col-form-label pl-0">{{ scaleText }}</p>
                        </div>
                        <div class="row">
                            <label class="col col-form-label col-2" for="custom-max-input"><span v-translate="'max'"></span></label>
                            <div class="col pt-1 pr-1">
<!--                                <input id="custom-max-input" type="number" :step="colourScaleStep"-->
<!--                                       v-model.number="scaleToAdjust.customMax"-->
<!--                                       :min="scaleToAdjust.customMin"-->
<!--                                       @change="update" @keyup="update" :disabled="disableCustom">-->
                            </div>
                            <p v-if="scaleToAdjust.customMax" class="col col-form-label pl-0">{{ scaleText }}</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="dynamic-container">
            <div class="mt-1"><span v-translate="'fitToCurrentDataset'"></span></div>
            <div class="ml-2">
                <div class="form-check mt-1">
                    <label class="form-check-label">
                        <input id="type-input-dynamic-full" class="form-check-input" type="radio" :name="scaleTypeGroup"
                               :value="scaleType.DynamicFull"
                               v-model="scaleToAdjustM" @change="update">
                        <span v-translate="'entireDataset'"></span>
                    </label>
                </div>
            </div>
            <div class="ml-2">
                <div class="form-check mt-1">
                    <label class="form-check-label">
                        <input id="type-input-dynamic-filtered" class="form-check-input" type="radio" :name="scaleTypeGroup"
                               :value="scaleType.DynamicFiltered"
                               v-model="scaleToAdjustM" @change="update">
                        <span v-translate="'filteredDataset'"></span>
                    </label>
                </div>
            </div>
            <div class="text-danger">{{ invalidMsg }}</div>
        </div>
    </div>
</template>

<script lang="ts">

import {computed, defineComponent, defineEmits, PropType} from "vue";
import {ScaleType} from "../../../store/plotSelections/plotSelections";
import i18next from "i18next";
import {ChoroplethIndicatorMetadata} from "../../../generated";
import {ScaleSettings} from "../../../store/plottingSelections/plottingSelections";
import { scaleStepFromMetadata } from "./utils";

export default defineComponent({
    props: {
        name: {
            type: String,
            required: true
        },
        show: {
            type: Boolean,
            required: true
        },
        metadata: {
            type: Object as PropType<ChoroplethIndicatorMetadata>,
            required: true
        },
        scaleToAdjust: {
            type: Object as PropType<ScaleSettings>,
            required: true
        },
    },
    setup(props) {
        const invalidMsg = computed(() => {
            let result = null;
            if (props.scaleToAdjust.type.valueOf() === ScaleType.Custom.valueOf()) {
                if (props.scaleToAdjust?.customMin >= props.scaleToAdjust.customMax) {
                    result = i18next.t("maxMustBeGreaterThanMin");
                }
            }
            return result;
        });

        const disableCustom = computed(() => {
            return props.scaleToAdjust.type.valueOf() !== ScaleType.Custom.valueOf();
        });

        const scaleText = computed(() => {
            if (props.metadata) {
                const {format, scale} = props.metadata
                if (!format.includes('%') && scale !== 1) {
                    return `x ${scale}`
                }
            }
            return ''
        });

        const scaleTypeGroup = computed(() => {
            return `${props.name}-scaleType`;
        });

        const colourScaleStep = computed(() => {
            return scaleStepFromMetadata(props.metadata)
        });

        function update() {
            console.log("Updating scale")
        }

        const emit = defineEmits({
            updateScaleToAdjust(payload: { type: ScaleType }) {
                return true;
            }
        });

        const scaleToAdjustM = computed({
            get: () => props.scaleToAdjust,
            set: (value: ScaleSettings) => {
                emit('updateScaleToAdjust', value)
            }
        })

        return {
            invalidMsg,
            disableCustom,
            scaleText,
            scaleTypeGroup,
            scaleType: ScaleType,
            colourScaleStep,
            update,
            scaleToAdjustM
        }
    }
})

</script>
