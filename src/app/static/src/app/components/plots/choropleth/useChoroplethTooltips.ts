import {Ref} from "vue";
import {Feature} from "geojson";
import {Layer} from "leaflet";
import {build_missing_id_text, formatOutput} from "../utils";
import {IndicatorValuesDict} from "../../../types";
import {IndicatorMetadata} from "../../../generated";
import {LGeoJson} from "@vue-leaflet/vue-leaflet";

export const useChoroplethTooltips = (featureData: Ref<IndicatorValuesDict>,
                                      indicatorMetadata: Ref<IndicatorMetadata>,
                                      currentFeatures: Ref<Feature[]>,
                                      featureRefs: Ref<typeof LGeoJson[]>,
                                      currentLanguage: string) => {
    const createTooltips = {
        onEachFeature: (feature: Feature, layer: Layer) => {
            layer.bindTooltip(tooltipContent(feature, featureData.value, indicatorMetadata.value, currentLanguage))
        }
    };

    const updateTooltips = () => {
        currentFeatures.value.forEach((feature: Feature) => {
            const properties = feature.properties
            if (properties && properties.area_id) {
                const geojson = featureRefs.value.find(f => f.geojson?.properties?.area_id === properties.area_id)
                if (geojson && geojson.geojson && geojson.leafletObject) {
                    geojson.leafletObject.eachLayer((layer: Layer) => {
                        setLayerTooltipContent(layer, geojson.geojson)
                    })
                }
            }
        })
    };

    const setLayerTooltipContent = (layer: Layer, feature: Feature) => {
        layer.setTooltipContent(tooltipContent(feature, featureData.value, indicatorMetadata.value, currentLanguage))
    };

    return {
        createTooltips,
        updateTooltips
    }
};

const tooltipContent = function (feature: Feature, featureIndicators: IndicatorValuesDict,
                                 indicatorMetadata: IndicatorMetadata, currentLanguage: string): string {
    let format = "";
    let scale = 1;
    let accuracy: number | null = null;
    if (indicatorMetadata) {
        format = indicatorMetadata.format;
        scale = indicatorMetadata.scale;
        accuracy = indicatorMetadata.accuracy;
    }

    const area_id = feature.properties && feature.properties["area_id"];
    const area_name = feature.properties && feature.properties["area_name"];

    const values = featureIndicators[area_id];
    const value = values && values!.value;
    const lower_value = values && values!.lower_value;
    const upper_value = values && values!.upper_value;

    const stringVal = (value || value === 0) ? value.toString() : "";
    const stringLower = (lower_value || lower_value === 0) ? lower_value.toString() : "";
    const stringUpper = (upper_value || upper_value === 0) ? upper_value.toString() : "";

    const areaNameText = `<strong>${area_name}</strong>`
    const stringValText = stringVal ? `<br>${formatOutput(stringVal, format, scale, accuracy, true)}` : "";
    const boundariesText = stringLower && stringUpper ?
        `<br>(${formatOutput(stringLower, format, scale, accuracy, true) + " - " + 
        formatOutput(stringUpper, format, scale, accuracy, true)})` : "";
    const missingIdsText = build_missing_id_text(values, area_id, currentLanguage);

    return "<div>" + areaNameText + stringValText + boundariesText + missingIdsText + "</div>"
}
