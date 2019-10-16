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
    PopulationResponse, ProgrammeFilters,
    ProgrammeResponse,
    Response,
    ShapeResponse,
    SurveyFilters,
    SurveyResponse
} from "../app/generated";
import {FilteredDataState, initialFilteredDataState} from "../app/store/filteredData/filteredData";
import {initialModelRunState, ModelRunState} from "../app/store/modelRun/modelRun";
import {RootState} from "../app/root";
import {initialStepperState, StepperState} from "../app/store/stepper/stepper";
import {initialMetadataState, MetadataState} from "../app/store/metadata/metadata";
import {initialModelOptionsState, ModelOptionsState} from "../app/store/modelOptions/modelOptions";


export const mockAxios = new MockAdapter(axios);

export const mockPasswordState = (props?: Partial<PasswordState>) => {
    return {
        ...initialPasswordState,
        ...props
    }
};

export const mockBaselineState = (props?: Partial<BaselineState>) => {
    return {
        ...initialBaselineState,
        ...props
    }
};

export const mockSurveyAndProgramState = (props?: Partial<SurveyAndProgramDataState>) => {
    return {
        ...initialSurveyAndProgramDataState,
        ...props
    }
};

export const mockModelRunState = (props?: Partial<ModelRunState>) => {
    return {
        ...initialModelRunState,
        ...props
    }
};


export const mockModelOptionsState = (props?: Partial<ModelOptionsState>) => {
    return {
        ...initialModelOptionsState,
        ...props
    }
};

export const mockStepperState = (props?: Partial<StepperState>) => {
    return {
        ...initialStepperState,
        ...props
    }
};

export const mockFilteredDataState = (props?: Partial<FilteredDataState>) => {
    return {
        ...initialFilteredDataState,
        ...props
    }
};

export const mockMetadataState = (props?: Partial<MetadataState>) => {
    return {
        ...initialMetadataState,
        ...props
    }
};
export const mockRootState = (props?: Partial<RootState>): RootState => {
    return {
        version: "",
        filteredData: mockFilteredDataState(),
        baseline: mockBaselineState(),
        surveyAndProgram: mockSurveyAndProgramState(),
        modelRun: mockModelRunState(),
        modelOptions: mockModelOptionsState(),
        stepper: mockStepperState(),
        metadata: mockMetadataState(),
        ...props
    }
};

export const mockFile = (filename: string, type: string = "text/csv"): File => {
    return new File([new ArrayBuffer(10)], filename, {
        type: type,
        lastModified: 1
    });
};

export const mockFileList = (filename: string, type: string = "text/csv"): FileList => {
    const file = mockFile(filename, type);
    const fileList = new FileList();
    fileList[0] = file;
    return fileList;
};

export const mockSuccess = (data: any): Response => {
    return {
        data,
        status: "success",
        errors: []
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
        data: {country: "Malawi"},
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
            regions: {name: "Malawi", id: 1, options : []} as any
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
            "surveys": []
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
        filters: {"age": [], "quarter": []},
        ...props
    }
};

export const mockAncResponse = (props: Partial<AncResponse> = {}): AncResponse => {
    return {
        type: "anc",
        filename: "test.csv",
        hash: "1234.csv",
        data: [],
        filters: {"quarter": []},
        ...props
    }
};

export const mockProgramFilters = (props: Partial<ProgrammeFilters> = {}): ProgrammeFilters => {
    return {
        age: [],
        quarter: [],
        ...props
    }
};

export const mockSurveyFilters = (props: Partial<SurveyFilters> = {}): SurveyFilters => {
    return {
        age: [],
        surveys: [],
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

export const mockModelStatusResponse = (props: Partial<ModelStatusResponse> = {}): ModelStatusResponse => {
    return {
        timeRemaining: "",
        done: true,
        success: true,
        progress: "100%",
        queue: 1,
        id: "1234",
        status: "finished",
        ...props
    }
};

export const mockModelResultResponse = (props: Partial<ModelResultResponse> = {}): ModelResultResponse => {
    return {
        ...props
    }
};

export const mockPlottingMetadataResponse = (props: Partial<PlottingMetadataResponse> = {}): PlottingMetadataResponse => {
    return {
        anc: {
            choropleth: {
                indicators: []
            }
        },
        output: {
            choropleth: {
                indicators: []
            }
        },
        programme: {
            choropleth: {
                indicators: []
            }
        },
        survey: {
            choropleth: {
                indicators: []
            }
        },
        ...props
    }
};

export interface Indicators {
    value_column: string,
    indicator_column: string,
    indicator_value: string,
    name: string,
    min: number,
    max: number,
    colour: string,
    invert_scale: boolean
}

export const mockIndicators = (props: Partial<Indicators>) => {
    return {
        value_column: "",
        indicator_column: "",
        indicator_value: "",
        name: "",
        min: 0,
        max: 0,
        colour: "",
        invert_scale: false,
        ...props
    };
};