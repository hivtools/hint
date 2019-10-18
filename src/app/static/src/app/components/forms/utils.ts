import Vue from "vue";
import {DynamicFormData, DynamicFormMeta} from "./types";

export const updateSelectedValues = (formMeta: DynamicFormMeta, newValues: DynamicFormData): DynamicFormMeta => {

    formMeta.controlSections.map(s => {
        s.controlGroups.map(g => {
            g.controls.map(c => {
                if (c.type == "multiselect" && newValues[c.name]){
                    c.default = (newValues[c.name] as string[]).join(",")
                }
                else {
                    c.default = newValues[c.name] || c.default
                }
            })
        })
    });

    return formMeta;
};

export const DynamicFormEventBus = new Vue();
