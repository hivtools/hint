import {Payload} from "vuex";

export interface PayloadWithType<T> extends Payload {
    payload: T
}

export type Indicator = "prev" | "art"

export interface PartialFileUploadProps {
    valid: Boolean,
    error: string,
    existingFileName: string
}

export interface IndicatorValues {
    value: number,
    color: string
}

export interface Indicators {
    prev?: IndicatorValues,
    art?: IndicatorValues
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
