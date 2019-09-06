import {Payload} from "vuex";

export interface PayloadWithType<T> extends Payload {
    payload: T
}


