import {makeDownloadableContent, verifyDownloadableContent} from "../app/utils";

describe("utils", () => {

    it("can make and verify downloadable content", () => {
        const test = "test";
        const content = makeDownloadableContent(test);

        const resultData = JSON.parse(content);
        expect(resultData[1]).toBe(test);

        const valid = verifyDownloadableContent(content);
        expect(valid).toBe(true);
    });

    it("does not verify corrupted downloadable content", () => {
        const test = "test";
        const content = makeDownloadableContent(test);
        const resultData = JSON.parse(content);
        const corruptedContent = JSON.stringify([resultData[0], "corrupted"]);

        const valid = verifyDownloadableContent(corruptedContent);
        expect(valid).toBe(false);
    });

});
