import {Payload} from "vuex";
import {ProgrammeResponse, SurveyResponse} from "./generated";

export interface PayloadWithType<T> extends Payload {
    payload: T
}

export type InternalResponse = SurveyResponse | ProgrammeResponse

