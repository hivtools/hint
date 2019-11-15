import {DynamicControlGroup, DynamicControlSection, DynamicFormMeta} from "../../components/forms/types";

export const updateForm = (oldForm: DynamicFormMeta, newForm: DynamicFormMeta): DynamicFormMeta => {
    const oldSectionLabels = oldForm.controlSections.map(c => c.label);

    newForm.controlSections.map(s => {
        const oldIndex = oldSectionLabels.indexOf(s.label);
        if (oldIndex == -1) {
            return s
        } else {
            return updateSection(oldForm.controlSections[oldIndex], s)
        }
    });

    return newForm
};

function updateSection(oldSection: DynamicControlSection, newSection: DynamicControlSection) {

    const oldGroupLabels = oldSection.controlGroups.map(g => g.label);
    newSection.controlGroups = newSection.controlGroups.map(g => {
        const oldGroupIndex = oldGroupLabels.indexOf(g.label);
        if (oldGroupIndex == -1) {
            return g
        } else {
            return updateGroup(oldSection.controlGroups[oldGroupIndex], g)
        }
    });

    return newSection;
}

function updateGroup(oldGroup: DynamicControlGroup, newGroup: DynamicControlGroup) {
    const oldControlNames = oldGroup.controls.map(c => c.name);
    newGroup.controls = newGroup.controls.map(c => {
        const oldIndex = oldControlNames.indexOf(c.name);
        if (oldIndex == -1) {
            return c
        } else {
            return oldGroup.controls[oldIndex]
        }
    });

    return newGroup
}
