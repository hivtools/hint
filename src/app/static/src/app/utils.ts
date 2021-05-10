import * as CryptoJS from 'crypto-js';
import {ActionMethod, CustomVue, mapActions, mapGetters, mapMutations, mapState, MutationMethod} from "vuex";
import {ADRSchemas, DatasetResource, Dict, UploadFile, Version} from "./types";
import {Error, FilterOption, NestedFilterOption, Response} from "./generated";
import moment from 'moment';
import {DynamicControlGroup, DynamicControlSection, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";

export type ComputedWithType<T> = () => T;

export const mapStateProp = <S, T>(namespace: string | null, func: (s: S) => T): ComputedWithType<T> => {
    return namespace && (mapState<S>(namespace, {prop: (state) => func(state)}) as Dict<ComputedWithType<T>>)["prop"]
        || (mapState<S>({prop: (state) => func(state)}) as Dict<ComputedWithType<T>>)["prop"]
};

export const mapStatePropByName = <T>(namespace: string | null, name: string): ComputedWithType<T> => {
    return (namespace && mapState(namespace, [name])[name]) || mapState([name])[name]
};

export const mapStateProps = <S, K extends string>(namespace: string,
                                                   map: Dict<(this: CustomVue, state: S) => any>) => {
    type R = { [key in K]: any }
    return mapState<S>(namespace, map) as R
};

export const mapGetterByName = <T>(namespace: string | null, name: string): ComputedWithType<T> => {
    return (namespace && mapGetters(namespace, [name])[name]) || mapGetters([name])[name]
}

export const mapGettersByNames = <K extends string>(namespace: string, names: string[]) => {
    type R = { [key in K]: any }
    return mapGetters(namespace, names) as R
};

export const mapActionByName = <T>(namespace: string | null, name: string): ActionMethod => {
    return (!!namespace && mapActions(namespace, [name])[name]) || mapActions([name])[name]
};

export const mapActionsByNames = <K extends string>(namespace: string | null, names: string[]) => {
    type R = { [key in K]: any }
    return (!!namespace && mapActions(namespace, names) || mapActions(names)) as R
};

export const mapMutationsByNames = <K extends string>(namespace: string, names: string[]) => {
    type R = { [key in K]: any }
    return mapMutations(namespace, names) as R
};

export const mapMutationByName = <T>(namespace: string | null, name: string): MutationMethod => {
    return (!!namespace && mapMutations(namespace, [name])[name]) || mapMutations([name])[name]
};

export const addCheckSum = (data: string): string => {
    const hash = CryptoJS.MD5(data);
    return JSON.stringify([hash.toString(CryptoJS.enc.Base64), data]);
};

export const verifyCheckSum = (content: string): false | any => {
    const result = JSON.parse(content);
    const hash = result[0];
    const data = result[1];
    const valid = CryptoJS.MD5(data).toString(CryptoJS.enc.Base64) === hash;

    return valid && JSON.parse(data);
};

function isHINTError(object: any): object is Error {
    return typeof object.error == "string"
        && object.details == undefined || typeof object.details == "string"
}

export function isHINTResponse(object: any): object is Response {
    return object && (typeof object.status == "string")
        && (Array.isArray(object.errors))
        && typeof object.data == "object"
        && object.errors.every((e: any) => isHINTError(e))
}

export const freezer = {

    deepFreeze: (data: any): any => {
        if (Array.isArray(data)) {
            return Object.freeze(data.map(d => freezer.deepFreeze(d)))
        }
        if (data != null && typeof data === "object") {
            for (const prop in data) {
                if (Object.prototype.hasOwnProperty.call(data, prop)) {
                    data[prop] = freezer.deepFreeze(data[prop])
                }
            }
            return Object.freeze(data);
        }
        return data;
    }
};

export function prefixNamespace(namespace: string, name: any) {
    return `${namespace}/${name}`
}

export function stripNamespace(name: string) {
    const nameArray = name.split("/");
    if (nameArray.length == 1) {
        return ["root", name];
    } else {
        return nameArray;
    }
}

const flattenToIdArray = (filterOption: NestedFilterOption): string[] => {
    let result: string[] = [];
    result.push(filterOption.id);
    if (filterOption.children) {
        filterOption.children.forEach(o =>
            result = [
                ...result,
                ...flattenToIdArray(o as NestedFilterOption)
            ]);

    }
    return result;
};

export const flattenToIdSet = (ids: string[], lookup: Dict<NestedFilterOption>): Set<string> => {
    let result: string[] = [];
    ids.forEach(r =>
        result = [
            ...result,
            ...flattenToIdArray(lookup[r])
        ]);
    return new Set(result);
};

export const flattenOptions = (filterOptions: NestedFilterOption[]): { [k: string]: NestedFilterOption } => {
    let result = {};
    filterOptions.forEach(r =>
        result = {
            ...result,
            ...flattenOption(r)
        });
    return result;
};

const flattenOption = (filterOption: NestedFilterOption): NestedFilterOption => {
    let result = {} as any;
    result[filterOption.id] = filterOption;
    if (filterOption.children) {
        filterOption.children.forEach(o =>
            result = {
                ...result,
                ...flattenOption(o as NestedFilterOption)
            });

    }
    return result;
};

export const rootOptionChildren = (filterOptions: FilterOption[]) => {
    const rootOption = filterOptions[0];
    return (rootOption && (rootOption as any).children) || [];
};

export const formatDateTime = (isoUTCString: string) => {
    return moment.utc(isoUTCString).local().format('DD/MM/YYYY HH:mm:ss');
};

export const findResource = (datasetWithResources: any, resourceType: string, resourceName?: string | null): DatasetResource | null => {
    let resources = datasetWithResources.resources;

    if (resourceName) {
        resources = resources.filter((r: any) => r.name === resourceName);
    }
    const metadata = resources.find((r: any) => r.resource_type === resourceType);
    return metadata ? {
        id: metadata.id,
        name: metadata.name,
        url: metadata.url,
        lastModified: metadata.last_modified,
        metadataModified: metadata.metadata_modified,
        outOfDate: false} : null
};

export const datasetFromMetadata = (id: string, datasets: any[], schemas: ADRSchemas) => {
    const fullMetaData = datasets.find(d => d.id == id);
    return fullMetaData && {
        id: fullMetaData.id,
        title: fullMetaData.title,
        url: `${schemas.baseUrl}${fullMetaData.type}/${fullMetaData.name}`,
        resources: {
            pjnz: findResource(fullMetaData, schemas.pjnz),
            shape: findResource(fullMetaData, schemas.shape),
            pop: findResource(fullMetaData, schemas.population),
            survey: findResource(fullMetaData, schemas.survey),
            program: findResource(fullMetaData, schemas.programme),
            anc: findResource(fullMetaData, schemas.anc)
        },
        organization: {
            id: fullMetaData.organization.id
        }
    }
};

export const constructUploadFile = (datasetWithResources: any, index: number, resourceType: string,
                                 resourceFilename: string, displayName: string): UploadFile | null => {
    const resource = findResource(datasetWithResources, resourceType, null);
    // We expect to find resource name on the resource - return null if not found - file should
    // not be uploadable.
    if (resource) {
        const resourceName = resource.name;
        return getUploadFileFromResource(resource, resourceName, index, resourceType, resourceFilename, displayName);
    } else {
        return null;
    }
};

export const constructUploadFileWithResourceName = (datasetWithResources: any, index: number, resourceType: string,
                             resourceFilename: string, displayName: string, resourceName: string): UploadFile => {
    const resource = findResource(datasetWithResources, resourceType, resourceName);
    return getUploadFileFromResource(resource, resourceName, index, resourceType, resourceFilename, displayName);

};

function getUploadFileFromResource(resource: DatasetResource | null, resourceName: string, index: number,
                                resourceType: string, resourceFilename: string, displayName: string): UploadFile
{
    const resourceId = resource ? resource.id : null;
    const lastModified = resource ? ([resource.lastModified, resource.metadataModified].sort()[1]) : null;
    const resourceUrl = resource ? resource.url : null;

    return {
        index,
        displayName,
        resourceType,
        resourceFilename,
        resourceName,
        resourceId,
        resourceUrl,
        lastModified
    }
}

const emailRegex = RegExp("^([\\w+-.%]+@[\\w.-]+\\.[A-Za-z]{2,4})(,[\\w+-.%]+@[\\w.-]+\\.[A-Za-z]{2,4})*$")

export const validateEmail = (test: string): boolean => {
    return emailRegex.test(test.replace(/\s*/g, ""))
}

export const versionLabel = (version: Version) => `v${version.versionNumber}`;

export const updateForm = (oldForm: DynamicFormMeta, newForm: DynamicFormMeta): DynamicFormMeta => {
    const oldSectionLabels = oldForm.controlSections.map(c => c.label);

    newForm.controlSections = newForm.controlSections.map(s => {
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

    return newSection
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

export function getFilenameFromImportUrl(url: string) {
    const parts = url.split("/");
    return parts[parts.length - 1];
}

export function getFilenameFromUploadFormData(formdata: FormData) {
    const file = formdata.get("file");
    return (file as File).name;
}
