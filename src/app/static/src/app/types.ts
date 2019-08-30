import {PjnzResponse} from "./generated";
import {Payload} from "vuex";

export interface PayloadWithType<T> extends Payload {
    payload: T
}

export type InternalResponse = BaselineData

export interface BaselineData {
    pjnz: PjnzResponse | null
}
