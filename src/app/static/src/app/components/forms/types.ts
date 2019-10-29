import {Dict} from "../../types";

export interface DynamicControlSection {
    label: string
    description?: string
    controlGroups: DynamicControlGroup[]
}

export interface DynamicControlGroup {
    label?: string
    controls: Control[]
}

export type DynamicControlType = "multiselect" | "select" | "number"
export type Control = SelectControl | MultiSelectControl | NumberControl

export interface DynamicControl {
    name: string,
    label?: string,
    type: DynamicControlType
    required: boolean
    helpText?: string
    value?: string | string[] | number | null
}

export interface Option {
    id: string,
    label: string,
    children?: { id: string, label: string, children?: Option[] }
}

export interface SelectControl extends DynamicControl {
    options: Option[]
    value?: string | null
}

export interface MultiSelectControl extends DynamicControl {
    options: Option[]
    value?: string[]
}

export interface NumberControl extends DynamicControl {
    min?: number
    max?: number
    value?: number | null
}

export interface DynamicFormMeta {
    controlSections: DynamicControlSection[]
}

export type DynamicFormData = Dict<string | string[] | number | null>
