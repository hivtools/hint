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
