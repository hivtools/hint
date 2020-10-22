import {
    addCheckSum,
    freezer,
    verifyCheckSum,
    flattenOptions,
    flattenToIdSet,
    formatDateTime,
    validateEmail,
    versionLabel, rootOptionChildren
} from "../app/utils";
import {NestedFilterOption} from "../app/generated";

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

});
