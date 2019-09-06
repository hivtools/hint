import {Payload} from "vuex";

export interface PayloadWithType<T> extends Payload {
    payload: T
}

export type Indicator = "prev" | "art"

export type InternalResponse = SurveyResponse | ProgramResponse

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

export interface ANCResponse {
    filename: string;
    type: "anc";
    data: string;
}
