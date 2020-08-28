import {Payload} from "vuex";
import {FilterOption, Error} from "./generated";

export interface PayloadWithType<T> extends Payload {
    payload: T
}
export interface PartialFileUploadProps {
    valid: Boolean,
    error: Error | null,
    existingFileName: string
}

export interface IndicatorValues {
    value: number,
    color: string
}

export interface BubbleIndicatorValues extends IndicatorValues {
    radius: number;
    sizeValue: number;
}

export interface LevelLabel {
    id: number;
    area_level_label: string;
    display: boolean;
}

export type Dict<V> = { [k: string]: V }

export type IndicatorValuesDict= Dict<IndicatorValues>;

export type BubbleIndicatorValuesDict = Dict<BubbleIndicatorValues>;

export interface LocalSessionFile {
    hash: string
    filename: string
}

export interface BarchartIndicator {
    indicator: string,
    value_column: string,
    indicator_column: string,
    indicator_value: string,
    name: string,
    error_low_column: string,
    error_high_column: string
}

export interface Filter {
    id: string,
    column_id: string,
    label: string,
    options: FilterOption[]
}

export interface DisplayFilter extends Filter {
    allowMultiple: boolean
}

export interface NumericRange {
    min: number,
    max: number
}

export interface Snapshot {
    id: string,
    created: string,
    updated: string
}

export interface Project {
    id: number,
    name: string,
    snapshots: Snapshot[]
}

export interface SnapshotDetails {
    files: any,
    state: string
}

export interface SnapshotIds {
    projectId: number,
    snapshotId: string
}

export interface Dataset {
    id: string
    title: string
    revision_id: string,
    url: string
}

export interface ADRSchemas {
    baseUrl: string
    anc: string
    programme: string
    pjnz: string
    population: string
    shape: string
    survey: string
}
