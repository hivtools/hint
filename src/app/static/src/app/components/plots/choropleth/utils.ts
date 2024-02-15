import {Feature} from "geojson";
import {LevelLabel} from "../../../types";
import {FilterOption} from "../../../generated";


export const getFeaturesByLevel = function(features: Feature[], featureLevels: LevelLabel[]) {
    const result = {} as { [k: number]: Feature[] };
    featureLevels.forEach((level: LevelLabel) => {
        result[level.id] = [];
    });
    features.forEach((feature: Feature) => {
        const adminLevel = parseInt(feature.properties!["area_level"]); //Country (e.g. "MWI") is level 0
        if (result[adminLevel]) {
            result[adminLevel].push(feature);
        }
    });
    return result;
};

export const getVisibleFeatures = function(features: Feature[], selectedLevels: FilterOption[], selectedAreas: FilterOption[]) {
    const levels = selectedLevels.map((l: FilterOption) => parseInt(l.id));
    const areas = selectedAreas.map((a: FilterOption) => a.id);
    return features.filter((feature: Feature) => {
        return feature.properties && levels.includes(feature.properties["area_level"]) && areas.includes(feature.properties["area_id"]);
    });
};

// export const calculateBounds = function(map: ) {
//     if (this.initialised) {
//
//
//         if (map && map.leafletObject) {
//             map.leafletObject.fitBounds(this.selectedAreaFeatures.map((f: Feature) => new GeoJSON(f).getBounds()) as any);
//         }
//     }
// }
