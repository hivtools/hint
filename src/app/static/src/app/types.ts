import {PjnzResponse} from "./generated";
import {Payload} from "vuex";

export interface PayloadWithType<T> extends Payload {
    payload: T
}

export type InternalResponse = BaselineData | SurveyResponse | ProgramResponse

export interface BaselineData {
    pjnz: PjnzResponse | null
}

export interface SurveyResponse {
    filename: string;
    type: "survey";
    data: string;
}

export interface ProgramResponse {
    filename: string;
    type: "program";
    data: string;
}
