import {actions} from "../../app/store/adr/actions";
import {login, rootState} from "./integrationTest";
import {ADRMutation} from "../../app/store/adr/mutations";
import type {ADRSchemas} from "../../app/types";

describe("ADR non-dataset actions", () => {

    beforeAll(async () => {
        await login();
    });

    it("can fetch ADR schemas", async () => {
        const commit = vi.fn();
        await actions.getSchemas({commit, rootState} as any);

        expect(commit.mock.calls[0][0]["type"]).toBe(ADRMutation.SetSchemas);
        const payload = commit.mock.calls[0][0]["payload"] as ADRSchemas;
        expect(payload.baseUrl).toBe("https://dev.adr.fjelltopp.org/")
    });
});
