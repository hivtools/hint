import {
    constructUploadFile,
    constructUploadFileWithResourceName,
    extractFilenameFrom,
    flattenOptions,
    flattenOptionsIdsByHierarchy,
    flattenToIdSet,
    formatDateTime,
    formatToLocalISODateTime,
    freezer,
    getFilenameFromImportUrl,
    parseAndFillForm,
    rawDeepClone,
    readStream,
    rootOptionChildren,
    validateEmail,
    versionLabel
} from "../app/utils";
import type {NestedFilterOption} from "../app/generated";
import type {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-next-dynamic-form";
import {AxiosHeaders, type AxiosResponse} from "axios";
import {computed, isProxy, reactive} from "vue";

describe("utils", () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    const file = new Blob(["data"], {type: "application/octet-stream"});

    const mockAxiosResponse: AxiosResponse = {
        data: file,
        headers: {"content-disposition": "attachment; filename=test.html"},
        status: 200,
        config: {headers: new AxiosHeaders()},
        statusText: ""
    }

    it("it can read and download blob content", () => {
        const mObjectURL = "blob:https://naomi.unaids.org/download/test";
        window.URL.createObjectURL = vi.fn().mockReturnValueOnce(mObjectURL);
        window.URL.revokeObjectURL = vi.fn();
        document.body.appendChild = vi.fn()

        const mockClick = vi.fn()
        const mockHref = vi.fn()
        const mockAttr = vi.fn()

        document.createElement = vi.fn().mockImplementation(() => {
            return {
                setAttribute: mockAttr,
                href: mockHref,
                click: mockClick
            }
        })

        //trigger download
        readStream(mockAxiosResponse)

        expect(document.body.appendChild).toBeCalledTimes(1)
        expect(window.URL.createObjectURL).toBeCalledTimes(1)
        expect(window.URL.createObjectURL).toBeCalledWith(new Blob(["data"]))

        //releases object Url from memory
        expect(window.URL.revokeObjectURL).toBeCalledTimes(1)
        expect(window.URL.revokeObjectURL).toBeCalledWith(mObjectURL)

        expect(document.createElement).toBeCalledTimes(1)

        //download link contains correct attributes
        expect(mockAttr).toBeCalledTimes(1)
        expect(mockAttr).toHaveBeenCalledWith("download", "test.html")

        //download link has been called
        expect(mockClick).toBeCalledTimes(1)
    })

    it("can extract file name from content-disposition", () => {
        const contentDisposition = 'attachment; filename="MWI_comparison-report_20221116-1328.html"'
        const filename = extractFilenameFrom(contentDisposition)
        expect(filename).toBe("MWI_comparison-report_20221116-1328.html")
    })

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

    it("deep clones nested reactive state", () => {
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
        const proxyState = reactive({wrapper: structuredClone(data)});
        expect(isProxy(proxyState.wrapper.child)).toBe(true);

        const proxyCopy = rawDeepClone(proxyState.wrapper);
        expect(proxyCopy).toStrictEqual(data);
        expect(isProxy(proxyCopy)).toBe(false);
        expect(isProxy(proxyCopy.child)).toBe(false);
        expect(isProxy(proxyCopy.items[3])).toBe(false);

        proxyCopy.child.items.push("six");
        expect(proxyState.wrapper.child.items).toStrictEqual([4, null, "five"]);
    });

    it("deep clones primitive values and null", () => {
        expect(rawDeepClone(null)).toBe(null);
        expect(rawDeepClone(undefined)).toBe(undefined);
        expect(rawDeepClone(3)).toBe(3);
        expect(rawDeepClone("text")).toBe("text");
        expect(rawDeepClone(false)).toBe(false);
    });

    it("deep clones Date, Map and Set", () => {
        const data = {
            date: new Date("2026-01-02T03:04:05Z"),
            map: new Map<string, { n: number }>([["a", {n: 1}]]),
            set: new Set([1, 2])
        };

        const copy = rawDeepClone(data);
        expect(copy).toStrictEqual(data);
        expect(copy.date).toBeInstanceOf(Date);
        expect(copy.date).not.toBe(data.date);
        expect(copy.map).toBeInstanceOf(Map);
        expect(copy.map.get("a")).not.toBe(data.map.get("a"));
        expect(copy.set).toBeInstanceOf(Set);

        copy.date.setFullYear(2000);
        copy.map.get("a")!.n = 99;
        copy.set.add(3);
        expect(data.date.toISOString()).toBe("2026-01-02T03:04:05.000Z");
        expect(data.map.get("a")!.n).toBe(1);
        expect([...data.set]).toStrictEqual([1, 2]);
    });

    it("deep clones a reactive Map and Set with reactive values", () => {
        const state = reactive({
            nested: {items: [{x: 1}]},
            map: new Map<string, any>(),
            set: new Set<any>()
        });
        state.map.set("nested", state.nested);
        state.map.set("spread", {...state.nested});
        state.set.add(state.nested);
        expect(isProxy(state.map)).toBe(true);

        const copy = rawDeepClone(state);
        expect(isProxy(copy.map)).toBe(false);
        expect(isProxy(copy.set)).toBe(false);
        expect(copy.map.get("nested")).toStrictEqual({items: [{x: 1}]});
        expect(isProxy(copy.map.get("nested"))).toBe(false);
        expect(isProxy(copy.map.get("spread").items)).toBe(false);
        expect([...copy.set]).toStrictEqual([{items: [{x: 1}]}]);

        copy.map.get("nested").items[0].x = 99;
        expect(state.nested.items[0].x).toBe(1);
    });

    it("deep clones other built-in types with structuredClone", () => {
        const data = {pattern: /a+b/gi, bytes: new Uint8Array([1, 2, 3])};
        const copy = rawDeepClone(data);
        expect(copy.pattern).toBeInstanceOf(RegExp);
        expect(copy.pattern.source).toBe("a+b");
        expect(copy.pattern.flags).toBe("gi");
        expect([...copy.bytes]).toStrictEqual([1, 2, 3]);
        expect(copy.bytes).not.toBe(data.bytes);
    });

    it("deep clone of reactive state is not tracked by a computed", () => {
        // This is why rawDeepClone is only for actions and mutations.
        const state = reactive({x: {y: 1}});
        const y = computed(() => rawDeepClone(state.x).y);
        expect(y.value).toBe(1);
        state.x.y = 2;
        expect(y.value).toBe(1);
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

    it("can flatten options ids by hierarchy", () => {

        const testData: NestedFilterOption[] = [
            {
                id: "1", label: "name1", children: [
                    { id: "1.1", label: "nested1.1", children: [] },
                    { id: "1.2", label: "nested1.2", children: [
                        { id: "1.2.1", label: "nested1.2.1", children: [
                            { id: "1.2.1.1", label: "nested1.2.1.1", children: [] }
                        ] }
                    ] }
                ],
            },
            {
                id: "2", label: "name2", children: [{
                    id: "2.1", label: "nested2.1", children: [
                        { id: "2.1.1", label: "nested2.1.1", children: [] }
                    ]
                }],
            },
            {
                id: "3", label: "name3", children: [],
            },
        ];

        const result = flattenOptionsIdsByHierarchy(testData);
        expect(result).toStrictEqual(["1", "2", "3", "1.1", "1.2", "2.1", "1.2.1", "2.1.1", "1.2.1.1" ]);
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

    it("can format ISO datetime as local semi-iso friendly string ", () => {
        const isoUTCString = "2022-06-30T15:23:39.280Z";

        const millis = Date.UTC(2022, 6, 30, 15, 23, 39, 898);
        const d = new Date(millis);

        const expected = `2022/06/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:39`;

        const result = formatToLocalISODateTime(isoUTCString);

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

    it("parseAndFillForm writes options into form metadata as expected", () => {
        const options: DynamicFormData = {
            "control-1": 1,
            "control-2": 2,
            "control-3": 3,
            "control-4": 4
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
                                    type: "multiselect",
                                    required: false,
                                    options: [
                                        {id: "50", label: "50"},
                                        {id: "60", label: "60"}
                                    ],
                                    value: ["50", "60"]
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
        // Empty options array is added if missing for select or multiselect control
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
                                    options: [],
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
                                    options: [],
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
                                    options: [],
                                    value: 4
                                },
                                {
                                    name: "control-5",
                                    type: "multiselect",
                                    required: false,
                                    options: [
                                        {id: "50", label: "50"},
                                        {id: "60", label: "60"}
                                    ],
                                    value: ["50", "60"]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        parseAndFillForm(options, newForm);
        expect(newForm).toStrictEqual(expectedResult);
    });

    it("parseAndFillForm writes options and value where missing", () => {
        const newForm = {
            controlSections:[
                {
                    label: "section",
                    controlGroups: [
                        {
                            label: "group",
                            controls: [
                                {
                                    name: "control-1",
                                    type: "multiselect",
                                    required: false,
                                    value: ""
                                },
                                {
                                    name: "control-2",
                                    type: "select",
                                    required: false,
                                    value: ""
                                }
                            ]
                        }
                    ]
                }
            ]
        } as any;

        const expectedResult: DynamicFormMeta = {
            controlSections:[
                {
                    label: "section",
                    controlGroups: [
                        {
                            label: "group",
                            controls: [
                                {
                                    name: "control-1",
                                    type: "multiselect",
                                    required: false,
                                    options: [],
                                    value: []
                                },
                                {
                                    name: "control-2",
                                    type: "select",
                                    required: false,
                                    options: [],
                                    value: ""
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        parseAndFillForm({}, newForm);
        expect(newForm).toStrictEqual(expectedResult);
    });
});
