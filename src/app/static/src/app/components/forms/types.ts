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
    value?: string[]
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

export const formMeta: DynamicFormMeta = {
    controlSections: [
        {
            label: "General",
            description: "Select general model options:",
            controlGroups: [{
                label: "Area scope",
                controls: [
                    {
                        name: "area_scope",
                        type: "multiselect",
                        options: [{id: "MWI", label: "Malawi"}, {id: "MWI.1", label: "Central"}],
                        value: ["MWI"],
                        required: true
                    }]
            },
                {
                    label: "Area level",
                    controls: [
                        {
                            name: "area_level",
                            type: "multiselect",
                            options: [{id: "q1", label: "Apr - Jun 2015"}, {id: "q2", label: "Jul - Sep 2015"}],
                            required: true
                        }]
                }
            ]
        },
        {
            label: "ART",
            description: "Optionally select which quarter of data to use at time point 1 and 2",
            controlGroups: [
                {
                    label: "Number on ART",
                    controls: [
                        {
                            name: "art_t1",
                            label: "Time 1",
                            type: "select",
                            value: "q1",
                            helpText: "Quarter matching midpoint of survey",
                            options: [{id: "q1", label: "Jan - Mar 2015"}, {id: "q2", label: "Apr - Jun 2015"}],
                            required: true
                        },
                        {
                            name: "art_t2",
                            label: "Time 2",
                            type: "select",
                            helpText: "Quarter matching midpoint of survey",
                            options:  [{id: "q1", label: "Jan - Mar 2015"}, {id: "q2", label: "Apr - Jun 2015"}],
                            required: false
                        }
                    ]
                }
            ]
        },
        {
            label: "Advanced options",
            controlGroups: [
                {
                    label: "Maximum Iterations",
                    controls: [
                        {
                            name: "max_it",
                            type: "number",
                            required: true,
                            value: 250
                        }
                    ]
                },
                {
                    label: "Number of simulations",
                    controls: [{
                        name: "num_sim",
                        type: "number",
                        required: true
                    }]
                }
            ]
        }
    ]
};