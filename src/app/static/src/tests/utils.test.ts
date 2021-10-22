import {
    addCheckSum,
    freezer,
    verifyCheckSum,
    flattenOptions,
    flattenToIdSet,
    formatDateTime,
    validateEmail,
    versionLabel,
    rootOptionChildren,
    constructUploadFile,
    constructUploadFileWithResourceName,
    getFilenameFromImportUrl,
    updateForm
} from "../app/utils";
import {NestedFilterOption} from "../app/generated";
import {DynamicFormMeta} from "@reside-ic/vue-dynamic-form";

describe("utils", () => {

    it("can make and verify downloadable content", () => {
        const test = {
            something: 120,
            another: {
                prop: "test"
            }
        };

        const content = addCheckSum(JSON.stringify(test));

        const resultData = JSON.parse(content);
        expect(JSON.parse(resultData[1])).toStrictEqual(test);

        const result = verifyCheckSum(content);
        expect(result).toStrictEqual(test);
    });

    it("does not verify corrupted downloadable content", () => {
        const test = "test";
        const content = addCheckSum(test);
        const resultData = JSON.parse(content);
        const corruptedContent = JSON.stringify([resultData[0], "corrupted"]);

        const result = verifyCheckSum(corruptedContent);
        expect(result).toBe(false);
    });

    it("deep freezes an object", () => {

        const data = {
            nothing: null,
            time: 10,
            name: "hello",
            items: [1, null, "three", {label: "l1"}],
            child: {
                name: "child",
                items: [4, null, "five"]
            }
        };

        const frozen = freezer.deepFreeze({...data});
        expect(frozen).toStrictEqual(data);
        expect(Object.isFrozen(frozen)).toBe(true);
        expect(Object.isFrozen(frozen.items)).toBe(true);
        expect(Object.isFrozen(frozen.child)).toBe(true);
        expect(Object.isFrozen(frozen.child.items)).toBe(true);
    });

    it("deep freezes an array", () => {

        const data = [{id: 1}, {child: {id: 2}}, 1, "hi"];

        const frozen = freezer.deepFreeze([...data]);
        expect(frozen).toStrictEqual(data);
        expect(Object.isFrozen(frozen[0])).toBe(true);
        expect(Object.isFrozen(frozen[1].child)).toBe(true);
    });

    it("can flatten options", () => {

        const testData: NestedFilterOption[] = [
            {
                id: "1", label: "name1", children: [{
                    id: "2", label: "nested", children: []
                }]
            }
        ];

        const result = flattenOptions(testData);
        expect(result["1"]).toStrictEqual(testData[0]);
        expect(result["2"]).toStrictEqual({id: "2", label: "nested", children: []});
    });

    it("flatten ids returns set of selected ids", () => {

        const dict = {
            "1": {
                id: "1",
                label: "l1",
                children:
                    [{
                        id: "2",
                        label: "l2",
                        children: [{
                            id: "3",
                            label: "l3"
                        }]
                    }]
            },
            "2": {
                id: "2",
                label: "l2",
                children: [{
                    id: "3",
                    label: "l3"
                }]
            },
            "3": {
                id: "3",
                label: "l3"
            },
            "4": {
                id: "3",
                label: "l3"
            }
        };


        const result = flattenToIdSet(["1"], dict);
        expect(result).toStrictEqual(new Set(["1", "2", "3"]));
    });

    it("rootOptionChildren returns expected filter options", () => {
        const regionOptions = [
            {id: "region1", label: "Region 1"},
            {id: "region2", label: "Region 2"}
        ];

        const options = [{id: "country", label: "Country", children: regionOptions}];

        const result = rootOptionChildren(options);
        expect(result).toStrictEqual(regionOptions);
    });

    it("can format utc datetime as local friendly string", () => {
        const isoUTCString = "2020-07-30T15:23:39.898939";

        const millis = Date.UTC(2020, 7, 30, 15, 23, 39, 898);
        const d = new Date(millis);
        const expected = `${d.getDate()}/07/2020 ${d.getHours()}:${d.getMinutes()}:39`;

        const result = formatDateTime(isoUTCString);

        expect(result).toStrictEqual(expected);
    });

    it("single email addresses are valid", () => {
        let test = "email@gmail.com"
        expect(validateEmail(test)).toBe(true);

        test = "email.lastname@imperial.ac.uk"
        expect(validateEmail(test)).toBe(true);

        test = "email_12346@gmail.com"
        expect(validateEmail(test)).toBe(true);
    });

    it("bad email addresses are invalid", () => {
        const test = "emailgmail.com"
        expect(validateEmail(test)).toBe(false);
    });

    it("comma separated email addresses are valid", () => {
        const test = "email@gmail.com , another@imperial.org,   someone.1234@hotmaol.com,someone@hotmail.com"
        expect(validateEmail(test)).toBe(true);
    });

    it("space separated email addresses are invalid", () => {
        const test = "email@gmail.com , another@imperial.org someone.1234@hotmaol.com,someone@hotmail.com"
        expect(validateEmail(test)).toBe(false);
    });

    it("can get version label", () => {
        const version = {id: "testVersionId", versionNumber: 9, created: "24/09/20", updated: "24/09/20"};
        expect(versionLabel(version)).toBe("v9");
    });

    it("can construct upload file where resource exists", () => {
        const datasetWithResources = {
            resources: [
                {
                    resource_type: "other-type",
                    id: "456",
                    last_modified: "2021-02-01",
                    metadata_modified: "2021-01-28",
                    url: "http://other",
                    name: "Other Resource"
                },
                {
                    resource_type: "test-type",
                    id: "123",
                    name: "Test Resource",
                    last_modified: "2021-03-01",
                    metadata_modified: "2021-02-28",
                    url: "http://test",
                }
            ]
        };
        const result = constructUploadFileWithResourceName(datasetWithResources, 0,"test-type", "test.txt", "displayTest", "Potential Name");
        expect(result).toStrictEqual({
            index: 0,
            displayName: "displayTest",
            resourceType: "test-type",
            resourceFilename: "test.txt",
            resourceId: "123",
            lastModified: "2021-03-01",
            resourceUrl: "http://test",
            resourceName: "Test Resource"
        });
    });

    it("can construct upload file where resource does not exist", () => {
        const datasetWithResources = {resources: []};
        const result = constructUploadFileWithResourceName(datasetWithResources, 0, "test-type", "test.txt", "displayTest", "Test Resource");
        expect(result).toStrictEqual({
            index: 0,
            displayName: "displayTest",
            resourceType: "test-type",
            resourceFilename: "test.txt",
            resourceId: null,
            lastModified: null,
            resourceUrl: null,
            resourceName: "Test Resource"
        });
    });

    it("can construct upload file without resource name when resource already exists", () => {
        //Name not provided, so will match on type only
        const datasetWithResources = {
            resources: [
                {
                    resource_type: "other-type",
                    id: "456",
                    last_modified: "2021-02-01",
                    metadata_modified: "2021-01-28",
                    url: "http://other",
                    name: "Other Resource"
                },
                {
                    resource_type: "test-type",
                    id: "456",
                    name: "Test Resource",
                    last_modified: "2021-03-01",
                    metadata_modified: "2021-02-28",
                    url: "http://test2"
                }
            ]
        };
        const result = constructUploadFile(datasetWithResources, 0, "test-type", "test.txt", "displayTest");
        expect(result).toStrictEqual({
            index: 0,
            displayName: "displayTest",
            resourceType: "test-type",
            resourceFilename: "test.txt",
            resourceId: "456",
            lastModified: "2021-03-01",
            resourceUrl: "http://test2",
            resourceName: "Test Resource"
        });
    });

    it("constructUploadFile returns null if resource name not provided and resource does not exist", () => {
        const datasetWithResources = {resources: []};
        const result = constructUploadFile(datasetWithResources, 0, "test-type", "test.txt", "displayTest");
        expect(result).toBeNull();
    });

    it("getFilenameFromImportUrl interprets URL without query string", () => {
        expect(getFilenameFromImportUrl("http://a/b.csv")).toBe("b.csv");
    });

    it("getFilenameFromImportUrl interprets URL with query string", () => {
        expect(getFilenameFromImportUrl("http://a/b.csv?c=d")).toBe("b.csv");
    });

    it("updateForm merges old and new form metadata as expected", () => {
        const oldForm: DynamicFormMeta = {
            controlSections:[
                {
                    label: "old-section-1",
                    controlGroups: [
                        {
                            label: "old-group-1-1",
                            controls: [
                                {
                                    name: "control-1",
                                    type: "number",
                                    required: true,
                                    value: 1
                                },
                                {
                                    name: "control-2",
                                    type: "select",
                                    required: true,
                                    value: 2
                                }
                            ]
                        }
                    ]
                },
                {
                    label: "section-2",
                    controlGroups: [
                        {
                            label: "group-2-1",
                            controls: [
                                {
                                    name: "control-3",
                                    type: "number",
                                    required: false,
                                    value: 3
                                }
                            ]
                        },
                        {
                            label: "group-2-2",
                            controls: [
                                {
                                    name: "control-4",
                                    type: "select",
                                    required: false,
                                    value: 4
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        // Changes from oldForm:
        // 1. old-section/group 1 => new-section/group 1
        // 2. remove control-2
        // 3. add control 5 to group-2-1
        // 4. changes to required and type
        // 5. Different values in controls - should be overwritten by old values
        const newForm: DynamicFormMeta = {
            controlSections:[
                {
                    label: "new-section-1",
                    controlGroups: [
                        {
                            label: "new-group-1-1",
                            controls: [
                                {
                                    name: "control-1",
                                    type: "select",
                                    required: false,
                                    value: 10
                                }
                            ]
                        }
                    ]
                },
                {
                    label: "section-2",
                    controlGroups: [
                        {
                            label: "group-2-1",
                            controls: [
                                {
                                    name: "control-3",
                                    type: "select",
                                    required: true,
                                    value: 30
                                }
                            ]
                        },
                        {
                            label: "group-2-2",
                            controls: [
                                {
                                    name: "control-4",
                                    type: "select",
                                    required: true,
                                    value: 40
                                },
                                {
                                    name: "control-5",
                                    type: "select",
                                    required: false,
                                    value: 50
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        // Old values are retained, even if they are in different group/section in new metadata
        // Old values are removed if they are not in new metadata
        // New values are added if they were not previously present
        // New control config (required etc) is used
        const expectedResult = {
            controlSections:[
                {
                    label: "new-section-1",
                    controlGroups: [
                        {
                            label: "new-group-1-1",
                            controls: [
                                {
                                    name: "control-1",
                                    type: "select",
                                    required: false,
                                    value: 1
                                }
                            ]
                        }
                    ]
                },
                {
                    label: "section-2",
                    controlGroups: [
                        {
                            label: "group-2-1",
                            controls: [
                                {
                                    name: "control-3",
                                    type: "select",
                                    required: true,
                                    value: 3
                                }
                            ]
                        },
                        {
                            label: "group-2-2",
                            controls: [
                                {
                                    name: "control-4",
                                    type: "select",
                                    required: true,
                                    value: 4
                                },
                                {
                                    name: "control-5",
                                    type: "select",
                                    required: false,
                                    value: 50
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const result = updateForm(oldForm, newForm);
        expect(result).toStrictEqual(expectedResult);
    });
});
