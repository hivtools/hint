import {Payload} from "vuex";

export interface PayloadWithType<T> extends Payload {
    payload: T
}
export interface PartialFileUploadProps {
    valid: Boolean,
    error: string,
    existingFileName: string
}

export interface IndicatorValues {
    value: number,
    color: string
}

