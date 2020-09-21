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

export interface Version {
    id: string,
    created: string,
    updated: string,
    versionNumber: number
}

export interface Project {
    id: number,
    name: string,
    versions: Version[]
}

export interface VersionDetails {
    files: any,
    state: string
}

export interface VersionIds {
    projectId: number,
    versionId: string
}

export interface DatasetResource {
    revisionId: string
    url: string
    outOfDate: boolean
}

export interface DatasetResourceSet {
    pjnz: DatasetResource | null,
    pop: DatasetResource | null,
    program: DatasetResource | null,
    anc: DatasetResource | null,
    shape: DatasetResource | null,
    survey: DatasetResource | null
}

export interface Dataset {
    id: string
    title: string
    url: string,
    resources:  DatasetResourceSet
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
