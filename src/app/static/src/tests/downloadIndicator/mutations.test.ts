import {DownloadIndicatorMutation, mutations} from "../../app/store/downloadIndicator/mutations";

describe('download indicator mutations', function () {
    it("sets downloading indicator started", () => {
        const state = {downloadingIndicator: false}
        mutations[DownloadIndicatorMutation.DownloadingIndicator](state,  true);
        expect(state.downloadingIndicator).toBe(true);
    });
});