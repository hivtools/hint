import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import {BaselineState, initialBaselineState} from "../app/store/baseline/baseline";
import {PasswordState, initialPasswordState} from "../app/store/password/password";
import {
    initialSurveyAndProgramDataState,
    SurveyAndProgramDataState
} from "../app/store/surveyAndProgram/surveyAndProgram";
import {PjnzResponse, ShapeResponse, Response} from "../app/generated";
import { ProgramResponse, SurveyResponse} from "../app/types";

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
        ...props
    }
};

export const mockSurveyResponse = (props: Partial<SurveyResponse> = {}): SurveyResponse => {
    return {
        data: "SOME DATA",
        type: "survey",
        filename: "test.csv",
        ...props
    }
};

export const mockProgramResponse = (props: Partial<ProgramResponse> = {}): ProgramResponse => {
    return {
        data: "SOME DATA",
        type: "program",
        filename: "test.csv",
        ...props
    }
};
