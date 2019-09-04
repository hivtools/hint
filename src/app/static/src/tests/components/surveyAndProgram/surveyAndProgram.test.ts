import {testUploadComponent} from "./fileUploads";

describe("Survey and program component", () => {

    testUploadComponent("survey", 0);
    testUploadComponent("program", 1);
    testUploadComponent("anc", 2);
});

