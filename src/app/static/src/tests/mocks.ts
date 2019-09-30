import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import {BaselineState, initialBaselineState} from "../app/store/baseline/baseline";
import {PasswordState, initialPasswordState} from "../app/store/password/password";
import {
    initialSurveyAndProgramDataState,
    SurveyAndProgramDataState
} from "../app/store/surveyAndProgram/surveyAndProgram";

import {
    PjnzResponse,
    ShapeResponse,
    Response,
    ProgrammeResponse,
    SurveyResponse,
    AgeFilters,
    SurveyFilters, AncResponse, PopulationResponse, ModelStatusResponse
} from "../app/generated";
import {FilteredDataState, initialFilteredDataState} from "../app/store/filteredData/filteredData";
import {initialModelRunState, ModelRunState} from "../app/store/modelRun/modelRun";
import {RootState} from "../app/root";
import {initialStepperState, StepperState} from "../app/store/stepper/stepper";


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

export const mockRootState = (props?: Partial<RootState>): RootState => {
    return {
        version: "",
        filteredData: mockFilteredDataState(),
        baseline: mockBaselineState(),
        surveyAndProgram: mockSurveyAndProgramState(),
        modelRun: mockModelRunState(),
        stepper: mockStepperState(),
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
        filename: "test.csv",
        filters: [],
        ...props
    }
};

export const mockSurveyResponse = (props: Partial<SurveyResponse> = {}): SurveyResponse => {
    return {
        type: "survey",
        filename: "test.csv",
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
        filters: {"age": []},
        ...props
    }
};

export const mockAncResponse = (props: Partial<AncResponse> = {}): AncResponse => {
    return {
        type: "anc",
        filename: "test.csv",
        data: [],
        filters: {"age": []},
        ...props
    }
};

export const mockAgeFilters = (props: Partial<AgeFilters> = {}): AgeFilters => {
    return {
       age: [],
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