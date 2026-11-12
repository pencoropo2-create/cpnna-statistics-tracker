import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AccessSummary {
    status: AccessRequestStatus;
    isApproved: boolean;
    isAdmin: boolean;
}
export interface AuditAlert {
    day: WeekDay;
    format1Total: bigint;
    format2Total: bigint;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface DemographicCount {
    day: WeekDay;
    ageRange: AgeRange;
    count: bigint;
    gender: Gender;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface IndicatorCount {
    day: WeekDay;
    count: bigint;
    indicator: ManagementIndicator;
}
export interface InviteInfo {
    expiresAt?: Time;
    revoked: boolean;
    code: string;
    name: string;
    createdAt: Time;
    createdBy: Principal;
    redemptions: Array<Redemption>;
    maxUses?: bigint;
}
export interface Redemption {
    at: Time;
    user: Principal;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type SendReportResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export type Time = bigint;
export type Timestamp = bigint;
export interface Tramite {
    id: TramiteId;
    order: bigint;
    code: string;
    name: string;
    category: TramiteCategory;
}
export interface TramiteCount {
    day: WeekDay;
    tramiteId: TramiteId;
    count: bigint;
}
export type TramiteId = bigint;
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type WeekId = bigint;
export interface WeekInput {
    tramiteCounts: Array<TramiteCount>;
    indicatorCounts: Array<IndicatorCount>;
    demographics: Array<DemographicCount>;
    startDate: string;
}
export interface WeekRecord {
    id: WeekId;
    owner: Principal;
    createdAt: Timestamp;
    tramiteCounts: Array<TramiteCount>;
    updatedAt: Timestamp;
    indicatorCounts: Array<IndicatorCount>;
    demographics: Array<DemographicCount>;
    startDate: string;
}
export interface WeekSummary {
    id: WeekId;
    totalTramites: bigint;
    updatedAt: Timestamp;
    hasDiscrepancy: boolean;
    totalUsuarios: bigint;
    startDate: string;
}
export interface WeekTotals {
    perTramite: Array<[TramiteId, bigint]>;
    perAgeRange: Array<[AgeRange, bigint]>;
    perDayUsuarios: Array<[WeekDay, bigint]>;
    totalDemografico: bigint;
    totalTramites: bigint;
    hasDiscrepancy: boolean;
    perDayTramites: Array<[WeekDay, bigint]>;
    totalUsuarios: bigint;
}
export enum AccessRequestStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum AgeRange {
    adulto18mas = "adulto18mas",
    adolescente14a17 = "adolescente14a17",
    nino0a5 = "nino0a5",
    nino6a11 = "nino6a11",
    nino12a13 = "nino12a13"
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum Gender {
    femenino = "femenino",
    masculino = "masculino"
}
export enum InviteStatus {
    revoked = "revoked",
    expired = "expired",
    valid = "valid",
    invalid = "invalid",
    usedUp = "usedUp"
}
export enum ManagementIndicator {
    seguimientoCausa = "seguimientoCausa",
    expedientesAperturados = "expedientesAperturados",
    entrevistas = "entrevistas"
}
export enum RedeemResult {
    revoked = "revoked",
    expired = "expired",
    invalid = "invalid",
    usedUp = "usedUp",
    blocked = "blocked",
    joined = "joined",
    alreadyMember = "alreadyMember"
}
export enum TramiteCategory {
    remision = "remision",
    psicologia = "psicologia",
    otra = "otra",
    medidaCuidado = "medidaCuidado",
    autorizacionViajeNacional = "autorizacionViajeNacional",
    aperturaCausa = "aperturaCausa",
    medidaResponsabilidad = "medidaResponsabilidad",
    constatacion = "constatacion",
    autorizacionViajeInternacional = "autorizacionViajeInternacional"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WeekDay {
    jueves = "jueves",
    sabado = "sabado",
    lunes = "lunes",
    miercoles = "miercoles",
    viernes = "viernes",
    domingo = "domingo",
    martes = "martes"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkInvite(code: string): Promise<InviteStatus>;
    createInvite(name: string, maxUses: bigint | null, expiresAt: Time | null): Promise<string>;
    /**
     * / Crea una semana estadística nueva para el usuario que la captura.
     */
    createWeek(input: WeekInput): Promise<WeekRecord>;
    /**
     * / Elimina una semana del usuario que la captura.
     */
    deleteWeek(id: WeekId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Devuelve el resumen de acceso del usuario que consulta.
     */
    getAccessSummary(): Promise<AccessSummary>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Lee una semana del usuario que la captura.
     */
    getWeek(id: WeekId): Promise<WeekRecord | null>;
    /**
     * / Devuelve las alertas de auditoría de una semana.
     */
    getWeekAlerts(id: WeekId): Promise<Array<AuditAlert>>;
    /**
     * / Calcula los totales de una semana.
     */
    getWeekTotals(id: WeekId): Promise<WeekTotals | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    /**
     * / Devuelve los indicadores de gestión soportados.
     */
    listIndicators(): Promise<Array<ManagementIndicator>>;
    listInvites(): Promise<Array<InviteInfo>>;
    /**
     * / Devuelve el catálogo completo de trámites y medidas.
     */
    listTramites(): Promise<Array<Tramite>>;
    /**
     * / Lista los resúmenes de las semanas del usuario que la captura.
     */
    listWeeks(): Promise<Array<WeekSummary>>;
    redeemInvite(code: string): Promise<RedeemResult>;
    removeApproval(user: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    revokeInvite(code: string): Promise<void>;
    schema(): Promise<string>;
    /**
     * / Envía el consolidado semanal por correo institucional.
     */
    sendWeekReportEmail(id: WeekId, recipient: string): Promise<SendReportResult>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    /**
     * / Actualiza una semana existente del usuario que la captura.
     */
    updateWeek(id: WeekId, input: WeekInput): Promise<WeekRecord | null>;
}
