import {actions} from "../../app/store/baseline/actions";
import {login} from "./integrationTest";
import {getFormData} from "./helpers";
import {BaselineMutation} from "../../app/store/baseline/mutations";

describe("hintr translations", () => {

    beforeAll(async () => {
        await login();
    });

    it("can get error message back in french", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = {language: "fr"};

        const state = {country: "Malawi"} as any;
        const formData = getFormData("malawi.geojson");

        await actions.uploadPJNZ({commit, state, dispatch, rootState} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe(BaselineMutation.PJNZUploadError);
        expect(commit.mock.calls[1][0]["payload"]["detail"])
            .toBe("Le fichier doit être d'un type PJNZ, zip, mais reçu geojson,geojson,geojson");
    });
});