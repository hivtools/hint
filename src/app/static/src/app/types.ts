import {Payload} from "vuex";

export interface PayloadWithType<T> extends Payload {
    payload: T
}

export type Indicator = "prev" | "art"

export interface PartialFileUploadProps {
    valid: Boolean,
    error: string,
    existingFileName: string,
}

export interface Indicators {
    prev?: number,
    art?: number
}

export interface IndicatorRange {
    max: number | null,
    min: number | null
}

export interface IndicatorsMap {
    indicators: {[k: string]: Indicators},
    artRange: IndicatorRange,
    prevRange: IndicatorRange
}
