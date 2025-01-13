import { createReadStream } from "node:fs";
import FormDataClass from "form-data";

export function getFormData(fileName: string): FormData {
    const file = createReadStream(`./testdata/${fileName}`);
    const formData = new FormDataClass();
    formData.append('file', file);
    (formData as any).get = (name: string) => {
        return name == 'file' ? File : null
    };
    return formData as unknown as FormData
}
