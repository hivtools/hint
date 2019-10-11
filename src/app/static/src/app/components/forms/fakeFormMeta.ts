export interface ControlSection {
    label: string
    description: string
    controlGroups: ControlGroup[]
}

export interface ControlGroup {
    label: string
    controls: FormControl[]
}

export type ControlType = "multiselect" | "select"

export interface FormControl {
    name: string,
    label?: string,
    type: ControlType
    required: boolean
    options?: string[]
    default?: string
    helpText?: string
}

export const formMeta: { controlSections: ControlSection[] } = {
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
                            type: "select",
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
                            helpText: "Quarter matching midpoint of survey",
                            options: ["Jan - Mar 2015", "Apr - Jun 2015"],
                            required: false
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
        }
    ]
};