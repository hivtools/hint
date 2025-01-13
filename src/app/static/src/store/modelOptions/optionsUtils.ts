import {
    Control,
    DynamicFormMeta,
    MultiSelectControl,
    NumberControl,
    Option,
    SelectControl
} from "@reside-ic/vue-next-dynamic-form";

type ControlWithOptions = SelectControl | MultiSelectControl;
export function checkOptionsValid(formMeta: DynamicFormMeta): boolean {
    return formMeta.controlSections.every(section => {
        return section.controlGroups.every(group => {
            return group.controls.every(control => {
                let valid = true;
                if (!control.value || control.value === "") {
                    valid = !control.required
                } else if (isNumberControl(control)) {
                    valid = checkNumberControlValid(control);
                } else if (isDropdown(control)) {
                    valid = checkControlOptionValid(control);
                }
                return valid
            })
        })
    })
}

export function isDropdown(control: Control): control is ControlWithOptions {
    return control.type === "select" || control.type === "multiselect";
}

export function isMultiselectControl(control: Control): control is MultiSelectControl {
    return control.type === "multiselect";
}

export function isNumberControl(control: Control): control is NumberControl {
    return control.type == "number";
}

function checkNumberControlValid(control: NumberControl): boolean {
    let valid = true;

    if (control.min !== undefined && typeof control.value === "number") {
        valid = valid && control.value >= control.min
    }
    if (control.max !== undefined && typeof control.value === "number") {
        valid = valid && control.value <= control.max
    }

    return valid;
}

function checkControlOptionValid(control: ControlWithOptions): boolean {
    let valid = true;

    const options = getAllOptionIds(control);
    const value = control.value;
    // Check string and array types, otherwise we assume valid
    if (typeof value === 'string' && value) {
        valid = options.includes(value);
    } else if (Array.isArray(value)) {
        valid = value.every(item => options.includes(item));
    }

    return valid;
}

function getAllOptionIds(control: ControlWithOptions): string[] {
    if (!control.options) {
        return [];
    }
    return control.options.flatMap((option: Option) => getOptionIds(option));
}

function getOptionIds(option: Option): string[] {
    const option_ids = [option.id];
    if (option.children && option.children.length > 0) {
        option_ids.push(...option.children.flatMap((child: Option) => getOptionIds(child)));
    }
    return option_ids;
}
