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

export interface LevelLabel {
    id: number;
    area_level_label: string;
    display: boolean;
}

export type Dict<V> = { [k: string]: V }

export type IndicatorValuesDict= Dict<IndicatorValues>;
