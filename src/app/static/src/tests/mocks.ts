import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import {BaselineState, initialBaselineState} from "../app/store/baseline/baseline";
import {initialPasswordState, PasswordState} from "../app/store/password/password";
import {
    initialSurveyAndProgramDataState,
    SurveyAndProgramDataState
} from "../app/store/surveyAndProgram/surveyAndProgram";

import {
    AncResponse,
    ModelResultResponse,
    ModelStatusResponse,
    PjnzResponse,
    PlottingMetadataResponse,
    PopulationResponse,
    ProgrammeFilters,
    ProgrammeResponse,
    Response,
    ShapeResponse,
    SurveyFilters,
    SurveyResponse,
    ValidateBaselineResponse
} from "../app/generated";
import {FilteredDataState, initialFilteredDataState} from "../app/store/filteredData/filteredData";
import {initialModelRunState, ModelRunState} from "../app/store/modelRun/modelRun";
import {emptyState, RootState} from "../app/root";
import {initialStepperState, StepperState} from "../app/store/stepper/stepper";
import {initialMetadataState, MetadataState} from "../app/store/metadata/metadata";
import {initialLoadState, LoadState} from "../app/store/load/load";
import {initialModelOptionsState, ModelOptionsState} from "../app/store/modelOptions/modelOptions";
import {initialModelOutputState, ModelOutputState} from "../app/store/modelOutput/modelOutput";
import {initialPlottingSelectionsState, PlottingSelectionsState} from "../app/store/plottingSelections/plottingSelections";

export const mockAxios = new MockAdapter(axios);

export const mockPasswordState = (props?: Partial<PasswordState>): PasswordState => {
    return {
        ...initialPasswordState,
        ...props
    }
};

export const mockBaselineState = (props?: Partial<BaselineState>): BaselineState => {
    return {
        ...initialBaselineState(),
        ...props
    }
};

export const mockSurveyAndProgramState = (props?: Partial<SurveyAndProgramDataState>): SurveyAndProgramDataState => {
    return {
        ...initialSurveyAndProgramDataState(),
        ...props
    }
};

export const mockModelRunState = (props?: Partial<ModelRunState>) => {
    return {
        ...initialModelRunState(),
        ...props
    }
};


export const mockModelOptionsState = (props?: Partial<ModelOptionsState>): ModelOptionsState => {
    return {
        ...initialModelOptionsState(),
        ...props
    }
};

export const mockStepperState = (props?: Partial<StepperState>): StepperState => {
    return {
        ...initialStepperState(),
        ...props
    }
};

export const mockFilteredDataState = (props?: Partial<FilteredDataState>): FilteredDataState => {
    return {
        ...initialFilteredDataState(),
        ...props
    }
};

export const mockMetadataState = (props?: Partial<MetadataState>): MetadataState => {
    return {
        ...initialMetadataState(),
        ...props
    }
};

export const mockLoadState = (props?: Partial<LoadState>): LoadState => {
    return {
        ...initialLoadState(),
        ...props
    }
};

export const mockModelOutputState = (props?: Partial<ModelOutputState>): ModelOutputState => {
    return {
        ...initialModelOutputState(),
    }
}

export const mockPlottingSelections = (props?: Partial<PlottingSelectionsState>) => {
    return {
        ...initialPlottingSelectionsState(),
        ...props
    }
};

export const mockRootState = (props?: Partial<RootState>): RootState => {
    return {
        ...emptyState(),
        ...props
    }
};

export const mockFile = (filename: string, fileContents: string, type: string = "text/csv"): File => {
    return new File([fileContents], filename, {
        type: type,
        lastModified: 1
    });
};

export const mockSuccess = (data: any, version?: any): Response => {
    return {
        data,
        status: "success",
        errors: [],
        version: version
    }
};

export const mockFailure = (errorMessage: string): Response => {
    return {
        data: {},
        status: "failure",
        errors: [{error: "OTHER_ERROR", detail: errorMessage}]
    }
};

export const mockPJNZResponse = (props: Partial<PjnzResponse> = {}): PjnzResponse => {
    return {
        data: {country: "Malawi", iso3: "MWI"},
        hash: "1234.csv",
        filename: "test.pjnz",
        type: "pjnz",
        ...props
    }
};

export const mockShapeResponse = (props: Partial<ShapeResponse> = {}): ShapeResponse => {
    return {
        data: {
            "type": "FeatureCollection",
            "features": []
        },
        type: "shape",
        hash: "1234.csv",
        filename: "test.csv",
        filters: {
            level_labels: [{id: 1, area_level_label: "Country", display: true}],
            regions: {label: "Malawi", id: "1", children: []}
        },
        ...props
    }
};

export const mockSurveyResponse = (props: Partial<SurveyResponse> = {}): SurveyResponse => {
    return {
        type: "survey",
        filename: "test.csv",
        hash: "1234.csv",
        data: [],
        filters: {
            "age": [],
            "surveys": [],
            indicators: []
        },
        ...props
    }
};

export const mockProgramResponse = (props: Partial<ProgrammeResponse> = {}): ProgrammeResponse => {
    return {
        type: "programme",
        filename: "test.csv",
        data: [],
        hash: "1234.csv",
        filters: {"age": [], "year": [], indicators: []},
        ...props
    }
};

export const mockAncResponse = (props: Partial<AncResponse> = {}): AncResponse => {
    return {
        type: "anc",
        filename: "test.csv",
        hash: "1234.csv",
        data: [],
        filters: {"year": [], indicators: []},
        ...props
    }
};

export const mockProgramFilters = (props: Partial<ProgrammeFilters> = {}): ProgrammeFilters => {
    return {
        age: [],
        year: [],
        indicators: [],
        ...props
    }
};

export const mockSurveyFilters = (props: Partial<SurveyFilters> = {}): SurveyFilters => {
    return {
        age: [],
        surveys: [],
        indicators: [],
        ...props
    }
};

export const mockPopulationResponse = (props: Partial<PopulationResponse> = {}): PopulationResponse => {
    return {
        data: null,
        type: "population",
        hash: "1234.csv",
        filename: "test.csv",
        ...props
    }
};

export const mockValidateBaselineResponse = (props: Partial<ValidateBaselineResponse> = {}): ValidateBaselineResponse => {
    return {
        consistent: true
    }
};

export const mockModelStatusResponse = (props: Partial<ModelStatusResponse> = {}): ModelStatusResponse => {
    return {
        done: true,
        success: true,
        progress: [],
        queue: 1,
        id: "1234",
        status: "finished",
        ...props
    }
};

export const mockModelResultResponse = (props: Partial<ModelResultResponse> = {}): ModelResultResponse => {
    return {
        plottingMetadata: {
            barchart: {
                indicators: [], filters: []
            },
            choropleth: {
                indicators: [], filters: []
            }
        },
        data: [{
            area_id: "MWI",
            sex: "both",
            age_group: "1",
            calendar_quarter: "1",
            indicator_id: 1,
            lower: 0.5,
            mean: 0.5,
            mode: 0.5,
            upper: 0.5
        }],
        ...props
    }
};

export const mockPlottingMetadataResponse = (props: Partial<PlottingMetadataResponse> = {}): PlottingMetadataResponse => {
    return {
        anc: {
            choropleth: {}
        },
        output: {
            choropleth: {}
        },
        programme: {
            choropleth: {}
        },
        survey: {
            choropleth: {}
        },
        ...props
    }
};
