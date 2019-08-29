import {actions} from "../../app/store/baseline/actions";

const fs = require("fs");
import FormData from "form-data"

describe("Baseline actions", () => {

    afterEach(() => {
        fs.unlinkSync("Malawi_1.pjnz")
    });

    it("can upload PJNZ file upload", async () => {
        const commit = jest.fn();
        fs.writeFile("Malawi_1.pjnz");
        const file = fs.createReadStream("Malawi_1.pjnz");
        const formData = new FormData();
        formData.append('file', file);
        await actions._uploadPJNZ(commit, formData);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "PJNZUploaded",
            payload: {data: {country: "Malawi"}, filename: "Malawi_1.pjnz", type: "pjnz"}
        });
    });

    it("can get baseline data", async () => {

        const commit = jest.fn();
        await actions.getBaselineData({commit} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "BaselineDataLoaded",
            payload: {pjnz: null}
        });
    });


});
