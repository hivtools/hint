<template>
    <div v-if="show" class="p-3">
        <div class="ml-2">
            <div class="form-check dynamic-filtered">
                <label class="form-check-label">
                    <input id="type-input-dynamic-filtered" class="form-check-input" type="radio" :name="scaleTypeGroup"
                           :value="scaleType.DynamicFiltered"
                           v-model="selectedScale.type"
                           @change="updateScaleType">
                    <span v-translate="'filteredDataset'"></span>
                </label>
            </div>
            <div class="form-check mt-1 static-default">
                <label class="form-check-label">
                    <input id="type-input-default" class="form-check-input" type="radio" :name="scaleTypeGroup"
                           :value="scaleType.Default"
                           v-model="selectedScale.type"
                           @change="updateScaleType">
                    <span v-translate="'default'"></span>
                </label>
            </div>
            <div class="form-check mt-1 static-custom">
                <label class="form-check-label">
                    <input id="type-input-custom" class="form-check-input" type="radio" :name="scaleTypeGroup"
                           :value="scaleType.Custom"
                           v-model="selectedScale.type"
                           @change="updateScaleType">
                    <span v-translate="'custom'"></span>
                </label>
            </div>

            <div class="mt-2 ml-2 static-custom-values">
                <form novalidate>
                    <div class="row p-0 mb-2">
                        <label for="custom-min-input" class="col col-form-label col-2"><span v-translate="'min'"></span></label>
                        <div class="col pt-1 pr-1">
                            <input id="custom-min-input" type="number" :step="colourScaleStep"
                                   v-model.number="selectedScale.customMin"
                                   :max="selectedScale.customMax"
                                   @input="updateScaleMin"
                                   :disabled="disableCustom">
                        </div>
                        <p v-if="selectedScale.customMin" class="col col-form-label pl-0">{{ scaleText }}</p>
                    </div>
                    <div class="row">
                        <label class="col col-form-label col-2" for="custom-max-input"><span v-translate="'max'"></span></label>
                        <div class="col pt-1 pr-1">
                            <input id="custom-max-input" type="number" :step="colourScaleStep"
                                   v-model.number="selectedScale.customMax"
                                   :min="selectedScale.customMin"
                                   @input="updateScaleMax"
                                   :disabled="disableCustom">
                        </div>
                        <p v-if="selectedScale.customMax" class="col col-form-label pl-0">{{ scaleText }}</p>
                    </div>
                </form>
            </div>
        </div>
        <div class="text-danger">{{ invalidMsg }}</div>
    </div>
</template>

<script lang="ts">

import {computed, defineComponent} from "vue";
import {ScaleType, ScaleSettings} from "../../../store/plotState/plotState";
import i18next from "i18next";
import {useFilterScale} from "../useFilterScale";
import {debounce} from "./utils";

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
    },
    setup(props) {
        const {selectedScale, updateOutputColourScale, colourScaleStep, indicatorMetadata} = useFilterScale();

        const invalidMsg = computed(() => {
            let result = null;
            if (selectedScale.value.type === ScaleType.Custom) {
                if (selectedScale.value.customMin >= selectedScale.value.customMax) {
                    result = i18next.t("maxMustBeGreaterThanMin");
                }
            }
            return result;
        });

        const disableCustom = computed(() => {
            return selectedScale.value.type !== ScaleType.Custom;
        });

        const scaleText = computed(() => {
            if (indicatorMetadata.value) {
                const {format, scale} = indicatorMetadata.value
                if (!format.includes('%') && scale !== 1) {
                    return `x ${scale}`
                }
            }
            return ''
        });

        const scaleTypeGroup = computed(() => {
            return `${props.name}-scaleType`;
        });

        const updateScale = (prop: keyof ScaleSettings) => {
            return (event: Event) => {
                console.log("Updating scale", prop)
                const newScaleSetting = {...selectedScale.value};
                const input = event.target as HTMLInputElement;
                newScaleSetting[prop] = parseInt(input.value);
                updateOutputColourScale(newScaleSetting)
            }
        }

        const updateScaleType = updateScale("type");
        const updateScaleMin = updateScale("customMin");
        const updateScaleMax = updateScale("customMax");
        const debounceUpdateScaleMin = debounce((event: Event) => updateScaleMin(event), 800)
        const debounceUpdateScaleMax = debounce((event: Event) => updateScaleMax(event), 800)

        return {
            invalidMsg,
            disableCustom,
            scaleText,
            scaleTypeGroup,
            scaleType: ScaleType,
            colourScaleStep,
            selectedScale,
            updateScaleType,
            updateScaleMin,
            updateScaleMax,
            debounceUpdateScaleMin,
            debounceUpdateScaleMax
        }
    }
})
</script>
