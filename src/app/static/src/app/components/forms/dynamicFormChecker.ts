import {
    Control,
    DynamicControlGroup,
    DynamicControlSection,
    DynamicFormMeta,
    MultiSelectControl,
    NumberControl,
    Option,
    SelectControl
} from "./types";

export function isControl(object: any): Boolean {
    return (object.helpText == undefined || typeof object.helpText == "string")
        && (object.label == undefined || typeof object.label == "string")
        && typeof object.name == "string"
        && typeof object.required == "boolean";
}

export function isNumberControl(object: any): object is NumberControl {
    return isControl(object)
        && (object.value == undefined || !isNaN(object.value))
        && object.type == "number"
}

export function isSelectControl(object: any): object is SelectControl {
    return isControl(object)
        && (object.value == undefined || typeof object.value == "string")
        && object.type == "select"
        && Array.isArray(object.options)
        && object.options.every((o: any) => isSelectOption(o))
}

export function isMultiSelectControl(object: any): object is MultiSelectControl {
    return isControl(object)
        && (object.value == undefined || typeof object.value == "string" ||
            (Array.isArray(object.value) && object.value.every((v: any) => typeof v == "string")))
        && object.type == "multiselect"
        && Array.isArray(object.options)
        && object.options.every((o: any) => isSelectOption(o))
}

function isSelectOption(object: any): object is Option {
    return typeof object.id == "string"
        && typeof object.label == "string"
        && object.children == undefined || Array.isArray(object.children)
        && object.children.every((o: any) => isSelectOption(o))
}


function isDynamicControlGroup(object: any): object is DynamicControlGroup {
    return (object.label == undefined || typeof object.label == "string")
        && Array.isArray(object.controls)
        && object.controls
            .every((c: Control) => isNumberControl(c) || isSelectControl(c) || isMultiSelectControl(c))
}

function isDynamicControlSection(object: any): object is DynamicControlSection {
    return typeof object.label == "string"
        && Array.isArray(object.controlGroups)
        && object.controlGroups
            .every((c: DynamicControlGroup) => isDynamicControlGroup(c))
}

export function isDynamicFormMeta(object: any): object is DynamicFormMeta {
    return object != null && object.controlSections !== undefined
        && Array.isArray(object.controlSections)
        && object.controlSections.every((s: DynamicControlSection) => isDynamicControlSection(s))
}
