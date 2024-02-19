<template>
    <l-control position="bottomright">
        <div class="legend-container">
            <map-adjust-scale class="legend-element legend-adjust map-control"
                              name="colour"
                              :step="colourScaleStep"
                              :show="showAdjust"
                              :scale-to-adjust="colourScales"
                              @update="update"
                              :metadata="indicatorMetadata">
            </map-adjust-scale>
            <div class="legend-element map-control p-3">
                <label>{{indicatorMetadata.name}}</label>
                <div class="legend" v-for="(level, index) in levels" v-bind:key="index">
                    <i v-bind:style="level.style"></i>
                    <span class="level">{{ level.val }}</span>
                    <span class="hidden" style="display: none">{{ level.style }}</span>
                    <br/>
                </div>
                <div v-if="!!colourScales" class="adjust-scale mt-1">
                    <a @click="toggleAdjust" href="">
                        <span v-if="showAdjust" v-translate="'done'"></span>
                        <span v-if="!showAdjust" v-translate="'adjustScale'"></span>
                    </a>
                </div>
            </div>
        </div>
    </l-control>
</template>

<script lang="ts">

import {computed, defineComponent, ref} from "vue";
import {LControl} from "@vue-leaflet/vue-leaflet";
import {useStore} from "vuex";
import {RootState} from "../../../root";
import {ChoroplethIndicatorMetadata} from "../../../generated";
import {colorFunctionFromName, formatLegend, roundToContext} from "./utils";
import {ScaleType} from "../../../store/plotSelections/plotSelections";
import {ScaleSelections} from "../../../store/plottingSelections/plottingSelections";
import MapAdjustScale from "./MapAdjustScale.vue";

export default defineComponent({
    setup() {
        const store = useStore<RootState>();

        const selectedIndicator = computed<string>(() => {
            return store.state.plotSelections.choropleth.filters
                .find(f => f.stateFilterId === "indicator").selection[0].id
        })

        const indicatorMetadata = computed<ChoroplethIndicatorMetadata>(() => {
            return store.state.modelCalibrate.metadata?.indicators.find(i => i.indicator == selectedIndicator.value)
        });

        const colourScales = computed<ScaleSelections>(() => {
            return store.state.plottingSelections.colourScales.output
        })

        const showAdjust = ref<boolean>(false);

        const toggleAdjust = (e: Event) => {
            e.preventDefault();
            showAdjust.value = !showAdjust.value;
        };

        const colourRange = computed(() => {
            if (!indicatorMetadata.value) {
                return {max: 1, min: 0}
            } else {
                const type = colourScales.value[selectedIndicator.value] && colourScales.value[selectedIndicator.value].type;
                switch (type) {
                    // case ScaleType.DynamicFull:
                    //     if (!this.fullIndicatorRanges.hasOwnProperty(selectedIndicator.value)) {
                    //         // cache the result in the fullIndicatorRanges object for future lookups
                    //         /* eslint vue/no-side-effects-in-computed-properties: "off" */
                    //         this.fullIndicatorRanges[selectedIndicator.value] =
                    //             getIndicatorRange(this.chartdata, selectedIndicator.value)
                    //     }
                    //     return this.fullIndicatorRanges[selectedIndicator.value];
                    // case ScaleType.DynamicFiltered:
                    //     // TODO: just pass in full chartdata vs filtered plot data? don't need much fancier
                    //     // I don't think
                    //     return getIndicatorRange(
                    //         this.chartdata,
                    //         selectedIndicator.value,
                    //         this.nonAreaFilters,
                    //         this.selections.selectedFilterOptions,
                    //         this.selectedAreaIds.filter((a: string) => this.currentLevelFeatureIds.indexOf(a) > -1)
                    //     );
                    case ScaleType.Custom:
                        return {
                            min: colourScales.value[selectedIndicator.value].customMin,
                            max: colourScales.value[selectedIndicator.value].customMax
                        };
                    case ScaleType.Default:
                    default:
                        return {max: indicatorMetadata.value.max, min: indicatorMetadata.value.min}
                }
            }
        });

        const levels = computed(() => {
            if (indicatorMetadata.value) {
                const { format, scale, colour, invert_scale: invertScale } = indicatorMetadata.value;
                const { min, max } = colourRange.value;
                const colorFunction = colorFunctionFromName(colour);
                const step = (max - min) / 5;
                const indexes = max == min ? [0] : [5, 4, 3, 2, 1, 0];
                return indexes.map((i) => {
                    let val: any = min + (i * step);
                    val = roundToContext(val, [min, max]);
                    let valAsProportion = (max != min) ? (val - min) / (max - min) : 0;
                    if (invertScale) {
                        valAsProportion = 1 - valAsProportion;
                    }
                    val = formatLegend(val, format, scale)
                    return {
                        val, style: {background: colorFunction(valAsProportion)}
                    }
                });
            }
            return [];
        })

        return {
            indicatorMetadata,
            levels,
            colourScales,
            showAdjust,
            toggleAdjust
        }
    },
    components: {
        LControl,
        MapAdjustScale
    }
})
</script>
