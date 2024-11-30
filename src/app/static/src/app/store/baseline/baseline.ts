import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {
    NestedFilterOption,
    PjnzResponse,
    PopulationResponse,
    ShapeResponse,
    Error,
} from "../../generated";
import { Dataset, Release, Dict, DatasetResourceSet, DatasetResource } from "../../types";
import {ReadyState, RootState} from "../../root";
import {inputResourceTypes} from "../../utils";
import {AdrDatasetType} from "../adr/adr";

export interface BaselineState extends ReadyState {
    selectedDataset: Dataset | null
    selectedDatasetHasChanged: boolean
    selectedRelease: Release | null
    pjnzError: Error | null
    pjnzErroredFile: string | null
    country: string
    iso3: string
    pjnz: PjnzResponse | null
    shape: ShapeResponse | null
    regionFilters: NestedFilterOption[]
    flattenedRegionFilters: Dict<NestedFilterOption>
    shapeError: Error | null
    shapeErroredFile: string | null
    population: PopulationResponse | null,
    populationError: Error | null,
    populationErroredFile: string | null,
    validating: boolean,
    validatedConsistent: boolean,
    baselineError: Error | null
}

export const initialBaselineState = (): BaselineState => {
    return {
        selectedDataset: null,
        selectedDatasetHasChanged: false,
        selectedRelease: null,
        country: "",
        iso3: "",
        pjnzError: null,
        pjnzErroredFile: null,
        pjnz: null,
        shape: null,
        regionFilters: [],
        flattenedRegionFilters: {},
        shapeError: null,
        shapeErroredFile: null,
        population: null,
        populationError: null,
        populationErroredFile: null,
        ready: false,
        validating: false,
        validatedConsistent: false,
        baselineError: null
    }
};

export type AreaProperties = {
    area_level: number,
    area_name: string,
    area_sort_order: number
}

export const baselineGetters = {
    complete: (state: BaselineState) => {
        return state.validatedConsistent &&
            !!state.country && !!state.iso3 && !!state.shape && !!state.population
    },
    selectedDatasetAvailableResources: (state: BaselineState, getters: any, rootState: RootState): unknown => {
        const resources: { [k in keyof DatasetResourceSet]?: DatasetResource | null } = {}
        const { selectedDataset } = state

        if (selectedDataset?.id && selectedDataset.resources) {
            const selectedDatasetFromDatasets = rootState.adr.adrData[AdrDatasetType.Input].datasets
                .find(dataset => dataset.id === selectedDataset.id) || null

            const checkResourceAvailable = (resourceType: string) => {
                const res = selectedDatasetFromDatasets?.resources
                    .some((resource: any) => resource.resource_type && resource.resource_type === resourceType)
                return res
            }

            Object.entries(inputResourceTypes).forEach(([key, value]) => {
                resources[key as keyof typeof resources] =
                    checkResourceAvailable(value) ? selectedDataset.resources[key as keyof typeof resources] : null
            })
        }
        return resources
    },
    areaIdToPropertiesMap: (state: BaselineState): Dict<AreaProperties> => {
        const features = state.shape?.data.features
        if (!features) {
            return {}
        }
        return features.reduce(
            (map: Dict<AreaProperties>, feature: any) => {
                if (feature.properties?.area_id) {
                    map[feature.properties.area_id] = {
                        area_level: feature.properties.area_level,
                        area_name: feature.properties.area_name,
                        area_sort_order: feature.properties.area_sort_order
                    }
                }
                return map;
            }, {});
    },
    // Build a map of all area IDs to their full area ID path
    areaIdToParentPath: (state: BaselineState): Dict<string[]> => {
        const properties = state.shape?.data.features
            .map(f => f.properties)
            .filter(f => f !== undefined);
        if (!properties) {
            return {}
        }

        // Map of all feature area ids and their parent area id
        const parentMap: Dict<string> = properties.reduce((acc,cur)=>{
            acc[cur.area_id] = cur.parent_area_id
            return acc
        },{});

        // Returns an array of areaIds that make up the full parent chain for a given area id
        const getParentAreaIdChain = (areaId: string): string[] => {
            const parentAreaIds: string[] = [];
            let currentAreaId = parentMap[areaId];

            while (currentAreaId !== null) {
                parentAreaIds.push(currentAreaId);
                currentAreaId = parentMap[currentAreaId];
            }

            return parentAreaIds.reverse(); // Return in order from root to current
        };

        // Map of each indicator area id to their full parent chain
        return properties.reduce((acc,cur)=>{
            acc[cur.area_id] = getParentAreaIdChain(cur.area_id)
            return acc
        },{})
    }
};

const getters = baselineGetters;

const namespaced = true;

export const baseline = (existingState: Partial<RootState> | null): Module<BaselineState, RootState> => {
    return {
        namespaced,
        state: {...initialBaselineState(), ...existingState && existingState.baseline},
        getters,
        actions,
        mutations
    };
};
