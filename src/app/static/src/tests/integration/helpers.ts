import fs from "node:fs";
import NodeFormData from "form-data";

// The app code takes a browser FormData. In Node.js, the tests use the FormData of the form-data package.
export function getFormData(fileName: string): FormData {
    const file = fs.createReadStream(`../testdata/${fileName}`);
    const formData: any = new NodeFormData();
    formData.append('file', file);
    formData.get = (name: string) => {
        return name == 'file' ? File : null
    };
    return formData
}
