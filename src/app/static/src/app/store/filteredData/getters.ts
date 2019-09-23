import {RootState} from "../../root";
import {DataType, FilteredDataState} from "./filteredData";
import {IndicatorRange, Indicators, IndicatorValues} from "../../types";
import {interpolateCool, interpolateWarm} from "d3-scale-chromatic";

export const getters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        const sapState = rootState.surveyAndProgram;
        switch(state.selectedDataType){
            case (DataType.ANC):
                return sapState.anc ? sapState.anc.filters : null;
            case (DataType.Program):
                return sapState.program ? sapState.program.filters : null;
            case (DataType.Survey):
                return sapState.survey ? sapState.survey.filters : null;
            default:
                return null;
        }
    },
    regionOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        const shape = rootState.baseline && rootState.baseline.shape ? rootState.baseline.shape : null;
        let result =  shape && shape.filters && shape.filters.regions ? shape.filters.regions : [];
        //TODO: This is just to return something here until we have actual filter data from the API
        if (result && result.length == 0){
            result = [
                {name: "Northern Region", id: "MWI.1", options: [
                        {name: "Chitipa", id: "MWI.1.1"},
                        {name: "Karonga", id: "MWI.1.2"}
                    ]},
                {name: "Central Region", id: "MWI.2", options: [
                        {name: "Dedza", id: "MWI.2.1"},
                        {name: "Dowa", id: "MWI.2.2"}
                    ]},
                {name: "Southern Region", id: "MWI.3", options: [
                        {name: "Balaka", id: "MWI.3.1"}
                    ]}
            ];
        }
        return result;
    },
    colorFunctions: function(state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) {
      return {
          art: interpolateWarm,
          prev: interpolateCool
      }
    },
    regionIndicators: function(state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) {
        const data =  getUnfilteredData(state, rootState);
        if (!data) {
            return null;
        }

        const result = {} as {[k: string]: Indicators};
        const artRange = {min: null, max: null} as IndicatorRange;
        const prevRange = {min: null, max: null} as IndicatorRange;

        const updateRange = (r: IndicatorRange, value: number) => {
            if (r.min == null || r.min > value){
                r.min = value;
            }
            if (r.max == null || r.max < value) {
                r.max = value;
            }
        };

        for(const d of data) {
            const row = d as any;
            const areaId = row.area_id;

            //TODO: This will change when we have a metadata endpoint telling us which column to use as value for each
            //input data type and indicator
            //We will also have to deal will potential multiple values per row
            let indicator: string = "";
            let valueColumn: string = "";
            switch(state.selectedDataType) {
                case (DataType.Survey):
                    indicator = row["indicator"];
                    valueColumn = "est";
                    break;
                case (DataType.Program):
                    indicator = "prev";
                    valueColumn = "current_art";
                    break;
                case (DataType.ANC):
                    indicator = "prev";
                    valueColumn = "ancrt_test_pos";
            }

            const value = row[valueColumn];

            if (!result[areaId]) {
                result[areaId] = {};
            }

            const indicators = result[areaId];
            switch(indicator) {
                case("prev"):
                    indicators.prev = {value: value, color: ""};
                    updateRange(prevRange, value);

                    break;
                case("artcov"):
                    indicators.art = {value: value, color: ""};
                    updateRange(artRange, value);

                    break;

                 //TODO: Also expect recent and vls (viral load suppression) values for survey, need to add these as options
            }
        }
        //Now add the colours - we do this in a second step now, because we are calculating the range as we add the values
        //but once the range comes from the API, we can calculate the colours as we populate the values
        for (const region in result) {
            const indicators = result[region];
            if (indicators.art) {
                indicators.art.color = getColor(indicators.art, artRange, getters.colorFunctions.art);
            }
            if (indicators.prev) {
                indicators.prev.color = getColor(indicators.prev, prevRange, getters.colorFunctions.prev);
            }
        }
        return {
            indicators: result,
            artRange: artRange,
            prevRange: prevRange
        };
    }
};

const getColor = (data: IndicatorValues, range: IndicatorRange, colorFunction: (t: number) => string) => {
    const colorValue = data!.value / (range.max! - range.min!);
    return colorFunction(colorValue);
};

export const getUnfilteredData = (state: FilteredDataState, rootState: RootState) => {
    const sapState = rootState.surveyAndProgram;
    switch(state.selectedDataType){
        case (DataType.ANC):
            return sapState.anc ? sapState.anc.data : null;
        case (DataType.Program):
            return sapState.program ? sapState.program.data : null;
        case (DataType.Survey):
            return sapState.survey ? sapState.survey.data : null;
        default:
            return null;
    }
};
