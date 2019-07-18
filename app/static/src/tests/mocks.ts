import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import {initialBaselineState} from "../app/store/baseline/baseline";
import {BaselineState} from "../app/types";

export const mockAxios = new MockAdapter(axios);

export const mockBaselineState = (props?: Partial<BaselineState>) => {
    return {
        ...initialBaselineState,
        ...props
    }
};

export const mockFile = (filename: string, type: string = "text/csv"): File => {
    return new File([new ArrayBuffer(10)], filename, {
        type: type,
        lastModified: 1
    });
};

export const mockFileList = (filename: string, type: string = "text/csv"): FileList => {
    const file = mockFile(filename, type);
    const fileList = new FileList();
    fileList[0] = file;
    return fileList;
};
