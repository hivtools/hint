import { ActionContext } from "vuex";
import { DownloadResultsState } from "./downloadResults";
import { RootState } from "../../root";
import { switches } from "../../featureSwitches";

export enum DownloadType {
    SPECTRUM = "Spectrum",
    COARSE = "CoarseOutput",
    SUMMARY = "Summary",
    COMPARISON = "Comparison",
}

// switches to control which buttons are shown in download page
export const downloadSwitches = {
    [DownloadType.SPECTRUM]: true,
    [DownloadType.COARSE]: true,
    [DownloadType.SUMMARY]: true,
    [DownloadType.COMPARISON]: switches.comparisonOutput,
};

// function to get translation key from the type
export const getDownloadTranslationKey = (type: DownloadType) => `${type}Download` as const;

// post to this url with this body to download files
type PostObject = {
    url: (store: ActionContext<DownloadResultsState, RootState>) => string,
    body: (store: ActionContext<DownloadResultsState, RootState>) => object | string | number | boolean | null
};
export const downloadPostConfig: Record<DownloadType, PostObject> = {
    [DownloadType.SPECTRUM]: {
        url: (store) => `download/submit/spectrum/${store.rootState.modelCalibrate.calibrateId}`,
        body: (store) => store.rootGetters.projectState
    },
    [DownloadType.COARSE]: {
        url: (store) => `download/submit/coarse-output/${store.rootState.modelCalibrate.calibrateId}`,
        body: () => ({})
    },
    [DownloadType.SUMMARY]: {
        url: (store) => `download/submit/summary/${store.rootState.modelCalibrate.calibrateId}`,
        body: () => ({})
    },
    [DownloadType.COMPARISON]: {
        url: (store) => `download/submit/comparison/${store.rootState.modelCalibrate.calibrateId}`,
        body: () => ({})
    },
} as const;

// enum defining UI download status states
export enum TaskStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETE = "COMPLETE",
    ERROR = "ERROR",
    UNKNOWN = "UNKNOWN"
}

// vue feather icon type and color for each status state
type IconConfig = { icon: string, color: string }
export const statusUIConfigs: Record<TaskStatus, IconConfig> = {
    [TaskStatus.PENDING]: { icon: "clock", color: "#bba22e" },
    [TaskStatus.RUNNING]: { icon: "server", color: "#2d0a9d" },
    [TaskStatus.COMPLETE]: { icon: "check-circle", color: "darkgreen" },
    [TaskStatus.ERROR]: { icon: "alert-octagon", color: "darkred" },
    [TaskStatus.UNKNOWN]: { icon: "alert-triangle", color: "darkorange" },
};

// vue feather icon type, color and text underneath icon for
// file type UI
type FileType = { icon: string, color: string, text: string }
export const fileTypeUIConfigs: Record<DownloadType, FileType> = {
    [DownloadType.SPECTRUM]: { icon: "folder", color: "#0400b9", text: "pjnz" },
    [DownloadType.COARSE]: { icon: "table", color: "#088501", text: "csv" },
    [DownloadType.SUMMARY]: { icon: "code", color: "#b0090a", text: "html" },
    [DownloadType.COMPARISON]: { icon: "code", color: "#b0090a", text: "html" }
};
