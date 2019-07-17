export interface BaselineState {
    hasError: boolean
    country: string
    complete: boolean
}

export interface RootState {
    version: string;
    baseline: BaselineState
}

export interface PJNZ {
    country: string
}

export interface ErrorInfo {
    message: string
    code: string
}

export interface Result {
    errors: ErrorInfo[]
    status: "success" | "failure"
    data: any
}

export interface APIResponse {
    data: Result
}
