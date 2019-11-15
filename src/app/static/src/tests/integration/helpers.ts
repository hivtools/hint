const fs = require("fs");
const FormData = require("form-data");

export function getFormData(fileName: string): FormData {
    const file = fs.createReadStream(`../testdata/${fileName}`);
    const formData = new FormData();
    formData.append('file', file);
    return formData
}