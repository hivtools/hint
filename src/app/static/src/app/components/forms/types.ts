import {Dict} from "../../types";

export type DynamicControlSection = {
    label: string
    description?: string
    controlGroups: DynamicControlGroup[]
}

export type DynamicControlGroup = {
    label?: string
    controls: Control[]
}

export type Option = {
    id: string,
    label: string,
    children?: Option[]
}

export type DynamicControlType = "multiselect" | "select" | "number"
export type Control = SelectControl | MultiSelectControl | NumberControl

export type DynamicControl = {
    name: string,
    label?: string,
    type: DynamicControlType
    required: boolean
    helpText?: string
    value?: string | string[] | number | null
}

export type SelectControl = DynamicControl & {
    options: Option[]
    value?: string | null
}

export type MultiSelectControl = DynamicControl & {
    options: Option[]
    value?: string[] | string
}

export type NumberControl = DynamicControl & {
    min?: number
    max?: number
    value?: number | null
}

export type DynamicFormMeta = {
    controlSections: DynamicControlSection[]
}

export type DynamicFormData = Dict<string | string[] | number | null>
