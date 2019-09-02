import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import {BaselineState, initialBaselineState} from "../app/store/baseline/baseline";
import {PasswordState, initialPasswordState} from "../app/store/password/password";
import {
    initialSurveyAndProgramDataState,
    SurveyAndProgramDataState
} from "../app/store/surveyAndProgram/surveyAndProgram";
import {Failure, PjnzResponse, Success} from "../app/generated";
import {BaselineData, SurveyResponse} from "../app/types";
import {Point} from "geojson";

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

export const mockSuccess = (data: any): Success => {
    return {
        data,
        status: "success",
        errors: []
    }
};

export const mockFailure = (errorMessage: string): Failure => {
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

export const mockBaselineResponse = (props: Partial<BaselineData> = {}): BaselineData => {
    return {
        pjnz: mockPJNZResponse(),
        ...props
    }
};

export const mockSurveyResponse = (props: Partial<SurveyResponse> = {}): SurveyResponse => {
    return {
        data: {geoJson: {type: "Point", coordinates: [1, 2]}},
        filename: "test.csv",
        ...props
    }
};
