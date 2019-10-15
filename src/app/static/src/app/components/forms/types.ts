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
export type Control = SelectControl | NumberControl

export interface DynamicControl {
    name: string,
    label?: string,
    type: DynamicControlType
    required: boolean
    default?: any
    helpText?: string
}

export interface SelectControl extends DynamicControl {
    options: string[]
}

export interface NumberControl extends DynamicControl {
    min?: number
    max?: number
    default?: number
}

export interface DynamicForm {
    controlSections: DynamicControlSection[]
}

export const formMeta: DynamicForm = {
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
                        options: ["MWI", "MWI.1", "MWI.2"],
                        default: "MWI",
                        required: true
                    }]
            },
                {
                    label: "Area level",
                    controls: [
                        {
                            name: "area_level",
                            type: "multiselect",
                            options: ["Apr - Jun 2015", "Jul - Sep 2015"],
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
                            default: "Jan - Mar 2015",
                            helpText: "Quarter matching midpoint of survey",
                            options: ["Jan - Mar 2015", "Apr - Jun 2015"],
                            required: true
                        },
                        {
                            name: "art_t2",
                            label: "Time 2",
                            type: "select",
                            helpText: "Quarter matching midpoint of survey",
                            options: ["Jan - Mar 2015", "Apr - Jun 2015"],
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
                            default: 250
                        }
                    ]
                },
                {
                    label: "Number of simulations",
                    controls: [{
                        name: "num_sim",
                        type: "number",
                        required: true,
                        default: 3000
                    }]
                }
            ]
        }
    ]
};