/*
 * Sovereign Messenger — Sprint 3
 * sovereignPolicy.ts — Deployment Policy
 *
 * Values that belong to Product and Security rather than to engineering, held
 * in deployment configuration so a deployment can set them without a code
 * change.
 *
 * Readiness Review decisions #1 and #3 are unresolved:
 *
 *   #1  Read receipt semantics for directive acknowledgement (R-2)
 *       — Product + pilot department
 *   #3  File size limit and permitted file types (R-10)
 *       — Product + Security
 *
 * The defaults below are PROVISIONAL. They exist so the mechanism the PRD
 * requires can be built and exercised; they are not an approved policy and
 * must be confirmed before pilot deployment. Read from `config.json` at
 * runtime, so confirming them is a configuration change.
 */

/** Where a deployment declares its own policy, under `sovereign_policy`. */
interface PolicyDocument {
    files?: {
        max_bytes?: number;
        allowed_mime_types?: string[];
        allowed_extensions?: string[];
    };
    receipts?: {
        acknowledgement?: "read-position" | "explicit";
    };
    search?: {
        include_unsearchable_notice?: boolean;
    };
    media?: {
        use_authenticated_endpoint?: boolean;
    };
}

export interface FilePolicy {
    /** FR-28: the maximum size, communicated before upload begins. */
    maxBytes: number;
    /** FR-29: permitted types. Empty means the deployment permits any type. */
    allowedMimeTypes: readonly string[];
    allowedExtensions: readonly string[];
}

export interface ReceiptPolicy {
    /**
     * R-2: what "who has read this directive" means.
     *
     * `read-position` — a recipient has read a directive when their read
     * position has reached or passed it. This is what the platform actually
     * reports, and it is the only semantic that can be honoured without
     * asking recipients to confirm receipt explicitly.
     *
     * `explicit` — a recipient has read it only when they say so. The PRD does
     * not deliver an acknowledgement action in Sprint 3 (GW-2 asks only that
     * the issuer can *view* acknowledgement state), so this option exists for
     * the pilot department to choose and is not yet implementable.
     */
    acknowledgement: "read-position" | "explicit";
}

export interface MediaPolicy {
    /**
     * Which media endpoint the deployment's homeserver serves.
     *
     * Authenticated media (MSC3916, `/_matrix/client/v1/media/...`) arrived in
     * Synapse around v1.111. The deployment pins v1.100.0, which serves only
     * the unauthenticated `/_matrix/media/v3/...` endpoints — requesting the
     * newer one there returns 404 for every download. The SDK does not check
     * server support and states that doing so is the caller's responsibility.
     *
     * Default follows the pinned server. Upgrading Synapse is then a
     * configuration change here, not a code change.
     */
    useAuthenticatedEndpoint: boolean;
}

export interface SearchPolicy {
    /**
     * R-4: server-side search cannot index content the server cannot read.
     * When true the results surface states that limitation rather than
     * letting a user believe the result set is complete (SR-10).
     */
    includeUnsearchableNotice: boolean;
}

/*
 * PROVISIONAL DEFAULTS — pending Readiness Review decisions #1 and #3.
 *
 * 25 MB matches the only file size the PRD names anywhere: PERF-11 measures
 * "upload of a 25 MB file". It is a reasonable starting point, not an approved
 * limit.
 *
 * The type list covers the document and image formats a Tergov investigator
 * exchanges — case documents, scans, and photographs. Executable and script
 * formats are absent deliberately: an allow-list is the safe shape for a
 * government deployment, so an unlisted type is refused rather than admitted.
 */
const PROVISIONAL: Required<PolicyDocument> = {
    files: {
        max_bytes: 25 * 1024 * 1024,
        allowed_mime_types: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
        ],
        allowed_extensions: [
            "jpg", "jpeg", "png", "gif", "webp",
            "pdf", "doc", "docx", "xls", "xlsx", "txt",
        ],
    },
    receipts: { acknowledgement: "read-position" },
    search: { include_unsearchable_notice: true },
    media: { use_authenticated_endpoint: false },
};

let document: PolicyDocument | null = null;

/**
 * Applies the deployment's policy document, as read from configuration.
 * Anything the deployment does not declare keeps its provisional default.
 */
export function applyPolicy(policy: PolicyDocument | undefined | null): void {
    document = policy ?? null;
}

export function getFilePolicy(): FilePolicy {
    const files = document?.files;
    return {
        maxBytes:
            typeof files?.max_bytes === "number" && files.max_bytes > 0
                ? files.max_bytes
                : PROVISIONAL.files.max_bytes!,
        allowedMimeTypes: files?.allowed_mime_types ?? PROVISIONAL.files.allowed_mime_types!,
        allowedExtensions: files?.allowed_extensions ?? PROVISIONAL.files.allowed_extensions!,
    };
}

export function getReceiptPolicy(): ReceiptPolicy {
    return {
        acknowledgement:
            document?.receipts?.acknowledgement ?? PROVISIONAL.receipts.acknowledgement!,
    };
}

export function getMediaPolicy(): MediaPolicy {
    return {
        useAuthenticatedEndpoint:
            document?.media?.use_authenticated_endpoint ??
            PROVISIONAL.media.use_authenticated_endpoint!,
    };
}

export function getSearchPolicy(): SearchPolicy {
    return {
        includeUnsearchableNotice:
            document?.search?.include_unsearchable_notice ??
            PROVISIONAL.search.include_unsearchable_notice!,
    };
}

/** True while a value is still the provisional default rather than declared. */
export function isProvisional(area: keyof PolicyDocument): boolean {
    return document?.[area] === undefined;
}
