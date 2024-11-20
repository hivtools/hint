import { ActionContext } from "vuex";
import { DownloadResultsState } from "./downloadResults";
import { RootState } from "../../root";
import { switches } from "../../featureSwitches";

export enum DownloadType {
    SPECTRUM = "Spectrum",
    COARSE = "CoarseOutput",
    SUMMARY = "Summary",
    COMPARISON = "Comparison",
    AGYW = "AGYW",
}

// switches to control which buttons are shown in download page
export const downloadSwitches = {
    [DownloadType.SPECTRUM]: true,
    [DownloadType.COARSE]: true,
    [DownloadType.SUMMARY]: true,
    [DownloadType.COMPARISON]: switches.comparisonOutput,
    [DownloadType.AGYW]: switches.agywDownload,
};

// we do posts to /download/submit/<url>/<calibrate-id> with the body function called
type PostObject = { url: string, body: (store: ActionContext<DownloadResultsState, RootState>) => object };
export const downloadTypePrepareUrls: Record<DownloadType, PostObject> = {
    [DownloadType.SPECTRUM]: { url: "spectrum", body: (store) => store.rootGetters.projectState },
    [DownloadType.COARSE]: { url: "coarse-output", body: () => ({}) },
    [DownloadType.SUMMARY]: { url: "summary", body: () => ({}) },
    [DownloadType.COMPARISON]: { url: "comparison", body: () => ({}) },
    [DownloadType.AGYW]: { url: "agyw", body: () => ({}) }
} as const;
