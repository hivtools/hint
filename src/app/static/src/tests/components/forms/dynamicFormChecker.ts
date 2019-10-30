import {
    Control,
    DynamicControl,
    DynamicControlGroup,
    DynamicControlSection,
    DynamicFormMeta,
    MultiSelectControl,
    NumberControl,
    Option,
    SelectControl
} from "../../../app/components/forms/types";

export function isControl(object: any): Boolean {
    const control = <DynamicControl>object;
    return (control.helpText == undefined || typeof control.helpText == "string")
        && (control.label == undefined || typeof control.label == "string")
        && typeof control.name == "string"
        && typeof control.required == "boolean";
}

export function isNumberControl(object: any): object is NumberControl {
    const control = <NumberControl>object;
    return isControl(control)
        && (control.value == undefined || typeof control.value == "number")
        && control.type == "number"
}

export function isSelectControl(object: any): object is SelectControl {
    const control = <SelectControl>object;
    return isControl(control)
        && (control.value == undefined || typeof control.value == "string")
        && control.type == "select"
        && Array.isArray(control.options)
        && control.options.every((o) => isSelectOption(o))
}

export function isMultiSelectControl(object: any): object is MultiSelectControl {
    const control = <MultiSelectControl>object;
    return isControl(control)
        && (control.value == undefined || typeof control.value == "string" ||
            (Array.isArray(control.value) && control.value.every(v => typeof v == "string")))
        && control.type == "multiselect"
        && Array.isArray(control.options)
        && control.options.every((o) => isSelectOption(o))
}

function isSelectOption(object: any): object is Option {
    const option = <Option>object;
    return typeof option.id == "string"
        && typeof option.label == "string"
        && option.children == undefined || Array.isArray(option.children)
        && option.children.every((o: Option) => isSelectOption(o))
}


function isDynamicControlGroup(object: any): object is DynamicControlGroup {
    const group = <DynamicControlGroup>object;
    return (group.label == undefined || typeof group.label == "string")
        && Array.isArray(group.controls)
        && group.controls
            .every((c: Control) => isNumberControl(c) || isSelectControl(c) || isMultiSelectControl(c))
}

function isDynamicControlSection(object: any): object is DynamicControlSection {
    const section = <DynamicControlSection>object;
    return typeof section.label == "string"
        && Array.isArray(section.controlGroups)
        && section.controlGroups
            .every((c: DynamicControlGroup) => isDynamicControlGroup(c))
}

export function isDynamicFormMeta(object: any): object is DynamicFormMeta {
    const form = <DynamicFormMeta>object;
    return form != null && form.controlSections !== undefined
        && Array.isArray(form.controlSections)
        && form.controlSections.every((s: DynamicControlSection) => isDynamicControlSection(s))
}
