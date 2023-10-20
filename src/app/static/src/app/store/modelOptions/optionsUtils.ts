import {Control, DynamicFormMeta, MultiSelectControl, Option, SelectControl} from "@reside-ic/vue-next-dynamic-form";

type ControlWithOptions = SelectControl | MultiSelectControl;
export function checkOptionsValid(formMeta: DynamicFormMeta): boolean {
    return formMeta.controlSections.every(section => {
        section.controlGroups.every(group => {
            group.controls.every(control => {
                // We could go further and check that if it is null or empty that this isn't
                // a required control but just assuming this for now seems ok
                if (control.value != null && control.value != "" && hasOptions(control)) {
                    checkControlOptionValid(control);
                }
            })
        })
    })
}

function hasOptions(control: Control): control is ControlWithOptions {
    return control.type === "select" || control.type === "multiselect";
}

function checkControlOptionValid(control: ControlWithOptions): boolean {
    let valid = true;

    const options = getAllOptions(control)
    const value = control.value;
    // Check string and array types, otherwise we assume valid
    if (typeof value === 'string') {
        valid = options.includes(value);
    } else if (Array.isArray(value)) {
        valid = value.every(item => options.includes(item));
    }

    return valid;
}

function getAllOptions(control: ControlWithOptions): string[] {
    const options= control.options.map((option: Option) => getOptions(option));
    return options.flat();
}

function getOptions(option: Option): string[] {
    const options = [option.id];
    if (option.children !== undefined && option.children.length > 0) {
        options.concat(...option.children.map((child: Option) => getOptions(child)));
    }
    return options;
}
