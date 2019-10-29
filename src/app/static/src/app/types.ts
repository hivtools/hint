import {Payload} from "vuex";
import {FilterOption} from "./generated";

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

export interface LocalSessionFile {
    hash: string
    filename: string
}
