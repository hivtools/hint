<template>
    <div>
        <l-map ref="map" style="height: 800px; width: 100%" @ready="updateBounds">
            <l-geo-json v-for="feature in currentFeatures"
                        ref="featureRefs"
                        :key="feature.properties.area_id"
                        :geojson="feature"
                        :options-style="() => {return {...style, fillColor: getColour(feature)}}">
            </l-geo-json>
            <reset-map @reset-view="updateBounds"></reset-map>
            <map-legend :indicator-metadata="indicatorMetadata"
                        :colour-range="colourRange"
                        :scale-levels="scaleLevels"></map-legend>
        </l-map>
    </div>

</template>

<script lang="ts">
import {computed, defineComponent, PropType, ref, watch} from "vue";
import {useStore} from "vuex";
import {RootState} from "../../../root";
import {PlotData} from "../../../store/plotData/plotData";
import { LMap, LGeoJson } from "@vue-leaflet/vue-leaflet";
import { Feature } from "geojson";
import {getVisibleFeatures, getFeatureIndicator} from "./utils";
import ResetMap from "./ResetMap.vue";
import MapLegend from "./MapLegend.vue";
import {ChoroplethSelections} from "../../../store/plottingSelections/plottingSelections";
import {useFilterScale} from "../useFilterScale";
import {getColourRange, getScaleLevels} from "../utils";
import {NumericRange} from "../../../types";

export default defineComponent({
    props: {
        selections: {
            type: Object as PropType<ChoroplethSelections>,
            required: true
        },
    },
    setup(props) {
        const store = useStore<RootState>();
        const {selectedScale} = useFilterScale();
        const indicatorMetadata = store.getters["modelCalibrate/indicatorMetadata"];
        const plotData = computed<PlotData>(() => store.state.plotData.choropleth);
        const colourRange = ref<NumericRange>(getColourRange(indicatorMetadata.value, selectedScale.value, plotData.value));
        const scaleLevels = ref<any>(getScaleLevels(indicatorMetadata.value, colourRange.value));
        watch(plotData, (newData, oldData) => {
            console.log("updating colour Range and scale levels")
            indicatorMetadata.value = store.getters["modelCalibrate/indicatorMetadata"];
            colourRange.value = getColourRange(indicatorMetadata.value, selectedScale.value, plotData.value);
            scaleLevels.value = getScaleLevels(indicatorMetadata.value, colourRange.value);
        })
        const map = ref<typeof LMap | null>(null);
        const featureRefs = ref<typeof LGeoJson[]>([]);

        const features = store.state.baseline.shape ?
                store.state.baseline.shape.data.features as Feature[] : [] as Feature[];

        const currentFeatures = computed(() => {
            const selectedLevel = store.state.plotSelections.choropleth.filters
                    .find(f => f.stateFilterId === "detail")!.selection;
            const selectedAreas = store.state.plotSelections.choropleth.filters
                    .find(f => f.stateFilterId === "area")!.selection;
            return getVisibleFeatures(features, selectedLevel, selectedAreas);
        });

        const updateBounds = () => {
            if (currentFeatures.value.length > 0) {
                map.value?.leafletObject.fitBounds(featureRefs.value.map(f => f.leafletObject.getBounds()));
            }
        }

        const featureIndicators = computed(() => {
            const metadata = indicatorMetadata.value;
            console.log("recalculating featureIndicators ", metadata)
            if (!metadata) {
                return {}
            } else {
                console.log("colour range is ", colourRange.value)
                console.log("select scale is ", selectedScale.value)
                return getFeatureIndicator(
                    plotData.value,
                    metadata,
                    colourRange.value ? colourRange.value : {max: 1, min: 0}
                );
            }
        });

        const showColour = (feature: Feature) => {
            return featureIndicators.value[feature.properties!.area_id]
        };

        const getColour = (feature: Feature) => {
            if (showColour(feature)) {
                return featureIndicators.value[feature.properties!.area_id].color;
            } else {
                //show a lighter grey than the outlines if no data
                //so unselected regions are still distinguishable
                return "rgb(200,200,200)";
            }
        };

        const style = {
            className: "geojson"
        };

        return {
            map,
            featureRefs,
            plotData,
            currentFeatures,
            updateBounds,
            style,
            getColour,
            colourRange,
            scaleLevels
        }
    },
    components: {
        LMap,
        LGeoJson,
        ResetMap,
        MapLegend
    }

})
</script>
